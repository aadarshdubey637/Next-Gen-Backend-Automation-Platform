"""
Helper functions for creating notifications.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.notification import Notification, NotificationType, NotificationCategory, NotificationPriority
from loguru import logger

async def create_notification(
    db: AsyncSession,
    user_id: str,
    title: str,
    message: str,
    notification_type: NotificationType = NotificationType.INFO,
    category: NotificationCategory = NotificationCategory.SYSTEM,
    priority: NotificationPriority = NotificationPriority.LOW
):
    """Create a new notification for a user."""
    try:
        notification = Notification(
            user_id=user_id,
            title=title,
            message=message,
            type=notification_type,
            category=category,
            priority=priority
        )
        db.add(notification)
        await db.flush() # Ensure it's ready to be committed with the main transaction
        logger.info(f"🔔 Notification created for user {user_id}: {title}")
        return notification
    except Exception as e:
        logger.error(f"Failed to create notification: {str(e)}")
        return None
