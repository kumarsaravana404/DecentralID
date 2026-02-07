-- DecentraID Supabase Database Schema
-- Run this in your Supabase SQL Editor: https://app.supabase.com/project/ybzavfobzntdxvddmuyj/sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- AUDIT LOGS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    did TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    tx_hash TEXT DEFAULT 'OFF-CHAIN',
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_did ON audit_logs(did);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);

-- =============================================================================
-- VERIFICATION REQUESTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS verification_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id INTEGER UNIQUE NOT NULL,
    verifier_did TEXT NOT NULL,
    user_did TEXT NOT NULL,
    purpose TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_verification_requests_request_id ON verification_requests(request_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON verification_requests(status);

-- =============================================================================
-- GASLESS IDENTITIES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS gasless_identities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    share_hash TEXT UNIQUE NOT NULL,
    did TEXT NOT NULL,
    encrypted_data TEXT NOT NULL,
    ipfs_hash TEXT NOT NULL,
    on_chain_status TEXT DEFAULT 'PENDING',
    anchored_by TEXT,
    tx_hash TEXT,
    access_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    anchored_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_gasless_identities_share_hash ON gasless_identities(share_hash);
CREATE INDEX IF NOT EXISTS idx_gasless_identities_did ON gasless_identities(did);
CREATE INDEX IF NOT EXISTS idx_gasless_identities_status ON gasless_identities(on_chain_status);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE gasless_identities ENABLE ROW LEVEL SECURITY;

-- Allow public read access to audit logs (you can restrict this later)
CREATE POLICY "Allow public read access to audit_logs" 
ON audit_logs FOR SELECT 
USING (true);

-- Allow public insert access to audit logs
CREATE POLICY "Allow public insert access to audit_logs" 
ON audit_logs FOR INSERT 
WITH CHECK (true);

-- Allow public read access to verification requests
CREATE POLICY "Allow public read access to verification_requests" 
ON verification_requests FOR SELECT 
USING (true);

-- Allow public insert/update access to verification requests
CREATE POLICY "Allow public insert access to verification_requests" 
ON verification_requests FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update access to verification_requests" 
ON verification_requests FOR UPDATE 
USING (true);

-- Allow public read access to gasless identities
CREATE POLICY "Allow public read access to gasless_identities" 
ON gasless_identities FOR SELECT 
USING (true);

-- Allow public insert/update access to gasless identities
CREATE POLICY "Allow public insert access to gasless_identities" 
ON gasless_identities FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update access to gasless_identities" 
ON gasless_identities FOR UPDATE 
USING (true);

-- =============================================================================
-- FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for verification_requests
DROP TRIGGER IF EXISTS update_verification_requests_updated_at ON verification_requests;
CREATE TRIGGER update_verification_requests_updated_at
    BEFORE UPDATE ON verification_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for gasless_identities
DROP TRIGGER IF EXISTS update_gasless_identities_updated_at ON gasless_identities;
CREATE TRIGGER update_gasless_identities_updated_at
    BEFORE UPDATE ON gasless_identities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- SAMPLE QUERIES (for testing)
-- =============================================================================

-- View all tables
-- SELECT * FROM audit_logs LIMIT 10;
-- SELECT * FROM verification_requests LIMIT 10;
-- SELECT * FROM gasless_identities LIMIT 10;

-- Count records
-- SELECT COUNT(*) FROM audit_logs;
-- SELECT COUNT(*) FROM verification_requests;
-- SELECT COUNT(*) FROM gasless_identities;
