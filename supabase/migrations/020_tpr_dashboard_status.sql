-- Migration 020: Add TPR Dashboard Status to clients table
-- Tracks whether a client has been added to The Pension Regulator dashboard

ALTER TABLE clients
ADD COLUMN tpr_dashboard_status TEXT DEFAULT 'not_added';

ALTER TABLE clients
ADD CONSTRAINT clients_tpr_dashboard_status_check
CHECK (tpr_dashboard_status IN ('not_added', 'waiting', 'added'));
