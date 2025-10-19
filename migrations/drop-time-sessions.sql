-- Migration to remove timer functionality
-- Drops the time_sessions table as timers are no longer needed

DROP TABLE IF EXISTS time_sessions CASCADE;
