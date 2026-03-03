import { Link } from 'react-router-dom';
import './game-card.css';

const GameCard = ({ game }) => {

    // Lấy base URL của API để tái sử dụng cho ảnh
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    // Bỏ hậu tố `/api` để lấy domain gốc của backend
    const IMAGE_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');
    const imagePath = `${IMAGE_BASE_URL}/database/${game.headerImage}`;

    return (
        <div className='game-card'>
            <Link to={`/games/${game.slug || game.id}`}>
                <div className='game-card-image'>
                    <img src={imagePath}
                        alt={game.name}
                        onError={(e) => {
                            e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23222' width='400' height='300'/%3E%3Ctext fill='%23666' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14'%3ENo Image%3C/text%3E%3C/svg%3E";
                        }}
                    />

                </div>
                <div className="game-card-content">
                    <h3 className="game-card-title">{game.name}</h3>
                    <div className="game-card-tags">
                        {game.tags && game.tags.slice(0, 3).map((tag, index) => (
                            <span key={index} className="tag">{tag}</span>
                        ))}
                    </div>
                    {game.rating && (
                        <div className="game-card-rating">
                            <i className="fas fa-star"></i>
                            <span>{game.rating.toFixed(1)}</span>
                        </div>
                    )}
                </div>
            </Link>
        </div>
    )
}

export default GameCard;