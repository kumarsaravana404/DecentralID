# Changelog - DecentraID Backend

## [1.1.0] - Refactored for Production

### Enhanced

- **Logging**: Integrated `winston` for structured, persistent logging (file & console). Replaced all `console.log` and `console.error` calls.
- **Security**:
  - Implementation of `helmet` for HTTP security headers.
  - Strict `ENCRYPTION_KEY` validation on startup.
  - Improved CORS configuration with logging for blocked origins.
- **Database**:
  - Removed deprecated Mongoose connection options (`useNewUrlParser`, `useUnifiedTopology`).
  - Added connection event listeners (`error`, `disconnected`) for better reliability.
  - Graceful connection checking in `/ready` endpoint.
- **Architecture**:
  - Implemented Graceful Shutdown to close Database and Server connections safely on `SIGTERM`.
  - Abstracted IPFS logic into `uploadToIPFS` helper for better maintainability and future Pinata integration.

### Fixed

- **Deprecations**: Resolved Mongoose v8 deprecation warnings.
- **Error Handling**: Added `try-catch` blocks with standardized error responses across all routes.
- **Concurrency**: Ensured asynchronous operations are properly awaited.

### Added

- **Documentation**: JSDoc comments for all major services and endpoints.
- **Deployment**: created `DEPLOYMENT.md` with production setup instructions.
