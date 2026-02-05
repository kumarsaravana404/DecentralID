# DecentraID Backend Deployment Plan

## Overview

The DecentraID backend has been refactored for production readiness, focusing on reliability, security, and maintainability while preserving the original architecture.

## 1. Prerequisites

- **Node.js**: v18.x or higher
- **MongoDB**: v6.0 or higher
- **PM2**: For process management (recommended for production)

## 2. Environment Configuration

Create a `.env` file in the `backend/` directory based on `.env.example`.

### Required Variables

| Variable         | Description               | Example                                               |
| ---------------- | ------------------------- | ----------------------------------------------------- |
| `PORT`           | Server port               | `5000`                                                |
| `NODE_ENV`       | Environment mode          | `production`                                          |
| `MONGODB_URI`    | MongoDB Connection String | `mongodb://localhost:27017/decentraid`                |
| `ENCRYPTION_KEY` | 32-char Hex Key for AES   | `0123456789abcdef0123456789abcdef` (must be 32 chars) |
| `CORS_ORIGIN`    | Allowed Frontend URLs     | `https://your-app.com,http://localhost:5173`          |

### Optional Variables

| Variable         | Description                        |
| ---------------- | ---------------------------------- |
| `LOG_LEVEL`      | Logging level (info, error, debug) |
| `PINATA_API_KEY` | (Future) For IPFS integration      |

## 3. Installation

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

## 4. Running in Production

Do not use `npm run dev` or `nodemon` in production.

### Using Node directly:

```bash
npm start
```

### Using PM2 (Recommended):

PM2 provides restart capabilities and load balancing.

```bash
npm install -g pm2
pm2 start server.js --name "decentraid-api"
```

## 5. Security Checklist

- [ ] **HTTPS**: Ensure the server is behind a reverse proxy (Nginx/Apache) handling SSL termination.
- [ ] **Firewall**: Only allow traffic on the specific port (e.g., 5000) from the reverse proxy.
- [ ] **Database**: Use a secure connection string with authentication for MongoDB.
- [ ] **Secrets**: Rotate `ENCRYPTION_KEY` periodically. Ensure it is never committed to Git.

## 6. Monitoring & Logs

- Logs are written to `backend/logs/`.
- `combined.log`: All logs (info, warn, error).
- `error.log`: Only error logs.
- Use `pm2 monit` if using PM2.

## 7. Rollback Plan

If deployment fails:

1. Revert the code to the previous Git commit.
2. Restore the previous `server.js`.
3. Restart the service.

## 8. API Verification

Health check endpoint:

```
GET /health
```

Should return:

```json
{
  "status": "ok",
  "timestamp": "...",
  "uptime": ...
}
```
