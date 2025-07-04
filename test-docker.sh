#!/bin/bash

echo "🧪 Testing Docker build locally..."

# Build the Docker image
echo "📦 Building Docker image..."
docker build -t kanban-app .

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Docker build successful!"
    echo "🚀 You can now deploy to DigitalOcean App Platform"
    echo ""
    echo "Next steps:"
    echo "1. git add ."
    echo "2. git commit -m 'Switch to Docker deployment'"
    echo "3. git push origin main"
    echo "4. Redeploy on DigitalOcean App Platform"
else
    echo "❌ Docker build failed!"
    echo "Check the error messages above"
fi 