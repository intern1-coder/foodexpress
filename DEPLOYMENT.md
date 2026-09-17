# FoodExpress - Deployment Guide

## Overview

FoodExpress is a full-stack food delivery platform with:
- **Frontend**: React.js (Port 3000)
- **Backend**: Node.js/Express API (Port 5000)
- **Database**: PostgreSQL (Port 5432)

## Prerequisites

- Docker Desktop installed and running
- Docker Compose installed
- At least 4GB of RAM allocated to Docker

## Quick Start

### 1. Clone and Setup

```bash
# Navigate to project directory
cd foodproj

# Copy environment file (optional - defaults are set)
cp .env.example .env

# Edit .env to set secure passwords for production
```

### 2. Build and Start Containers

```bash
# Build all images and start containers
docker-compose up -d --build

# Watch logs (optional)
docker-compose logs -f
```

### 3. Verify Services

```bash
# Check all containers are running
docker-compose ps

# Expected output:
# foodexpress-postgres   running (healthy)
# foodexpress-backend    running (healthy)
# foodexpress-frontend   running (healthy)
```

### 4. Access Application

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000 |
| API Health | http://localhost:5000/health |
| PostgreSQL | localhost:5432 |

## Architecture

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
    │localhost  │      │ :5000     │      │ postgres_ │
    │  :3000    │      │           │      │   data    │
    └───────────┘      └───────────┘      └───────────┘
```

## Docker Services

### Frontend (Nginx)
- Serves React build files
- Proxies `/api` requests to backend
- Handles SPA routing

### Backend (Node.js)
- Express API server
- JWT authentication
- PostgreSQL connection

### Database (PostgreSQL)
- Persistent data storage
- Auto-initializes schema and seed data
- Health checks enabled

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

## Common Commands

### Start Services
```bash
docker-compose up -d
```

### Stop Services
```bash
docker-compose down
```

### Rebuild (after code changes)
```bash
docker-compose up -d --build
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Access Container Shell
```bash
# Backend shell
docker-compose exec backend sh

# Database shell
docker-compose exec postgres psql -U foodexpress_admin -d foodexpress
```

### Reset Database
```bash
# Stop and remove volumes
docker-compose down -v

# Restart (recreates database)
docker-compose up -d --build
```

## Troubleshooting

### Port Already in Use
```bash
# Find process using port
netstat -ano | findstr :3000

# Kill process or change port in .env
```

### Container Won't Start
```bash
# Check logs
docker-compose logs <service-name>

# Common issues:
# - Port conflict
# - Database connection failed
# - Missing environment variables
```

### Database Connection Issues
```bash
# Verify PostgreSQL is ready
docker-compose exec postgres pg_isready

# Check database exists
docker-compose exec postgres psql -U foodexpress_admin -l
```

### Frontend Can't Reach Backend
```bash
# Verify backend is healthy
docker-compose ps backend

# Test backend directly
curl http://localhost:5000/health
```

## Production Deployment

### 1. Update Environment Variables
```bash
# Edit .env file
POSTGRES_PASSWORD=your_secure_password_here
JWT_SECRET=your_secure_jwt_secret_here
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
```

### 2. Build for Production
```bash
docker-compose -f docker-compose.yml up -d --build
```

### 3. SSL/TLS (Recommended)
Add nginx reverse proxy with SSL:
```yaml
# Add to docker-compose.yml
nginx-proxy:
  image: nginx:alpine
  ports:
    - "443:443"
    - "80:80"
  volumes:
    - ./nginx-proxy.conf:/etc/nginx/nginx.conf
    - ./certs:/etc/nginx/certs
```

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

## Default Users (Seed Data)

| Email | Password | Role |
|-------|----------|------|
| admin@foodexpress.com | admin123 | admin |
| owner@restaurant.com | owner123 | owner |
| john@example.com | customer123 | customer |

## Network Configuration

All services communicate through `foodexpress-network`:
- Frontend → Backend: `http://backend:3000`
- Backend → Database: `postgres:5432`
- External access: Via exposed ports

## Volumes

- `foodexpress-postgres-data`: Persistent PostgreSQL data
  - Survives container restarts
  - Use `-v` flag with `docker-compose down` to remove
