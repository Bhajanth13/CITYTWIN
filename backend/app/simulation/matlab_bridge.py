"""
CITYTWIN — MATLAB & Simulink Mathematical Bridge
Implements the exact equations from matlab/traffic_flow_model.m and matlab/emissions_aqi_model.m
to guarantee 100% equivalence between MATLAB/Simulink and the Python/React platform.
"""

from typing import Tuple, Dict, Any


def calculate_traffic_flow(
    vehicle_count: int,
    capacity: int,
    length_km: float,
    free_flow_speed: float,
    is_blocked: bool = False
) -> Dict[str, Any]:
    """
    Computes speed, travel time, and congestion status using the Greenshields & BPR equations.
    Direct port of matlab/traffic_flow_model.m.
    """
    if is_blocked:
        return {
            "density": 1.0,
            "speed_kmh": 5.0,
            "travel_time_min": 999.0,
            "congestion_level": "BLOCKED",
            "is_blocked": True
        }

    # 1. Density ratio (rho = V / C)
    density = vehicle_count / max(capacity, 1)

    # 2. Greenshields Speed-Density curve
    gamma = 1.2
    speed_factor = max(0.12, 1.0 - (min(density, 1.2) / 1.2) ** gamma)
    speed = free_flow_speed * speed_factor
    speed = max(speed, 8.0)  # speed floor

    # 3. Bureau of Public Roads (BPR) travel time
    alpha = 0.20
    beta = 3.5
    free_flow_time_min = (length_km / free_flow_speed) * 60.0
    travel_time_min = free_flow_time_min * (1.0 + alpha * (density ** beta))

    # 4. Congestion classification
    if density < 0.40:
        congestion_level = "LOW"
    elif density < 0.70:
        congestion_level = "MODERATE"
    elif density < 0.90:
        congestion_level = "HIGH"
    else:
        congestion_level = "SEVERE"

    return {
        "density": round(density, 3),
        "speed_kmh": round(speed, 1),
        "travel_time_min": round(travel_time_min, 2),
        "congestion_level": congestion_level,
        "is_blocked": False
    }


def calculate_emissions_aqi(
    vehicle_count: int,
    average_speed: float,
    length_km: float,
    density: float
) -> Dict[str, Any]:
    """
    Computes emissions (CO2, NOx, PM2.5) and simulated AQI.
    Direct port of matlab/emissions_aqi_model.m.
    """
    vkt = vehicle_count * length_km

    # Speed-dependent emission multiplier
    if average_speed >= 45.0:
        speed_factor = 1.0
    elif average_speed >= 30.0:
        speed_factor = 1.35
    elif average_speed >= 15.0:
        speed_factor = 2.10
    else:
        speed_factor = 3.20

    co2_base = 0.160   # kg CO2 / veh-km
    nox_base = 0.450   # g NOx / veh-km
    pm25_base = 0.035  # g PM2.5 / veh-km

    co2_kg_hr = vkt * co2_base * speed_factor
    nox_g_hr = vkt * nox_base * speed_factor
    pm25_g_hr = vkt * pm25_base * speed_factor

    # AQI calculation
    ambient_baseline = 45.0
    aqi_impact = (density * 55.0) * (speed_factor ** 0.8)
    aqi = round(ambient_baseline + aqi_impact)

    if aqi <= 50:
        category = "Good"
    elif aqi <= 100:
        category = "Moderate"
    elif aqi <= 150:
        category = "Unhealthy for Sensitive Groups"
    elif aqi <= 200:
        category = "Unhealthy"
    else:
        category = "Severe / Hazardous"

    return {
        "aqi": aqi,
        "aqi_category": category,
        "co2_kg_hr": round(co2_kg_hr, 2),
        "nox_g_hr": round(nox_g_hr, 2),
        "pm25_g_hr": round(pm25_g_hr, 2),
        "speed_emission_factor": speed_factor
    }
