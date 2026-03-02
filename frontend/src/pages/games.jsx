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
      const rawTags = Array.isArray(response.data) ? response.data : [];
      const limitedTags = rawTags.slice(0, 15);
      setTags(limitedTags);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const handleTagClick = (tag) => {
    setSelectedTag(tag === selectedTag ? '' : tag);
    setSearchQuery('');
  };

  return (
    <div className="games-page">
      <div className="container">
        <div className="games-header">
          <h1>
            <i className="fas fa-gamepad"></i> All Games
          </h1>
        

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
