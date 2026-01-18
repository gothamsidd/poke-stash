import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { API_URL } from '../utils/apiConfig';
import './SearchAutocomplete.css';

const SearchAutocomplete = ({ value, onChange, onSelect }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (value && value.length > 2) {
      const fetchSuggestions = async () => {
        setLoading(true);
        try {
          const res = await axios.get(`${API_URL}/products?search=${value}&limit=5`);
          setSuggestions(res.data.products || []);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
        } finally {
          setLoading(false);
        }
      };

      const debounceTimer = setTimeout(fetchSuggestions, 300);
      return () => clearTimeout(debounceTimer);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [value]);

  const handleSelect = (product) => {
    if (onSelect) {
      onSelect(product);
    }
    setShowSuggestions(false);
  };

  return (
    <div className="search-autocomplete" ref={wrapperRef}>
      {showSuggestions && suggestions.length > 0 && (
        <div className="autocomplete-dropdown">
          {loading && <div className="autocomplete-loading">Searching...</div>}
          {suggestions.map(product => (
            <Link
              key={product._id}
              to={`/products/${product._id}`}
              className="autocomplete-item"
              onClick={() => handleSelect(product)}
            >
              <div className="autocomplete-image">
                {product.images && product.images[0] && (
                  <img src={product.images[0]} alt={product.name} />
                )}
              </div>
              <div className="autocomplete-info">
                <div className="autocomplete-name">{product.name}</div>
                <div className="autocomplete-price">₹{product.price}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchAutocomplete;
