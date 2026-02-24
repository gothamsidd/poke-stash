import mongoose from 'mongoose';
import dotenv from 'dotenv';
import axios from 'axios';
import crypto from 'crypto';
import Product from '../models/Product.model.js';
import User from '../models/User.model.js';

dotenv.config();

const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2';

// All Pokemon from PokeAPI (IDs 1-1025) = 1000+ stickers
const MAX_POKEMON_ID = 1025;
const POPULAR_POKEMON = Array.from({ length: MAX_POKEMON_ID }, (_, i) => i + 1);

// Fetch Pokemon data from PokeAPI with enhanced details
const getPokemonData = async (pokemonId) => {
  try {
    const response = await axios.get(`${POKEAPI_BASE_URL}/pokemon/${pokemonId}`);
    const pokemon = response.data;

    // Get species data for flavor text and legendary status
    const speciesResponse = await axios.get(`${POKEAPI_BASE_URL}/pokemon-species/${pokemonId}`);
    const species = speciesResponse.data;

    // Determine generation
    let generation = 1;
    if (pokemon.id > 905) generation = 9;
    else if (pokemon.id > 809) generation = 8;
    else if (pokemon.id > 721) generation = 7;
    else if (pokemon.id > 649) generation = 6;
    else if (pokemon.id > 493) generation = 5;
    else if (pokemon.id > 386) generation = 4;
    else if (pokemon.id > 251) generation = 3;
    else if (pokemon.id > 151) generation = 2;

    // Get stats
    const stats = pokemon.stats.reduce((acc, stat) => {
      acc[stat.stat.name.replace('-', '')] = stat.base_stat;
      return acc;
    }, {});
    
    const totalStats = Object.values(stats).reduce((sum, val) => sum + (val || 0), 0);

    // Determine power level based on total stats
    let powerLevel = 'average';
    if (totalStats >= 600) powerLevel = 'legendary';
    else if (totalStats >= 500) powerLevel = 'very-strong';
    else if (totalStats >= 400) powerLevel = 'strong';
    else if (totalStats >= 300) powerLevel = 'average';
    else powerLevel = 'weak';

    // Override for legendary/mythical
    if (species.is_legendary || species.is_mythical) {
      powerLevel = 'legendary';
    }

    // Determine rarity
    let rarity = 'common';
    if (species.is_legendary || species.is_mythical) {
      rarity = 'legendary';
    } else if (totalStats >= 550) {
      rarity = 'ultra-rare';
    } else if (totalStats >= 450 || pokemon.id <= 151) {
      rarity = 'rare';
    } else if (pokemon.id <= 251) {
      rarity = 'uncommon';
    }

    // Get flavor text
    const flavorText = species.flavor_text_entries
      .find(entry => entry.language.name === 'en')?.flavor_text || '';

    // Get abilities
    const abilities = pokemon.abilities.map(a => a.ability.name);

    // Get types
    const types = pokemon.types.map(t => t.type.name);

    return {
      id: pokemon.id,
      name: pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1),
      pokedexNumber: pokemon.id,
      generation,
      types,
      abilities,
      stats: {
        hp: stats.hp || 0,
        attack: stats.attack || 0,
        defense: stats.defense || 0,
        specialAttack: stats.specialattack || 0,
        specialDefense: stats.specialdefense || 0,
        speed: stats.speed || 0,
        total: totalStats
      },
      baseExperience: pokemon.base_experience || 0,
      height: pokemon.height / 10, // meters
      weight: pokemon.weight / 10, // kg
      sprites: {
        front_default: pokemon.sprites.front_default,
        front_shiny: pokemon.sprites.front_shiny,
        official_artwork: pokemon.sprites.other?.['official-artwork']?.front_default,
        dream_world: pokemon.sprites.other?.dream_world?.front_default
      },
      isLegendary: species.is_legendary || false,
      isMythical: species.is_mythical || false,
      flavorText: flavorText.replace(/\f/g, ' ').trim(),
      rarity,
      powerLevel
    };
  } catch (error) {
    console.error(`Error fetching Pokemon ${pokemonId}:`, error.message);
    return null;
  }
};

// Create product from Pokemon data with enhanced details
const createPokemonProduct = async (pokemonData, sellerId) => {
  try {
    // Check if product already exists
    const existing = await Product.findOne({ 
      pokemonNumber: pokemonData.pokedexNumber,
      seller: sellerId
    });

    if (existing) {
      // Update existing product with pokemonData if missing
      if (!existing.pokemonData) {
        existing.pokemonData = {
          types: pokemonData.types,
          abilities: pokemonData.abilities,
          baseStats: pokemonData.stats,
          baseExperience: pokemonData.baseExperience,
          height: pokemonData.height,
          weight: pokemonData.weight,
          isLegendary: pokemonData.isLegendary,
          isMythical: pokemonData.isMythical,
          powerLevel: pokemonData.powerLevel
        };
        // Update price to new range
        let price = 20;
        if (pokemonData.powerLevel === 'legendary') price = 85;
        else if (pokemonData.powerLevel === 'very-strong') price = 70;
        else if (pokemonData.powerLevel === 'strong') price = 55;
        else if (pokemonData.powerLevel === 'average') price = 40;
        else price = 25;
        if (pokemonData.stats.total >= 600) price += 14;
        else if (pokemonData.stats.total >= 550) price += 10;
        else if (pokemonData.stats.total >= 500) price += 7;
        else if (pokemonData.stats.total >= 450) price += 4;
        if (pokemonData.isLegendary) price += 10;
        if (pokemonData.isMythical) price += 8;
        if (pokemonData.generation === 1) price += 3;
        existing.price = Math.max(10, Math.min(99, Math.round(price)));
        existing.originalPrice = Math.max(10, Math.min(99, Math.round(existing.price * 1.2)));
        
        // Preserve stock - only set if it's 0
        if (existing.stock === 0 || !existing.stock) {
          existing.stock = Math.floor(Math.random() * 50) + 10; // Random stock 10-60
        }
        
        await existing.save();
        console.log(`✅ Updated existing: ${pokemonData.name} with pokemonData | ₹${existing.price} | Stock: ${existing.stock}`);
        return existing;
      } else {
        // Even if pokemonData exists, ensure stock is set if it's 0
        if (existing.stock === 0 || !existing.stock) {
          existing.stock = Math.floor(Math.random() * 50) + 10;
          await existing.save();
          console.log(`✅ Updated stock for ${pokemonData.name}: ${existing.stock}`);
        }
        console.log(`⚠️  Product for ${pokemonData.name} already exists with pokemonData, skipping...`);
        return existing;
      }
    }

    // Determine category
    let category = 'pokemon';
    if (pokemonData.generation === 1 && pokemonData.pokedexNumber <= 151) {
      category = 'vintage';
    }
    if (pokemonData.isLegendary || pokemonData.isMythical) {
      category = 'legendary';
    }
    if ([1, 4, 7, 152, 155, 158, 252, 255, 258, 387, 390, 393, 495, 498, 501, 650, 653, 656, 722, 725, 728, 810, 813, 816, 906, 909, 912].includes(pokemonData.pokedexNumber)) {
      category = 'starter';
    }

    // Enhanced description with power and stats
    const powerEmoji = {
      'weak': '⚡',
      'average': '🔥',
      'strong': '💪',
      'very-strong': '⚔️',
      'legendary': '👑'
    };

    const powerText = {
      'weak': 'Basic Power',
      'average': 'Moderate Power',
      'strong': 'High Power',
      'very-strong': 'Very High Power',
      'legendary': 'Legendary Power'
    };

    const description = `${pokemonData.flavorText || `A ${pokemonData.types.join('/')} type Pokemon from Generation ${pokemonData.generation}.`}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 POKEDEX ENTRY #${pokemonData.pokedexNumber}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${powerEmoji[pokemonData.powerLevel]} POWER LEVEL: ${powerText[pokemonData.powerLevel].toUpperCase()}
${pokemonData.isLegendary ? '🌟 LEGENDARY POKEMON' : ''}
${pokemonData.isMythical ? '✨ MYTHICAL POKEMON' : ''}

📋 TYPE: ${pokemonData.types.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(' / ')}
🎯 GENERATION: ${pokemonData.generation}
📏 SIZE: ${pokemonData.height}m tall | ${pokemonData.weight}kg weight
⭐ BASE EXP: ${pokemonData.baseExperience}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚔️ BASE STATS (Total: ${pokemonData.stats.total})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❤️  HP:           ${pokemonData.stats.hp}
⚔️  Attack:       ${pokemonData.stats.attack}
🛡️  Defense:      ${pokemonData.stats.defense}
✨ Special Atk:   ${pokemonData.stats.specialAttack}
🔰 Special Def:   ${pokemonData.stats.specialDefense}
💨 Speed:         ${pokemonData.stats.speed}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 ABILITIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${pokemonData.abilities.map(a => `• ${a.charAt(0).toUpperCase() + a.slice(1).replace('-', ' ')}`).join('\n')}

${pokemonData.stats.total >= 600 ? '🏆 EXCEPTIONAL STATS - This Pokemon has outstanding battle capabilities!' : ''}
${pokemonData.stats.total >= 500 && pokemonData.stats.total < 600 ? '💎 PREMIUM STATS - A powerful Pokemon with great potential!' : ''}`;

    // Use Pokemon images
    const images = [
      pokemonData.sprites.official_artwork || 
      pokemonData.sprites.front_default || 
      pokemonData.sprites.dream_world || 
      pokemonData.sprites.front_shiny
    ].filter(Boolean);

    // Enhanced pricing based on power level and stats (range: 10-99)
    let price = 20; // base price
    
    // Price by power level (scaled to 10-99 range)
    if (pokemonData.powerLevel === 'legendary') price = 85;
    else if (pokemonData.powerLevel === 'very-strong') price = 70;
    else if (pokemonData.powerLevel === 'strong') price = 55;
    else if (pokemonData.powerLevel === 'average') price = 40;
    else price = 25;

    // Add premium for high total stats
    if (pokemonData.stats.total >= 600) price += 14;
    else if (pokemonData.stats.total >= 550) price += 10;
    else if (pokemonData.stats.total >= 500) price += 7;
    else if (pokemonData.stats.total >= 450) price += 4;

    // Premium for legendary/mythical
    if (pokemonData.isLegendary) price += 10;
    if (pokemonData.isMythical) price += 8;

    // Premium for Generation 1 (vintage)
    if (pokemonData.generation === 1) price += 3;

    // Ensure price is within 10-99 range
    price = Math.max(10, Math.min(99, Math.round(price)));

    const product = await Product.create({
      name: `${pokemonData.name} Vinyl Sticker`,
      description,
      pokemonName: pokemonData.name,
      pokemonNumber: pokemonData.pokedexNumber,
      generation: pokemonData.generation,
      category,
      rarity: pokemonData.rarity,
      price: Math.max(10, Math.min(99, Math.round(price))), // Ensure 10-99 range
      originalPrice: Math.max(10, Math.min(99, Math.round(Math.min(99, price * 1.2)))), // 20% discount, capped at 99
      images: images,
      stock: Math.floor(Math.random() * 50) + 10, // Random stock 10-60
      seller: sellerId,
      status: 'active',
      material: 'vinyl',
      dimensions: {
        width: 5 + Math.random() * 3, // 5-8 cm
        height: 5 + Math.random() * 3
      },
      pokemonData: {
        types: pokemonData.types,
        abilities: pokemonData.abilities,
        baseStats: pokemonData.stats,
        baseExperience: pokemonData.baseExperience,
        height: pokemonData.height,
        weight: pokemonData.weight,
        isLegendary: pokemonData.isLegendary,
        isMythical: pokemonData.isMythical,
        powerLevel: pokemonData.powerLevel
      },
      tags: [
        pokemonData.name.toLowerCase(),
        ...pokemonData.types,
        `gen${pokemonData.generation}`,
        pokemonData.rarity,
        pokemonData.powerLevel,
        pokemonData.isLegendary ? 'legendary' : '',
        pokemonData.isMythical ? 'mythical' : '',
        pokemonData.stats.total >= 600 ? 'exceptional' : '',
        pokemonData.stats.total >= 500 ? 'premium' : ''
      ].filter(Boolean),
      featured: pokemonData.isLegendary || pokemonData.isMythical || pokemonData.pokedexNumber <= 10 || pokemonData.stats.total >= 600
    });

    console.log(`✅ Created: ${pokemonData.name} | Power: ${pokemonData.powerLevel} | Stats: ${pokemonData.stats.total} | ₹${product.price}`);
    return product;
  } catch (error) {
    console.error(`❌ Error creating product for ${pokemonData.name}:`, error.message);
    return null;
  }
};

// Main seed function
const seedPokemon = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pokemon_stickers');
    console.log('✅ Connected to MongoDB');

    // Get or create default seller user (if needed for products)
    let seller = await User.findOne({ role: 'seller' });
    if (!seller) {
      seller = await User.findOne({ role: 'admin' });
    }
    if (!seller) {
      // Create a default seller for products (no default credentials provided)
      seller = await User.create({
        name: 'Pokemon Store',
        email: `seller-${Date.now()}@pokestash.com`,
        password: crypto.randomBytes(16).toString('hex'),
        role: 'seller'
      });
      console.log('✅ Created default seller account for products');
    }

    // Get or create default customer user
    let customer = await User.findOne({ email: 'customer@pokestash.com' });
    if (!customer) {
      customer = await User.create({
        name: 'Test Customer',
        email: 'customer@pokestash.com',
        password: 'customer123',
        role: 'customer'
      });
      console.log('✅ Created default customer account');
    } else {
      // Update password if user exists (to ensure it's correct)
      customer.password = 'customer123';
      await customer.save();
      console.log('✅ Updated test customer account password');
    }

    console.log(`\n🌱 Starting to seed ${POPULAR_POKEMON.length} Pokemon...\n`);
    console.log('This will take several minutes. Please wait...\n');

    let successCount = 0;
    let failCount = 0;
    let skipCount = 0;

    // Process Pokemon in batches to avoid rate limiting
    for (let i = 0; i < POPULAR_POKEMON.length; i++) {
      const pokemonId = POPULAR_POKEMON[i];
      
      const progress = `[${i + 1}/${POPULAR_POKEMON.length}]`;
      process.stdout.write(`\r${progress} Fetching Pokemon #${pokemonId}...`);
      
      const pokemonData = await getPokemonData(pokemonId);
      
      if (pokemonData) {
        const product = await createPokemonProduct(pokemonData, seller._id);
        if (product) {
          successCount++;
        } else {
          skipCount++;
        }
      } else {
        failCount++;
      }

      // Small delay to avoid rate limiting (reduced for faster seeding)
      if (i < POPULAR_POKEMON.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    console.log(`\n\n✅ Seeding complete!`);
    console.log(`   ✅ Successfully created: ${successCount} products`);
    console.log(`   ⚠️  Skipped (already exist): ${skipCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log(`\n🎉 Your Pokemon stickers store now has ${successCount} Pokemon with detailed stats and power levels!\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

// Run the seed
seedPokemon();
