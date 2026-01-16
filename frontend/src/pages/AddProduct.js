import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import PokemonSearch from '../components/PokemonSearch';
import './AddProduct.css';
import './DarkModeAddProduct.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const AddProduct = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    category: 'pokemon',
    stock: '',
    rarity: 'common',
    pokemonName: '',
    pokemonNumber: '',
    generation: '',
    material: 'vinyl',
    dimensions: { width: '', height: '' }
  });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'width' || name === 'height') {
      setFormData(prev => ({
        ...prev,
        dimensions: { ...prev.dimensions, [name]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 2) {
      setError('Maximum 2 images allowed');
      e.target.value = ''; // Reset input
      setImages([]);
      return;
    }
    setImages(files);
    setError(''); // Clear any previous error
  };

  const handlePokemonSelect = (pokemonData) => {
    if (pokemonData) {
      setFormData(prev => ({
        ...prev,
        pokemonName: pokemonData.pokemonName,
        pokemonNumber: pokemonData.pokemonNumber,
        generation: pokemonData.generation
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        pokemonName: '',
        pokemonNumber: '',
        generation: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (images.length === 0) {
      setError('Please upload at least one product image');
      setLoading(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      
      Object.keys(formData).forEach(key => {
        if (key === 'dimensions') {
          formDataToSend.append('dimensions', JSON.stringify(formData.dimensions));
        } else if (formData[key] !== '') {
          formDataToSend.append(key, formData[key]);
        }
      });

      images.forEach((image) => {
        formDataToSend.append('images', image);
      });

      await axios.post(`${API_URL}/products`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      navigate('/dashboard');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  if (!user || (user.role !== 'seller' && user.role !== 'admin')) {
    return (
      <div className="add-product-page">
        <div className="container">
          <div className="error">You don't have permission to add products</div>
        </div>
      </div>
    );
  }

  return (
    <div className="add-product-page">
      <div className="container">
        <h1>Add New Product</h1>
        
        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit} className="product-form">
          <div className="form-section">
            <h2>Pokemon Information</h2>
            <PokemonSearch onSelectPokemon={handlePokemonSelect} />
            
            {formData.pokemonName && (
              <div className="form-group">
                <label>Pokemon Name (auto-filled)</label>
                <input
                  type="text"
                  value={formData.pokemonName}
                  readOnly
                  className="readonly"
                />
              </div>
            )}
          </div>

          <div className="form-section">
            <h2>Product Details</h2>
            
            <div className="form-group">
              <label>Product Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="e.g., Pikachu Vinyl Sticker"
              />
            </div>

            <div className="form-group">
              <label>Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows="4"
                placeholder="Describe your sticker..."
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Price (₹) *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label>Original Price (₹) - Optional</label>
                <input
                  type="number"
                  name="originalPrice"
                  value={formData.originalPrice}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  <option value="pokemon">Pokemon</option>
                  <option value="pokemon-go">Pokemon GO</option>
                  <option value="anime">Anime</option>
                  <option value="vintage">Vintage</option>
                  <option value="holo">Holo</option>
                  <option value="rare">Rare</option>
                  <option value="starter">Starter</option>
                  <option value="legendary">Legendary</option>
                  <option value="custom">Custom</option>
                  <option value="bundle">Bundle</option>
                </select>
              </div>

              <div className="form-group">
                <label>Rarity *</label>
                <select
                  name="rarity"
                  value={formData.rarity}
                  onChange={handleChange}
                  required
                >
                  <option value="common">Common</option>
                  <option value="uncommon">Uncommon</option>
                  <option value="rare">Rare</option>
                  <option value="ultra-rare">Ultra Rare</option>
                  <option value="legendary">Legendary</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Stock Quantity *</label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  required
                  min="0"
                />
              </div>

              <div className="form-group">
                <label>Material</label>
                <input
                  type="text"
                  name="material"
                  value={formData.material}
                  onChange={handleChange}
                  placeholder="e.g., Vinyl"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Width (cm)</label>
                <input
                  type="number"
                  name="width"
                  value={formData.dimensions.width}
                  onChange={handleChange}
                  min="0"
                  step="0.1"
                />
              </div>

              <div className="form-group">
                <label>Height (cm)</label>
                <input
                  type="number"
                  name="height"
                  value={formData.dimensions.height}
                  onChange={handleChange}
                  min="0"
                  step="0.1"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>Product Images</h2>
            <div className="form-group">
              <label>Upload Images * (Max 2 images)</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                required
              />
              <small>Upload 1-2 images: Main product image and optional detail/back view</small>
              {images.length > 0 && (
                <div className="image-preview">
                  {Array.from(images).map((file, idx) => (
                    <img
                      key={idx}
                      src={URL.createObjectURL(file)}
                      alt={`Preview ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'Creating...' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;
