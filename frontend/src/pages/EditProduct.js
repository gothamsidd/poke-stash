import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { ToastContext } from '../context/ToastContext';
import { API_URL } from '../utils/apiConfig';
import PokemonSearch from '../components/PokemonSearch';
import { getImageUrl } from '../utils/imageHelper';
import './AddProduct.css';
import './DarkModeAddProduct.css';

const EditProduct = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const { success, error: showError } = useContext(ToastContext);
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
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || (user.role !== 'seller' && user.role !== 'admin')) {
      navigate('/dashboard');
      return;
    }
    fetchProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user, navigate]);

  const fetchProduct = async () => {
    try {
      const res = await axios.get(`${API_URL}/products/${id}`);
      const product = res.data.product;

      // Check if user owns the product
      const sellerId = product.seller?._id || product.seller;
      if (sellerId && sellerId.toString() !== user._id && user.role !== 'admin') {
        navigate('/dashboard');
        return;
      }

      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price || '',
        originalPrice: product.originalPrice || '',
        category: product.category || 'pokemon',
        stock: product.stock || '',
        rarity: product.rarity || 'common',
        pokemonName: product.pokemonName || '',
        pokemonNumber: product.pokemonNumber || '',
        generation: product.generation || '',
        material: product.material || 'vinyl',
        dimensions: product.dimensions || { width: '', height: '' }
      });
      setExistingImages(product.images || []);
    } catch (error) {
      console.error('Error fetching product:', error);
      setError('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

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
    const totalImages = existingImages.length + files.length;
    
    if (totalImages > 2) {
      setError(`Maximum 2 images allowed. You have ${existingImages.length} existing image(s) and trying to add ${files.length}. Total would be ${totalImages}.`);
      e.target.value = '';
      setNewImages([]);
      return;
    }
    
    if (files.length > 2) {
      setError('Maximum 2 images allowed');
      e.target.value = '';
      setNewImages([]);
      return;
    }
    
    setNewImages(files);
    setError('');
  };

  const handleRemoveExistingImage = (index) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
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
    setSaving(true);

    if (existingImages.length === 0 && newImages.length === 0) {
      setError('Please keep at least one product image');
      setSaving(false);
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

      // Send remaining existing images
      formDataToSend.append('existingImages', JSON.stringify(existingImages));

      newImages.forEach((image) => {
        formDataToSend.append('images', image);
      });

      await axios.put(`${API_URL}/products/${id}`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      success('Product updated successfully!');
      navigate('/dashboard');
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to update product';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="add-product-page">
        <div className="container">
          <div className="loading">Loading product...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="add-product-page">
      <div className="container">
        <h1>Edit Product</h1>
        
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
            
            {existingImages.length > 0 && (
              <div className="existing-images">
                <label>Current Images</label>
                <div className="image-preview">
                  {existingImages.map((image, idx) => (
                    <div key={idx} className="image-preview-item">
                      <img
                        src={getImageUrl(image)}
                        alt={`Current ${idx + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingImage(idx)}
                        className="remove-image-btn"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Add New Images (Max 2 images)</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
              />
              <small>Upload 1-2 new images to add to existing ones</small>
              {newImages.length > 0 && (
                <div className="image-preview">
                  {Array.from(newImages).map((file, idx) => (
                    <img
                      key={idx}
                      src={URL.createObjectURL(file)}
                      alt={`New ${idx + 1}`}
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
              disabled={saving}
              className="btn btn-primary"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProduct;
