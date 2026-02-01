import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { gameAPI } from '../services/api';
import GameList from '../components/game-list.jsx';
import './games.css';

const Games = () => {
  const [searchParams] = useSearchParams();
  const [tags, setTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState(searchParams.get('tag') || '');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const featured = searchParams.get('featured') === 'true';

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const response = await gameAPI.getAllTags();
      setTags(response.data);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const handleTagClick = (tag) => {
    setSelectedTag(tag === selectedTag ? '' : tag);
    setSearchQuery('');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Search will be handled by GameList component via URL params
  };

  return (
    <div className="games-page">
      <div className="container">
        <div className="games-header">
          <h1>
            <i className="fas fa-gamepad"></i> All Games
          </h1>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-wrapper">
              <i className="fas fa-search"></i>
              <input
                type="text"
                placeholder="Tìm kiếm game..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="search-clear"
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
          </form>

          {/* Tags Filter */}
          {tags.length > 0 && (
            <div className="tags-filter">
              <h3>Filter by tag:</h3>
              <div className="tags-list">
                <button
                  className={`tag-filter ${selectedTag === '' ? 'active' : ''}`}
                  onClick={() => setSelectedTag('')}
                >
                  All
                </button>
                {tags.map((tag) => (
                  <button
                    key={tag}
                    className={`tag-filter ${selectedTag === tag ? 'active' : ''}`}
                    onClick={() => handleTagClick(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <GameList
          featured={featured}
          tag={selectedTag || null}
          search={searchQuery || null}
        />
      </div>
    </div>
  );
};

export default Games;
