import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { ToastContext } from '../context/ToastContext';
import { getImageUrl } from '../utils/imageHelper';
import './ProductDetail.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { success, error: showError } = useContext(ToastContext);
  const [product, setProduct] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    fetchProduct();
    fetchRecommendations();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const res = await axios.get(`${API_URL}/products/${id}`);
      setProduct(res.data.product);
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const res = await axios.get(`${API_URL}/ai/recommendations/${id}`);
      setRecommendations(res.data.recommendations);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setAddingToCart(true);
    try {
      await axios.post(`${API_URL}/users/cart`, {
        productId: id,
        quantity
      });
      success('Added to cart!');
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const generateDescription = async () => {
    try {
      const res = await axios.post(`${API_URL}/ai/generate-description`, {
        productName: product.name,
        pokemonName: product.pokemonName,
        category: product.category,
        rarity: product.rarity,
        price: product.price
      });
      setProduct(prev => ({ ...prev, aiDescription: res.data.description }));
    } catch (error) {
      console.error('Error generating description:', error);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!product) {
    return <div className="error">Product not found</div>;
  }

  return (
    <div className="product-detail">
      <div className="container">
        <div className="product-detail-layout">
          <div className="product-images">
            <div className="main-image">
              <img
                src={getImageUrl(product.images[selectedImage])}
                alt={product.name}
              />
            </div>
            {product.images.length > 1 && (
              <div className="thumbnail-images">
                {product.images.map((img, idx) => (
                  <img
                    key={idx}
                    src={getImageUrl(img)}
                    alt={`${product.name} ${idx + 1}`}
                    className={selectedImage === idx ? 'active' : ''}
                    onClick={() => setSelectedImage(idx)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="product-info-section">
            <h1>{product.name}</h1>
            {product.pokemonName && (
              <p className="pokemon-name">Pokemon: {product.pokemonName}</p>
            )}
            {product.pokemonNumber && (
              <p className="pokedex-number">Pokedex #{product.pokemonNumber}</p>
            )}

            <div className="product-badges">
              <span className={`badge badge-${product.rarity}`}>
                {product.rarity}
              </span>
              {product.generation && (
                <span className="badge badge-generation">
                  Gen {product.generation}
                </span>
              )}
              <span className="badge badge-category">{product.category}</span>
              {product.pokemonData?.powerLevel && (
                <span className={`badge badge-power badge-power-${product.pokemonData.powerLevel}`}>
                  {product.pokemonData.powerLevel === 'legendary' && '👑'}
                  {product.pokemonData.powerLevel === 'very-strong' && '⚔️'}
                  {product.pokemonData.powerLevel === 'strong' && '💪'}
                  {product.pokemonData.powerLevel === 'average' && '🔥'}
                  {product.pokemonData.powerLevel === 'weak' && '⚡'}
                  {' '}
                  {product.pokemonData.powerLevel.replace('-', ' ').toUpperCase()}
                </span>
              )}
            </div>

            <div className="price-section">
              {product.originalPrice && (
                <span className="original-price">₹{product.originalPrice}</span>
              )}
              <span className="current-price">₹{product.price}</span>
            </div>

            {product.rating.average > 0 && (
              <div className="rating-section">
                <span className="stars">⭐ {product.rating.average.toFixed(1)}</span>
                <span className="rating-count">({product.rating.count} reviews)</span>
              </div>
            )}

            <div className="description-section">
              <h3>Description</h3>
              <p>{product.description}</p>
              {product.aiDescription && (
                <div className="ai-description">
                  <h4>AI Enhanced Description</h4>
                  <p>{product.aiDescription}</p>
                </div>
              )}
              {user && (user.role === 'seller' || user.role === 'admin') && !product.aiDescription && (
                <button onClick={generateDescription} className="btn btn-secondary">
                  Generate AI Description
                </button>
              )}
            </div>

            {product.pokemonData && (
              <div className="pokemon-stats-section">
                <h3>⚔️ Pokemon Stats & Power</h3>
                {product.pokemonData.baseStats && (
                  <div className="stats-grid">
                    <div className="stat-item">
                      <span className="stat-label">❤️ HP</span>
                      <span className="stat-value">{product.pokemonData.baseStats.hp}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">⚔️ Attack</span>
                      <span className="stat-value">{product.pokemonData.baseStats.attack}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">🛡️ Defense</span>
                      <span className="stat-value">{product.pokemonData.baseStats.defense}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">✨ Sp. Atk</span>
                      <span className="stat-value">{product.pokemonData.baseStats.specialAttack}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">🔰 Sp. Def</span>
                      <span className="stat-value">{product.pokemonData.baseStats.specialDefense}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">💨 Speed</span>
                      <span className="stat-value">{product.pokemonData.baseStats.speed}</span>
                    </div>
                  </div>
                )}
                {product.pokemonData.baseStats?.total && (
                  <div className="total-stats">
                    <strong>Total Base Stats: {product.pokemonData.baseStats.total}</strong>
                  </div>
                )}
                {product.pokemonData.types && product.pokemonData.types.length > 0 && (
                  <div className="pokemon-types">
                    <strong>Types:</strong> {product.pokemonData.types.map(t => (
                      <span key={t} className="type-badge">{t}</span>
                    ))}
                  </div>
                )}
                {product.pokemonData.abilities && product.pokemonData.abilities.length > 0 && (
                  <div className="pokemon-abilities">
                    <strong>Abilities:</strong> {product.pokemonData.abilities.map(a => (
                      <span key={a} className="ability-badge">{a}</span>
                    ))}
                  </div>
                )}
                {product.pokemonData.baseExperience && (
                  <div className="base-exp">
                    <strong>Base Experience:</strong> {product.pokemonData.baseExperience} XP
                  </div>
                )}
              </div>
            )}

            <div className="product-specs">
              <div className="spec-item">
                <strong>Stock:</strong> {product.stock > 0 ? `${product.stock} available` : 'Out of Stock'}
              </div>
              {product.dimensions && (
                <div className="spec-item">
                  <strong>Size:</strong> {product.dimensions.width}cm × {product.dimensions.height}cm
                </div>
              )}
              <div className="spec-item">
                <strong>Material:</strong> {product.material || 'Vinyl'}
              </div>
            </div>

            {product.stock > 0 ? (
              <div className="purchase-section">
                <div className="quantity-selector">
                  <label>Quantity:</label>
                  <div className="quantity-controls">
                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))}>-</button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock, parseInt(e.target.value) || 1)))}
                      min="1"
                      max={product.stock}
                    />
                    <button onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}>+</button>
                  </div>
                </div>
                <button
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                  className="btn btn-primary btn-large"
                >
                  {addingToCart ? 'Adding...' : 'Add to Cart'}
                </button>
                <button
                  onClick={() => navigate('/checkout', { state: { items: [{ product: id, quantity }] } })}
                  className="btn btn-secondary btn-large"
                >
                  Buy Now
                </button>
              </div>
            ) : (
              <div className="out-of-stock-message">
                This product is currently out of stock
              </div>
            )}
          </div>
        </div>

        {recommendations.length > 0 && (
          <section className="recommendations-section">
            <h2>You Might Also Like</h2>
            <div className="recommendations-grid">
              {recommendations.map(rec => (
                <div
                  key={rec._id}
                  className="recommendation-card"
                  onClick={() => navigate(`/products/${rec._id}`)}
                >
                  <img src={getImageUrl(rec.images[0])} alt={rec.name} />
                  <h4>{rec.name}</h4>
                  <span className="price">₹{rec.price}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
