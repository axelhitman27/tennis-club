FROM node:22-slim
RUN apt-get update -y && apt-get install -y openssl tzdata && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate && npm run build
ENV NODE_ENV=production
ENV TZ=Europe/Athens
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
