"""
Service for managing the CITYTWIN Virtual City state.
Loads seed topology, executes physical models, and maintains in-memory simulation state.
"""

import json
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, List, Optional

from app.models.city import (
    Node, Location, Road, EmergencyVehicle, Incident,
    CitySummaryMetrics, CityState
)
from app.simulation.matlab_bridge import calculate_traffic_flow, calculate_emissions_aqi

DATA_DIR = Path(__file__).resolve().parent.parent.parent.parent / "data"


class CityService:
    def __init__(self):
        self.nodes: Dict[str, Node] = {}
        self.locations: Dict[str, Location] = {}
        self.roads: Dict[str, Road] = {}
        self.emergency_vehicles: Dict[str, EmergencyVehicle] = {}
        self.incidents: List[Incident] = []
        self._load_seed_data()

    def _load_seed_data(self):
        """Loads nodes, locations, and roads from JSON files in data/."""
        # 1. Load Nodes
        nodes_file = DATA_DIR / "nodes.json"
        with open(nodes_file, "r", encoding="utf-8") as f:
            nodes_data = json.load(f)
            self.nodes = {item["id"]: Node(**item) for item in nodes_data}

        # 2. Load Locations
        locations_file = DATA_DIR / "locations.json"
        with open(locations_file, "r", encoding="utf-8") as f:
            locs_data = json.load(f)
            self.locations = {item["id"]: Location(**item) for item in locs_data}

        # 3. Load Roads & Compute Baseline Physics via MATLAB bridge
        roads_file = DATA_DIR / "roads.json"
        with open(roads_file, "r", encoding="utf-8") as f:
            roads_data = json.load(f)
            self.roads = {}
            for item in roads_data:
                traffic = calculate_traffic_flow(
                    vehicle_count=item["baseline_vehicles"],
                    capacity=item["capacity"],
                    length_km=item["length_km"],
                    free_flow_speed=item["free_flow_speed"],
                    is_blocked=False
                )
                emissions = calculate_emissions_aqi(
                    vehicle_count=item["baseline_vehicles"],
                    average_speed=traffic["speed_kmh"],
                    length_km=item["length_km"],
                    density=traffic["density"]
                )
                road = Road(
                    id=item["id"],
                    name=item["name"],
                    start_node=item["start_node"],
                    end_node=item["end_node"],
                    length_km=item["length_km"],
                    capacity=item["capacity"],
                    free_flow_speed=item["free_flow_speed"],
                    vehicle_count=item["baseline_vehicles"],
                    traffic_density=traffic["density"],
                    average_speed=traffic["speed_kmh"],
                    travel_time_min=traffic["travel_time_min"],
                    congestion_level=traffic["congestion_level"],
                    is_blocked=False,
                    aqi=emissions["aqi"],
                    aqi_category=emissions["aqi_category"],
                    co2_kg_hr=emissions["co2_kg_hr"],
                    nox_g_hr=emissions["nox_g_hr"],
                    pm25_g_hr=emissions["pm25_g_hr"],
                )
                self.roads[road.id] = road

        # 4. Initialize Emergency Vehicle
        self.emergency_vehicles = {
            "AMB_01": EmergencyVehicle(
                id="AMB_01",
                type="ambulance",
                name="Rescue 1 (Trauma Unit)",
                current_location="LOC_STATION",
                destination="LOC_HOSPITAL",
                status="READY",
                route=["NODE_WEST_GATE", "NODE_WEST_CENTRAL", "NODE_CENTER", "NODE_HOSPITAL"],
                estimated_arrival_time_min=7.2
            )
        }
        self.incidents = []

    def get_summary_metrics(self) -> CitySummaryMetrics:
        """Calculates aggregated metrics across all active road segments."""
        if not self.roads:
            return CitySummaryMetrics(
                average_traffic_density=0.0,
                average_speed_kmh=0.0,
                city_aqi=45,
                city_aqi_category="Good",
                active_incidents_count=0,
                emergency_response_time_min=7.2,
                total_vehicles_active=0
            )

        active_roads = list(self.roads.values())
        avg_density = sum(r.traffic_density for r in active_roads) / len(active_roads)
        avg_speed = sum(r.average_speed for r in active_roads) / len(active_roads)
        avg_aqi = round(sum(r.aqi for r in active_roads) / len(active_roads))
        total_veh = sum(r.vehicle_count for r in active_roads)

        if avg_aqi <= 50:
            aqi_cat = "Good"
        elif avg_aqi <= 100:
            aqi_cat = "Moderate"
        elif avg_aqi <= 150:
            aqi_cat = "Unhealthy for Sensitive Groups"
        elif avg_aqi <= 200:
            aqi_cat = "Unhealthy"
        else:
            aqi_cat = "Severe / Hazardous"

        amb_time = 7.2
        if "AMB_01" in self.emergency_vehicles:
            amb_time = self.emergency_vehicles["AMB_01"].estimated_arrival_time_min

        return CitySummaryMetrics(
            average_traffic_density=round(avg_density, 3),
            average_speed_kmh=round(avg_speed, 1),
            city_aqi=avg_aqi,
            city_aqi_category=aqi_cat,
            active_incidents_count=len([i for i in self.incidents if i.active]),
            emergency_response_time_min=round(amb_time, 1),
            total_vehicles_active=total_veh
        )

    def get_city_state(self) -> CityState:
        """Returns complete snapshot of the virtual city."""
        return CityState(
            nodes=list(self.nodes.values()),
            locations=list(self.locations.values()),
            roads=list(self.roads.values()),
            emergency_vehicles=list(self.emergency_vehicles.values()),
            incidents=self.incidents,
            metrics=self.get_summary_metrics(),
            timestamp=datetime.now(timezone.utc).isoformat()
        )

    def reset_city_state(self) -> CityState:
        """Resets the city back to seed initial state."""
        self._load_seed_data()
        return self.get_city_state()


# Singleton instance
city_service = CityService()
