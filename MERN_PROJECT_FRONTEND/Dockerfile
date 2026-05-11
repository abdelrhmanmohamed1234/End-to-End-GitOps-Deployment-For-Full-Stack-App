# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build with correct backend URL
ARG REACT_APP_SERVER_URL
ENV REACT_APP_SERVER_URL=http://172.20.10.6:30500
RUN npm run build

# Production stage
FROM nginx:1.25-alpine

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build files
COPY --from=builder /app/build /usr/share/nginx/html

# Add runtime environment injection
RUN echo 'window._env_ = { REACT_APP_SERVER_URL: "http://172.20.10.6:30500" };' > /usr/share/nginx/html/env.js && \
    sed -i 's/<head>/<head><script src="\/env.js"><\/script>/' /usr/share/nginx/html/index.html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
