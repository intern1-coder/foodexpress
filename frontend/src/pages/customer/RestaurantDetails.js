/**
 * Restaurant Details Page - Swiggy/Zomato Style
 * 
 * Features: Restaurant Info, Category Tabs, Menu Items, Add to Cart
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { restaurantsAPI } from '../../api';
import { useCart } from '../../context';

const RestaurantDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, items: cartItems, getItemCount } = useCart();

  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [addedItems, setAddedItems] = useState({});

  useEffect(() => {
    fetchRestaurantData();
  }, [id]);

  const fetchRestaurantData = async () => {
    try {
      setLoading(true);
      const response = await restaurantsAPI.getMenu(id);
      setRestaurant(response.data.data.restaurant);
      setMenu(response.data.data.menu);

      const categories = Object.keys(response.data.data.menu);
      if (categories.length > 0) {
        setActiveCategory(categories[0]);
      }
    } catch (error) {
      console.error('Error fetching restaurant:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (item) => {
    const success = addToCart(item, restaurant);
    if (success) {
      // Show added animation
      setAddedItems(prev => ({ ...prev, [item.itemId]: true }));
      setTimeout(() => {
        setAddedItems(prev => ({ ...prev, [item.itemId]: false }));
      }, 1000);
    }
  };

  const getItemQuantityInCart = (itemId) => {
    const cartItem = cartItems.find(i => i.itemId === itemId);
    return cartItem ? cartItem.quantity : 0;
  };

  const getFilteredMenu = (categoryItems) => {
    if (!searchQuery) return categoryItems;
    return categoryItems.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const scrollToCategory = (category) => {
    setActiveCategory(category);
    const element = document.getElementById(`category-${category}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (loading) {
    return (
      <div className="loading-page">
        <div className="restaurant-skeleton-header"></div>
        <div className="container">
          <div className="menu-skeleton">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="menu-item-skeleton">
                <div className="skeleton-content">
                  <div className="skeleton-line"></div>
                  <div className="skeleton-line short"></div>
                  <div className="skeleton-line"></div>
                </div>
                <div className="skeleton-image"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="error-page">
        <div className="error-content">
          <span className="error-icon">😕</span>
          <h2>Restaurant not found</h2>
          <p>The restaurant you're looking for doesn't exist or is no longer available.</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const categories = Object.keys(menu);
  const totalItems = categories.reduce((sum, cat) => sum + menu[cat].length, 0);

  return (
    <div className="restaurant-details-page">
      {/* Restaurant Header */}
      <div className="restaurant-header-banner">
        <div className="restaurant-header-bg"></div>
        <div className="container">
          <div className="restaurant-header-content">
            <div className="restaurant-image-large">
              <div className="image-placeholder-large">
                {restaurant.cuisineType.charAt(0)}
              </div>
            </div>

            <div className="restaurant-info-section">
              <h1 className="restaurant-title">{restaurant.name}</h1>
              <p className="restaurant-cuisine">{restaurant.cuisineType}</p>

              <div className="restaurant-stats">
                <div className="stat-item">
                  <span className="stat-rating">
                    <span className="star">★</span>
                    {restaurant.rating}
                  </span>
                </div>
                <div className="stat-divider">•</div>
                <div className="stat-item">
                  <span className="stat-time">
                    <span className="icon">🕐</span>
                    {restaurant.estimatedDeliveryTime} MINS
                  </span>
                </div>
                <div className="stat-divider">•</div>
                <div className="stat-item">
                    <span className="stat-fee">
                      <span className="icon">💰</span>
                      {restaurant.deliveryFee === 0
                        ? 'FREE DELIVERY'
                        : `$${restaurant.deliveryFee} delivery`}
                    </span>
                </div>
                {restaurant.minimumOrder > 0 && (
                  <>
                    <div className="stat-divider">•</div>
                    <div className="stat-item">
                      <span className="stat-min">
                        ₹{restaurant.minimumOrder} minimum
                      </span>
                    </div>
                  </>
                )}
              </div>

              <p className="restaurant-description">{restaurant.description}</p>

              <div className="restaurant-timing">
                <span className="timing-icon">⏰</span>
                <span>
                  {restaurant.openingTime} - {restaurant.closingTime}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Section */}
      <div className="menu-section-container">
        <div className="container">
          {/* Search in Menu */}
          <div className="menu-search">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="menu-search-input"
              placeholder="Search within menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category Navigation */}
          <div className="category-nav">
            <div className="category-nav-scroll">
              {categories.map((category) => (
                <button
                  key={category}
                  className={`category-nav-item ${activeCategory === category ? 'active' : ''}`}
                  onClick={() => scrollToCategory(category)}
                >
                  {category}
                  <span className="category-count">{menu[category].length}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Menu Items by Category */}
          <div className="menu-content">
            {categories.map((category) => {
              const filteredItems = getFilteredMenu(menu[category]);
              if (filteredItems.length === 0 && searchQuery) return null;

              return (
                <div key={category} id={`category-${category}`} className="menu-category-section">
                  <div className="category-header">
                    <h2 className="category-title">{category}</h2>
                    <span className="category-item-count">
                      {filteredItems.length} items
                    </span>
                  </div>

                  <div className="menu-items-list">
                    {filteredItems.map((item) => {
                      const quantityInCart = getItemQuantityInCart(item.itemId);
                      const isAdded = addedItems[item.itemId];

                      return (
                        <div
                          key={item.itemId}
                          className={`menu-item-card ${isAdded ? 'item-added' : ''}`}
                        >
                          <div className="menu-item-info">
                            <div className="item-tags">
                              {item.isVegetarian && (
                                <span className="veg-indicator veg">
                                  <span className="dot"></span>
                                </span>
                              )}
                              {item.isVegan && (
                                <span className="veg-indicator vegan">
                                  <span className="dot"></span>
                                </span>
                              )}
                              {item.isGlutenFree && (
                                <span className="gf-badge">GF</span>
                              )}
                            </div>

                            <h3 className="item-name">{item.name}</h3>
                            <p className="item-price">${item.price.toFixed(2)}</p>
                            <p className="item-description">
                              {item.description || 'Delicious food item'}
                            </p>

                            <div className="item-meta">
                              {item.calories && (
                                <span className="meta-badge">{item.calories} cal</span>
                              )}
                              {item.preparationTime && (
                                <span className="meta-badge">
                                  ~{item.preparationTime} min
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="menu-item-action">
                            <div className="item-image-placeholder">
                              {item.name.charAt(0)}
                            </div>

                            {quantityInCart > 0 ? (
                              <div className="quantity-badge-container">
                                <button
                                  className="quantity-btn-cart"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const newQty = quantityInCart - 1;
                                    if (newQty === 0) {
                                      // Remove from cart handled by CartContext
                                    }
                                  }}
                                >
                                  −
                                </button>
                                <span className="quantity-display">{quantityInCart}</span>
                                <button
                                  className="quantity-btn-cart"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddToCart(item);
                                  }}
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <button
                                className="add-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddToCart(item);
                                }}
                              >
                                ADD
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating Cart Button */}
      {getItemCount() > 0 && (
        <div className="floating-cart">
          <div className="container">
            <div className="floating-cart-content">
              <div className="cart-info">
                <span className="cart-count">{getItemCount()} items</span>
                <span className="cart-total">
                  $
                  {cartItems
                    .reduce((sum, item) => sum + item.price * item.quantity, 0)
                    .toFixed(2)}
                </span>
              </div>
              <button
                className="view-cart-btn"
                onClick={() => navigate('/cart')}
              >
                VIEW CART →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantDetails;
