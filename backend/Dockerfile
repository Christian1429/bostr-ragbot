
# 1. Välj Node som bas
FROM node:20

# 2. Sätt arbetsmappen
WORKDIR /app

# 3. Kopiera package.json och package-lock.json först (bättre cache!)
COPY package*.json ./

# 4. Installera beroenden
RUN npm install

# 5. Kopiera resten av projektet
COPY . .

# 6. Bygg TypeScript till JavaScript
RUN npm run build

# 7. Ange vilken port servern lyssnar på (valfritt, om du t.ex. kör på 3000)
EXPOSE 3001

# 8. Starta servern
CMD ["npm", "start"]
