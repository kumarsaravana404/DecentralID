# DecentraID - Decentralized Identity Platform

A **production-ready** self-sovereign identity (SSI) system built on blockchain technology, enabling users to own and control their digital identities with enterprise-grade security.

**Now features Gasless Identity creation!** Create identities without cryptocurrency and anchor them later.

---

## 📋 Table of Contents

1. [Quick Deployment](#-quick-deployment-reference)
2. [Project Overview](#project-overview)
3. [System Architecture](#-system-architecture)
4. [Production Readiness](#-production-readiness)
5. [Detailed Deployment Guide](#-detailed-deployment-guide)
6. [Pre-Deployment Checklist](#-pre-deployment-checklist)
7. [API & Technology](#-api--technology)
8. [Supabase Integration](#-supabase-integration)
9. [Experimental Motia Backend](#-experimental-motia-backend)

---

## 🚀 Quick Deployment Reference

> **Total Time:** ~10 minutes

### 1. Prerequisites (2 minutes)

1.  **Generate Encryption Key:**

    ```bash
    node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
    # Save this 32-character key!
    ```

2.  **Supabase Setup:**
    - Create a project at [Supabase](https://supabase.com).
    - Go to the SQL Editor and run the schema found in `backend/supabase-schema.sql`.
    - Get your `SUPABASE_URL` and `SUPABASE_ANON_KEY` from Project Settings > API.

### 2. Backend Deployment (Render.com) - 5 minutes

1.  Go to [Render.com](https://render.com) → Sign in → "New +" → "Web Service".
2.  Connect repo: `kumarsaravana404/DecentralID`.
3.  Root Directory: `backend`.
4.  Build Command: `npm install`.
5.  Start Command: `npm start`.
6.  **Environment Variables:**

    ```env
    SUPABASE_URL=https://your-project.supabase.co
    SUPABASE_ANON_KEY=your-anon-key
    ENCRYPTION_KEY=<your generated 32-char key>
    CORS_ORIGIN=https://your-frontend.vercel.app
    FRONTEND_URL=https://your-frontend.vercel.app
    NODE_ENV=production
    ```

7.  Click "Create Web Service". Wait 3-5 mins. Copy backend URL.

### 3. Frontend Deployment (Vercel) - 3 minutes

1.  Run locally:

    ```bash
    cd web
    npx vercel login
    npx vercel --prod
    ```

2.  Add environment variable in Vercel dashboard:
    - `VITE_API_URL`: `https://YOUR-SERVICE.onrender.com`
    - `VITE_SUPABASE_URL`: `https://your-project.supabase.co`
    - `VITE_SUPABASE_ANON_KEY`: `your-anon-key`
3.  Redeploy: `npx vercel --prod`. Copy frontend URL.

### 4. Final Config - 1 minute

Update `CORS_ORIGIN` and `FRONTEND_URL` in Render with your actual Vercel URL.

---

## Project Overview

**DecentraID** enables users to fully control their digital identity (DID).

### Key Features

- **Self-Sovereign Identity**: Users own their DIDs.
- **Gasless Identity**: Create identities without ETH.
- **Verifiable Credentials**: Issue/verify proofs.
- **Hybrid Storage**: Encrypted Supabase (PostgreSQL) (off-chain) + Ethereum (on-chain anchoring).
- **Privacy-First**: AES-256-CBC encryption.

### Gasless Workflow

1.  **Create**: User generates identity off-chain (encrypted).
2.  **Share**: Unique secure link generated.
3.  **Claim**: Recipient uses wallet to anchor identity on-chain.

---

## 🏗 System Architecture

```mermaid
graph TD
    User[Users (Browsers)] -->|HTTPS| Frontend[Vercel (Frontend)]
    Frontend -->|API| Backend[Render.com (Backend API)]
    Backend -->|Database| DB[Supabase (PostgreSQL)]
    Backend -->|Blockchain| Sepolia[Sepolia Testnet]
```

---

## ✅ Production Readiness

Your DecentraID platform is **100% Production-Ready**.

### Backend (Express + Node.js)

- **Database**: Migrated from MongoDB to **Supabase (PostgreSQL)** for better scalability and real-time features.
- **Security**: Helmet.js, Rate Limiting (100 req/15min), CORS, Input Validation, Row Level Security (RLS).
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

- Note: The check script might check for MongoDB; ensure `npm run test:supabase` passes.

---

## 📦 Detailed Deployment Guide

### Environment Variables

#### Backend (.env)

| Variable            | Description               |
| :------------------ | :------------------------ |
| `SUPABASE_URL`      | Your Supabase Project URL |
| `SUPABASE_ANON_KEY` | Your Supabase Anon Key    |
| `ENCRYPTION_KEY`    | 32-char hex string        |
| `CORS_ORIGIN`       | Frontend URL              |
| `FRONTEND_URL`      | Frontend URL              |
| `NODE_ENV`          | `production`              |
| `PORT`              | `5000`                    |

#### Frontend (.env)

| Variable                 | Description          |
| :----------------------- | :------------------- |
| `VITE_API_URL`           | Boolean backend URL  |
| `VITE_NETWORK`           | `sepolia`            |
| `VITE_SUPABASE_URL`      | Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase Anon Key    |

### Manual Deployment Steps

#### 1. Backend (Manual)

If not using Render Blueprint:

1.  Create Web Service on Render.
2.  Root Dir: `backend`.
3.  Build: `npm install`. Start: `npm start`.
4.  Set env vars.

#### 2. Smart Contracts

1.  `cd blockchain`
2.  Configure `.env` with `PRIVATE_KEY` and `SEPOLIA_RPC_URL`.
3.  `npx hardhat run scripts/deploy-production.js --network sepolia`.
4.  Update `backend/config.json` with new addresses.

---

## ✅ Pre-Deployment Checklist

- [ ] **Backend**: Supabase connected (RLS policies set), Encryption key set, Rate limiting active.
- [ ] **Frontend**: Build optimized, Vercel env vars set.
- [ ] **Security**: HTTPS enabled, strong keys used, no secrets in Git.
- [ ] **Validation**: `npm run test:supabase` passed.

---

## 📡 API & Technology

### Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind, Ethers.js
- **Backend**: Node.js, Express, Winston, **Supabase Services**
- **Database**: **Supabase (PostgreSQL)**
- **Blockchain**: Solidity, Hardhat

### Core Endpoints

- `POST /identity/create`: Create regular identity.
- `POST /identity/create-gasless`: Create off-chain identity.
- `GET /identity/share/:hash`: Retrieve gasless identity.
- `POST /identity/claim`: Anchor identity.
- `GET /audit/logs`: Fetch audit history.
- `GET /config`: Contract addresses.

---

## ⚡ Supabase Integration

The project has been migrated to Supabase.

### Quick Start

1.  **Run SQL Schema**:
    - Open `backend/supabase-schema.sql`.
    - Run the SQL in your Supabase project's SQL Editor.

2.  **Test Connection**:
    - `cd backend`
    - `npm run test:supabase`

### Key Files

- `backend/supabaseClient.js`: Connection logic.
- `backend/supabase-schema.sql`: Database schema.
- `backend/services/*.js`: Service layer replacing Mongoose models.

---

## 🧪 Experimental Motia Backend

> **Note:** The active production backend is located in `backend/` (Express.js + Supabase).

An experimental backend using the **Motia** framework is located in `backend-motia/`. It features a unified step-based architecture and is TypeScript-native. To use it, update `render.yaml` to point `rootDir` to `DecentraID/backend-motia`.

---

## 📄 License

MIT
