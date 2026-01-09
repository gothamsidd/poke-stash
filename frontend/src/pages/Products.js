import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { getImageUrl } from '../utils/imageHelper';
import { ProductCardSkeleton } from '../components/LoadingSkeleton';
import SearchAutocomplete from '../components/SearchAutocomplete';
import './Products.css';
import './DarkModeProducts.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    rarity: '',
    generation: '',
    search: '',
    sort: 'newest',
    powerLevel: ''
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  useEffect(() => {
    fetchProducts();
  }, [filters, page]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key] && filters[key] !== 'newest') {
          params.append(key, filters[key]);
        }
      });
      params.append('page', page);
      params.append('limit', 24); // Show more products per page

      const res = await axios.get(`${API_URL}/products?${params}`);
      if (res.data && res.data.success !== false) {
        setProducts(res.data.products || []);
        setTotalPages(res.data.pages || 1);
        setTotalProducts(res.data.total || 0);
      } else {
        setProducts([]);
        setTotalPages(1);
        setTotalProducts(0);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
      setTotalPages(1);
      setTotalProducts(0);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      rarity: '',
      generation: '',
      search: '',
      sort: 'newest',
      powerLevel: ''
    });
    setPage(1);
  };

  const hasActiveFilters = Object.entries(filters).some(([key, val]) => 
    val && key !== 'sort' && val !== 'newest'
  );

  return (
    <div className="products-page">
      <div className="container">
        <div className="products-header">
          <div>
            <h1>PokeStash Collection</h1>
            <p className="products-count">{totalProducts} {totalProducts === 1 ? 'sticker' : 'stickers'} available</p>
          </div>
          <button 
            className="filter-toggle-btn"
            onClick={() => setShowFilters(!showFilters)}
          >
            <span>🔍</span> Filters
            {hasActiveFilters && <span className="filter-badge">{Object.entries(filters).filter(([key, val]) => val && key !== 'sort' && val !== 'newest').length}</span>}
          </button>
        </div>

        {/* Filter Modal */}
        {showFilters && (
          <div className="filter-overlay" onClick={() => setShowFilters(false)}>
            <div className="filter-modal" onClick={(e) => e.stopPropagation()}>
              <div className="filter-modal-header">
                <h3>Filter Products</h3>
                <button className="close-btn" onClick={() => setShowFilters(false)}>×</button>
              </div>
              
              <div className="filter-content">
                <div className="filter-group">
                  <label>Search</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Search Pokemon name..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                    {filters.search && filters.search.length > 2 && (
                      <SearchAutocomplete
                        value={filters.search}
                        onChange={(value) => handleFilterChange('search', value)}
                        onSelect={(product) => {
                          window.location.href = `/products/${product._id}`;
                        }}
                      />
                    )}
                  </div>
                </div>

                <div className="filter-group">
                  <label>Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                  >
                    <option value="">All Categories</option>
                    <option value="pokemon">Pokemon</option>
                    <option value="pokemon-go">Pokemon GO</option>
                    <option value="vintage">Vintage</option>
                    <option value="legendary">Legendary</option>
                    <option value="rare">Rare</option>
                    <option value="holo">Holo</option>
                    <option value="starter">Starter</option>
                    <option value="custom">Custom</option>
                    <option value="bundle">Bundle</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label>Rarity</label>
                  <select
                    value={filters.rarity}
                    onChange={(e) => handleFilterChange('rarity', e.target.value)}
                  >
                    <option value="">All Rarities</option>
                    <option value="common">Common</option>
                    <option value="uncommon">Uncommon</option>
                    <option value="rare">Rare</option>
                    <option value="ultra-rare">Ultra Rare</option>
                    <option value="legendary">Legendary</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label>Generation</label>
                  <select
                    value={filters.generation}
                    onChange={(e) => handleFilterChange('generation', e.target.value)}
                  >
                    <option value="">All Generations</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(gen => (
                      <option key={gen} value={gen}>Generation {gen}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label>Power Level</label>
                  <select
                    value={filters.powerLevel}
                    onChange={(e) => handleFilterChange('powerLevel', e.target.value)}
                  >
                    <option value="">All Power Levels</option>
                    <option value="weak">⚡ Weak</option>
                    <option value="average">🔥 Average</option>
                    <option value="strong">💪 Strong</option>
                    <option value="very-strong">⚔️ Very Strong</option>
                    <option value="legendary">👑 Legendary</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label>Sort By</label>
                  <select
                    value={filters.sort}
                    onChange={(e) => handleFilterChange('sort', e.target.value)}
                  >
                    <option value="newest">Newest First</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="rating">Highest Rated</option>
                    <option value="popular">Most Popular</option>
                  </select>
                </div>

                {hasActiveFilters && (
                  <button className="btn btn-outline clear-filters-btn" onClick={clearFilters}>
                    Clear All Filters
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="active-filters">
            {filters.search && (
              <span className="active-filter-tag">
                Search: {filters.search}
                <button onClick={() => handleFilterChange('search', '')}>×</button>
              </span>
            )}
            {filters.category && (
              <span className="active-filter-tag">
                {filters.category}
                <button onClick={() => handleFilterChange('category', '')}>×</button>
              </span>
            )}
            {filters.rarity && (
              <span className="active-filter-tag">
                {filters.rarity}
                <button onClick={() => handleFilterChange('rarity', '')}>×</button>
              </span>
            )}
            {filters.generation && (
              <span className="active-filter-tag">
                Gen {filters.generation}
                <button onClick={() => handleFilterChange('generation', '')}>×</button>
              </span>
            )}
            {filters.powerLevel && (
              <span className="active-filter-tag">
                Power: {filters.powerLevel}
                <button onClick={() => handleFilterChange('powerLevel', '')}>×</button>
              </span>
            )}
          </div>
        )}

        {/* Products Grid */}
        <main className="products-main">
          {loading ? (
            <div className="products-grid">
              {[...Array(12)].map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="no-products">
              <div className="no-products-icon">🔍</div>
              <h3>No products found</h3>
              <p>Try adjusting your filters or search terms</p>
              {hasActiveFilters && (
                <button className="btn btn-primary" onClick={clearFilters}>
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="products-grid">
                {products.map(product => (
                  <Link key={product._id} to={`/products/${product._id}`} className="product-card">
                    <div className="product-image-wrapper">
                      <div className="product-image">
                        <img 
                          src={getImageUrl(product.images && product.images[0] ? product.images[0] : '')} 
                          alt={product.name}
                          loading="lazy"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/300x300?text=Pokemon';
                          }}
                        />
                        {product.stock === 0 && (
                          <div className="out-of-stock-badge">Out of Stock</div>
                        )}
                        {product.featured && (
                          <div className="featured-badge">⭐ Featured</div>
                        )}
                      </div>
                    </div>
                    <div className="product-info">
                      <h3>{product.name}</h3>
                      {product.pokemonName && (
                        <p className="pokemon-name">#{product.pokemonNumber} {product.pokemonName}</p>
                      )}
                      <div className="product-badges">
                        <span className={`badge badge-${product.rarity}`}>
                          {product.rarity}
                        </span>
                        {product.generation && (
                          <span className="badge badge-gen">Gen {product.generation}</span>
                        )}
                        {product.pokemonData?.powerLevel && (
                          <span className={`badge badge-power badge-power-${product.pokemonData.powerLevel}`}>
                            {product.pokemonData.powerLevel === 'legendary' && '👑 Legendary'}
                            {product.pokemonData.powerLevel === 'very-strong' && '⚔️ Very Strong'}
                            {product.pokemonData.powerLevel === 'strong' && '💪 Strong'}
                            {product.pokemonData.powerLevel === 'average' && '🔥 Average'}
                            {product.pokemonData.powerLevel === 'weak' && '⚡ Weak'}
                          </span>
                        )}
                      </div>
                      
                      {/* Pokemon Stats on Card */}
                      {product.pokemonData?.baseStats && (
                        <div className="product-stats-mini">
                          <div className="stat-mini">
                            <span className="stat-icon">❤️</span>
                            <span className="stat-value-mini">{product.pokemonData.baseStats.hp}</span>
                            <span className="stat-label-mini">HP</span>
                          </div>
                          <div className="stat-mini">
                            <span className="stat-icon">⚔️</span>
                            <span className="stat-value-mini">{product.pokemonData.baseStats.attack}</span>
                            <span className="stat-label-mini">ATK</span>
                          </div>
                          <div className="stat-mini">
                            <span className="stat-icon">🛡️</span>
                            <span className="stat-value-mini">{product.pokemonData.baseStats.defense}</span>
                            <span className="stat-label-mini">DEF</span>
                          </div>
                          {product.pokemonData.baseStats.total && (
                            <div className="stat-mini stat-total">
                              <span className="stat-value-mini">{product.pokemonData.baseStats.total}</span>
                              <span className="stat-label-mini">TOTAL STATS</span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="product-footer">
                        <span className="price">₹{product.price}</span>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <span className="original-price">₹{product.originalPrice}</span>
                        )}
                        {product.rating && product.rating.average > 0 && (
                          <div className="rating">
                            ⭐ {product.rating.average.toFixed(1)}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="pagination-btn"
                  >
                    ← Previous
                  </button>
                  <span className="pagination-info">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="pagination-btn"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Products;
