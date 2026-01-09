import axios from 'axios';

const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2';

/**
 * Fetch Pokemon by name or ID
 */
export const getPokemonByNameOrId = async (nameOrId) => {
  try {
    const response = await axios.get(`${POKEAPI_BASE_URL}/pokemon/${nameOrId.toLowerCase()}`);
    return formatPokemonData(response.data);
  } catch (error) {
    throw new Error(`Pokemon not found: ${nameOrId}`);
  }
};

/**
 * Search Pokemon by name (partial match)
 */
export const searchPokemon = async (query, limit = 20) => {
  try {
    // Get list of all Pokemon
    const response = await axios.get(`${POKEAPI_BASE_URL}/pokemon?limit=1000`);
    const allPokemon = response.data.results;
    
    // Filter by query
    const filtered = allPokemon.filter(pokemon => 
      pokemon.name.toLowerCase().includes(query.toLowerCase())
    ).slice(0, limit);
    
    // Fetch details for filtered Pokemon
    const pokemonDetails = await Promise.all(
      filtered.map(pokemon => getPokemonByNameOrId(pokemon.name))
    );
    
    return pokemonDetails;
  } catch (error) {
    throw new Error('Error searching Pokemon');
  }
};

/**
 * Format Pokemon data for our use case
 */
const formatPokemonData = (pokemonData) => {
  // Determine generation based on Pokedex number
  const id = pokemonData.id;
  let generation = 1;
  if (id > 905) generation = 9;
  else if (id > 809) generation = 8;
  else if (id > 721) generation = 7;
  else if (id > 649) generation = 6;
  else if (id > 493) generation = 5;
  else if (id > 386) generation = 4;
  else if (id > 251) generation = 3;
  else if (id > 151) generation = 2;

  return {
    id: pokemonData.id,
    name: capitalizeFirst(pokemonData.name),
    pokedexNumber: pokemonData.id,
    generation,
    types: pokemonData.types.map(t => capitalizeFirst(t.type.name)),
    abilities: pokemonData.abilities.map(a => capitalizeFirst(a.ability.name)),
    height: pokemonData.height / 10, // Convert to meters
    weight: pokemonData.weight / 10, // Convert to kg
    sprites: {
      front_default: pokemonData.sprites.front_default,
      front_shiny: pokemonData.sprites.front_shiny,
      official_artwork: pokemonData.sprites.other?.['official-artwork']?.front_default,
      dream_world: pokemonData.sprites.other?.dream_world?.front_default
    },
    stats: pokemonData.stats.map(stat => ({
      name: capitalizeFirst(stat.stat.name),
      base_stat: stat.base_stat
    })),
    isLegendary: pokemonData.species?.url ? false : false, // Would need species API call
    isMythical: false // Would need species API call
  };
};

/**
 * Get detailed Pokemon species data (includes legendary/mythical info)
 */
export const getPokemonSpecies = async (pokemonId) => {
  try {
    const response = await axios.get(`${POKEAPI_BASE_URL}/pokemon-species/${pokemonId}`);
    return {
      isLegendary: response.data.is_legendary,
      isMythical: response.data.is_mythical,
      generation: response.data.generation?.name || null,
      color: response.data.color?.name || null,
      habitat: response.data.habitat?.name || null,
      flavorText: response.data.flavor_text_entries
        .find(entry => entry.language.name === 'en')?.flavor_text || ''
    };
  } catch (error) {
    return null;
  }
};

/**
 * Helper function to capitalize first letter
 */
const capitalizeFirst = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

