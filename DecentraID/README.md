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

## 🏗️ Architecture

### Frontend

- React 18 + TypeScript + Vite + Tailwind CSS
- Framer Motion animations
- Ethers.js for Web3 integration

### Backend (Production-Ready)

- Node.js + Express
- MongoDB with Mongoose ODM
- Helmet, CORS, Rate Limiting, Express Validator
- AES-256-CBC encryption with secure key management

### Blockchain

- Solidity 0.8.20 smart contracts
- Hardhat development framework
- OpenZeppelin security libraries
- Multi-network support (Localhost, Sepolia, Mainnet)

## 🚀 Quick Start

### Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)
- MetaMask browser extension
- Ethereum testnet ETH (Sepolia)

### Local Development

#### 1. Backend

```bash
cd DecentraID/backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and encryption key
npm run dev
```

#### 2. Smart Contracts (Local)

```bash
cd ../blockchain
npm install
npx hardhat node
# In another terminal:
npx hardhat run scripts/deploy-production.js --network localhost
```

#### 3. Frontend

```bash
cd ../web
npm install
cp .env.example .env
# Edit .env: VITE_API_URL=http://localhost:5000
npm run dev
```

Visit `http://localhost:5173` and connect MetaMask to localhost:8545

## 📦 Production Deployment

**See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment guide.**

### Quick Deploy Summary

#### Backend (Render)

- Root Directory: `DecentraID/backend`
- Build: `npm install`
- Start: `npm start`
- Environment: Set `MONGODB_URI`, `ENCRYPTION_KEY`, `CORS_ORIGIN`

#### Frontend (Vercel)

- Root Directory: `DecentraID/web`
- Framework: Vite
- Environment: `VITE_API_URL=<your-backend-url>`

#### Smart Contracts (Sepolia)

```bash
cd blockchain
npx hardhat run scripts/deploy-production.js --network sepolia
```

## 🔐 Security Features

### Backend

✅ Helmet.js security headers  
✅ CORS with whitelist  
✅ Rate limiting (100 req/15min)  
✅ Input validation & sanitization  
✅ Environment-based encryption keys  
✅ MongoDB injection protection

### Frontend

✅ XSS protection headers  
✅ Content Security Policy  
✅ Frame protection  
✅ HTTPS enforcement

### Smart Contracts

✅ ReentrancyGuard  
✅ Access control  
✅ Gas optimization  
✅ OpenZeppelin audited contracts

## 📊 API Endpoints

- `GET /health` - Server health check
- `GET /ready` - Database connection status
- `GET /config` - Smart contract addresses
- `POST /identity/create` - Create encrypted identity
- `PUT /identity/update` - Update identity
- `POST /credential/issue` - Issue credential
- `POST /credential/verify-zkp` - Verify ZK proof
- `POST /verify/request` - Request verification
- `POST /verify/confirm` - Confirm verification
- `GET /audit/logs?did=<did>` - Fetch audit trail

## 📝 Environment Variables

### Backend

```bash
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
ENCRYPTION_KEY=<32-char-hex>
CORS_ORIGIN=https://your-frontend.vercel.app
```

### Frontend

```bash
VITE_API_URL=https://your-backend.onrender.com
```

### Blockchain

```bash
PRIVATE_KEY=<wallet-private-key>
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/<key>
ETHERSCAN_API_KEY=<etherscan-key>
```

## 🧪 Testing

```bash
# Backend health
curl https://your-backend.onrender.com/health

# Database status
curl https://your-backend.onrender.com/ready

# Rate limiting test
for i in {1..101}; do curl https://your-backend.onrender.com/config; done
```

## ⚠️ Important Notes

- **Testnet Only**: Current deployment uses Sepolia. For mainnet, update configuration and audit contracts.
- **Encryption Keys**: Never commit `.env` files. Generate secure keys for production.
- **Private Keys**: Keep wallet private keys secure.
- **Database**: Use MongoDB Atlas with authentication in production.

## 📄 License

MIT

## 📧 Support

For issues or questions, check [DEPLOYMENT.md](./DEPLOYMENT.md) for troubleshooting or open an issue on GitHub.
