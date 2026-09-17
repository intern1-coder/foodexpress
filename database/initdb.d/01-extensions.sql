-- ============================================
-- FoodExpress - PostgreSQL Initialization
-- This script runs on first container startup
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types if needed
DO $$
BEGIN
    -- Ensure the role enum exists
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('customer', 'admin', 'delivery_partner');
    END IF;
END
$$;
