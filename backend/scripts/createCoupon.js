import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Coupon from '../models/Coupon.model.js';

dotenv.config();

const createGothamSiddCoupon = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce');
    console.log('✅ Connected to MongoDB');

    // Check if coupon already exists
    const existingCoupon = await Coupon.findOne({ code: 'GOTHAMSIDD' });
    
    if (existingCoupon) {
      console.log('⚠️  Coupon GOTHAMSIDD already exists');
      console.log('   Updating existing coupon...');
      
      existingCoupon.discountType = 'percentage';
      existingCoupon.discountValue = 50;
      existingCoupon.isActive = true;
      // Set validUntil to end of 2026-12-31 (23:59:59) - one year from now
      const validUntil = new Date('2026-12-31T23:59:59.999Z');
      existingCoupon.validUntil = validUntil;
      existingCoupon.validFrom = new Date(); // Reset validFrom to now
      existingCoupon.usageLimit = null; // Unlimited uses
      existingCoupon.usedCount = 0;
      
      await existingCoupon.save();
      console.log('✅ Coupon GOTHAMSIDD updated successfully!');
    } else {
      // Create new coupon
      // Set validUntil to end of 2026-12-31 (23:59:59) - one year from now
      const validUntil = new Date('2026-12-31T23:59:59.999Z');
      
      const coupon = await Coupon.create({
        code: 'GOTHAMSIDD',
        discountType: 'percentage',
        discountValue: 50,
        minPurchaseAmount: 0,
        maxDiscountAmount: null,
        validFrom: new Date(),
        validUntil: validUntil,
        usageLimit: null, // Unlimited uses
        usedCount: 0,
        isActive: true,
        applicableTo: 'all'
      });

      console.log('✅ Coupon GOTHAMSIDD created successfully!');
      console.log('   Code: GOTHAMSIDD');
      console.log('   Discount: 50%');
      console.log('   Valid until: 2026-12-31');
      console.log('   Usage: Unlimited');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating coupon:', error);
    process.exit(1);
  }
};

createGothamSiddCoupon();
