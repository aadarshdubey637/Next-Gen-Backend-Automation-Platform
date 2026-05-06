"""
Background tasks for periodic checks (trial expiry, etc.)
"""
import asyncio
from datetime import datetime, timedelta
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.postgresql import async_session
from app.models.user import User
from app.models.notification import NotificationType, NotificationCategory, NotificationPriority
from app.core.notifications import create_notification
from loguru import logger

async def check_trial_expiries():
    """
    Periodic task to check for users whose free trial is about to expire.
    """
    logger.info("🕒 Running periodic check for trial expiries...")
    
    async with async_session() as db:
        try:
            # 1. Trial ending in 3 days
            three_days_from_now = datetime.utcnow() + timedelta(days=3)
            
            # Find users whose trial ends exactly in ~3 days and haven't been notified
            query = select(User).where(
                User.trial_ends_at <= three_days_from_now,
                User.trial_ends_at > datetime.utcnow()
            )
            result = await db.execute(query)
            users_to_notify = result.scalars().all()

            for user in users_to_notify:
                await create_notification(
                    db,
                    user.id,
                    title="Trial Ending Soon!",
                    message="Your free trial will expire in 3 days. Upgrade to Pro to keep your APIs live.",
                    notification_type=NotificationType.WARNING,
                    category=NotificationCategory.SYSTEM,
                    priority=NotificationPriority.HIGH
                )
            
            await db.commit()
            logger.info(f"✅ Trial expiry check complete. Notified {len(users_to_notify)} users.")
            
        except Exception as e:
            logger.error(f"Error in background task: {str(e)}")
            await db.rollback()

async def start_periodic_tasks():
    """Run background tasks in a loop."""
    while True:
        await check_trial_expiries()
        # Run every 24 hours
        await asyncio.sleep(24 * 3600)
