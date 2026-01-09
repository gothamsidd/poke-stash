import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { ToastContext } from '../context/ToastContext';
import './Checkout.css';
import './DarkModeCheckout.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const Checkout = () => {
  const { user } = useContext(AuthContext);
  const { success, error: showError } = useContext(ToastContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [cart, setCart] = useState(null);
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
    phone: ''
  });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/users/cart`);
      if (res.data && res.data.cart) {
        setCart(res.data.cart);
      } else {
        setCart({ items: [] });
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      // Set empty cart on error to prevent infinite loading
      setCart({ items: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleBuyNowItems = async (items) => {
    try {
      setLoading(true);
      // Add each item to cart sequentially to avoid race conditions
      // The backend API will automatically increment quantity if product already exists
      for (const item of items) {
        const response = await axios.post(`${API_URL}/users/cart`, {
          productId: item.product,
          quantity: item.quantity || 1
        });
        // Use the updated cart from response to ensure we have latest state
        if (response.data && response.data.cart) {
          setCart(response.data.cart);
        }
      }
      // Final fetch to ensure we have the complete, up-to-date cart
      await fetchCart();
    } catch (error) {
      console.error('Error adding items to cart:', error);
      showError(error.response?.data?.message || 'Failed to add items to cart');
      // Set empty cart on error to prevent infinite loading
      setCart({ items: [] });
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    let isMounted = true;

    const loadCart = async () => {
      // Check if items were passed from "Buy Now" button
      const buyNowItems = location.state?.items;
      
      if (buyNowItems && buyNowItems.length > 0) {
        // Add items to cart first, then fetch cart
        try {
          await handleBuyNowItems(buyNowItems);
        } catch (error) {
          console.error('Error in handleBuyNowItems:', error);
          if (isMounted) {
            setLoading(false);
          }
        }
      } else {
        // Normal flow: fetch existing cart
        await fetchCart();
      }
    };

    loadCart();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleAddressChange = (e) => {
    setShippingAddress({
      ...shippingAddress,
      [e.target.name]: e.target.value
    });
  };

  const handleCheckout = async () => {
    if (!cart || !cart.items || cart.items.length === 0) {
      showError('Cart is empty');
      return;
    }

    const requiredFields = ['street', 'city', 'state', 'zipCode', 'phone'];
    const missingFields = requiredFields.filter(field => !shippingAddress[field]);
    
    if (missingFields.length > 0) {
      showError('Please fill all required fields');
      return;
    }

    setProcessing(true);
    try {
      // Create order
      const orderItems = cart.items.map(item => ({
        product: item.product._id || item.product,
        quantity: item.quantity
      }));

      const orderRes = await axios.post(`${API_URL}/orders`, {
        orderItems,
        shippingAddress,
        couponCode: appliedCoupon ? appliedCoupon.code : null
      });

      const order = orderRes.data.order;

      // Check if Razorpay key is configured
      const razorpayKey = process.env.REACT_APP_RAZORPAY_KEY_ID;
      if (!razorpayKey || razorpayKey === 'rzp_test_1234567890') {
        showError('Razorpay key not configured. Please add REACT_APP_RAZORPAY_KEY_ID to frontend/.env file and restart the frontend server.');
        setProcessing(false);
        return;
      }

      // Load Razorpay script if not already loaded
      if (!window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => {
          initializeRazorpayCheckout(order, razorpayKey);
        };
        script.onerror = () => {
          showError('Failed to load Razorpay. Please check your internet connection.');
          setProcessing(false);
        };
        document.body.appendChild(script);
      } else {
        initializeRazorpayCheckout(order, razorpayKey);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      showError(error.response?.data?.message || error.message || 'Failed to process checkout');
      setProcessing(false);
    }
  };

  const initializeRazorpayCheckout = async (order, razorpayKey) => {
    try {
      // Create Razorpay checkout order
      const paymentRes = await axios.post(`${API_URL}/payments/create-order`, {
        orderId: order._id
      });

      if (!paymentRes.data.success || !paymentRes.data.order) {
        throw new Error('Failed to create payment order');
      }

      const razorpayOrder = paymentRes.data.order;

      // Initialize Razorpay with ALL payment methods enabled
      const options = {
        key: razorpayKey,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'PokeStash - Pokemon Stickers',
        description: `Order #${order._id}`,
        order_id: razorpayOrder.id,
        handler: async function (response) {
          try {
            // Payment handler called
            
            // Verify payment
            const verifyRes = await axios.post(`${API_URL}/payments/verify`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: order._id
            });
            
            if (verifyRes.data.success) {
              success('Order placed successfully!');
              navigate('/orders', { state: { success: true } });
            } else {
              throw new Error(verifyRes.data.message || 'Verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            const errorMsg = error.response?.data?.message || error.message || 'Payment verification failed';
            showError(errorMsg);
            setProcessing(false);
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
          contact: shippingAddress.phone || user.phone || '9999999999' // Phone required for UPI
        },
        theme: {
          color: '#667eea'
        },
        // Enable ALL payment methods
        method: {
          upi: {
            flow: 'collect'
          },
          card: true,
          netbanking: true,
          wallet: true
        },
        notes: {
          orderId: order._id.toString(),
          userId: user._id.toString(),
          orderNumber: order.orderNumber || order._id.toString()
        },
        modal: {
          ondismiss: function() {
            setProcessing(false);
          }
        }
      };

      // Add error handler
      options.handler.error = function(error) {
        const errorMsg = error.error?.description || error.error?.reason || error.error?.code || 'Unknown error';
        const errorSource = error.error?.source || '';
        const errorStep = error.error?.step || '';
        const errorMetadata = error.error?.metadata || {};
        
        console.error('Razorpay handler error:', {
          message: errorMsg,
          source: errorSource,
          step: errorStep,
          metadata: errorMetadata,
          fullError: error
        });
        
        // Handle QR code issues (common in test mode)
        if (errorMsg.toLowerCase().includes('qr') || errorMsg.toLowerCase().includes('qr code') || errorMsg.toLowerCase().includes('qr doesn\'t exist') || errorMsg.toLowerCase().includes('qr not found')) {
          showError(`QR Code not available in Test Mode. Please use:\n\n1. UPI ID: Enter success@razorpay (for testing)\n2. Or use Card payment with test card: 4111 1111 1111 1111\n\nNote: QR codes work only in Live Mode.`);
        }
        // Handle PhonePe issues
        else if (errorMsg.toLowerCase().includes('phonepe') || errorMsg.toLowerCase().includes('facing issues')) {
          showError(`PhonePe is currently unavailable. Please try:\n\n1. Use UPI ID: success@razorpay\n2. Use other UPI providers: username@paytm, username@ybl\n3. Use Card payment with test card`);
        }
        // Handle specific UPI errors
        else if (errorMsg.toLowerCase().includes('upi') || errorMsg.toLowerCase().includes('invalid') || errorMsg.toLowerCase().includes('vpa')) {
          let detailedMsg = `UPI Error: ${errorMsg}`;
          if (errorMetadata?.vpa) {
            detailedMsg += `\n\nYou entered: ${errorMetadata.vpa}`;
          }
          detailedMsg += '\n\nPlease try:';
          detailedMsg += '\n1. UPI ID: success@razorpay (for testing)';
          detailedMsg += '\n2. Other UPI: username@paytm, username@ybl';
          detailedMsg += '\n3. Card payment (test card: 4111 1111 1111 1111)';
          showError(detailedMsg);
        } else {
          showError('Payment failed: ' + errorMsg);
        }
        setProcessing(false);
      };

      // Create and open Razorpay immediately
      const razorpay = new window.Razorpay(options);
      
      // Store poll interval reference for cleanup
      let pollInterval = null;
      
      // Open payment modal immediately (non-blocking)
      razorpay.open();
      
      // Reset processing state - modal is now open
      setProcessing(false);
      
      // Handle payment failure
      razorpay.on('payment.failed', function (response) {
        const errorMsg = response.error?.description || response.error?.reason || response.error?.code || 'Payment could not be processed';
        console.error('Payment failed response:', response);
        
        // Clear polling if active
        if (pollInterval) {
          clearInterval(pollInterval);
          pollInterval = null;
        }
        
        // Handle QR code issues (common in test mode)
        if (errorMsg.toLowerCase().includes('qr') || errorMsg.toLowerCase().includes('qr code') || errorMsg.toLowerCase().includes('qr doesn\'t exist') || errorMsg.toLowerCase().includes('qr not found')) {
          showError(`QR Code not available in Test Mode. Please use:\n\n1. UPI ID: Enter success@razorpay (for testing)\n2. Or use Card payment with test card: 4111 1111 1111 1111\n\nNote: QR codes work only in Live Mode.`);
        }
        // Handle PhonePe issues
        else if (errorMsg.toLowerCase().includes('phonepe') || errorMsg.toLowerCase().includes('facing issues')) {
          showError(`PhonePe is currently unavailable. Please try:\n\n1. Use UPI ID: success@razorpay\n2. Use other UPI providers: username@paytm, username@ybl\n3. Use Card payment with test card`);
        }
        // Handle specific UPI errors
        else if (errorMsg.toLowerCase().includes('upi') || errorMsg.toLowerCase().includes('invalid') || errorMsg.toLowerCase().includes('vpa')) {
          showError(`UPI Error: ${errorMsg}. Please try:\n1. UPI ID: success@razorpay (for testing)\n2. Other UPI: username@paytm, username@ybl\n3. Card payment (test card: 4111 1111 1111 1111)`);
        } else {
          showError('Payment failed: ' + errorMsg);
        }
        setProcessing(false);
      });
      
      // For QR code payments, poll for payment status after modal opens
      razorpay.on('modal.open', function() {
        // Razorpay modal opened - starting payment status polling
        let pollCount = 0;
        const maxPolls = 120; // Poll for 10 minutes (120 * 5 seconds)
        
        pollInterval = setInterval(async () => {
          if (pollCount >= maxPolls) {
            // Polling timeout reached
            clearInterval(pollInterval);
            pollInterval = null;
            return;
          }
          
          try {
            // Checking payment status
            const statusRes = await axios.get(`${API_URL}/payments/check-status/${order._id}`);
            
            if (statusRes.data.success && statusRes.data.status === 'completed') {
              // Payment completed
              clearInterval(pollInterval);
              pollInterval = null;
              success('Payment completed! Order placed successfully.');
              navigate('/orders', { state: { success: true } });
            }
          } catch (error) {
            console.error('❌ Error checking payment status:', error);
            // Don't stop polling on error, might be temporary
          }
          
          pollCount++;
        }, 5000); // Poll every 5 seconds
      });
      
      // Clear interval when modal closes
      razorpay.on('modal.close', function() {
        if (pollInterval) {
          clearInterval(pollInterval);
          pollInterval = null;
        }
      });
      
      // Open payment modal immediately - this is non-blocking
      razorpay.open();
      
      // Reset processing state so user can interact with page
      // Payment modal is now open and handles its own state
      setProcessing(false);
    } catch (error) {
      console.error('Checkout error:', error);
      showError(error.response?.data?.message || error.message || 'Failed to process checkout');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="checkout-page">
        <div className="container">
          <div className="loading">Loading cart...</div>
        </div>
      </div>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="checkout-page">
        <div className="container">
          <h1>Checkout</h1>
          <div className="error">No items to checkout</div>
        </div>
      </div>
    );
  }

  const calculateTotal = () => {
    if (!cart || !cart.items || cart.items.length === 0) {
      return {
        subtotal: 0,
        shipping: 5,
        tax: 1,
        discount: 0,
        total: 6
      };
    }

    const subtotal = cart.items.reduce((total, item) => {
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
      const itemTotal = price * quantity;
      
      return total + itemTotal;
    }, 0);

    const shipping = 5; // Fixed shipping charge
    const tax = 1; // Fixed tax
    const beforeDiscount = subtotal + shipping + tax;
    const discount = appliedCoupon ? appliedCoupon.discountAmount : 0;
    const total = Math.max(0, beforeDiscount - discount);
    
    return {
      subtotal,
      shipping,
      tax,
      discount,
      total
    };
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    setValidatingCoupon(true);
    setCouponError('');

    try {
      const totals = calculateTotal();
      const res = await axios.post(`${API_URL}/coupons/validate`, {
        code: couponCode.trim(),
        totalAmount: totals.subtotal + totals.shipping + totals.tax
      });

      if (res.data.success) {
        setAppliedCoupon(res.data.coupon);
        setCouponCode('');
        setCouponError('');
        success('Coupon applied successfully!');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Invalid coupon code';
      setCouponError(errorMsg);
      setAppliedCoupon(null);
      showError(errorMsg);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setAppliedCoupon(null);
    setCouponError('');
    success('Coupon removed');
  };

  const totals = calculateTotal();

  return (
    <div className="checkout-page">
      <div className="container">
        <h1>Checkout</h1>
        <div className="checkout-layout">
          <div className="checkout-form">
            <h2>Shipping Address</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>Street Address *</label>
                <input
                  type="text"
                  name="street"
                  value={shippingAddress.street || ''}
                  onChange={handleAddressChange}
                  placeholder="Enter street address"
                  disabled={processing}
                  required
                />
              </div>
              <div className="form-group">
                <label>City *</label>
                <input
                  type="text"
                  name="city"
                  value={shippingAddress.city || ''}
                  onChange={handleAddressChange}
                  placeholder="Enter city"
                  disabled={processing}
                  required
                />
              </div>
              <div className="form-group">
                <label>State *</label>
                <input
                  type="text"
                  name="state"
                  value={shippingAddress.state || ''}
                  onChange={handleAddressChange}
                  placeholder="Enter state"
                  disabled={processing}
                  required
                />
              </div>
              <div className="form-group">
                <label>Zip Code *</label>
                <input
                  type="text"
                  name="zipCode"
                  value={shippingAddress.zipCode || ''}
                  onChange={handleAddressChange}
                  placeholder="Enter zip code"
                  disabled={processing}
                  required
                />
              </div>
              <div className="form-group">
                <label>Country *</label>
                <input
                  type="text"
                  name="country"
                  value={shippingAddress.country || 'India'}
                  onChange={handleAddressChange}
                  placeholder="Enter country"
                  disabled={processing}
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone *</label>
                <input
                  type="tel"
                  name="phone"
                  value={shippingAddress.phone || ''}
                  onChange={handleAddressChange}
                  placeholder="Enter phone number"
                  disabled={processing}
                  required
                />
              </div>
            </div>
          </div>

          <div className="order-summary">
            <h2>Order Summary</h2>
            
            {/* Coupon Code Section */}
            <div className="coupon-section">
              {!appliedCoupon ? (
                <div className="coupon-input-group">
                  <input
                    type="text"
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="coupon-input"
                    disabled={validatingCoupon}
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={validatingCoupon || !couponCode.trim()}
                    className="btn-coupon"
                  >
                    {validatingCoupon ? 'Applying...' : 'Apply'}
                  </button>
                </div>
              ) : (
                <div className="coupon-applied">
                  <div className="coupon-success">
                    <span>✓ Coupon {appliedCoupon.code} applied!</span>
                    <span className="discount-amount">-₹{appliedCoupon.discountAmount.toFixed(2)}</span>
                  </div>
                  <button onClick={handleRemoveCoupon} className="btn-remove-coupon">
                    Remove
                  </button>
                </div>
              )}
              {couponError && (
                <div className="coupon-error">{couponError}</div>
              )}
            </div>

            <div className="order-items">
              {cart.items.map((item, idx) => (
                <div key={idx} className="order-item">
                  <span>{item.product?.name || 'Product'} × {item.quantity}</span>
                  <span>₹{((item.product?.price || 0) * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="order-totals">
              <div className="total-row">
                <span>Subtotal</span>
                <span>₹{totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="total-row">
                <span>Shipping</span>
                <span>{totals.shipping === 0 ? 'Free' : `₹${totals.shipping.toFixed(2)}`}</span>
              </div>
              <div className="total-row">
                <span>Tax</span>
                <span>₹{totals.tax.toFixed(2)}</span>
              </div>
              {appliedCoupon && totals.discount > 0 && (
                <div className="total-row discount-row">
                  <span>Discount ({appliedCoupon.code})</span>
                  <span className="discount">-₹{totals.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="total-row final">
                <span>Total</span>
                <span>₹{totals.total.toFixed(2)}</span>
              </div>
            </div>
            <button
              onClick={handleCheckout}
              disabled={processing}
              className="btn btn-primary btn-block btn-large"
            >
              {processing ? 'Processing...' : 'Place Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
