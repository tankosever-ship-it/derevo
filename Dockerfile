FROM node:22-alpine

WORKDIR /app

# Build React frontend
COPY client/package*.json ./client/
RUN cd client && npm ci

COPY client/ ./client/
RUN cd client && npm run build

# Setup Node.js backend
COPY server/package*.json ./server/
RUN cd server && npm ci

COPY server/ ./server/

# Copy built frontend into server's public folder
RUN mkdir -p server/public && cp -r client/dist/. server/public/

WORKDIR /app/server

EXPOSE 3000

CMD ["sh", "-c", "npx prisma db push --skip-generate && node index.js"]
