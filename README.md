# FoodExpress - Food Delivery Platform

A modern food delivery platform built with React, Node.js, PostgreSQL, and Docker.

## Prerequisites

- **Docker** (v20.10+)
- **Docker Compose** (v2.0+)
- **Node.js** (v18+) - for local development
- **Git**

## Quick Start

### 1. Clone the repository

```bash
git clone <repository-url>
cd foodproj
```

### 2. Set up environment variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your settings (optional - defaults work out of the box)
```

### 3. Start the application

```bash
# Build and start all containers
docker-compose up -d

# View logs
docker-compose logs -f

# Check container status
docker-compose ps
```

### 4. Access the services

| Service | URL | Port |
|---------|-----|------|
| Frontend | http://localhost:3000 | 3000 |
| Backend API | http://localhost:5000 | 5000 |
| PostgreSQL | localhost:5432 | 5432 |
| Health Check | http://localhost:5000/health | 5000 |

## Project Structure

```
foodproj/
├── .env                    # Environment variables (git-ignored)
├── .env.example            # Example environment file
├── .gitignore              # Git ignore rules
├── docker-compose.yml      # Docker Compose configuration
├── README.md               # Project documentation
├── DEPLOYMENT.md           # Deployment guide
│
├── database/               # PostgreSQL configuration
│   ├── Dockerfile          # Custom PostgreSQL image
│   ├── postgresql.conf     # PostgreSQL configuration
│   ├── schema.sql          # Database schema
│   ├── seed.sql            # Sample data
│   └── initdb.d/           # Initialization scripts
│       └── 01-extensions.sql
│
├── backend/                # Node.js backend
│   ├── Dockerfile          # Backend Docker image
│   ├── .dockerignore       # Docker ignore file
│   ├── package.json        # Node.js dependencies
│   └── src/
│       ├── server.js       # Express server entry
│       ├── config/
│       │   └── database.js # PostgreSQL connection
│       ├── controllers/    # Request handlers
│       ├── middleware/      # Custom middleware
│       └── routes/         # API routes
│
└── frontend/               # React frontend
    ├── Dockerfile          # Frontend Docker image (multi-stage)
    ├── nginx.conf          # Nginx configuration
    ├── .dockerignore       # Docker ignore file
    ├── package.json        # React dependencies
    └── src/
        ├── api/            # API service functions
        ├── components/     # Reusable components
        ├── context/        # React Context (Auth, Cart)
        ├── pages/          # Page components
        └── styles/         # CSS styles
```

## Docker Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Network                          │
│                (foodexpress-network)                       │
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Frontend   │    │   Backend    │    │   Database   │  │
│  │   (Nginx)    │───▶│   (Node.js)  │───▶│ (PostgreSQL) │  │
│  │  Port: 3000  │    │  Port: 3000  │    │  Port: 5432  │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                   │                   │          │
└─────────┼───────────────────┼───────────────────┼──────────┘
          │                   │                   │
    ┌─────▼─────┐      ┌─────▼─────┐      ┌─────▼─────┐
    │  Browser  │      │   Host    │      │  Volume   │
    │localhost  │      │ :5000     │      │  postgres_  │
    │  :3000    │      │           │      │   data    │
    └───────────┘      └───────────┘      └───────────┘
```

## Database Schema

### Tables

| Table | Description |
|-------|-------------|
| `users` | Customer, admin, and delivery partner accounts |
| `restaurants` | Restaurant information and settings |
| `food_items` | Menu items for each restaurant |
| `orders` | Customer orders |
| `order_items` | Individual items within an order |

### Relationships

```
users (1) ──── (many) orders
restaurants (1) ──── (many) food_items
restaurants (1) ──── (many) orders
orders (1) ──── (many) order_items
food_items (1) ──── (many) order_items
```

## Docker Commands

```bash
# Start containers (detached mode)
docker-compose up -d

# Stop containers
docker-compose down

# Stop and remove volumes (⚠️ deletes data)
docker-compose down -v

# Rebuild containers
docker-compose build --no-cache

# View logs for specific service
docker-compose logs -f postgres
docker-compose logs -f backend
docker-compose logs -f frontend

# Execute command in running container
docker-compose exec backend sh
docker-compose exec postgres psql -U foodexpress_admin -d foodexpress
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| POSTGRES_DB | foodexpress | Database name |
| POSTGRES_USER | foodexpress_admin | Database user |
| POSTGRES_PASSWORD | your_secure_password_here | Database password |
| BACKEND_PORT | 5000 | Backend API port |
| FRONTEND_PORT | 3000 | Frontend port |
| JWT_SECRET | your-super-secret-jwt-key | JWT signing key |
| NODE_ENV | development | Environment mode |

## Default Users (Seed Data)

| Email | Password | Role |
|-------|----------|------|
| admin@foodexpress.com | admin123 | admin |
| owner@restaurant.com | owner123 | owner |
| john@example.com | customer123 | customer |

## Delivery Partner Module

The Delivery Partner module allows delivery partners to log in, view assigned orders, and manage the delivery process.

### New Features

- **Delivery Partner Login**: Delivery partners can log in using their email and password at `/delivery/login`.
- **Dashboard**: View statistics on active and completed deliveries.
- **Assigned Orders**: View list of orders assigned to the delivery partner with options to accept, pick up, mark as on the way, and deliver.
- **Order Details**: View detailed information about a specific order and update delivery status.
- **Profile**: Update personal information and delivery partner specific details (vehicle type, availability).

### API Endpoints

#### Delivery Partner
- `POST /api/delivery/login` - Login as delivery partner
- `GET /api/delivery/dashboard` - Get dashboard statistics
- `GET /api/delivery/orders` - Get assigned orders
- `GET /api/delivery/orders/:id` - Get order by ID
- `PUT /api/delivery/orders/:id/accept` - Accept order
- `PUT /api/delivery/orders/:id/pickup` - Pick up order
- `PUT /api/delivery/orders/:id/on-the-way` - Mark order as on the way
- `PUT /api/delivery/orders/:id/delivered` - Mark order as delivered
- `GET /api/delivery/profile` - Get delivery partner profile
- `PUT /api/delivery/profile` - Update delivery partner profile

#### Admin
- `GET /api/admin/delivery-partners` - Get all delivery partners
- `POST /api/admin/delivery-partners` - Create delivery partner
- `PUT /api/admin/delivery-partners/:id` - Update delivery partner
- `DELETE /api/admin/delivery-partners/:id` - Delete delivery partner
- `PUT /api/admin/orders/:id/assign-delivery-partner` - Assign delivery partner to order

### Default Delivery Partners (Seed Data)

| Email | Password | Role |
|-------|----------|------|
| mike.w@email.com | delivery123 | delivery_partner |
| sarah.b@email.com | delivery123 | delivery_partner |

### Database Changes

Added `delivery_partners` table:
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key to users)
- `vehicle_type` (VARCHAR)
- `is_available` (BOOLEAN)
- `created_at` (TIMESTAMP)

Updated `orders` table:
- `delivery_partner_id` (UUID, foreign key to delivery_partners)
- `delivery_status` (VARCHAR with values: 'Assigned', 'Accepted', 'Picked Up', 'On The Way', 'Delivered')

## API Endpoints

### Auth
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user

### Restaurants
- `GET /api/restaurants` - List restaurants
- `GET /api/restaurants/:id` - Get restaurant
- `POST /api/restaurants` - Create (admin)
- `PUT /api/restaurants/:id` - Update (admin)
- `DELETE /api/restaurants/:id` - Delete (admin)

### Food Items
- `GET /api/foods` - List foods
- `GET /api/foods/:id` - Get food item
- `POST /api/foods` - Create (admin)
- `PUT /api/foods/:id` - Update (admin)
- `DELETE /api/foods/:id` - Delete (admin)

### Orders
- `GET /api/orders` - Get my orders
- `POST /api/orders` - Create order
- `GET /api/orders/:id` - Get order
- `PUT /api/orders/:id/status` - Update status (admin)
- `PUT /api/orders/:id/cancel` - Cancel order
- `GET /api/orders/all` - Get all orders (admin)

## Troubleshooting

### Container won't start

```bash
# Check container logs
docker-compose logs postgres
docker-compose logs backend
docker-compose logs frontend

# Check if ports are in use
netstat -ano | findstr :3000
netstat -ano | findstr :5000
netstat -ano | findstr :5432
```

### Database connection refused

```bash
# Ensure PostgreSQL is running
docker-compose ps

# Check health status
docker inspect foodexpress-postgres --format='{{.State.Health.Status}}'

# Reset database
docker-compose down -v
docker-compose up -d
```

### Frontend can't reach backend

```bash
# Verify backend is healthy
docker-compose ps backend

# Test backend directly
curl http://localhost:5000/health
```

### Permission denied

```bash
# Fix file permissions (Linux/Mac)
chmod 600 .env
chmod -R 755 database/
```

## License

MIT License - see [LICENSE](LICENSE) for details.

## Team

- **FoodExpress Team**