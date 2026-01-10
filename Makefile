.PHONY: build format start run debug prod lint test test-watch test-cov test-debug test-e2e seed prepare install

# Default target
.DEFAULT_GOAL := help

# Build the application
build:
	pnpm run build

# Format code
format:
	pnpm run format

# Start application (production mode)
start:
	pnpm run start

# Start application in development mode with watch
run:
	pnpm run start:dev

# Start application in debug mode
debug:
	pnpm run start:debug

# Start application in production mode
prod:
	pnpm run start:prod

# Lint and fix code
lint:
	pnpm run lint

# Run tests
test:
	pnpm run test

# Run tests in watch mode
test-watch:
	pnpm run test:watch

# Run tests with coverage
test-cov:
	pnpm run test:cov

# Run tests in debug mode
test-debug:
	pnpm run test:debug

# Run e2e tests
test-e2e:
	pnpm run test:e2e

# Seed the database
seed:
	pnpm run seed

# Prepare hooks (husky)
prepare:
	pnpm run prepare

# Install dependencies
install:
	pnpm install

# Help command
help:
	@echo "Available commands:"
	@echo "  make build       - Build the application"
	@echo "  make format      - Format code with prettier"
	@echo "  make start       - Start application"
	@echo "  make run         - Start application in dev mode (watch)"
	@echo "  make debug       - Start application in debug mode"
	@echo "  make prod        - Start application in production mode"
	@echo "  make lint        - Lint and fix code"
	@echo "  make test        - Run tests"
	@echo "  make test-watch  - Run tests in watch mode"
	@echo "  make test-cov    - Run tests with coverage"
	@echo "  make test-debug  - Run tests in debug mode"
	@echo "  make test-e2e    - Run e2e tests"
	@echo "  make seed        - Seed the database"
	@echo "  make prepare     - Setup husky hooks"
	@echo "  make install     - Install dependencies"
	@echo "  make help        - Show this help message"
