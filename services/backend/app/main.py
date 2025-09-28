from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import health
from app.api.parser.routes_simple import router as regtech_router

app = FastAPI(title="SEC Compliance RegTech Platform")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

app.include_router(health.router, prefix="/health")
app.include_router(regtech_router, prefix="/regtech", tags=["regtech"])
