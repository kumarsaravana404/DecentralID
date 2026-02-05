# DecentraID Backend - Motia Powered

Production-ready backend for DecentraID using the Motia framework.

## 🚀 Features

- **Unified Backend Framework**: Built on Motia for seamless API, workflow, and agent orchestration
- **MongoDB Integration**: Persistent storage for identities, credentials, and audit logs
- **End-to-End Encryption**: AES-256-CBC encryption for all sensitive data
- **Gasless Identities**: Create and share identities without blockchain gas fees
- **Production Security**: Rate limiting, CORS, input validation, and audit logging
- **TypeScript**: Full type safety and modern development experience

## 📦 Project Structure

```
backend-motia/
├── motia.config.ts       # Motia configuration
├── steps/                # Motia step definitions (API endpoints)
│   ├── create-identity.ts
│   ├── create-gasless-identity.ts
│   ├── get-shared-identity.ts
│   ├── claim-identity.ts
│   ├── issue-credential.ts
│   ├── create-verification-request.ts
│   ├── confirm-verification.ts
│   ├── get-audit-logs.ts
│   └── health-check.ts
├── src/
│   ├── db/              # Database connection
│   ├── models/          # Mongoose models
│   └── utils/           # Encryption, IPFS, audit utilities
└── .env                 # Environment variables
```

## 🛠️ Local Development

1. **Install Dependencies**:

   ```bash
   npm install
   ```

2. **Configure Environment**:
   Copy `.env` and update values:

   ```env
   MONGODB_URI=your_mongodb_connection_string
   ENCRYPTION_KEY=your_32_character_encryption_key
   CORS_ORIGIN=http://localhost:5173
   ```

3. **Run Development Server**:

   ```bash
   npm run dev
   ```

   The Motia dashboard will be available at `http://localhost:3000`

## 🌐 Production Deployment (Render)

1. **Push to GitHub**:

   ```bash
   git add .
   git commit -m "feat: Motia production backend"
   git push
   ```

2. **Configure Render**:
   - Path to `render.yaml`: `DecentraID/render.yaml`
   - Add environment variables in Render Dashboard:
     - `MONGODB_URI`: Your MongoDB connection string
     - `ENCRYPTION_KEY`: 32-character secure key
     - `CORS_ORIGIN`: Your frontend URL (e.g., `https://your-app.vercel.app`)
     - `FRONTEND_URL`: Same as CORS_ORIGIN

3. **Deploy**:
   - Manual Sync or Auto-deploy from GitHub

## 📡 API Endpoints

All endpoints are automatically generated as Motia steps:

### Identity Management

- `POST /steps/create-identity` - Create encrypted identity
- `POST /steps/create-gasless-identity` - Create gasless identity
- `GET /steps/get-shared-identity` - Retrieve shared identity
- `POST /steps/claim-identity` - Claim gasless identity on-chain

### Credentials

- `POST /steps/issue-credential` - Issue verifiable credential

### Verification

- `POST /steps/create-verification-request` - Request verification
- `POST /steps/confirm-verification` - Confirm with selective disclosure

### Audit

- `GET /steps/get-audit-logs` - Get audit trail

### Health

- `GET /steps/health-check` - Service health status

## 🔐 Security Features

- **Encryption**: AES-256-CBC for all personal data
- **MongoDB**: Secure, scalable database with indexes
- **Audit Logging**: Complete activity trail
- **Input Validation**: JSON Schema validation on all inputs
- **Production Mode**: Strict error handling and logging

## 📊 Monitoring

Motia provides built-in observability:

- View all step executions in the Motia Workbench
- Real-time logs and traces
- Input/output inspection
- Error tracking

## 🔄 Migration from Express

This backend replaces the previous Express-based backend with:

- Better structure and maintainability
- Built-in workflow support
- Visual debugging and monitoring
- Type-safe development

## 📝 License

MIT
