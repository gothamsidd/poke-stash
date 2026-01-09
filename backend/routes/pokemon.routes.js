import express from 'express';
import {
  getPokemonByNameOrId,
  searchPokemon,
  getPokemonSpecies
} from '../utils/pokemonAPI.js';

const router = express.Router();

// @route   GET /api/pokemon/search
// @desc    Search Pokemon by name
// @access  Public
router.get('/search', async (req, res, next) => {
  try {
    const { q, limit } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const results = await searchPokemon(q, parseInt(limit) || 20);
    
    res.json({
      success: true,
      count: results.length,
      pokemon: results
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/pokemon/:nameOrId
// @desc    Get Pokemon by name or ID
// @access  Public
router.get('/:nameOrId', async (req, res, next) => {
  try {
    const { nameOrId } = req.params;
    const pokemon = await getPokemonByNameOrId(nameOrId);
    
    // Also fetch species data for legendary/mythical info
    const speciesData = await getPokemonSpecies(pokemon.id);
    if (speciesData) {
      pokemon.isLegendary = speciesData.isLegendary;
      pokemon.isMythical = speciesData.isMythical;
      pokemon.flavorText = speciesData.flavorText;
    }
    
    res.json({
      success: true,
      pokemon
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
