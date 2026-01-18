import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.model.js';

dotenv.config();

const fixTestAccount = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pokemon_stickers');
    console.log('✅ Connected to MongoDB');

    // Delete existing test customer account if it exists (to ensure clean state)
    await User.deleteOne({ email: 'customer@pokestash.com' });
    console.log('🗑️  Removed any existing test customer account');
    
    // Create fresh test customer account (password will be auto-hashed)
    const customer = await User.create({
      name: 'Test Customer',
      email: 'customer@pokestash.com',
      password: 'customer123',
      role: 'customer'
    });
    console.log('✅ Created test customer account');
    console.log('   Email: customer@pokestash.com');
    console.log('   Password: customer123');
    
    // Verify the password was hashed correctly
    const verifyCustomer = await User.findOne({ email: 'customer@pokestash.com' }).select('+password');
    if (!verifyCustomer) {
      console.error('❌ Failed to create customer account!');
      process.exit(1);
    }
    
    const passwordMatch = await verifyCustomer.comparePassword('customer123');
    if (passwordMatch) {
      console.log('✅ Password verification successful!');
    } else {
      console.error('❌ Password verification failed!');
      console.error('   This should not happen. Please check bcrypt configuration.');
    }

    // Delete and recreate seller account (if no other seller exists)
    const existingSellers = await User.find({ role: 'seller' });
    const otherSellers = existingSellers.filter(s => s.email !== 'seller@pokestash.com');
    
    if (otherSellers.length === 0) {
      // No other sellers, safe to delete and recreate test seller
      await User.deleteOne({ email: 'seller@pokestash.com' });
      const seller = await User.create({
        name: 'Test Seller',
        email: 'seller@pokestash.com',
        password: 'seller123',
        role: 'seller'
      });
      console.log('✅ Created test seller account');
      console.log('   Email: seller@pokestash.com');
      console.log('   Password: seller123');
    } else {
      console.log('ℹ️  Other seller accounts exist, skipping test seller creation');
    }

    console.log('\n✅ Test accounts are ready!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing test account:', error);
    process.exit(1);
  }
};

fixTestAccount();
