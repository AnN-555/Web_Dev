import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { forumAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './forum-detail.css';

const formatDateTime = (value) => {
  if (!value) return '';
  try {
    return new Date(value).toLocaleString('vi-VN');
  } catch {
    return '';
  }
};

const ForumDetail = () => {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const canSend = useMemo(() => {
    return isAuthenticated && text.trim().length > 0 && !sending;
  }, [isAuthenticated, text, sending]);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await forumAPI.getPostDetail(id);
      setPost(res?.data?.post || null);
      setComments(Array.isArray(res?.data?.comments) ? res.data.comments : []);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Failed to load post');
      setPost(null);
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchDetail();
  }, [id, fetchDetail]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!canSend) return;
    setSending(true);
    try {
      const res = await forumAPI.addComment(id, text.trim());
      if (res?.data?._id) {
        setComments((prev) => [...prev, res.data]);
      } else {
        await fetchDetail();
      }
      setText('');
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to add comment');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="forum-detail-page">
        <div className="container">
          <div className="forum-detail-error">
            <i className="fas fa-exclamation-triangle" /> {error || 'Post not found'}
          </div>
          <Link to="/forums" className="btn btn-secondary">
            <i className="fas fa-arrow-left" /> Back to forums
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="forum-detail-page">
      <div className="container">
        <div className="forum-detail-topbar">
          <Link to="/forums" className="btn btn-secondary">
            <i className="fas fa-arrow-left" /> Back
          </Link>
        </div>

        <article className="forum-post">
          <h1 className="forum-post-title">{post.title}</h1>
          <div className="forum-post-meta">
            <span className="forum-post-author">@{post.user?.username || 'user'}</span>
            <span className="forum-post-dot">•</span>
            <span>{formatDateTime(post.createdAt)}</span>
          </div>
          <div className="forum-post-content">{post.content}</div>
        </article>

        <section className="forum-comments">
          <h2 className="forum-section-title">
            <i className="fas fa-comment-dots" /> Comments ({comments.length})
          </h2>

          {isAuthenticated ? (
            <form className="forum-comment-form" onSubmit={handleAddComment}>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="forum-comment-textarea"
                placeholder="Viết bình luận..."
                rows={3}
                maxLength={1000}
              />
              <div className="forum-comment-actions">
                <button type="submit" className="btn" disabled={!canSend}>
                  {sending ? 'Đang gửi...' : 'Gửi bình luận'}
                </button>
              </div>
            </form>
          ) : (
            <div className="forum-login-hint">
              <Link to="/login">Đăng nhập</Link> để bình luận.
            </div>
          )}

          <div className="forum-comment-list">
            {comments.length === 0 ? (
              <div className="forum-empty">Chưa có bình luận.</div>
            ) : (
              comments.map((c) => (
                <div key={c._id} className="forum-comment-item">
                  <div className="forum-comment-head">
                    <span className="forum-comment-user">@{c.user?.username || 'user'}</span>
                    <span className="forum-post-dot">•</span>
                    <span className="forum-comment-date">{formatDateTime(c.createdAt)}</span>
                  </div>
                  <div className="forum-comment-text">{c.text}</div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ForumDetail;