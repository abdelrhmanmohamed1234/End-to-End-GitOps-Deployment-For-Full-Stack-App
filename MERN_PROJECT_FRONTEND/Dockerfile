# frontend_docker file
FROM  node:20-alpine AS builder

RUN apk update && apk upgrade

WORKDIR /app

COPY package.json package-lock.json  .

RUN npm ci

COPY . .

RUN npm run build

# use nginx in front of node
FROM nginx:1.25-alpine

RUN apk update && apk upgrade

COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy static file to my nignx folder for serve static contain
COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
