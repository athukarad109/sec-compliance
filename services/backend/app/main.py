from fastapi import FastAPI
from app.api import health
from app.api.parser import router as parser_router

app = FastAPI(title="SEC Compliance Hackathon App")

app.include_router(health.router, prefix="/health")
app.include_router(parser_router, prefix="/parser", tags=["parser"])
