# 1. Använd Node
FROM node:20

# 2. Sätt arbetskatalog
WORKDIR /app

# 3. Kopiera package.json först för caching
COPY package*.json ./

# 4. Installera beroenden
RUN npm install

# 5. Kopiera all kod
COPY . .

# 6. Bygg frontend
RUN npm run build

# 7. Exponera porten
EXPOSE 3000

# 8. Starta Next.js app
CMD ["npm", "start"]
