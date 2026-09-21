/**
 * Navbar Component
 * 
 * Main navigation bar
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, useCart } from '../../context';

const Navbar = () => {
  const { isAuthenticated, user, logout, isAdmin, isCustomer, isDeliveryPartner } = useAuth();
  const { getItemCount } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">&#127828;</span>
          <span className="brand-text">FoodExpress</span>
        </Link>

        <button
          className="navbar-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span className="hamburger"></span>
        </button>

        <div className={`navbar-menu ${menuOpen ? 'active' : ''}`}>
          <div className="navbar-nav">
            <Link to="/" className="nav-link" onClick={() => setMenuOpen(false)}>
              Home
            </Link>

            {isAuthenticated && isCustomer() && (
              <>
                <Link to="/orders" className="nav-link" onClick={() => setMenuOpen(false)}>
                  My Orders
                </Link>
                <Link to="/cart" className="nav-link cart-link" onClick={() => setMenuOpen(false)}>
                  Cart
                  {getItemCount() > 0 && (
                    <span className="cart-badge">{getItemCount()}</span>
                  )}
                </Link>
              </>
            )}

            {isAuthenticated && isDeliveryPartner() && (
              <>
                <Link to="/delivery" className="nav-link" onClick={() => setMenuOpen(false)}>
                  Dashboard
                </Link>
                <Link to="/delivery/orders" className="nav-link" onClick={() => setMenuOpen(false)}>
                  My Deliveries
                </Link>
              </>
            )}

            {isAdmin() && (
              <Link to="/admin" className="nav-link" onClick={() => setMenuOpen(false)}>
                Admin Dashboard
              </Link>
            )}
          </div>

          <div className="navbar-auth">
            {isAuthenticated ? (
              <div className="user-menu">
                <Link to={isDeliveryPartner() ? "/delivery/profile" : "/profile"} className="nav-link user-link" onClick={() => setMenuOpen(false)}>
                  {user?.firstName}
                </Link>
                <button className="btn btn-outline btn-sm" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline btn-sm" onClick={() => setMenuOpen(false)}>
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm" onClick={() => setMenuOpen(false)}>
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
