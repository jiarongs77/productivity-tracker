# Stage 1: Build the React app
FROM node:18-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files first (Docker caches this layer if unchanged)
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the frontend code
COPY . .

# Build the production React app
RUN npm run build

# Stage 2: Serve the built app with nginx
FROM nginx:alpine

# Copy the built React app from Stage 1 into nginx's serve folder
COPY --from=build /app/build /usr/share/nginx/html

# Expose port 80 for the web server
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]