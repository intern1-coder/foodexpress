const db = require('../config/database');

class Review {
  static async getOrderForReview(orderId, customerId) {
    const result = await db.query(
      `SELECT o.id, o.customer_id, o.restaurant_id, o.status,
              r.name AS restaurant_name
       FROM orders o
       JOIN restaurants r ON r.id = o.restaurant_id
       WHERE o.id = $1 AND o.customer_id = $2`,
      [orderId, customerId]
    );
    return result.rows[0];
  }

  static async getPurchasedItems(orderId) {
    const result = await db.query(
      `SELECT oi.menu_item_id, oi.name, oi.quantity, mi.restaurant_id
       FROM order_items oi
       LEFT JOIN menu_items mi ON mi.id = oi.menu_item_id
       WHERE oi.order_id = $1`,
      [orderId]
    );
    return result.rows;
  }

  static async hasRestaurantReview(orderId, customerId) {
    const result = await db.query(
      `SELECT id FROM reviews
       WHERE order_id = $1 AND customer_id = $2 AND menu_item_id IS NULL
       LIMIT 1`,
      [orderId, customerId]
    );
    return Boolean(result.rows[0]);
  }

  static async createReview({ order, customerId, restaurantRating, comment, itemRatings }) {
    return db.transaction(async (client) => {
      const restaurantReview = await client.query(
        `INSERT INTO reviews (order_id, customer_id, restaurant_id, menu_item_id, rating, comment)
         VALUES ($1, $2, $3, NULL, $4, $5) RETURNING *`,
        [order.id, customerId, order.restaurant_id, restaurantRating, comment || null]
      );

      for (const item of itemRatings) {
        await client.query(
          `INSERT INTO reviews (order_id, customer_id, restaurant_id, menu_item_id, rating)
           VALUES ($1, $2, $3, $4, $5)`,
          [order.id, customerId, order.restaurant_id, item.menu_item_id, item.rating]
        );
      }

      await client.query(
        `UPDATE restaurants r
         SET rating = COALESCE(stats.average_rating, 0),
             rating_count = COALESCE(stats.rating_count, 0)
         FROM (
           SELECT restaurant_id, ROUND(AVG(rating)::numeric, 1) AS average_rating,
                  COUNT(*)::integer AS rating_count
           FROM reviews
           WHERE restaurant_id = $1 AND menu_item_id IS NULL
           GROUP BY restaurant_id
         ) stats
         WHERE r.id = $1`,
        [order.restaurant_id]
      );

      for (const item of itemRatings) {
        await client.query(
          `UPDATE menu_items mi
           SET rating = COALESCE(stats.average_rating, 0),
               rating_count = COALESCE(stats.rating_count, 0)
           FROM (
             SELECT menu_item_id, ROUND(AVG(rating)::numeric, 1) AS average_rating,
                    COUNT(*)::integer AS rating_count
             FROM reviews
             WHERE menu_item_id = $1
             GROUP BY menu_item_id
           ) stats
           WHERE mi.id = $1`,
          [item.menu_item_id]
        );
      }

      return restaurantReview.rows[0];
    });
  }

  static async getRestaurantInsights(restaurantId, limit = 20) {
    const summary = await db.query(
      `SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0) AS restaurant_rating,
              COUNT(*)::integer AS restaurant_review_count
       FROM reviews
       WHERE restaurant_id = $1 AND menu_item_id IS NULL`,
      [restaurantId]
    );
    const itemSummary = await db.query(
      `SELECT mi.id AS item_id, mi.name,
              COALESCE(ROUND(AVG(rv.rating)::numeric, 1), 0) AS average_rating,
              COUNT(rv.id)::integer AS rating_count
       FROM menu_items mi
       LEFT JOIN reviews rv ON rv.menu_item_id = mi.id
       WHERE mi.restaurant_id = $1
       GROUP BY mi.id, mi.name
       ORDER BY mi.name`,
      [restaurantId]
    );
    const recent = await db.query(
      `SELECT rv.id, rv.order_id, rv.rating, rv.comment, rv.created_at,
              u.name AS customer_name,
              COALESCE(json_agg(json_build_object(
                'menu_item_id', ir.menu_item_id, 'rating', ir.rating
              ) ORDER BY ir.id) FILTER (WHERE ir.id IS NOT NULL), '[]') AS item_ratings
       FROM reviews rv
       JOIN users u ON u.id = rv.customer_id
       LEFT JOIN reviews ir ON ir.order_id = rv.order_id
         AND ir.customer_id = rv.customer_id AND ir.menu_item_id IS NOT NULL
       WHERE rv.restaurant_id = $1 AND rv.menu_item_id IS NULL
       GROUP BY rv.id, u.name
       ORDER BY rv.created_at DESC
       LIMIT $2`,
      [restaurantId, limit]
    );
    return {
      summary: {
        restaurant_rating: Number(summary.rows[0].restaurant_rating),
        restaurant_review_count: summary.rows[0].restaurant_review_count,
        item_ratings: itemSummary.rows
      },
      recent_reviews: recent.rows
    };
  }
}

module.exports = Review;
