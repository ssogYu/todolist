#!/bin/bash
set -e

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/srv/todolist/backups
KEEP_DAYS=7
CONTAINER_NAME=spring-todo-db
DB_NAME=todolist
DB_USER=postgres
LOG_FILE=/srv/todolist/backups/backup.log

mkdir -p ${BACKUP_DIR}

echo "[$(date)] 开始备份数据库..." >> ${LOG_FILE}

docker exec ${CONTAINER_NAME} pg_dump -U ${DB_USER} -d ${DB_NAME} -F c -b > ${BACKUP_DIR}/todolist-${DATE}.dump

BACKUP_SIZE=$(du -h ${BACKUP_DIR}/todolist-${DATE}.dump | cut -f1)
echo "[$(date)] 备份完成，文件: todolist-${DATE}.dump，大小: ${BACKUP_SIZE}" >> ${LOG_FILE}

find ${BACKUP_DIR} -name "todolist-*.dump" -mtime +${KEEP_DAYS} -delete
echo "[$(date)] 清理旧备份完成，保留最近 ${KEEP_DAYS} 天" >> ${LOG_FILE}
