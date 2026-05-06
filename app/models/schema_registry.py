"""
Schema Registry — stores user-defined schemas that drive API generation.
"""
import uuid
from datetime import datetime
from sqlalchemy import String, Text, DateTime, JSON, Integer
from sqlalchemy.orm import Mapped, mapped_column
from app.db.postgresql import Base


class SchemaRegistry(Base):
    __tablename__ = "schema_registry"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    schema_definition: Mapped[dict] = mapped_column(JSON, nullable=False)
    db_type: Mapped[str] = mapped_column(
        String(20), default="postgresql", nullable=False
    )  # "postgresql" or "mongodb"
    enable_soft_delete: Mapped[bool] = mapped_column(default=False)
    
    # Versioning & Change Detection
    version: Mapped[int] = mapped_column(Integer, default=1)
    schema_hash: Mapped[str] = mapped_column(String(64), nullable=True) # SHA-256 of the fields
    
    owner_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    def __repr__(self):
        return f"<Schema {self.name} [{self.db_type}]>"
