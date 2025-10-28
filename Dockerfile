# Use Node.js 18 Alpine as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Create uploads directory
RUN mkdir -p uploads
RUN mkdir -p /app/uploads

# Expose port
EXPOSE 3333

# Start the application
CMD ["npm", "start"]
