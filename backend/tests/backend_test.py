"""HydroTent backend API tests (v5)."""
import io
import os
import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="session")
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ==================== PLANT CATALOG ====================
class TestPlantCatalog:
    def test_get_catalog(self, api_client):
        r = api_client.get(f"{API}/plants/catalog")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) == 6
        ids = {p["id"] for p in data}
        assert ids == {"lettuce", "basil", "tomato", "strawberry", "mint", "spinach"}
        for p in data:
            assert {"id", "name", "days_to_harvest", "category", "image"}.issubset(p.keys())
            assert p["image"].startswith("http")


# ==================== PLANTS CRUD (v5: no MAX_PLANTS limit) ====================
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
        assert data["image"].startswith("http")
        TestPlants.plant_id = data["id"]

    def test_no_max_plants_limit(self, api_client):
        """v5: MAX_PLANTS limit removed. Adding many plants should all succeed."""
        created = []
        catalog_ids = ["lettuce", "basil", "tomato", "strawberry", "mint", "spinach", "lettuce", "basil"]
        try:
            for i, cid in enumerate(catalog_ids):
                r = api_client.post(f"{API}/plants", json={"catalog_id": cid, "nickname": f"TEST_NoLimit{i}"})
                assert r.status_code == 200, f"Plant #{i} ({cid}) failed: {r.status_code} {r.text}"
                created.append(r.json()["id"])
            # All 8 should be present
            plants = api_client.get(f"{API}/plants").json()
            ids = {p["id"] for p in plants}
            for pid in created:
                assert pid in ids
        finally:
            for pid in created:
                api_client.delete(f"{API}/plants/{pid}")

    def test_create_plant_invalid_catalog(self, api_client):
        r = api_client.post(f"{API}/plants", json={"catalog_id": "nonexistent"})
        assert r.status_code == 404

    def test_get_plants(self, api_client):
        r = api_client.get(f"{API}/plants")
        assert r.status_code == 200
        assert any(p["id"] == TestPlants.plant_id for p in r.json())

    def test_harvest_plant(self, api_client):
        r = api_client.post(f"{API}/plants", json={"catalog_id": "basil", "nickname": "TEST_HarvestBasil_v5"})
        assert r.status_code == 200
        pid = r.json()["id"]
        r = api_client.put(f"{API}/plants/{pid}/harvest")
        assert r.status_code == 200
        assert r.json()["status"] == "harvested"
        # Verify in feed
        feed = api_client.get(f"{API}/community/feed").json()
        assert any(e.get("nickname") == "TEST_HarvestBasil_v5" for e in feed)
        api_client.delete(f"{API}/plants/{pid}")

    def test_harvest_nonexistent(self, api_client):
        r = api_client.put(f"{API}/plants/does-not-exist/harvest")
        assert r.status_code == 404

    def test_delete_plant(self, api_client):
        assert TestPlants.plant_id
        r = api_client.delete(f"{API}/plants/{TestPlants.plant_id}")
        assert r.status_code == 200
        plants = api_client.get(f"{API}/plants").json()
        assert not any(p["id"] == TestPlants.plant_id for p in plants)

    def test_delete_nonexistent(self, api_client):
        r = api_client.delete(f"{API}/plants/nonexistent-xyz")
        assert r.status_code == 404


# ==================== TENT STATUS (v5: ec_level, light_lux, water_flow) ====================
class TestTent:
    def test_get_status_v5_fields(self, api_client):
        r = api_client.get(f"{API}/tent/status")
        assert r.status_code == 200
        data = r.json()
        for k in ["temperature", "humidity", "water_level", "nutrient_level",
                  "ph_level", "light_on", "fan_on", "ph_pump_level",
                  "ec_level", "light_lux", "water_flow"]:
            assert k in data, f"missing field {k}"
        assert isinstance(data["light_on"], bool)
        assert isinstance(data["fan_on"], bool)
        assert isinstance(data["ph_pump_level"], int)
        assert isinstance(data["ec_level"], (int, float))
        assert isinstance(data["light_lux"], int)
        assert isinstance(data["water_flow"], (int, float))

    def test_update_status_v5(self, api_client):
        payload = {
            "temperature": 24.0, "humidity": 70.0, "water_level": 80.0,
            "nutrient_level": 65.0, "ph_level": 6.5,
            "light_on": False, "fan_on": True, "ph_pump_level": 4,
            "ec_level": 2.10, "light_lux": 720, "water_flow": 1.8,
        }
        r = api_client.put(f"{API}/tent/status", json=payload)
        assert r.status_code == 200
        data = r.json()
        assert data["ec_level"] == 2.10
        assert data["light_lux"] == 720
        assert data["water_flow"] == 1.8

        # Restore
        api_client.put(f"{API}/tent/status", json={
            "temperature": 22.5, "humidity": 65.0, "water_level": 75.0,
            "nutrient_level": 60.0, "ph_level": 6.2,
            "light_on": True, "fan_on": True, "ph_pump_level": 3,
            "ec_level": 1.75, "light_lux": 639, "water_flow": 1.2,
        })


# ==================== NOTIFICATIONS ====================
class TestNotifications:
    def test_get_notifications(self, api_client):
        r = api_client.get(f"{API}/notifications")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_check_notifications_dedup(self, api_client):
        # Force low water+nutrients
        api_client.put(f"{API}/tent/status", json={
            "temperature": 22.0, "humidity": 60.0, "water_level": 10.0,
            "nutrient_level": 15.0, "ph_level": 6.2,
            "light_on": True, "fan_on": True, "ph_pump_level": 3,
            "ec_level": 1.75, "light_lux": 639, "water_flow": 1.2,
        })
        # Mark existing as read for clean state
        existing = api_client.get(f"{API}/notifications").json()
        for n in existing:
            if n["type"] in ("low_water", "low_nutrients") and not n.get("read"):
                api_client.put(f"{API}/notifications/{n['id']}/read")

        r1 = api_client.post(f"{API}/notifications/check")
        assert r1.status_code == 200
        types1 = {n["type"] for n in r1.json()["new_notifications"]}
        assert types1 & {"low_water", "low_nutrients"}

        r2 = api_client.post(f"{API}/notifications/check")
        types2 = {n["type"] for n in r2.json()["new_notifications"]}
        assert "low_water" not in types2
        assert "low_nutrients" not in types2

        # Restore
        api_client.put(f"{API}/tent/status", json={
            "temperature": 22.5, "humidity": 65.0, "water_level": 75.0,
            "nutrient_level": 60.0, "ph_level": 6.2,
            "light_on": True, "fan_on": True, "ph_pump_level": 3,
            "ec_level": 1.75, "light_lux": 639, "water_flow": 1.2,
        })


# ==================== AI CHAT ====================
class TestAIChat:
    def test_ai_chat_claude(self, api_client):
        r = api_client.post(f"{API}/ai/chat",
                            json={"message": "What pH is best for lettuce?", "model": "claude"},
                            timeout=90)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "answer" in data and len(data["answer"]) > 10
        assert data["model"] == "claude"


# ==================== TUTORIALS ====================
class TestTutorials:
    tut_id = None

    def test_create_tutorial(self, api_client):
        r = api_client.post(f"{API}/tutorials", json={
            "title": "TEST_Tut_v5", "description": "x",
            "youtube_url": "https://youtube.com/watch?v=abc", "plant_type": "basil"
        })
        assert r.status_code == 200
        TestTutorials.tut_id = r.json()["id"]

    def test_get_tutorials(self, api_client):
        r = api_client.get(f"{API}/tutorials")
        assert r.status_code == 200
        assert any(t["id"] == TestTutorials.tut_id for t in r.json())

    def test_delete_tutorial(self, api_client):
        r = api_client.delete(f"{API}/tutorials/{TestTutorials.tut_id}")
        assert r.status_code == 200


# ==================== COMMUNITY (v5: media upload & retrieval) ====================
def _tiny_png():
    # 1x1 transparent PNG
    return bytes.fromhex(
        "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c489"
        "0000000d49444154789c6300010000000500010d0a2db40000000049454e44ae426082"
    )


class TestCommunity:
    media_path = None

    def test_get_feed(self, api_client):
        r = api_client.get(f"{API}/community/feed")
        assert r.status_code == 200
        feed = r.json()
        assert isinstance(feed, list)
        # v5: items have type & media_path fields where applicable
        for item in feed:
            # type may be 'harvest' or 'media'
            if "type" in item:
                assert item["type"] in ("harvest", "media")

    def test_community_post_image_upload(self):
        """v5: POST /api/community/post uploads photo/video to object storage."""
        png = _tiny_png()
        files = {"file": ("test.png", io.BytesIO(png), "image/png")}
        data = {"caption": "TEST_Community_Post_v5"}
        r = requests.post(f"{API}/community/post", files=files, data=data, timeout=60)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["type"] == "media"
        assert body["media_path"]
        assert body["media_path"].startswith("hydrotent/community/")
        assert body["media_type"] == "image/png"
        assert body["notes"] == "TEST_Community_Post_v5"
        TestCommunity.media_path = body["media_path"]

        # Verify it appears in feed
        feed = requests.get(f"{API}/community/feed", timeout=30).json()
        assert any(i.get("media_path") == TestCommunity.media_path for i in feed)

    def test_community_post_invalid_type(self):
        files = {"file": ("test.txt", io.BytesIO(b"hello"), "text/plain")}
        r = requests.post(f"{API}/community/post", files=files, data={"caption": "x"}, timeout=30)
        assert r.status_code == 400

    def test_community_media_retrieve(self):
        """v5: GET /api/community/media/{path} serves uploaded media."""
        assert TestCommunity.media_path, "Upload test must run first"
        r = requests.get(f"{API}/community/media/{TestCommunity.media_path}", timeout=60)
        assert r.status_code == 200, r.text
        assert r.headers.get("Content-Type", "").startswith("image/")
        assert len(r.content) > 0

    def test_community_media_404(self):
        r = requests.get(f"{API}/community/media/hydrotent/community/does-not-exist.png", timeout=30)
        assert r.status_code == 404
