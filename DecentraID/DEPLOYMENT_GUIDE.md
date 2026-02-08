# 🚀 Quick Deployment Guide - DecentraID

**Last Updated:** 2026-02-08  
**Estimated Time:** 20 minutes  
**Status:** ✅ Ready to Deploy

---

## ✅ Pre-Deployment Status

### Fixed Issues

- ✅ Added Error Boundary component
- ✅ Added missing Supabase env vars to frontend
- ✅ Created SQL fix script for RLS DELETE policies
- ✅ Frontend build tested successfully (113.09 kB gzipped)

### Remaining Critical Issue

- ⚠️ **You must run the SQL fix script in Supabase** (5 minutes)

---

## 🎯 STEP-BY-STEP DEPLOYMENT

### Step 1: Fix Supabase RLS Policies (5 minutes)

1. Go to: https://app.supabase.com/project/ybzavfobzntdxvddmuyj/sql
2. Open the file: `backend/supabase-schema-fix.sql`
3. Copy all the SQL code
4. Paste it into the Supabase SQL Editor
5. Click "Run" button
6. Verify you see "Success" message

**Test it worked:**

```bash
cd backend
node test-supabase.js
```

You should see: `🎉 All tests passed!`

---

### Step 2: Deploy Backend to Render (10 minutes)

1. **Go to Render Dashboard**
   - URL: https://dashboard.render.com
   - Click "New +" → "Web Service"

2. **Connect Repository**
   - Connect to GitHub: `kumarsaravana404/DecentralID`
   - Branch: `main`

3. **Configure Service**
   - Name: `decentraid-backend`
   - Region: `Singapore` (or closest to you)
   - **Root Directory:** `backend` ⚠️ IMPORTANT!
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Instance Type: `Free`

4. **Add Environment Variables**
   Click "Advanced" → "Add Environment Variable" for each:

   ```env
   NODE_ENV=production
   SUPABASE_URL=https://ybzavfobzntdxvddmuyj.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliemF2Zm9iem50ZHh2ZGRtdXlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0NjA2NjUsImV4cCI6MjA4NjAzNjY2NX0.dJapbXtb9ZOP_u_pQddq1JvN9AHDAToo1sDoyR6hSYU
   ENCRYPTION_KEY=01234567890123456789012345678901
   CORS_ORIGIN=http://localhost:5173
   FRONTEND_URL=http://localhost:5173
   ```

   **Note:** We'll update `CORS_ORIGIN` and `FRONTEND_URL` after deploying frontend.

5. **Deploy**
   - Click "Create Web Service"
   - Wait 3-5 minutes for deployment
   - Copy your backend URL (e.g., `https://decentraid-backend-xyz.onrender.com`)

6. **Test Backend**
   - Visit: `https://YOUR-BACKEND-URL.onrender.com/health`
   - You should see: `{"status":"ok","timestamp":"...","uptime":...}`

---

### Step 3: Deploy Frontend to Vercel (5 minutes)

1. **Install Vercel CLI** (if not already installed)

   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**

   ```bash
   vercel login
   ```

3. **Deploy from web directory**

   ```bash
   cd web
   vercel --prod
   ```

4. **Follow prompts:**
   - Set up and deploy? `Y`
   - Which scope? (Select your account)
   - Link to existing project? `N`
   - Project name? `decentraid` (or your choice)
   - Directory? `./` (it's already in web folder)
   - Override settings? `N`

5. **Add Environment Variables in Vercel Dashboard**
   - Go to: https://vercel.com/dashboard
   - Click on your project → Settings → Environment Variables
   - Add these variables:

   ```env
   VITE_API_URL=https://YOUR-BACKEND-URL.onrender.com
   VITE_NETWORK=sepolia
   VITE_APP_NAME=DecentraID
   VITE_APP_VERSION=1.0.0
   VITE_SUPABASE_URL=https://ybzavfobzntdxvddmuyj.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliemF2Zm9iem50ZHh2ZGRtdXlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0NjA2NjUsImV4cCI6MjA4NjAzNjY2NX0.dJapbXtb9ZOP_u_pQddq1JvN9AHDAToo1sDoyR6hSYU
   ```

   **Replace `YOUR-BACKEND-URL` with your actual Render URL!**

6. **Redeploy**

   ```bash
   vercel --prod
   ```

7. **Copy your frontend URL** (e.g., `https://decentraid.vercel.app`)

---

### Step 4: Update Backend CORS (2 minutes)

1. Go back to Render Dashboard
2. Click on your backend service
3. Go to "Environment" tab
4. Update these variables:
   - `CORS_ORIGIN` = `https://YOUR-FRONTEND-URL.vercel.app`
   - `FRONTEND_URL` = `https://YOUR-FRONTEND-URL.vercel.app`

5. Click "Save Changes"
6. Wait for automatic redeploy (~2 minutes)

---

### Step 5: Final Testing (5 minutes)

Visit your frontend URL and test:

1. **Connect Wallet**
   - Click "Connect Wallet"
   - Approve MetaMask connection
   - Verify wallet address shows in header

2. **Create Gasless Identity**
   - Fill in Name and Email
   - Click "Create Gasless ID"
   - Verify shareable link is generated
   - Copy the link

3. **Import Identity**
   - Open link in incognito/new browser
   - Verify identity details show
   - Connect different wallet
   - Click "Claim Identity"
   - Approve transaction in MetaMask
   - Verify success message

4. **Check Audit Logs**
   - Go to "Audit Logs" tab
   - Verify actions are logged

5. **Test Health Endpoints**
   - Visit: `https://YOUR-BACKEND-URL.onrender.com/health`
   - Visit: `https://YOUR-BACKEND-URL.onrender.com/ready`
   - Both should return success

---

## 🎉 SUCCESS CHECKLIST

- [ ] Supabase RLS policies fixed
- [ ] Backend deployed to Render
- [ ] Backend health check passes
- [ ] Frontend deployed to Vercel
- [ ] Wallet connection works
- [ ] Gasless identity creation works
- [ ] Identity import/claim works
- [ ] Audit logs show correctly
- [ ] No console errors in browser

---

## 🐛 Troubleshooting

### Backend won't start

**Error:** `Missing required environment variables`
**Fix:** Double-check all env vars are set in Render dashboard

### Frontend shows "Network Error"

**Error:** API calls failing
**Fix:**

1. Check `VITE_API_URL` is correct in Vercel
2. Check `CORS_ORIGIN` includes your Vercel URL in Render
3. Redeploy both services

### "Please switch to Sepolia network"

**Fix:** Open MetaMask → Switch network to "Sepolia Test Network"

### Transactions failing

**Error:** "Insufficient funds"
**Fix:** Get Sepolia testnet ETH from faucet:

- https://sepoliafaucet.com/
- https://www.alchemy.com/faucets/ethereum-sepolia

### Build fails on Vercel

**Error:** TypeScript errors
**Fix:** Run `npm run build` locally first to see errors

---

## 📊 Post-Deployment Monitoring

### First 24 Hours

- Monitor Render logs for errors
- Check Vercel analytics for traffic
- Monitor Supabase dashboard for query performance
- Test from different devices/browsers

### Week 1

- Collect user feedback
- Monitor error rates
- Check performance metrics
- Plan improvements

---

## 🔐 Security Reminders

1. **Never commit `.env` files** - Already in `.gitignore` ✅
2. **Rotate encryption key** - Plan to rotate every 90 days
3. **Monitor Supabase usage** - Free tier has limits
4. **Enable 2FA** - On Render, Vercel, and Supabase accounts
5. **Review RLS policies** - Current policies allow public access (fine for demo)

---

## 📈 Next Steps After Deployment

1. **Add Analytics**
   - Enable Vercel Analytics (free)
   - Add Google Analytics or PostHog

2. **Add Error Tracking**
   - Set up Sentry for error monitoring
   - Configure alerts

3. **Optimize Performance**
   - Enable Vercel Edge Network
   - Add caching headers
   - Optimize images

4. **Deploy Smart Contracts**
   - Deploy to Sepolia testnet
   - Update `backend/config.json`
   - Verify on Etherscan

5. **Custom Domain** (Optional)
   - Buy domain
   - Configure in Vercel
   - Update CORS settings

---

## 🆘 Need Help?

### Common Issues

- **Render Logs:** https://dashboard.render.com → Your Service → Logs
- **Vercel Logs:** https://vercel.com/dashboard → Your Project → Deployments → Click deployment → Logs
- **Supabase Logs:** https://app.supabase.com → Your Project → Logs

### Documentation

- Render: https://render.com/docs
- Vercel: https://vercel.com/docs
- Supabase: https://supabase.com/docs

---

## ✅ Deployment Complete!

Your DecentraID platform is now live! 🎉

**Share your deployment:**

- Frontend: `https://YOUR-APP.vercel.app`
- Backend: `https://YOUR-BACKEND.onrender.com`

**Important URLs to bookmark:**

- Render Dashboard: https://dashboard.render.com
- Vercel Dashboard: https://vercel.com/dashboard
- Supabase Dashboard: https://app.supabase.com

Good luck! 🚀
