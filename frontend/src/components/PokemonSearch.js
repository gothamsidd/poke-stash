import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '../utils/apiConfig';
import './PokemonSearch.css';

const PokemonSearch = ({ onSelectPokemon, selectedPokemon }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(selectedPokemon || null);
  const [showDropdown, setShowDropdown] = useState(false);

  const searchPokemon = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/pokemon/search?q=${searchQuery}&limit=10`);
      setResults(res.data.pokemon);
      setShowDropdown(true);
    } catch (error) {
      console.error('Error searching Pokemon:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (searchQuery.length > 2) {
      const timeoutId = setTimeout(() => {
        searchPokemon();
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setResults([]);
    }
  }, [searchQuery, searchPokemon]);

  const handleSelect = (pokemon) => {
    setSelected(pokemon);
    setSearchQuery(pokemon.name);
    setShowDropdown(false);
    if (onSelectPokemon) {
      onSelectPokemon({
        pokemonName: pokemon.name,
        pokemonNumber: pokemon.pokedexNumber,
        generation: pokemon.generation
      });
    }
  };

  const handleClear = () => {
    setSelected(null);
    setSearchQuery('');
    setResults([]);
    if (onSelectPokemon) {
      onSelectPokemon(null);
    }
  };

  return (
    <div className="pokemon-search">
      <label>Search Pokemon</label>
      <div className="search-input-wrapper">
        <input
          type="text"
          placeholder="Type Pokemon name (e.g., Pikachu, Charizard)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
        />
        {selected && (
          <button onClick={handleClear} className="clear-btn">×</button>
        )}
      </div>

      {loading && <div className="search-loading">Searching...</div>}

      {showDropdown && results.length > 0 && (
        <div className="pokemon-dropdown">
          {results.map((pokemon) => (
            <div
              key={pokemon.id}
              className={`pokemon-option ${selected?.id === pokemon.id ? 'selected' : ''}`}
              onClick={() => handleSelect(pokemon)}
            >
              <img
                src={pokemon.sprites.front_default || pokemon.sprites.official_artwork}
                alt={pokemon.name}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/96';
                }}
              />
              <div className="pokemon-info">
                <div className="pokemon-name-row">
                  <span className="pokemon-name">{pokemon.name}</span>
                  <span className="pokedex-number">#{pokemon.pokedexNumber}</span>
                </div>
                <div className="pokemon-meta">
                  <span className="generation">Gen {pokemon.generation}</span>
                  <span className="types">
                    {pokemon.types.join(', ')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="selected-pokemon">
          <div className="selected-pokemon-card">
            <img
              src={selected.sprites?.front_default || selected.sprites?.official_artwork}
              alt={selected.name}
            />
            <div>
              <h4>{selected.name}</h4>
              <p>Pokedex #{selected.pokedexNumber} • Gen {selected.generation}</p>
              <p className="types">{selected.types?.join(', ')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PokemonSearch;
