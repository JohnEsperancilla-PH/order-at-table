import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

function escapeHtml(str: string): string {
  if (typeof str !== 'string') return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, restaurantName, restaurantType, message, inquiryType } = body

    // Validate required fields
    if (!name || !email || !message || !inquiryType) {
      return NextResponse.json(
        { message: 'Please fill in all required fields' },
        { status: 400 }
      )
    }

    // Create transporter - configured for GoDaddy email
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })

    // Format the email content
    const inquiryTypeLabels: Record<string, string> = {
      'free-trial': 'Start Free Trial',
      'demo': 'Request Demo',
      'pricing': 'Pricing Information',
      'features': 'Feature Questions',
      'support': 'Technical Support',
      'partnership': 'Partnership Inquiry',
      'other': 'Other'
    }

    const restaurantTypeLabels: Record<string, string> = {
      'fast-casual': 'Fast Casual',
      'fine-dining': 'Fine Dining',
      'cafe': 'Cafe/Coffee Shop',
      'bar': 'Bar/Pub',
      'food-truck': 'Food Truck',
      'chain': 'Restaurant Chain',
      'other': 'Other'
    }

    const emailHtml = `
      <div style="background-color: #f8f9fa; padding: 20px; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #000; font-size: 28px; margin: 0;">
              QR<span style="color: #6366f1;">Der</span>
            </h1>
            <p style="color: #666; margin: 10px 0 0 0;">New Contact Form Submission</p>
            <p style="color: #888; font-size: 14px; margin: 5px 0 0 0;">Customer can also call: +63 905 236 7934</p>
          </div>

          <!-- Contact Details -->
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
            <h2 style="color: #333; font-size: 18px; margin-top: 0;">Contact Information</h2>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #555; width: 140px;">Name:</td>
                <td style="padding: 8px 0; color: #333;">${escapeHtml(String(name))}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #555;">Email:</td>
                <td style="padding: 8px 0; color: #333;">${escapeHtml(String(email))}</td>
              </tr>
              ${phone ? `
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Phone:</td>
                  <td style="padding: 8px 0; color: #333;">${escapeHtml(String(phone))}</td>
                </tr>
              ` : ''}
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #555;">Inquiry Type:</td>
                <td style="padding: 8px 0; color: #333;">${escapeHtml(String(inquiryTypeLabels[inquiryType] || inquiryType))}</td>
              </tr>
            </table>
          </div>

          ${restaurantName || restaurantType ? `
            <!-- Restaurant Details -->
            <div style="background-color: #f0f9ff; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
              <h2 style="color: #333; font-size: 18px; margin-top: 0;">Restaurant Information</h2>
              
              <table style="width: 100%; border-collapse: collapse;">
                ${restaurantName ? `
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #555; width: 140px;">Restaurant Name:</td>
                    <td style="padding: 8px 0; color: #333;">${escapeHtml(String(restaurantName))}</td>
                  </tr>
                ` : ''}
                ${restaurantType ? `
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #555;">Restaurant Type:</td>
                    <td style="padding: 8px 0; color: #333;">${escapeHtml(String(restaurantTypeLabels[restaurantType] || restaurantType))}</td>
                  </tr>
                ` : ''}
              </table>
            </div>
          ` : ''}

          <!-- Message -->
          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
            <h2 style="color: #333; font-size: 18px; margin-top: 0;">Message</h2>
            <div style="color: #333; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(String(message))}</div>
          </div>

          <!-- Next Steps -->
          <div style="background-color: #fef3c7; padding: 20px; border-radius: 6px; border-left: 4px solid #f59e0b;">
            <h3 style="color: #92400e; margin-top: 0; font-size: 16px;">Recommended Next Steps:</h3>
            <ul style="color: #92400e; margin: 0; padding-left: 20px;">
              ${inquiryType === 'free-trial' ? '<li>Set up free trial account</li>' : ''}
              ${inquiryType === 'demo' ? '<li>Schedule demo call</li>' : ''}
              ${inquiryType === 'pricing' ? '<li>Send pricing information</li>' : ''}
              ${inquiryType === 'features' ? '<li>Provide detailed feature documentation</li>' : ''}
              ${inquiryType === 'support' ? '<li>Forward to technical support team</li>' : ''}
              <li>Reply within 24 hours</li>
              <li>Follow up within 3 business days if no response</li>
            </ul>
          </div>

          <!-- Footer -->
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #666; font-size: 14px; margin: 0;">
              This message was sent from the QRDer contact form at ${new Date().toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    `

    const emailText = `
New QRDer Contact Form Submission

CONTACT INFORMATION:
Name: ${name}
Email: ${email}
${phone ? `Phone: ${phone}` : ''}
Inquiry Type: ${inquiryTypeLabels[inquiryType] || inquiryType}

${restaurantName || restaurantType ? `
RESTAURANT INFORMATION:
${restaurantName ? `Restaurant Name: ${restaurantName}` : ''}
${restaurantType ? `Restaurant Type: ${restaurantTypeLabels[restaurantType] || restaurantType}` : ''}
` : ''}

MESSAGE:
${message}

---
Sent at: ${new Date().toLocaleString()}
    `

    // Send email
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: process.env.CONTACT_EMAIL || process.env.SMTP_USER, // Your email where you want to receive contacts
      subject: `QRDer Contact: ${escapeHtml(String(inquiryTypeLabels[inquiryType] || inquiryType))} - ${escapeHtml(String(name))}`,
      text: emailText,
      html: emailHtml,
      replyTo: email // Allow you to reply directly to the customer
    }

    await transporter.sendMail(mailOptions)

    return NextResponse.json(
      { message: 'Message sent successfully' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { message: 'Failed to send message. Please try again.' },
      { status: 500 }
    )
  }
}