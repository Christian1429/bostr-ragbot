
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./

RUN npm install
COPY . .
COPY tsconfig.json ./
EXPOSE 3003
# Kontrollera att server.js är körbar
RUN chmod +x server.ts
# Kör server.js direkt med node
CMD ["node", "--loader", "ts-node/esm", "server.ts"]