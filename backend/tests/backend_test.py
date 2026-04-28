"""HydroTent backend API tests."""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://hydro-plant-hub.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="session")
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ==================== PLANT CATALOG (v2: 6 plants with images) ====================
class TestPlantCatalog:
    def test_get_catalog(self, api_client):
        r = api_client.get(f"{API}/plants/catalog")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) == 6, f"Expected exactly 6 plants in catalog, got {len(data)}"
        ids = {p["id"] for p in data}
        expected_ids = {"lettuce", "basil", "tomato", "strawberry", "mint", "spinach"}
        assert ids == expected_ids, f"Catalog ids mismatch. Got {ids}, expected {expected_ids}"
        for p in data:
            assert {"id", "name", "days_to_harvest", "category", "image"}.issubset(p.keys())
            assert isinstance(p["image"], str) and p["image"].startswith("http"), f"Plant {p['id']} missing image URL"


# ==================== PLANTS CRUD ====================
class TestPlants:
    plant_id = None

    def test_create_plant(self, api_client):
        r = api_client.post(f"{API}/plants", json={"catalog_id": "lettuce", "nickname": "TEST_Lettuce"})
        assert r.status_code == 200
        data = r.json()
        assert data["catalog_id"] == "lettuce"
        assert data["nickname"] == "TEST_Lettuce"
        assert data["name"] == "Lettuce"
        assert data["status"] == "growing"
        assert "id" in data
        # v2: image field must be present
        assert "image" in data and data["image"].startswith("http"), "Plant create response missing image URL"
        TestPlants.plant_id = data["id"]

    def test_max_plants_limit(self, api_client):
        """v2: MAX_PLANTS=6 enforcement. Fill tent to 6 then expect 400."""
        # First, find current growing count
        existing = api_client.get(f"{API}/plants").json()
        growing = [p for p in existing if p.get("status") == "growing"]
        created_ids = []
        catalog_ids = ["lettuce", "basil", "tomato", "strawberry", "mint", "spinach"]
        idx = 0
        try:
            while len(growing) + len(created_ids) < 6 and idx < len(catalog_ids):
                r = api_client.post(f"{API}/plants", json={
                    "catalog_id": catalog_ids[idx],
                    "nickname": f"TEST_Max{idx}"
                })
                idx += 1
                if r.status_code == 200:
                    created_ids.append(r.json()["id"])
                elif r.status_code == 400:
                    # Already at limit, that's the test's purpose
                    break
            # Now attempt to add a 7th — should fail with 400
            r = api_client.post(f"{API}/plants", json={"catalog_id": "spinach", "nickname": "TEST_Overflow"})
            assert r.status_code == 400, f"Expected 400 when exceeding 6 plants, got {r.status_code}: {r.text}"
            detail = r.json().get("detail", "")
            assert "6" in detail or "Maximum" in detail or "max" in detail.lower()
        finally:
            for pid in created_ids:
                api_client.delete(f"{API}/plants/{pid}")

    def test_create_plant_invalid_catalog(self, api_client):
        r = api_client.post(f"{API}/plants", json={"catalog_id": "nonexistent"})
        assert r.status_code == 404

    def test_create_duplicate_plant_type_allowed(self, api_client):
        """v3: Allow adding multiples of the same plant type."""
        # Free slots: temporarily delete TestPlants.plant_id (created in test_create_plant)
        freed = []
        if TestPlants.plant_id:
            r = api_client.delete(f"{API}/plants/{TestPlants.plant_id}")
            if r.status_code == 200:
                freed.append(TestPlants.plant_id)
                TestPlants.plant_id = None

        ids = []
        try:
            plants = api_client.get(f"{API}/plants").json()
            growing = [p for p in plants if p.get("status") == "growing"]
            if len(growing) > 4:
                pytest.skip(f"Need >=2 free slots; only {6 - len(growing)} free")
            for i in range(2):
                r = api_client.post(f"{API}/plants", json={"catalog_id": "basil", "nickname": f"TEST_DupBasil{i}"})
                assert r.status_code == 200, f"duplicate basil add failed: {r.status_code} {r.text}"
                assert r.json()["catalog_id"] == "basil"
                ids.append(r.json()["id"])
            plants = api_client.get(f"{API}/plants").json()
            present = [p for p in plants if p["id"] in ids and p["status"] == "growing"]
            assert len(present) == 2, "Both duplicate basils should be growing"
        finally:
            for pid in ids:
                api_client.delete(f"{API}/plants/{pid}")
            if freed and TestPlants.plant_id is None:
                r = api_client.post(f"{API}/plants", json={"catalog_id": "lettuce", "nickname": "TEST_Lettuce"})
                if r.status_code == 200:
                    TestPlants.plant_id = r.json()["id"]

    def test_get_plants(self, api_client):
        r = api_client.get(f"{API}/plants")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert any(p["id"] == TestPlants.plant_id for p in data)

    def test_harvest_plant(self, api_client):
        # Reuse the plant created in test_create_plant to avoid hitting MAX_PLANTS
        # We'll create a separate plant for harvest, but first free up a slot if needed
        plants = api_client.get(f"{API}/plants").json()
        growing = [p for p in plants if p.get("status") == "growing"]
        # If at capacity, harvest TestPlants.plant_id directly
        if len(growing) >= 6:
            assert TestPlants.plant_id is not None
            # Re-fetch and harvest the test plant
            r = api_client.put(f"{API}/plants/{TestPlants.plant_id}/harvest")
            assert r.status_code == 200, r.text
            data = r.json()
            assert data["status"] == "harvested"
            # Recreate a plant for downstream test_delete_plant
            r2 = api_client.post(f"{API}/plants", json={"catalog_id": "lettuce", "nickname": "TEST_Lettuce2"})
            if r2.status_code == 200:
                TestPlants.plant_id = r2.json()["id"]
            return

        r = api_client.post(f"{API}/plants", json={"catalog_id": "basil", "nickname": "TEST_HarvestBasil"})
        assert r.status_code == 200, r.text
        pid = r.json()["id"]

        r = api_client.put(f"{API}/plants/{pid}/harvest")
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "harvested"

        # Verify it appears in community feed
        r = api_client.get(f"{API}/community/feed")
        assert r.status_code == 200
        feed = r.json()
        assert any(e.get("nickname") == "TEST_HarvestBasil" for e in feed)
        # Cleanup the harvested plant
        api_client.delete(f"{API}/plants/{pid}")

    def test_harvest_nonexistent(self, api_client):
        r = api_client.put(f"{API}/plants/does-not-exist/harvest")
        assert r.status_code == 404

    def test_delete_plant(self, api_client):
        assert TestPlants.plant_id is not None
        r = api_client.delete(f"{API}/plants/{TestPlants.plant_id}")
        assert r.status_code == 200
        # Verify removed
        r = api_client.get(f"{API}/plants")
        assert not any(p["id"] == TestPlants.plant_id for p in r.json())

    def test_delete_nonexistent(self, api_client):
        r = api_client.delete(f"{API}/plants/nonexistent-id-xyz")
        assert r.status_code == 404


# ==================== TENT STATUS ====================
class TestTent:
    def test_get_status(self, api_client):
        r = api_client.get(f"{API}/tent/status")
        assert r.status_code == 200
        data = r.json()
        # v3 fields: light_on (bool), fan_on (bool), ph_pump_level (int)
        for k in ["temperature", "humidity", "water_level", "nutrient_level", "ph_level", "light_on", "fan_on", "ph_pump_level"]:
            assert k in data, f"missing field {k} in tent status"
        assert isinstance(data["light_on"], bool)
        assert isinstance(data["fan_on"], bool)
        assert isinstance(data["ph_pump_level"], int)

    def test_update_status(self, api_client):
        payload = {
            "temperature": 24.0, "humidity": 70.0, "water_level": 80.0,
            "nutrient_level": 65.0, "ph_level": 6.5,
            "light_on": False, "fan_on": True, "ph_pump_level": 4,
        }
        r = api_client.put(f"{API}/tent/status", json=payload)
        assert r.status_code == 200
        # Verify persisted
        r = api_client.get(f"{API}/tent/status")
        data = r.json()
        assert data["temperature"] == 24.0
        assert data["light_on"] is False
        assert data["fan_on"] is True
        assert data["ph_pump_level"] == 4

        # Toggle light_on to true and verify
        payload["light_on"] = True
        payload["ph_pump_level"] = 2
        r = api_client.put(f"{API}/tent/status", json=payload)
        assert r.status_code == 200
        data = r.json()
        assert data["light_on"] is True
        assert data["ph_pump_level"] == 2


# ==================== NOTIFICATIONS ====================
class TestNotifications:
    def test_get_notifications(self, api_client):
        r = api_client.get(f"{API}/notifications")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_check_notifications_low_water(self, api_client):
        # Cleanup pre-existing low_water/low_nutrients to ensure dedup test is meaningful
        # Force low water + low nutrients
        api_client.put(f"{API}/tent/status", json={
            "temperature": 22.0, "humidity": 60.0, "water_level": 10.0,
            "nutrient_level": 15.0, "ph_level": 6.2,
            "light_on": True, "fan_on": True, "ph_pump_level": 3,
        })
        # Mark all existing low_water/low_nutrients as read so we get a clean slate
        existing = api_client.get(f"{API}/notifications").json()
        for n in existing:
            if n["type"] in ("low_water", "low_nutrients") and not n.get("read"):
                api_client.put(f"{API}/notifications/{n['id']}/read")

        # First check creates new notifications
        r1 = api_client.post(f"{API}/notifications/check")
        assert r1.status_code == 200
        types1 = {n["type"] for n in r1.json()["new_notifications"]}
        # Either or both should be created
        assert types1 & {"low_water", "low_nutrients"}, f"Expected low_water/low_nutrients in {types1}"

        # v3 dedup: second check should NOT create low_water/low_nutrients again
        r2 = api_client.post(f"{API}/notifications/check")
        assert r2.status_code == 200
        types2 = {n["type"] for n in r2.json()["new_notifications"]}
        assert "low_water" not in types2, "low_water duplicate created (dedup broken)"
        assert "low_nutrients" not in types2, "low_nutrients duplicate created (dedup broken)"

        # Restore
        api_client.put(f"{API}/tent/status", json={
            "temperature": 22.5, "humidity": 65.0, "water_level": 75.0,
            "nutrient_level": 60.0, "ph_level": 6.2,
            "light_on": True, "fan_on": True, "ph_pump_level": 3,
        })


# ==================== AI CHAT ====================
class TestAIChat:
    def test_ai_chat_claude(self, api_client):
        r = api_client.post(f"{API}/ai/chat", json={"message": "What pH is best for lettuce?", "model": "claude"}, timeout=90)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "answer" in data and len(data["answer"]) > 10
        assert data["question"] == "What pH is best for lettuce?"
        assert data["model"] == "claude"


# ==================== TUTORIALS ====================
class TestTutorials:
    tut_id = None

    def test_create_tutorial(self, api_client):
        r = api_client.post(f"{API}/tutorials", json={
            "title": "TEST_Basil Tutorial",
            "description": "How to grow basil",
            "youtube_url": "https://youtube.com/watch?v=abc123",
            "plant_type": "basil"
        })
        assert r.status_code == 200
        data = r.json()
        assert data["title"] == "TEST_Basil Tutorial"
        assert data["youtube_url"] == "https://youtube.com/watch?v=abc123"
        assert data["is_deleted"] is False
        TestTutorials.tut_id = data["id"]

    def test_get_tutorials(self, api_client):
        r = api_client.get(f"{API}/tutorials")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert any(t["id"] == TestTutorials.tut_id for t in data)

    def test_delete_tutorial(self, api_client):
        assert TestTutorials.tut_id
        r = api_client.delete(f"{API}/tutorials/{TestTutorials.tut_id}")
        assert r.status_code == 200
        r = api_client.get(f"{API}/tutorials")
        assert not any(t["id"] == TestTutorials.tut_id for t in r.json())


# ==================== COMMUNITY ====================
class TestCommunity:
    def test_get_feed(self, api_client):
        r = api_client.get(f"{API}/community/feed")
        assert r.status_code == 200
        assert isinstance(r.json(), list)
