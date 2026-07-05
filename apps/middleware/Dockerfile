FROM node:18-alpine

# Instalar herramientas para compilar sqlite3 nativo si es necesario en alpine
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 8000

CMD ["node", "server.js"]
