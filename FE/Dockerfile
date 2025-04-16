FROM node:18-alpine
WORKDIR /app

# Copy package files first (for layer caching)
COPY package*.json ./
COPY . .

# Install dependencies (including dev deps for Turbopack)
RUN npm install

# Expose port
EXPOSE 3000:3030

# Run in dev mode with Turbopack
CMD ["npm", "run", "dev:frontend"]