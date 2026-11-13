from fastapi import FastAPI
from app.models import RouteRequest
from app.agents.route_agent import RouteAgent

app = FastAPI(
    title="Agentic Maritime Brokerage Platform",
    description="AI-powered maritime freight quotation platform",
    version="1.0.0"
)

route_agent = RouteAgent(".")


@app.get("/")
def home():
    return {
        "message": "Agentic Maritime Brokerage API is running",
        "project": "Maritime Freight Quotation Platform",
        "milestone": "Milestone 1 - Route Intelligence"
    }


@app.post("/analyze-route")
def analyze_route(request: RouteRequest):
    return route_agent.analyze_route(
        request.origin,
        request.destination,
        request.cargo_type,
        request.containers
    )