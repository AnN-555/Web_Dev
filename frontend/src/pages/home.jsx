import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { gameAPI } from '../services/api.js';
import GameCard from '../components/game-card.jsx';
import './home.css';

const Home = () => {
  // Lấy base URL của API để tái sử dụng cho ảnh
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  const IMAGE_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

  const [featuredGames, setFeaturedGames] = useState([]);
  const [latestGames, setLatestGames] = useState([]);
  const [bannerGames, setBannerGames] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGames();
  }, []);

  // Auto-play carousel
  useEffect(() => {
    if (bannerGames.length === 0) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerGames.length);
    }, 5000); // Chuyển slide mỗi 5 giây

    return () => clearInterval(interval);
  }, [bannerGames.length]);

  const fetchGames = async () => {
    try {
      setLoading(true);

      // Lấy 5 game đầu tiên cho banner
      const bannerResponse = await gameAPI.getGames({ limit: 5 });
      setBannerGames(bannerResponse.data);

      // Lấy featured games
      const featuredResponse = await gameAPI.getGames({ featured: true, limit: 6 });
      setFeaturedGames(featuredResponse.data);

      // Lấy latest games
      const latestResponse = await gameAPI.getGames({ limit: 6, sort: '-createdAt' });
      setLatestGames(latestResponse.data);
    } catch (error) {
      console.error('Error fetching games:', error);
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

  return (
    <div className="home">
      {/* Hero Section với Carousel Banner */}
      <section className="hero">
        {bannerGames.length > 0 && (
          <div className="hero-carousel">
            {bannerGames.map((game, index) => {
              const bannerImage = `${IMAGE_BASE_URL}/database/${game.headerImage}`;

              const isActive = index === currentSlide;

              return (
                <div
                  key={game._id}
                  className={`hero-slide ${isActive ? 'active' : ''}`}
                >
                  <img
                    src={bannerImage}
                    alt={game.name}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/1920x800?text=No+Image';
                    }}
                  />
                  <div className="hero-slide-overlay">
                    <div className="container">
                      <div className="hero-slide-content">
                        <h1 className="hero-slide-title">
                          <span className="highlight">Welcome to </span> ASY Game Store
                        </h1>
                        <h2 className="hero-slide-subtitle">{game.name}</h2>
                        <p className="hero-slide-description">
                          {game.description || 'Discover amazing games and immerse yourself in incredible worlds. Explore our collection of the best games available.'}
                        </p>
                        <Link
                          to={`/game/${game.slug || game._id}`}
                          className="btn btn-hero"
                        >
                          Read More
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Featured Games */}
      {featuredGames.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">
                <i className="fas fa-star"></i> Featured Games
              </h2>
              <Link to="/games?featured=true" className="section-link">
                View all <i className="fas fa-arrow-right"></i>
              </Link>
            </div>
            <div className="game-grid">
              {featuredGames.map((game) => (
                <GameCard key={game._id} game={game} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Latest Games */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">
              <i className="fas fa-clock"></i> Recent Games
            </h2>
            <Link to="/games" className="section-link">
              View all <i className="fas fa-arrow-right"></i>
            </Link>
          </div>
          <div className="game-grid">
            {latestGames.map((game) => (
              <GameCard key={game._id} game={game} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
