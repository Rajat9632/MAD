// Purchase Routes - Handle purchase-related operations and email notifications

const express = require('express');
const router = express.Router();
const {
  sendPurchaseNotificationToArtist,
  sendPurchaseConfirmationToBuyer,
  sendStatusUpdateEmail,
} = require('../services/emailService');

// Send purchase notification emails
router.post('/send-notification', async (req, res) => {
  try {
    const {
      artistEmail,
      buyerEmail,
      buyerName,
      artworkTitle,
      artistName,
      price,
      buyerPhone,
    } = req.body;

    if (!artistEmail || !buyerEmail) {
      return res.status(400).json({
        success: false,
        message: 'Artist and buyer emails are required',
      });
    }

    // Send email to artist
    const artistEmailResult = await sendPurchaseNotificationToArtist({
      artistEmail,
      buyerName,
      artworkTitle,
      price,
      buyerEmail,
      buyerPhone,
    });

    // Send confirmation to buyer
    const buyerEmailResult = await sendPurchaseConfirmationToBuyer({
      buyerEmail,
      buyerName,
      artworkTitle,
      artistName,
      price,
    });

    res.json({
      success: true,
      data: {
        artistEmailSent: artistEmailResult.success,
        buyerEmailSent: buyerEmailResult.success,
      },
    });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Send status update email
router.post('/send-status-update', async (req, res) => {
  try {
    const { email, name, artworkTitle, status } = req.body;

    if (!email || !status) {
      return res.status(400).json({
        success: false,
        message: 'Email and status are required',
      });
    }

    const result = await sendStatusUpdateEmail({
      email,
      name,
      artworkTitle,
      status,
    });

    res.json({
      success: result.success,
      data: result,
    });
  } catch (error) {
    console.error('Send status update error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
