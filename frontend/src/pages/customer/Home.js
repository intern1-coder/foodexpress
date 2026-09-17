/**
 * Home Page - Swiggy/Zomato Style
 * 
 * Features: Hero, Search, Category Filters, Restaurant Cards
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { restaurantsAPI } from '../../api';
import { useDebounce } from '../../hooks';

const CUISINE_FILTERS = [
  { id: 'all', label: 'All', icon: '🍽️' },
  { id: 'italian', label: 'Italian', icon: '🍕' },
  { id: 'chinese', label: 'Chinese', icon: '🥡' },
  { id: 'indian', label: 'Indian', icon: '🍛' },
  { id: 'mexican', label: 'Mexican', icon: '🌮' },
  { id: 'japanese', label: 'Japanese', icon: '🍣' },
  { id: 'american', label: 'American', icon: '🍔' },
  { id: 'thai', label: 'Thai', icon: '🍜' },
  { id: 'mediterranean', label: 'Mediterranean', icon: '🥗' }
];

const Home = () => {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCuisine, setActiveCuisine] = useState('all');
  const [sortBy, setSortBy] = useState('rating');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const debouncedSearch = useDebounce(searchQuery, 500);

  const fetchRestaurants = useCallback(async (pageNum = 1, reset = false) => {
    try {
      setLoading(true);
      const params = {
        page: pageNum,
        limit: 12,
        sortBy,
        sortOrder: 'DESC'
      };

      if (debouncedSearch) params.search = debouncedSearch;
      if (activeCuisine !== 'all') params.cuisine = activeCuisine;

      const response = await restaurantsAPI.getAll(params);
      const newRestaurants = response.data.data.restaurants;
      const totalPages = response.data.data.pagination.totalPages;

      if (reset) {
        setRestaurants(newRestaurants);
      } else {
        setRestaurants(prev => [...prev, ...newRestaurants]);
      }

      setHasMore(pageNum < totalPages);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, activeCuisine, sortBy]);

  useEffect(() => {
    setPage(1);
    fetchRestaurants(1, true);
  }, [fetchRestaurants]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleCuisineFilter = (cuisine) => {
    setActiveCuisine(cuisine);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchRestaurants(nextPage, false);
  };

  const handleRestaurantClick = (id) => {
    navigate(`/restaurants/${id}`);
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-bg">
          <div className="hero-content">
            <h1 className="hero-title">
              Discover the best food & drinks
            </h1>
            <p className="hero-subtitle">
              Order from restaurants near you
            </p>

            {/* Search Bar */}
            <div className="hero-search">
              <div className="search-container">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search for restaurants or food..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
                {searchQuery && (
                  <button
                    className="search-clear"
                    onClick={() => setSearchQuery('')}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Filters */}
      <section className="cuisine-filter-section">
        <div className="container">
          <div className="cuisine-filter-scroll">
            {CUISINE_FILTERS.map((cuisine) => (
              <button
                key={cuisine.id}
                className={`cuisine-chip ${activeCuisine === cuisine.id ? 'active' : ''}`}
                onClick={() => handleCuisineFilter(cuisine.id)}
              >
                <span className="cuisine-icon">{cuisine.icon}</span>
                <span className="cuisine-label">{cuisine.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Sort & Results */}
      <section className="restaurants-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">
              {activeCuisine === 'all' ? 'All Restaurants' : `${CUISINE_FILTERS.find(c => c.id === activeCuisine)?.label} Restaurants`}
              <span className="result-count">
                {restaurants.length} restaurants found
              </span>
            </h2>

            <div className="sort-controls">
              <label>Sort by:</label>
              <select
                value={sortBy}
                onChange={handleSortChange}
                className="sort-select"
              >
                <option value="rating">Rating</option>
                <option value="delivery_fee">Delivery Fee</option>
                <option value="name">Name</option>
                <option value="created_at">Newest</option>
              </select>
            </div>
          </div>

          {/* Restaurant Grid */}
          {loading && restaurants.length === 0 ? (
            <div className="restaurants-grid">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="restaurant-skeleton">
                  <div className="skeleton-image"></div>
                  <div className="skeleton-content">
                    <div className="skeleton-line"></div>
                    <div className="skeleton-line short"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : restaurants.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🔍</span>
              <h3>No restaurants found</h3>
              <p>Try adjusting your search or filters</p>
            </div>
          ) : (
            <>
              <div className="restaurants-grid">
                {restaurants.map((restaurant) => (
                  <div
                    key={restaurant.restaurantId}
                    className="restaurant-card"
                    onClick={() => handleRestaurantClick(restaurant.restaurantId)}
                  >
                    <div className="restaurant-image">
                      <div className="image-placeholder">
                        {restaurant.cuisineType.charAt(0)}
                      </div>
                      {restaurant.deliveryFee === 0 && (
                        <div className="free-delivery-badge">
                          FREE DELIVERY
                        </div>
                      )}
                    </div>

                    <div className="restaurant-content">
                      <div className="restaurant-header">
                        <h3 className="restaurant-name">{restaurant.name}</h3>
                        <div className="restaurant-rating">
                          <span className="rating-star">★</span>
                          <span className="rating-value">{restaurant.rating}</span>
                        </div>
                      </div>

                      <div className="restaurant-cuisine">
                        {restaurant.cuisineType}
                      </div>

                      <div className="restaurant-meta">
                        <span className="meta-item">
                          <span className="meta-icon">📍</span>
                          {restaurant.city}
                        </span>
                        <span className="meta-item">
                          <span className="meta-icon">🕐</span>
                          {restaurant.estimatedDeliveryTime} min
                        </span>
                      </div>

                      <div className="restaurant-footer">
                        <span className="delivery-fee">
                          {restaurant.deliveryFee === 0
                            ? 'Free delivery'
                            : `$${restaurant.deliveryFee} delivery`}
                        </span>
                        {restaurant.minimumOrder > 0 && (
                          <span className="min-order">
                            ${restaurant.minimumOrder} minimum
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Load More */}
              {hasMore && (
                <div className="load-more">
                  <button
                    className="btn btn-outline"
                    onClick={loadMore}
                    disabled={loading}
                  >
                    {loading ? 'Loading...' : 'Load More Restaurants'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">Why choose us?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <span className="feature-icon">🚀</span>
              </div>
              <h3>Lightning Fast</h3>
              <p>Get your food delivered in 30 minutes or less</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <span className="feature-icon">🎯</span>
              </div>
              <h3>Best Quality</h3>
              <p>Partnered with top-rated restaurants only</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <span className="feature-icon">💰</span>
              </div>
              <h3>Best Prices</h3>
              <p>Affordable delivery fees and great deals</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <span className="feature-icon">📱</span>
              </div>
              <h3>Live Tracking</h3>
              <p>Track your order in real-time</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
