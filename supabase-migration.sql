-- ============================================================
-- AUR PLM — Supabase Migration V1
-- Run this in Supabase SQL Editor in one execution
-- ============================================================

-- ENUMS
CREATE TYPE user_role AS ENUM ('designer', 'sales', 'marketing', 'production', 'admin');
CREATE TYPE design_status AS ENUM (
  'draft', 'submitted', 'under_review', 'revision_requested', 'resubmitted',
  'approved', 'specification_pending', 'production_ready', 'sampling',
  'sample_approved', 'production', 'launch_ready', 'archived'
);
CREATE TYPE collection_status AS ENUM ('active', 'archived');
CREATE TYPE file_type AS ENUM ('design_image', 'inspiration_image', 'moodboard_image', 'design_file', 'document');
CREATE TYPE reviewer_role AS ENUM ('sales', 'marketing', 'admin');
CREATE TYPE notification_type AS ENUM (
  'new_design', 'new_comment', 'comment_reply',
  'design_approved', 'revision_requested', 'production_status_updated'
);

-- ============================================================
-- USERS (mirrors auth.users)
-- ============================================================
CREATE TABLE users (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name       TEXT NOT NULL,
  email           TEXT UNIQUE NOT NULL,
  role            user_role NOT NULL DEFAULT 'designer',
  avatar_url      TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-insert user row on auth signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'designer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- COLLECTIONS
-- ============================================================
CREATE TABLE collections (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  description     TEXT,
  launch_window   TEXT,
  season          TEXT,
  status          collection_status NOT NULL DEFAULT 'active',
  created_by      UUID NOT NULL REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at     TIMESTAMPTZ
);

-- ============================================================
-- DESIGNS
-- ============================================================
CREATE TABLE designs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  collection_id   UUID REFERENCES collections(id),
  category        TEXT NOT NULL,
  description     TEXT,
  design_story    TEXT,
  launch_window   TEXT,
  season          TEXT,
  drop_name       TEXT,
  gender          TEXT,
  intended_market TEXT,
  designer_id     UUID NOT NULL REFERENCES users(id),
  current_version INTEGER NOT NULL DEFAULT 1,
  status          design_status NOT NULL DEFAULT 'draft',
  sku             TEXT UNIQUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER designs_updated_at
  BEFORE UPDATE ON designs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- DESIGN VERSIONS
-- ============================================================
CREATE TABLE design_versions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  design_id       UUID NOT NULL REFERENCES designs(id) ON DELETE CASCADE,
  version_number  INTEGER NOT NULL,
  uploaded_by     UUID NOT NULL REFERENCES users(id),
  change_note     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (design_id, version_number)
);

-- ============================================================
-- DESIGN FILES
-- ============================================================
CREATE TABLE design_files (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  design_id       UUID NOT NULL REFERENCES designs(id) ON DELETE CASCADE,
  version_id      UUID REFERENCES design_versions(id),
  file_type       file_type NOT NULL,
  file_url        TEXT NOT NULL,
  file_name       TEXT,
  file_format     TEXT,
  uploaded_by     UUID NOT NULL REFERENCES users(id),
  uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- REVIEWS
-- ============================================================
CREATE TABLE reviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  design_id       UUID NOT NULL REFERENCES designs(id) ON DELETE CASCADE,
  version_id      UUID REFERENCES design_versions(id),
  reviewer_id     UUID NOT NULL REFERENCES users(id),
  role            reviewer_role NOT NULL,
  brand_fit       INTEGER CHECK (brand_fit BETWEEN 1 AND 10),
  commercial_pot  INTEGER CHECK (commercial_pot BETWEEN 1 AND 10),
  originality     INTEGER CHECK (originality BETWEEN 1 AND 10),
  production_feas INTEGER CHECK (production_feas BETWEEN 1 AND 10),
  overall_score   NUMERIC(4,1),
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (design_id, reviewer_id)
);

-- Auto-calculate overall score
CREATE OR REPLACE FUNCTION calc_overall_score()
RETURNS TRIGGER AS $$
BEGIN
  NEW.overall_score = (NEW.brand_fit + NEW.commercial_pot + NEW.originality + NEW.production_feas)::NUMERIC / 4;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reviews_overall_score
  BEFORE INSERT OR UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION calc_overall_score();

-- ============================================================
-- COMMENTS
-- ============================================================
CREATE TABLE comments (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  design_id            UUID NOT NULL REFERENCES designs(id) ON DELETE CASCADE,
  version_id           UUID REFERENCES design_versions(id),
  author_id            UUID NOT NULL REFERENCES users(id),
  parent_id            UUID REFERENCES comments(id),
  body                 TEXT NOT NULL,
  is_revision_reason   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  edited_at            TIMESTAMPTZ
);

-- ============================================================
-- STATUS HISTORY (immutable audit trail)
-- ============================================================
CREATE TABLE status_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  design_id       UUID NOT NULL REFERENCES designs(id) ON DELETE CASCADE,
  changed_by      UUID NOT NULL REFERENCES users(id),
  from_status     TEXT,
  to_status       TEXT NOT NULL,
  comment_id      UUID REFERENCES comments(id),
  changed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prevent updates/deletes on status_history
CREATE RULE no_update_status_history AS ON UPDATE TO status_history DO INSTEAD NOTHING;
CREATE RULE no_delete_status_history AS ON DELETE TO status_history DO INSTEAD NOTHING;

-- ============================================================
-- SKUS
-- ============================================================
CREATE TABLE skus (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  design_id       UUID NOT NULL UNIQUE REFERENCES designs(id),
  sku_code        TEXT NOT NULL UNIQUE,
  category_code   TEXT NOT NULL,
  season_code     TEXT NOT NULL,
  sequence        INTEGER NOT NULL,
  generated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  generated_by    UUID NOT NULL REFERENCES users(id)
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type            notification_type NOT NULL,
  design_id       UUID REFERENCES designs(id) ON DELETE CASCADE,
  comment_id      UUID REFERENCES comments(id) ON DELETE CASCADE,
  is_read         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PRODUCTION SPECS
-- ============================================================
CREATE TABLE production_specs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  design_id       UUID NOT NULL UNIQUE REFERENCES designs(id) ON DELETE CASCADE,
  sku_id          UUID REFERENCES skus(id),
  retail_price    NUMERIC(10,2),
  estimated_cost  NUMERIC(10,2),
  colorway        TEXT,
  fabric          TEXT,
  material_comp   TEXT,
  size_range      TEXT,
  planned_units   INTEGER,
  intended_market TEXT,
  vendor          TEXT,
  factory         TEXT,
  lead_time_days  INTEGER,
  created_by      UUID REFERENCES users(id),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER production_specs_updated_at
  BEFORE UPDATE ON production_specs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- STORAGE BUCKET
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('design-files', 'design-files', true);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE skus ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_specs ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user role
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT AS $$
  SELECT role::TEXT FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- USERS: all authenticated users can read; only admin can update others
CREATE POLICY "users_read" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "users_update_own" ON users FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "users_admin_all" ON users FOR ALL TO authenticated USING (current_user_role() = 'admin');

-- COLLECTIONS: all can read; designer/admin can insert; owner/admin can update
CREATE POLICY "collections_read" ON collections FOR SELECT TO authenticated USING (true);
CREATE POLICY "collections_insert" ON collections FOR INSERT TO authenticated WITH CHECK (current_user_role() IN ('designer','admin'));
CREATE POLICY "collections_update" ON collections FOR UPDATE TO authenticated USING (created_by = auth.uid() OR current_user_role() = 'admin');

-- DESIGNS: all can read; designer/admin can insert; designer(own)/admin can update
CREATE POLICY "designs_read" ON designs FOR SELECT TO authenticated USING (true);
CREATE POLICY "designs_insert" ON designs FOR INSERT TO authenticated WITH CHECK (current_user_role() IN ('designer','admin'));
CREATE POLICY "designs_update" ON designs FOR UPDATE TO authenticated USING (designer_id = auth.uid() OR current_user_role() = 'admin');

-- DESIGN VERSIONS: all read; designer/admin insert
CREATE POLICY "versions_read" ON design_versions FOR SELECT TO authenticated USING (true);
CREATE POLICY "versions_insert" ON design_versions FOR INSERT TO authenticated WITH CHECK (current_user_role() IN ('designer','admin'));

-- DESIGN FILES: all read; designer/admin insert
CREATE POLICY "files_read" ON design_files FOR SELECT TO authenticated USING (true);
CREATE POLICY "files_insert" ON design_files FOR INSERT TO authenticated WITH CHECK (current_user_role() IN ('designer','admin'));

-- REVIEWS: all read; sales/marketing/admin insert own; own update
CREATE POLICY "reviews_read" ON reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "reviews_insert" ON reviews FOR INSERT TO authenticated WITH CHECK (current_user_role() IN ('sales','marketing','admin'));
CREATE POLICY "reviews_update" ON reviews FOR UPDATE TO authenticated USING (reviewer_id = auth.uid());

-- COMMENTS: all read; all insert; own update
CREATE POLICY "comments_read" ON comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "comments_insert" ON comments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "comments_update" ON comments FOR UPDATE TO authenticated USING (author_id = auth.uid());

-- STATUS HISTORY: all read; authenticated insert; no update/delete (enforced by rules above)
CREATE POLICY "history_read" ON status_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "history_insert" ON status_history FOR INSERT TO authenticated WITH CHECK (true);

-- SKUS: all read; admin insert only; no update by users
CREATE POLICY "skus_read" ON skus FOR SELECT TO authenticated USING (true);
CREATE POLICY "skus_insert" ON skus FOR INSERT TO authenticated WITH CHECK (true);

-- NOTIFICATIONS: users see own only
CREATE POLICY "notifications_own" ON notifications FOR ALL TO authenticated USING (recipient_id = auth.uid());
CREATE POLICY "notifications_insert" ON notifications FOR INSERT TO authenticated WITH CHECK (true);

-- PRODUCTION SPECS: all read; admin/production insert/update
CREATE POLICY "specs_read" ON production_specs FOR SELECT TO authenticated USING (true);
CREATE POLICY "specs_write" ON production_specs FOR ALL TO authenticated USING (current_user_role() IN ('admin','production'));

-- STORAGE: all authenticated can read; designer/admin can upload
CREATE POLICY "storage_read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'design-files');
CREATE POLICY "storage_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'design-files');

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_designs_designer ON designs(designer_id);
CREATE INDEX idx_designs_status ON designs(status);
CREATE INDEX idx_designs_collection ON designs(collection_id);
CREATE INDEX idx_design_files_design ON design_files(design_id);
CREATE INDEX idx_reviews_design ON reviews(design_id);
CREATE INDEX idx_comments_design ON comments(design_id);
CREATE INDEX idx_status_history_design ON status_history(design_id);
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, is_read);
CREATE INDEX idx_skus_category_season ON skus(category_code, season_code);
