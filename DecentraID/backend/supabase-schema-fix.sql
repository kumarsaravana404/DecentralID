-- DecentraID Supabase RLS DELETE Policies Fix
-- Run this in your Supabase SQL Editor to fix the DELETE permission issue
-- URL: https://app.supabase.com/project/ybzavfobzntdxvddmuyj/sql

-- =============================================================================
-- ADD DELETE POLICIES
-- =============================================================================

-- Add DELETE policy for audit_logs
CREATE POLICY IF NOT EXISTS "Allow public delete access to audit_logs" 
ON audit_logs FOR DELETE 
USING (true);

-- Add DELETE policy for verification_requests
CREATE POLICY IF NOT EXISTS "Allow public delete access to verification_requests" 
ON verification_requests FOR DELETE 
USING (true);

-- Add DELETE policy for gasless_identities
CREATE POLICY IF NOT EXISTS "Allow public delete access to gasless_identities" 
ON gasless_identities FOR DELETE 
USING (true);

-- =============================================================================
-- VERIFY POLICIES
-- =============================================================================

-- Check all policies for audit_logs
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'audit_logs';

-- Check all policies for verification_requests
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'verification_requests';

-- Check all policies for gasless_identities
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'gasless_identities';
