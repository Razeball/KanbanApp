# Use Node.js 20 Alpine for smaller image size
FROM node:20-alpine

# Install necessary build tools
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy root package.json first
COPY package*.json ./

# Copy server and client package.json files
COPY server/package*.json ./server/
COPY client/kanban/package*.json ./client/kanban/

# Install root dependencies
RUN npm install

# Install server dependencies
WORKDIR /app/server
RUN npm install --production

# Install client dependencies with legacy peer deps to handle conflicts
WORKDIR /app/client/kanban
RUN npm install --legacy-peer-deps

# Copy all source code
WORKDIR /app
COPY . .

# Build Angular application
WORKDIR /app/client/kanban
RUN npm run build:prod

# Set working directory back to app root
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=8080

# Expose port
EXPOSE 8080

# Start the server
CMD ["npm", "start"] 