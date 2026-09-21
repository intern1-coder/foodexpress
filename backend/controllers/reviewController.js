const Review = require('../models/Review');
const Restaurant = require('../models/Restaurant');

const validRating = (value) => Number.isInteger(value) && value >= 1 && value <= 5;

const submitReview = async (req, res) => {
  try {
    const orderId = Number(req.params.id);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({ message: 'Invalid order id' });
    }

    const { restaurant_rating, rating, comment, item_ratings = [] } = req.body;
    const restaurantRating = restaurant_rating === undefined ? rating : restaurant_rating;
    if (!validRating(restaurantRating)) {
      return res.status(400).json({ message: 'Restaurant rating must be an integer from 1 to 5' });
    }
    if (!Array.isArray(item_ratings)) {
      return res.status(400).json({ message: 'item_ratings must be an array' });
    }

    const order = await Review.getOrderForReview(orderId, req.user.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found for this customer' });
    }
    if (order.status !== 'delivered') {
      return res.status(400).json({ message: 'Only delivered orders can be reviewed' });
    }
    if (await Review.hasRestaurantReview(orderId, req.user.id)) {
      return res.status(409).json({ message: 'This order has already been reviewed' });
    }

    const purchasedItems = await Review.getPurchasedItems(orderId);
    const purchasedIds = new Set(
      purchasedItems
        .filter((item) => item.restaurant_id === order.restaurant_id && item.menu_item_id !== null)
        .map((item) => Number(item.menu_item_id))
    );
    const seenIds = new Set();
    const normalizedItems = [];
    for (const item of item_ratings) {
      if (!item || typeof item !== 'object') {
        return res.status(400).json({ message: 'Each item rating must include menu_item_id and rating' });
      }
      const menuItemId = Number(item.menu_item_id);
      if (!Number.isInteger(menuItemId) || menuItemId <= 0 || !purchasedIds.has(menuItemId)) {
        return res.status(400).json({ message: `Menu item ${item.menu_item_id} was not purchased in this order` });
      }
      if (seenIds.has(menuItemId)) {
        return res.status(400).json({ message: `Duplicate rating for menu item ${menuItemId}` });
      }
      if (!validRating(item.rating)) {
        return res.status(400).json({ message: `Rating for menu item ${menuItemId} must be an integer from 1 to 5` });
      }
      seenIds.add(menuItemId);
      normalizedItems.push({ menu_item_id: menuItemId, rating: item.rating });
    }

    const review = await Review.createReview({
      order,
      customerId: req.user.id,
      restaurantRating,
      comment,
      itemRatings: normalizedItems
    });
    res.status(201).json({ message: 'Review submitted successfully', review });
  } catch (error) {
    console.error('Submit review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getRatingInsights = async (req, res) => {
  try {
    const restaurant = await Restaurant.findByOwnerId(req.user.id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    const insights = await Review.getRestaurantInsights(restaurant.id);
    res.json({ restaurant_id: restaurant.id, ...insights });
  } catch (error) {
    console.error('Get rating insights error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { submitReview, getRatingInsights };
