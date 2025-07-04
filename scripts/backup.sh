#!/bin/bash

echo "💾 KanBan Database Backup Script"
echo "================================"

# Set variables
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="kanban_backup_${DATE}.sql"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Check if running in Docker
if docker-compose ps | grep -q database; then
    echo "🐳 Backing up from Docker container..."
    docker-compose exec database pg_dump -U kanban_user -d kanban_prod > "$BACKUP_DIR/$BACKUP_FILE"
else
    echo "🗄️  Backing up from local database..."
    pg_dump -U kanban_user -d kanban_prod > "$BACKUP_DIR/$BACKUP_FILE"
fi

if [ $? -eq 0 ]; then
    echo "✅ Backup created successfully: $BACKUP_DIR/$BACKUP_FILE"
    
    # Clean up old backups (keep last 10)
    cd $BACKUP_DIR
    ls -t kanban_backup_*.sql | tail -n +11 | xargs rm -f
    echo "🧹 Cleaned up old backups (keeping last 10)"
else
    echo "❌ Backup failed"
    exit 1
fi 