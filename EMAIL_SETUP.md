# Email Notification Setup

## Overview
The ArtConnect app now sends email notifications when:
1. A buyer submits a purchase request (notifies artist and buyer)
2. An artist updates the purchase request status (notifies buyer)

## Setup Instructions

### 1. Install Dependencies
```bash
cd server
npm install nodemailer
```

### 2. Configure Email Service

Add these environment variables to your `server/.env` file:

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### 3. Gmail Setup (Recommended)

If using Gmail:

1. **Enable 2-Step Verification**:
   - Go to your Google Account settings
   - Enable 2-Step Verification

2. **Generate App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Enter "ArtConnect" as the name
   - Copy the generated 16-character password
   - Use this as `EMAIL_PASS` in your `.env` file

### 4. Other Email Providers

#### Outlook/Hotmail
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
```

#### Yahoo Mail
```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_USER=your-email@yahoo.com
EMAIL_PASS=your-app-password
```

#### Custom SMTP Server
```env
EMAIL_HOST=your-smtp-server.com
EMAIL_PORT=587
EMAIL_USER=your-email@domain.com
EMAIL_PASS=your-password
```

### 5. Test Email Service

The email service will automatically initialize when the server starts. If configured correctly, you'll see:
```
Email service initialized
```

If not configured, you'll see:
```
Email service not configured. Set EMAIL_HOST, EMAIL_USER, and EMAIL_PASS in .env
```

## Email Templates

### Purchase Request Notification (to Artist)
- Subject: "New Purchase Request: [Artwork Title]"
- Includes: Buyer details, artwork info, price

### Purchase Confirmation (to Buyer)
- Subject: "Purchase Request Confirmed: [Artwork Title]"
- Includes: Order confirmation, artwork details

### Status Update (to Buyer)
- Subject: "Order Update: [Artwork Title]"
- Includes: New status (confirmed, shipped, delivered, cancelled)

## Troubleshooting

### Emails Not Sending

1. **Check Environment Variables**:
   - Ensure all EMAIL_* variables are set in `server/.env`
   - Restart the server after adding variables

2. **Check Email Service Logs**:
   - Look for "Email service initialized" message
   - Check for error messages in server console

3. **Gmail Issues**:
   - Make sure you're using an App Password, not your regular password
   - Ensure 2-Step Verification is enabled
   - Check that "Less secure app access" is not required (use App Password instead)

4. **Firewall/Network Issues**:
   - Ensure port 587 (or your SMTP port) is not blocked
   - Check if your network allows SMTP connections

### Email Service Not Critical

The email service is designed to fail gracefully. If emails can't be sent:
- The purchase request will still be saved to Firestore
- Users can still view requests in the app
- Only the email notification will be skipped

## Security Notes

- Never commit your `.env` file with email credentials
- Use App Passwords instead of regular passwords
- Consider using environment-specific email accounts for production
- For production, consider using dedicated email services like:
  - SendGrid
  - Mailgun
  - AWS SES
  - Postmark
