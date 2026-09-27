"""Graph Routing API Routes."""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, Dict, Any

from app.routing.dijkstra import find_shortest_path
from app.services.city_service import city_service
from app.services.simulation_service import simulation_service

router = APIRouter(prefix="/api/routing", tags=["Dijkstra Routing Engine"])


class RouteRequest(BaseModel):
    start_node: str = "NODE_WEST_GATE"
    end_node: str = "NODE_HOSPITAL"
    weight_mode: str = "time"  # "time" or "distance"
    emergency_priority: bool = False


class EmergencyRouteRequest(BaseModel):
    priority: bool = False


@router.post("/calculate")
async def calculate_route(payload: RouteRequest) -> Dict[str, Any]:
    """Calculates optimal path using Dijkstra algorithm across the city graph."""
    return find_shortest_path(
        nodes=city_service.nodes,
        roads=city_service.roads,
        start_node_id=payload.start_node,
        end_node_id=payload.end_node,
        weight_mode=payload.weight_mode,
        emergency_priority=payload.emergency_priority
    )


@router.post("/emergency")
async def get_emergency_route(payload: EmergencyRouteRequest = EmergencyRouteRequest()) -> Dict[str, Any]:
    """Computes ambulance emergency response route from Station to Hospital."""
    return simulation_service.update_emergency_route(priority=payload.priority)
