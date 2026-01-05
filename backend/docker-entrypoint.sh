#!/bin/sh
set -e

echo "Waiting for PostgreSQL to be ready..."

# Extract database connection info from DATABASE_URL
DB_HOST="postgres"
DB_PORT="5432"
DB_USER="${POSTGRES_USER:-battlefield}"

# Wait for PostgreSQL using nc (netcat)
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
  if nc -z $DB_HOST $DB_PORT 2>/dev/null; then
    echo "PostgreSQL is accepting connections!"
    sleep 2  # Give it 2 more seconds to fully initialize
    break
  fi
  attempt=$((attempt + 1))
  echo "PostgreSQL is unavailable - attempt $attempt/$max_attempts"
  sleep 2
done

if [ $attempt -ge $max_attempts ]; then
  echo "Failed to connect to PostgreSQL after $max_attempts attempts"
  exit 1
fi

# Run migrations
echo "Running database migrations..."
npx prisma migrate deploy

echo "Starting application..."
exec "$@"
