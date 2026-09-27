"""Simulation Incident & What-If API Routes."""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, Dict, Any

from app.models.city import CityState
from app.services.city_service import city_service
from app.services.simulation_service import simulation_service
from app.simulation.matlab_bridge import calculate_traffic_flow, calculate_emissions_aqi

router = APIRouter(prefix="/api/simulation", tags=["Simulation Engine"])


class AccidentRequest(BaseModel):
    road_id: str = "ROAD_A"
    severity: str = "HIGH"


class WhatIfRequest(BaseModel):
    traffic_multiplier: float = 1.0   # 0.5 to 2.0
    rainfall_level: str = "none"      # "none", "moderate", "heavy"


@router.post("/accident", response_model=CityState)
async def simulate_accident(payload: AccidentRequest = AccidentRequest()):
    """Simulates an accident blocking the designated road and triggers traffic redistribution."""
    return simulation_service.trigger_accident(road_id=payload.road_id, severity=payload.severity)


@router.post("/clear", response_model=CityState)
async def clear_simulation():
    """Clears all incidents and restores normal baseline city flow."""
    return simulation_service.clear_all_incidents()


from app.decision.intervention_engine import DynamicSimulationParams

@router.post("/dynamic-simulate", response_model=CityState)
async def dynamic_simulate(payload: DynamicSimulationParams):
    """Applies user sliders (traffic, accident road, severity, weather) directly to the live network."""
    return simulation_service.apply_dynamic_simulation(
        traffic_multiplier=payload.traffic_multiplier,
        accident_road_id=payload.accident_road_id,
        accident_severity_pct=payload.accident_severity_pct,
        weather=payload.weather,
        industrial_base_aqi=payload.industrial_base_aqi,
        is_accident_active=payload.is_accident_active
    )



@router.post("/what-if")
async def run_what_if_simulation(payload: WhatIfRequest) -> Dict[str, Any]:
    """
    Evaluates what happens to the network when traffic levels change or rainfall hits.
    Returns comparison between current baseline and what-if projection.
    """
    current_metrics = city_service.get_summary_metrics()

    # Weather speed friction reduction factor
    weather_factor = 1.0
    if payload.rainfall_level == "moderate":
        weather_factor = 0.85
    elif payload.rainfall_level == "heavy":
        weather_factor = 0.70

    # Project on all active roads
    projected_densities = []
    projected_speeds = []
    projected_aqis = []

    for r in city_service.roads.values():
        if r.is_blocked:
            continue
        new_veh = int(r.vehicle_count * payload.traffic_multiplier)
        free_speed = r.free_flow_speed * weather_factor

        flow = calculate_traffic_flow(
            vehicle_count=new_veh,
            capacity=r.capacity,
            length_km=r.length_km,
            free_flow_speed=free_speed,
            is_blocked=False
        )
        emissions = calculate_emissions_aqi(
            vehicle_count=new_veh,
            average_speed=flow["speed_kmh"],
            length_km=r.length_km,
            density=flow["density"]
        )

        projected_densities.append(flow["density"])
        projected_speeds.append(flow["speed_kmh"])
        projected_aqis.append(emissions["aqi"])

    proj_avg_density = sum(projected_densities) / max(len(projected_densities), 1)
    proj_avg_speed = sum(projected_speeds) / max(len(projected_speeds), 1)
    proj_avg_aqi = round(sum(projected_aqis) / max(len(projected_aqis), 1))

    # Projected ambulance delay
    proj_amb_time = round(current_metrics.emergency_response_time_min * (1.0 + (proj_avg_density - current_metrics.average_traffic_density) * 1.5), 1)
    proj_amb_time = max(5.0, proj_amb_time)

    return {
        "inputs": {
            "traffic_multiplier": payload.traffic_multiplier,
            "traffic_percentage": round(payload.traffic_multiplier * 100),
            "rainfall_level": payload.rainfall_level
        },
        "baseline": {
            "traffic_density_pct": round(current_metrics.average_traffic_density * 100, 1),
            "average_speed_kmh": current_metrics.average_speed_kmh,
            "aqi": current_metrics.city_aqi,
            "ambulance_time_min": current_metrics.emergency_response_time_min
        },
        "projected": {
            "traffic_density_pct": round(proj_avg_density * 100, 1),
            "average_speed_kmh": round(proj_avg_speed, 1),
            "aqi": proj_avg_aqi,
            "ambulance_time_min": proj_amb_time
        }
    }
