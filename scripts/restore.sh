#!/bin/bash

echo "🔄 KanBan Database Restore Script"
echo "================================="

# Check if backup file is provided
if [ $# -eq 0 ]; then
    echo "❌ Please provide a backup file to restore"
    echo "Usage: $0 <backup_file.sql>"
    echo ""
    echo "Available backups:"
    ls -la ./backups/kanban_backup_*.sql 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_FILE=$1

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Confirmation prompt
echo "⚠️  This will replace the current database with the backup."
echo "📁 Backup file: $BACKUP_FILE"
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Restore cancelled"
    exit 1
fi

# Check if running in Docker
if docker-compose ps | grep -q database; then
    echo "🐳 Restoring to Docker container..."
    docker-compose exec -T database psql -U kanban_user -d kanban_prod < "$BACKUP_FILE"
else
    echo "🗄️  Restoring to local database..."
    psql -U kanban_user -d kanban_prod < "$BACKUP_FILE"
fi

if [ $? -eq 0 ]; then
    echo "✅ Database restored successfully from: $BACKUP_FILE"
else
    echo "❌ Restore failed"
    exit 1
fi 