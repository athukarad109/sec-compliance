"""
Requirement Clusters API Routes
Simple endpoint to fetch all data from requirement_clusters table
"""

import json
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from ...database import db

router = APIRouter(prefix="/requirement-clusters", tags=["requirement-clusters"])

@router.get("/test")
async def test_endpoint():
    """Simple test endpoint to verify the router is working"""
    return {"message": "Requirement clusters router is working", "status": "ok"}

@router.get("/all")
async def get_all_requirement_clusters():
    """
    Fetch all data from requirement_clusters table
    Returns all clusters for frontend rendering
    """
    try:
        print("Starting requirement clusters fetch...")
        await db.connect()
        print("Database connected successfully")
        prisma = db.get_client()
        print("Prisma client obtained")
        
        # Fetch all requirement clusters from database - simple query
        print("Fetching clusters from database...")
        clusters = await prisma.requirementcluster.find_many()
        print(f"Found {len(clusters)} clusters")
        
        # Convert Prisma objects to dictionaries
        clusters_data = []
        for i, cluster in enumerate(clusters):
            try:
                cluster_dict = {
                    "id": cluster.id,
                    "clusterId": cluster.clusterId,
                    "policy": cluster.policy,
                    "requirements": cluster.requirements,
                    "count": cluster.count,
                    "averageConfidence": cluster.averageConfidence,
                    "createdAt": cluster.createdAt.isoformat() if cluster.createdAt else None
                }
                clusters_data.append(cluster_dict)
                if i < 3:  # Log first 3 clusters for debugging
                    print(f"Processed cluster {i}: {cluster_dict['id']}")
            except Exception as cluster_error:
                print(f"Error processing cluster {i}: {cluster_error}")
                continue
        
        print(f"Successfully processed {len(clusters_data)} clusters")
        await db.disconnect()
        print("Database disconnected")
        
        return {
            "success": True,
            "total_clusters": len(clusters_data),
            "clusters": clusters_data
        }
        
    except Exception as e:
        print(f"Error fetching requirement clusters: {e}")
        print(f"Error type: {type(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch requirement clusters: {str(e)}")
    finally:
        try:
            await db.disconnect()
        except:
            pass

@router.get("/count")
async def get_clusters_count():
    """
    Get the total count of requirement clusters
    """
    try:
        await db.connect()
        prisma = db.get_client()
        
        count = await prisma.requirementcluster.count()
        
        await db.disconnect()
        
        return {
            "success": True,
            "total_count": count
        }
        
    except Exception as e:
        print(f"Error getting clusters count: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get clusters count: {str(e)}")
    finally:
        await db.disconnect()
