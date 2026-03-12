import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { forumAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './forums.css';

const formatDateTime = (value) => {
  if (!value) return '';
  try {
    return new Date(value).toLocaleString('vi-VN');
  } catch {
    return '';
  }
};

const Forums = () => {
  const { isAuthenticated } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const canCreate = useMemo(() => {
    return isAuthenticated && title.trim().length >= 3 && content.trim().length >= 3 && !creating;
  }, [isAuthenticated, title, content, creating]);

  const fetchPosts = async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await forumAPI.getPosts({ limit: 20, ...params });
      setPosts(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Failed to load posts');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleSearch = async () => {
    const q = search.trim();
    await fetchPosts(q ? { search: q } : {});
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!canCreate) return;
    setCreating(true);
    try {
      const res = await forumAPI.createPost({ title: title.trim(), content: content.trim() });
      if (res?.data?._id) {
        setPosts((prev) => [res.data, ...prev]);
      } else {
        await fetchPosts(search.trim() ? { search: search.trim() } : {});
      }
      setTitle('');
      setContent('');
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to create post');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="forums-page">
      <div className="container">
        <div className="forums-header">
          <h1>
            <i className="fas fa-comments" /> Forums
          </h1>
          <p className="forums-subtitle">Discussion forum — view freely, post, and comment when logged in.</p>
        </div>

        <div className="forums-toolbar">
          <div className="forums-search">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="forums-search-input"
              placeholder="Search by title / content..."
            />
            <button type="button" className="btn btn-secondary" onClick={handleSearch} disabled={loading}>
              Search
            </button>
          </div>
          <button type="button" className="btn btn-secondary" onClick={() => fetchPosts()} disabled={loading}>
            Refresh
          </button>
        </div>

        {error && (
          <div className="forums-error">
            <i className="fas fa-exclamation-triangle" /> {error}
          </div>
        )}

        <section className="forums-create">
          <h2 className="forums-section-title">Create Discussion Post</h2>
          {isAuthenticated ? (
            <form className="forums-form" onSubmit={handleCreate}>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="forums-input"
                placeholder="Title (3–120 characters)"
                maxLength={120}
              />
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="forums-textarea"
                placeholder="Content (3–5000 characters)"
                rows={5}
                maxLength={5000}
              />
              <div className="forums-form-actions">
                <button type="submit" className="btn" disabled={!canCreate}>
                  {creating ? 'Creating...' : 'Create Post'}
                </button>
              </div>
            </form>
          ) : (
            <div className="forums-login-hint">
              You are not logged in. <Link to="/login">Log in</Link> to create a post.
            </div>
          )}
        </section>

        <section className="forums-list">
          <h2 className="forums-section-title">Discussion</h2>
          {loading ? (
            <div className="loading">
              <div className="spinner" />
            </div>
          ) : posts.length === 0 ? (
            <div className="forums-empty">No discussion posts yet.</div>
          ) : (
            <div className="forums-cards">
              {posts.map((p) => (
                <Link key={p._id} to={`/forums/${p._id}`} className="forums-card">
                  <div className="forums-card-title">{p.title}</div>
                  <div className="forums-card-meta">
                    <span className="forums-card-author">@{p.user?.username || 'user'}</span>
                    <span className="forums-card-dot">•</span>
                    <span>{formatDateTime(p.createdAt)}</span>
                    <span className="forums-card-dot">•</span>
                    <span>{p.commentCount || 0} comments</span>
                  </div>
                  <div className="forums-card-preview">
                    {(p.content || '').slice(0, 140)}
                    {(p.content || '').length > 140 ? '…' : ''}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Forums;