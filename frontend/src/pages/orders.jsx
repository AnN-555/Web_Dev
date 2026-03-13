import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './orders.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const IMAGE_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

const formatPrice = (price) => {
  if (price == null || price === 0) return 'Free';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'VND' }).format(price);
};

const Orders = () => {
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await orderAPI.getMyOrders();
      setOrders(res.data || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="orders-page">
        <div className="container">
          <div className="orders-empty-state">
            <i className="fas fa-receipt"></i>
            <h2>Login to view your orders</h2>
            <Link to="/login" className="btn btn-primary">Login / Register</Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="orders-page">
        <div className="loading"><div className="spinner"></div></div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="container">
        <h1 className="orders-title"><i className="fas fa-receipt"></i> My Orders</h1>

        {orders.length === 0 ? (
          <div className="orders-empty-state">
            <i className="fas fa-receipt"></i>
            <h2>No orders yet</h2>
            <p>Your purchased games will appear here.</p>
            <Link to="/games" className="btn btn-primary">Browse Games</Link>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <div key={order._id} className="order-item">
                <Link to={`/games/${order.game?.slug}`} className="order-item-image">
                  <img
                    src={`${IMAGE_BASE_URL}/database/${order.game?.headerImage}`}
                    alt={order.game?.name}
                    onError={(e) => {
                      e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='80'%3E%3Crect fill='%23222' width='120' height='80'/%3E%3Ctext fill='%23666' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='10'%3ENo Image%3C/text%3E%3C/svg%3E";
                    }}
                  />
                </Link>
                <div className="order-item-info">
                  <Link to={`/games/${order.game?.slug}`} className="order-item-name">
                    {order.game?.name}
                  </Link>
                  <span className="order-item-price">{formatPrice(order.priceAtPurchase)}</span>
                  <span className="order-item-date">
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US') : ''}
                  </span>
                </div>
                <span className={`order-status order-status-${order.status}`}>{order.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
