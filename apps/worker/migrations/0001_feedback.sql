-- Times are UTC Unix milliseconds. Quota events intentionally have no report linkage.
-- Reports and anti-abuse events deliberately have no linking key or foreign key.
-- Deleting a report must not refund the connection's or service's acceptance quota.
CREATE TABLE feedback_reports (
  receipt_id TEXT PRIMARY KEY,
  report TEXT NOT NULL CHECK (length(CAST(report AS BLOB)) <= 8192),
  service_version TEXT NOT NULL,
  accepted_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX feedback_reports_expiry ON feedback_reports(expires_at);

CREATE TABLE feedback_admissions (
  ip_digest TEXT NOT NULL,
  accepted_at INTEGER NOT NULL
);
CREATE INDEX feedback_admissions_ip_time ON feedback_admissions(ip_digest, accepted_at);
CREATE INDEX feedback_admissions_time ON feedback_admissions(accepted_at);
