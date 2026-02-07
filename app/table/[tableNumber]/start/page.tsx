// Server component renders a client form to collect customer's name
import { getTableByNumber } from '@/lib/actions/orders'
import StartOrderClient from './StartOrderClient'

type Props = {
  params: Promise<{ tableNumber: string }>;
};

export default async function StartPage({ params }: Props) {
  try {
    const { tableNumber } = await params;
    
    if (!tableNumber) {
      return <div className="p-6 text-center">Invalid table number</div>;
    }

    const table = await getTableByNumber(tableNumber);

    if (!table) {
      return <div className="p-6 text-center">Table not found</div>;
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
  } catch (error) {
    console.error('Error in StartPage:', error)
    return <div className="p-6 text-center text-destructive">Error loading page. Please try again.</div>;
  }
}
