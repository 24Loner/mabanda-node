BEGIN;

ALTER TABLE results
  ALTER COLUMN entered_by DROP NOT NULL;

ALTER TABLE results
  ALTER COLUMN updated_by DROP NOT NULL;

ALTER TABLE result_finalizations
  ALTER COLUMN finalized_by DROP NOT NULL;

ALTER TABLE report_cards
  ALTER COLUMN generated_by DROP NOT NULL;

ALTER TABLE audit_logs
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE results
  DROP CONSTRAINT results_entered_by_fkey;

ALTER TABLE results
  DROP CONSTRAINT results_updated_by_fkey;

ALTER TABLE result_finalizations
  DROP CONSTRAINT result_finalizations_finalized_by_fkey;

ALTER TABLE report_cards
  DROP CONSTRAINT report_cards_generated_by_fkey;

ALTER TABLE audit_logs
  DROP CONSTRAINT audit_logs_user_id_fkey;

ALTER TABLE results
  ADD CONSTRAINT results_entered_by_fkey
  FOREIGN KEY (entered_by)
  REFERENCES users(id)
  ON DELETE SET NULL;

ALTER TABLE results
  ADD CONSTRAINT results_updated_by_fkey
  FOREIGN KEY (updated_by)
  REFERENCES users(id)
  ON DELETE SET NULL;

ALTER TABLE result_finalizations
  ADD CONSTRAINT result_finalizations_finalized_by_fkey
  FOREIGN KEY (finalized_by)
  REFERENCES users(id)
  ON DELETE SET NULL;

ALTER TABLE report_cards
  ADD CONSTRAINT report_cards_generated_by_fkey
  FOREIGN KEY (generated_by)
  REFERENCES users(id)
  ON DELETE SET NULL;

ALTER TABLE audit_logs
  ADD CONSTRAINT audit_logs_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES users(id)
  ON DELETE SET NULL;

COMMIT;
