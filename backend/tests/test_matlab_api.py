"""Tests for MATLAB Simulation Specs & Telemetry API endpoints."""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_simulation_specs_endpoint():
    """Verify MATLAB / Simulink simulation specifications endpoint."""
    response = client.get("/api/city/simulation-specs")
    assert response.status_code == 200
    data = response.json()
    assert "MATLAB & Simulink" in data["framework"]
    assert "Theme 2: Smart City 2030" in data["theme"]
    assert len(data["matlab_scripts"]) >= 5
    assert len(data["simulink_blocks"]) >= 5


def test_matlab_telemetry_endpoint():
    """Verify MATLAB telemetry API returns valid numerical metrics."""
    response = client.get("/api/city/matlab-telemetry")
    assert response.status_code == 200
    data = response.json()
    # Either seed telemetry or live export
    if "simulink" in data:
        assert data["simulink"]["final_closed_loop_density"] < data["simulink"]["final_open_loop_density"]
        assert data["emergency_routing"]["eta_optC_greenwave_min"] < data["emergency_routing"]["eta_incident_detour_min"]
        assert data["environmental"]["peak_aqi_option_c"] < data["environmental"]["peak_aqi_incident"]
    else:
        assert "metrics" in data
