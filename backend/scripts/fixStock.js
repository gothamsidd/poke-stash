import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.model.js';

dotenv.config();

const fixStock = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pokemon_stickers');
    console.log('✅ Connected to MongoDB');

    // Find all products with 0 stock
    const productsWithZeroStock = await Product.find({ stock: 0, status: 'active' });
    console.log(`\n📦 Found ${productsWithZeroStock.length} products with 0 stock\n`);

    if (productsWithZeroStock.length === 0) {
      console.log('✅ All products have stock!');
      await mongoose.disconnect();
      return;
    }

    let updated = 0;
    for (const product of productsWithZeroStock) {
      // Set random stock between 10-60
      const newStock = Math.floor(Math.random() * 50) + 10;
      product.stock = newStock;
      await product.save();
      updated++;
      console.log(`✅ Updated ${product.name}: stock=${newStock}`);
    }

    console.log(`\n\n✅ Stock fix complete!`);
    console.log(`   Updated: ${updated} products`);
    console.log(`\n🎉 All products now have stock!\n`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Fix error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

fixStock();
