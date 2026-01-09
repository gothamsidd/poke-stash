import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { ToastContext } from '../context/ToastContext';
import { getImageUrl } from '../utils/imageHelper';
import './Orders.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const Orders = () => {
  const { user } = useContext(AuthContext);
  const { success: showSuccess, error: showError } = useContext(ToastContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (location.state?.success) {
      showSuccess('Order placed successfully!');
    }

    // Check if redirected from payment link
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment_link') === 'true') {
      // Refresh orders to show updated status
      setTimeout(() => {
        fetchOrders();
      }, 2000);
    }

    fetchOrders();
  }, [user, location]);

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${API_URL}/orders`);
      setOrders(res.data.orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f39c12',
      processing: '#3498db',
      shipped: '#9b59b6',
      delivered: '#27ae60',
      cancelled: '#e74c3c'
    };
    return colors[status] || '#95a5a6';
  };

  const handleDownloadStickers = async (order) => {
    try {
      let downloaded = 0;
      let failed = 0;

      // Download each sticker image from the order
      for (const item of order.orderItems) {
        try {
          const imageUrl = getImageUrl(item.image);
          
          // For external URLs (PokeAPI), we need to handle CORS
          if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
            // Use a proxy or direct download
            const response = await fetch(imageUrl, { mode: 'cors' });
            
            if (!response.ok) {
              // If CORS fails, open in new tab as fallback
              window.open(imageUrl, '_blank');
              failed++;
              continue;
            }
            
            const blob = await response.blob();
            
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${item.name.replace(/\s+/g, '_')}_sticker.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            downloaded++;
          } else {
            // Local image - direct download
            const link = document.createElement('a');
            link.href = imageUrl;
            link.download = `${item.name.replace(/\s+/g, '_')}_sticker.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            downloaded++;
          }
          
          // Small delay between downloads
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`Error downloading ${item.name}:`, error);
          failed++;
        }
      }
      
      if (downloaded > 0) {
        showSuccess(`Successfully downloaded ${downloaded} sticker image(s)!${failed > 0 ? ` ${failed} image(s) opened in new tab due to browser restrictions.` : ''}`);
      } else {
        showSuccess('Some images opened in new tabs. Please right-click and save them manually.');
      }
    } catch (error) {
      console.error('Error downloading stickers:', error);
      showError('Failed to download stickers. Please try again or contact support.');
    }
  };

  if (loading) {
    return <div className="loading">Loading orders...</div>;
  }

  return (
    <div className="orders-page">
      <div className="container">
        <h1>My Orders</h1>
        {orders.length === 0 ? (
          <div className="no-orders">
            <p>You haven't placed any orders yet</p>
            <button onClick={() => navigate('/products')} className="btn btn-primary">
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map(order => (
              <div key={order._id} className="order-card">
                <div className="order-header">
                  <div>
                    <h3>Order #{order._id.slice(-8)}</h3>
                    <p className="order-date">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className="order-status"
                    style={{ backgroundColor: getStatusColor(order.orderStatus) }}
                  >
                    {order.orderStatus}
                  </span>
                </div>
                <div className="order-items-list">
                  {order.orderItems.map((item, idx) => (
                    <div key={idx} className="order-item-row">
                      <img
                        src={getImageUrl(item.image)}
                        alt={item.name}
                      />
                      <div className="item-details">
                        <h4>{item.name}</h4>
                        <p>Quantity: {item.quantity}</p>
                      </div>
                      <div className="item-price">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="order-footer">
                  <div className="order-total">
                    <strong>Total: ₹{order.totalPrice.toFixed(2)}</strong>
                  </div>
                  <div className="order-actions">
                    {order.paymentInfo?.status === 'completed' && (
                      <>
                        <button 
                          className="btn btn-primary btn-download"
                          onClick={() => handleDownloadStickers(order)}
                          title="Download Digital Sticker Images"
                        >
                          <span>📥</span>
                          <span>Download Digital Stickers</span>
                        </button>
                        <div className="download-info">
                          💡 Get digital versions to use/print!
                        </div>
                      </>
                    )}
                    {order.orderStatus === 'delivered' && (
                      <button className="btn btn-outline">
                        Reorder
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
