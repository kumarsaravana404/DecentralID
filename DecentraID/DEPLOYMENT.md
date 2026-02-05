# DecentraID - Production Deployment Guide

This guide covers deploying the complete DecentraID platform (frontend + backend) to production.

## Prerequisites

- Node.js 18+
- npm or yarn
- MongoDB Atlas account (or self-hosted MongoDB)
- GitHub account
- Vercel account (for frontend)
- Render.com account (for backend) - or similar PaaS

---

## 1. Backend Deployment (Render.com)

### Option A: Automatic Deployment via render.yaml

1. Push your code to GitHub
2. Sign in to [Render](https://render.com)
3. Create a new Web Service:
   - Connect your GitHub repository
   - Select the `DecentraID/backend` directory as the root
   - Set build command: `npm install`
   - Set start command: `npm start`
   - Add environment variables (see below)

### Option B: Manual Setup

1. Create a new Web Service on Render
2. Configure environment variables:

| Variable                  | Value                                    |
| ------------------------- | ---------------------------------------- |
| `NODE_ENV`                | `production`                             |
| `PORT`                    | `5000`                                   |
| `MONGODB_URI`             | Your MongoDB Atlas connection string     |
| `ENCRYPTION_KEY`          | 32-character hex string (generate below) |
| `CORS_ORIGIN`             | Your Vercel frontend URL                 |
| `FRONTEND_URL`            | Same as CORS_ORIGIN                      |
| `RATE_LIMIT_WINDOW_MS`    | `900000`                                 |
| `RATE_LIMIT_MAX_REQUESTS` | `100`                                    |
| `LOG_LEVEL`               | `info`                                   |

### Generate Encryption Key

```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

### Health Check Endpoint

The backend provides `/health` endpoint for Render's health checks.

---

## 2. Frontend Deployment (Vercel)

### Automatic Deployment

1. Push your code to GitHub
2. Sign in to [Vercel](https://vercel.com)
3. Import the `DecentraID/web` directory as a new project
4. Configure environment variables:

| Variable       | Value                                                                     |
| -------------- | ------------------------------------------------------------------------- |
| `VITE_API_URL` | Your Render backend URL (e.g., `https://decentraid-backend.onrender.com`) |

5. Deploy!

### Manual Vercel CLI

```bash
cd DecentraID/web
vercel --prod
```

---

## 3. MongoDB Atlas Setup

1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a database user with read/write permissions
3. Configure IP whitelist (0.0.0.0/0 for all IPs, or your cloud provider's IPs)
4. Get your connection string (format: `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<database>`)
5. Add to Render environment variables

---

## 4. Smart Contract Deployment (Sepolia Testnet)

### Prerequisites

1. Get Sepolia ETH from [Sepolia Faucet](https://sepoliafaucet.com)
2. Get Infura API key (free tier)

### Configure Environment

```bash
cd DecentraID/blockchain
cp .env.example .env
```

Add to `.env`:

```
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
PRIVATE_KEY=YOUR_WALLET_PRIVATE_KEY
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY
```

### Deploy

```bash
npx hardhat run scripts/deploy-production.js --network sepolia
```

### Update Frontend Config

After deployment, update `DecentraID/backend/config.json` with the new contract addresses.

---

## 5. Environment Configuration Summary

### Backend (.env)

```env
# Server
PORT=5000
NODE_ENV=production

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/decentraid
MONGODB_POOL_SIZE=10

# Security
ENCRYPTION_KEY=your_32_char_hex_key

# CORS
CORS_ORIGIN=https://your-frontend.vercel.app
FRONTEND_URL=https://your-frontend.vercel.app

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

### Frontend (.env)

```env
VITE_API_URL=https://your-backend.onrender.com
VITE_NETWORK=sepolia
VITE_APP_NAME=DecentraID
VITE_APP_VERSION=1.0.0
```

---

## 6. Docker Deployment (Alternative)

### Backend with Docker Compose

```bash
cd DecentraID/backend
docker-compose up -d
```

This starts:

- Backend API on port 5000
- MongoDB on port 27017

### Build Production Image

```bash
docker build -t decentraid-backend .
docker run -d -p 5000:5000 \
  -e NODE_ENV=production \
  -e MONGODB_URI=your_mongodb_uri \
  -e ENCRYPTION_KEY=your_key \
  decentraid-backend
```

---

## 7. Verification Checklist

- [ ] Backend health check returns 200
- [ ] Frontend loads without errors
- [ ] Wallet connection works
- [ ] Identity creation works
- [ ] Gasless identity flow works
- [ ] CORS is properly configured
- [ ] Rate limiting is active
- [ ] Logging is working

---

## 8. Troubleshooting

### CORS Errors

Ensure your frontend URL is in `CORS_ORIGIN`:

```
CORS_ORIGIN=https://decentraid.vercel.app,https://www.decentraid.app
```

### Database Connection Failed

- Verify MongoDB Atlas IP whitelist includes your cloud provider
- Check connection string format
- Ensure credentials are correct

### Rate Limiting

If getting 429 errors, increase limits or check for abuse:

```
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=200
```

### Blockchain Transactions Failing

- Ensure wallet has sufficient Sepolia ETH
- Check contract addresses in config.json
- Verify network is set to Sepolia

---

## 9. Security Checklist

- [ ] Use strong, unique `ENCRYPTION_KEY`
- [ ] Enable MongoDB Atlas encryption at rest
- [ ] Use HTTPS in production
- [ ] Configure proper CORS origins
- [ ] Set up monitoring and alerting
- [ ] Enable database backups
- [ ] Use environment variables, never hardcode secrets

---

## 10. Support

For deployment issues:

1. Check backend logs in Render dashboard
2. Verify environment variables
3. Test endpoints with Postman/curl
4. Check MongoDB Atlas metrics
