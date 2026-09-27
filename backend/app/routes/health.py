from datetime import datetime, timezone
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api", tags=["System Health"])


class HealthResponse(BaseModel):
    status: str
    system: str
    subtitle: str
    version: str
    milestone: str
    city_status: str
    timestamp: str
    modules: dict[str, str]


@router.get("/health", response_model=HealthResponse)
async def get_health():
    """Returns baseline system health and readiness status."""
    return HealthResponse(
        status="online",
        system="CITYTWIN",
        subtitle="Integrated Smart City Simulation & Decision Support Platform",
        version="0.1.0",
        milestone="Milestone 1 — Baseline Setup & Health Check",
        city_status="CITY SYSTEM ONLINE",
        timestamp=datetime.now(timezone.utc).isoformat(),
        modules={
            "traffic_mobility": "initialized",
            "emergency_response": "initialized",
            "environmental_monitoring": "initialized",
            "citizen_engagement": "initialized",
        },
    )
