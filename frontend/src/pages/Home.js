import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { getImageUrl } from '../utils/imageHelper';
import { StatCardSkeleton } from '../components/LoadingSkeleton';
import './Home.css';
import './DarkMode.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const Home = () => {
  const { user } = useContext(AuthContext);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [legendaryProducts, setLegendaryProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, legendary: 0, generations: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch featured products
      const featuredRes = await axios.get(`${API_URL}/products?limit=8&sort=popular`);
      setFeaturedProducts(featuredRes.data.products || []);

      // Fetch legendary products
      const legendaryRes = await axios.get(`${API_URL}/products?limit=6&powerLevel=legendary`);
      setLegendaryProducts(legendaryRes.data.products || []);

      // Get total products count
      const totalRes = await axios.get(`${API_URL}/products?limit=1`);
      const totalCount = totalRes.data?.total || 0;
      
      // Get legendary count
      const legendaryCountRes = await axios.get(`${API_URL}/products?limit=1&powerLevel=legendary`);
      const legendaryCount = legendaryCountRes.data?.total || 0;
      
      // Get unique generations count - fetch more products to get accurate count
      const generationsRes = await axios.get(`${API_URL}/products?limit=1000`);
      const uniqueGenerations = new Set();
      if (generationsRes.data?.products && Array.isArray(generationsRes.data.products)) {
        generationsRes.data.products.forEach(product => {
          if (product.generation) {
            uniqueGenerations.add(String(product.generation));
          }
        });
      }
      const generationsCount = uniqueGenerations.size > 0 ? uniqueGenerations.size : 9;

      setStats({
        total: totalCount,
        legendary: legendaryCount,
        generations: generationsCount
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      console.error('Error details:', error.response?.data);
      // Set default values on error
      setStats({
        total: 0,
        legendary: 0,
        generations: 9
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-background">
          <div className="hero-pattern"></div>
        </div>
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">⚡ New Collection Available</div>
            <h1 className="hero-title">
              Build Your Ultimate
              <span className="gradient-text"> Pokemon Collection</span>
            </h1>
            <p className="hero-description">
              Discover rare, legendary, and exclusive Pokemon stickers. 
              Collect, trade, and download digital versions. Start your journey today!
            </p>
            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-number">{stats.total ? `${stats.total}+` : 'Loading...'}</span>
                <span className="stat-label">Pokemon</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{stats.legendary ? `${stats.legendary}+` : 'Loading...'}</span>
                <span className="stat-label">Legendary</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{stats.generations || 'Loading...'}</span>
                <span className="stat-label">Generations</span>
              </div>
            </div>
            <div className="hero-actions">
              <Link to="/products" className="btn btn-primary btn-large btn-hero">
                <span>🛍️</span>
                <span>Shop Now</span>
              </Link>
              <Link to="/products?rarity=legendary" className="btn btn-secondary btn-large btn-hero">
                <span>👑</span>
                <span>View Legendary</span>
              </Link>
              {user && (
                <Link to="/orders" className="btn btn-outline btn-large btn-hero">
                  <span>📦</span>
                  <span>My Orders</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Pokemon Showcase Section */}
      <section className="showcase-section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Pokemon Collection</h2>
              <p className="section-subtitle">Browse our complete collection of {stats.total}+ Pokemon stickers</p>
            </div>
            <Link to="/products" className="btn btn-outline">
              View All →
            </Link>
          </div>
          {loading ? (
            <div className="pokemon-showcase-grid">
              {[...Array(8)].map((_, i) => (
                <div key={i} style={{ aspectRatio: 1, background: '#f8f9fa', borderRadius: '12px', border: '1px solid #e0e0e0' }}></div>
              ))}
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="no-products">
              <p>No products available. Check back soon!</p>
              <Link to="/products" className="btn btn-primary">
                View All Products
              </Link>
            </div>
          ) : (
            <div className="pokemon-showcase-grid">
              {featuredProducts.map(product => (
                <Link 
                  key={product._id} 
                  to={`/products/${product._id}`} 
                  className="pokemon-showcase-item"
                  title={product.pokemonName || product.name}
                >
                  <div className="showcase-image-wrapper">
                    <img 
                      src={getImageUrl(product.images && product.images[0] ? product.images[0] : '')} 
                      alt={product.pokemonName || product.name}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/200x200?text=Pokemon';
                      }}
                    />
                    {product.pokemonData?.powerLevel === 'legendary' && (
                      <div className="showcase-legendary-badge">👑</div>
                    )}
                    {product.featured && (
                      <div className="showcase-featured-badge">⭐</div>
                    )}
                  </div>
                  <div className="showcase-overlay">
                    <div className="showcase-info">
                      <span className="showcase-number">#{product.pokemonNumber}</span>
                      <span className="showcase-name">{product.pokemonName || product.name}</span>
                      {product.generation && (
                        <span className="showcase-generation">Gen {product.generation}</span>
                      )}
                      {product.pokemonData?.powerLevel === 'legendary' && (
                        <span className="showcase-legendary">👑 Legendary</span>
                      )}
                      <span className="showcase-price">₹{product.price}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Legendary Showcase Section */}
      {legendaryProducts.length > 0 && (
        <section className="legendary-showcase-section">
          <div className="container">
            <div className="section-header">
              <div>
                <h2 className="section-title">👑 Legendary Collection</h2>
                <p className="section-subtitle">The rarest and most powerful Pokemon</p>
              </div>
              <Link to="/products?rarity=legendary" className="btn btn-outline">
                View All Legendary →
              </Link>
            </div>
            <div className="pokemon-showcase-grid legendary-grid">
              {legendaryProducts.map(product => (
                <Link 
                  key={product._id} 
                  to={`/products/${product._id}`} 
                  className="pokemon-showcase-item legendary-item"
                  title={product.pokemonName || product.name}
                >
                  <div className="showcase-image-wrapper">
                    <img 
                      src={getImageUrl(product.images && product.images[0] ? product.images[0] : '')} 
                      alt={product.pokemonName || product.name}
                      loading="lazy"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/200x200?text=Pokemon';
                      }}
                    />
                    <div className="legendary-glow-effect"></div>
                    <div className="showcase-legendary-badge">👑</div>
                  </div>
                  <div className="showcase-overlay">
                    <div className="showcase-info">
                      <span className="showcase-number">#{product.pokemonNumber}</span>
                      <span className="showcase-name">{product.pokemonName || product.name}</span>
                      {product.generation && (
                        <span className="showcase-generation">Gen {product.generation}</span>
                      )}
                      <span className="showcase-legendary">👑 Legendary</span>
                      <span className="showcase-price">₹{product.price}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Why Choose PokeStash?</h2>
            <p className="section-subtitle">Everything you need for the perfect Pokemon collection</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Authentic Stickers</h3>
              <p>Verified sellers and authentic Pokemon merchandise with detailed stats and power levels</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🚀</div>
              <h3>Fast Delivery</h3>
              <p>Quick and secure shipping across India. Get your stickers delivered to your doorstep</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💳</div>
              <h3>Secure Payments</h3>
              <p>Safe and secure payment processing with Razorpay. Your transactions are protected</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📥</div>
              <h3>Digital Downloads</h3>
              <p>Get digital versions of your stickers after purchase. Use them digitally or print at home</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔍</div>
              <h3>Advanced Filters</h3>
              <p>Filter by power level, HP, defense, stats, and more. Find exactly what you're looking for</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3>AI Recommendations</h3>
              <p>Get personalized sticker recommendations powered by Google Gemini AI</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📦</div>
              <div className="stat-value">{stats.total}+</div>
              <div className="stat-label">Pokemon Stickers</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">👑</div>
              <div className="stat-value">{stats.legendary}+</div>
              <div className="stat-label">Legendary Pokemon</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🌟</div>
              <div className="stat-value">{stats.generations}</div>
              <div className="stat-label">Generations</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⚡</div>
              <div className="stat-value">500+</div>
              <div className="stat-label">Power Levels</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            {user ? (
              <>
                <h2>Welcome back, {user.name}! 👋</h2>
                <p>Continue building your Pokemon sticker collection</p>
                <div className="cta-actions">
                  <Link to="/products" className="btn btn-primary btn-large">
                    Browse Collection
                  </Link>
                  <Link to="/orders" className="btn btn-secondary btn-large">
                    View My Orders
                  </Link>
                </div>
              </>
            ) : (
              <>
                <h2>Ready to Start Your Collection?</h2>
                <p>Join thousands of trainers building their ultimate Pokemon sticker collection</p>
                <div className="cta-actions">
                  <Link to="/products" className="btn btn-primary btn-large">
                    Browse Collection
                  </Link>
                  <Link to="/register" className="btn btn-secondary btn-large">
                    Create Account
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
