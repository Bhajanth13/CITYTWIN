"""City State & Topology API Routes."""

import json
import os
from fastapi import APIRouter
from app.models.city import CityState, Road, Location, Node
from app.services.city_service import city_service

router = APIRouter(prefix="/api/city", tags=["Virtual City Network"])


@router.get("/state", response_model=CityState)
async def get_city_state():
    """Returns the complete live state of the Virtual City."""
    return city_service.get_city_state()


@router.get("/roads", response_model=list[Road])
async def get_roads():
    """Returns list of all road segments and their dynamic traffic conditions."""
    return list(city_service.roads.values())


@router.get("/locations", response_model=list[Location])
async def get_locations():
    """Returns all key urban landmarks (Hospital, Station, Tech Park, etc.)."""
    return list(city_service.locations.values())


@router.get("/nodes", response_model=list[Node])
async def get_nodes():
    """Returns network intersection nodes."""
    return list(city_service.nodes.values())


@router.post("/reset", response_model=CityState)
async def reset_city():
    """Resets the city network to baseline seed state."""
    return city_service.reset_city_state()


@router.get("/simulation-specs")
async def get_simulation_specs():
    """Returns mathematical and physical simulation specs (MATLAB / Simulink)."""
    return {
        "framework": "MATLAB & Simulink Multi-Domain Digital Twin Engine",
        "hackathon": "BNMIT Eco-Innovate 2026 (MathWorks & IEEE Bangalore Section)",
        "theme": "Theme 2: Smart City 2030",
        "macroscopic_model": "Lighthill-Whitham-Richards (LWR) PDE with Greenshields Closure",
        "control_system": "Closed-Loop PID Feedback Controller for Dynamic Green-Light Duty Cycle",
        "routing_engine": "Graph-Theory Dijkstra Dynamic Shortest Path with BPR Impedance Weights",
        "dispersion_model": "2D/3D Atmospheric Gaussian Plume Diffusion (Pasquill-Gifford Class D)",
        "decision_optimizer": "Multi-Objective 3D Pareto Frontier with Monte Carlo Stochastic Uncertainty",
        "simulink_models": [
            "matlab/citytwin_closed_loop_sim.slx",
            "matlab/citytwin_traffic_sim.slx"
        ],
        "matlab_scripts": [
            "matlab/CITYTWIN_MASTER_SUITE.m",
            "matlab/run_city_sim.m",
            "matlab/build_closed_loop_simulink.m",
            "matlab/run_simulink_and_plot.m",
            "matlab/emergency_dijkstra_routing.m",
            "matlab/spatial_aqi_dispersion.m",
            "matlab/pareto_decision_optimizer.m",
            "matlab/traffic_flow_model.m",
            "matlab/emissions_aqi_model.m"
        ],
        "simulink_blocks": [
            {"block": "Density_Setpoint", "type": "Constant", "desc": "Reference target density (45 veh/km)"},
            {"block": "Error_Sum", "type": "Sum (+ -)", "desc": "Computes density error e(t) = Setpoint - Feedback"},
            {"block": "Kp_Gain / Ki / Kd", "type": "PID Controller", "desc": "Closed-loop feedback tuning to suppress shockwaves"},
            {"block": "Green_Limiter", "type": "Saturation", "desc": "Enforces signal duty cycle bounds [10%, 90%]"},
            {"block": "Incident_Disturbance", "type": "Step", "desc": "Accident injection cutting capacity by 70% at t=25s"},
            {"block": "Discharge_Calc", "type": "Product (* * *)", "desc": "Effective discharge flow rate across intersection"},
            {"block": "Density_Plant_Integrator", "type": "Integrator", "desc": "LWR Conservation law integral (q_in - q_out)/L dt"},
            {"block": "Traffic_Dynamics_Scope", "type": "Scope (Dual Port)", "desc": "Real-time density k(t) and speed v(t) waveforms"},
            {"block": "AirQuality_AQI_Scope", "type": "Scope", "desc": "Real-time EPA AQI hazard degradation waveform"}
        ]
    }


@router.get("/matlab-telemetry")
async def get_matlab_telemetry():
    """Returns the latest telemetry exported from MATLAB / Simulink simulations."""
    json_path = os.path.join(os.path.dirname(__file__), "..", "data", "citytwin_matlab_telemetry.json")
    if os.path.exists(json_path):
        with open(json_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {
        "status": "baseline_active",
        "note": "Run 'CITYTWIN_MASTER_SUITE' in MATLAB to refresh latest runtime telemetry",
        "metrics": {
            "density_open_loop": 118.4,
            "density_closed_loop": 46.2,
            "speed_recovery_kmh": 38.5,
            "ambulance_eta_gridlock_min": 26.8,
            "ambulance_eta_greenwave_min": 7.1,
            "aqi_peak_incident": 238,
            "aqi_peak_option_c": 84,
            "pareto_optimal_choice": "Option C (Strictly Non-Dominated)"
        }
    }
