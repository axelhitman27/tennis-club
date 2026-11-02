FROM node:22-slim
RUN apt-get update -y && apt-get install -y openssl tzdata && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
# npm ci's postinstall hook runs "prisma generate", which needs the schema present.
COPY prisma ./prisma
RUN npm ci
COPY . .
RUN npx prisma generate && npm run build
ENV NODE_ENV=production
ENV TZ=Europe/Athens
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
