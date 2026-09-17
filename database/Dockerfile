# ============================================
# FoodExpress PostgreSQL Custom Image
# ============================================
# Based on official PostgreSQL image with custom initialization

FROM postgres:16-alpine

# Labels
LABEL maintainer="FoodExpress Team"
LABEL description="Custom PostgreSQL image for FoodExpress"

# Copy initialization scripts (runs on first startup)
# Files in /docker-entrypoint-initdb.d/ are executed in alphabetical order
COPY initdb.d/ /docker-entrypoint-initdb.d/

# Copy custom PostgreSQL configuration
COPY postgresql.conf /etc/postgresql/postgresql.conf

# Set the config file
CMD ["postgres", "-c", "config_file=/etc/postgresql/postgresql.conf"]
