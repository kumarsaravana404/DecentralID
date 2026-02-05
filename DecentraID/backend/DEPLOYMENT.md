# DecentraID Backend - Production Deployment Guide

## Overview

This guide covers deploying the DecentraID backend to production environments including Render, Railway, Heroku, and Docker-based deployments.

## Prerequisites

- Node.js 18+
- MongoDB Atlas account (or self-hosted MongoDB)
- Environment variables configured

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your values
# Start development server
npm run dev
```

### Production Start

```bash
npm run start:prod
```

## Environment Variables

| Variable                  | Required | Default        | Description                            |
| ------------------------- | -------- | -------------- | -------------------------------------- |
| `PORT`                    | No       | 5000           | Server port                            |
| `NODE_ENV`                | Yes      | development    | Environment (production/development)   |
| `MONGODB_URI`             | Yes      | -              | MongoDB connection string              |
| `ENCRYPTION_KEY`          | Yes      | -              | 32-character encryption key            |
| `CORS_ORIGIN`             | No       | localhost:5173 | Allowed CORS origins (comma-separated) |
| `FRONTEND_URL`            | No       | localhost:5173 | Frontend URL for shareable links       |
| `RATE_LIMIT_WINDOW_MS`    | No       | 900000         | Rate limit window (15 min)             |
| `RATE_LIMIT_MAX_REQUESTS` | No       | 100            | Max requests per window                |
| `LOG_LEVEL`               | No       | info           | Logging level                          |

### Generate Encryption Key

```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

## Deployment Options

### 1. Render.com (Recommended)

The project includes a `render.yaml` for easy deployment:

1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Set environment variables in Render dashboard
4. Deploy

**render.yaml configuration:**

```yaml
services:
  - type: web
    name: decentraid-backend
    env: node
    buildCommand: npm install
    startCommand: npm start
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: MONGODB_URI
        sync: false
      - key: ENCRYPTION_KEY
        sync: false
```

### 2. Docker Deployment

**Build and run:**

```bash
# Build image
docker build -t decentraid-backend .

# Run container
docker run -d \
  -p 5000:5000 \
  -e NODE_ENV=production \
  -e MONGODB_URI=your_mongodb_uri \
  -e ENCRYPTION_KEY=your_32_char_key \
  --name decentraid \
  decentraid-backend
```

**Using Docker Compose:**

```bash
# Start all services (backend + MongoDB)
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

### 3. Railway

1. Create new project from GitHub
2. Add MongoDB plugin or use external MongoDB
3. Set environment variables
4. Deploy

### 4. Heroku

```bash
# Login to Heroku
heroku login

# Create app
heroku create decentraid-backend

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=your_mongodb_uri
heroku config:set ENCRYPTION_KEY=your_32_char_key

# Deploy
git push heroku main
```

## Health Checks

The backend exposes two health endpoints:

- **`GET /health`** - Basic health check (always returns 200 if server is running)
- **`GET /ready`** - Readiness check (verifies database connection)

Example responses:

```json
// GET /health
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "environment": "production"
}

// GET /ready
{
  "status": "ready",
  "database": "connected",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "checks": {
    "database": "healthy",
    "memory": "128MB"
  }
}
```

## Security Features

### Enabled by Default

- **Helmet.js** - Security headers (HSTS, CSP, etc.)
- **Rate Limiting** - 100 requests per 15 minutes (configurable)
- **CORS** - Configurable allowed origins
- **Input Validation** - express-validator on all endpoints
- **AES-256 Encryption** - For sensitive data
- **Non-root Docker user** - Container security

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong, unique `ENCRYPTION_KEY`
- [ ] Configure `CORS_ORIGIN` for your frontend domains
- [ ] Use MongoDB Atlas with authentication
- [ ] Enable MongoDB connection encryption (TLS)
- [ ] Set up monitoring and alerting
- [ ] Configure log aggregation
- [ ] Set up backup strategy for MongoDB

## Monitoring

### Logs

Logs are written to:

- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only
- Console (stdout) - For container environments

### Metrics to Monitor

- Response times (logged per request)
- Error rates (4xx, 5xx responses)
- Database connection status
- Memory usage
- Rate limit hits

## Scaling

### Horizontal Scaling

The backend is stateless and can be horizontally scaled:

1. Deploy multiple instances behind a load balancer
2. Use MongoDB Atlas for managed database scaling
3. Consider Redis for session/cache if needed

### Vertical Scaling

Adjust these for higher load:

- `MONGODB_POOL_SIZE` - Increase connection pool
- `RATE_LIMIT_MAX_REQUESTS` - Adjust rate limits

## Troubleshooting

### Common Issues

**Database Connection Failed**

```
Error: MongoDB Connection Error
```

- Verify `MONGODB_URI` is correct
- Check network access (IP whitelist in Atlas)
- Ensure MongoDB is running

**Encryption Key Error**

```
Error: ENCRYPTION_KEY must be exactly 32 characters
```

- Generate new key: `node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"`

**CORS Errors**

- Add your frontend URL to `CORS_ORIGIN`
- Multiple origins: `CORS_ORIGIN=https://app1.com,https://app2.com`

## API Endpoints

| Method | Endpoint                   | Description                 |
| ------ | -------------------------- | --------------------------- |
| GET    | `/health`                  | Health check                |
| GET    | `/ready`                   | Readiness check             |
| POST   | `/identity/create`         | Create identity             |
| PUT    | `/identity/update`         | Update identity             |
| POST   | `/identity/create-gasless` | Create gasless identity     |
| GET    | `/identity/share/:hash`    | Get shared identity         |
| POST   | `/identity/claim`          | Claim gasless identity      |
| POST   | `/credential/issue`        | Issue credential            |
| POST   | `/credential/verify-zkp`   | Verify ZK proof             |
| POST   | `/verify/request`          | Create verification request |
| POST   | `/verify/confirm`          | Confirm verification        |
| GET    | `/audit/logs`              | Get audit logs              |
| GET    | `/config`                  | Get contract config         |

## Support

For issues and questions:

- Check the logs first
- Review environment variables
- Ensure MongoDB is accessible
- Check rate limits if getting 429 errors
