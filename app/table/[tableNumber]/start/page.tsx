// Server component renders a client form to collect customer's name
import { getTableByNumber } from '@/lib/actions/orders'
import StartOrderClient from './StartOrderClient'

type Props = {
  params: { tableNumber: string };
};

export default async function StartPage({ params }: Props) {
  const { tableNumber } = await params;
  const table = await getTableByNumber(tableNumber);

  if (!table) {
    return <div className="p-6">Table not found</div>;
  }

  const restaurant = table.restaurants

  return (
    <StartOrderClient
      tableId={table.id}
      tableNumber={table.table_number}
      restaurantName={restaurant?.name || ''}
      restaurantDescription={restaurant?.description || null}
      restaurantCoverImage={restaurant?.cover_image_url || null}
    />
  );
}
