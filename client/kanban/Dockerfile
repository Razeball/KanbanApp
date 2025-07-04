# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build:prod

# Production stage
FROM nginx:alpine

# Copy built application
COPY --from=builder /app/dist/kanban /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy startup script
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Accept build arguments
ARG ANGULAR_API_URL=http://localhost:3000
ENV ANGULAR_API_URL=$ANGULAR_API_URL

EXPOSE 80

# Use startup script to inject config at runtime
CMD ["/start.sh"] 