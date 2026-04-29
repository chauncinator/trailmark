-- Trailmark Guild Database Schema
-- Run this in Supabase SQL editor

-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- TABLES
-- ============================================================

-- Workers
CREATE TABLE workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE NOT NULL,
  name TEXT,
  bio TEXT,
  location TEXT,
  category TEXT,
  subcategory TEXT,
  tier INTEGER DEFAULT 0,
  completion_rate INTEGER DEFAULT 0,
  quality_score INTEGER DEFAULT 0,
  peer_weight INTEGER DEFAULT 0,
  jury_score INTEGER DEFAULT 0,
  mentor_score INTEGER DEFAULT 0,
  dao_score INTEGER DEFAULT 0,
  tdlr_license_number TEXT,
  tdlr_verified BOOLEAN DEFAULT FALSE,
  tdlr_expires_at TIMESTAMPTZ,
  profile_embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jobs
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_wallet TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  budget_eth NUMERIC,
  tier_required INTEGER DEFAULT 0,
  location TEXT,
  status TEXT DEFAULT 'open',
  worker_wallet TEXT,
  contract_address TEXT,
  job_embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Milestones
CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  index INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  amount_eth NUMERIC,
  status TEXT DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  tx_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attestations
CREATE TABLE attestations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_wallet TEXT NOT NULL,
  attester_wallet TEXT NOT NULL,
  credential_type TEXT NOT NULL,
  category TEXT,
  subcategory TEXT,
  external_ref TEXT,
  metadata_uri TEXT,
  stake_amount NUMERIC DEFAULT 0,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  eas_uid TEXT,
  is_on_chain BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job Applications
CREATE TABLE job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  worker_wallet TEXT NOT NULL,
  cover_note TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_workers_wallet ON workers(wallet_address);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_category ON jobs(category);
CREATE INDEX idx_milestones_job ON milestones(job_id);
CREATE INDEX idx_attestations_worker ON attestations(worker_wallet);
CREATE INDEX idx_applications_job ON job_applications(job_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE attestations ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- workers POLICIES
-- ============================================================

-- Anyone can read worker profiles (public marketplace)
CREATE POLICY "Workers are publicly readable"
  ON workers FOR SELECT
  USING (true);

-- Workers can insert their own profile
CREATE POLICY "Workers can insert own profile"
  ON workers FOR INSERT
  WITH CHECK (wallet_address = auth.jwt()->>'sub');

-- Workers can update their own profile
CREATE POLICY "Workers can update own profile"
  ON workers FOR UPDATE
  USING (wallet_address = auth.jwt()->>'sub');

-- ============================================================
-- jobs POLICIES
-- ============================================================

-- Anyone can read open/active jobs (public marketplace)
CREATE POLICY "Jobs are publicly readable"
  ON jobs FOR SELECT
  USING (true);

-- Authenticated users can create jobs (clients)
CREATE POLICY "Authenticated users can create jobs"
  ON jobs FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Only the client or assigned worker can update a job
CREATE POLICY "Client or worker can update job"
  ON jobs FOR UPDATE
  USING (
    client_wallet = auth.jwt()->>'sub'
    OR worker_wallet = auth.jwt()->>'sub'
  );

-- ============================================================
-- milestones POLICIES
-- ============================================================

-- Anyone can read milestones (they're tied to public jobs)
CREATE POLICY "Milestones are publicly readable"
  ON milestones FOR SELECT
  USING (true);

-- Only the client of the parent job can update milestones
CREATE POLICY "Job client can update milestones"
  ON milestones FOR UPDATE
  USING (
    job_id IN (
      SELECT id FROM jobs WHERE client_wallet = auth.jwt()->>'sub'
    )
  );

-- Milestones are created with jobs via service role
CREATE POLICY "Service role can insert milestones"
  ON milestones FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- attestations POLICIES
-- ============================================================

-- Anyone can read attestations (public credentials)
CREATE POLICY "Attestations are publicly readable"
  ON attestations FOR SELECT
  USING (true);

-- Authenticated users can create attestations (vouching)
CREATE POLICY "Authenticated users can create attestations"
  ON attestations FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Only the attester can update their own attestation
CREATE POLICY "Attesters can update own attestations"
  ON attestations FOR UPDATE
  USING (attester_wallet = auth.jwt()->>'sub');

-- ============================================================
-- job_applications POLICIES
-- ============================================================

-- Workers can read applications for jobs they applied to; clients can read applications for their jobs
CREATE POLICY "Workers and clients can view relevant applications"
  ON job_applications FOR SELECT
  USING (
    worker_wallet = auth.jwt()->>'sub'
    OR job_id IN (
      SELECT id FROM jobs WHERE client_wallet = auth.jwt()->>'sub'
    )
  );

-- Authenticated users can apply to jobs
CREATE POLICY "Authenticated users can apply to jobs"
  ON job_applications FOR INSERT
  WITH CHECK (
    worker_wallet = auth.jwt()->>'sub'
    AND auth.role() = 'authenticated'
  );

-- Only the job client can update application status (accept/reject)
CREATE POLICY "Job client can update application status"
  ON job_applications FOR UPDATE
  USING (
    job_id IN (
      SELECT id FROM jobs WHERE client_wallet = auth.jwt()->>'sub'
    )
  );

-- ============================================================
-- HELPER: updated_at trigger
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_workers_updated_at
  BEFORE UPDATE ON workers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
