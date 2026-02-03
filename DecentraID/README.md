# DecentraID - Decentralized Identity Platform

A self-sovereign identity (SSI) system built on blockchain technology, enabling users to own and control their digital identities.

## 🌐 Live Demo

- **Frontend**: Deploy on Vercel
- **Backend**: https://decentralid.onrender.com
- **Blockchain**: Ethereum-compatible networks

## 🚀 Quick Start

### Prerequisites

- Node.js v18+
- MetaMask or compatible Web3 wallet
- Ethereum testnet ETH (Sepolia recommended)

### Local Development

#### Backend

```bash
cd DecentraID/backend
npm install
npm start
```

#### Frontend

```bash
cd DecentraID/web
npm install
npm run dev
```

## 📦 Deployment

### Backend (Render.com)

1. Connect GitHub repository
2. Set **Root Directory**: `DecentraID/backend`
3. **Build Command**: `npm install`
4. **Start Command**: `node server.js`

### Frontend (Vercel)

1. Import GitHub repository
2. Set **Root Directory**: `DecentraID/web`
3. **Framework**: Vite
4. **Environment Variable**:
   - `VITE_API_URL` = Your backend URL (e.g., https://decentralid.onrender.com)

## 🏗️ Architecture

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Blockchain**: Smart contracts (Solidity)
- **Encryption**: AES-256-CBC

## 🔐 Features

- ✅ Self-sovereign identity creation
- ✅ Verifiable credentials
- ✅ Zero-knowledge proofs (simulated)
- ✅ Audit logging
- ✅ Wallet integration (MetaMask)
- ✅ End-to-end encryption

## 📄 License

MIT
