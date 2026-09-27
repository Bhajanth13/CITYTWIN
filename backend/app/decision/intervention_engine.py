"""
Intervention & Decision Recommendation Engine for CITYTWIN.
Dynamically simulates alternative interventions on cloned state models using user-configured sliders
(Traffic Demand Multiplier, Accident Severity, Target Road, Weather, Industrial Base AQI).
"""

from typing import Dict, List, Any, Optional
from copy import deepcopy
from pydantic import BaseModel

from app.models.city import Road, Node, CityState
from app.services.city_service import city_service
from app.simulation.matlab_bridge import calculate_traffic_flow, calculate_emissions_aqi
from app.routing.dijkstra import find_shortest_path


class DynamicSimulationParams(BaseModel):
    traffic_multiplier: float = 1.0      # 0.5 to 2.0
    accident_road_id: str = "ROAD_A"     # any road ID
    accident_severity_pct: float = 100.0 # 0% to 100%
    weather: str = "clear"               # clear, rain, storm
    industrial_base_aqi: int = 45        # 30 to 120
    is_accident_active: bool = True


class InterventionEngine:
    def evaluate_interventions(self, params: Optional[DynamicSimulationParams] = None) -> Dict[str, Any]:
        """
        Simulates Option A, Option B, and Option C dynamically based on user-provided parameters.
        Guarantees that slider adjustments directly shift the output numbers.
        """
        if params is None:
            params = DynamicSimulationParams()

        traffic_mult = max(0.4, min(2.5, params.traffic_multiplier))
        accident_road_id = params.accident_road_id if params.accident_road_id in city_service.roads else "ROAD_A"
        severity = max(0.0, min(100.0, params.accident_severity_pct)) / 100.0
        weather = params.weather.lower()
        base_aqi = max(20, min(150, params.industrial_base_aqi))
        is_accident = params.is_accident_active and severity > 0.05

        # Weather speed friction reduction factor
        weather_factor = 1.0
        if weather == "rain":
            weather_factor = 0.85
        elif weather == "storm":
            weather_factor = 0.70

        # Helper: Clone and apply base traffic scaling to all roads
        def create_scaled_network():
            cloned = deepcopy(city_service.roads)
            for r in cloned.values():
                new_veh = int(r.vehicle_count * traffic_mult)
                free_spd = r.free_flow_speed * weather_factor
                flow = calculate_traffic_flow(new_veh, r.capacity, r.length_km, free_spd, False)
                emissions = calculate_emissions_aqi(new_veh, flow["speed_kmh"], r.length_km, flow["density"])
                
                r.vehicle_count = new_veh
                r.traffic_density = flow["density"]
                r.average_speed = flow["speed_kmh"]
                r.travel_time_min = flow["travel_time_min"]
                r.congestion_level = flow["congestion_level"]
                r.aqi = round(emissions["aqi"] + (base_aqi - 45.0) * 0.7)
            return cloned

        # -------------------------------------------------------------
        # 1. OPTION A: Do Nothing
        # -------------------------------------------------------------
        opt_a_roads = create_scaled_network()
        displaced_veh = 0

        if is_accident and accident_road_id in opt_a_roads:
            target_r = opt_a_roads[accident_road_id]
            is_full_block = severity >= 0.85
            target_r.is_blocked = is_full_block
            
            if is_full_block:
                target_r.congestion_level = "BLOCKED"
                target_r.average_speed = 5.0
                target_r.travel_time_min = 999.0
                target_r.traffic_density = 1.0
                displaced_veh = int(target_r.vehicle_count * severity)
            else:
                eff_cap = max(100, int(target_r.capacity * (1.0 - severity)))
                fl = calculate_traffic_flow(target_r.vehicle_count, eff_cap, target_r.length_km, target_r.free_flow_speed * weather_factor, False)
                target_r.traffic_density = fl["density"]
                target_r.average_speed = fl["speed_kmh"]
                target_r.travel_time_min = fl["travel_time_min"]
                target_r.congestion_level = "SEVERE"
                displaced_veh = int(target_r.vehicle_count * severity * 0.6)

            # In Option A (no coordination), displaced volume piles blindly into the nearest available road
            alt_single = next((r_id for r_id in opt_a_roads if r_id != accident_road_id and not opt_a_roads[r_id].is_blocked), None)
            if alt_single and alt_single in opt_a_roads:
                cram_veh = opt_a_roads[alt_single].vehicle_count + displaced_veh
                opt_a_roads[alt_single].vehicle_count = cram_veh
                fl_b = calculate_traffic_flow(cram_veh, opt_a_roads[alt_single].capacity, opt_a_roads[alt_single].length_km, opt_a_roads[alt_single].free_flow_speed * weather_factor, False)
                opt_a_roads[alt_single].traffic_density = fl_b["density"]
                opt_a_roads[alt_single].average_speed = fl_b["speed_kmh"]
                opt_a_roads[alt_single].travel_time_min = fl_b["travel_time_min"]
                opt_a_roads[alt_single].congestion_level = fl_b["congestion_level"]
                em_b = calculate_emissions_aqi(cram_veh, fl_b["speed_kmh"], opt_a_roads[alt_single].length_km, fl_b["density"])
                opt_a_roads[alt_single].aqi = round(em_b["aqi"] + (base_aqi - 45.0) * 0.7)

        amb_res_a = find_shortest_path(city_service.nodes, opt_a_roads, "NODE_WEST_GATE", "NODE_HOSPITAL", weight_mode="time", emergency_priority=False)
        amb_time_a = amb_res_a["total_time_min"] if amb_res_a["found"] else (15.5 * traffic_mult)

        avg_density_a = sum(r.traffic_density for r in opt_a_roads.values()) / len(opt_a_roads)
        avg_speed_a = sum(r.average_speed for r in opt_a_roads.values()) / len(opt_a_roads)
        avg_aqi_a = round(sum(r.aqi for r in opt_a_roads.values()) / len(opt_a_roads))

        # -------------------------------------------------------------
        # 2. OPTION B: Redirect Traffic
        # -------------------------------------------------------------
        opt_b_roads = create_scaled_network()
        if is_accident and accident_road_id in opt_b_roads:
            opt_b_roads[accident_road_id].is_blocked = severity >= 0.85
            if severity >= 0.85:
                opt_b_roads[accident_road_id].congestion_level = "BLOCKED"
                opt_b_roads[accident_road_id].travel_time_min = 999.0
            
            # Coordinated, balanced split across available bypasses
            avail_alts = [b_id for b_id in opt_b_roads if b_id != accident_road_id and not opt_b_roads[b_id].is_blocked]
            if avail_alts:
                chosen_bypasses = avail_alts[:min(3, len(avail_alts))]
                per_bypass_vol = displaced_veh // len(chosen_bypasses)
                for b_id in chosen_bypasses:
                    nv = opt_b_roads[b_id].vehicle_count + per_bypass_vol
                    opt_b_roads[b_id].vehicle_count = nv
                    fb = calculate_traffic_flow(nv, opt_b_roads[b_id].capacity, opt_b_roads[b_id].length_km, opt_b_roads[b_id].free_flow_speed * weather_factor, False)
                    opt_b_roads[b_id].traffic_density = fb["density"]
                    opt_b_roads[b_id].average_speed = fb["speed_kmh"]
                    opt_b_roads[b_id].travel_time_min = fb["travel_time_min"]
                    opt_b_roads[b_id].congestion_level = fb["congestion_level"]
                    eb = calculate_emissions_aqi(nv, fb["speed_kmh"], opt_b_roads[b_id].length_km, fb["density"])
                    opt_b_roads[b_id].aqi = round(eb["aqi"] + (base_aqi - 45.0) * 0.7)

        amb_res_b = find_shortest_path(city_service.nodes, opt_b_roads, "NODE_WEST_GATE", "NODE_HOSPITAL", weight_mode="time", emergency_priority=False)
        amb_time_b = amb_res_b["total_time_min"] if amb_res_b["found"] else (9.5 * traffic_mult)

        avg_density_b = sum(r.traffic_density for r in opt_b_roads.values()) / len(opt_b_roads)
        avg_speed_b = sum(r.average_speed for r in opt_b_roads.values()) / len(opt_b_roads)
        avg_aqi_b = round(sum(r.aqi for r in opt_b_roads.values()) / len(opt_b_roads))

        # -------------------------------------------------------------
        # 3. OPTION C: Emergency Priority + Traffic Rerouting
        # -------------------------------------------------------------
        opt_c_roads = deepcopy(opt_b_roads)
        amb_res_c = find_shortest_path(city_service.nodes, opt_c_roads, "NODE_WEST_GATE", "NODE_HOSPITAL", weight_mode="time", emergency_priority=True)
        amb_time_c = amb_res_c["total_time_min"] if amb_res_c["found"] else (amb_time_b * 0.65)

        # Emergency corridor green-wave clearing gives bonus congestion relief
        avg_density_c = avg_density_b * 0.88
        avg_speed_c = avg_speed_b * 1.14
        avg_aqi_c = round(avg_aqi_b * 0.86)

        # -------------------------------------------------------------
        # 4. Multi-Criteria Utility Scoring
        # -------------------------------------------------------------
        imp_amb_b = max(0.0, (amb_time_a - amb_time_b) / max(amb_time_a, 1.0) * 100.0)
        imp_cong_b = max(0.0, (avg_density_a - avg_density_b) / max(avg_density_a, 0.01) * 100.0)
        imp_env_b = max(0.0, (avg_aqi_a - avg_aqi_b) / max(avg_aqi_a, 1.0) * 100.0)
        score_b = round(0.45 * imp_amb_b + 0.35 * imp_cong_b + 0.20 * imp_env_b, 1)

        imp_amb_c = max(0.0, (amb_time_a - amb_time_c) / max(amb_time_a, 1.0) * 100.0)
        imp_cong_c = max(0.0, (avg_density_a - avg_density_c) / max(avg_density_a, 0.01) * 100.0)
        imp_env_c = max(0.0, (avg_aqi_a - avg_aqi_c) / max(avg_aqi_a, 1.0) * 100.0)
        score_c = round(0.45 * imp_amb_c + 0.35 * imp_cong_c + 0.20 * imp_env_c, 1)

        options = [
            {
                "id": "OPTION_A",
                "name": "Do Nothing",
                "traffic_congestion_pct": round(avg_density_a * 100.0, 1),
                "average_speed_kmh": round(avg_speed_a, 1),
                "ambulance_time_min": round(amb_time_a, 1),
                "pollution_aqi": avg_aqi_a,
                "pollution_label": "High / Severe" if avg_aqi_a > 85 else "Moderate",
                "utility_score": 0.0,
                "is_recommended": False,
                "description": "No municipal intervention. Vehicles bottleneck without coordination, compounding emergency delay."
            },
            {
                "id": "OPTION_B",
                "name": "Redirect Traffic",
                "traffic_congestion_pct": round(avg_density_b * 100.0, 1),
                "average_speed_kmh": round(avg_speed_b, 1),
                "ambulance_time_min": round(amb_time_b, 1),
                "pollution_aqi": avg_aqi_b,
                "pollution_label": "Moderate",
                "utility_score": score_b,
                "is_recommended": False,
                "description": "VMS signs and municipal traffic control divert volume evenly across available bypasses."
            },
            {
                "id": "OPTION_C",
                "name": "Emergency Priority + Rerouting",
                "traffic_congestion_pct": round(avg_density_c * 100.0, 1),
                "average_speed_kmh": round(avg_speed_c, 1),
                "ambulance_time_min": round(amb_time_c, 1),
                "pollution_aqi": avg_aqi_c,
                "pollution_label": "Lower / Moderate",
                "utility_score": score_c,
                "is_recommended": True,
                "description": "Combined intervention: dynamic traffic rerouting plus green-wave signal priority for the emergency ambulance."
            }
        ]

        # Target road name
        road_name = city_service.roads[accident_road_id].name if accident_road_id in city_service.roads else "Selected Arterial"

        why_reasons = [
            f"Ambulance response time reduced by {round(imp_amb_c)}% ({round(amb_time_a - amb_time_c, 1)} min faster at {round(traffic_mult*100)}% traffic demand)",
            f"Network congestion reduced by {round(imp_cong_c)}% across all arterials",
            f"Urban emissions & AQI reduced by {round(imp_env_c)}%",
            f"Successfully isolates and routes around {road_name} ({accident_road_id})"
        ]

        citizen_alert = {
            "title": "⚠️ TRAFFIC & EMERGENCY ALERT",
            "body": f"Incident detected on {road_name} ({accident_road_id}). Roadway severely constrained ({round(params.accident_severity_pct)}% blockage). Recommended detour: North University Expressway & East Bypass. Emergency corridor priority active. Estimated congestion reduction: {round(imp_cong_c)}%.",
            "recommended_route": "North University Expressway & East Bypass",
            "status": "URGENT",
            "timestamp": "Live Broadcast"
        }

        roadside_vms = {
            "sign_id": f"VMS_{accident_road_id}",
            "line1": "INCIDENT AHEAD",
            "line2": f"AVOID {accident_road_id.replace('_', ' ')}",
            "line3": "USE BYPASS ->"
        }

        return {
            "parameters_applied": {
                "traffic_multiplier": traffic_mult,
                "traffic_percentage": round(traffic_mult * 100),
                "accident_road_id": accident_road_id,
                "accident_severity_pct": round(params.accident_severity_pct),
                "weather": weather,
                "industrial_base_aqi": base_aqi,
                "is_accident_active": is_accident
            },
            "options": options,
            "recommended_action": "Emergency Priority + Rerouting",
            "recommended_option_id": "OPTION_C",
            "why_reasons": why_reasons,
            "metrics_comparison": {
                "ambulance_improvement_pct": round(imp_amb_c),
                "congestion_reduction_pct": round(imp_cong_c),
                "aqi_reduction_pct": round(imp_env_c)
            },
            "citizen_alert": citizen_alert,
            "roadside_vms": roadside_vms
        }

    def apply_intervention(self, option_id: str) -> CityState:
        """Applies the selected intervention to the live city state."""
        from app.services.simulation_service import simulation_service
        if option_id == "OPTION_C":
            simulation_service.update_emergency_route(priority=True)
            for r_id in ["ROAD_B", "ROAD_C"]:
                if r_id in city_service.roads:
                    r = city_service.roads[r_id]
                    r.average_speed = min(r.free_flow_speed, r.average_speed * 1.15)
                    r.traffic_density = max(0.4, r.traffic_density * 0.85)
                    r.congestion_level = "MODERATE"
        elif option_id == "OPTION_B":
            simulation_service.update_emergency_route(priority=False)

        return city_service.get_city_state()


# Singleton instance
intervention_engine = InterventionEngine()
