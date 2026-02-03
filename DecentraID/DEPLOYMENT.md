# DecentraID Production Deployment Guide

## Prerequisites

Before deploying, ensure you have:

- Node.js v18+ installed
- MongoDB instance (local or cloud like MongoDB Atlas)
- Ethereum wallet with testnet ETH (for Sepolia deployment)
- Infura or Alchemy account for RPC access
- Etherscan API key (for contract verification)

## Backend Deployment (Render.com)

### 1. Prepare Environment Variables

Create a `.env` file in the `backend` directory (or set in Render dashboard):

```bash
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/decentraid
ENCRYPTION_KEY=<32-character-hex-string>
CORS_ORIGIN=https://your-frontend.vercel.app
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Generate secure encryption key:**

```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

### 2. Install Dependencies

```bash
cd backend
npm install
```

### 3. Deploy to Render

1. Go to [render.com](https://render.com) and sign in
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `decentraid-backend`
   - **Root Directory**: `DecentraID/backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add environment variables from step 1
6. Click **"Create Web Service"**

### 4. Verify Deployment

```bash
curl https://your-backend.onrender.com/health
# Expected: {"status":"ok","timestamp":"...","uptime":...}

curl https://your-backend.onrender.com/ready
# Expected: {"status":"ready","database":"connected","timestamp":"..."}
```

## Smart Contract Deployment

### 1. Configure Environment

Create `.env` in `blockchain` directory:

```bash
PRIVATE_KEY=your-wallet-private-key
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
ETHERSCAN_API_KEY=your-etherscan-api-key
```

### 2. Install Dependencies

```bash
cd blockchain
npm install
```

### 3. Deploy to Sepolia Testnet

```bash
npx hardhat run scripts/deploy-production.js --network sepolia
```

**Expected Output:**

```
🚀 Starting DecentraID Contract Deployment...
📍 Network: sepolia
✅ IdentityRegistry deployed to: 0x...
✅ VerificationRegistry deployed to: 0x...
✅ CredentialRegistry deployed to: 0x...
💾 Configuration saved to: ../backend/config.json
```

### 4. Verify Contracts (Automatic)

The deployment script automatically verifies contracts on Etherscan if `ETHERSCAN_API_KEY` is set.

## Frontend Deployment (Vercel)

### 1. Configure Environment

In Vercel dashboard, add environment variable:

- **Name**: `VITE_API_URL`
- **Value**: `https://your-backend.onrender.com`

### 2. Deploy via Vercel Dashboard

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Configure:
   - **Root Directory**: `DecentraID/web`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `dist` (default)
4. Add environment variable from step 1
5. Click **"Deploy"**

### 3. Deploy via CLI (Alternative)

```bash
cd web
npm install -g vercel
vercel --prod
```

Follow the prompts and set `VITE_API_URL` when asked.

## Post-Deployment Verification

### 1. Test Backend Health

```bash
curl https://your-backend.onrender.com/health
curl https://your-backend.onrender.com/ready
curl https://your-backend.onrender.com/config
```

### 2. Test Frontend

1. Visit your Vercel URL
2. Connect MetaMask (switch to Sepolia network)
3. Register a new identity
4. Verify transaction appears on [Sepolia Etherscan](https://sepolia.etherscan.io)

### 3. Test End-to-End Flow

1. **Identity Creation**:
   - Fill registration form
   - Submit transaction
   - Check audit logs

2. **Verification Request**:
   - Simulate verification request via API
   - Approve in frontend
   - Verify status update

3. **Audit Trail**:
   - Navigate to Audit Logs tab
   - Verify all actions are logged

## Database Setup (MongoDB Atlas)

### Free Tier Setup

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster
3. Create database user
4. Whitelist IP: `0.0.0.0/0` (for Render)
5. Get connection string
6. Update `MONGODB_URI` in backend environment

## Troubleshooting

### Backend won't start

**Error**: `ENCRYPTION_KEY must be exactly 32 characters`

- **Solution**: Generate a new key with the command in step 1

**Error**: `MongoDB Connection Error`

- **Solution**: Check `MONGODB_URI` format and network access in MongoDB Atlas

### Frontend can't connect to backend

**Error**: CORS errors in browser console

- **Solution**: Add your Vercel URL to `CORS_ORIGIN` in backend environment

### Contracts not deploying

**Error**: `insufficient funds`

- **Solution**: Get testnet ETH from [Sepolia Faucet](https://sepoliafaucet.com)

**Error**: `invalid API key`

- **Solution**: Verify `SEPOLIA_RPC_URL` and Infura/Alchemy key

## Security Checklist

- [ ] Change default `ENCRYPTION_KEY` to secure random value
- [ ] Set `NODE_ENV=production` in backend
- [ ] Configure `CORS_ORIGIN` with actual frontend URL
- [ ] Enable rate limiting (default: 100 req/15min)
- [ ] Use HTTPS for all endpoints
- [ ] Keep private keys secure (never commit to git)
- [ ] Enable MongoDB authentication
- [ ] Review and update security headers in `vercel.json`

## Monitoring

### Backend Logs

View logs in Render dashboard:

1. Go to your service
2. Click "Logs" tab
3. Monitor for errors

### Database Monitoring

MongoDB Atlas provides:

- Real-time metrics
- Query performance
- Connection monitoring

### Frontend Analytics

Add to `web/src/main.tsx` (optional):

```typescript
// Google Analytics, Vercel Analytics, etc.
```

## Scaling Considerations

### Backend

- Render auto-scales on paid plans
- Consider Redis for session management
- Use CDN for static assets

### Database

- MongoDB Atlas auto-scales
- Add indexes for frequently queried fields
- Enable backups

### Smart Contracts

- Contracts are immutable once deployed
- Plan upgrade strategy if needed
- Consider proxy patterns for upgradability

## Cost Estimate (Monthly)

- **Render (Backend)**: Free tier available, $7/month for starter
- **MongoDB Atlas**: Free tier (512MB), $9/month for shared
- **Vercel (Frontend)**: Free for hobby projects
- **Infura/Alchemy**: Free tier (100k requests/day)
- **Sepolia Testnet**: Free (testnet ETH)

**Total**: $0-$16/month depending on usage

## Support

For issues:

1. Check logs in Render/Vercel dashboard
2. Verify environment variables
3. Test endpoints individually
4. Check blockchain explorer for transaction status
