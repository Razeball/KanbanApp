# KanBan Application Deployment Guide

This guide covers different deployment scenarios for the KanBan application.

## Table of Contents

1. [Quick Start (Docker)](#quick-start-docker)
2. [Production Deployment](#production-deployment)
3. [Development Setup](#development-setup)
4. [Environment Configuration](#environment-configuration)
5. [Database Management](#database-management)
6. [Monitoring and Maintenance](#monitoring-and-maintenance)
7. [Troubleshooting](#troubleshooting)

## Quick Start (Docker)

### Prerequisites
- Docker and Docker Compose installed
- 2GB+ RAM available
- Ports 80, 3000, 5432 available

### 1. Clone and Setup
```bash
git clone <repository-url>
cd KanBan
```

### 2. Deploy with One Command
```bash
./scripts/deploy.sh
```

This script will:
- Check for dependencies
- Set up environment variables
- Build and start all services
- Run database migrations
- Confirm deployment success

### 3. Access Application
- **Application**: http://localhost
- **Health Check**: http://localhost/health
- **Database**: localhost:5432

## Production Deployment

### Option 1: Docker Compose (Recommended)

#### Step 1: Environment Setup
```bash
# Copy environment template
cp server/.env.example server/.env

# Edit with production values
nano server/.env
```

**Required Environment Variables:**
```bash
NODE_ENV=production
DB_USERNAME=kanban_user
DB_PASSWORD=secure_password_here
DB_NAME=kanban_prod
HOST=database
JWT_SECRET=your-256-bit-secret-key
PORT=3000
```

#### Step 2: Deploy
```bash
# Use production compose file
docker-compose -f docker-compose.prod.yml up -d --build

# Or use convenience script
./scripts/deploy.sh
```

#### Step 3: Verify Deployment
```bash
# Check service status
docker-compose ps

# Check logs
docker-compose logs -f

# Test health endpoint
curl http://localhost/health
```

### Option 2: Separate Deployment

#### Server Deployment
```bash
cd server
npm install --production
npm run migrate
npm start
```

#### Client Deployment
```bash
cd client/kanban
npm install
npm run build:prod

# Serve with nginx or Apache
# Copy dist/kanban/* to web server root
```

#### Database Setup
```bash
# Create PostgreSQL database
createdb kanban_prod

# Set environment variables
export DB_NAME=kanban_prod
export DB_USERNAME=kanban_user
export DB_PASSWORD=secure_password

# Run migrations
cd server && npm run migrate
```

## Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- npm 8+

### Automated Setup
```bash
./scripts/dev-setup.sh
```

### Manual Setup

#### 1. Database Setup
```bash
# Create development database
createdb kanban_dev
```

#### 2. Server Setup
```bash
cd server
npm install
cp .env.example .env
# Edit .env with local database credentials
npm run migrate
npm run dev
```

#### 3. Client Setup
```bash
cd client/kanban
npm install
npm start
```

#### 4. Access Development
- **Client**: http://localhost:4200
- **Server**: http://localhost:3000
- **Database**: localhost:5432

## Environment Configuration

### Server Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| NODE_ENV | Environment mode | development | No |
| DB_USERNAME | Database username | - | Yes |
| DB_PASSWORD | Database password | - | Yes |
| DB_NAME | Database name | - | Yes |
| HOST | Database host | localhost | Yes |
| JWT_SECRET | JWT signing secret | - | Yes |
| PORT | Server port | 3000 | No |

### Client Environment

Client configuration is handled through Angular's environment files:
- `src/environments/environment.ts` (development)
- `src/environments/environment.prod.ts` (production)

## Database Management

### Migrations
```bash
# Run all pending migrations
npm run migrate

# Rollback last migration
npm run migrate:undo

# Check migration status
npx sequelize-cli db:migrate:status
```

### Seeding
```bash
# Run all seeders
npm run seed

# Rollback all seeders
npm run seed:undo
```

### Backup and Restore
```bash
# Create backup
./scripts/backup.sh

# Restore from backup
./scripts/restore.sh backups/kanban_backup_20240101_120000.sql
```

## Monitoring and Maintenance

### Health Checks
```bash
# Application health
curl http://localhost/health

# Database health
docker-compose exec database pg_isready -U kanban_user -d kanban_prod
```

### Log Management
```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f server
docker-compose logs -f client
docker-compose logs -f database
```

### Performance Monitoring
```bash
# Check resource usage
docker stats

# Database performance
docker-compose exec database psql -U kanban_user -d kanban_prod -c "SELECT * FROM pg_stat_activity;"
```

### Updates and Maintenance
```bash
# Update application
git pull origin main
docker-compose down
docker-compose up -d --build

# Update database
npm run migrate

# Backup before updates
./scripts/backup.sh
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed
```bash
# Check database status
docker-compose exec database pg_isready -U kanban_user -d kanban_prod

# Check environment variables
docker-compose exec server env | grep DB_

# Reset database connection
docker-compose restart database
```

#### 2. Frontend Not Loading
```bash
# Check nginx logs
docker-compose logs client

# Verify build
docker-compose exec client ls -la /usr/share/nginx/html

# Check network connectivity
docker-compose exec client curl http://server:3000/health
```

#### 3. Real-time Features Not Working
```bash
# Check Socket.IO connection
# Browser console should show: "Socket.IO connection established"

# Verify server Socket.IO
docker-compose logs server | grep -i socket
```

#### 4. JWT Authentication Issues
```bash
# Check JWT_SECRET is set
docker-compose exec server env | grep JWT_SECRET

# Verify token in browser
# Check Application -> Cookies -> JWT token
```

### Recovery Procedures

#### Database Recovery
```bash
# Stop services
docker-compose down

# Start only database
docker-compose up -d database

# Restore from backup
./scripts/restore.sh backups/latest_backup.sql

# Restart all services
docker-compose up -d
```

#### Complete Reset
```bash
# Stop and remove all containers
docker-compose down -v

# Remove images
docker-compose down --rmi all

# Clean rebuild
docker-compose up -d --build
```

### Support and Debugging

#### Enable Debug Mode
```bash
# Add to server/.env
DEBUG=*

# Restart server
docker-compose restart server
```

#### Database Debug
```bash
# Connect to database
docker-compose exec database psql -U kanban_user -d kanban_prod

# Check tables
\dt

# Check recent activity
SELECT * FROM pg_stat_activity;
```

#### Application Debug
```bash
# Check application logs
docker-compose logs -f server | grep -i error

# Check network issues
docker-compose exec server curl -v http://database:5432
```

## Security Considerations

### Production Security Checklist

- [ ] Change default JWT_SECRET
- [ ] Use strong database passwords
- [ ] Enable HTTPS with SSL certificates
- [ ] Configure firewall rules
- [ ] Regular security updates
- [ ] Database connection encryption
- [ ] Rate limiting implementation
- [ ] Input validation and sanitization

### SSL/HTTPS Setup

For production, configure reverse proxy (nginx/Apache) with SSL:

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
``` 