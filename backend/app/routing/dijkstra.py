"""
Dijkstra Pathfinding Algorithm for CITYTWIN.
Computes distance-optimal and travel-time-optimal routes across the city road network.
"""

import heapq
from typing import Dict, List, Optional, Tuple, Any
from app.models.city import Road, Node


def find_shortest_path(
    nodes: Dict[str, Node],
    roads: Dict[str, Road],
    start_node_id: str,
    end_node_id: str,
    weight_mode: str = "time",  # "time" or "distance"
    emergency_priority: bool = False
) -> Dict[str, Any]:
    """
    Executes Dijkstra's algorithm to find the optimal route from start_node_id to end_node_id.

    Parameters:
    - weight_mode: "time" minimizes minutes using BPR formula; "distance" minimizes kilometers.
    - emergency_priority: if True, applies an emergency discount (priority green lights / sirens)
      to clear lanes faster, reducing transit time by ~35%.
    """
    if start_node_id not in nodes or end_node_id not in nodes:
        return {
            "found": False,
            "error": "Start or destination node does not exist",
            "path": [],
            "road_ids": [],
            "total_distance_km": 0.0,
            "total_time_min": 0.0,
        }

    # Build adjacency list: node_id -> list of (neighbor_id, road)
    adjacency: Dict[str, List[Tuple[str, Road]]] = {nid: [] for nid in nodes}
    for road in roads.values():
        adjacency[road.start_node].append((road.end_node, road))
        adjacency[road.end_node].append((road.start_node, road))

    # Priority queue entries: (cost, current_node, [node_path], [road_ids])
    queue: List[Tuple[float, str, List[str], List[str]]] = [(0.0, start_node_id, [start_node_id], [])]
    visited: Dict[str, float] = {}

    while queue:
        current_cost, current_node, path, road_ids = heapq.heappop(queue)

        if current_node in visited and visited[current_node] <= current_cost:
            continue
        visited[current_node] = current_cost

        # Destination reached
        if current_node == end_node_id:
            # Recompute exact summary totals for the discovered path
            traversed_roads = [roads[rid] for rid in road_ids if rid in roads]
            total_dist = sum(r.length_km for r in traversed_roads)
            
            raw_time = sum(r.travel_time_min for r in traversed_roads)
            if emergency_priority:
                # Emergency corridor sirens & signal priority yield faster transit
                effective_time = raw_time * 0.65
            else:
                effective_time = raw_time

            return {
                "found": True,
                "path": path,
                "road_ids": road_ids,
                "total_distance_km": round(total_dist, 2),
                "total_time_min": round(effective_time, 2),
                "emergency_priority_applied": emergency_priority,
                "segments": [
                    {
                        "road_id": r.id,
                        "name": r.name,
                        "length_km": r.length_km,
                        "congestion_level": r.congestion_level,
                        "speed_kmh": r.average_speed,
                        "travel_time_min": r.travel_time_min,
                        "is_blocked": r.is_blocked
                    }
                    for r in traversed_roads
                ]
            }

        for neighbor, road in adjacency.get(current_node, []):
            if road.is_blocked:
                edge_cost = 9999.0  # Impassable blocked corridor penalty
            elif weight_mode == "distance":
                edge_cost = road.length_km
            else:
                # Weight by travel time
                base_time = road.travel_time_min
                edge_cost = base_time * 0.65 if emergency_priority else base_time

            next_cost = current_cost + edge_cost
            if neighbor not in visited or next_cost < visited[neighbor]:
                heapq.heappush(queue, (next_cost, neighbor, path + [neighbor], road_ids + [road.id]))

    return {
        "found": False,
        "error": "No viable route found connecting nodes",
        "path": [],
        "road_ids": [],
        "total_distance_km": 0.0,
        "total_time_min": 0.0,
    }
