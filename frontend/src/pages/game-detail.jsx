import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { gameAPI, orderAPI, cartAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './game-detail.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const IMAGE_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

const formatPrice = (price) => {
  if (price == null || price === 0) return 'Free';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const GameDetail = () => {
  const { slug } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [purchased, setPurchased] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderMessage, setOrderMessage] = useState(null);
  const [inCart, setInCart] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    fetchGame();
  }, [slug]);

  useEffect(() => {
    if (game && isAuthenticated) {
      checkPurchased();
    }
  }, [game?._id, isAuthenticated]);

  useEffect(() => {
    if (game?._id) {
      gameAPI.getComments(game._id).then((res) => setComments(res.data || [])).catch(() => setComments([]));
    }
  }, [game?._id]);

  useEffect(() => {
    if (game?._id && isAuthenticated) {
      cartAPI.getCart().then((res) => {
        const items = res.data?.items || [];
        const found = items.some((i) => i.game?._id === game._id || i.game?.id === game._id);
        setInCart(!!found);
      }).catch(() => setInCart(false));
    } else {
      setInCart(false);
    }
  }, [game?._id, isAuthenticated]);

  const fetchGame = async () => {
    try {
      setLoading(true);
      const response = await gameAPI.getGameBySlug(slug);
      setGame(response.data);
      setError(null);
    } catch (err) {
      setError('Game not found.');
      console.error('Error fetching game:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkPurchased = async () => {
    try {
      const { data: orders } = await orderAPI.getMyOrders();
      const hasPurchased = orders?.some((o) => o.game?._id === game._id || o.game?.id === game._id);
      setPurchased(!!hasPurchased);
    } catch {
      setPurchased(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!game?._id || !commentText.trim() || commentLoading || !isAuthenticated) return;
    setCommentLoading(true);
    try {
      const res = await gameAPI.addComment(game._id, commentText.trim());
      setComments((prev) => [res.data, ...prev]);
      setCommentText('');
    } catch (err) {
      console.error(err);
    } finally {
      setCommentLoading(false);
    }
  };

  const handlePrevImage = () => {
    if (!game || !galleryImages.length) return;
    setActiveImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  const handleNextImage = () => {
    if (!game || !galleryImages.length) return;
    setActiveImageIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const handleAddToCart = async () => {
    if (!game?._id || orderLoading || purchased || inCart) return;
    setOrderMessage(null);
    setOrderLoading(true);
    try {
      await cartAPI.addToCart(game._id);
      setInCart(true);
      setOrderMessage('Added to cart');
      window.dispatchEvent(new CustomEvent('cart-updated'));
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      if (msg.includes('already in cart')) {
        setInCart(true);
        setOrderMessage('Already in cart');
      } else {
        setOrderMessage(msg || 'Failed to add to cart');
      }
    } finally {
      setOrderLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="error-message">
        <i className="fas fa-exclamation-triangle"></i>
        <p>{error || 'Game does not exist'}</p>
        <Link to="/games" className="btn">
          Back to list
        </Link>
      </div>
    );
  }

  const galleryImages = [
    `${IMAGE_BASE_URL}/database/${game.headerImage}`,
    ...(game.images || []).map((image) => `${IMAGE_BASE_URL}/database/${image}`),
  ].filter(Boolean);

  return (
    <div className="game-detail">
      <div className="container">
        <h1 className="game-title">{game.name}</h1>

        <div className="game-detail-row">
          <div className="game-gallery-wrap">
            {galleryImages.length > 0 && (
              <section className="game-section">
                <div className="game-gallery">
                  <div className="gallery-main">
                    <button
                      type="button"
                      className="gallery-arrow gallery-arrow-left"
                      onClick={handlePrevImage}
                    >
                      <i className="fas fa-chevron-left" />
                    </button>

                    <img
                      src={galleryImages[activeImageIndex]}
                      alt={`${game.name} - Image ${activeImageIndex + 1}`}
                      onError={(e) => {
                        e.target.src =
                          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450'%3E%3Crect fill='%23222' width='800' height='450'/%3E%3Ctext fill='%23666' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='18'%3ENo Image%3C/text%3E%3C/svg%3E";
                      }}
                    />

                    <button
                      type="button"
                      className="gallery-arrow gallery-arrow-right"
                      onClick={handleNextImage}
                    >
                      <i className="fas fa-chevron-right" />
                    </button>
                  </div>

                  {galleryImages.length > 1 && (
                    <div className="gallery-thumbs">
                      {galleryImages.map((src, index) => (
                        <button
                          key={index}
                          type="button"
                          className={`gallery-thumb ${
                            index === activeImageIndex ? 'gallery-thumb--active' : ''
                          }`}
                          onClick={() => setActiveImageIndex(index)}
                        >
                          <img
                            src={src}
                            alt={`${game.name} - Thumbnail ${index + 1}`}
                            onError={(e) => {
                              e.target.src =
                                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='90'%3E%3Crect fill='%23222' width='160' height='90'/%3E%3Ctext fill='%23666' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='10'%3ENo Image%3C/text%3E%3C/svg%3E";
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>

          {/* Information */}
          <div className="game-sidebar">
            <div className="sidebar-card">
              <h3>Information</h3>
              <div className="info-item">
                <strong>Price:</strong>
                <span className="game-price">{formatPrice(game.price)}</span>
              </div>
              {game.releaseDate && (
                <div className="info-item">
                  <strong>Release Date:</strong>
                  <span>{new Date(game.releaseDate).toLocaleDateString('en-US')}</span>
                </div>
              )}
              {game.featured && (
                <div className="info-item">
                  <span className="featured-badge">
                    <i className="fas fa-star"></i> Featured Game
                  </span>
                </div>
              )}
              {game.tags && game.tags.length > 0 && (
                <div className="info-item sidebar-tags">
                  <strong>Tags:</strong>
                  <div className="game-tags-inline">
                    {game.tags.slice(0, 5).map((tag, index) => (
                      <Link key={index} to={`/games?tag=${encodeURIComponent(tag)}`} className="tag-link">
                        {tag}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className="buy-section">
                {!isAuthenticated ? (
                  <Link to="/login" className="btn btn-buy btn-secondary">
                    <i className="fas fa-sign-in-alt"></i> Login to add to cart
                  </Link>
                ) : purchased ? (
                  <span className="purchased-badge">
                    <i className="fas fa-check-circle"></i> Purchased
                  </span>
                ) : inCart ? (
                  <Link to="/cart" className="btn btn-buy btn-secondary">
                    <i className="fas fa-shopping-cart"></i> View Cart
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="btn btn-buy"
                    onClick={handleAddToCart}
                    disabled={orderLoading}
                  >
                    {orderLoading ? (
                      <span className="btn-loading">Adding...</span>
                    ) : (
                      <>
                        <i className="fas fa-shopping-cart"></i>
                      </>
                    )}
                  </button>
                )}
                {orderMessage && (
                  <p className={`order-message ${orderMessage.includes('Added') || orderMessage.includes('Already') ? 'success' : 'error'}`}>
                    {orderMessage}
                  </p>
                )}
              </div>
            </div>

            <div className="sidebar-card">
              <Link to="/games" className="btn btn-secondary" style={{ width: '100%' }}>
                <i className="fas fa-arrow-left"></i> Back to list
              </Link>
            </div>
          </div>
        </div>

        <div className="game-main">
            {game.description && (
              <section className="game-section">
                <h2>Description</h2>
                <p>{game.description}</p>
              </section>
            )}

            {game.details && (
              <section className="game-section">
                <h2>Details</h2>
                <p className="game-details">{game.details}</p>
              </section>
            )}

            {/* Comment */}
            <section className="game-section comment-section">
              <h2><i className="fas fa-comments"></i> Comments</h2>
              {isAuthenticated ? (
                <form onSubmit={handleAddComment} className="comment-form">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Enter comment..."
                    rows={3}
                    maxLength={1000}
                    className="comment-input"
                  />
                  <button type="submit" className="btn btn-comment-submit" disabled={commentLoading || !commentText.trim()}>
                    {commentLoading ? 'Sending...' : 'Send'}
                  </button>
                </form>
              ) : (
                <p className="comment-login-hint">Login to comment.</p>
              )}
              <div className="comment-list">
                {comments.length === 0 ? (
                  <p className="comment-empty">No comments yet.</p>
                ) : (
                  comments.map((c) => (
                    <div key={c._id} className="comment-item">
                      <div className="comment-user">{c.user?.username || 'User'}</div>
                      <div className="comment-text">{c.text}</div>
                      <div className="comment-date">
                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-US') : ''}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
        </div>
      </div>
    </div>
  );
};

export default GameDetail;
