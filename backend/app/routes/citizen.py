"""Citizen Engagement & Incident Reporting API Routes."""

from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime, timezone
from typing import Dict, Any, List

from app.models.city import Incident, CityState
from app.services.city_service import city_service
from app.decision.intervention_engine import intervention_engine

router = APIRouter(prefix="/api/citizen", tags=["Citizen Engagement"])


class CitizenReportRequest(BaseModel):
    issue_type: str = "accident"  # accident, road_closure, hazard, heavy_jam
    location_id: str = "LOC_MARKET"
    severity: str = "MEDIUM"      # LOW, MEDIUM, HIGH
    description: str = "Vehicle stalled causing heavy queue on arterial."


@router.post("/report")
async def submit_citizen_report(payload: CitizenReportRequest) -> Dict[str, Any]:
    """Submits a citizen report, registering it into the smart city operations log."""
    new_inc = Incident(
        id=f"CITIZEN_{int(datetime.now().timestamp())}",
        type=payload.issue_type,
        location_node=payload.location_id,
        affected_road_id="ROAD_F",  # maps to nearby road
        severity=payload.severity,
        active=True,
        description=f"[CITIZEN REPORT] {payload.description}",
        timestamp=datetime.now(timezone.utc).isoformat()
    )
    city_service.incidents.append(new_inc)

    return {
        "status": "success",
        "message": "Citizen report successfully logged and dispatched to City Operations Center.",
        "incident": new_inc
    }


@router.get("/alerts")
async def get_citizen_alerts() -> Dict[str, Any]:
    """Returns active citizen warning alerts and roadside message board instructions."""
    eval_data = intervention_engine.evaluate_interventions()
    return {
        "citizen_alert": eval_data["citizen_alert"],
        "roadside_vms": eval_data["roadside_vms"],
        "total_active_incidents": len([i for i in city_service.incidents if i.active])
    }
