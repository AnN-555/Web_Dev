import { Link } from 'react-router-dom';
import './header.css';

const Header = () => {
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
                        <Link to="/" className="btn btn-login">Login / Register</Link>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;