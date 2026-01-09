import express from 'express';
import { body, validationResult } from 'express-validator';
import Order from '../models/Order.model.js';
import Product from '../models/Product.model.js';
import Cart from '../models/Cart.model.js';
import Coupon from '../models/Coupon.model.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// @route   POST /api/orders
// @desc    Create new order
// @access  Private
router.post('/', protect, [
  body('orderItems').isArray({ min: 1 }).withMessage('Order items are required'),
  body('shippingAddress.street').notEmpty().withMessage('Street address is required'),
  body('shippingAddress.city').notEmpty().withMessage('City is required'),
  body('shippingAddress.state').notEmpty().withMessage('State is required'),
  body('shippingAddress.zipCode').notEmpty().withMessage('Zip code is required'),
  body('shippingAddress.country').notEmpty().withMessage('Country is required'),
  body('shippingAddress.phone').notEmpty().withMessage('Phone is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { orderItems, shippingAddress, paymentMethod } = req.body;

    // Validate orderItems array
    if (!Array.isArray(orderItems) || orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order items are required'
      });
    }

    // Calculate prices
    let itemsPrice = 0;
    const orderItemsWithDetails = [];

    // Validate all products and calculate prices in parallel for better performance
    try {
      const productChecks = await Promise.all(
        orderItems.map(async (item) => {
          if (!item.product || !item.quantity) {
            throw new Error('Invalid order item: product and quantity are required');
          }
          const product = await Product.findById(item.product);
          if (!product) {
            throw new Error(`Product ${item.product} not found`);
          }
          if (product.status !== 'active') {
            throw new Error(`Product ${product.name} is not available`);
          }
          if (product.stock < item.quantity) {
            throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`);
          }
          return { product, item };
        })
      );

      // Calculate prices and build order items
      for (const { product, item } of productChecks) {
        const itemPrice = product.price * item.quantity;
        itemsPrice += itemPrice;

        orderItemsWithDetails.push({
          product: product._id,
          quantity: item.quantity,
          price: product.price,
          name: product.name,
          image: product.images[0]
        });
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Error validating order items'
      });
    }

    const shippingPrice = 5; // Fixed shipping charge
    const taxPrice = 1; // Fixed tax
    const subtotal = itemsPrice + shippingPrice + taxPrice;

    // Apply coupon if provided
    let discountAmount = 0;
    let couponCode = null;
    if (req.body.couponCode) {
      const coupon = await Coupon.findOne({ 
        code: req.body.couponCode.toUpperCase().trim(),
        isActive: true
      });

      if (coupon) {
        const now = new Date();
        // Check if coupon is valid (within date range)
        if (now < coupon.validFrom) {
          // Coupon not yet valid - skip but don't error (optional coupon)
        } else if (now > coupon.validUntil) {
          // Coupon expired - skip but don't error (optional coupon)
        } else {
          // Coupon is valid, check other conditions
          if (!coupon.usageLimit || coupon.usedCount < coupon.usageLimit) {
            if (subtotal >= coupon.minPurchaseAmount) {
              if (coupon.discountType === 'percentage') {
                discountAmount = (subtotal * coupon.discountValue) / 100;
                if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
                  discountAmount = coupon.maxDiscountAmount;
                }
              } else {
                discountAmount = coupon.discountValue;
                if (discountAmount > subtotal) {
                  discountAmount = subtotal;
                }
              }
              couponCode = coupon.code;
              // Increment usage count
              coupon.usedCount += 1;
              await coupon.save();
            }
          }
        }
      }
    }

    const totalPrice = Math.max(0, subtotal - discountAmount);

    const order = await Order.create({
      user: req.user._id,
      orderItems: orderItemsWithDetails,
      shippingAddress,
      paymentMethod: paymentMethod || 'razorpay',
      itemsPrice,
      shippingPrice,
      taxPrice,
      couponCode,
      discountAmount: Math.round(discountAmount * 100) / 100,
      totalPrice: Math.round(totalPrice * 100) / 100
    });

    // NOTE: Stock is NOT reduced here - it will be reduced only after payment verification
    // This prevents stock reduction if payment fails
    // Stock will be reduced in payment verification route after successful payment

    // Clear cart
    await Cart.findOneAndUpdate(
      { user: req.user._id },
      { $set: { items: [] } }
    );

    res.status(201).json({
      success: true,
      order
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/orders
// @desc    Get user orders
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('orderItems.product', 'name images')
      .sort({ createdAt: -1 });

    // Auto-fix: Update orders with completed payment but wrong status
    // This ensures existing orders are properly marked as delivered
    let fixedCount = 0;
    for (const order of orders) {
      if (order.paymentInfo?.status === 'completed' && order.orderStatus !== 'delivered') {
        order.orderStatus = 'delivered';
        if (!order.deliveredAt) {
          order.deliveredAt = order.updatedAt || new Date();
        }
        await order.save();
        fixedCount++;
      }
    }
    
    if (fixedCount > 0) {
      // Auto-fixed order statuses
    }
    
    // Filter out pending orders that haven't been paid
    const filteredOrders = orders.filter(order => {
      // Keep orders that are:
      // 1. Paid (payment status is completed), OR
      // 2. Not pending (already processed/delivered/cancelled)
      return order.paymentInfo?.status === 'completed' || order.orderStatus !== 'pending';
    });

    res.json({
      success: true,
      count: filteredOrders.length,
      orders: filteredOrders
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/orders/:id
// @desc    Get single order
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('orderItems.product', 'name images description')
      .populate('user', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user owns the order or is admin
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status
// @access  Private (Admin/Seller)
router.put('/:id/status', protect, [
  body('orderStatus').isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).withMessage('Invalid order status')
], async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.orderStatus = req.body.orderStatus;

    if (req.body.orderStatus === 'delivered') {
      order.deliveredAt = new Date();
    }

    if (req.body.orderStatus === 'cancelled') {
      order.cancelledAt = new Date();
      order.cancellationReason = req.body.cancellationReason;

      // Restore stock only if payment was completed (stock was already reduced)
      if (order.paymentInfo.status === 'completed') {
        for (const item of order.orderItems) {
          await Product.findByIdAndUpdate(item.product, {
            $inc: { stock: item.quantity, salesCount: -item.quantity }
          });
        }
      }
    }

    await order.save();

    res.json({
      success: true,
      order
    });
  } catch (error) {
    next(error);
  }
});

export default router;
