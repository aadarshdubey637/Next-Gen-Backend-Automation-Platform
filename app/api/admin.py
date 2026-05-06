"""
Admin endpoints — user management, system stats, schema management.
"""
from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.postgresql import get_db
from app.models.user import User, UserRole
from app.models.schema_registry import SchemaRegistry
from app.schemas.user import UserRead, UserUpdate
from app.auth.rbac import admin_only
from app.core.route_builder import get_registered_routes
import os
import time
from app.config import settings

router = APIRouter(prefix="/api/v1/admin", tags=["Admin"])


@router.get("/monitoring")
async def get_monitoring_data(
    current_user: Any = Depends(admin_only()),
):
    """Get real-time monitoring data (admin only)."""
    # 1. Fetch recent logs from app.log
    logs = []
    log_file = settings.LOG_FILE
    if os.path.exists(log_file):
        try:
            with open(log_file, "r") as f:
                # Read last 50 lines
                lines = f.readlines()[-50:]
                for line in lines:
                    # Basic parsing of loguru format: {time} | {level} | {request_id} | {message}
                    parts = line.strip().split(" | ")
                    if len(parts) >= 4:
                        logs.append({
                            "time": parts[0].split(" ")[1][:8], # HH:MM:SS
                            "level": parts[1],
                            "request_id": parts[2],
                            "message": parts[3]
                        })
        except Exception as e:
            logs.append({"time": "ERROR", "message": f"Could not read logs: {str(e)}"})

    # 2. Mock metrics (In a real app, these would come from Prometheus/Redis)
    metrics = {
        "latency": f"{int(time.time() % 50 + 100)}ms",
        "throughput": f"{int(time.time() % 500 + 800)} req/m",
        "error_rate": f"{(time.time() % 0.05):.2f}%",
        "uptime": "99.99%"
    }

    # 3. System statuses
    systems = [
        {"name": "PostgreSQL", "status": "Healthy", "load": f"{int(time.time() % 30 + 10)}%"},
        {"name": "MongoDB", "status": "Healthy", "load": f"{int(time.time() % 20 + 5)}%"},
        {"name": "Redis Cache", "status": "Healthy", "load": f"{int(time.time() % 40 + 20)}%"},
        {"name": "AI Engine", "status": "Ready", "load": "0%"}
    ]

    return {
        "metrics": metrics,
        "logs": logs[::-1], # Newest first
        "systems": systems
    }


@router.get("/stats")
async def get_system_stats(
    db: AsyncSession = Depends(get_db),
    current_user: Any = Depends(admin_only()),
):
    """Get system-wide statistics (admin only)."""
    # Count users
    user_count = (await db.execute(select(func.count(User.id)))).scalar()
    active_users = (
        await db.execute(select(func.count(User.id)).where(User.is_active == True))
    ).scalar()

    # Count schemas
    schema_count = (
        await db.execute(
            select(func.count(SchemaRegistry.id)).where(SchemaRegistry.is_active == True)
        )
    ).scalar()

    # Dynamic routes
    dynamic_routes = get_registered_routes()

    return {
        "status": "Healthy",
        "uptime_seconds": int(time.time() % 3600), # Mock
        "users": {
            "total": user_count,
            "active": active_users,
        },
        "schemas": {
            "total": schema_count,
        },
        "dynamic_routes": {
            "count": len(dynamic_routes),
            "resources": list(dynamic_routes.keys()),
        },
    }


@router.get("/users", response_model=list[UserRead])
async def list_users(
    db: AsyncSession = Depends(get_db),
    current_user: Any = Depends(admin_only()),
):
    """List all users (admin only)."""
    result = await db.execute(select(User))
    return result.scalars().all()


@router.put("/users/{user_id}", response_model=UserRead)
async def update_user(
    user_id: str,
    body: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Any = Depends(admin_only()),
):
    """Update a user (admin only)."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(user, key, value)

    await db.commit()
    await db.refresh(user)
    return user


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Any = Depends(admin_only()),
):
    """Deactivate a user account (admin only)."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
    if user.id == current_user.id:
        raise HTTPException(400, "Cannot deactivate your own account")

    user.is_active = False
    await db.commit()
    return None


@router.get("/routes")
async def list_dynamic_routes(
    current_user: User = Depends(admin_only()),
):
    """List all dynamically generated API routes."""
    return get_registered_routes()
