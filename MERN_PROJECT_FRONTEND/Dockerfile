# Build stage with security updates
FROM node:22-alpine AS builder

RUN apk update && apk upgrade

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

# Build with correct backend URL
ARG REACT_APP_SERVER_URL
ENV REACT_APP_SERVER_URL=http://172.20.10.6:30500
RUN npm run build

# Production stage with security updates
FROM nginx:1.27-alpine

RUN apk update && apk upgrade

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build files
COPY --from=builder /app/build /usr/share/nginx/html

# Add runtime environment injection
RUN echo 'window._env_ = { REACT_APP_SERVER_URL: "http://172.20.10.6:30500" };' > /usr/share/nginx/html/env.js && \
    sed -i 's/<head>/<head><script src="\/env.js"><\/script>/' /usr/share/nginx/html/index.html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
