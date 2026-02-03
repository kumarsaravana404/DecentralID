# Quick Start Checklist for Production Deployment

## ✅ What's Already Done

- [x] Backend code production-ready with MongoDB, security, health checks
- [x] Smart contract deployment scripts ready
- [x] Frontend security headers configured
- [x] All code pushed to GitHub
- [x] Dependencies installed locally
- [x] Documentation complete (README, DEPLOYMENT, PRODUCTION_SUMMARY)

## 📋 What You Need to Do Now

### Step 1: Set Up MongoDB (5 minutes)

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a free cluster (M0)
4. Create database user (username + password)
5. Network Access → Add IP: `0.0.0.0/0` (allows all IPs)
6. Get connection string:
   - Click "Connect" → "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database password
   - Example: `mongodb+srv://user:pass@cluster.mongodb.net/decentraid`

### Step 2: Generate Encryption Key (1 minute)

Run this command in your terminal:

```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

Copy the output (32-character hex string).

### Step 3: Update Backend on Render (10 minutes)

Your backend is already deployed at: https://decentralid.onrender.com

1. Go to [render.com](https://render.com) dashboard
2. Find your `decentraid-backend` service
3. Go to "Environment" tab
4. Add/Update these variables:
   ```
   MONGODB_URI=<paste-from-step-1>
   ENCRYPTION_KEY=<paste-from-step-2>
   NODE_ENV=production
   CORS_ORIGIN=https://your-frontend.vercel.app
   ```
5. Click "Save Changes"
6. Wait for auto-redeploy (~2 minutes)
7. Test: `curl https://decentralid.onrender.com/ready`
   - Should return: `{"status":"ready","database":"connected"}`

### Step 4: Deploy Smart Contracts to Sepolia (10 minutes)

1. **Get Testnet ETH**:
   - Go to [sepoliafaucet.com](https://sepoliafaucet.com)
   - Enter your wallet address
   - Request testnet ETH

2. **Get Infura Key**:
   - Go to [infura.io](https://infura.io)
   - Create free account
   - Create new project
   - Copy the Sepolia endpoint URL

3. **Get Etherscan API Key**:
   - Go to [etherscan.io/myapikey](https://etherscan.io/myapikey)
   - Create free account
   - Create new API key

4. **Create .env file**:

   ```bash
   cd DecentraID/blockchain
   # Create .env file with:
   PRIVATE_KEY=your-wallet-private-key
   SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
   ETHERSCAN_API_KEY=your-etherscan-key
   ```

5. **Deploy**:
   ```bash
   npx hardhat run scripts/deploy-production.js --network sepolia
   ```
6. **Verify Output**:
   - Should show 3 contract addresses
   - Should auto-verify on Etherscan
   - Config saved to `backend/config.json`

### Step 5: Update Backend Config (2 minutes)

1. Go back to Render dashboard
2. In your backend service, go to "Shell" tab
3. Verify `config.json` has Sepolia addresses:
   ```bash
   cat config.json
   ```
4. Should show:
   ```json
   {
     "sepolia": {
       "IdentityRegistry": "0x...",
       "VerificationRegistry": "0x...",
       "CredentialRegistry": "0x..."
     }
   }
   ```

### Step 6: Deploy Frontend to Vercel (5 minutes)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository: `kumarsaravana404/DecentralID`
3. Configure:
   - **Root Directory**: Click "Edit" → Select `DecentraID/web`
   - **Framework Preset**: Vite (should auto-detect)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `dist` (default)
4. **Environment Variables**:
   - Click "Add" → Name: `VITE_API_URL`
   - Value: `https://decentralid.onrender.com`
5. Click "Deploy"
6. Wait ~2 minutes
7. Copy your Vercel URL (e.g., `https://your-app.vercel.app`)

### Step 7: Update CORS (2 minutes)

1. Go back to Render dashboard
2. Update `CORS_ORIGIN` environment variable:
   ```
   CORS_ORIGIN=https://your-app.vercel.app
   ```
3. Save and wait for redeploy

### Step 8: Test Everything (10 minutes)

1. **Visit your Vercel URL**
2. **Connect MetaMask**:
   - Switch to Sepolia network
   - Make sure you have testnet ETH
3. **Create Identity**:
   - Fill in the registration form
   - Click "Register Identity"
   - Approve transaction in MetaMask
   - Wait for confirmation
4. **Check Audit Logs**:
   - Click "Audit Logs" tab
   - Should see "IDENTITY_CREATION" entry
5. **Verify on Blockchain**:
   - Copy transaction hash from MetaMask
   - Visit [sepolia.etherscan.io](https://sepolia.etherscan.io)
   - Paste transaction hash
   - Should show successful transaction

## ✅ Success Criteria

- [ ] Backend health check returns `{"status":"ok"}`
- [ ] Backend ready check returns `{"database":"connected"}`
- [ ] Smart contracts deployed and verified on Sepolia
- [ ] Frontend loads without errors
- [ ] MetaMask connects successfully
- [ ] Identity creation transaction succeeds
- [ ] Audit logs appear in UI
- [ ] Transaction visible on Sepolia Etherscan

## 🆘 Troubleshooting

### Backend won't start

- Check MONGODB_URI is correct
- Check ENCRYPTION_KEY is exactly 32 characters
- View logs in Render dashboard

### Frontend can't connect to backend

- Check VITE_API_URL is correct
- Check CORS_ORIGIN includes your Vercel URL
- Check browser console for errors

### Contract deployment fails

- Check you have Sepolia ETH
- Check PRIVATE_KEY is correct (without 0x prefix)
- Check SEPOLIA_RPC_URL is valid

### Transaction fails

- Make sure MetaMask is on Sepolia network
- Make sure you have enough testnet ETH
- Check contract addresses in config.json

## 📞 Need Help?

1. Check [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed troubleshooting
2. Check [PRODUCTION_SUMMARY.md](./PRODUCTION_SUMMARY.md) for what changed
3. View backend logs in Render dashboard
4. Check browser console for frontend errors

## 🎉 You're Done!

Once all checkboxes are complete, your DecentraID platform is:

- ✅ Running in production
- ✅ Secured with enterprise-grade security
- ✅ Storing data persistently
- ✅ Deployed on blockchain
- ✅ Ready for real users

**Estimated Total Time: 45 minutes**
