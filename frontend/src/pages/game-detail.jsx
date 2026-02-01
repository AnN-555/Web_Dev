import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { gameAPI } from '../services/api';
import './game-detail.css';

const GameDetail = () => {
  const { slug } = useParams();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchGame();
  }, [slug]);

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

  const headerImagePath = `/database/${game.headerImage}`;

  return (
    <div className="game-detail">
      {/* Hero Image */}
      <div className="game-hero">
        <img
          src={headerImagePath}
          alt={game.name}
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/1200x400?text=No+Image';
          }}
        />
        <div className="game-hero-overlay">
          <div className="container">
            <h1 className="game-title">{game.name}</h1>
            {game.rating && (
              <div className="game-rating">
                <i className="fas fa-star"></i>
                <span>{game.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container">
        <div className="game-content">
          {/* Main Content */}
          <div className="game-main">
            {game.description && (
              <section className="game-section">
                <h2>Description</h2>
                <p>{game.description}</p>
              </section>
            )}

            {/* Images Gallery */}
            {game.images && game.images.length > 0 && (
              <section className="game-section">
                <h2>Images</h2>
                <div className="game-gallery">
                  {game.images.map((image, index) => {
                    const imagePath = `/database/${image}`;
                    return (
                      <div key={index} className="gallery-item">
                        <img
                          src={imagePath}
                          alt={`${game.name} - Image ${index + 1}`}
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Tags */}
            {game.tags && game.tags.length > 0 && (
              <section className="game-section">
                <h2>Tags</h2>
                <div className="game-tags">
                  {game.tags.map((tag, index) => (
                    <Link
                      key={index}
                      to={`/games?tag=${encodeURIComponent(tag)}`}
                      className="tag-link"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="game-sidebar">
            <div className="sidebar-card">
              <h3>Information</h3>
              <div className="info-item">
                <strong>Link:</strong>
                <a
                  href={game.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="external-link"
                >
                  Buy Game <i className="fas fa-external-link-alt"></i>
                </a>
              </div>
              {game.releaseDate && (
                <div className="info-item">
                  <strong>Release Date:</strong>
                  <span>{new Date(game.releaseDate).toLocaleDateString('vi-VN')}</span>
                </div>
              )}
              {game.featured && (
                <div className="info-item">
                  <span className="featured-badge">
                    <i className="fas fa-star"></i> Featured Game
                  </span>
                </div>
              )}
            </div>

            <div className="sidebar-card">
              <Link to="/games" className="btn btn-secondary" style={{ width: '100%' }}>
                <i className="fas fa-arrow-left"></i> Back to list
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameDetail;
