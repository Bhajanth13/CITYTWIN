"""Data models for the CITYTWIN Virtual City."""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class Node(BaseModel):
    id: str
    name: str
    x: float
    y: float


class Location(BaseModel):
    id: str
    name: str
    type: str  # hospital, emergency_station, commercial, residential, etc.
    x: float
    y: float
    description: str
    connected_node: str


class Road(BaseModel):
    id: str
    name: str
    start_node: str
    end_node: str
    length_km: float
    capacity: int
    free_flow_speed: float
    
    # Dynamic Simulation State
    vehicle_count: int
    traffic_density: float
    average_speed: float
    travel_time_min: float
    congestion_level: str  # LOW, MODERATE, HIGH, SEVERE, BLOCKED
    is_blocked: bool = False
    
    # Environmental Metrics
    aqi: int
    aqi_category: str
    co2_kg_hr: float
    nox_g_hr: float
    pm25_g_hr: float


class EmergencyVehicle(BaseModel):
    id: str
    type: str = "ambulance"
    name: str
    current_location: str
    destination: str
    status: str  # READY, DISPATCHED, EN_ROUTE, ON_SCENE, ARRIVED
    route: List[str] = Field(default_factory=list)
    estimated_arrival_time_min: float = 0.0


class Incident(BaseModel):
    id: str
    type: str  # accident, road_closure, hazard
    location_node: str
    affected_road_id: str
    severity: str  # LOW, MEDIUM, HIGH, CRITICAL
    active: bool = True
    description: str
    timestamp: str


class CitySummaryMetrics(BaseModel):
    average_traffic_density: float
    average_speed_kmh: float
    city_aqi: int
    city_aqi_category: str
    active_incidents_count: int
    emergency_response_time_min: float
    total_vehicles_active: int


class CityState(BaseModel):
    nodes: List[Node]
    locations: List[Location]
    roads: List[Road]
    emergency_vehicles: List[EmergencyVehicle]
    incidents: List[Incident]
    metrics: CitySummaryMetrics
    timestamp: str
