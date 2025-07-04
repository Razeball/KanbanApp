#!/bin/sh

echo "Running database migrations..."
cd /app/server && npm run migrate
echo "Migrations completed. Starting server..."
cd /app && npm start 