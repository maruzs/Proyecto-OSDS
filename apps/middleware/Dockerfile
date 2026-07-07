FROM node:18-alpine

# No longer need python3 make g++ since we use pg client without native build dependencies

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 8000

CMD ["node", "server.js"]
