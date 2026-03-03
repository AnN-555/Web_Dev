import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cartAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './cart.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const IMAGE_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

const formatPrice = (price) => {
  if (price == null || price === 0) return 'Free';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'VND' }).format(price);
};

const Cart = () => {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const res = await cartAPI.getCart();
      setCart(res.data);
    } catch (err) {
      setCart({ items: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (gameId) => {
    try {
      const res = await cartAPI.removeFromCart(gameId);
      setCart(res.data);
      window.dispatchEvent(new CustomEvent('cart-updated'));
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to remove');
    }
  };

  const handleCheckout = async () => {
    if (!cart?.items?.length) return;
    setCheckoutLoading(true);
    setMessage(null);
    try {
      await cartAPI.checkout();
      setMessage('Checkout successful! Redirecting to orders...');
      setCart({ ...cart, items: [] });
      window.dispatchEvent(new CustomEvent('cart-updated'));
      setTimeout(() => {
        window.location.href = '/orders';
      }, 1500);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Checkout failed');
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="cart-page">
        <div className="container">
          <div className="cart-empty-state">
            <i className="fas fa-shopping-cart"></i>
            <h2>Login to view your cart</h2>
            <Link to="/login" className="btn btn-primary">Login / Register</Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="cart-page">
        <div className="loading"><div className="spinner"></div></div>
      </div>
    );
  }

  const items = cart?.items || [];
  const total = items.reduce((sum, item) => sum + (item.game?.price ?? 0), 0);

  return (
    <div className="cart-page">
      <div className="container">
        <h1 className="cart-title"><i className="fas fa-shopping-cart"></i> Cart</h1>

        {message && (
          <div className={`cart-message ${message.includes('successful') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        {items.length === 0 ? (
          <div className="cart-empty-state">
            <i className="fas fa-shopping-cart"></i>
            <h2>Your cart is empty</h2>
            <Link to="/games" className="btn btn-primary">Browse Games</Link>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {items.map((item) => (
                <div key={item.game?._id} className="cart-item">
                  <Link to={`/games/${item.game?.slug}`} className="cart-item-image">
                    <img
                      src={`${IMAGE_BASE_URL}/database/${item.game?.headerImage}`}
                      alt={item.game?.name}
                      onError={(e) => {
                        e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='80'%3E%3Crect fill='%23222' width='120' height='80'/%3E%3Ctext fill='%23666' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='10'%3ENo Image%3C/text%3E%3C/svg%3E";
                      }}
                    />
                  </Link>
                  <div className="cart-item-info">
                    <Link to={`/games/${item.game?.slug}`} className="cart-item-name">
                      {item.game?.name}
                    </Link>
                    <span className="cart-item-price">{formatPrice(item.game?.price)}</span>
                  </div>
                  <button
                    type="button"
                    className="cart-item-remove"
                    onClick={() => handleRemove(item.game?._id)}
                    title="Remove"
                  >
                    <i className="fas fa-trash-alt"></i>
                  </button>
                </div>
              ))}
            </div>

            <div className="cart-summary">
              <div className="cart-total">
                <strong>Total:</strong>
                <span>{formatPrice(total)}</span>
              </div>
              <button
                type="button"
                className="btn btn-checkout"
                onClick={handleCheckout}
                disabled={checkoutLoading}
              >
                {checkoutLoading ? 'Processing...' : 'Checkout'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Cart;
