import express from 'express';
import User from '../models/User.model.js';
import Product from '../models/Product.model.js';
import Order from '../models/Order.model.js';
import Cart from '../models/Cart.model.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+password');
    const userObj = user.toObject();
    
    // Add hasPassword flag (don't send actual password)
    userObj.hasPassword = !!user.password;
    delete userObj.password;

    res.json({
      success: true,
      user: userObj
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, async (req, res, next) => {
  try {
    const { name, phone, address, sellerInfo } = req.body;

    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    if (sellerInfo && user.role === 'seller') {
      user.sellerInfo = { ...user.sellerInfo, ...sellerInfo };
    }

    await user.save();

    res.json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/users/change-password
// @desc    Change user password (or set password for OAuth users)
// @access  Private
router.put('/change-password', protect, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate new password
    if (!newPassword || newPassword.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'New password is required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    // Get user with password field
    const user = await User.findById(req.user._id).select('+password');

    // If user has a password, verify current password
    if (user.password) {
      if (!currentPassword || currentPassword.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Current password is required'
        });
      }

      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }
    }
    // If user doesn't have password (OAuth user), currentPassword is optional

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: user.googleId ? 'Password set successfully' : 'Password changed successfully'
    });
  } catch (error) {
    // Error handled by error middleware
    next(error);
  }
});

// @route   GET /api/users/cart
// @desc    Get user cart
// @access  Private
router.get('/cart', protect, async (req, res, next) => {
  try {
    // Use findOneAndUpdate with upsert to atomically get or create cart
    // Only set items to [] if creating new cart (using $setOnInsert)
    let cart = await Cart.findOneAndUpdate(
      { user: req.user._id },
      { 
        $setOnInsert: { user: req.user._id, items: [] }
      },
      { 
        upsert: true, 
        new: true,
        setDefaultsOnInsert: true
      }
    ).populate('items.product', 'name price images stock status');

    res.json({
      success: true,
      cart
    });
  } catch (error) {
    // Handle duplicate key error gracefully
    if (error.code === 11000) {
      // Cart already exists, just fetch it
      const cart = await Cart.findOne({ user: req.user._id })
        .populate('items.product', 'name price images stock status');
      return res.json({
        success: true,
        cart
      });
    }
    next(error);
  }
});

// @route   POST /api/users/cart
// @desc    Add item to cart
// @access  Private
router.post('/cart', protect, async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;

    const product = await Product.findById(productId);
    if (!product || product.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: 'Product not found or unavailable'
      });
    }

    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock'
      });
    }

    // Use findOneAndUpdate with upsert to atomically get or create cart
    // Only set items to [] if creating new cart (using $setOnInsert)
    let cart = await Cart.findOneAndUpdate(
      { user: req.user._id },
      { 
        $setOnInsert: { user: req.user._id, items: [] }
      },
      { 
        upsert: true, 
        new: true,
        setDefaultsOnInsert: true
      }
    );

    // If cart was just created, it will have empty items array
    // If cart already existed, it will have its existing items

    const existingItemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );

    if (existingItemIndex > -1) {
      // Check if new total quantity exceeds stock
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;
      if (product.stock < newQuantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock. Available: ${product.stock}, Requested: ${newQuantity}`
        });
      }
      cart.items[existingItemIndex].quantity = newQuantity;
    } else {
      cart.items.push({ product: productId, quantity });
    }

    await cart.save();
    await cart.populate('items.product', 'name price images stock status');

    res.json({
      success: true,
      cart
    });
  } catch (error) {
    // Handle duplicate key error gracefully
    if (error.code === 11000) {
      // Cart already exists, fetch it and try again
      try {
        const cart = await Cart.findOne({ user: req.user._id });
        const { productId, quantity = 1 } = req.body;
        
        // Re-validate product and stock
        const product = await Product.findById(productId);
        if (!product || product.status !== 'active') {
          return res.status(404).json({
            success: false,
            message: 'Product not found or unavailable'
          });
        }
        
        const existingItemIndex = cart.items.findIndex(
          item => item.product.toString() === productId
        );

        if (existingItemIndex > -1) {
          const newQuantity = cart.items[existingItemIndex].quantity + quantity;
          if (product.stock < newQuantity) {
            return res.status(400).json({
              success: false,
              message: `Insufficient stock. Available: ${product.stock}, Requested: ${newQuantity}`
            });
          }
          cart.items[existingItemIndex].quantity = newQuantity;
        } else {
          if (product.stock < quantity) {
            return res.status(400).json({
              success: false,
              message: 'Insufficient stock'
            });
          }
          cart.items.push({ product: productId, quantity });
        }

        await cart.save();
        await cart.populate('items.product', 'name price images stock status');

        return res.json({
          success: true,
          cart
        });
      } catch (retryError) {
        return next(retryError);
      }
    }
    next(error);
  }
});

// @route   PUT /api/users/cart/:itemId
// @desc    Update cart item quantity
// @access  Private
router.put('/cart/:itemId', protect, async (req, res, next) => {
  try {
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1'
      });
    }

    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    const item = cart.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }

    // Check stock availability
    const product = await Product.findById(item.product);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock'
      });
    }

    item.quantity = quantity;
    await cart.save();
    await cart.populate('items.product', 'name price images stock status');

    res.json({
      success: true,
      cart
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/users/cart/:itemId
// @desc    Remove item from cart
// @access  Private
router.delete('/cart/:itemId', protect, async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    cart.items = cart.items.filter(
      item => item._id.toString() !== req.params.itemId
    );

    await cart.save();
    await cart.populate('items.product', 'name price images stock status');

    res.json({
      success: true,
      cart
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/users/dashboard
// @desc    Get user dashboard stats
// @access  Private
router.get('/dashboard', protect, async (req, res, next) => {
  try {
    if (req.user.role === 'seller') {
      const products = await Product.countDocuments({ seller: req.user._id });
      const sellerProductIds = await Product.find({ seller: req.user._id }).distinct('_id');
      const orders = await Order.find({
        'orderItems.product': { $in: sellerProductIds },
        'paymentInfo.status': 'completed'
      }).populate('user', 'name email').sort({ createdAt: -1 });
      
      const totalSales = orders.reduce((sum, order) => {
        const sellerItems = order.orderItems.filter(item => 
          sellerProductIds.some(pid => pid.toString() === item.product.toString())
        );
        return sum + sellerItems.reduce((s, item) => s + (item.price * item.quantity), 0);
      }, 0);

      res.json({
        success: true,
        stats: {
          totalProducts: products,
          totalOrders: orders.length,
          totalSales
        },
        orders: orders.map(order => {
          const sellerItems = order.orderItems.filter(item => 
            sellerProductIds.some(pid => pid.toString() === item.product.toString())
          );
          const totalPrice = sellerItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          return {
            _id: order._id,
            orderNumber: order.orderNumber,
            user: order.user,
            orderItems: sellerItems,
            totalPrice,
            orderStatus: order.orderStatus,
            paymentInfo: order.paymentInfo,
            createdAt: order.createdAt
          };
        })
      });
    } else if (req.user.role === 'admin') {
      const users = await User.countDocuments();
      const products = await Product.countDocuments();
      const orders = await Order.countDocuments();
      const totalRevenue = await Order.aggregate([
        { $match: { 'paymentInfo.status': 'completed' } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
      ]);

      res.json({
        success: true,
        stats: {
          totalUsers: users,
          totalProducts: products,
          totalOrders: orders,
          totalRevenue: totalRevenue[0]?.total || 0
        }
      });
    } else {
      const orders = await Order.countDocuments({ user: req.user._id });
      res.json({
        success: true,
        stats: {
          totalOrders: orders
        }
      });
    }
  } catch (error) {
    next(error);
  }
});

export default router;
