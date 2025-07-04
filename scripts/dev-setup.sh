#!/bin/bash

echo "🛠️  KanBan Development Setup Script"
echo "=================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js (v18 or higher) first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version)
echo "📦 Node.js version: $NODE_VERSION"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL first."
    exit 1
fi

# Create database if it doesn't exist
echo "🗄️  Setting up database..."
createdb kanban_dev 2>/dev/null || echo "   Database already exists"

# Setup server
echo "🖥️  Setting up server..."
cd server
npm install

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "📝 Creating environment file..."
    cp .env.example .env
    echo "   Please edit server/.env with your database credentials"
    read -p "Press Enter to continue after editing .env file..."
fi

# Run migrations
echo "🔄 Running database migrations..."
npm run migrate

# Go back to root and setup client
cd ../client/kanban
echo "🌐 Setting up client..."
npm install

echo "✅ Development setup complete!"
echo ""
echo "🚀 To start development:"
echo "   1. Start server: cd server && npm run dev"
echo "   2. Start client: cd client/kanban && npm start"
echo "   3. Access app: http://localhost:4200" 