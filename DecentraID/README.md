# DecentraID - Decentralized Identity Platform

A **production-ready** self-sovereign identity (SSI) system built on blockchain technology, enabling users to own and control their digital identities with enterprise-grade security.

**Now features Gasless Identity creation!** Create identities without cryptocurrency and anchor them later.

---

## 📋 Table of Contents

1. [Quick Deployment](#-quick-deployment-reference)
2. [Project Overview](#-project-overview)
3. [System Architecture](#-system-architecture)
4. [Production Readiness](#-production-readiness)
5. [Detailed Deployment Guide](#-detailed-deployment-guide)
6. [Pre-Deployment Checklist](#-pre-deployment-checklist)
7. [API & Technology](#-api--technology)
8. [Experimental Motia Backend](#-experimental-motia-backend)

---

## 🚀 Quick Deployment Reference

> **Total Time:** ~10 minutes

### 1. Prerequisites (1 minute)

Generate a secure encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
# Save this key!
```

### 2. Backend Deployment (Render.com) - 5 minutes

1. Go to [Render.com](https://render.com) → Sign in → "New +" → "Blueprint".
2. Connect repo: `kumarsaravana404/DecentralID`.
3. Render detects `render.yaml`. Add environment variables:

   ```env
   MONGODB_URI=mongodb+srv://kumarsaravana34888_db_user:saravana%400408@watchtower.yuvlto5.mongodb.net/decentraid?appName=WatchTower
   ENCRYPTION_KEY=<your generated 32-char key>
   CORS_ORIGIN=https://your-frontend.vercel.app
   FRONTEND_URL=https://your-frontend.vercel.app
   ```

4. Click "Apply". Wait 3-5 mins. Copy backend URL.

### 3. Frontend Deployment (Vercel) - 3 minutes

1. Run locally:

   ```bash
   cd DecentraID/web
   npx vercel login
   npx vercel --prod
   ```

2. Add environment variable in Vercel dashboard:
   - `VITE_API_URL`: `https://YOUR-SERVICE.onrender.com`
3. Redeploy: `npx vercel --prod`. Copy frontend URL.

### 4. Final Config - 1 minute

Update `CORS_ORIGIN` and `FRONTEND_URL` in Render with your actual Vercel URL.

---

## ℹ️ Project Overview

**DecentraID** enables users to fully control their digital identity (DID).

### Key Features

- **Self-Sovereign Identity**: Users own their DIDs.
- **Gasless Identity**: Create identities without ETH.
- **Verifiable Credentials**: Issue/verify proofs.
- **Hybrid Storage**: Encrypted MongoDB (off-chain) + Ethereum (on-chain anchoring).
- **Privacy-First**: AES-256-CBC encryption.

### Gasless Workflow

1. **Create**: User generates identity off-chain (encrypted).
2. **Share**: Unique secure link generated.
3. **Claim**: Recipient uses wallet to anchor identity on-chain.

---

## 🏗 System Architecture

```mermaid
graph TD
    User[Users (Browsers)] -->|HTTPS| Frontend[Vercel (Frontend)]
    Frontend -->|API| Backend[Render.com (Backend API)]
    Backend -->|Database| DB[MongoDB Atlas]
    Backend -->|Blockchain| Sepolia[Sepolia Testnet]
```

---

## ✅ Production Readiness

Your DecentraID platform is **100% Production-Ready**.

### Backend (Express + Node.js)

- **Security**: Helmet.js, Rate Limiting (100 req/15min), CORS, Input Validation.
- **Encryption**: AES-256-CBC for all sensitive data.
- **Logging**: Winston (File + Console).
- **Monitoring**: Health (`/health`) & Readiness (`/ready`) endpoints.
- **Infrastructure**: Docker support (`Dockerfile`, `docker-compose.yml`), Render configuration (`render.yaml`).

### Frontend (React + Vite)

- **Optimization**: Terser minification, Code splitting, Asset caching.
- **Deployment**: Vercel configuration (`vercel.json`), Environment type defs.

### Smart Contracts

- **Ready**: Contracts for Identity, Verification, and Credentials.
- **Network**: Configured for Sepolia Testnet.

### Validation

Run the pre-deployment check:

```bash
cd backend
npm run check-deploy
```

---

## 📦 Detailed Deployment Guide

### Environment Variables

**Backend (.env)**

| Variable         | Description               |
| :--------------- | :------------------------ |
| `MONGODB_URI`    | MongoDB connection string |
| `ENCRYPTION_KEY` | 32-char hex string        |
| `CORS_ORIGIN`    | Frontend URL              |
| `FRONTEND_URL`   | Frontend URL              |
| `NODE_ENV`       | `production`              |
| `PORT`           | `5000`                    |

**Frontend (.env)**

| Variable       | Description         |
| :------------- | :------------------ |
| `VITE_API_URL` | Boolean backend URL |
| `VITE_NETWORK` | `sepolia`           |

### Manual Deployment Steps

#### 1. Backend (Manual)

If not using Render Blueprint:

1. Create Web Service on Render.
2. Root Dir: `DecentraID/backend`.
3. Build: `npm install`. Start: `npm start`.
4. Set env vars.

#### 2. Smart Contracts

1. `cd blockchain`
2. Configure `.env` with `PRIVATE_KEY` and `SEPOLIA_RPC_URL`.
3. `npx hardhat run scripts/deploy-production.js --network sepolia`.
4. Update `backend/config.json` with new addresses.

---

## ✅ Pre-Deployment Checklist

- [ ] **Backend**: MongoDB connected, Encryption key set, Rate limiting active.
- [ ] **Frontend**: Build optimized, Vercel env vars set.
- [ ] **Security**: HTTPS enabled, strong keys used, no secrets in Git.
- [ ] **Validation**: `npm run check-deploy` passed.

---

## 📡 API & Technology

### Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind, Ethers.js
- **Backend**: Node.js, Express, Winston, Mongoose
- **Database**: MongoDB Atlas
- **Blockchain**: Solidity, Hardhat

### Core Endpoints

- `POST /identity/create`: Create regular identity.
- `POST /identity/create-gasless`: Create off-chain identity.
- `GET /identity/share/:hash`: Retrieve gasless identity.
- `POST /identity/claim`: Anchor identity.
- `GET /audit/logs`: Fetch audit history.
- `GET /config`: Contract addresses.

---

## 🧪 Experimental Motia Backend

> **Note:** The active production backend is located in `backend/` (Express.js).

An experimental backend using the **Motia** framework is located in `backend-motia/`. It features a unified step-based architecture and is TypeScript-native. To use it, update `render.yaml` to point `rootDir` to `DecentraID/backend-motia`.

---

## 📄 License

MIT
