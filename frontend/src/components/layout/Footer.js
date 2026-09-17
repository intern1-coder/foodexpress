/**
 * Footer Component
 */

import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3 className="footer-title">
            <span className="brand-icon">&#127828;</span> FoodExpress
          </h3>
          <p className="footer-description">
            Your favorite food, delivered fast to your doorstep.
          </p>
        </div>

        <div className="footer-section">
          <h4 className="footer-heading">Quick Links</h4>
          <ul className="footer-links">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/restaurants">Restaurants</Link></li>
            <li><Link to="/cart">Cart</Link></li>
            <li><Link to="/orders">My Orders</Link></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4 className="footer-heading">Account</h4>
          <ul className="footer-links">
            <li><Link to="/profile">Profile</Link></li>
            <li><Link to="/login">Login</Link></li>
            <li><Link to="/register">Register</Link></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4 className="footer-heading">Contact</h4>
          <ul className="footer-links">
            <li>Email: support@foodexpress.com</li>
            <li>Phone: +1-555-0100</li>
            <li>Address: 123 Food Street, NY</li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} FoodExpress. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
