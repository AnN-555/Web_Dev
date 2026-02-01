import { Link } from 'react-router-dom';
import './footer.css';

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link to="/" className="footer-logo" aria-label="ASY Game Store Home">
              <i className="fas fa-gamepad"></i>
              <span>ASY Game Store</span>
            </Link>
            <p className="footer-desc">
              Discover featured picks and the latest games.
            </p>
            <div className="footer-social">
              <a href="#" className="social-btn" aria-label="Facebook">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="#" className="social-btn" aria-label="YouTube">
                <i className="fab fa-youtube"></i>
              </a>
              <a href="#" className="social-btn" aria-label="Instagram">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="#" className="social-btn" aria-label="GitHub">
                <i className="fab fa-github"></i>
              </a>
            </div>
          </div>

          <div className="footer-col">
            <h4 className="footer-title">Contact</h4>
            <ul className="footer-meta">
              <li>
                <i className="fas fa-envelope"></i>
                <span>support@asy-game-store.local</span>
              </li>
              <li>
                <i className="fas fa-location-dot"></i>
                <span>Ho Chi Minh City, Vietnam</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {year} ASY Game Store. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
