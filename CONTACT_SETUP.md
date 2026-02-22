# QRDer Contact Form Setup

Your contact form is now ready! All the "Start Free Trial", "Get Started", and related buttons now redirect to `/contact` where potential customers can fill out a detailed form.

## 📧 Email Setup Instructions

To receive contact form submissions via email, you need to configure your GoDaddy email settings:

### GoDaddy Email Configuration

1. **Use your existing GoDaddy email account** (no special setup required)
2. **Create `.env.local` file** in your project root:
   ```env
   EMAIL_USER=your-email@yourdomain.com
   EMAIL_PASS=your-godaddy-email-password
   CONTACT_EMAIL=your-email@yourdomain.com
   ```

### SMTP Settings (Pre-configured)

The app is already configured with GoDaddy's SMTP settings:
- **Host**: smtpout.secureserver.net
- **Port**: 465 (SSL) - default
- **Security**: SSL/TLS enabled

### Troubleshooting

If you encounter connection issues, try these alternative GoDaddy ports:
- Port 587 (TLS)
- Port 25 (non-encrypted)
- Port 80 (non-encrypted)

To change ports, update the API route at `/app/api/contact/route.ts`.

## 🚀 What's Included

### Contact Page Features:
- ✅ Professional contact form with restaurant-specific fields
- ✅ Beautiful success/error states
- ✅ Mobile-responsive design
- ✅ Form validation
- ✅ Inquiry type categorization
- ✅ Restaurant type selection
- ✅ Rich HTML email formatting

### Email Features:
- ✅ Professionally formatted HTML emails
- ✅ Includes all form data in organized sections
- ✅ Recommended next steps for each inquiry type
- ✅ Reply-to functionality (customers can be contacted directly)
- ✅ Timestamp and source tracking

### Landing Page Updates:
- ✅ All CTA buttons now redirect to `/contact`
- ✅ Maintains existing design and branding
- ✅ Progressive experience flow

## 📁 Files Created/Modified

1. **`/app/contact/page.tsx`** - Beautiful contact form page
2. **`/app/api/contact/route.ts`** - Email handling API route  
3. **`/app/page.tsx`** - Updated all CTAs to redirect to contact
4. **`.env.example`** - Email configuration template

## 🔧 Next Steps

1. Copy `.env.example` to `.env.local`
2. Fill in your actual email credentials
3. Test the contact form
4. Start receiving quality leads!

The contact form is designed to capture high-intent leads with detailed restaurant information, making it easier for you to qualify and follow up with potential customers.