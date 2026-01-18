import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { ToastContext } from '../context/ToastContext';
import { API_URL } from '../utils/apiConfig';
import { getImageUrl } from '../utils/imageHelper';
import './Dashboard.css';
import './DarkModeDashboard.css';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const { success, error: showError } = useContext(ToastContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest'); // newest, price-asc, price-desc, stock-asc, stock-desc

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.role !== 'seller' && user.role !== 'admin') {
      navigate('/');
      return;
    }

    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, productsRes] = await Promise.all([
        axios.get(`${API_URL}/users/dashboard`),
        axios.get(`${API_URL}/products?seller=${user._id}&limit=50&sort=${sortBy}`)
      ]);
      setStats(statsRes.data.stats);
      
      // Deduplicate products by _id to prevent showing duplicates
      const products = productsRes.data.products || [];
      const uniqueProducts = products.filter((product, index, self) =>
        index === self.findIndex(p => p._id === product._id)
      );
      setProducts(uniqueProducts);
      
      if (statsRes.data.orders) {
        setOrders(statsRes.data.orders);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy]);

  const handleDelete = async (productId, productName) => {
    if (!window.confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/products/${productId}`);
      // Refresh products list
      fetchDashboardData();
      success('Product deleted successfully');
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to delete product');
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-page">
      <div className="container">
        <h1>Dashboard</h1>
        
        {stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Products</h3>
              <p className="stat-value">{stats.totalProducts || 0}</p>
            </div>
            <div 
              className="stat-card clickable-stat" 
              onClick={() => setShowOrdersModal(true)}
              style={{ cursor: 'pointer' }}
            >
              <h3>Total Orders</h3>
              <p className="stat-value">{stats.totalOrders || 0}</p>
              <p style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '8px' }}>Click to view orders</p>
            </div>
            <div className="stat-card">
              <h3>Total Sales</h3>
              <p className="stat-value">₹{stats.totalSales || 0}</p>
            </div>
          </div>
        )}

        <div className="dashboard-section">
          <div className="section-header">
            <h2>My Products</h2>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label htmlFor="sort-select" style={{ fontSize: '14px', color: '#7f8c8d', fontWeight: '600' }}>
                  Sort by:
                </label>
                <select
                  id="sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '2px solid #e0e0e0',
                    fontSize: '14px',
                    cursor: 'pointer',
                    background: 'white',
                    color: '#2c3e50',
                    fontWeight: '500'
                  }}
                >
                  <option value="newest">Newest First</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="stock-asc">Stock: Low to High</option>
                  <option value="stock-desc">Stock: High to Low</option>
                </select>
              </div>
              <button onClick={() => navigate('/products/new')} className="btn btn-primary">
                Add New Product
              </button>
            </div>
          </div>
          
          {products.length === 0 ? (
            <div className="empty-state">
              <p>No products yet. Start selling!</p>
            </div>
          ) : (
            <div className="products-table">
              <table>
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => (
                    <tr key={product._id}>
                      <td>
                        <img
                          src={getImageUrl(product.images[0])}
                          alt={product.name}
                        />
                      </td>
                      <td>{product.name}</td>
                      <td>₹{product.price}</td>
                      <td>{product.stock}</td>
                      <td>
                        <span className={`status-badge status-${product.status}`}>
                          {product.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            onClick={() => navigate(`/products/${product._id}/edit`)}
                            className="btn-small btn-edit"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(product._id, product.name)}
                            className="btn-small btn-delete"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showOrdersModal && (
          <div className="modal-overlay" onClick={() => setShowOrdersModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>All Orders ({orders.length})</h2>
                <button className="modal-close" onClick={() => setShowOrdersModal(false)}>×</button>
              </div>
              <div className="modal-body">
                {orders.length === 0 ? (
                  <div className="empty-state">
                    <p>No orders yet</p>
                  </div>
                ) : (
                  <div className="orders-list">
                    {orders.map(order => (
                      <div key={order._id} className="order-item">
                        <div className="order-header">
                          <div>
                            <strong>Order #{order.orderNumber}</strong>
                            <span className={`status-badge status-${order.orderStatus}`}>
                              {order.orderStatus}
                            </span>
                          </div>
                          <div>
                            <strong>₹{order.totalPrice}</strong>
                            <small style={{ display: 'block', color: '#7f8c8d' }}>
                              {new Date(order.createdAt).toLocaleDateString()}
                            </small>
                          </div>
                        </div>
                        {order.user && (
                          <div style={{ marginTop: '8px', fontSize: '14px', color: '#7f8c8d' }}>
                            Customer: {order.user.name} ({order.user.email})
                          </div>
                        )}
                        <div className="order-items" style={{ marginTop: '12px' }}>
                          {order.orderItems.map((item, idx) => (
                            <div key={idx} style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              padding: '8px 0',
                              borderBottom: idx < order.orderItems.length - 1 ? '1px solid #f0f0f0' : 'none'
                            }}>
                              <span>{item.name} × {item.quantity}</span>
                              <span>₹{item.price * item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
