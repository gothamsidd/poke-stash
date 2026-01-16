import mongoose from 'mongoose';
import dotenv from 'dotenv';
import axios from 'axios';
import crypto from 'crypto';
import Product from '../models/Product.model.js';
import User from '../models/User.model.js';

dotenv.config();

const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2';

// Expanded list of Pokemon from all generations (200+ Pokemon)
const POPULAR_POKEMON = [
  // Generation 1 (Kanto) - Original 151
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
  21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
  41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60,
  61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80,
  81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100,
  101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120,
  121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140,
  141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151,
  // Generation 2 (Johto) - Popular ones
  152, 153, 154, 155, 156, 157, 158, 159, 160, 172, 173, 174, 175, 176, 196, 197, 198, 199, 200,
  201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220,
  221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240,
  241, 242, 243, 244, 245, 246, 247, 248, 249, 250, 251,
  // Generation 3 (Hoenn) - Popular ones
  252, 253, 254, 255, 256, 257, 258, 259, 260, 270, 271, 272, 273, 274, 275, 280, 281, 282, 290, 291,
  292, 296, 297, 302, 303, 304, 305, 306, 307, 308, 309, 310, 311, 312, 313, 314, 315, 316, 317, 318,
  319, 320, 321, 322, 323, 324, 325, 326, 327, 328, 329, 330, 331, 332, 333, 334, 335, 336, 337, 338,
  339, 340, 341, 342, 343, 344, 345, 346, 347, 348, 349, 350, 351, 352, 353, 354, 355, 356, 357, 358,
  359, 360, 361, 362, 363, 364, 365, 366, 367, 368, 369, 370, 371, 372, 373, 374, 375, 376, 377, 378,
  379, 380, 381, 382, 383, 384, 385, 386,
  // Generation 4 (Sinnoh) - Popular ones
  387, 388, 389, 390, 391, 392, 393, 394, 395, 396, 397, 398, 399, 400, 401, 402, 403, 404, 405, 406,
  407, 408, 409, 410, 411, 412, 413, 414, 415, 416, 417, 418, 419, 420, 421, 422, 423, 424, 425, 426,
  427, 428, 429, 430, 431, 432, 433, 434, 435, 436, 437, 438, 439, 440, 441, 442, 443, 444, 445, 446,
  447, 448, 449, 450, 451, 452, 453, 454, 455, 456, 457, 458, 459, 460, 461, 462, 463, 464, 465, 466,
  467, 468, 469, 470, 471, 472, 473, 474, 475, 476, 477, 478, 479, 480, 481, 482, 483, 484, 485, 486,
  487, 488, 489, 490, 491, 492, 493,
  // Generation 5 (Unova) - Popular ones
  494, 495, 496, 497, 498, 499, 500, 501, 502, 503, 504, 505, 506, 507, 508, 509, 510, 511, 512, 513,
  514, 515, 516, 517, 518, 519, 520, 521, 522, 523, 524, 525, 526, 527, 528, 529, 530, 531, 532, 533,
  534, 535, 536, 537, 538, 539, 540, 541, 542, 543, 544, 545, 546, 547, 548, 549, 550, 551, 552, 553,
  554, 555, 556, 557, 558, 559, 560, 561, 562, 563, 564, 565, 566, 567, 568, 569, 570, 571, 572, 573,
  574, 575, 576, 577, 578, 579, 580, 581, 582, 583, 584, 585, 586, 587, 588, 589, 590, 591, 592, 593,
  594, 595, 596, 597, 598, 599, 600, 601, 602, 603, 604, 605, 606, 607, 608, 609, 610, 611, 612, 613,
  614, 615, 616, 617, 618, 619, 620, 621, 622, 623, 624, 625, 626, 627, 628, 629, 630, 631, 632, 633,
  634, 635, 636, 637, 638, 639, 640, 641, 642, 643, 644, 645, 646, 647, 648, 649,
  // Generation 6 (Kalos) - Popular ones
  650, 651, 652, 653, 654, 655, 656, 657, 658, 659, 660, 661, 662, 663, 664, 665, 666, 667, 668, 669,
  670, 671, 672, 673, 674, 675, 676, 677, 678, 679, 680, 681, 682, 683, 684, 685, 686, 687, 688, 689,
  690, 691, 692, 693, 694, 695, 696, 697, 698, 699, 700, 701, 702, 703, 704, 705, 706, 707, 708, 709,
  710, 711, 712, 713, 714, 715, 716, 717, 718, 719, 720, 721,
  // Generation 7 (Alola) - Popular ones
  722, 723, 724, 725, 726, 727, 728, 729, 730, 731, 732, 733, 734, 735, 736, 737, 738, 739, 740, 741,
  742, 743, 744, 745, 746, 747, 748, 749, 750, 751, 752, 753, 754, 755, 756, 757, 758, 759, 760, 761,
  762, 763, 764, 765, 766, 767, 768, 769, 770, 771, 772, 773, 774, 775, 776, 777, 778, 779, 780, 781,
  782, 783, 784, 785, 786, 787, 788, 789, 790, 791, 792, 793, 794, 795, 796, 797, 798, 799, 800, 801,
  802, 807, 808, 809,
  // Generation 8 (Galar) - Popular ones
  810, 811, 812, 813, 814, 815, 816, 817, 818, 819, 820, 821, 822, 823, 824, 825, 826, 827, 828, 829,
  830, 831, 832, 833, 834, 835, 836, 837, 838, 839, 840, 841, 842, 843, 844, 845, 846, 847, 848, 849,
  850, 851, 852, 853, 854, 855, 856, 857, 858, 859, 860, 861, 862, 863, 864, 865, 866, 867, 868, 869,
  870, 871, 872, 873, 874, 875, 876, 877, 878, 879, 880, 881, 882, 883, 884, 885, 886, 887, 888, 889,
  890, 891, 892, 893, 894, 895, 896, 897, 898,
  // Generation 9 (Paldea) - Popular ones
  906, 907, 908, 909, 910, 911, 912, 913, 914, 915, 916, 917, 918, 919, 920, 921, 922, 923, 924, 925,
  926, 927, 928, 929, 930, 931, 932, 933, 934, 935, 936, 937, 938, 939, 940, 941, 942, 943, 944, 945,
  946, 947, 948, 949, 950, 951, 952, 953, 954, 955, 956, 957, 958, 959, 960, 961, 962, 963, 964, 965,
  966, 967, 968, 969, 970, 971, 972, 973, 974, 975, 976, 977, 978, 979, 980, 981, 982, 983, 984, 985,
  986, 987, 988, 989, 990, 991, 992, 993, 994, 995, 996, 997, 998, 999, 1000, 1001, 1002, 1003, 1004, 1005,
  1006, 1007, 1008, 1009, 1010, 1011, 1012, 1013, 1014, 1015, 1016, 1017, 1018, 1019, 1020, 1021, 1022, 1023, 1024, 1025
];

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
