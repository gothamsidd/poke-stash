import express from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import Order from '../models/Order.model.js';
import Product from '../models/Product.model.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Initialize Razorpay (only if keys are provided)
let razorpay = null;
let initializationAttempted = false;

// Function to initialize Razorpay
const initializeRazorpay = () => {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    try {
      razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
      });
      // Razorpay initialized successfully
      return true;
    } catch (error) {
      console.error('❌ Razorpay initialization error:', error.message);
      razorpay = null;
      return false;
    }
  } else {
    if (!initializationAttempted) {
      console.warn('⚠️  Razorpay keys not found in environment variables');
      initializationAttempted = true;
    }
    return false;
  }
};

// Function to get Razorpay instance (lazy initialization)
const getRazorpayInstance = () => {
  if (!razorpay) {
    initializeRazorpay();
  }
  return razorpay;
};

// @route   POST /api/payments/create-order
// @desc    Create Razorpay order
// @access  Private
router.post('/create-order', protect, async (req, res, next) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Check if Razorpay is configured (re-initialize if needed)
    const razorpayInstance = getRazorpayInstance();
    if (!razorpayInstance) {
      return res.status(503).json({
        success: false,
        message: 'Payment service is not configured. Please add Razorpay keys to enable payments.'
      });
    }

    const options = {
      amount: Math.round(order.totalPrice * 100), // Convert to paise
      currency: 'INR',
      receipt: `order_${order._id}`,
      notes: {
        orderId: order._id.toString(),
        userId: req.user._id.toString()
      }
    };

    const razorpayOrder = await razorpayInstance.orders.create(options);

    // Update order with Razorpay order ID
    order.paymentInfo.razorpayOrderId = razorpayOrder.id;
    await order.save();

    res.json({
      success: true,
      order: razorpayOrder
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/payments/verify
// @desc    Verify Razorpay payment
// @access  Private
router.post('/verify', protect, async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    // Payment verification request

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(503).json({
        success: false,
        message: 'Payment service is not configured.'
      });
    }

    // For QR code payments, payment_id might not be available immediately
    // Check if payment exists by order_id first
    if (!razorpay_payment_id) {
      // No payment_id provided, checking order status
      
      // Try to fetch payment from Razorpay by order_id
      const razorpayInstance = getRazorpayInstance();
      if (razorpayInstance && razorpay_order_id) {
        try {
          const payments = await razorpayInstance.orders.fetchPayments(razorpay_order_id);
          if (payments && payments.items && payments.items.length > 0) {
            const payment = payments.items.find(p => p.status === 'captured' || p.status === 'authorized');
            if (payment) {
              // Found payment via order lookup
              // Use the found payment for verification
              const text = `${razorpay_order_id}|${payment.id}`;
              const generated_signature = crypto
                .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                .update(text)
                .digest('hex');
              
              // Verify with Razorpay's signature if available
              if (payment.status === 'captured') {
                order.paymentInfo.razorpayPaymentId = payment.id;
                order.paymentInfo.status = 'completed';
                // For digital products (stickers), mark as delivered immediately after payment
                order.orderStatus = 'delivered';
                order.deliveredAt = new Date();
                
                // Reduce stock
                for (const item of order.orderItems) {
                  await Product.findByIdAndUpdate(item.product, {
                    $inc: { stock: -item.quantity, salesCount: item.quantity }
                  });
                }
                
                await order.save();
                
                return res.json({
                  success: true,
                  message: 'Payment verified successfully (via order lookup)',
                  order
                });
              }
            }
          }
        } catch (error) {
          console.error('Error fetching payments by order:', error.message);
        }
      }
      
      return res.status(400).json({
        success: false,
        message: 'Payment ID is required. Please complete the payment and try again.'
      });
    }

    // Verify signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      // Signature verification failed
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed: Invalid signature'
      });
    }

    // Update order payment info
    order.paymentInfo.razorpayPaymentId = razorpay_payment_id;
    order.paymentInfo.razorpaySignature = razorpay_signature;
    order.paymentInfo.status = 'completed';
    // For digital products (stickers), mark as delivered immediately after payment
    order.orderStatus = 'delivered';
    order.deliveredAt = new Date();
    
    // Reduce stock only after payment is verified (prevents stock reduction if payment fails)
    for (const item of order.orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity, salesCount: item.quantity }
      });
    }
    
    await order.save();

    // Payment verified successfully
    res.json({
      success: true,
      message: 'Payment verified successfully',
      order
    });
  } catch (error) {
    console.error('❌ Payment verification error:', error);
    next(error);
  }
});

// @route   GET /api/payments/check-status/:orderId
// @desc    Check payment status for an order (useful for QR code payments)
// @access  Private
router.get('/check-status/:orderId', protect, async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // If order already has payment info, return it
    if (order.paymentInfo.status === 'completed') {
      return res.json({
        success: true,
        status: 'completed',
        order
      });
    }

    // Check Razorpay for payment status
    const razorpayInstance = getRazorpayInstance();
    if (!razorpayInstance || !order.paymentInfo.razorpayOrderId) {
      return res.json({
        success: true,
        status: 'pending',
        message: 'Payment pending'
      });
    }

    try {
      const payments = await razorpayInstance.orders.fetchPayments(order.paymentInfo.razorpayOrderId);
      if (payments && payments.items && payments.items.length > 0) {
        const payment = payments.items.find(p => p.status === 'captured' || p.status === 'authorized');
        if (payment && payment.status === 'captured') {
          // Payment completed, update order
          order.paymentInfo.razorpayPaymentId = payment.id;
          order.paymentInfo.status = 'completed';
          // For digital products (stickers), mark as delivered immediately after payment
          order.orderStatus = 'delivered';
          order.deliveredAt = new Date();
          
          // Reduce stock
          for (const item of order.orderItems) {
            await Product.findByIdAndUpdate(item.product, {
              $inc: { stock: -item.quantity, salesCount: item.quantity }
            });
          }
          
          await order.save();
          
          return res.json({
            success: true,
            status: 'completed',
            order
          });
        }
      }
    } catch (error) {
      console.error('Error checking payment status:', error.message);
    }

    res.json({
      success: true,
      status: 'pending',
      message: 'Payment pending'
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/payments/create-payment-link
// @desc    Create Razorpay Payment Link
// @access  Private
router.post('/create-payment-link', protect, async (req, res, next) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Check if Razorpay is configured
    const razorpayInstance = getRazorpayInstance();
    if (!razorpayInstance) {
      return res.status(503).json({
        success: false,
        message: 'Payment service is not configured. Please add Razorpay keys to enable payments.'
      });
    }

    // Create payment link
    const paymentLinkOptions = {
      amount: Math.round(order.totalPrice * 100), // Convert to paise
      currency: 'INR',
      description: `Order #${order.orderNumber} - PokeStash Pokemon Stickers`,
      customer: {
        name: order.shippingAddress.name || req.user.name,
        email: req.user.email,
        contact: order.shippingAddress.phone || req.user.phone || '9999999999'
      },
      notify: {
        sms: false,
        email: true
      },
      reminder_enable: true,
      callback_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/orders?payment_link=true`,
      callback_method: 'get',
      notes: {
        orderId: order._id.toString(),
        userId: req.user._id.toString(),
        orderNumber: order.orderNumber
      }
    };

    const paymentLink = await razorpayInstance.paymentLink.create(paymentLinkOptions);

    // Update order with payment link ID
    order.paymentInfo.razorpayPaymentLinkId = paymentLink.id;
    order.paymentInfo.razorpayPaymentLinkUrl = paymentLink.short_url;
    await order.save();

    res.json({
      success: true,
      paymentLink: {
        id: paymentLink.id,
        short_url: paymentLink.short_url,
        url: paymentLink.short_url
      }
    });
  } catch (error) {
    console.error('❌ Payment link creation error:', error);
    next(error);
  }
});

// @route   POST /api/payments/verify-payment-link
// @desc    Verify payment via payment link (webhook or callback)
// @access  Public (called by Razorpay webhook)
router.post('/verify-payment-link', async (req, res, next) => {
  try {
    const { payment_link_id, payment_id, order_id } = req.body;

    if (!payment_link_id || !payment_id) {
      return res.status(400).json({
        success: false,
        message: 'Payment link ID and payment ID are required'
      });
    }

    // Find order by payment link ID
    const order = await Order.findOne({
      'paymentInfo.razorpayPaymentLinkId': payment_link_id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found for this payment link'
      });
    }

    // Verify payment with Razorpay
    const razorpayInstance = getRazorpayInstance();
    if (!razorpayInstance) {
      return res.status(503).json({
        success: false,
        message: 'Payment service is not configured.'
      });
    }

    try {
      const payment = await razorpayInstance.payments.fetch(payment_id);
      
      if (payment.status === 'captured' || payment.status === 'authorized') {
        // Update order payment info
        order.paymentInfo.razorpayPaymentId = payment_id;
        order.paymentInfo.status = 'completed';
        order.orderStatus = 'delivered';
        order.deliveredAt = new Date();
        
        // Reduce stock
        for (const item of order.orderItems) {
          await Product.findByIdAndUpdate(item.product, {
            $inc: { stock: -item.quantity, salesCount: item.quantity }
          });
        }
        
        await order.save();
        
        return res.json({
          success: true,
          message: 'Payment verified successfully',
          order
        });
      }
    } catch (error) {
      console.error('Error fetching payment:', error.message);
    }

    res.json({
      success: false,
      message: 'Payment not completed'
    });
  } catch (error) {
    console.error('❌ Payment link verification error:', error);
    next(error);
  }
});

// @route   POST /api/payments/refund
// @desc    Process refund
// @access  Private (Admin)
router.post('/refund', protect, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Check if Razorpay is configured (re-initialize if needed)
    const razorpayInstance = getRazorpayInstance();
    if (!razorpayInstance) {
      return res.status(503).json({
        success: false,
        message: 'Payment service is not configured.'
      });
    }

    const { paymentId, amount, orderId } = req.body;

    const refund = await razorpayInstance.payments.refund(paymentId, {
      amount: amount ? Math.round(amount * 100) : undefined // Full refund if amount not specified
    });

    // Update order
    const order = await Order.findById(orderId);
    if (order) {
      order.paymentInfo.status = 'refunded';
      order.orderStatus = 'cancelled';
      await order.save();
    }

    res.json({
      success: true,
      refund
    });
  } catch (error) {
    next(error);
  }
});

export default router;
