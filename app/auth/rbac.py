"""
Role-Based Access Control — decorators and utilities.
"""
from functools import wraps
from fastapi import HTTPException, status
from app.models.user import UserRole


def require_roles(*allowed_roles: UserRole):
    """
    Dependency wrapper that checks if the current user has one of the allowed roles.

    Usage in a route:
        @router.get("/admin-only")
        async def admin_panel(user = Depends(require_roles(UserRole.ADMIN))):
            ...
    """
    from app.auth.dependencies import get_current_user
    from fastapi import Depends

    async def role_checker(user=Depends(get_current_user)):
        if user.role not in [r.value for r in allowed_roles]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {[r.value for r in allowed_roles]}",
            )
        return user

    return role_checker


def admin_only():
    """Shortcut for admin-only access."""
    return require_roles(UserRole.ADMIN)
