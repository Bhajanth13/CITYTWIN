from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_normal_routing():
    """Under normal conditions, shortest path from Center to Hospital is via ROAD_A."""
    # Reset first to guarantee clean baseline
    client.post("/api/simulation/clear")
    
    response = client.post(
        "/api/routing/calculate",
        json={
            "start_node": "NODE_CENTER",
            "end_node": "NODE_HOSPITAL",
            "weight_mode": "time",
            "emergency_priority": False
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["found"] is True
    assert "ROAD_A" in data["road_ids"]
    assert data["total_distance_km"] == 2.2


def test_accident_simulation_and_rerouting():
    """Simulating an accident on ROAD_A blocks it, spills traffic, and reroutes ambulance."""
    # 1. Trigger accident
    acc_response = client.post("/api/simulation/accident", json={"road_id": "ROAD_A", "severity": "HIGH"})
    assert acc_response.status_code == 200
    city = acc_response.json()
    
    # Verify active incident
    assert len(city["incidents"]) >= 1
    assert city["incidents"][0]["affected_road_id"] == "ROAD_A"
    assert city["metrics"]["active_incidents_count"] >= 1
    
    # Verify ROAD_A is blocked
    road_a = next(r for r in city["roads"] if r["id"] == "ROAD_A")
    assert road_a["is_blocked"] is True
    assert road_a["congestion_level"] == "BLOCKED"
    
    # Verify spillover roads received extra vehicles
    road_b = next(r for r in city["roads"] if r["id"] == "ROAD_B")
    assert road_b["vehicle_count"] > 350  # baseline was 350
    
    # 2. Test Dijkstra routing when ROAD_A is blocked
    route_response = client.post(
        "/api/routing/calculate",
        json={
            "start_node": "NODE_CENTER",
            "end_node": "NODE_HOSPITAL",
            "weight_mode": "time",
            "emergency_priority": False
        }
    )
    assert route_response.status_code == 200
    route_data = route_response.json()
    assert route_data["found"] is True
    # ROAD_A must be avoided!
    assert "ROAD_A" not in route_data["road_ids"]
    
    # 3. Verify emergency ambulance response adapts
    amb_response = client.post("/api/routing/emergency", json={"priority": False})
    assert amb_response.status_code == 200
    amb_data = amb_response.json()
    assert amb_data["found"] is True
    assert "ROAD_A" not in amb_data["road_ids"]


def test_clear_simulation():
    """Clearing the simulation restores baseline flow and resets blockage."""
    response = client.post("/api/simulation/clear")
    assert response.status_code == 200
    city = response.json()
    
    assert city["metrics"]["active_incidents_count"] == 0
    assert len(city["incidents"]) == 0
    road_a = next(r for r in city["roads"] if r["id"] == "ROAD_A")
    assert road_a["is_blocked"] is False
    assert road_a["congestion_level"] != "BLOCKED"
