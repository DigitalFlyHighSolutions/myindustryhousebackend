FROM node:20-slim

WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y openssl

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5007
 CMD ["sh", "-c", "npx knex migrate:latest --knexfile ./knexfile.js --env development && npm start"]