from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.health import router as health_router
from app.routes.city import router as city_router
from app.routes.simulation import router as simulation_router
from app.routes.routing import router as routing_router
from app.routes.decision import router as decision_router
from app.routes.citizen import router as citizen_router

app = FastAPI(
    title="CITYTWIN API",
    description="Integrated Smart City Simulation & Decision Support Platform API",
    version="0.1.0",
)

# Configure CORS so the React frontend (running locally on Vite) can communicate with this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register route modules
app.include_router(health_router)
app.include_router(city_router)
app.include_router(simulation_router)
app.include_router(routing_router)
app.include_router(decision_router)
app.include_router(citizen_router)





@app.get("/")
async def root():
    """Root endpoint for quick verification."""
    return {
        "message": "Welcome to CITYTWIN API",
        "documentation": "/docs",
        "health": "/api/health",
    }
