-- Voice Receptionist AI System Database Schema
-- Migration 001: Initial database schema setup

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Customers table
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100),
    email VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Call sessions table
CREATE TABLE call_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id),
    phone_number VARCHAR(20) NOT NULL,
    session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_end TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'active', -- active, completed, failed
    transcript TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Knowledge base table
CREATE TABLE knowledge_base (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(50),
    source VARCHAR(20) DEFAULT 'supervisor', -- supervisor, manual, system
    confidence_score DECIMAL(3,2) DEFAULT 1.0,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Help requests table
CREATE TABLE help_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    call_session_id UUID REFERENCES call_sessions(id),
    customer_phone VARCHAR(20) NOT NULL,
    question TEXT NOT NULL,
    context TEXT, -- Full conversation context
    status VARCHAR(20) DEFAULT 'pending', -- pending, resolved, unresolved, timeout
    priority VARCHAR(10) DEFAULT 'normal', -- low, normal, high, urgent
    supervisor_response TEXT,
    supervisor_id VARCHAR(100), -- Could be email or user ID
    resolved_at TIMESTAMP WITH TIME ZONE,
    timeout_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '4 hours'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Request follow-ups table (for tracking follow-up communications)
CREATE TABLE request_followups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    help_request_id UUID REFERENCES help_requests(id),
    message TEXT NOT NULL,
    follow_up_type VARCHAR(20) NOT NULL, -- sms, call, email
    status VARCHAR(20) DEFAULT 'pending', -- pending, sent, failed
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_customers_phone ON customers(phone_number);
CREATE INDEX idx_call_sessions_customer ON call_sessions(customer_id);
CREATE INDEX idx_call_sessions_status ON call_sessions(status);
CREATE INDEX idx_help_requests_status ON help_requests(status);
CREATE INDEX idx_help_requests_timeout ON help_requests(timeout_at);
CREATE INDEX idx_help_requests_created ON help_requests(created_at DESC);
CREATE INDEX idx_knowledge_base_question ON knowledge_base USING gin(to_tsvector('english', question));

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for auto-updating timestamps
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_knowledge_base_updated_at BEFORE UPDATE ON knowledge_base FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_help_requests_updated_at BEFORE UPDATE ON help_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-timeout help requests
CREATE OR REPLACE FUNCTION timeout_old_requests()
RETURNS void AS $$
BEGIN
    UPDATE help_requests
    SET status = 'timeout', updated_at = NOW()
    WHERE status = 'pending' AND timeout_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- View for supervisor dashboard
CREATE VIEW supervisor_dashboard AS
SELECT
    hr.id,
    hr.question,
    hr.context,
    hr.status,
    hr.priority,
    hr.customer_phone,
    hr.created_at,
    hr.timeout_at,
    c.name as customer_name,
    EXTRACT(EPOCH FROM (NOW() - hr.created_at))/3600 as hours_waiting
FROM help_requests hr
LEFT JOIN call_sessions cs ON hr.call_session_id = cs.id
LEFT JOIN customers c ON cs.customer_id = c.id
WHERE hr.status IN ('pending', 'resolved')
ORDER BY
    CASE hr.priority
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'normal' THEN 3
        WHEN 'low' THEN 4
    END,
    hr.created_at ASC;