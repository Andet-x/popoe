#!/bin/bash

# Имя контейнера и образа
CONTAINER_NAME="popoe-app"
IMAGE_NAME="popoe-clicker"
PORT="7777"

echo "=== 🚀 Начало обновления проекта Popoe ==="

# 1. Проверяем, запущен ли старый контейнер, и останавливаем его
if [ "$(docker ps -q -f name=$CONTAINER_NAME)" ]; then
    echo "Stopping active container..."
    docker stop $CONTAINER_NAME
fi

# 2. Удаляем старый контейнер (данные в clicks.db не пострадают)
if [ "$(docker ps -aq -f name=$CONTAINER_NAME)" ]; then
    echo "Removing old container..."
    docker rm $CONTAINER_NAME
fi

# 3. Собираем новый образ из текущей папки
echo "Building new Docker image..."
docker build -t $IMAGE_NAME .

# 4. Запускаем новый контейнер с сохранением файла базы данных
echo "Starting new container on port $PORT..."
docker run -d \
 -p $PORT:3000 \
 --name $CONTAINER_NAME \
 -v $(pwd)/clicks.db:/app/clicks.db \
 --restart unless-stopped \
 $IMAGE_NAME

echo "=== ✅ Обновление успешно завершено! ==="
echo "Сайт доступен и продолжает использовать существующую БД clicks.db."
