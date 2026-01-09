import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { ToastContext } from '../context/ToastContext';
import { getImageUrl } from '../utils/imageHelper';
import './Cart.css';
import './DarkModeCart.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const Cart = () => {
  const { user } = useContext(AuthContext);
  const { success, error: showError } = useContext(ToastContext);
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      navigate('/login');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchCart = async () => {
    try {
      const res = await axios.get(`${API_URL}/users/cart`);
      setCart(res.data.cart);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, newQuantity) => {
    // Prevent multiple simultaneous updates
    if (updating) {
      return;
    }

    if (newQuantity < 1) {
      removeItem(itemId);
      return;
    }

    setUpdating(true);
    try {
      // Optimistically update UI first
      const updatedItems = cart.items.map(item => {
        if (item._id === itemId) {
          return { ...item, quantity: newQuantity };
        }
        return item;
      });
      setCart({ ...cart, items: updatedItems });

      // Update on server
      const res = await axios.put(`${API_URL}/users/cart/${itemId}`, {
        quantity: newQuantity
      });
      
      // Update local state with server response (authoritative)
      setCart(res.data.cart);
    } catch (error) {
      console.error('Error updating quantity:', error);
      showError(error.response?.data?.message || 'Failed to update quantity');
      // Revert by fetching cart from server
      await fetchCart();
    } finally {
      setUpdating(false);
    }
  };

  const removeItem = async (itemId) => {
    try {
      await axios.delete(`${API_URL}/users/cart/${itemId}`);
      fetchCart();
      success('Item removed from cart');
    } catch (error) {
      console.error('Error removing item:', error);
      showError('Failed to remove item');
    }
  };

  const calculateTotal = () => {
    if (!cart || !cart.items || cart.items.length === 0) return 0;
    
    return cart.items.reduce((total, item) => {
      // Ensure product is populated and has price
      if (!item.product) {
        console.warn('Cart item missing product:', item);
        return total;
      }

      // Handle both populated object and ID string
      const price = typeof item.product === 'object' 
        ? (item.product.price || 0)
        : 0;
      
      const quantity = item.quantity || 1;
      return total + (price * quantity);
    }, 0);
  };

  if (loading) {
    return <div className="loading">Loading cart...</div>;
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="cart-page">
        <div className="container">
          <h1>Shopping Cart</h1>
          <div className="empty-cart">
            <p>Your cart is empty</p>
            <button onClick={() => navigate('/products')} className="btn btn-primary">
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container">
        <h1>Shopping Cart</h1>
        <div className="cart-layout">
          <div className="cart-items">
            {cart.items.map(item => (
              <div key={item._id} className="cart-item">
                <img
                  src={getImageUrl(item.product.images[0])}
                  alt={item.product.name}
                />
                <div className="item-info">
                  <h3>{item.product.name}</h3>
                  <p className="item-price">₹{item.product.price}</p>
                </div>
                <div className="item-quantity">
                  <button
                    onClick={() => {
                      if (!updating && item.quantity > 1) {
                        updateQuantity(item._id, item.quantity - 1);
                      }
                    }}
                    disabled={updating || item.quantity <= 1}
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    onClick={() => {
                      if (!updating && item.quantity < item.product.stock) {
                        updateQuantity(item._id, item.quantity + 1);
                      }
                    }}
                    disabled={updating || item.quantity >= item.product.stock}
                  >
                    +
                  </button>
                </div>
                <div className="item-total">
                  ₹{(item.product.price * item.quantity).toFixed(2)}
                </div>
                <button
                  onClick={() => removeItem(item._id)}
                  className="btn-remove"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="cart-summary">
            <h3>Order Summary</h3>
            <div className="summary-row">
              <span>Subtotal</span>
              <span>₹{calculateTotal().toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <span>₹5.00</span>
            </div>
            <div className="summary-row">
              <span>Tax</span>
              <span>₹1.00</span>
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <span>₹{(calculateTotal() + 5 + 1).toFixed(2)}</span>
            </div>
            <button
              onClick={() => navigate('/checkout')}
              className="btn btn-primary btn-block"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
