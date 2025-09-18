-- Create schema_migrations table to track database version
-- This table is used by the deployment script to manage migrations

CREATE TABLE IF NOT EXISTS schema_migrations (
    version BIGINT PRIMARY KEY,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    description TEXT
);

-- Insert initial version
INSERT INTO schema_migrations (version, description)
VALUES (1, 'Initial schema migrations table')
ON CONFLICT (version) DO NOTHING;

-- Create deployment_logs table for tracking deployments
CREATE TABLE IF NOT EXISTS deployment_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deployment_id VARCHAR(255) NOT NULL,
    environment VARCHAR(50) NOT NULL,
    version VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'in_progress',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    rollback_completed BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create index for deployment tracking
CREATE INDEX IF NOT EXISTS idx_deployment_logs_deployment_id ON deployment_logs(deployment_id);
CREATE INDEX IF NOT EXISTS idx_deployment_logs_environment ON deployment_logs(environment);
CREATE INDEX IF NOT EXISTS idx_deployment_logs_started_at ON deployment_logs(started_at);