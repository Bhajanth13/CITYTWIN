"""Decision & Intervention Evaluation API Routes."""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any, Optional

from app.models.city import CityState
from app.decision.intervention_engine import intervention_engine, DynamicSimulationParams

router = APIRouter(prefix="/api/decision", tags=["Decision & Recommendation Engine"])


class ApplyInterventionRequest(BaseModel):
    option_id: str = "OPTION_C"


@router.get("/evaluate")
async def evaluate_interventions_get() -> Dict[str, Any]:
    """Returns candidate interventions evaluation with baseline settings."""
    return intervention_engine.evaluate_interventions(DynamicSimulationParams())


@router.post("/evaluate")
async def evaluate_interventions_post(params: DynamicSimulationParams) -> Dict[str, Any]:
    """Dynamically calculates candidate interventions for exact slider parameters."""
    return intervention_engine.evaluate_interventions(params)


@router.post("/apply", response_model=CityState)
async def apply_intervention(payload: ApplyInterventionRequest = ApplyInterventionRequest()):
    """Applies the selected intervention to the active city network."""
    return intervention_engine.apply_intervention(payload.option_id)
