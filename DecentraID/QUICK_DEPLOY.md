# 🚀 DecentraID Quick Deployment Reference

## One-Page Deployment Guide

### Prerequisites (1 minute)

```bash
# Generate encryption key
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
# Save this key!
```

---

### Backend Deployment (5 minutes)

**Platform: Render.com**

1. Go to https://render.com → Sign in → "New +" → "Blueprint"
2. Connect repo: `kumarsaravana404/DecentralID`
3. Render detects `render.yaml` automatically
4. Add environment variables:

```env
MONGODB_URI=mongodb+srv://kumarsaravana34888_db_user:saravana%400408@watchtower.yuvlto5.mongodb.net/decentraid?appName=WatchTower
ENCRYPTION_KEY=<your generated 32-char key>
CORS_ORIGIN=https://your-frontend.vercel.app
FRONTEND_URL=https://your-frontend.vercel.app
```

5. Click "Apply" → Wait 3-5 minutes
6. Copy backend URL: `https://YOUR-SERVICE.onrender.com`

---

### Frontend Deployment (3 minutes)

**Platform: Vercel**

```bash
cd DecentraID/web
npx vercel login
npx vercel --prod
```

Add environment variable in Vercel dashboard:

- **Name**: `VITE_API_URL`
- **Value**: `https://YOUR-SERVICE.onrender.com` (from backend step)

Redeploy:

```bash
npx vercel --prod
```

Copy frontend URL: `https://YOUR-PROJECT.vercel.app`

---

### Final Step: Update CORS (1 minute)

Go to Render → Your Backend Service → Environment

Update these two variables with your actual Vercel URL:

- `CORS_ORIGIN` = `https://YOUR-PROJECT.vercel.app`
- `FRONTEND_URL` = `https://YOUR-PROJECT.vercel.app`

Click "Save environment" → Backend auto-redeploys

---

## ✅ Verification

### Test Backend

```bash
curl https://YOUR-SERVICE.onrender.com/health
# Should return: {"status":"ok",...}
```

### Test Frontend

1. Open `https://YOUR-PROJECT.vercel.app`
2. Connect MetaMask (Sepolia network)
3. Try creating an identity

---

## 🆘 Troubleshooting

| Problem                          | Solution                                                                 |
| -------------------------------- | ------------------------------------------------------------------------ |
| **CORS error**                   | Update `CORS_ORIGIN` in Render with exact Vercel URL (no trailing slash) |
| **Database error**               | Check MongoDB Atlas → Network Access → IP whitelist includes Render      |
| **Encryption error**             | Ensure `ENCRYPTION_KEY` is exactly 32 characters                         |
| **Frontend can't reach backend** | Verify `VITE_API_URL` in Vercel matches backend URL                      |

---

## 📦 Production Architecture

```
User Browser
     ↓ HTTPS
Vercel (Frontend) → React App
     ↓ REST API
Render (Backend) → Express + Encryption
     ↓ Mongoose
MongoDB Atlas → Database
     ↓ Web3
Sepolia Testnet → Smart Contracts
```

---

## 🔐 Security Checklist

- [x] HTTPS everywhere (auto on Vercel/Render)
- [x] Environment variables set (not in code)
- [x] Strong encryption key (32 chars)
- [x] CORS configured properly
- [x] Rate limiting active (100 req/15 min)
- [x] MongoDB authentication on
- [x] Helmet security headers on

---

## 📊 Monitoring

**Render Logs**: Dashboard → Your Service → Logs  
**Vercel Analytics**: Dashboard → Your Project → Analytics  
**MongoDB Metrics**: Atlas → Metrics

---

## 🔄 Future Deployments

Code changes auto-deploy on `git push main`!

```bash
# Make changes
git add .
git commit -m "Your changes"
git push

# Both Render and Vercel auto-deploy
```

---

## 📝 Environment Variables Reference

### Backend (Render)

| Variable         | Example                              |
| ---------------- | ------------------------------------ |
| `MONGODB_URI`    | `mongodb+srv://user:pass@cluster...` |
| `ENCRYPTION_KEY` | `a1b2c3d4e5f6...` (32 chars)         |
| `CORS_ORIGIN`    | `https://decentraid.vercel.app`      |
| `FRONTEND_URL`   | Same as CORS_ORIGIN                  |
| `NODE_ENV`       | `production` (auto)                  |
| `PORT`           | `5000` (auto)                        |

### Frontend (Vercel)

| Variable       | Example                        |
| -------------- | ------------------------------ |
| `VITE_API_URL` | `https://backend.onrender.com` |
| `VITE_NETWORK` | `sepolia`                      |

---

## 📞 Support Resources

- **Full Guide**: `DEPLOYMENT_CHECKLIST.md`
- **Backend Details**: `backend/DEPLOYMENT.md`
- **Architecture**: `PRODUCTION_READY.md`
- **Issues**: Check Render/Vercel logs first

---

**Total Deployment Time: ~10 minutes** ⏱️

**Made with ❤️**  
React • Express • MongoDB • Solidity
