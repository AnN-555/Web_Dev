import { useState, useEffect } from 'react';
import { gameAPI } from '../services/api';
import GameCard from './game-card.jsx';
import './game-list.css';

const GameList = ({ featured = false, tag = null, search = null }) => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchGames();
  }, [featured, tag, search, currentPage]);

  const fetchGames = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 12,
      };

      if (featured) params.featured = true;
      if (tag) params.tag = tag;
      if (search) params.search = search;

      const response = await gameAPI.getGames(params);
      setGames(response.data);
      setPagination(response.pagination);
      setError(null);
    } catch (err) {
      setError('Không thể tải danh sách games. Vui lòng thử lại sau.');
      console.error('Error fetching games:', err);
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

  if (error) {
    return (
      <div className="error-message">
        <i className="fas fa-exclamation-triangle"></i>
        <p>{error}</p>
        <button className="btn" onClick={fetchGames}>
          Thử lại
        </button>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="no-games">
        <i className="fas fa-gamepad"></i>
        <p>Không tìm thấy game nào</p>
      </div>
    );
  }

  return (
    <div className="game-list-container">
      <div className="game-grid">
        {games.map((game) => (
          <GameCard key={game._id} game={game} />
        ))}
      </div>

      {pagination.pages > 1 && (
        <div className="pagination">
          <button
            className="btn-pagination"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <i className="fas fa-chevron-left"></i> Trước
          </button>
          <span className="page-info">
            Trang {currentPage} / {pagination.pages}
          </span>
          <button
            className="btn-pagination"
            onClick={() => setCurrentPage((prev) => Math.min(pagination.pages, prev + 1))}
            disabled={currentPage === pagination.pages}
          >
            Sau <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      )}
    </div>
  );
};

export default GameList;
