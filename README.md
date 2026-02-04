# Order at Table

A production-ready QR-based ordering system for restaurants that allows customers to scan a QR code at their table and place orders directly from their phone.

## Features

### Customer Features
- ✅ Accessible via QR code at each table
- ✅ View menu categories and items with prices
- ✅ Add and remove items from cart
- ✅ Apply discount codes during order confirmation
- ✅ Receive unique confirmation code after placing order
- ✅ View current order status

### Cashier/Admin Features
- ✅ View all active and pending orders
- ✅ Search and verify orders by confirmation code
- ✅ Approve or reject orders
- ✅ Mark orders as completed
- ✅ Manually disable menu items (out of stock)
- ✅ View orders per table
- ✅ Filter orders by status

## Tech Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **shadcn/ui** (component library)
- **Tailwind CSS**
- **Supabase** (PostgreSQL database)
- **Server Components & Server Actions**

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd order-at-table
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)

2. Run the migrations in order:
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Run `supabase/migrations/001_initial_schema.sql`
   - Run `supabase/migrations/002_seed_data.sql`

Alternatively, you can use the Supabase CLI:
```bash
supabase db push
```

### Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
order-at-table/
├── app/
│   ├── admin/              # Admin dashboard
│   │   ├── page.tsx        # Orders management
│   │   └── menu/           # Menu management
│   ├── api/
│   │   ├── cron/
│   │   │   └── keep-alive/ # Cron endpoint
│   │   └── orders/
│   │       └── verify/     # Order verification API
│   ├── table/
│   │   └── [tableId]/
│   │       └── order/      # Customer order page
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── actions/            # Server actions
│   │   ├── orders.ts
│   │   └── menu.ts
│   ├── supabase/          # Supabase clients
│   │   ├── client.ts
│   │   └── server.ts
│   ├── types.ts           # TypeScript types
│   └── utils.ts
├── supabase/
│   └── migrations/        # Database migrations
│       ├── 001_initial_schema.sql
│       └── 002_seed_data.sql
└── README.md
```

## Database Schema

### Tables

- **restaurants** - Restaurant information
- **tables** - Table information linked to restaurants
- **menu_categories** - Menu category organization
- **menu_items** - Individual menu items
- **orders** - Customer orders
- **order_items** - Items in each order
- **discount_codes** - Discount/promotion codes
- **order_discounts** - Applied discounts to orders
- **inventory** - Simple availability tracking

### Order Status Flow

1. `pending` - Order created but not yet submitted
2. `awaiting_cashier_confirmation` - Order submitted, waiting for cashier
3. `confirmed` - Cashier confirmed payment
4. `completed` - Order fulfilled
5. `cancelled` - Order cancelled

## Usage

### Customer Flow

1. Customer scans QR code at table
2. URL format: `{BASE_URL}/table/{table_number}/order`
3. Customer browses menu, adds items to cart
4. Customer can apply discount code (optional)
5. Customer confirms order
6. System generates unique 6-character confirmation code
7. Customer shows code to cashier for payment

### Admin/Cashier Flow

1. Access admin dashboard at `/admin`
2. View all orders or filter by status
3. Search for order by confirmation code
4. Verify order and confirm payment
5. Mark order as completed when ready
6. Manage menu item availability at `/admin/menu`

## API Endpoints

### POST `/api/cron/keep-alive`
Lightweight endpoint to keep Supabase database active. Can be called by a cron job service.

### POST `/api/orders/verify`
Verify an order by confirmation code.

**Request:**
```json
{
  "confirmationCode": "ABC123"
}
```

**Response:**
```json
{
  "order": {
    "id": "...",
    "confirmation_code": "ABC123",
    "status": "awaiting_cashier_confirmation",
    "total_amount": 25.99,
    ...
  }
}
```

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Setting up Cron Job

To keep the Supabase database active, set up a cron job to call:
```
POST https://your-domain.com/api/cron/keep-alive
```

You can use services like:
- [cron-job.org](https://cron-job.org)
- [EasyCron](https://www.easycron.com)
- Vercel Cron Jobs (if using Vercel Pro)

Recommended frequency: Every 5-10 minutes

## Security Considerations

- Table IDs are validated before displaying menu
- Confirmation codes are unique and randomly generated
- Rate limiting should be implemented for order submissions
- One active order per table at a time
- Discount codes are validated before application

## Sample Data

The seed data includes:
- 1 sample restaurant
- 4 sample tables (Table 1-4)
- 4 menu categories (Appetizers, Main Courses, Desserts, Beverages)
- 12 sample menu items
- 3 sample discount codes:
  - `WELCOME10` - 10% off (reusable)
  - `SAVE5` - $5 off (reusable)
  - `ONETIME20` - 20% off (single-use)

## Limitations

- No online payment processing (cash only)
- No accounting or financial analytics
- No tax calculations
- Simple inventory tracking (availability only)
- No user authentication (can be added for multi-restaurant support)

## Future Enhancements

- User authentication for multi-restaurant support
- Real-time order updates using Supabase Realtime
- Order history for customers
- Analytics dashboard
- Print receipts
- Multi-language support
- Table status management

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
