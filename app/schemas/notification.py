"""
Pydantic schemas for Notification domain.
"""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.models.notification import NotificationType, NotificationCategory, NotificationPriority

class NotificationCreate(BaseModel):
    user_id: str
    title: str
    message: str
    type: NotificationType = NotificationType.INFO
    category: NotificationCategory = NotificationCategory.SYSTEM
    priority: NotificationPriority = NotificationPriority.LOW

class NotificationRead(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    type: NotificationType
    category: NotificationCategory
    priority: NotificationPriority
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}

class NotificationUpdate(BaseModel):
    is_read: Optional[bool] = None
