/**
 * Delivery Partner Login Page
 */

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context';
import { Input, Button } from '../../components/ui';

const DeliveryLogin = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/delivery/dashboard';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      // Delivery partners are stored in the users table, so the
      // standard auth login works for them too.
      const result = await login(formData.email, formData.password);

      // login() resolves with the response body: { success, message, data: { user, token } }
      const loggedInUser = result?.data?.user;

      // After login, check if the user is a delivery partner
      if (loggedInUser && loggedInUser.role === 'delivery_partner') {
        navigate(from, { replace: true });
      } else {
        // If not a delivery partner, show error and logout
        setErrors({ general: 'Access denied. Delivery partner role required.' });
        logout();
      }
    } catch (error) {
      setErrors({
        general: error.response?.data?.message || 'Login failed'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Delivery Partner Login</h1>
            <p>Sign in to your delivery account</p>
          </div>

          {errors.general && (
            <div className="alert alert-error">{errors.general}</div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />

            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />

            <Button type="submit" fullWidth loading={loading}>
              Login
            </Button>
          </form>

          <div className="auth-footer">
            <p>
              Having trouble?{' '}
              <Link to="/">Contact Support</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryLogin;