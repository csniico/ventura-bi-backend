# --- STAGE 1: Build Stage ---
FROM node:20-alpine AS builder
LABEL authors="csniico"

# Set working directory
WORKDIR /app

# Copy package files (package.json and package-lock.json for npm)
COPY package.json ./

# Install all dependencies using npm ci
RUN npm install

# Copy source code and config files (ensure .dockerignore excludes node_modules)
COPY . .

# Build the application
RUN npm run build


# --- STAGE 2: Production Stage ---
FROM node:20-alpine AS production

# Set working directory
WORKDIR /app

# Copy only the necessary package files
COPY package.json ./

# Install ONLY production dependencies, minimizing final image size
RUN npm install --only=production

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Create a non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Change ownership to the new non-root user
RUN chown -R nestjs:nodejs /app

# Switch to non-root user for security
USER nestjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "dist/main.js"]