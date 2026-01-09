import express from 'express';
import { body, validationResult, query } from 'express-validator';
import Product from '../models/Product.model.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/products');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// @route   GET /api/products
// @desc    Get all products with filters
// @access  Public
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('category').optional().isString(),
  query('rarity').optional().isString(),
  query('generation').optional().isInt({ min: 1, max: 9 }),
  query('search').optional().isString(),
  query('powerLevel').optional().isIn(['weak', 'average', 'strong', 'very-strong', 'legendary']),
  query('sort').optional().isIn(['price-asc', 'price-desc', 'newest', 'rating', 'popular', 'stock-asc', 'stock-desc'])
], async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = { status: 'active' };
    
    if (req.query.category) {
      filter.category = req.query.category;
    }
    
    if (req.query.rarity) {
      filter.rarity = req.query.rarity;
    }
    
    if (req.query.generation) {
      filter.generation = parseInt(req.query.generation);
    }
    
    if (req.query.seller) {
      filter.seller = req.query.seller;
    }
    
    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }

    // Filter by power level
    if (req.query.powerLevel) {
      filter['pokemonData.powerLevel'] = req.query.powerLevel;
    }

    // Build sort
    let sort = {};
    switch (req.query.sort) {
      case 'price-asc':
        sort = { price: 1 };
        break;
      case 'price-desc':
        sort = { price: -1 };
        break;
      case 'stock-asc':
        sort = { stock: 1 };
        break;
      case 'stock-desc':
        sort = { stock: -1 };
        break;
      case 'newest':
        sort = { createdAt: -1 };
        break;
      case 'rating':
        sort = { 'rating.average': -1 };
        break;
      case 'popular':
        sort = { salesCount: -1 };
        break;
      default:
        sort = { createdAt: -1 };
    }

    const products = await Product.find(filter)
      .populate('seller', 'name sellerInfo.shopName')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(filter);

    res.json({
      success: true,
      count: products.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      products
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/products/:id
// @desc    Get single product
// @access  Public
router.get('/:id', async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('seller', 'name sellerInfo.shopName sellerInfo.rating');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      product
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/products
// @desc    Create new product
// @access  Private (Seller/Admin)
router.post('/', protect, authorize('seller', 'admin'), upload.array('images', 2), [
  body('name').notEmpty().withMessage('Product name is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
  body('category').isIn(['pokemon', 'pokemon-go', 'anime', 'vintage', 'holo', 'rare', 'starter', 'legendary', 'custom', 'bundle']).withMessage('Valid category is required'),
  body('stock').isInt({ min: 0 }).withMessage('Valid stock quantity is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one product image is required'
      });
    }

    const images = req.files.map(file => `/uploads/products/${file.filename}`);

    const productData = {
      ...req.body,
      images,
      seller: req.user._id,
      price: parseFloat(req.body.price),
      stock: parseInt(req.body.stock),
      pokemonNumber: req.body.pokemonNumber ? parseInt(req.body.pokemonNumber) : undefined,
      generation: req.body.generation ? parseInt(req.body.generation) : undefined
    };

    const product = await Product.create(productData);

    res.status(201).json({
      success: true,
      product
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private (Seller/Admin)
router.put('/:id', protect, authorize('seller', 'admin'), upload.array('images', 2), async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if user owns the product or is admin
    if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this product'
      });
    }

    // Handle existing images (if provided, replace all images)
    let finalImages = [...product.images]; // Start with current images
    
    if (req.body.existingImages) {
      try {
        const existingImages = typeof req.body.existingImages === 'string' 
          ? JSON.parse(req.body.existingImages) 
          : req.body.existingImages;
        finalImages = existingImages; // Replace with provided existing images
      } catch (e) {
        // If parsing fails, keep existing images
      }
    }

    // Handle new images (add to existing)
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => `/uploads/products/${file.filename}`);
      const totalImages = finalImages.length + newImages.length;
      
      // Validate total image count doesn't exceed 2
      if (totalImages > 2) {
        return res.status(400).json({
          success: false,
          message: `Maximum 2 images allowed. You have ${finalImages.length} existing image(s) and trying to add ${newImages.length}. Total would be ${totalImages}.`
        });
      }
      
      finalImages = [...finalImages, ...newImages];
    }

    // Final validation: ensure at least 1 image
    if (finalImages.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one product image is required'
      });
    }

    product.images = finalImages;

    // Update other fields (exclude images and existingImages)
    Object.keys(req.body).forEach(key => {
      if (key !== 'images' && key !== 'existingImages') {
        if (key === 'price' || key === 'stock' || key === 'pokemonNumber' || key === 'generation') {
          const numValue = parseFloat(req.body[key]) || parseInt(req.body[key]);
          if (!isNaN(numValue)) {
            product[key] = numValue;
          }
        } else if (key === 'dimensions') {
          // Handle dimensions if it's a JSON string
          try {
            product[key] = typeof req.body[key] === 'string' 
              ? JSON.parse(req.body[key]) 
              : req.body[key];
          } catch (e) {
            // If parsing fails, skip
          }
        } else {
          product[key] = req.body[key];
        }
      }
    });

    await product.save();

    res.json({
      success: true,
      product
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete product
// @access  Private (Seller/Admin)
router.delete('/:id', protect, authorize('seller', 'admin'), async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if user owns the product or is admin
    if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this product'
      });
    }

    await product.deleteOne();

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
