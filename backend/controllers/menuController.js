const MenuItem = require('../models/MenuItem');
const Restaurant = require('../models/Restaurant');

// Get menu items for a restaurant
const getMenuItems = async (req, res) => {
  try {
    const { restaurantId } = req.params;

    // Verify restaurant exists
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const menuItems = await MenuItem.findByRestaurantId(restaurantId);
    res.json({ menuItems });
  } catch (error) {
    console.error('Get menu items error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create menu item (for restaurant admin)
const createMenuItem = async (req, res) => {
  try {
    const { name, description, price, category, image_url, is_available } = req.body;
    const { restaurantId } = req.params;

    // Verify restaurant belongs to current user
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    if (restaurant.owner_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to add menu items to this restaurant' });
    }

    const menuItem = await MenuItem.create({
      restaurant_id: restaurantId,
      name,
      description,
      price,
      category,
      image_url,
      is_available
    });

    res.status(201).json({
      message: 'Menu item created successfully',
      menuItem
    });
  } catch (error) {
    console.error('Create menu item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update menu item (for restaurant admin)
const updateMenuItem = async (req, res) => {
  try {
    const { name, description, price, category, image_url, is_available } = req.body;
    const { restaurantId, menuItemId } = req.params;

    // Verify restaurant belongs to current user
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    if (restaurant.owner_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update menu items for this restaurant' });
    }

    // Verify menu item exists and belongs to this restaurant
    const menuItem = await MenuItem.findById(menuItemId);
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    if (menuItem.restaurant_id !== parseInt(restaurantId)) {
      return res.status(403).json({ message: 'Menu item does not belong to this restaurant' });
    }

    const updatedMenuItem = await MenuItem.update(menuItemId, {
      name,
      description,
      price,
      category,
      image_url,
      is_available
    });

    res.json({
      message: 'Menu item updated successfully',
      menuItem: updatedMenuItem
    });
  } catch (error) {
    console.error('Update menu item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete menu item (for restaurant admin)
const deleteMenuItem = async (req, res) => {
  try {
    const { restaurantId, menuItemId } = req.params;

    // Verify restaurant belongs to current user
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    if (restaurant.owner_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete menu items from this restaurant' });
    }

    // Verify menu item exists and belongs to this restaurant
    const menuItem = await MenuItem.findById(menuItemId);
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    if (menuItem.restaurant_id !== parseInt(restaurantId)) {
      return res.status(403).json({ message: 'Menu item does not belong to this restaurant' });
    }

    await MenuItem.delete(menuItemId);

    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Delete menu item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem
};