import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from '../models/Order.model.js';
import User from '../models/User.model.js';

dotenv.config();

const checkOrder = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pokemon_stickers');
    console.log('✅ Connected to MongoDB\n');

    // Find user first
    const user = await User.findOne({ email: 'gothamsidd@gmail.com' });
    if (!user) {
      console.log('❌ User not found: gothamsidd@gmail.com');
      await mongoose.disconnect();
      return;
    }

    console.log(`📧 User found: ${user.email}\n`);

    // Get all orders for this user
    const allOrders = await Order.find({ user: user._id })
      .populate('orderItems.product', 'name price')
      .sort({ createdAt: -1 });

    console.log(`📦 Total orders for ${user.email}: ${allOrders.length}\n`);

    // Find the specific order
    const orderId = '8cb9fac0';
    const order = allOrders.find(o => o._id.toString().slice(-8) === orderId);

    if (order) {
      console.log(`📋 Order #${order._id.toString().slice(-8)}:`);
      console.log(`   User: ${order.user?.email || user.email}`);
      console.log(`   Order Status: ${order.orderStatus}`);
      console.log(`   Payment Status: ${order.paymentInfo?.status || 'pending'}`);
      console.log(`   Payment ID: ${order.paymentInfo?.razorpayPaymentId || 'None'}`);
      console.log(`   Razorpay Order ID: ${order.paymentInfo?.razorpayOrderId || 'None'}`);
      console.log(`   Created: ${order.createdAt}`);
      console.log(`   Total: ₹${order.totalPrice}`);
      console.log(`\n   Items:`);
      order.orderItems.forEach(item => {
        console.log(`     - ${item.name || item.product?.name}: Qty ${item.quantity}, ₹${item.price}`);
      });
      
      console.log(`\n🔍 REASON FOR PENDING:`);
      if (!order.paymentInfo?.razorpayPaymentId) {
        console.log(`   ❌ No payment ID - Payment was never completed`);
      }
      if (order.paymentInfo?.status !== 'completed') {
        console.log(`   ❌ Payment status is "${order.paymentInfo?.status || 'pending'}" - not completed`);
      }
      if (order.orderStatus === 'pending') {
        console.log(`   ❌ Order status is "pending" - payment verification never happened`);
      }
    } else {
      console.log(`❌ Order #${orderId} not found for this user\n`);
      console.log(`📦 All orders for ${user.email}:`);
      allOrders.forEach(o => {
        console.log(`\n   Order #${o._id.toString().slice(-8)}:`);
        console.log(`   Status: ${o.orderStatus}`);
        console.log(`   Payment: ${o.paymentInfo?.status || 'pending'}`);
        console.log(`   Payment ID: ${o.paymentInfo?.razorpayPaymentId || 'None'}`);
        console.log(`   Created: ${o.createdAt}`);
      });
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkOrder();
