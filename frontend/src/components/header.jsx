import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { cartAPI } from '../services/api.js';
import './header.css';

const Header = () => {
    const { user, logout, loading } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [cartCount, setCartCount] = useState(0);

    const refreshCartCount = () => {
        if (user) {
            cartAPI.getCart().then((res) => {
                const items = res.data?.items || [];
                setCartCount(items.length);
            }).catch(() => setCartCount(0));
        } else {
            setCartCount(0);
        }
    };

    useEffect(() => {
        refreshCartCount();
    }, [user]);

    useEffect(() => {
        const handler = () => refreshCartCount();
        window.addEventListener('cart-updated', handler);
        return () => window.removeEventListener('cart-updated', handler);
    }, [user]);

    const toggleMenu = () => {
        setIsMenuOpen((prev) => !prev);
    };

    const handleLogout = () => {
        setIsMenuOpen(false);
        logout();
    };

    return (
        <header className='header'>
            <div className='container'>
                <div className='header-content'>
                    <Link to='/' className='logo'>
                        <i className='fas fa-gamepad'></i>
                        <span>ASY Game Store</span>
                    </Link>

                    <div className="header-center">
                        <nav className='nav'>
                            <Link to='/'>Home</Link>
                            <Link to='/'>Games</Link>
                            <Link to='/'>Blog</Link>
                            <Link to='/'>Forums</Link>
                            <Link to='/'>Contact</Link>
                        </nav>

                        <div className="header-search">
                            <input
                                type="text"
                                placeholder="Search games..."
                                className="header-search-input"
                            />
                            <button type="button" className="header-search-btn">
                                <i className="fas fa-search"></i>
                            </button>
                        </div>
                    </div>

                    <div className="user">
                        {loading ? (
                            <span className="header-loading">...</span>
                        ) : user ? (
                            <>
                                <Link to="/cart" className="header-order-btn" title="Cart">
                                    <i className="fas fa-shopping-cart"></i>
                                    {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                                </Link>

                                <div className="user-menu">
                                    <button
                                        type="button"
                                        className="user-menu-toggle"
                                        onClick={toggleMenu}
                                    >
                                        <span className="user-name">
                                            <i className="fas fa-user"></i> {user.username}
                                        </span>
                                        <span className="user-arrow">▼</span>
                                    </button>

                                    {isMenuOpen && (
                                        <div className="user-dropdown">
                                            <div className="user-dropdown-header">
                                                <div className="user-avatar">
                                                    {user.username?.[0]?.toUpperCase()}
                                                </div>
                                                <div className="user-info">
                                                    <div className="user-handle">
                                                        @{user.username}
                                                    </div>
                                                    {user.email && (
                                                        <div className="user-email">
                                                            {user.email}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="user-dropdown-body">
                                                <Link
                                                    to="/profile"
                                                    className="user-dropdown-item"
                                                    onClick={() => setIsMenuOpen(false)}
                                                >
                                                    View my profile
                                                </Link>
                                                <Link
                                                    to="/settings"
                                                    className="user-dropdown-item"
                                                    onClick={() => setIsMenuOpen(false)}
                                                >
                                                    Settings
                                                </Link>
                                                <button
                                                    type="button"
                                                    className="user-dropdown-item logout-btn"
                                                    onClick={handleLogout}
                                                >
                                                    Sign out
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                    ) : (
                    <Link to="/login" className="btn btn-login">Login / Register</Link>
                        )}
                </div>
            </div>
        </div>
        </header >
    );
};

export default Header;