from fastapi.testclient import TestClient
from app.main import app
from app.simulation.matlab_bridge import calculate_traffic_flow, calculate_emissions_aqi

client = TestClient(app)


def test_city_state_endpoint():
    """Verify that /api/city/state returns the full topology with 8 locations and 18 roads."""
    response = client.get("/api/city/state")
    assert response.status_code == 200
    data = response.json()
    
    assert len(data["locations"]) == 8
    assert len(data["roads"]) == 18
    assert len(data["nodes"]) == 9
    assert len(data["emergency_vehicles"]) >= 1
    
    # Verify key landmarks
    location_ids = [loc["id"] for loc in data["locations"]]
    assert "LOC_HOSPITAL" in location_ids
    assert "LOC_STATION" in location_ids
    assert "LOC_JUNCTION" in location_ids
    
    # Verify summary metrics
    metrics = data["metrics"]
    assert metrics["total_vehicles_active"] > 0
    assert metrics["city_aqi"] > 0
    assert metrics["emergency_response_time_min"] > 0


def test_simulation_specs_endpoint():
    """Verify that /api/city/simulation-specs exposes MATLAB/Simulink model definitions."""
    response = client.get("/api/city/simulation-specs")
    assert response.status_code == 200
    data = response.json()
    assert "MATLAB" in data["framework"]
    assert "simulink_blocks" in data
    assert len(data["simulink_blocks"]) >= 5


def test_matlab_bridge_mathematics():
    """Verify that the Python MATLAB bridge computes deterministic Greenshields & BPR values."""
    # Test free-flow conditions
    flow = calculate_traffic_flow(
        vehicle_count=300,
        capacity=1000,
        length_km=2.0,
        free_flow_speed=50.0,
        is_blocked=False
    )
    assert flow["density"] == 0.3
    assert flow["congestion_level"] == "LOW"
    assert flow["speed_kmh"] > 35.0
    assert flow["travel_time_min"] > 0.0

    # Test blocked road
    blocked = calculate_traffic_flow(
        vehicle_count=300,
        capacity=1000,
        length_km=2.0,
        free_flow_speed=50.0,
        is_blocked=True
    )
    assert blocked["congestion_level"] == "BLOCKED"
    assert blocked["is_blocked"] is True
    assert blocked["travel_time_min"] == 999.0

    # Test environmental emissions
    emissions = calculate_emissions_aqi(
        vehicle_count=500,
        average_speed=40.0,
        length_km=2.0,
        density=0.5
    )
    assert emissions["aqi"] >= 45
    assert emissions["co2_kg_hr"] > 0
    assert emissions["nox_g_hr"] > 0
