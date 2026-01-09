import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.model.js';

dotenv.config();

// Update all product prices to be in 10-99 range
const updatePrices = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pokemon_stickers');
    console.log('✅ Connected to MongoDB');

    const products = await Product.find({});
    console.log(`\n📦 Found ${products.length} products to update...\n`);

    let updated = 0;
    let skipped = 0;

    for (const product of products) {
      let newPrice = product.price;

      // If product has pokemonData, recalculate price
      if (product.pokemonData && product.pokemonData.powerLevel) {
        let price = 20; // base price
        
        // Price by power level (scaled to 10-99 range)
        if (product.pokemonData.powerLevel === 'legendary') price = 85;
        else if (product.pokemonData.powerLevel === 'very-strong') price = 70;
        else if (product.pokemonData.powerLevel === 'strong') price = 55;
        else if (product.pokemonData.powerLevel === 'average') price = 40;
        else price = 25;

        // Add premium for high total stats
        if (product.pokemonData.baseStats?.total >= 600) price += 14;
        else if (product.pokemonData.baseStats?.total >= 550) price += 10;
        else if (product.pokemonData.baseStats?.total >= 500) price += 7;
        else if (product.pokemonData.baseStats?.total >= 450) price += 4;

        // Premium for legendary/mythical
        if (product.pokemonData.isLegendary) price += 10;
        if (product.pokemonData.isMythical) price += 8;

        // Premium for Generation 1 (vintage)
        if (product.generation === 1) price += 3;

        // Ensure price is within 10-99 range
        newPrice = Math.max(10, Math.min(99, Math.round(price)));
      } else {
        // For products without pokemonData, scale existing price to 10-99
        // Find max price in database
        const maxPrice = await Product.findOne().sort({ price: -1 }).select('price');
        if (maxPrice && maxPrice.price > 99) {
          // Scale proportionally
          const scale = 89 / (maxPrice.price - 10); // 89 is the range (99-10)
          newPrice = Math.round(10 + (product.price - 10) * scale);
          newPrice = Math.max(10, Math.min(99, newPrice));
        } else if (product.price > 99) {
          newPrice = 99;
        } else if (product.price < 10) {
          newPrice = 10;
        }
      }

      // Ensure price is strictly within 10-99 range
      newPrice = Math.max(10, Math.min(99, newPrice));

      const oldPrice = product.price;
      if (newPrice !== oldPrice) {
        product.price = newPrice;
        product.originalPrice = Math.max(10, Math.min(99, Math.round(newPrice * 1.2)));
        await product.save();
        updated++;
        console.log(`✅ Updated ${product.name}: ₹${newPrice} (was ₹${oldPrice})`);
      } else {
        skipped++;
      }
    }

    console.log(`\n\n✅ Price update complete!`);
    console.log(`   Updated: ${updated} products`);
    console.log(`   Skipped: ${skipped} products (already in range)`);
    console.log(`\n🎉 All prices are now in ₹10-₹99 range!\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Update error:', error);
    process.exit(1);
  }
};

updatePrices();
