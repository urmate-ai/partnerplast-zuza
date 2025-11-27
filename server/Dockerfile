FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy Prisma schema
COPY prisma ./prisma

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Build the application
RUN npm run build

EXPOSE 3000

# Run migrations and start
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:prod"]

