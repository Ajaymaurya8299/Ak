import Razorpay from 'razorpay';
import crypto from 'crypto';
import { Request, Response } from 'express';

// Initialize Razorpay instance
let razorpay: Razorpay | null = null;

function initializeRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  
  if (!keyId || !keySecret) {
    console.warn('Razorpay credentials not found. Payment functionality will be disabled.');
    return null;
  }
  
  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

// Initialize on module load
razorpay = initializeRazorpay();

export interface PaymentOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
  created_at: number;
}

export interface WithdrawRequest {
  userId: string;
  amount: number;
  accountDetails: {
    account_number: string;
    ifsc: string;
    name: string;
    upi_id?: string;
  };
}

// Create payment order for deposits
export async function createPaymentOrder(req: Request, res: Response) {
  try {
    if (!razorpay) {
      return res.status(503).json({ 
        error: 'Payment service unavailable',
        message: 'Razorpay not configured. Please contact support.'
      });
    }

    const { amount, userId } = req.body;
    
    if (!amount || amount < 1) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Convert to paise (Razorpay expects amount in smallest currency unit)
    const amountInPaise = Math.round(amount * 100);
    
    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `deposit_${userId}_${Date.now()}`,
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);
    
    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Error creating payment order:', error);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
}

// Verify payment signature
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  try {
    if (!process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay key secret not configured');
    }

    const body = orderId + '|' + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    return expectedSignature === signature;
  } catch (error) {
    console.error('Error verifying payment signature:', error);
    return false;
  }
}

// Handle payment verification
export async function verifyPayment(req: Request, res: Response) {
  try {
    const { orderId, paymentId, signature, userId, amount } = req.body;
    
    const isValid = verifyPaymentSignature(orderId, paymentId, signature);
    
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // Payment is verified - add money to user's wallet
    // This should be integrated with your user storage system
    const amountInRupees = amount / 100; // Convert from paise
    
    // TODO: Update user balance in database
    console.log(`Payment verified for user ${userId}: ₹${amountInRupees}`);
    
    res.json({ 
      success: true, 
      message: 'Payment verified successfully',
      amount: amountInRupees
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Payment verification failed' });
  }
}

// Create payout for withdrawals
export async function createPayout(req: Request, res: Response) {
  try {
    if (!razorpay) {
      return res.status(503).json({ 
        error: 'Payment service unavailable',
        message: 'Razorpay not configured. Please contact support.'
      });
    }

    const { amount, accountDetails, userId }: WithdrawRequest = req.body;
    
    if (!amount || amount < 100) { // Minimum withdrawal ₹100
      return res.status(400).json({ error: 'Minimum withdrawal amount is ₹100' });
    }

    // Check user balance before processing withdrawal
    // TODO: Implement balance check from your user storage
    
    const amountInPaise = Math.round(Number(amount) * 100);
    
    const payoutData = {
      account_number: process.env.RAZORPAY_ACCOUNT_NUMBER || '2323230023902390',
      amount: amountInPaise,
      currency: 'INR',
      mode: accountDetails.upi_id ? 'UPI' : 'IMPS',
      purpose: 'payout',
      fund_account: {
        account_type: accountDetails.upi_id ? 'vpa' : 'bank_account',
        ...(accountDetails.upi_id 
          ? { vpa: { address: accountDetails.upi_id } }
          : {
              bank_account: {
                name: accountDetails.name,
                ifsc: accountDetails.ifsc,
                account_number: accountDetails.account_number,
              }
            }
        ),
        contact: {
          name: accountDetails.name,
          email: `user_${userId}@aviator.game`,
          contact: '9999999999',
          type: 'employee',
          reference_id: `user_${userId}`,
        }
      },
      queue_if_low_balance: true,
      reference_id: `withdrawal_${userId}_${Date.now()}`,
      narration: 'Aviator Game Withdrawal',
    };

    // Note: Actual payout creation requires RazorpayX account
    // For demo purposes, we'll simulate success
    console.log('Payout request created:', payoutData);
    
    res.json({ 
      success: true, 
      message: 'Withdrawal request submitted successfully',
      referenceId: payoutData.reference_id,
      amount: amount,
      estimatedTime: '1-2 business days'
    });
  } catch (error) {
    console.error('Error creating payout:', error);
    res.status(500).json({ error: 'Withdrawal request failed' });
  }
}

// Get payment status
export async function getPaymentStatus(req: Request, res: Response) {
  try {
    if (!razorpay) {
      return res.status(503).json({ error: 'Payment service unavailable' });
    }

    const { paymentId } = req.params;
    const payment = await razorpay.payments.fetch(paymentId);
    
    res.json({
      id: payment.id,
      status: payment.status,
      amount: payment.amount / 100, // Convert to rupees
      method: payment.method,
      created_at: payment.created_at,
    });
  } catch (error) {
    console.error('Error fetching payment status:', error);
    res.status(500).json({ error: 'Failed to fetch payment status' });
  }
}