"""
Notification model — SQLAlchemy ORM for PostgreSQL.
"""
import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Text, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column
from app.db.postgresql import Base
import enum

class NotificationType(str, enum.Enum):
    SUCCESS = "success"
    WARNING = "warning"
    ERROR = "error"
    INFO = "info"

class NotificationCategory(str, enum.Enum):
    SYSTEM = "system"
    BILLING = "billing"
    ALERT = "alert"

class NotificationPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[str] = mapped_column(
        SAEnum(NotificationType), default=NotificationType.INFO, nullable=False
    )
    category: Mapped[str] = mapped_column(
        SAEnum(NotificationCategory), default=NotificationCategory.SYSTEM, nullable=False
    )
    priority: Mapped[str] = mapped_column(
        SAEnum(NotificationPriority), default=NotificationPriority.LOW, nullable=False
    )
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<Notification {self.title} for User {self.user_id}>"
