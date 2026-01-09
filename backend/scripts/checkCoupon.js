import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Coupon from '../models/Coupon.model.js';

dotenv.config();

const checkCoupon = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce');
    console.log('✅ Connected to MongoDB\n');

    const coupon = await Coupon.findOne({ code: 'GOTHAMSIDD' });
    
    if (!coupon) {
      console.log('❌ Coupon GOTHAMSIDD not found');
      process.exit(1);
    }

    const now = new Date();
    
    console.log('📋 Coupon Details:');
    console.log('  Code:', coupon.code);
    console.log('  Is Active:', coupon.isActive);
    console.log('  Valid From:', coupon.validFrom);
    console.log('  Valid Until:', coupon.validUntil);
    console.log('  Current Date:', now);
    console.log('  Used Count:', coupon.usedCount);
    console.log('  Usage Limit:', coupon.usageLimit || 'Unlimited');
    console.log('');
    
    console.log('🔍 Validation Checks:');
    console.log('  Now >= ValidFrom:', now >= coupon.validFrom, `(${now.toISOString()} >= ${coupon.validFrom.toISOString()})`);
    console.log('  Now <= ValidUntil:', now <= coupon.validUntil, `(${now.toISOString()} <= ${coupon.validUntil.toISOString()})`);
    console.log('  Is Active:', coupon.isActive);
    console.log('');
    
    if (now < coupon.validFrom) {
      console.log('❌ Coupon is not yet valid');
    } else if (now > coupon.validUntil) {
      console.log('❌ Coupon has expired');
      const diff = now - coupon.validUntil;
      console.log(`   Expired ${Math.floor(diff / (1000 * 60 * 60 * 24))} days ago`);
    } else if (!coupon.isActive) {
      console.log('❌ Coupon is not active');
    } else {
      console.log('✅ Coupon is VALID and ready to use!');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkCoupon();
