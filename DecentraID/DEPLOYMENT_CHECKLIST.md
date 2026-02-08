# ✅ DecentraID Deployment Checklist

**Use this checklist to track your deployment progress**

---

## 🔴 CRITICAL - Must Do Before Deployment

- [ ] **Fix Supabase RLS Policies** (5 minutes)
  - [ ] Go to https://app.supabase.com/project/ybzavfobzntdxvddmuyj/sql
  - [ ] Open `backend/supabase-schema-fix.sql`
  - [ ] Copy SQL code
  - [ ] Paste into Supabase SQL Editor
  - [ ] Click "Run"
  - [ ] Verify success message
  - [ ] Test: `cd backend && node test-supabase.js`
  - [ ] Expected: "🎉 All tests passed!"

---

## 🟡 DEPLOYMENT STEPS

### Step 1: Prepare Repository

- [ ] Commit all changes to Git
- [ ] Push to GitHub
- [ ] Verify `.env` files are NOT in Git (should be in `.gitignore`)

### Step 2: Deploy Backend to Render

- [ ] Go to https://dashboard.render.com
- [ ] Click "New +" → "Web Service"
- [ ] Connect GitHub repo: `kumarsaravana404/DecentralID`
- [ ] Set Root Directory: `backend`
- [ ] Set Build Command: `npm install`
- [ ] Set Start Command: `npm start`
- [ ] Add environment variables:
  - [ ] `NODE_ENV=production`
  - [ ] `SUPABASE_URL=https://ybzavfobzntdxvddmuyj.supabase.co`
  - [ ] `SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
  - [ ] `ENCRYPTION_KEY=01234567890123456789012345678901`
  - [ ] `CORS_ORIGIN=http://localhost:5173` (will update later)
  - [ ] `FRONTEND_URL=http://localhost:5173` (will update later)
- [ ] Click "Create Web Service"
- [ ] Wait for deployment (3-5 minutes)
- [ ] Copy backend URL: `https://_____.onrender.com`
- [ ] Test health endpoint: `https://YOUR-URL.onrender.com/health`
- [ ] Test ready endpoint: `https://YOUR-URL.onrender.com/ready`

### Step 3: Deploy Frontend to Vercel

- [ ] Install Vercel CLI: `npm install -g vercel`
- [ ] Login: `vercel login`
- [ ] Navigate to web folder: `cd web`
- [ ] Deploy: `vercel --prod`
- [ ] Follow prompts (project name, settings)
- [ ] Go to Vercel Dashboard: https://vercel.com/dashboard
- [ ] Click project → Settings → Environment Variables
- [ ] Add variables:
  - [ ] `VITE_API_URL=https://YOUR-BACKEND.onrender.com`
  - [ ] `VITE_NETWORK=sepolia`
  - [ ] `VITE_APP_NAME=DecentraID`
  - [ ] `VITE_APP_VERSION=1.0.0`
  - [ ] `VITE_SUPABASE_URL=https://ybzavfobzntdxvddmuyj.supabase.co`
  - [ ] `VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- [ ] Redeploy: `vercel --prod`
- [ ] Copy frontend URL: `https://_____.vercel.app`

### Step 4: Update Backend CORS

- [ ] Go to Render Dashboard
- [ ] Click backend service
- [ ] Go to Environment tab
- [ ] Update `CORS_ORIGIN` to your Vercel URL
- [ ] Update `FRONTEND_URL` to your Vercel URL
- [ ] Save changes
- [ ] Wait for automatic redeploy

---

## 🧪 TESTING

### Backend Tests

- [ ] Health check: `curl https://YOUR-BACKEND.onrender.com/health`
- [ ] Ready check: `curl https://YOUR-BACKEND.onrender.com/ready`
- [ ] Config endpoint: `curl https://YOUR-BACKEND.onrender.com/config`

### Frontend Tests

- [ ] Visit your Vercel URL
- [ ] Open browser console (F12)
- [ ] Check for errors (should be none)
- [ ] Test wallet connection:
  - [ ] Click "Connect Wallet"
  - [ ] Approve MetaMask
  - [ ] Verify wallet address shows
  - [ ] Verify balance shows
- [ ] Test gasless identity:
  - [ ] Fill in Name and Email
  - [ ] Click "Create Gasless ID"
  - [ ] Verify shareable link generated
  - [ ] Copy link
- [ ] Test identity import:
  - [ ] Open link in incognito window
  - [ ] Verify identity details show
  - [ ] Connect different wallet
  - [ ] Click "Claim Identity"
  - [ ] Approve transaction
  - [ ] Verify success message
- [ ] Test audit logs:
  - [ ] Go to "Audit Logs" tab
  - [ ] Verify actions are logged
  - [ ] Check timestamps are correct

### Integration Tests

- [ ] Create identity on one device
- [ ] Import on another device
- [ ] Claim with different wallet
- [ ] Verify on blockchain explorer

---

## 🔒 SECURITY CHECKS

- [ ] `.env` files NOT in Git
- [ ] HTTPS enabled on both frontend and backend
- [ ] CORS configured correctly (not using `*`)
- [ ] Rate limiting active
- [ ] Encryption key is 32 characters
- [ ] Supabase RLS policies enabled
- [ ] No secrets in console logs
- [ ] No API keys exposed in frontend

---

## 📊 MONITORING SETUP

- [ ] Enable Vercel Analytics
- [ ] Set up Render monitoring
- [ ] Monitor Supabase dashboard
- [ ] Set up error alerts (optional: Sentry)
- [ ] Bookmark important URLs:
  - [ ] Render Dashboard
  - [ ] Vercel Dashboard
  - [ ] Supabase Dashboard

---

## 🎯 POST-DEPLOYMENT

### First Hour

- [ ] Monitor Render logs for errors
- [ ] Monitor Vercel deployment logs
- [ ] Test all features again
- [ ] Share with team for testing

### First Day

- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Collect initial feedback
- [ ] Fix any critical issues

### First Week

- [ ] Review analytics
- [ ] Monitor costs (Render, Vercel, Supabase)
- [ ] Plan improvements
- [ ] Document lessons learned

---

## 🚨 ROLLBACK PLAN

If something goes wrong:

### Backend Issues

- [ ] Check Render logs
- [ ] Verify environment variables
- [ ] Rollback to previous deployment in Render
- [ ] Check Supabase connection

### Frontend Issues

- [ ] Check Vercel logs
- [ ] Verify environment variables
- [ ] Rollback to previous deployment in Vercel
- [ ] Check API URL is correct

### Database Issues

- [ ] Check Supabase logs
- [ ] Verify RLS policies
- [ ] Check connection limits
- [ ] Review recent queries

---

## 📞 SUPPORT RESOURCES

### Documentation

- [ ] `PRODUCTION_SUMMARY.md` - Overview of all work done
- [ ] `PRODUCTION_READINESS_REPORT.md` - Detailed audit report
- [ ] `DEPLOYMENT_GUIDE.md` - Step-by-step deployment
- [ ] `README.md` - Project overview

### Dashboards

- Render: https://dashboard.render.com
- Vercel: https://vercel.com/dashboard
- Supabase: https://app.supabase.com

### Logs

- Render: Dashboard → Your Service → Logs
- Vercel: Dashboard → Project → Deployments → Logs
- Supabase: Dashboard → Logs

---

## ✅ COMPLETION

When all items are checked:

- [ ] **All critical items completed**
- [ ] **All deployment steps completed**
- [ ] **All tests passing**
- [ ] **All security checks passed**
- [ ] **Monitoring set up**
- [ ] **Team notified**

**Deployment Status:** 🟢 LIVE

**URLs:**

- Frontend: `https://_____.vercel.app`
- Backend: `https://_____.onrender.com`

**Date Deployed:** ****\_\_\_****

**Deployed By:** ****\_\_\_****

---

🎉 **Congratulations! Your DecentraID platform is now live!** 🎉
