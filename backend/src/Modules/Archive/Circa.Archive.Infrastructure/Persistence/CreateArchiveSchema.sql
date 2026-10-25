CREATE SCHEMA IF NOT EXISTS archive;

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS archive.organizations (
    id uuid PRIMARY KEY,
    reference_number bigint NOT NULL,
    name varchar(255) NOT NULL,
    established_year integer NULL,
    recognized_year integer NULL,
    recognition_state varchar(20) NOT NULL DEFAULT 'unrecognized',
    filed_by_id uuid NOT NULL,
    filed_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    geographic_influence text NULL,
    personnel_count integer NULL,
    logo_object_key text NULL,
    gallery jsonb NOT NULL DEFAULT '[]',
    organization_type varchar(20) NULL,
    markdown text NOT NULL DEFAULT '',
    severity_words jsonb NOT NULL DEFAULT '[]',
    email_local_part varchar(64) NULL,
    holder_code_format jsonb NULL,
    record_status varchar(20) NOT NULL DEFAULT 'on_file',
    vote_score integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ck_organizations_reference_number CHECK (reference_number >= 0)
);

CREATE TABLE IF NOT EXISTS archive.incidents (
    id uuid PRIMARY KEY,
    reference_number bigint NOT NULL,
    severity varchar(2) NOT NULL,
    designation varchar(256) NOT NULL,
    markdown text NOT NULL,
    author_id uuid NOT NULL,
    author_affiliation_org_id uuid NULL,
    claim_org_id uuid NULL,
    access_policy varchar(20) NOT NULL DEFAULT 'public',
    classification smallint NULL,
    warning_tier varchar(10) NULL,
    warning_disclosure varchar(20) NOT NULL DEFAULT 'not_provided',
    warning_tags text[] NOT NULL DEFAULT ARRAY[]::text[],
    holder_code varchar(40) NULL,
    record_status varchar(20) NOT NULL DEFAULT 'on_file',
    content_hash varchar(64) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(designation, '') || ' ' || coalesce(markdown, ''))
    ) STORED,
    CONSTRAINT ck_incidents_classification CHECK (classification IS NULL OR classification BETWEEN 3 AND 6),
    CONSTRAINT ck_incidents_reference_number CHECK (reference_number >= 0),
    CONSTRAINT fk_incidents_author_affiliation_org FOREIGN KEY (author_affiliation_org_id)
        REFERENCES archive.organizations (id) ON DELETE SET NULL,
    CONSTRAINT fk_incidents_claim_org FOREIGN KEY (claim_org_id)
        REFERENCES archive.organizations (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS archive.records (
    id uuid PRIMARY KEY,
    record_type varchar(10) NOT NULL,
    reference_number bigint NOT NULL,
    code varchar(20) NULL,
    incident_id uuid NOT NULL,
    author_id uuid NOT NULL,
    author_affiliation_org_id uuid NULL,
    markdown text NOT NULL,
    follows_record_id uuid NULL,
    access_policy varchar(20) NOT NULL DEFAULT 'public',
    classification smallint NULL,
    warning_tier varchar(10) NULL,
    warning_disclosure varchar(20) NOT NULL DEFAULT 'not_provided',
    warning_tags text[] NOT NULL DEFAULT ARRAY[]::text[],
    holder_code varchar(40) NULL,
    record_status varchar(20) NOT NULL DEFAULT 'on_file',
    content_hash varchar(64) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(markdown, ''))
    ) STORED,
    CONSTRAINT ck_records_classification CHECK (classification IS NULL OR classification BETWEEN 3 AND 6),
    CONSTRAINT ck_records_reference_number CHECK (reference_number >= 0),
    CONSTRAINT ck_records_code CHECK (
        (record_type = 'RUM' AND code IS NULL) OR (record_type <> 'RUM' AND code IS NOT NULL)
    ),
    CONSTRAINT fk_records_incident FOREIGN KEY (incident_id)
        REFERENCES archive.incidents (id) ON DELETE RESTRICT,
    CONSTRAINT fk_records_affiliation_org FOREIGN KEY (author_affiliation_org_id)
        REFERENCES archive.organizations (id) ON DELETE SET NULL,
    CONSTRAINT fk_records_follows FOREIGN KEY (follows_record_id)
        REFERENCES archive.records (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS archive.record_tags (
    record_id uuid NOT NULL,
    tag varchar(64) NOT NULL,
    PRIMARY KEY (record_id, tag),
    CONSTRAINT fk_record_tags_record FOREIGN KEY (record_id)
        REFERENCES archive.records (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS archive.characters (
    id uuid PRIMARY KEY,
    reference_number bigint NOT NULL,
    name varchar(120) NOT NULL,
    metadata jsonb NOT NULL DEFAULT '[]',
    markdown text NOT NULL,
    created_by_id uuid NOT NULL,
    usage_policy varchar(20) NOT NULL DEFAULT 'restricted',
    record_status varchar(20) NOT NULL DEFAULT 'on_file',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ck_characters_reference_number CHECK (reference_number >= 0)
);

CREATE TABLE IF NOT EXISTS archive.recoveries (
    id uuid PRIMARY KEY,
    reference_number bigint NOT NULL,
    name varchar(255) NOT NULL,
    alternative_names text[] NOT NULL DEFAULT ARRAY[]::text[],
    category varchar(20) NOT NULL,
    description text NOT NULL,
    origin_incident_id uuid NULL,
    first_documented_record_id uuid NULL,
    registered_by_id uuid NOT NULL,
    documentation_status varchar(20) NOT NULL DEFAULT 'basic',
    registry_status varchar(20) NOT NULL DEFAULT 'active',
    metadata jsonb NOT NULL DEFAULT '[]',
    gallery jsonb NOT NULL DEFAULT '[]',
    first_recovered_by_character_id uuid NULL,
    first_recovered_by_org_id uuid NULL,
    current_custodian_character_id uuid NULL,
    current_custodian_org_id uuid NULL,
    custody_status varchar(20) NOT NULL DEFAULT 'unknown',
    reproducibility varchar(20) NOT NULL DEFAULT 'unknown',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ck_recoveries_reference_number CHECK (reference_number >= 0),
    CONSTRAINT fk_recoveries_origin_incident FOREIGN KEY (origin_incident_id)
        REFERENCES archive.incidents (id) ON DELETE SET NULL,
    CONSTRAINT fk_recoveries_first_documented FOREIGN KEY (first_documented_record_id)
        REFERENCES archive.records (id) ON DELETE SET NULL,
    CONSTRAINT fk_recoveries_first_character FOREIGN KEY (first_recovered_by_character_id)
        REFERENCES archive.characters (id) ON DELETE SET NULL,
    CONSTRAINT fk_recoveries_first_org FOREIGN KEY (first_recovered_by_org_id)
        REFERENCES archive.organizations (id) ON DELETE SET NULL,
    CONSTRAINT fk_recoveries_custodian_character FOREIGN KEY (current_custodian_character_id)
        REFERENCES archive.characters (id) ON DELETE SET NULL,
    CONSTRAINT fk_recoveries_custodian_org FOREIGN KEY (current_custodian_org_id)
        REFERENCES archive.organizations (id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_incidents_reference_number
    ON archive.incidents (reference_number);
CREATE INDEX IF NOT EXISTS ix_incidents_content_hash
    ON archive.incidents (content_hash);
CREATE INDEX IF NOT EXISTS ix_incidents_designation_trgm
    ON archive.incidents USING gin (designation gin_trgm_ops);
CREATE INDEX IF NOT EXISTS ix_incidents_feed
    ON archive.incidents (record_status, access_policy, created_at DESC, id)
    WHERE record_status = 'on_file';
CREATE INDEX IF NOT EXISTS ix_incidents_author_feed
    ON archive.incidents (author_id, created_at DESC, id);
CREATE INDEX IF NOT EXISTS ix_incidents_affiliation
    ON archive.incidents (author_affiliation_org_id)
    WHERE author_affiliation_org_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_incidents_claim
    ON archive.incidents (claim_org_id)
    WHERE claim_org_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_incidents_warning_tags
    ON archive.incidents USING gin (warning_tags array_ops);
CREATE INDEX IF NOT EXISTS ix_incidents_search_vector
    ON archive.incidents USING gin (search_vector);

CREATE UNIQUE INDEX IF NOT EXISTS ux_organizations_reference_number
    ON archive.organizations (reference_number);
CREATE INDEX IF NOT EXISTS ix_organizations_name_trgm
    ON archive.organizations USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS ix_organizations_recent
    ON archive.organizations (record_status, created_at DESC, id)
    WHERE record_status = 'on_file';
CREATE INDEX IF NOT EXISTS ix_organizations_directory
    ON archive.organizations (recognition_state, record_status, created_at DESC, id)
    WHERE record_status = 'on_file';
CREATE INDEX IF NOT EXISTS ix_organizations_filed_by
    ON archive.organizations (filed_by_id, filed_at DESC, id);

CREATE UNIQUE INDEX IF NOT EXISTS ux_records_type_reference_number
    ON archive.records (record_type, reference_number);
CREATE UNIQUE INDEX IF NOT EXISTS ux_records_code
    ON archive.records (code)
    WHERE code IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_records_content_hash
    ON archive.records (content_hash);
CREATE INDEX IF NOT EXISTS ix_records_recent
    ON archive.records (record_status, access_policy, created_at DESC, id)
    WHERE record_status = 'on_file';
CREATE INDEX IF NOT EXISTS ix_records_feed
    ON archive.records (record_type, record_status, access_policy, created_at DESC, id)
    WHERE record_status = 'on_file';
CREATE INDEX IF NOT EXISTS ix_records_incident_filings
    ON archive.records (incident_id, record_status, created_at DESC, id)
    WHERE record_status = 'on_file';
CREATE INDEX IF NOT EXISTS ix_records_incident_type_filings
    ON archive.records (incident_id, record_type, record_status, created_at DESC, id)
    WHERE record_status = 'on_file';
CREATE INDEX IF NOT EXISTS ix_records_author_feed
    ON archive.records (author_id, record_status, created_at DESC, id)
    WHERE record_status = 'on_file';
CREATE INDEX IF NOT EXISTS ix_records_affiliation_feed
    ON archive.records (author_affiliation_org_id, record_status, created_at DESC, id)
    WHERE author_affiliation_org_id IS NOT NULL AND record_status = 'on_file';
CREATE INDEX IF NOT EXISTS ix_records_follows
    ON archive.records (follows_record_id)
    WHERE follows_record_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_records_warning_tags
    ON archive.records USING gin (warning_tags array_ops);
CREATE INDEX IF NOT EXISTS ix_records_search_vector
    ON archive.records USING gin (search_vector);
CREATE INDEX IF NOT EXISTS ix_record_tags_tag_record
    ON archive.record_tags (tag, record_id);

CREATE UNIQUE INDEX IF NOT EXISTS ux_characters_reference_number
    ON archive.characters (reference_number);
CREATE INDEX IF NOT EXISTS ix_characters_name_trgm
    ON archive.characters USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS ix_characters_recent
    ON archive.characters (record_status, created_at DESC, id)
    WHERE record_status = 'on_file';
CREATE INDEX IF NOT EXISTS ix_characters_directory
    ON archive.characters (usage_policy, record_status, created_at DESC, id)
    WHERE record_status = 'on_file';
CREATE INDEX IF NOT EXISTS ix_characters_created_by
    ON archive.characters (created_by_id, created_at DESC, id);

CREATE UNIQUE INDEX IF NOT EXISTS ux_recoveries_reference_number
    ON archive.recoveries (reference_number);
CREATE INDEX IF NOT EXISTS ix_recoveries_name_trgm
    ON archive.recoveries USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS ix_recoveries_alternative_names
    ON archive.recoveries USING gin (alternative_names array_ops);
CREATE INDEX IF NOT EXISTS ix_recoveries_recent
    ON archive.recoveries (registry_status, created_at DESC, id);
CREATE INDEX IF NOT EXISTS ix_recoveries_directory
    ON archive.recoveries (registry_status, category, created_at DESC, id);
CREATE INDEX IF NOT EXISTS ix_recoveries_custody
    ON archive.recoveries (custody_status, registry_status, created_at DESC, id);
CREATE INDEX IF NOT EXISTS ix_recoveries_origin_incident
    ON archive.recoveries (origin_incident_id)
    WHERE origin_incident_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_recoveries_first_documented
    ON archive.recoveries (first_documented_record_id)
    WHERE first_documented_record_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_recoveries_registered_by
    ON archive.recoveries (registered_by_id, created_at DESC, id);

-- PostgreSQL array_to_string is stable for polymorphic arrays. This text-only
-- wrapper is immutable: text formatting has no locale/session dependency.
CREATE OR REPLACE FUNCTION archive.recovery_search_text(text, text[], text)
RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
    SELECT coalesce($1, '') || ' ' || coalesce(pg_catalog.array_to_string($2, ' '), '') || ' ' || coalesce($3, '')
$$;

-- Additive stage 2 search upgrade. Safe to rerun on the stage 1 schema.
ALTER TABLE archive.organizations ADD COLUMN IF NOT EXISTS legacy_code varchar(40);
CREATE UNIQUE INDEX IF NOT EXISTS ux_organizations_legacy_code
    ON archive.organizations (legacy_code) WHERE legacy_code IS NOT NULL;

CREATE TABLE IF NOT EXISTS archive.record_assessments (
    id uuid PRIMARY KEY,
    record_id uuid NOT NULL REFERENCES archive.records(id) ON DELETE CASCADE,
    user_id uuid NOT NULL,
    assessment varchar(20) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_record_assessments_record_user
    ON archive.record_assessments (record_id, user_id);

CREATE TABLE IF NOT EXISTS archive.record_access_requests (
    id uuid PRIMARY KEY,
    record_id uuid NOT NULL REFERENCES archive.records(id) ON DELETE CASCADE,
    requester_id uuid NOT NULL,
    status varchar(20) NOT NULL DEFAULT 'pending',
    decided_by uuid,
    decided_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_record_access_requests_record_status
    ON archive.record_access_requests (record_id, status);
CREATE INDEX IF NOT EXISTS ix_record_access_requests_approved
    ON archive.record_access_requests (requester_id, record_id)
    WHERE status = 'approved' AND decided_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS archive.tombstones (
    id uuid PRIMARY KEY,
    record_id uuid NOT NULL REFERENCES archive.records(id) ON DELETE CASCADE,
    reason text NOT NULL,
    category varchar(50) NOT NULL,
    hash varchar(64) NOT NULL,
    tombstoned_by uuid NOT NULL,
    tombstoned_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_tombstones_hash ON archive.tombstones (hash);
CREATE INDEX IF NOT EXISTS ix_tombstones_record ON archive.tombstones (record_id);

ALTER TABLE archive.incidents ADD COLUMN IF NOT EXISTS search_text text GENERATED ALWAYS AS (coalesce(designation, '') || ' ' || coalesce(markdown, '')) STORED;
CREATE INDEX IF NOT EXISTS ix_incidents_search_text ON archive.incidents USING gin (search_text gin_trgm_ops);
CREATE INDEX IF NOT EXISTS ix_incidents_holder_prefix ON archive.incidents (lower(holder_code) text_pattern_ops);

ALTER TABLE archive.records ADD COLUMN IF NOT EXISTS search_text text GENERATED ALWAYS AS (coalesce(code, '') || ' ' || coalesce(markdown, '')) STORED;
CREATE INDEX IF NOT EXISTS ix_records_search_text ON archive.records USING gin (search_text gin_trgm_ops);
CREATE INDEX IF NOT EXISTS ix_records_holder_prefix ON archive.records (lower(holder_code) text_pattern_ops);

ALTER TABLE archive.organizations ADD COLUMN IF NOT EXISTS search_text text GENERATED ALWAYS AS (coalesce(name, '') || ' ' || coalesce(markdown, '')) STORED;
ALTER TABLE archive.organizations ADD COLUMN IF NOT EXISTS search_vector tsvector GENERATED ALWAYS AS (to_tsvector('english', coalesce(name, '') || ' ' || coalesce(markdown, ''))) STORED;
CREATE INDEX IF NOT EXISTS ix_organizations_search_vector ON archive.organizations USING gin (search_vector);
CREATE INDEX IF NOT EXISTS ix_organizations_search_text ON archive.organizations USING gin (search_text gin_trgm_ops);

ALTER TABLE archive.characters ADD COLUMN IF NOT EXISTS search_text text GENERATED ALWAYS AS (coalesce(name, '') || ' ' || coalesce(markdown, '')) STORED;
ALTER TABLE archive.characters ADD COLUMN IF NOT EXISTS search_vector tsvector GENERATED ALWAYS AS (to_tsvector('english', coalesce(name, '') || ' ' || coalesce(markdown, ''))) STORED;
CREATE INDEX IF NOT EXISTS ix_characters_search_vector ON archive.characters USING gin (search_vector);
CREATE INDEX IF NOT EXISTS ix_characters_search_text ON archive.characters USING gin (search_text gin_trgm_ops);

ALTER TABLE archive.recoveries ADD COLUMN IF NOT EXISTS search_text text GENERATED ALWAYS AS (archive.recovery_search_text(name, alternative_names, description)) STORED;
ALTER TABLE archive.recoveries ADD COLUMN IF NOT EXISTS search_vector tsvector GENERATED ALWAYS AS (to_tsvector('english', archive.recovery_search_text(name, alternative_names, description))) STORED;
CREATE INDEX IF NOT EXISTS ix_recoveries_search_vector ON archive.recoveries USING gin (search_vector);
CREATE INDEX IF NOT EXISTS ix_recoveries_search_text ON archive.recoveries USING gin (search_text gin_trgm_ops);

-- Normalize pre-release databases previously created from the EF scaffold.
UPDATE archive.record_assessments SET assessment = lower(assessment)
    WHERE assessment IN ('Corroborate', 'Contest');
UPDATE archive.record_access_requests SET status = lower(status)
    WHERE status IN ('Pending', 'Approved', 'Denied', 'Expired');
