import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './header.css';

const Header = () => {
    const { user, logout, loading } = useAuth();
    return (
        <header className='header'>
            <div className='container'>
                <div className='header-content'>
                    <Link to='/' className='logo'>
                        <i className='fas fa-gamepad'></i>
                        <span>ASY Game Store</span>
                    </Link>

                    <nav className='nav'>
                        <Link to='/'>Home</Link>
                        <Link to='/'>Games</Link>
                        <Link to='/'>Blog</Link>
                        <Link to='/'>Forums</Link>
                        <Link to='/'>Contact</Link>
                    </nav>

                    <div className="user">
                        {loading ? (
                            <span className="header-loading">...</span>
                        ) : user ? (
                            <div className="user-menu">
                                <span className="user-name">
                                    <i className="fas fa-user"></i> {user.username}
                                </span>
                                <button onClick={logout} className="btn btn-logout">
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <Link to="/login" className="btn btn-login">Login / Register</Link>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;