import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MIGRATION = ROOT / "supabase" / "migrations" / "20261112165935_initial_foodgraph_schema.sql"


class MigrationContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.sql = MIGRATION.read_text(encoding="utf-8").lower()

    def test_migration_is_atomic(self):
        self.assertRegex(self.sql, r"(?m)^begin;\s")
        self.assertTrue(self.sql.rstrip().endswith("commit;"))

    def test_all_canonical_domain_tables_exist(self):
        expected = [
            "users", "user_profiles", "user_privacy_settings", "user_consents",
            "cities", "areas", "area_adjacencies", "restaurants", "restaurant_aliases",
            "restaurant_locations", "cuisines", "restaurant_location_cuisines", "dishes",
            "dish_aliases", "location_dishes", "catalogue_sources", "catalogue_claims",
            "user_preferences", "taste_interactions", "restaurant_comparisons",
            "restaurant_visits", "visit_dishes", "visit_evidence", "user_follows",
            "user_blocks", "taste_circles", "taste_circle_members", "food_lists",
            "food_list_items", "editorial_collections", "editorial_collection_items",
            "taste_profile_snapshots", "user_similarity_snapshots", "recommendation_runs",
            "recommendation_items", "recommendation_feedback", "product_analytics_events",
            "early_access_signups", "catalogue_import_rows",
        ]
        for table in expected:
            with self.subTest(table=table):
                self.assertRegex(self.sql, rf"create table public\.{table}\s*\(")

    def test_rls_is_enabled_for_every_application_table(self):
        self.assertIn("enable row level security", self.sql)
        self.assertIn("'product_analytics_events','early_access_signups','catalogue_import_rows'", self.sql)

    def test_private_defaults_and_no_public_private_data_grants(self):
        self.assertIn("profile_visibility text not null default 'private'", self.sql)
        self.assertIn("diary_visibility text not null default 'private'", self.sql)
        self.assertIn("visits_visibility text not null default 'private'", self.sql)
        self.assertNotRegex(self.sql, r"grant\s+select\s+on\s+public\.(users|restaurant_visits|taste_interactions)\s+to\s+anon")

    def test_single_target_and_idempotency_constraints_exist(self):
        self.assertIn("num_nonnulls(restaurant_location_id,dish_id,cuisine_id) = 1", self.sql)
        self.assertIn("taste_interactions_idempotency_uidx", self.sql)
        self.assertIn("restaurant_visits_idempotency_uidx", self.sql)
        self.assertIn("unique (source_file,source_row_number)", self.sql)

    def test_duplicate_and_relationship_guards_exist(self):
        self.assertIn("check (first_location_id <> second_location_id)", self.sql)
        self.assertIn("one_primary_cuisine_per_location_uidx", self.sql)
        self.assertIn("restaurant_locations_external_place_uidx", self.sql)
        self.assertIn("email_normalized text not null unique", self.sql)

    def test_auth_bootstrap_and_unreviewed_catalogue_are_private(self):
        self.assertIn("insert into public.user_profiles (user_id)", self.sql)
        self.assertIn("insert into public.user_privacy_settings (user_id)", self.sql)
        self.assertIn("using (status='active')", self.sql)


    def test_canonical_domain_fields_are_present(self):
        canonical = (ROOT / "supabase" / "migrations" / "20261112174902_complete_canonical_schema_fields.sql").read_text(encoding="utf-8")
        for token in ["profile_version", "feature_vector", "quality_state", "user_a_id", "user_b_id",
                      "similarity_score", "eligible_for_discovery", "other_location_id", "time_precision",
                      "visit_source", "verification_status", "feedback_type", "score_components",
                      "evidence_summary", "visit_session_id", "consent_state", "editorial_collections_city_status_idx"]:
            with self.subTest(token=token):
                self.assertIn(token, canonical)

    def test_scoped_client_and_service_role_grants(self):
        grants = (ROOT / "supabase" / "migrations" / "20261112174905_grant_scoped_api_privileges.sql").read_text(encoding="utf-8").lower()
        self.assertIn("grant select, insert, update, delete on", grants)
        self.assertIn("grant all privileges on all tables in schema public to service_role", grants)
        self.assertNotIn("grant all privileges on all tables in schema public to anon", grants)

    def test_no_destructive_statements(self):
        self.assertNotRegex(self.sql, r"\bdrop\s+(table|schema|database)\b")
        self.assertNotIn("truncate ", self.sql)


if __name__ == "__main__":
    unittest.main()
