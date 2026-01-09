import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from '../models/Order.model.js';

// Load environment variables
dotenv.config();

const fixOrderStatus = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pokemon_stickers');
    console.log('✅ Connected to MongoDB');

    // Find all orders where payment is completed but order status is not 'delivered'
    const ordersToFix = await Order.find({
      'paymentInfo.status': 'completed',
      orderStatus: { $ne: 'delivered' }
    });

    console.log(`\n📋 Found ${ordersToFix.length} orders to fix\n`);

    if (ordersToFix.length === 0) {
      console.log('✅ All orders are already in correct status!');
      await mongoose.disconnect();
      return;
    }

    // Update each order
    let fixed = 0;
    for (const order of ordersToFix) {
      order.orderStatus = 'delivered';
      if (!order.deliveredAt) {
        order.deliveredAt = order.updatedAt || new Date();
      }
      await order.save();
      fixed++;
      console.log(`✅ Fixed Order #${order._id.toString().slice(-8)} - Status: ${order.orderStatus}`);
    }

    console.log(`\n✅ Successfully fixed ${fixed} orders!`);
    console.log('All paid orders are now marked as "delivered"\n');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error fixing order status:', error);
    process.exit(1);
  }
};

// Run the script
fixOrderStatus();
