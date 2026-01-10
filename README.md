# Ventura Backend Service

A comprehensive backend service built with NestJS for managing business operations, appointments, customers, and resources (products & services).

## Description

Ventura is a modern business management platform backend that provides:

- **Authentication & Authorization** - JWT-based auth with Google OAuth integration
- **Business Management** - Multi-tenant business operations
- **Customer Management** - Customer profiles and relationship tracking
- **Appointment System** - Scheduling and calendar integration with Google Calendar
- **Resource Management** - Products and services with inventory tracking
- **File Storage** - Image and file upload handling
- **Email Service** - Transactional emails with queue processing
- **Security** - Row-level security with ownership verification

## Tech Stack

- **Framework**: NestJS (Node.js)
- **Database**: PostgreSQL with TypeORM
- **Authentication**: Passport.js (JWT, Google OAuth)
- **Queue**: Bull (Redis-backed job processing)
- **Email**: Nodemailer
- **Validation**: class-validator, class-transformer
- **Package Manager**: pnpm

## Project Setup

```bash
# Install dependencies
$ pnpm install

# Set up environment variables
# Copy .env.example to .env and configure your variables
```

## Environment Variables

Create a `.env` file with the following variables:

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=ventura_db

# JWT
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# Redis (for Bull queues)
REDIS_HOST=localhost
REDIS_PORT=6379

# Email
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your_email@gmail.com
MAIL_PASSWORD=your_app_password
```

## Run the Application

```bash
# Development mode
$ pnpm run start:dev

# Production mode
$ pnpm run start:prod

# Debug mode
$ pnpm run start:debug
```

## Database Setup

```bash
# Run migrations (if applicable)
$ pnpm run migration:run

# Run seeders
$ pnpm run seed
```

## API Endpoints

### Authentication

- `POST /auth/signup` - Register new user
- `POST /auth/login` - Login with credentials
- `POST /auth/confirm-email` - Confirm email with code
- `GET /auth/google` - Google OAuth login
- `POST /auth/refresh` - Refresh access token

### Business

- `POST /business` - Create business
- `GET /business/:id` - Get business details
- `PUT /business/:id` - Update business
- `DELETE /business/:id` - Delete business

### Customers

- `POST /customers` - Create customer
- `GET /customers?filter=one&customerId=xxx` - Get one customer
- `GET /customers?filter=many&limit=10&page=1` - Get customers list
- `PUT /customers/:customerId` - Update customer
- `DELETE /customers/:customerId` - Delete customer

### Resources (Products & Services)

- `GET /resource/search?q=keyword&filters=on&minPrice=0&maxPrice=1000` - Search resources
- `POST /resource/product` - Create product
- `POST /resource/service` - Create service
- `GET /resource?type=product&filter=one&resourceId=xxx` - Get one resource
- `PUT /resource/product/:productId` - Update product
- `PUT /resource/service/:serviceId` - Update service
- `DELETE /resource/product/:productId` - Delete product
- `DELETE /resource/service/:serviceId` - Delete service

### Appointments

- `POST /appointments` - Create appointment
- `GET /appointments` - List appointments
- `PUT /appointments/:id` - Update appointment
- `DELETE /appointments/:id` - Delete appointment

## Run Tests

```bash
# Unit tests
$ pnpm run test

# E2E tests
$ pnpm run test:e2e

# Test coverage
$ pnpm run test:cov
```

## Project Structure

```
src/
├── auth/              # Authentication & authorization
├── business/          # Business management
├── customer/          # Customer management
├── appointment/       # Appointment scheduling
├── resource/          # Products & services
│   ├── entities/
│   │   ├── product.entity.ts
│   │   └── service.entity.ts
│   ├── dto/
│   └── resource.service.ts
├── mail/              # Email service with queue
├── storage/           # File storage handling
├── database/          # Database configuration
├── common/            # Shared middleware, guards, etc.
└── main.ts           # Application entry point
```

## Key Features

### Authentication

- Email/password registration with confirmation codes
- Google OAuth integration
- JWT access & refresh tokens
- Password reset functionality

### Multi-tenancy

- Business-scoped data isolation
- Owner verification on all operations
- Row-level security

### Resource Management

- Unified product and service management
- Advanced search with price/quantity filters
- Pagination support (default: 20 items/page)
- Soft delete support

### Validation

- DTO-based request validation
- Conditional validation with ValidateIf
- Type transformation for query parameters

## Development

### Code Style

- ESLint configuration included
- Prettier for formatting
- TypeScript strict mode enabled

### Database Migrations

```bash
# Generate migration
$ pnpm run migration:generate --name=MigrationName

# Run migrations
$ pnpm run migration:run

# Revert migration
$ pnpm run migration:revert
```

## Deployment

See [NestJS deployment documentation](https://docs.nestjs.com/deployment) for production deployment guidelines.

## License

This project is [MIT licensed](LICENSE).
