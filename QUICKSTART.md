# Quick Start Guide

Get your Order at Table system up and running in minutes.

## 1. Install Dependencies

```bash
npm install
```

## 2. Set Up Supabase

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to **SQL Editor** in your Supabase dashboard
4. Run the migrations in order:
   - Copy/paste `supabase/migrations/001_initial_schema.sql` and execute
   - Copy/paste `supabase/migrations/002_seed_data.sql` and execute

## 3. Configure Environment

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

Get these values from: Supabase Dashboard → Settings → API

## 4. Run Development Server

```bash
npm run dev
```

## 5. Test the System

### Customer View
Visit: http://localhost:3000/table/1/order

This uses the seed data table. You can:
- Browse menu items
- Add items to cart
- Apply discount code (try: `WELCOME10`)
- Place an order
- Get a confirmation code

### Admin Dashboard
Visit: http://localhost:3000/admin

You can:
- View all orders
- Search by confirmation code
- Verify and confirm orders
- Mark orders as completed
- Manage menu availability at `/admin/menu`

## Sample Data

The seed data includes:
- **Restaurant**: Sample Restaurant
- **Tables**: Table 1, 2, 3, 4 (accessible via /table/1/order, /table/2/order, etc.)
- **Menu Categories**: Appetizers, Main Courses, Desserts, Beverages
- **Menu Items**: 12 items across categories
- **Discount Codes**:
  - `WELCOME10` - 10% off (reusable)
  - `SAVE5` - $5 off (reusable)
  - `ONETIME20` - 20% off (single-use)

## Next Steps

1. **Customize Menu**: Update menu items in Supabase dashboard
2. **Add Your Tables**: Insert your actual table records
3. **Generate QR Codes**: Create QR codes for each table URL
4. **Deploy**: Follow [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment

## Troubleshooting

**Database connection fails?**
- Check your `.env.local` file has correct values
- Verify migrations ran successfully
- Check Supabase project is active

**Orders not showing?**
- Ensure you're using a valid table_id
- Check browser console for errors
- Verify restaurant_id matches in database

**Confirmation code not generating?**
- Check Supabase function `generate_confirmation_code` exists
- System has JavaScript fallback, should work regardless

## Need Help?

- Check [README.md](./README.md) for full documentation
- Review [DEPLOYMENT.md](./DEPLOYMENT.md) for production setup
- Check Supabase logs in your project dashboard

