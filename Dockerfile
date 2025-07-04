# Use Node.js 20 Alpine for smaller image size
FROM node:20-alpine

# Install necessary build tools
RUN apk add --no-cache python3 make g++

# Clear npm cache to avoid registry issues
RUN npm cache clean --force

# Set working directory
WORKDIR /app

# Copy all source code first to avoid layer caching issues
COPY . .

# Install all dependencies in one layer
RUN npm install --no-cache && \
    cd server && npm install --production --no-cache && \
    cd ../client/kanban && npm install --legacy-peer-deps --no-cache

# Build Angular application
WORKDIR /app/client/kanban
RUN npm run build:prod && \
    ls -la dist/ && \
    ls -la dist/kanban/ && \
    echo "Angular build completed successfully"

# Set working directory back to app root
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=8080

# Expose port
EXPOSE 8080

# Copy and set up the startup script
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Start the server with migrations
CMD ["/app/start.sh"] 