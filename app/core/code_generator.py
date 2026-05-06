"""
Code Generator — takes a SchemaInput and produces:
  1. SQLAlchemy model (for PostgreSQL)
  2. Pydantic schemas (Create/Read/Update)
  3. MongoDB collection setup
  4. Metadata for the route builder

This is the engine that turns schema definitions into runnable code.
"""
from typing import Any
from app.schemas.schema_input import SchemaInput, FieldDefinition, FieldType
from loguru import logger


# ── SQLAlchemy type mapping ─────────────────────────────
SA_TYPE_MAP = {
    FieldType.STRING: "String({max_length})" if True else "String(255)",
    FieldType.INTEGER: "Integer",
    FieldType.FLOAT: "Float",
    FieldType.BOOLEAN: "Boolean",
    FieldType.DATETIME: "DateTime",
    FieldType.TEXT: "Text",
    FieldType.EMAIL: "String(255)",
    FieldType.UUID: "String(36)",
    FieldType.JSON: "JSON",
    FieldType.ARRAY: "JSON",  # Store arrays as JSON in SQL
}

# ── Python type mapping ────────────────────────────────
PYTHON_TYPE_MAP = {
    FieldType.STRING: "str",
    FieldType.INTEGER: "int",
    FieldType.FLOAT: "float",
    FieldType.BOOLEAN: "bool",
    FieldType.DATETIME: "datetime",
    FieldType.TEXT: "str",
    FieldType.EMAIL: "EmailStr",
    FieldType.UUID: "str",
    FieldType.JSON: "dict",
    FieldType.ARRAY: "list",
}

# ── Pydantic type mapping ──────────────────────────────
PYDANTIC_TYPE_MAP = {
    FieldType.STRING: "str",
    FieldType.INTEGER: "int",
    FieldType.FLOAT: "float",
    FieldType.BOOLEAN: "bool",
    FieldType.DATETIME: "datetime",
    FieldType.TEXT: "str",
    FieldType.EMAIL: "EmailStr",
    FieldType.UUID: "str",
    FieldType.JSON: "dict[str, Any]",
    FieldType.ARRAY: "list[Any]",
}


def generate_sqlalchemy_model(schema: SchemaInput) -> str:
    """Generate a SQLAlchemy ORM model class as a Python source string."""
    class_name = _to_pascal(schema.name)
    table_name = _to_snake(schema.name) + "s"

    lines = [
        '"""Auto-generated SQLAlchemy model for {name}."""'.format(name=schema.name),
        "import uuid",
        "from datetime import datetime",
        "from sqlalchemy import String, Integer, Float, Boolean, DateTime, Text, JSON",
        "from sqlalchemy.orm import Mapped, mapped_column",
        "from app.db.postgresql import Base",
        "",
        "",
        f"class {class_name}(Base):",
        f'    __tablename__ = "{table_name}"',
        "",
        '    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))',
    ]

    for field in schema.fields:
        lines.append(_generate_sa_column(field))

    if schema.enable_soft_delete:
        lines.append("    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)")
        lines.append("    deleted_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)")

    lines.append("")
    lines.append(f'    def __repr__(self): return f"<{class_name} {{self.id}}>"\n')

    return "\n".join(lines)


def _generate_sa_column(field: FieldDefinition) -> str:
    """Generate a single SQLAlchemy column line."""
    python_type = PYTHON_TYPE_MAP.get(field.field_type, "str")
    sa_type = _get_sa_type(field)

    parts = [f"    {field.name}: Mapped[{python_type}] = mapped_column({sa_type}"]

    if field.unique:
        parts.append(", unique=True")
    if field.indexed:
        parts.append(", index=True")
    if not field.required:
        parts.append(", nullable=True")
    if field.default is not None:
        if field.field_type == FieldType.BOOLEAN:
            val = str(field.default).capitalize()
            parts.append(f", default={val}")
        elif field.field_type in (FieldType.INTEGER, FieldType.FLOAT):
            parts.append(f", default={field.default}")
        else:
            parts.append(f', default="{field.default}"')

    parts.append(")")
    return "".join(parts)


def _get_sa_type(field: FieldDefinition) -> str:
    """Get the SQLAlchemy column type string."""
    if field.field_type == FieldType.STRING:
        length = field.max_length or 255
        return f"String({length})"
    if field.field_type == FieldType.EMAIL:
        return "String(255)"
    if field.field_type == FieldType.UUID:
        return "String(36)"
    return {
        FieldType.INTEGER: "Integer",
        FieldType.FLOAT: "Float",
        FieldType.BOOLEAN: "Boolean",
        FieldType.DATETIME: "DateTime",
        FieldType.TEXT: "Text",
        FieldType.JSON: "JSON",
        FieldType.ARRAY: "JSON",
    }.get(field.field_type, "String(255)")


def generate_pydantic_schemas(schema: SchemaInput) -> str:
    """Generate Pydantic Create/Read/Update schemas as Python source."""
    class_name = _to_pascal(schema.name)

    lines = [
        '"""Auto-generated Pydantic schemas for {name}."""'.format(name=schema.name),
        "from pydantic import BaseModel, EmailStr, Field",
        "from typing import Optional, Any",
        "from datetime import datetime",
        "",
        "",
    ]

    # ── Create schema ──
    lines.append(f"class {class_name}Create(BaseModel):")
    for field in schema.fields:
        if field.name in ("created_at", "updated_at", "deleted_at"):
            continue
        ptype = PYDANTIC_TYPE_MAP.get(field.field_type, "str")
        if not field.required:
            ptype = f"Optional[{ptype}]"
        default = _pydantic_default(field)
        lines.append(f"    {field.name}: {ptype}{default}")
    lines.append("")
    lines.append("")

    # ── Read schema ──
    lines.append(f"class {class_name}Read(BaseModel):")
    lines.append("    id: str")
    for field in schema.fields:
        ptype = PYDANTIC_TYPE_MAP.get(field.field_type, "str")
        if not field.required:
            ptype = f"Optional[{ptype}]"
        lines.append(f"    {field.name}: {ptype} = None")
    if schema.enable_soft_delete:
        lines.append("    is_deleted: bool = False")
    lines.append('    model_config = {"from_attributes": True}')
    lines.append("")
    lines.append("")

    # ── Update schema ──
    lines.append(f"class {class_name}Update(BaseModel):")
    for field in schema.fields:
        if field.name in ("created_at", "updated_at", "deleted_at"):
            continue
        ptype = PYDANTIC_TYPE_MAP.get(field.field_type, "str")
        lines.append(f"    {field.name}: Optional[{ptype}] = None")
    lines.append("")

    return "\n".join(lines)


def generate_mongo_collection_info(schema: SchemaInput) -> dict:
    """Generate MongoDB collection metadata and index definitions."""
    collection_name = _to_snake(schema.name) + "s"

    indexes = []
    for field in schema.fields:
        if field.unique:
            indexes.append({"key": field.name, "unique": True})
        elif field.indexed:
            indexes.append({"key": field.name, "unique": False})

    return {
        "collection_name": collection_name,
        "indexes": indexes,
        "schema_validation": _generate_mongo_validator(schema),
    }


def _generate_mongo_validator(schema: SchemaInput) -> dict:
    """Generate a MongoDB JSON Schema validator."""
    mongo_type_map = {
        FieldType.STRING: "string",
        FieldType.INTEGER: "int",
        FieldType.FLOAT: "double",
        FieldType.BOOLEAN: "bool",
        FieldType.DATETIME: "date",
        FieldType.TEXT: "string",
        FieldType.EMAIL: "string",
        FieldType.UUID: "string",
        FieldType.JSON: "object",
        FieldType.ARRAY: "array",
    }

    properties = {}
    required = []

    for field in schema.fields:
        bson_type = mongo_type_map.get(field.field_type, "string")
        prop: dict[str, Any] = {"bsonType": bson_type}
        if field.description:
            prop["description"] = field.description
        properties[field.name] = prop
        if field.required:
            required.append(field.name)

    return {
        "$jsonSchema": {
            "bsonType": "object",
            "required": required,
            "properties": properties,
        }
    }


def generate_endpoint_metadata(schema: SchemaInput) -> list[dict]:
    """Return metadata about the CRUD endpoints that will be created."""
    resource = _to_snake(schema.name)
    prefix = f"/api/v1/{resource}s/"

    return [
        {"method": "POST", "path": prefix, "description": f"Create a new {schema.name}"},
        {"method": "GET", "path": prefix, "description": f"List all {schema.name}s (paginated)"},
        {"method": "GET", "path": f"{prefix}{{item_id}}", "description": f"Get a single {schema.name} by ID"},
        {"method": "PUT", "path": f"{prefix}{{item_id}}", "description": f"Update a {schema.name} by ID"},
        {"method": "DELETE", "path": f"{prefix}{{item_id}}", "description": f"Delete a {schema.name} by ID"},
    ]


def _pydantic_default(field: FieldDefinition) -> str:
    """Return the default value expression for a Pydantic field."""
    if field.default is not None:
        if field.field_type == FieldType.BOOLEAN:
            # Handle both string "true"/"false" and actual bool True/False
            val = str(field.default).capitalize()
            return f" = {val}"
        elif field.field_type in (FieldType.INTEGER, FieldType.FLOAT):
            return f" = {field.default}"
        else:
            return f' = "{field.default}"'
    if not field.required:
        return " = None"
    return ""


def _to_pascal(name: str) -> str:
    """Convert to PascalCase."""
    return "".join(word.capitalize() for word in name.replace("-", "_").split("_"))


def _to_snake(name: str) -> str:
    """Convert to snake_case."""
    import re
    s1 = re.sub(r"(.)([A-Z][a-z]+)", r"\1_\2", name)
    return re.sub(r"([a-z0-9])([A-Z])", r"\1_\2", s1).lower().replace("-", "_")
