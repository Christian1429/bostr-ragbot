
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3003
# Kontrollera att server.js är körbar
RUN chmod +x server.js
# Kör server.js direkt med node
CMD ["node", "server.js"]