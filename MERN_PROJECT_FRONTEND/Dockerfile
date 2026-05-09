# frontend_docker file
FROM  node:20-alpine AS builder

WORKDIR /app

COPY package.json .

RUN npm install

COPY . .

RUN npm run build

# use nginx in front of node
FROM nginx:1.25-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy static file to my nignx folder for serve static contain
COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
