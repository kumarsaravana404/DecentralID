<div align="center">
  <img src="web/public/vite.svg" alt="DecentraID Logo" width="100" />
  <h1>DecentraID</h1>
  <p><strong>Decentralized Self-Sovereign Identity (SSI) Protocol</strong></p>
  <p>Your Identity. Your Control. Zero Gas Needed.</p>
  
  <a href="https://decentral-id.vercel.app/"><strong>🌍 View Live Application</strong></a>
  <span> | </span>
  <a href="#-getting-started"><strong>💻 Local Setup</strong></a>
</div>

---

## 🚀 Overview

**DecentraID** is a production-ready Web3 platform that empowers users to fully own, manage, and verify their digital identity on the blockchain.

By utilizing a **hybrid storage architecture** (AES-256-CBC encrypted off-chain data + on-chain cryptographic anchoring), DecentraID solves the core UX hurdles of Web3 identity management. Features like **Gasless Identity Creation** allow users to generate verifiable identities securely without needing to hold cryptocurrency, paying gas, or even initially connecting a wallet.

## ✨ Key Features

- **Self-Sovereign Identity (SSI):** Full user control over DIDs (Decentralized Identifiers). Nobody can access your data without your cryptographic consent.
- **Gasless Onboarding ⚡:** Create a secure, encrypted identity off-chain. Share the generated hash, and let it be claimed and anchored on-chain later. Zero gas required for new users.
- **Verifiable Credentials:** A trustless proof verification system for issuing and validating credentials (e.g., National ID, University Degrees, Reputations).
- **Immutable Audit Trails:** Every major action and verification request is cryptographically logged and transparently anchored.
- **Privacy-First Encryption:** All sensitive personal data is secured using AES-256-CBC encryption before resting in PostgreSQL.
- **Mobile-Friendly UI:** A beautiful, responsive, and intuitive interface built with React, Tailwind, and Framer Motion.

## 🏗 System Architecture

DecentraID utilizes a highly optimized, dual-layer architecture:

1. **Client Layer (Vercel):** A lightning-fast React application handles wallet connections (MetaMask/Ethers.js), client-side state, and UI.
2. **Relay API (Render.com):** A secure Node.js backend handles encryption, rate-limiting, off-chain state management, and meta-transactions for gasless onboarding.
3. **Data Layer (Supabase):** Highly structured, Row-Level-Security (RLS) guarded PostgreSQL database for storing encrypted off-chain identity blobs and audit logs.
4. **Consensus Layer (Ethereum/Sepolia):** Smart contracts act as the ultimate source of truth, anchoring identity creation and verification consents.

## 🛠 Tech Stack

**Frontend:**

- React 18 & TypeScript
- Vite
- Tailwind CSS & Framer Motion
- Ethers.js v6

**Backend:**

- Node.js & Express
- Supabase (PostgreSQL)
- Crypto (AES-256-CBC)
- Winston (Logging)

**Smart Contracts:**

- Solidity
- Hardhat (Testing & Deployment)

---

## 💻 Getting Started

Follow these instructions to run the DecentraID platform locally for development and testing.

### 1. Prerequisites

- **Node.js**: v18 or newer
- **Git**
- **MetaMask**: Browser extension for testing identity creation on the blockchain.
- **Supabase Account**: For the database instance.

### 2. Clone the Repository

```bash
git clone https://github.com/kumarsaravana404/DecentralID.git
cd DecentralID
```

### 3. Database Setup (Supabase)

1. Create a new project on [Supabase.com](https://supabase.com/).
2. Navigate to the SQL Editor in your Supabase dashboard.
3. Open `backend/supabase-schema.sql` from this repository and run the entire SQL script to scaffold the tables and RLS policies.
4. Retrieve your `Project URL` and `anon public key` from the API Settings.

### 4. Backend Configuration

Navigate to the backend directory and install dependencies:

```bash
cd backend
npm install
```

Generate a secure 32-character AES Encryption Key:

```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

Create a `.env` file in the `backend/` directory:

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173

# Database
SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

# Security & Crypto
ENCRYPTION_KEY=YOUR_GENERATED_32_CHAR_KEY_HERE
```

Start the backend API:

```bash
npm run dev
# The API will run on http://localhost:5000
```

### 5. Frontend Configuration

Open a new terminal window, navigate to the frontend directory, and install dependencies:

```bash
cd web
npm install
```

Create a `.env` file in the `web/` directory:

```env
VITE_API_URL=http://localhost:5000
VITE_NETWORK=sepolia
```

Start the frontend development server:

```bash
npm run dev
# The frontend will run on http://localhost:5173
```

---

## 📄 API Documentation

The backend exposes several critical endpoints for identity management:

- `POST /identity/create`: Encrypts personal data and prepares it for on-chain anchoring.
- `POST /identity/create-gasless`: Generates a temporary off-chain identity and a shareable claim hash.
- `GET /identity/share/:hash`: Retrieves the encrypted preview of a gasless identity.
- `POST /identity/claim`: Validates a claimed hash and finalizes the identity anchor.
- `POST /verify/consent`: Logs user consent for a third-party verification request.
- `GET /audit/logs`: Retrieves the immutable history of actions for a given DID.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
Feel free to check [issues page](https://github.com/kumarsaravana404/DecentralID/issues).

## 📝 License

This project is [MIT](https://opensource.org/licenses/MIT) licensed.
