from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_endpoint():
    """Verify that the root endpoint responds with status 200 and docs link."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "documentation" in data
    assert data["health"] == "/api/health"


def test_health_check_endpoint():
    """Verify that /api/health responds with expected status and modules."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert data["system"] == "CITYTWIN"
    assert data["city_status"] == "CITY SYSTEM ONLINE"
    assert "modules" in data
    assert data["modules"]["traffic_mobility"] == "initialized"
    assert data["modules"]["emergency_response"] == "initialized"
    assert data["modules"]["environmental_monitoring"] == "initialized"
    assert data["modules"]["citizen_engagement"] == "initialized"
