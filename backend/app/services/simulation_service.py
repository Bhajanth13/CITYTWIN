"""
Simulation Service for CITYTWIN.
Manages incident injection, macroscopic traffic redistribution, and emergency response updates.
"""

from datetime import datetime, timezone
from typing import Dict, Any, Optional

from app.models.city import Incident, CityState, EmergencyVehicle
from app.services.city_service import city_service
from app.simulation.matlab_bridge import calculate_traffic_flow, calculate_emissions_aqi
from app.routing.dijkstra import find_shortest_path


class SimulationService:
    def trigger_accident(self, road_id: str = "ROAD_A", severity: str = "HIGH") -> CityState:
        """
        Simulates an accident blocking the specified road.
        Vehicles are redistributed to alternative corridors and physical metrics are updated.
        """
        if road_id not in city_service.roads:
            raise ValueError(f"Road {road_id} does not exist in network")

        target_road = city_service.roads[road_id]
        displaced_volume = target_road.vehicle_count

        # 1. Block the incident road
        target_road.is_blocked = True
        target_road.congestion_level = "BLOCKED"
        target_road.average_speed = 5.0
        target_road.travel_time_min = 999.0
        target_road.traffic_density = 1.0

        # Emissions at crawl/wreckage
        target_emissions = calculate_emissions_aqi(
            vehicle_count=displaced_volume,
            average_speed=5.0,
            length_km=target_road.length_km,
            density=1.0
        )
        target_road.aqi = target_emissions["aqi"]
        target_road.aqi_category = target_emissions["aqi_category"]
        target_road.co2_kg_hr = target_emissions["co2_kg_hr"]
        target_road.nox_g_hr = target_emissions["nox_g_hr"]
        target_road.pm25_g_hr = target_emissions["pm25_g_hr"]

        # 2. Register incident
        incident = Incident(
            id=f"INC_{int(datetime.now().timestamp())}",
            type="accident",
            location_node=target_road.start_node,
            affected_road_id=road_id,
            severity=severity,
            active=True,
            description=f"Major multi-vehicle collision blocking {target_road.name}. Full closure active.",
            timestamp=datetime.now(timezone.utc).isoformat()
        )
        # Avoid duplicate active incidents on the same road
        city_service.incidents = [i for i in city_service.incidents if i.affected_road_id != road_id]
        city_service.incidents.append(incident)

        # 3. Redistribute Traffic dynamically across alternative unblocked corridors
        alt_candidates = [
            r_id for r_id in city_service.roads 
            if r_id != road_id and not city_service.roads[r_id].is_blocked
        ]
        if alt_candidates:
            selected_alts = alt_candidates[:min(4, len(alt_candidates))]
            per_road_vol = displaced_volume // len(selected_alts)
            for alt_id in selected_alts:
                r = city_service.roads[alt_id]
                new_veh = r.vehicle_count + per_road_vol
                r.vehicle_count = new_veh
                
                # Recalculate via MATLAB flow model
                traffic = calculate_traffic_flow(
                    vehicle_count=new_veh,
                    capacity=r.capacity,
                    length_km=r.length_km,
                    free_flow_speed=r.free_flow_speed,
                    is_blocked=False
                )
                r.traffic_density = traffic["density"]
                r.average_speed = traffic["speed_kmh"]
                r.travel_time_min = traffic["travel_time_min"]
                r.congestion_level = traffic["congestion_level"]

                # Recalculate emissions
                emissions = calculate_emissions_aqi(
                    vehicle_count=new_veh,
                    average_speed=traffic["speed_kmh"],
                    length_km=r.length_km,
                    density=traffic["density"]
                )
                r.aqi = emissions["aqi"]
                r.aqi_category = emissions["aqi_category"]
                r.co2_kg_hr = emissions["co2_kg_hr"]
                r.nox_g_hr = emissions["nox_g_hr"]
                r.pm25_g_hr = emissions["pm25_g_hr"]

        # 4. Update Emergency Ambulance Route via Dijkstra
        self.update_emergency_route()

        return city_service.get_city_state()

    def update_emergency_route(self, priority: bool = False) -> Dict[str, Any]:
        """Recalculates ambulance route from Station to Hospital using Dijkstra."""
        route_res = find_shortest_path(
            nodes=city_service.nodes,
            roads=city_service.roads,
            start_node_id="NODE_WEST_GATE",
            end_node_id="NODE_HOSPITAL",
            weight_mode="time",
            emergency_priority=priority
        )

        if "AMB_01" in city_service.emergency_vehicles and route_res["found"]:
            amb = city_service.emergency_vehicles["AMB_01"]
            amb.route = route_res["path"]
            amb.estimated_arrival_time_min = route_res["total_time_min"]
            amb.status = "DISPATCHED" if any(i.active for i in city_service.incidents) else "READY"

        return route_res

    def apply_dynamic_simulation(
        self,
        traffic_multiplier: float = 1.0,
        accident_road_id: str = "ROAD_A",
        accident_severity_pct: float = 100.0,
        weather: str = "clear",
        industrial_base_aqi: int = 45,
        is_accident_active: bool = True
    ) -> CityState:
        """
        Applies user slider parameters directly to the live network.
        Updates all roads, calculates spillover, updates ambulance route, and returns live CityState.
        """
        # Reset to base seed geometry first
        city_service.reset_city_state()

        traffic_mult = max(0.4, min(2.5, traffic_multiplier))
        severity = max(0.0, min(100.0, accident_severity_pct)) / 100.0
        weather_factor = 0.85 if weather == "rain" else 0.70 if weather == "storm" else 1.0

        # 1. Scale baseline vehicles across all roads
        for r in city_service.roads.values():
            new_v = int(r.vehicle_count * traffic_mult)
            fl = calculate_traffic_flow(new_v, r.capacity, r.length_km, r.free_flow_speed * weather_factor, False)
            em = calculate_emissions_aqi(new_v, fl["speed_kmh"], r.length_km, fl["density"])
            r.vehicle_count = new_v
            r.traffic_density = fl["density"]
            r.average_speed = fl["speed_kmh"]
            r.travel_time_min = fl["travel_time_min"]
            r.congestion_level = fl["congestion_level"]
            r.aqi = round(em["aqi"] + (industrial_base_aqi - 45.0) * 0.7)

        # 2. Inject accident if active
        if is_accident_active and severity > 0.05 and accident_road_id in city_service.roads:
            target_r = city_service.roads[accident_road_id]
            is_full = severity >= 0.85
            target_r.is_blocked = is_full

            if is_full:
                target_r.congestion_level = "BLOCKED"
                target_r.average_speed = 5.0
                target_r.travel_time_min = 999.0
                target_r.traffic_density = 1.0
                disp_v = int(target_r.vehicle_count * severity)
            else:
                eff_c = max(100, int(target_r.capacity * (1.0 - severity)))
                fl = calculate_traffic_flow(target_r.vehicle_count, eff_c, target_r.length_km, target_r.free_flow_speed * weather_factor, False)
                target_r.traffic_density = fl["density"]
                target_r.average_speed = fl["speed_kmh"]
                target_r.travel_time_min = fl["travel_time_min"]
                target_r.congestion_level = "SEVERE"
                disp_v = int(target_r.vehicle_count * severity * 0.6)

            # Register incident
            inc = Incident(
                id=f"INC_{int(datetime.now().timestamp())}",
                type="accident",
                location_node=target_r.start_node,
                affected_road_id=accident_road_id,
                severity="HIGH" if is_full else "MEDIUM",
                active=True,
                description=f"Incident on {target_r.name} ({accident_road_id}). {round(accident_severity_pct)}% capacity impairment.",
                timestamp=datetime.now(timezone.utc).isoformat()
            )
            city_service.incidents = [inc]

            # Redistribute displaced vehicles dynamically across alternative unblocked corridors
            alt_candidates = [
                b_id for b_id in city_service.roads 
                if b_id != accident_road_id and not city_service.roads[b_id].is_blocked
            ]
            if alt_candidates:
                selected_alts = alt_candidates[:min(3, len(alt_candidates))]
                per_alt_vol = disp_v // len(selected_alts)
                for b_id in selected_alts:
                    br = city_service.roads[b_id]
                    nv = br.vehicle_count + per_alt_vol
                    br.vehicle_count = nv
                    fl_b = calculate_traffic_flow(nv, br.capacity, br.length_km, br.free_flow_speed * weather_factor, False)
                    br.traffic_density = fl_b["density"]
                    br.average_speed = fl_b["speed_kmh"]
                    br.travel_time_min = fl_b["travel_time_min"]
                    br.congestion_level = fl_b["congestion_level"]
                    em_b = calculate_emissions_aqi(nv, fl_b["speed_kmh"], br.length_km, fl_b["density"])
                    br.aqi = round(em_b["aqi"] + (industrial_base_aqi - 45.0) * 0.7)
        else:
            city_service.incidents = []

        # 3. Update emergency route
        self.update_emergency_route()

        return city_service.get_city_state()

    def clear_all_incidents(self) -> CityState:
        """Clears all active incidents and restores normal baseline city flow."""
        return city_service.reset_city_state()


# Singleton instance
simulation_service = SimulationService()

