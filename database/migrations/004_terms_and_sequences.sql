-- Terms, term-aware sequences/results and result_finalizations are part of the PostgreSQL baseline schema.
ALTER TABLE sequences ADD COLUMN IF NOT EXISTS term_id SMALLINT;
ALTER TABLE results ADD COLUMN IF NOT EXISTS term_id SMALLINT;
