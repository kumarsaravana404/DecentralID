# 🚀 DecentraID - Production Deployment Checklist

## ✅ Pre-Deployment Checklist

### Backend Preparation

- [x] MongoDB Atlas cluster created
- [x] Database user created with read/write permissions
- [x] IP whitelist configured (0.0.0.0/0 or specific IPs)
- [x] Environment variables documented
- [x] Health check endpoint `/health` working
- [x] Logging configured (Winston)
- [x] Rate limiting enabled
- [x] CORS configured
- [x] Encryption key generated (32 characters)
- [x] Docker configuration ready
- [x] render.yaml updated

### Frontend Preparation

- [x] Vite build optimizations enabled
- [x] Production environment variables configured
- [x] Vercel configuration updated
- [x] Cache headers configured
- [x] TypeScript types for env variables

### Smart Contracts

- [ ] Contracts compiled successfully
- [ ] Sepolia testnet deployment tested
- [ ] Contract addresses updated in config.json
- [ ] Etherscan verification (optional)

---

## 🔧 Step 1: Generate Production Encryption Key

```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

**Store this key securely!** You'll need it for Render environment variables.

---

## 📦 Step 2: Deploy Backend to Render

### Option A: Using render.yaml Blueprint

1. **Push code to GitHub** ✅ (Already done)

2. **Create new Web Service on Render**
   - Go to https://render.com/dashboard
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository: `kumarsaravana404/DecentralID`
   - Select the repository
   - Render will detect `render.yaml`

3. **Configure Environment Variables in Render Dashboard**

   | Variable         | Value                                                                                                                   |
   | ---------------- | ----------------------------------------------------------------------------------------------------------------------- |
   | `MONGODB_URI`    | `mongodb+srv://kumarsaravana34888_db_user:saravana%400408@watchtower.yuvlto5.mongodb.net/decentraid?appName=WatchTower` |
   | `ENCRYPTION_KEY` | **(Generated 32-char key from Step 1)**                                                                                 |
   | `CORS_ORIGIN`    | `https://your-frontend-url.vercel.app` (update after frontend deployment)                                               |
   | `FRONTEND_URL`   | `https://your-frontend-url.vercel.app` (same as CORS_ORIGIN)                                                            |

4. **Deploy**
   - Click "Apply" to deploy from Blueprint
   - Wait 3-5 minutes for deployment
   - Check logs for "✅ Server running on port 5000"

5. **Verify Backend**

   ```bash
   curl https://your-backend-url.onrender.com/health
   ```

   Expected response:

   ```json
   {
     "status": "ok",
     "timestamp": "2024-01-15T10:30:00.000Z",
     "uptime": 120,
     "version": "1.0.0",
     "environment": "production"
   }
   ```

### Option B: Manual Setup (if Blueprint doesn't work)

1. Create "Web Service" manually
2. Set:
   - **Name**: `decentraid-backend`
   - **Root Directory**: `DecentraID/backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
3. Add environment variables as above
4. Deploy

---

## 🌐 Step 3: Deploy Frontend to Vercel

1. **Update backend URL**

   First, copy your Render backend URL (e.g., `https://decentraid-backend.onrender.com`)

2. **Deploy to Vercel**

   ```bash
   cd DecentraID/web

   # Login to Vercel (if not already)
   npx vercel login

   # Deploy to production
   npx vercel --prod
   ```

   When prompted:
   - **Set up and deploy**: Yes
   - **Which scope**: Your account
   - **Link to existing project**: No
   - **Project name**: `decentraid` (or your choice)
   - **Directory**: `./`
   - **Override settings**: No

3. **Add Environment Variables in Vercel Dashboard**

   Go to: Vercel Dashboard → Your Project → Settings → Environment Variables

   Add:
   | Variable | Value | Environment |
   |----------|-------|-------------|
   | `VITE_API_URL` | `https://your-backend-url.onrender.com` | Production |
   | `VITE_NETWORK` | `sepolia` | Production |
   | `VITE_APP_NAME` | `DecentraID` | All |
   | `VITE_APP_VERSION` | `1.0.0` | All |

4. **Redeploy** (to apply env variables)

   ```bash
   npx vercel --prod
   ```

5. **Verify Frontend**
   - Open your Vercel URL in browser
   - Check browser console for errors
   - Test wallet connection
   - Try creating an identity

---

## 🔄 Step 4: Update CORS Settings

Now that you have your frontend URL, update the backend:

1. Go to Render Dashboard → Your Backend Service → Environment
2. Update:
   - `CORS_ORIGIN` = `https://your-frontend.vercel.app`
   - `FRONTEND_URL` = `https://your-frontend.vercel.app`
3. Click "Save Changes"
4. Backend will auto-redeploy

---

## 🔐 Step 5: Deploy Smart Contracts (Sepolia)

### Prerequisites

- Sepolia ETH in your wallet
- Infura or Alchemy API key

### Deploy

```bash
cd DecentraID/blockchain

# Install dependencies (if not already)
npm install

# Create .env file
cp .env.example .env
```

Edit `.env`:

```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
PRIVATE_KEY=your_private_key_without_0x
ETHERSCAN_API_KEY=your_etherscan_api_key
```

Deploy:

```bash
npx hardhat run scripts/deploy-production.js --network sepolia
```

**Save the contract addresses!**

### Update Config

Update `DecentraID/backend/config.json` with deployed addresses:

```json
{
  "networks": {
    "sepolia": {
      "IdentityRegistry": "0xYOUR_DEPLOYED_ADDRESS",
      "VerificationRegistry": "0xYOUR_DEPLOYED_ADDRESS",
      "CredentialRegistry": "0xYOUR_DEPLOYED_ADDRESS"
    }
  }
}
```

Commit and push:

```bash
git add backend/config.json
git commit -m "Update contract addresses for Sepolia"
git push
```

Backend will auto-redeploy on Render.

---

## ✅ Step 6: Final Verification

### Backend Health Checks

```bash
# Health check
curl https://your-backend.onrender.com/health

# Readiness check (database)
curl https://your-backend.onrender.com/ready

# Test identity creation
curl -X POST https://your-backend.onrender.com/identity/create \
  -H "Content-Type: application/json" \
  -d '{
    "did": "did:eth:0xtest123",
    "personalData": {
      "name": "Test User",
      "email": "test@example.com"
    }
  }'
```

### Frontend Tests

1. ✅ Open your Vercel URL
2. ✅ Connect MetaMask wallet (Sepolia network)
3. ✅ Navigate through all pages
4. ✅ Test identity registration
5. ✅ Test gasless identity creation
6. ✅ Check browser console for errors

---

## 📊 Monitoring

### Render Logs

- Dashboard → Your Service → Logs
- Monitor for errors or high response times

### Vercel Analytics

- Dashboard → Your Project → Analytics
- Check page load times and errors

### MongoDB Atlas

- Clusters → Metrics
- Monitor database performance

---

## 🔒 Security Checklist

- [x] HTTPS enabled (automatic on Vercel/Render)
- [x] Environment variables not committed to Git
- [x] Strong encryption key (32 chars)
- [x] Rate limiting enabled (100 req/15min)
- [x] CORS properly configured
- [x] Helmet security headers enabled
- [x] MongoDB authentication enabled
- [x] Non-root Docker user (for Docker deployments)

---

## 🆘 Troubleshooting

### Backend won't start

1. Check Render logs for errors
2. Verify all env variables are set
3. Test MongoDB connection string locally
4. Ensure ENCRYPTION_KEY is exactly 32 characters

### CORS Errors

1. Verify `CORS_ORIGIN` includes your Vercel URL
2. No trailing slash in URL
3. Use https:// not http://

### Database Connection Failed

1. Check MongoDB Atlas IP whitelist
2. Verify connection string is correct
3. Test connection: `mongosh "your_mongodb_uri"`

### Frontend can't connect to backend

1. Check `VITE_API_URL` in Vercel env variables
2. Redeploy frontend after changing env vars
3. Check browser console network tab

---

## 🎉 Congratulations!

Your DecentraID platform is now live!

- **Frontend**: https://your-frontend.vercel.app
- **Backend**: https://your-backend.onrender.com
- **Contracts**: Sepolia Testnet

### Next Steps

1. Share your app with users
2. Monitor logs and analytics
3. Set up custom domain (optional)
4. Enable Vercel analytics
5. Set up uptime monitoring (UptimeRobot, Pingdom)

---

## 📝 Important URLs

| Service           | URL                               | Purpose               |
| ----------------- | --------------------------------- | --------------------- |
| Frontend          | https://your-app.vercel.app       | User Interface        |
| Backend API       | https://your-backend.onrender.com | REST API              |
| Health Check      | backend-url/health                | System status         |
| MongoDB Atlas     | mongodb.com                       | Database              |
| Render Dashboard  | render.com/dashboard              | Backend hosting       |
| Vercel Dashboard  | vercel.com/dashboard              | Frontend hosting      |
| Etherscan Sepolia | sepolia.etherscan.io              | Contract verification |

---

## 🔄 Future Updates

To deploy updates:

```bash
# Make changes to code

# Commit and push
git add .
git commit -m "Your update description"
git push

# Both Render and Vercel will auto-deploy!
```

---

**Need help?** Check:

- `DEPLOYMENT.md` in backend folder for detailed backend docs
- Render logs for backend issues
- Vercel logs for frontend issues
- Browser console for client-side errors
