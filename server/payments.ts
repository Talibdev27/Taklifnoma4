
import express from 'express';
import crypto from 'crypto';

const router = express.Router();

interface PaymentRequest {
  planId: string;
  amount: number;
  method: string;
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  phoneNumber?: string;
}

// Payment configuration for Uzbekistan
const PAYMENT_CONFIG = {
  payme: {
    merchant_id: process.env.PAYME_MERCHANT_ID || 'test_merchant',
    secret_key: process.env.PAYME_SECRET_KEY || 'test_secret',
    endpoint: 'https://checkout.paycom.uz'
  },
  click: {
    merchant_id: process.env.CLICK_MERCHANT_ID || 'test_merchant',
    secret_key: process.env.CLICK_SECRET_KEY || 'test_secret',
    endpoint: 'https://my.click.uz/services/pay'
  },
  paycom: {
    merchant_id: process.env.PAYCOM_MERCHANT_ID || 'test_merchant',
    secret_key: process.env.PAYCOM_SECRET_KEY || 'test_secret',
    endpoint: 'https://api.paycom.uz'
  }
};

// Create payment
router.post('/create', async (req, res) => {
  try {
    const paymentData: PaymentRequest = req.body;
    
    // Validate payment amount
    if (!paymentData.amount || paymentData.amount <= 0) {
      return res.status(400).json({ 
        error: 'Invalid amount',
        message: 'Payment amount must be greater than zero'
      });
    }
    
    // Validate payment method
    const validMethods = ['click', 'payme', 'paycom'];
    if (!validMethods.includes(paymentData.method)) {
      return res.status(400).json({ 
        error: 'Invalid payment method',
        message: 'Payment method must be one of: click, payme, paycom'
      });
    }
    
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store order in database with proper validation
    // Note: This would connect to your order storage system
    const orderData = {
      id: orderId,
      planId: paymentData.planId,
      amount: paymentData.amount,
      method: paymentData.method,
      status: 'pending',
      createdAt: new Date(),
      validatedAmount: paymentData.amount
    };

    let redirectUrl = null;

    switch (paymentData.method) {
      case 'payme':
        redirectUrl = generatePaymeUrl(orderId, paymentData.amount);
        break;
      case 'click':
        redirectUrl = generateClickUrl(orderId, paymentData.amount);
        break;
      case 'paycom':
        redirectUrl = generatePaycomUrl(orderId, paymentData.amount);
        break;
      case 'uzcard':
      case 'humo':
        // For direct card processing, you'd integrate with a payment processor
        // This is a simplified example
        redirectUrl = `/payment-processing?order=${orderId}`;
        break;
    }

    res.json({
      success: true,
      orderId,
      redirectUrl,
      message: 'To\'lov yaratildi'
    });
  } catch (error) {
    console.error('Payment creation error:', error);
    res.status(500).json({
      success: false,
      message: 'To\'lovni yaratishda xatolik yuz berdi'
    });
  }
});

// Payment webhook handlers
router.post('/webhook/payme', async (req, res) => {
  try {
    // Handle Payme webhook
    const { method, params } = req.body;
    
    // Verify signature
    const signature = req.headers['authorization'];
    if (!verifyPaymeSignature(signature, req.body)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Handle different methods
    switch (method) {
      case 'CheckPerformTransaction':
        // Check if transaction can be performed
        res.json({ result: { allow: true } });
        break;
      case 'CreateTransaction':
        // Create transaction
        res.json({ result: { create_time: Date.now(), transaction: params.id, state: 1 } });
        break;
      case 'PerformTransaction':
        // Perform transaction
        res.json({ result: { perform_time: Date.now(), transaction: params.id, state: 2 } });
        break;
      case 'CancelTransaction':
        // Cancel transaction
        res.json({ result: { cancel_time: Date.now(), transaction: params.id, state: -1 } });
        break;
      default:
        res.status(400).json({ error: 'Unknown method' });
    }
  } catch (error) {
    console.error('Payme webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/webhook/click', async (req, res) => {
  try {
    // Handle Click webhook
    const { click_trans_id, service_id, merchant_trans_id, amount, action, sign_time, sign_string } = req.body;
    
    // Verify signature
    if (!verifyClickSignature(req.body)) {
      return res.status(401).json({ error: -1, error_note: 'Invalid signature' });
    }

    switch (action) {
      case 0: // Check transaction
        res.json({ click_trans_id, merchant_trans_id, error: 0, error_note: 'Success' });
        break;
      case 1: // Prepare transaction
        res.json({ click_trans_id, merchant_trans_id, merchant_prepare_id: Date.now(), error: 0, error_note: 'Success' });
        break;
      case 2: // Complete transaction
        res.json({ click_trans_id, merchant_trans_id, error: 0, error_note: 'Success' });
        break;
      default:
        res.json({ error: -1, error_note: 'Unknown action' });
    }
  } catch (error) {
    console.error('Click webhook error:', error);
    res.json({ error: -1, error_note: 'Internal server error' });
  }
});

// Helper functions
function generatePaymeUrl(orderId: string, amount: number): string {
  const merchantId = PAYMENT_CONFIG.payme.merchant_id;
  const params = {
    m: merchantId,
    ac: { order_id: orderId },
    a: amount * 100, // Convert to tiyin
    c: `${process.env.BASE_URL}/payment-success?order=${orderId}`
  };
  
  const encoded = btoa(JSON.stringify(params));
  return `${PAYMENT_CONFIG.payme.endpoint}/${encoded}`;
}

function generateClickUrl(orderId: string, amount: number): string {
  const merchantId = PAYMENT_CONFIG.click.merchant_id;
  const returnUrl = `${process.env.BASE_URL}/payment-success?order=${orderId}`;
  
  return `${PAYMENT_CONFIG.click.endpoint}?service_id=${merchantId}&merchant_id=${merchantId}&amount=${amount}&transaction_param=${orderId}&return_url=${encodeURIComponent(returnUrl)}`;
}

function generatePaycomUrl(orderId: string, amount: number): string {
  const merchantId = PAYMENT_CONFIG.paycom.merchant_id;
  return `${PAYMENT_CONFIG.paycom.endpoint}/payment?merchant=${merchantId}&order=${orderId}&amount=${amount}`;
}

function verifyPaymeSignature(signature: string, body: any): boolean {
  // Implement Payme signature verification
  // This is a simplified version
  return true; // You should implement actual verification
}

function verifyClickSignature(body: any): boolean {
  // Implement Click signature verification
  const { click_trans_id, service_id, merchant_trans_id, amount, action, sign_time } = body;
  const secretKey = PAYMENT_CONFIG.click.secret_key;
  
  const signString = md5(`${click_trans_id}${service_id}${secretKey}${merchant_trans_id}${amount}${action}${sign_time}`);
  return signString === body.sign_string;
}

function md5(str: string): string {
  return crypto.createHash('md5').update(str).digest('hex');
}

export default router;
