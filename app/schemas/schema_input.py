"""
Pydantic schemas for schema input — what the user submits to generate a backend.
"""
from pydantic import BaseModel, Field
from typing import Optional, Literal, Any
from enum import Enum


class FieldType(str, Enum):
    STRING = "string"
    INTEGER = "integer"
    FLOAT = "float"
    BOOLEAN = "boolean"
    DATETIME = "datetime"
    DATE = "date"
    TEXT = "text"
    EMAIL = "email"
    UUID = "uuid"
    JSON = "json"
    ARRAY = "array"


class FieldDefinition(BaseModel):
    """Single field within a schema."""
    name: str = Field(..., description="Field name (snake_case)")
    field_type: FieldType = Field(..., description="Data type of the field")
    required: bool = Field(True, description="Whether the field is required")
    unique: bool = Field(False, description="Whether the field must be unique")
    indexed: bool = Field(False, description="Whether to create an index")
    default: Optional[Any] = Field(None, description="Default value (type matched to field_type)")
    description: Optional[str] = Field(None, description="Field description")
    max_length: Optional[int] = Field(None, description="Max length for strings")
    min_value: Optional[float] = Field(None, description="Min value for numbers")
    max_value: Optional[float] = Field(None, description="Max value for numbers")
    options: Optional[list[str]] = Field(None, description="Allowed values for enum fields")


class SchemaInput(BaseModel):
    """
    The user-submitted schema that drives code generation.
    Supports JSON schema, form-based input, or AI-generated output.
    """
    name: str = Field(..., description="Resource name (e.g., 'Product', 'BlogPost')")
    description: Optional[str] = Field(None, description="What this resource represents")
    fields: list[FieldDefinition] = Field(..., description="List of fields")
    db_type: Literal["postgresql", "mongodb", "mysql"] = Field(
        "postgresql", description="Target database"
    )
    enable_auth: bool = Field(True, description="Require authentication for CRUD")
    enable_soft_delete: bool = Field(False, description="Use soft-delete instead of hard-delete")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "name": "Product",
                    "description": "E-commerce product catalog",
                    "fields": [
                        {"name": "title", "field_type": "string", "required": True, "max_length": 200},
                        {"name": "price", "field_type": "float", "required": True, "min_value": 0},
                        {"name": "description", "field_type": "text", "required": False},
                        {"name": "in_stock", "field_type": "boolean", "required": False, "default": "true"},
                        {"name": "sku", "field_type": "string", "required": True, "unique": True},
                    ],
                    "db_type": "postgresql",
                    "enable_auth": True,
                    "enable_soft_delete": True,
                }
            ]
        }
    }


class SchemaFromPrompt(BaseModel):
    """Plain English prompt that the AI engine converts into a SchemaInput."""
    prompt: str = Field(
        ...,
        description="Natural language description of the backend you want",
        min_length=10,
        max_length=2000,
    )
    db_type: Literal["postgresql", "mongodb", "mysql"] = Field("postgresql")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "prompt": "Create a blog system with posts, categories, and tags. Posts should have a title, content, author, published date, and status (draft/published).",
                    "db_type": "postgresql",
                }
            ]
        }
    }


class GeneratedAPIResponse(BaseModel):
    """Response after successful API generation."""
    schema_id: str
    name: str
    endpoints: list[dict]
    message: str
    db_type: str
