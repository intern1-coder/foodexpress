# Food Express - Food Delivery Application

A full-stack food delivery application built with Node.js, Express.js, PostgreSQL, JWT authentication, and role-based access control. Features three user roles: Customer, Restaurant Admin, and Delivery Partner.

## Features

### Customer Role
- Browse restaurants and menu items (with menu modal and cart)
- Place orders with payment mode (Cash on Delivery / Online)
- View order history and cancel pending orders
- Live track order status and delivery partner location
- Manage profile

### Restaurant Admin Role
- Manage restaurant profile
- Add/update/remove menu items
- Accept / reject incoming orders (with reason)
- Move orders through preparing -> ready for pickup (auto-generates a pickup OTP)
- Assign an available delivery partner to each order
- View sales/analytics dashboard

### Delivery Partner Role
- Go online/offline to appear in the assignment pool
- Accept/reject assigned deliveries
- Verify the 6-digit pickup OTP before taking the food
- Share live location so the customer can track the delivery
- Confirm payment mode at drop-off (COD cash collected / online already paid)
- View delivery history and earnings

## Technology Stack

### Backend
- Node.js
- Express.js
- PostgreSQL
- JWT Authentication
- Role-Based Access Control

### Frontend
- HTML5
- CSS3
- JavaScript (ES6+)
- Responsive Design

## Project Structure
```
foodexpress/
├── backend/
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Custom middleware (auth, validation)
│   ├── models/          # Database models
│   ├── routes/          # API route definitions
│   ├── config/          # Configuration files
│   ├── utils/           # Utility functions
│   └── validators/      # Input validation schemas
├── frontend/
│   ├── index.html          # Role selection (entry point)
│   ├── auth/               # Login / registration for all roles
│   ├── customer/           # Customer-facing interface
│   ├── restaurant/         # Restaurant admin interface
│   ├── delivery/           # Delivery partner interface
│   └── assets/             # CSS, images, JS files
├── database_init.sql    # Database initialization script
├── package.json         # Project dependencies and scripts
└── .env                 # Environment variables
```

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL
- npm or yarn

### Backend Setup
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on the example below:
   ```
   PORT=5000
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=password
   DB_NAME=foodexpress
   JWT_SECRET=your-secret-key-change-in-production
   JWT_EXPIRES_IN=24h
   ```
4. Set up the database:
   ```bash
   # Create the database
   createdb foodexpress

   # Run the migration (creates tables + adds new columns for OTP/payment/tracking)
   npm run migrate

   # OR initialize from the SQL script directly
   psql -U postgres -d foodexpress -f database_init.sql
   ```
5. Start the server:
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

### Frontend Setup
The frontend consists of static HTML, CSS, and JavaScript modules (ES modules) that communicate with the backend API.

1. Open `frontend/index.html` in a browser and pick a role (Customer / Restaurant Admin / Delivery Partner).
2. You will be taken to `frontend/auth/index.html` where you can login or register for that role.
3. After login you land on your role's dashboard.

To serve the frontend with a simple server:
```bash
npx serve frontend
```

## API Endpoints

### Authentication
- `POST /api/register` - Register a new user (`role` can be customer / restaurant_admin / delivery_partner; delivery partners pass `vehicle_type`)
- `POST /api/login` - Login user
- `GET /api/profile` - Get current user profile (requires auth)
- `PUT /api/profile` - Update profile (name, phone, address, vehicle_type)

### Restaurants
- `GET /api/restaurants` - Get all active restaurants (public)
- `POST /api/restaurants` - Create restaurant (restaurant_admin only)
- `GET /api/restaurants/profile` - Get restaurant profile (restaurant_admin only)
- `GET /api/restaurant/dashboard` - Stats + recent orders (restaurant_admin only)
- `PUT /api/restaurants/:id` - Update restaurant (restaurant_admin only)

### Menu Items
- `GET /api/restaurants/:restaurantId/menu` - Get menu items for a restaurant
- `POST /api/restaurants/:restaurantId/menu` - Create menu item (restaurant_admin only)
- `PUT /api/restaurants/:restaurantId/menu/:menuItemId` - Update menu item (restaurant_admin only)
- `DELETE /api/restaurants/:restaurantId/menu/:menuItemId` - Delete menu item (restaurant_admin only)

### Orders (Customer)
- `POST /api/orders` - Create order (customer only; body has `items`, `delivery_address`, `payment_mode` cod/online)
- `GET /api/orders` - Get customer's orders (customer only)
- `GET /api/orders/:id` - Order detail with items + tracking info (all roles with access)
- `POST /api/orders/:id/cancel` - Cancel order while pending/accepted (customer only)

### Orders (Restaurant Admin)
- `GET /api/restaurant/orders` - Get restaurant's orders (restaurant_admin only)
- `PUT /api/orders/:id/accept` - Accept order: pending -> accepted
- `PUT /api/orders/:id/reject` - Reject order with reason: pending -> rejected
- `PUT /api/orders/:id/status` - Kitchen status: accepted -> preparing -> ready_for_pickup (generates OTP)
- `POST /api/orders/:id/assign` - Assign a delivery partner to the order

### Deliveries (Delivery Partner)
- `GET /api/deliveries` - Get partner's deliveries incl. items and order status
- `PUT /api/deliveries/:id/accept` - Accept an assigned delivery
- `PUT /api/deliveries/:id/reject` - Reject an assigned delivery (order is freed for reassignment)
- `PUT /api/deliveries/:id/verify-otp` - Verify pickup OTP -> picked_up
- `PUT /api/deliveries/:id/status` - Set out_for_delivery / delivered (delivered confirms payment + credits earnings)
- `POST /api/deliveries/:id/location` - Send live lat/lng (tracking)
- `GET /api/deliveries/:id/track` - Get partner live location (customer/restaurant/partner)
- `PUT /api/delivery/toggle-online` - Go online/offline (delivery partner only)
- `GET /api/delivery/earnings` - Earnings summary (delivery partner only)

### Assignment (Restaurant Admin)
- `GET /api/delivery/available-partners` - List online, available delivery partners

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| DB_HOST | Database host | localhost |
| DB_PORT | Database port | 5432 |
| DB_USER | Database user | postgres |
| DB_PASSWORD | Database password | password |
| DB_NAME | Database name | foodexpress |
| JWT_SECRET | Secret key for JWT signing | your-secret-key-change-in-production |
| JWT_EXPIRES_IN | JWT expiration time | 24h |

## Security Features

- JWT-based authentication
- Password hashing using bcrypt
- Role-based access control middleware
- Input validation and sanitization
- CORS protection
- HTTPS ready (configure in production)

## Development

### Running Tests
```bash
npm test
```

### Linting
(Add your preferred linting setup)

### Database Migrations
For production use, consider implementing a proper migration system like Sequelize or Knex.js.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by various food delivery platforms
- Built with Node.js and Express.js
- PostgreSQL for reliable data storage
- JWT for secure authentication