FROM node:18-alpine

# Устанавливаем системные утилиты, необходимые для компиляции SQLite
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Сначала копируем файлы зависимостей
COPY package*.json ./

# Устанавливаем библиотеки и компилируем sqlite3 под текущую систему
RUN npm install

# Копируем все остальные файлы проекта
COPY . .

EXPOSE 3000

CMD ["npm", "start"]
