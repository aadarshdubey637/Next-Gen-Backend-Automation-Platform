"""
Notification endpoints — fetch, mark as read, and delete notifications.
"""
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update, delete, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.postgresql import get_db
from app.models.notification import Notification
from app.schemas.notification import NotificationRead, NotificationUpdate
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/api/v1/notifications", tags=["Notifications"])

@router.get("/", response_model=List[NotificationRead])
async def get_notifications(
    db: AsyncSession = Depends(get_db),
    current_user: Any = Depends(get_current_user),
    limit: int = 20,
    unread_only: bool = False
):
    """Fetch recent notifications for the current user."""
    query = select(Notification).where(Notification.user_id == current_user.id)
    
    if unread_only:
        query = query.where(Notification.is_read == False)
    
    query = query.order_by(desc(Notification.created_at)).limit(limit)
    
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/unread-count")
async def get_unread_count(
    db: AsyncSession = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    """Get the count of unread notifications."""
    from sqlalchemy import func
    query = select(func.count(Notification.id)).where(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    )
    result = await db.execute(query)
    return {"count": result.scalar()}

@router.patch("/{notification_id}", response_model=NotificationRead)
async def update_notification(
    notification_id: str,
    update_data: NotificationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    """Update a notification (e.g., mark as read)."""
    # Check if notification exists and belongs to user
    query = select(Notification).where(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    )
    result = await db.execute(query)
    notification = result.scalar_one_or_none()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    if update_data.is_read is not None:
        notification.is_read = update_data.is_read
    
    await db.commit()
    await db.refresh(notification)
    return notification

@router.post("/mark-all-read")
async def mark_all_read(
    db: AsyncSession = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    """Mark all notifications as read for the current user."""
    await db.execute(
        update(Notification)
        .where(Notification.user_id == current_user.id)
        .values(is_read=True)
    )
    await db.commit()
    return {"message": "All notifications marked as read"}

@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_notification(
    notification_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    """Delete a notification."""
    await db.execute(
        delete(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == current_user.id
        )
    )
    await db.commit()
    return None
