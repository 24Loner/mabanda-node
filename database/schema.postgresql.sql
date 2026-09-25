BEGIN;

DROP TABLE IF EXISTS audit_logs, report_cards, result_finalizations, results, teacher_subject_classes, class_students, grading_scales, school_settings, students, subjects, classes, sequences, terms, academic_years, users, roles CASCADE;
DROP TYPE IF EXISTS gender_type, result_status, ranking_method_type, display_format_type CASCADE;

CREATE TYPE gender_type AS ENUM ('female','male','other');
CREATE TYPE result_status AS ENUM ('draft','submitted','approved','locked');
CREATE TYPE ranking_method_type AS ENUM ('competition','dense','ordinal');
CREATE TYPE display_format_type AS ENUM ('percentage','mark');

CREATE TABLE roles (
  id SMALLSERIAL PRIMARY KEY,
  name VARCHAR(30) NOT NULL UNIQUE
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  role_id SMALLINT NOT NULL REFERENCES roles(id),
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_users_role_active ON users(role_id,is_active);

CREATE TABLE academic_years (
  id SMALLSERIAL PRIMARY KEY,
  label VARCHAR(20) NOT NULL UNIQUE,
  is_current BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE terms (
  id SMALLSERIAL PRIMARY KEY,
  academic_year_id SMALLINT NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  name VARCHAR(40) NOT NULL,
  sort_order SMALLINT NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT uq_term_year_name UNIQUE(academic_year_id,name)
);

CREATE TABLE sequences (
  id SMALLSERIAL PRIMARY KEY,
  academic_year_id SMALLINT NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  term_id SMALLINT NULL REFERENCES terms(id) ON DELETE CASCADE,
  name VARCHAR(40) NOT NULL,
  sort_order SMALLINT NOT NULL,
  CONSTRAINT uq_sequence_year_term_name UNIQUE(academic_year_id,term_id,name)
);
CREATE INDEX idx_sequences_term ON sequences(term_id);

CREATE TABLE classes (
  id SERIAL PRIMARY KEY,
  academic_year_id SMALLINT NOT NULL REFERENCES academic_years(id),
  name VARCHAR(80) NOT NULL,
  class_master_id INTEGER NULL REFERENCES users(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT uq_class_year_name UNIQUE(academic_year_id,name)
);

CREATE TABLE subjects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  code VARCHAR(30) NOT NULL UNIQUE,
  max_mark NUMERIC(6,2) NOT NULL DEFAULT 20,
  coefficient NUMERIC(6,2) NOT NULL DEFAULT 1,
  category VARCHAR(80) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  student_id VARCHAR(40) NOT NULL UNIQUE,
  registration_number VARCHAR(60) NOT NULL UNIQUE,
  full_name VARCHAR(150) NOT NULL,
  gender gender_type NULL,
  date_of_birth DATE NULL,
  guardian_name VARCHAR(150) NULL,
  guardian_phone VARCHAR(40) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_students_name ON students(full_name);

CREATE TABLE class_students (
  class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  academic_year_id SMALLINT NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  PRIMARY KEY(class_id,student_id,academic_year_id)
);

CREATE TABLE teacher_subject_classes (
  id SERIAL PRIMARY KEY,
  teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT uq_teacher_subject_class UNIQUE(teacher_id,subject_id,class_id)
);
CREATE INDEX idx_assign_lookup ON teacher_subject_classes(teacher_id,class_id,subject_id,is_active);

CREATE TABLE grading_scales (
  id SERIAL PRIMARY KEY,
  academic_year_id SMALLINT NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  grade VARCHAR(20) NOT NULL,
  minimum_percentage NUMERIC(5,2) NOT NULL,
  maximum_percentage NUMERIC(5,2) NOT NULL,
  evaluation VARCHAR(120) NOT NULL,
  CONSTRAINT uq_grade_year UNIQUE(academic_year_id,grade)
);

CREATE TABLE results (
  id BIGSERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id),
  subject_id INTEGER NOT NULL REFERENCES subjects(id),
  class_id INTEGER NOT NULL REFERENCES classes(id),
  academic_year_id SMALLINT NOT NULL REFERENCES academic_years(id),
  term_id SMALLINT NOT NULL REFERENCES terms(id),
  sequence_id SMALLINT NOT NULL REFERENCES sequences(id),
  mark NUMERIC(8,2) NOT NULL,
  status result_status NOT NULL DEFAULT 'draft',
  entered_by INTEGER NOT NULL REFERENCES users(id),
  updated_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_result_identity UNIQUE(student_id,subject_id,class_id,academic_year_id,term_id,sequence_id)
);
CREATE INDEX idx_results_filter ON results(class_id,subject_id,term_id,sequence_id,academic_year_id,status);

CREATE TABLE result_finalizations (
  id BIGSERIAL PRIMARY KEY,
  academic_year_id SMALLINT NOT NULL REFERENCES academic_years(id),
  term_id SMALLINT NOT NULL REFERENCES terms(id),
  sequence_id SMALLINT NOT NULL REFERENCES sequences(id),
  finalized_by INTEGER NOT NULL REFERENCES users(id),
  finalized_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_reopened BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT uq_finalization_identity UNIQUE(academic_year_id,term_id,sequence_id)
);

CREATE TABLE school_settings (
  id SMALLINT PRIMARY KEY,
  school_name VARCHAR(180) NOT NULL,
  motto VARCHAR(255),
  address VARCHAR(255),
  phone VARCHAR(60),
  email VARCHAR(190),
  website VARCHAR(190),
  logo_path VARCHAR(255),
  principal_name VARCHAR(150),
  ranking_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ranking_method ranking_method_type NOT NULL DEFAULT 'competition',
  teacher_report_card_access BOOLEAN NOT NULL DEFAULT FALSE,
  display_format display_format_type NOT NULL DEFAULT 'percentage',
  excellent_message VARCHAR(500),
  good_message VARCHAR(500),
  fail_message VARCHAR(500),
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE report_cards (
  id BIGSERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id),
  class_id INTEGER NOT NULL REFERENCES classes(id),
  sequence_id SMALLINT NOT NULL REFERENCES sequences(id),
  academic_year_id SMALLINT NOT NULL REFERENCES academic_years(id),
  file_path VARCHAR(255),
  generated_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_report_card_identity UNIQUE(student_id,class_id,sequence_id,academic_year_id)
);

CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  action VARCHAR(40) NOT NULL,
  entity_type VARCHAR(40) NOT NULL,
  entity_id BIGINT NOT NULL,
  student_id INTEGER NULL REFERENCES students(id) ON DELETE SET NULL,
  subject_id INTEGER NULL REFERENCES subjects(id) ON DELETE SET NULL,
  previous_value TEXT NULL,
  new_value TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_audit_created ON audit_logs(created_at);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type,entity_id);

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = CURRENT_TIMESTAMP; RETURN NEW; END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER results_updated_at BEFORE UPDATE ON results FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER school_settings_updated_at BEFORE UPDATE ON school_settings FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
