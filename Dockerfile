# Use Node.js 20
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/kanban/package*.json ./client/kanban/

# Install dependencies
RUN npm run install:all

# Copy source code
COPY . .

# Build Angular application
RUN npm run build:client

# Set production environment
ENV NODE_ENV=production

# Expose port
EXPOSE 8080

# Start the server
CMD ["npm", "start"] 