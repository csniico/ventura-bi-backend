# Docker Deployment Guide

This guide explains how to build and run the NestJS backend service using Docker.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 2GB of free disk space

## Quick Start

### 1. Setup Environment Variables

Copy the example environment file and update with your values:

```bash
cp .env.example .env
```

**Important**: Update the following variables in `.env`:
- `DB_PASSWORD` - Set a secure database password
- `JWT_SECRET` - Set a strong secret key for JWT tokens
- Other configuration as needed

### 2. Build and Run with Docker Compose

```bash
# Build and start all services (backend + PostgreSQL)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes (WARNING: This deletes database data)
docker-compose down -v
```

### 3. Access the Application

- **API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/health

## Manual Docker Build

If you want to build only the backend service without docker-compose:

```bash
# Build the image
docker build -f Docker/Dockerfile -t ventura-backend:latest .

# Run the container
docker run -d \
  --name ventura-backend \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e DB_HOST=your_db_host \
  -e DB_PORT=5432 \
  -e DB_USERNAME=postgres \
  -e DB_PASSWORD=your_password \
  -e DB_DATABASE=ventura_db \
  -e JWT_SECRET=your_jwt_secret \
  ventura-backend:latest

# View logs
docker logs -f ventura-backend

# Stop and remove
docker stop ventura-backend
docker rm ventura-backend
```

## Dockerfile Architecture

The Dockerfile uses a **multi-stage build** approach for optimal image size and security:

### Stage 1: Builder
- Based on `node:20-alpine`
- Installs pnpm
- Installs all dependencies (including dev dependencies)
- Builds the TypeScript application

### Stage 2: Production
- Based on `node:20-alpine`
- Installs pnpm
- Installs **only production dependencies**
- Copies the built application from the builder stage
- Creates a non-root user for security
- Includes health check
- Exposes port 3000

## Docker Image Optimization

### What's Excluded (via .dockerignore)

The following files/folders are excluded to reduce image size:
- `node_modules/` (reinstalled in container)
- `dist/` and build artifacts
- Test files and coverage reports
- Development tools (ESLint, Prettier configs)
- Git files and CI/CD configs
- Documentation files
- IDE settings

### What's Included for Build

Essential files for building:
- `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`
- `tsconfig.json`, `tsconfig.build.json`
- `nest-cli.json`
- Source code (`src/`)

## Health Checks

The container includes a health check that:
- Runs every 30 seconds
- Times out after 3 seconds
- Starts checking after 40 seconds (startup grace period)
- Retries 3 times before marking as unhealthy
- Checks the `/health` endpoint

Check container health:
```bash
docker ps
# Look for the "STATUS" column showing "healthy" or "unhealthy"

# Or get detailed health status
docker inspect --format='{{json .State.Health}}' ventura-backend | jq
```

## Database Management

### PostgreSQL Container

The docker-compose setup includes a PostgreSQL database:
- **Version**: PostgreSQL 16 (Alpine)
- **Port**: 5432 (configurable via `DB_PORT`)
- **Volume**: Data persists in `postgres_data` volume

### Database Migrations

To run migrations inside the container:

```bash
# Access the backend container
docker-compose exec backend sh

# Run migrations (adjust command based on your setup)
pnpm run migration:run

# Or run seeding
pnpm run seed
```

## Production Considerations

### Security

1. **Non-root User**: The container runs as user `nestjs` (UID 1001)
2. **Environment Variables**: Never commit `.env` file with secrets
3. **JWT Secret**: Use a strong, randomly generated secret
4. **Database Password**: Use a strong password

### Performance

1. **Health Checks**: Adjust intervals based on your needs
2. **Resource Limits**: Add resource limits in production:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

### Logging

View logs with filters:
```bash
# All services
docker-compose logs -f

# Only backend
docker-compose logs -f backend

# Only database
docker-compose logs -f db

# Last 100 lines
docker-compose logs --tail=100 backend
```

## Troubleshooting

### Container Won't Start

1. Check logs: `docker-compose logs backend`
2. Verify environment variables are set correctly
3. Ensure database is accessible
4. Check port 3000 is not already in use

### Build Fails

1. Ensure you have the latest pnpm-lock.yaml
2. Check Docker has enough disk space
3. Try cleaning Docker: `docker system prune -a`
4. Verify nest-cli.json and tsconfig files exist

### Database Connection Issues

1. Verify database container is healthy: `docker-compose ps`
2. Check database credentials in `.env`
3. Ensure `DB_HOST` is set to `db` (service name) when using docker-compose
4. Check network connectivity: `docker-compose exec backend ping db`

### Health Check Failures

1. Verify the `/health` endpoint returns 200 OK
2. Check if the application is actually listening on port 3000
3. Review health check timeout settings
4. View detailed health status: `docker inspect ventura-backend`

## Useful Commands

```bash
# Rebuild without cache
docker-compose build --no-cache

# Scale services (if needed)
docker-compose up -d --scale backend=2

# Execute commands in container
docker-compose exec backend sh
docker-compose exec backend pnpm run seed

# View container resource usage
docker stats ventura-backend

# Inspect container
docker inspect ventura-backend

# Clean up everything
docker-compose down -v --rmi all
```

## CI/CD Integration

The Dockerfile is optimized for CI/CD pipelines:
- Uses layer caching for faster builds
- Multi-stage build reduces final image size
- Includes health checks for deployment verification

Example GitHub Actions workflow would use:
```yaml
- name: Build Docker image
  run: docker build -f Docker/Dockerfile -t ventura-backend:${{ github.sha }} .

- name: Run tests in container
  run: docker run ventura-backend:${{ github.sha }} pnpm test
```

## Support

For issues or questions:
1. Check the logs first
2. Review this documentation
3. Check Docker and Docker Compose versions
4. Consult the main project README

