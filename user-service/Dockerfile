FROM node:20-slim

WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y openssl

COPY package*.json ./

RUN npm config set fetch-retries 5 \
 && npm config set fetch-retry-factor 2 \
 && npm config set fetch-retry-mintimeout 20000 \
 && npm config set fetch-retry-maxtimeout 120000 \
 && npm install --no-audit --no-fund

COPY . .

EXPOSE 5006

CMD ["npm", "start"]