# DecentraID - Decentralized Identity Platform

A **production-ready** self-sovereign identity (SSI) system built on blockchain technology, enabling users to own and control their digital identities with enterprise-grade security.

## 🌐 Live Demo

- **Frontend**: Deploy on Vercel
- **Backend**: https://decentralid.onrender.com
- **Blockchain**: Ethereum Sepolia Testnet

## ✨ Features

- ✅ **Self-Sovereign Identity** - Users fully control their digital identity
- ✅ **Verifiable Credentials** - Issue and verify credentials on-chain
- ✅ **Zero-Knowledge Proofs** - Privacy-preserving verification
- ✅ **Immutable Audit Trail** - All actions logged persistently
- ✅ **Wallet Integration** - Seamless MetaMask connection
- ✅ **End-to-End Encryption** - AES-256-CBC encryption
- ✅ **Production Security** - Rate limiting, CORS, input validation
- ✅ **Persistent Storage** - MongoDB for reliable data persistence
- ✅ **Health Monitoring** - Built-in health check endpoints

## 🚀 Quick Start

### Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)
- MetaMask browser extension
- Ethereum testnet ETH (Sepolia)

### Local Development

1. **Backend**

   ```bash
   cd DecentraID/backend
   npm install
   cp .env.example .env
   # Edit .env: MONGODB_URI=mongodb://localhost:27017/decentraid, ENCRYPTION_KEY=<32-char-hex>
   npm run dev
   ```

2. **Smart Contracts**

   ```bash
   cd ../blockchain
   npm install
   npx hardhat node
   # New terminal:
   npx hardhat run scripts/deploy-production.js --network localhost
   ```

3. **Frontend**
   ```bash
   cd ../web
   npm install
   cp .env.example .env
   # Edit .env: VITE_API_URL=http://localhost:5000
   npm run dev
   ```

Visit `http://localhost:5173` and connect MetaMask to localhost:8545

## 📦 Production Deployment

### 1. Backend (Render.com)

1. **Source**: Connect GitHub repo `DecentraID/backend`
2. **Settings**:
   - Environment: Node
   - Build: `npm install`
   - Start: `npm start`
3. **Environment Variables**:
   ```
   MONGODB_URI=mongodb+srv://... (from MongoDB Atlas)
   ENCRYPTION_KEY=<32-char-hex-string>
   NODE_ENV=production
   CORS_ORIGIN=https://your-frontend.vercel.app
   ```

### 2. Smart Contracts (Sepolia)

1. **Configure**: `.env` with `PRIVATE_KEY`, `SEPOLIA_RPC_URL`, `ETHERSCAN_API_KEY`
2. **Deploy**:
   ```bash
   npx hardhat run scripts/deploy-production.js --network sepolia
   ```

### 3. Frontend (Vercel)

1. **Source**: Connect GitHub repo `DecentraID/web`
2. **Settings**: Framework: Vite
3. **Environment Variables**:
   ```
   VITE_API_URL=https://your-backend.onrender.com
   ```

## 🔐 Security

- **Backend**: Helmet.js headers, CORS whitelist, Rate limiting (100 req/15min), Input validation
- **Frontend**: XSS/frame protection headers, Secure environment variables
- **Blockchain**: ReentrancyGuard, Access control, OpenZeppelin contracts

## 📊 API Endpoints

- `GET /health` - Server status
- `GET /ready` - Database status
- `GET /config` - Contract addresses
- `POST /identity/create` - Create encrypted identity
- `GET /audit/logs` - Fetch audit trail

## 📄 License

MIT

## 📧 Support

For issues, open a GitHub issue.
