# Deployment Guide

## Prerequisites

- Supabase account and project
- Vercel account (or your preferred hosting platform)
- GitHub repository (for Vercel deployment)

## Step 1: Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be fully provisioned
3. Note down your project URL and anon key from Settings > API

## Step 2: Run Database Migrations

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
5. Click **Run** to execute the migration
6. Create another query and run `supabase/migrations/002_seed_data.sql`

### Option B: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

## Step 3: Configure Environment Variables

Create a `.env.local` file in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Step 4: Test Locally

```bash
npm install
npm run dev
```

Visit:
- Home: http://localhost:3000
- Admin: http://localhost:3000/admin
- Sample table order: http://localhost:3000/table/10000000-0000-0000-0000-000000000001/order

## Step 5: Deploy to Vercel

### Using Vercel Dashboard

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and sign in
3. Click **Add New Project**
4. Import your GitHub repository
5. Configure environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Click **Deploy**

### Using Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
```

## Step 6: Set Up Cron Job (Optional but Recommended)

To keep your Supabase database active, set up a cron job to ping the keep-alive endpoint.

### Using cron-job.org

1. Go to [cron-job.org](https://cron-job.org)
2. Create a free account
3. Create a new cron job:
   - **URL**: `https://your-domain.vercel.app/api/cron/keep-alive`
   - **Method**: POST
   - **Schedule**: Every 5 minutes
   - **Status**: Active

### Using EasyCron

1. Go to [EasyCron](https://www.easycron.com)
2. Create a new cron job with similar settings

### Using Vercel Cron (Vercel Pro)

If you have Vercel Pro, you can use Vercel Cron:

1. Create `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/keep-alive",
    "schedule": "*/5 * * * *"
  }]
}
```

## Step 7: Generate QR Codes

For each table, generate a QR code pointing to:
```
https://your-domain.vercel.app/table/{table_number}/order
```

You can view and manage tables in the admin dashboard at `/admin/tables`.

You can use any QR code generator:
- [QR Code Generator](https://www.qr-code-generator.com)
- [QRCode Monkey](https://www.qrcode-monkey.com)

Example for Table 1 (using seed data):
```
https://your-domain.vercel.app/table/1/order
```

## Step 8: Configure Row Level Security (RLS) - Optional

For production, you may want to enable RLS on your Supabase tables. However, since this system doesn't use authentication, you can skip this step or configure it based on your needs.

## Troubleshooting

### Database Connection Issues

- Verify your Supabase URL and anon key are correct
- Check that migrations ran successfully
- Ensure your Supabase project is active

### Confirmation Code Generation Fails

- The system has a JavaScript fallback, but if issues persist:
  - Check that the `generate_confirmation_code` function exists in your database
  - Verify the function has proper permissions

### Orders Not Appearing

- Check that the table_id exists in the `tables` table
- Verify the restaurant_id matches
- Check browser console for errors

## Post-Deployment Checklist

- [ ] Database migrations applied successfully
- [ ] Environment variables configured
- [ ] Application deployed and accessible
- [ ] Test order creation from customer view
- [ ] Test order verification in admin dashboard
- [ ] Test menu item availability toggle
- [ ] Cron job configured (if using)
- [ ] QR codes generated for all tables
- [ ] Test discount code application

## Security Notes

- The anon key is safe to expose in client-side code (it's designed for this)
- For production, consider adding:
  - Rate limiting
  - IP-based restrictions for admin routes
  - Authentication for admin access
  - HTTPS enforcement

## Support

For issues, check:
- Supabase logs in your project dashboard
- Vercel deployment logs
- Browser console for client-side errors

