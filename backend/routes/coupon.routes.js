import express from 'express';
import { body, validationResult } from 'express-validator';
import Coupon from '../models/Coupon.model.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// @route   POST /api/coupons/validate
// @desc    Validate coupon code
// @access  Public
router.post('/validate', [
  body('code').notEmpty().withMessage('Coupon code is required'),
  body('totalAmount').isFloat({ min: 0 }).withMessage('Valid total amount is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { code, totalAmount } = req.body;

    const coupon = await Coupon.findOne({ 
      code: code.toUpperCase().trim(),
      isActive: true
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired coupon code'
      });
    }

    // Check if coupon is still valid
    const now = new Date();
    // Add a small buffer to handle timezone differences (check if within 1 day of expiry)
    const validUntilWithBuffer = new Date(coupon.validUntil.getTime() + (24 * 60 * 60 * 1000));
    
    if (now < coupon.validFrom) {
      return res.status(400).json({
        success: false,
        message: 'Coupon is not yet valid'
      });
    }
    
    if (now > coupon.validUntil) {
      return res.status(400).json({
        success: false,
        message: 'Coupon has expired'
      });
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({
        success: false,
        message: 'Coupon usage limit reached'
      });
    }

    // Check minimum purchase amount
    if (totalAmount < coupon.minPurchaseAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum purchase amount of ₹${coupon.minPurchaseAmount} required`
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (totalAmount * coupon.discountValue) / 100;
      // Apply max discount limit if set
      if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
        discountAmount = coupon.maxDiscountAmount;
      }
    } else {
      discountAmount = coupon.discountValue;
      // Don't allow discount more than total amount
      if (discountAmount > totalAmount) {
        discountAmount = totalAmount;
      }
    }

    res.json({
      success: true,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: Math.round(discountAmount * 100) / 100
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/coupons
// @desc    Create new coupon (Admin)
// @access  Private (Admin)
router.post('/', protect, authorize('admin'), [
  body('code').notEmpty().withMessage('Coupon code is required'),
  body('discountType').isIn(['percentage', 'fixed']).withMessage('Invalid discount type'),
  body('discountValue').isFloat({ min: 0 }).withMessage('Valid discount value is required'),
  body('validUntil').isISO8601().withMessage('Valid expiration date is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const couponData = {
      ...req.body,
      code: req.body.code.toUpperCase().trim()
    };

    const coupon = await Coupon.create(couponData);

    res.status(201).json({
      success: true,
      coupon
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code already exists'
      });
    }
    next(error);
  }
});

// @route   GET /api/coupons
// @desc    Get all coupons (Admin)
// @access  Private (Admin)
router.get('/', protect, authorize('admin'), async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      count: coupons.length,
      coupons
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/coupons/:id
// @desc    Update coupon (Admin)
// @access  Private (Admin)
router.put('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    if (req.body.code) {
      req.body.code = req.body.code.toUpperCase().trim();
    }

    Object.assign(coupon, req.body);
    await coupon.save();

    res.json({
      success: true,
      coupon
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code already exists'
      });
    }
    next(error);
  }
});

// @route   DELETE /api/coupons/:id
// @desc    Delete coupon (Admin)
// @access  Private (Admin)
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    await coupon.deleteOne();

    res.json({
      success: true,
      message: 'Coupon deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
