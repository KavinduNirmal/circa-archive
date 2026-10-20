-- Additive upgrade from the pre-profile auth schema. Stop API writers before applying.
-- This transaction aborts on duplicate normalized emails; resolve them explicitly first.
BEGIN;
LOCK TABLE auth.users IN ACCESS EXCLUSIVE MODE;
ALTER TABLE auth.users
    ADD COLUMN display_id varchar(9),
    ADD COLUMN display_name varchar(64) NOT NULL DEFAULT 'H. John Doe',
    ADD COLUMN adopted_organization_id uuid,
    ADD COLUMN is_active boolean NOT NULL DEFAULT true,
    ADD COLUMN is_banned boolean NOT NULL DEFAULT false,
    ADD COLUMN deleted_at timestamptz,
    ADD COLUMN updated_at timestamptz,
    ADD COLUMN last_login_at timestamptz,
    ADD COLUMN last_logout_at timestamptz,
    ADD COLUMN activity_ip_list text[] NOT NULL DEFAULT '{}';

-- Retain existing UUIDs, password hashes, sessions and author references.
WITH allocated AS (
    SELECT id, lpad((row_number() OVER (ORDER BY created_at, id) - 1)::text, 9, '0') AS display_id
    FROM auth.users
)
UPDATE auth.users AS users SET display_id = allocated.display_id, updated_at = users.created_at,
    is_banned = users.strike_count >= 5, strike_count = LEAST(users.strike_count, 5)
FROM allocated WHERE users.id = allocated.id;

ALTER TABLE auth.users ALTER COLUMN display_id SET NOT NULL;
ALTER TABLE auth.users ALTER COLUMN updated_at SET NOT NULL;
CREATE UNIQUE INDEX ux_users_display_id ON auth.users (display_id);
DROP INDEX auth."EmailIndex";
CREATE UNIQUE INDEX "EmailIndex" ON auth.users (normalized_email);
COMMIT;
