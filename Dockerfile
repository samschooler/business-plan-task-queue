# Use the official Node.js image as a base
ARG NODE_VERSION=18.0.0
FROM node:${NODE_VERSION}-alpine as base

RUN apk add --update --no-cache python3 build-base gcc && ln -sf /usr/bin/python3 /usr/bin/python

# Set the working directory
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json tsconfig.json ./

# Copy the application code
COPY . .

# Install tools for development in a separate stage
FROM base as dev

RUN npm install
RUN npm install -g nodemon

# Expose the application port
EXPOSE 3000

# Start TypeScript watcher and Node.js runner
CMD ["sh", "-c", "npm run build:watch & nodemon dist/index.js"]

# Final production build stage
FROM base as prod

# Install production dependencies and build the application
RUN npm ci --omit=dev && npm run build

# Expose the application port
EXPOSE 3000

# Start the production server
CMD ["node", "dist/index.js"]
