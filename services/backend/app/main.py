from fastapi import FastAPI
from app.api import health

app = FastAPI(title="SEC Compliance Hackathon App")

app.include_router(health.router, prefix="/health")
