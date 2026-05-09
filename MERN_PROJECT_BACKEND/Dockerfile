# backend docker_file
FROM node:20-alpine 

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

COPY package*.json ./


RUN npm ci --only=production

COPY . .

RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 5000

CMD ["npm", "start"]
