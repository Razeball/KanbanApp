# ProDoku Board Application

A full-stack collaborative KanBan board application built with Angular and Node.js, featuring real-time collaboration, board management, and Markdown export/import capabilities.

## Features

- **Real-time Collaboration**: Live updates with Socket.IO
- **Board Management**: Create, edit, and delete boards with lists and cards
- **User Authentication**: Secure login and registration system
- **Drag & Drop**: Intuitive card movement between lists
- **Markdown Export/Import**: Export boards to Markdown and import them back
- **Document Management**: Rich text editing with Markdown support
- **Responsive Design**: Modern UI with TailwindCSS
- **Real-time Notifications**: Instant updates for collaboration events

## Tech Stack

### Frontend (Angular)
- **Framework**: Angular 20
- **Styling**: TailwindCSS
- **Real-time**: Socket.IO Client
- **HTTP Client**: Angular HttpClient
- **Markdown**: Marked.js

### Backend (Node.js)
- **Runtime**: Node.js with ES Modules
- **Framework**: Express.js
- **Database**: PostgreSQL with Sequelize ORM
- **Authentication**: JWT + Passport.js
- **Real-time**: Socket.IO
- **Password Hashing**: bcrypt

### Database
- **Database**: PostgreSQL
- **ORM**: Sequelize
- **Migrations**: Sequelize CLI

## Quick Start (Development)

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL
- npm

### 1. Clone the Repository
```bash
git clone <repository-url>
cd KanBan
```

### 2. Setup Database
```bash
# Create PostgreSQL database
createdb kanban_dev
```

### 3. Setup Server
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run migrate
npm run dev
```

### 4. Setup Client
```bash
cd ../client/kanban
npm install
npm start
```

### 5. Access the Application
- Frontend: http://localhost:4200
- Backend API: http://localhost:3000

## Production Deployment (Docker)

### Prerequisites
- Docker
- Docker Compose

### 1. Clone and Configure
```bash
git clone <repository-url>
cd KanBan
```

### 2. Environment Configuration
```bash
# Copy and edit environment variables
cp server/.env.example server/.env
# Edit JWT_SECRET and database credentials in server/.env
```

### 3. Build and Run
```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

### 4. Access the Application
- Application: http://localhost
- Database: localhost:5432

### 5. Stop Services
```bash
docker-compose down
```

## Architecture

### Frontend Structure
```
client/kanban/src/
├── app/
│   ├── components/          # Angular components
│   │   ├── board/          # Board management
│   │   ├── card/           # Card components
│   │   ├── list/           # List components
│   │   └── ...
│   ├── services/           # Angular services
│   │   ├── auth/           # Authentication
│   │   ├── board/          # Board operations
│   │   └── ...
│   └── models/             # TypeScript interfaces
```

### Backend Structure
```
server/
├── controllers/            # Route handlers
├── models/                 # Sequelize models
├── routes/                 # API routes
├── migrations/             # Database migrations
├── config/                 # Configuration files
└── services/               # Business logic
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Boards
- `GET /api/boards` - Get user's boards
- `POST /api/boards` - Create new board
- `POST /api/boards/create-complete` - Create board with lists/cards
- `PUT /api/boards/:id` - Update board
- `DELETE /api/boards/:id` - Delete board

### Lists
- `GET /api/lists/board/:boardId` - Get board's lists
- `POST /api/lists` - Create new list
- `PUT /api/lists/:id` - Update list
- `DELETE /api/lists/:id` - Delete list

### Cards
- `GET /api/cards/list/:listId` - Get list's cards
- `POST /api/cards` - Create new card
- `PUT /api/cards/:id` - Update card
- `DELETE /api/cards/:id` - Delete card

## Environment Variables

### Server (.env)
```
NODE_ENV=production
DB_USERNAME=kanban_user
DB_PASSWORD=kanban_password
DB_NAME=kanban_prod
HOST=database
JWT_SECRET=your-super-secret-jwt-key
PORT=3000
```

## Development Commands

### Server
```bash
npm run dev          # Start development server
npm run migrate      # Run database migrations
npm run migrate:undo # Undo last migration
npm run seed         # Run database seeders
npm test            # Run tests
```

### Client
```bash
npm start           # Start development server
npm run build       # Build for production
npm run build:prod  # Build with production optimizations
npm test           # Run tests
```

## Database Schema

### Users
- id (UUID)
- username (String)
- email (String)
- password (Hash)
- createdAt, updatedAt

### Boards
- id (UUID)
- title (String)
- description (Text)
- userId (UUID, Foreign Key)
- isCollaborationEnabled (Boolean)
- createdAt, updatedAt

### Lists
- id (UUID)
- title (String)
- order (Integer)
- boardId (UUID, Foreign Key)
- createdAt, updatedAt

### Cards
- id (UUID)
- title (String)
- description (Text)
- order (Integer)
- listId (UUID, Foreign Key)
- createdAt, updatedAt

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

for support just say hi
