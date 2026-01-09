import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Product from '../models/Product.model.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// @route   POST /api/ai/generate-description
// @desc    Generate product description using Gemini
// @access  Private (Seller/Admin)
router.post('/generate-description', protect, async (req, res, next) => {
  try {
    const { productName, pokemonName, category, rarity, price } = req.body;

    if (!productName) {
      return res.status(400).json({
        success: false,
        message: 'Product name is required'
      });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Write an engaging and detailed product description for a Pokemon sticker. 
    Product Name: ${productName}
    ${pokemonName ? `Pokemon: ${pokemonName}` : ''}
    Category: ${category || 'pokemon'}
    Rarity: ${rarity || 'common'}
    Price: ₹${price || 'N/A'}
    
    Make it exciting, highlight the Pokemon's characteristics, mention the quality of the sticker, and make it appealing to Pokemon fans. Keep it between 100-150 words.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const description = response.text();

    res.json({
      success: true,
      description
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/ai/recommendations/:productId
// @desc    Get AI-powered product recommendations
// @access  Public
router.get('/recommendations/:productId', async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Find similar products based on category, rarity, generation
    const similarProducts = await Product.find({
      _id: { $ne: product._id },
      status: 'active',
      $or: [
        { category: product.category },
        { rarity: product.rarity },
        { generation: product.generation },
        { pokemonName: product.pokemonName }
      ]
    })
      .limit(5)
      .populate('seller', 'name sellerInfo.shopName');

    // Use Gemini to generate personalized recommendation message
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `Based on a customer viewing a ${product.name} (${product.pokemonName || 'Pokemon'} sticker, ${product.rarity} rarity, ₹${product.price}), 
    write a short, friendly recommendation message (2-3 sentences) suggesting they might also like similar Pokemon stickers. 
    Make it engaging and Pokemon-themed.`;

    let recommendationText = '';
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      recommendationText = response.text();
    } catch (error) {
      recommendationText = 'You might also like these similar Pokemon stickers!';
    }

    res.json({
      success: true,
      recommendations: similarProducts,
      message: recommendationText
    });
  } catch (error) {
    next(error);
  }
});

export default router;
