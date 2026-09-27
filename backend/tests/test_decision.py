from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_evaluate_interventions():
    """Verify that /api/decision/evaluate returns 3 options and recommends Option C."""
    client.post("/api/simulation/accident", json={"road_id": "ROAD_A", "severity": "HIGH"})

    response = client.get("/api/decision/evaluate")
    assert response.status_code == 200
    data = response.json()

    assert "options" in data
    assert len(data["options"]) == 3

    opt_a = next(o for o in data["options"] if o["id"] == "OPTION_A")
    opt_b = next(o for o in data["options"] if o["id"] == "OPTION_B")
    opt_c = next(o for o in data["options"] if o["id"] == "OPTION_C")

    # Option C must be recommended
    assert opt_c["is_recommended"] is True
    assert data["recommended_option_id"] == "OPTION_C"
    assert opt_c["utility_score"] > opt_b["utility_score"]
    assert opt_c["ambulance_time_min"] < opt_a["ambulance_time_min"]
    assert len(data["why_reasons"]) >= 3


def test_dynamic_slider_evaluation():
    """Verify that shifting traffic sliders dynamically changes all calculated numbers in the table."""
    # Low traffic (60% volume)
    res_low = client.post(
        "/api/decision/evaluate",
        json={
            "traffic_multiplier": 0.6,
            "accident_road_id": "ROAD_A",
            "accident_severity_pct": 100,
            "weather": "clear",
            "industrial_base_aqi": 40,
            "is_accident_active": True
        }
    )
    assert res_low.status_code == 200
    data_low = res_low.json()
    opt_a_low = next(o for o in data_low["options"] if o["id"] == "OPTION_A")

    # High traffic (170% volume)
    res_high = client.post(
        "/api/decision/evaluate",
        json={
            "traffic_multiplier": 1.7,
            "accident_road_id": "ROAD_A",
            "accident_severity_pct": 100,
            "weather": "clear",
            "industrial_base_aqi": 40,
            "is_accident_active": True
        }
    )
    assert res_high.status_code == 200
    data_high = res_high.json()
    opt_a_high = next(o for o in data_high["options"] if o["id"] == "OPTION_A")

    # High traffic MUST produce higher congestion, lower speed, and higher travel times!
    assert opt_a_high["traffic_congestion_pct"] > opt_a_low["traffic_congestion_pct"]
    assert opt_a_high["ambulance_time_min"] > opt_a_low["ambulance_time_min"]
    assert opt_a_high["average_speed_kmh"] < opt_a_low["average_speed_kmh"]


def test_dynamic_simulate_endpoint():
    """Verify /api/simulation/dynamic-simulate applies sliders directly to live city state."""
    res = client.post(
        "/api/simulation/dynamic-simulate",
        json={
            "traffic_multiplier": 1.5,
            "accident_road_id": "ROAD_B",
            "accident_severity_pct": 95,
            "weather": "rain",
            "industrial_base_aqi": 60,
            "is_accident_active": True
        }
    )
    assert res.status_code == 200
    city = res.json()
    # Road B must be blocked
    road_b = next(r for r in city["roads"] if r["id"] == "ROAD_B")
    assert road_b["is_blocked"] is True
    assert road_b["congestion_level"] == "BLOCKED"
    assert city["metrics"]["active_incidents_count"] == 1


def test_apply_intervention():
    """Verify applying Option C updates live city state."""
    response = client.post("/api/decision/apply", json={"option_id": "OPTION_C"})
    assert response.status_code == 200
    city = response.json()
    assert city["metrics"]["emergency_response_time_min"] < 12.0


def test_citizen_report_and_alerts():
    """Verify citizen reporting flow and public alerts."""
    report_res = client.post(
        "/api/citizen/report",
        json={
            "issue_type": "hazard",
            "location_id": "LOC_MARKET",
            "severity": "HIGH",
            "description": "Oil spill near market junction causing wheel slip."
        }
    )
    assert report_res.status_code == 200
    rep_data = report_res.json()
    assert rep_data["status"] == "success"
    assert "CITIZEN_" in rep_data["incident"]["id"]

    alerts_res = client.get("/api/citizen/alerts")
    assert alerts_res.status_code == 200
    alert_data = alerts_res.json()
    assert "citizen_alert" in alert_data
    assert "roadside_vms" in alert_data


def test_what_if_simulation():
    """Verify what-if simulation calculates projected congestion increases under high traffic."""
    response = client.post(
        "/api/simulation/what-if",
        json={
            "traffic_multiplier": 1.4,
            "rainfall_level": "moderate"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["inputs"]["traffic_percentage"] == 140
    assert data["projected"]["traffic_density_pct"] > data["baseline"]["traffic_density_pct"]
    assert data["projected"]["average_speed_kmh"] < data["baseline"]["average_speed_kmh"]
