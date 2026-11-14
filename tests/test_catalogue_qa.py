import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from audit_catalogue import build_report, candidate_review_state, normalize_identity, source_url_kind


class CatalogueAuditHelpersTest(unittest.TestCase):
    def test_normalize_identity_is_unicode_aware_and_punctuation_insensitive(self):
        self.assertEqual(normalize_identity("  Café Vanah (वन:) "), "cafevanahवन")
        self.assertEqual(normalize_identity("Le Plaisir - Pune"), "leplaisirpune")

    def test_google_maps_search_url_is_not_treated_as_a_direct_place_record(self):
        url = "https://www.google.com/maps/search/?api=1&query=Le+Plaisir+Pune"
        self.assertEqual(source_url_kind(url), "maps_search_pointer")

    def test_direct_directory_url_still_requires_evidence_review(self):
        self.assertEqual(
            source_url_kind("https://www.district.in/dining/pune/cafe-vanah-aundh"),
            "url_requires_review",
        )

    def test_missing_url_requires_source_discovery(self):
        self.assertEqual(candidate_review_state(False), "source_discovery_required")

    def test_url_does_not_bypass_identity_review(self):
        self.assertEqual(
            candidate_review_state(True, possible_identity_collision=True),
            "identity_review_required",
        )

    def test_source_link_means_review_not_activation(self):
        self.assertEqual(candidate_review_state(True), "evidence_review_required")

    def test_report_marks_candidates_without_claims(self):
        snapshot = {
            "candidates": [{
                "restaurant_id": "restaurant-1",
                "location_id": "location-1",
                "canonical_name": "Example Cafe",
                "brand_name": None,
                "description": None,
                "restaurant_status": "needs_review",
                "location_name": "Example Cafe",
                "address_text": None,
                "latitude": None,
                "longitude": None,
                "maps_provider": None,
                "maps_place_id": None,
                "price_min": None,
                "price_max": None,
                "location_status": "unverified",
                "area": "Aundh",
                "city": "Pune",
            }],
            "claims": [],
            "sources": [],
            "cuisine_links": [],
            "import_rows": [],
        }
        report = build_report(snapshot)
        candidate = report["candidates"][0]
        self.assertIn("no_catalogue_claims", candidate["flags"])
        self.assertEqual(candidate["review_state"], "source_discovery_required")
        self.assertEqual(report["summary"]["locations_without_claims"], 1)
        self.assertEqual(report["summary"]["locations_without_source_url"], 1)


if __name__ == "__main__":
    unittest.main()
