# syntax=docker/dockerfile:1

ARG NODE_VERSION=18.0.0

# Base image with Node.js
FROM node:${NODE_VERSION}-alpine as base
WORKDIR /usr/src/app
EXPOSE 3000

# Install build tools for native dependencies
RUN apk add --update --no-cache python3 build-base gcc && ln -sf /usr/bin/python3 /usr/bin/python

# Development stage
FROM base as dev
RUN --mount=type=cache,target=/root/.npm \
    npm install -g typescript ts-node

# Install dependencies
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci --include=dev

# create dist folder if it doesn't exist
RUN mkdir -p dist

COPY ./graphile.config.ts ./graphile.config.ts

# make it owned by node
RUN chown -R node:node dist

# Switch to non-root user for security
USER node

# Copy the entire source code for development
COPY . .


CMD npm run build

CMD npm run start

# Production stage
FROM base as prod
ENV NODE_ENV production

# Install only production dependencies
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

# Build TypeScript files to JavaScript
COPY . .
RUN npm run build

# Switch to non-root user for security
USER node

# Run the application
CMD ["npm", "start"]
