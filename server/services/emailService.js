// Email Service - Send email notifications using nodemailer

const nodemailer = require('nodemailer');

// Create transporter (configure with your email service)
// For Gmail, you'll need to use an App Password
// For other services, adjust the configuration accordingly
let transporter = null;

function initializeEmailService() {
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    console.log('Email service initialized');
  } else {
    console.warn('Email service not configured. Set EMAIL_HOST, EMAIL_USER, and EMAIL_PASS in .env');
  }
}

// Initialize on module load
initializeEmailService();

/**
 * Send purchase notification email to artist
 */
async function sendPurchaseNotificationToArtist({ artistEmail, buyerName, artworkTitle, price, buyerEmail, buyerPhone }) {
  if (!transporter || !artistEmail) {
    console.log('Email service not available or artist email missing');
    return { success: false, message: 'Email service not configured' };
  }

  try {
    const mailOptions = {
      from: `"ArtConnect" <${process.env.EMAIL_USER}>`,
      to: artistEmail,
      subject: `New Purchase Request: ${artworkTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #111811;">New Purchase Request</h2>
          <p>Hello!</p>
          <p>You have received a new purchase request for your artwork:</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #111811; margin-top: 0;">${artworkTitle}</h3>
            <p><strong>Price:</strong> ₹${price.toLocaleString()}</p>
          </div>
          
          <h3 style="color: #111811;">Buyer Details:</h3>
          <ul style="line-height: 1.8;">
            <li><strong>Name:</strong> ${buyerName}</li>
            <li><strong>Email:</strong> ${buyerEmail}</li>
            <li><strong>Phone:</strong> ${buyerPhone}</li>
          </ul>
          
          <p>Please log in to ArtConnect to view the complete purchase request and update its status.</p>
          
          <p style="margin-top: 30px; color: #666; font-size: 12px;">
            This is an automated email from ArtConnect. Please do not reply to this email.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Purchase notification sent to artist:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email to artist:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send purchase confirmation email to buyer
 */
async function sendPurchaseConfirmationToBuyer({ buyerEmail, buyerName, artworkTitle, artistName, price }) {
  if (!transporter || !buyerEmail) {
    console.log('Email service not available or buyer email missing');
    return { success: false, message: 'Email service not configured' };
  }

  try {
    const mailOptions = {
      from: `"ArtConnect" <${process.env.EMAIL_USER}>`,
      to: buyerEmail,
      subject: `Purchase Request Confirmed: ${artworkTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #111811;">Purchase Request Confirmed</h2>
          <p>Hello ${buyerName}!</p>
          <p>Your purchase request has been successfully submitted.</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #111811; margin-top: 0;">${artworkTitle}</h3>
            <p><strong>Artist:</strong> ${artistName}</p>
            <p><strong>Price:</strong> ₹${price.toLocaleString()}</p>
          </div>
          
          <p>The artist will review your request and contact you soon. You can track your purchase status in the ArtConnect app.</p>
          
          <p style="margin-top: 30px; color: #666; font-size: 12px;">
            This is an automated email from ArtConnect. Please do not reply to this email.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Purchase confirmation sent to buyer:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email to buyer:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send status update email
 */
async function sendStatusUpdateEmail({ email, name, artworkTitle, status }) {
  if (!transporter || !email) {
    console.log('Email service not available or email missing');
    return { success: false, message: 'Email service not configured' };
  }

  const statusMessages = {
    confirmed: 'Your purchase request has been confirmed by the artist.',
    shipped: 'Your artwork has been shipped!',
    delivery_confirmation_pending: 'Your artwork has been delivered! Please confirm receipt in the app.',
    delivered: 'Your artwork delivery has been confirmed!',
    cancelled: 'Your purchase request has been cancelled.',
  };

  try {
    const mailOptions = {
      from: `"ArtConnect" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Order Update: ${artworkTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #111811;">Order Status Update</h2>
          <p>Hello ${name}!</p>
          <p>${statusMessages[status] || 'Your order status has been updated.'}</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #111811; margin-top: 0;">${artworkTitle}</h3>
            <p><strong>Status:</strong> ${status.charAt(0).toUpperCase() + status.slice(1)}</p>
          </div>
          
          <p>You can view more details in the ArtConnect app.</p>
          
          <p style="margin-top: 30px; color: #666; font-size: 12px;">
            This is an automated email from ArtConnect. Please do not reply to this email.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Status update email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending status update email:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendPurchaseNotificationToArtist,
  sendPurchaseConfirmationToBuyer,
  sendStatusUpdateEmail,
  initializeEmailService,
};
