"""
Schema Parser — normalizes user input (JSON schema / form-based / AI-generated)
into a unified internal SchemaInput that the code generator can consume.
"""
import hashlib
import json
from typing import Any, List, Dict, Set, Tuple
from app.schemas.schema_input import SchemaInput, FieldDefinition, FieldType

def get_schema_hash(schema: SchemaInput) -> str:
    """Generate a stable SHA-256 hash of the schema fields to detect changes."""
    # Convert fields to a stable, sorted representation
    fields_data = []
    for f in sorted(schema.fields, key=lambda x: x.name):
        fields_data.append({
            "n": f.name,
            "t": f.field_type,
            "r": f.required,
            "u": f.unique,
            "i": f.indexed,
            "d": str(f.default) if f.default is not None else None
        })
    
    # Add other metadata that affects structure
    meta = {
        "name": schema.name,
        "soft_delete": schema.enable_soft_delete,
        "fields": fields_data
    }
    
    serialized = json.dumps(meta, sort_keys=True)
    return hashlib.sha256(serialized.encode()).hexdigest()


# ── Type mapping from common JSON schema types ──────────
JSON_TYPE_MAP = {
    "string": FieldType.STRING,
    "str": FieldType.STRING,
    "integer": FieldType.INTEGER,
    "int": FieldType.INTEGER,
    "number": FieldType.INTEGER, # Gracefully handle "number" as integer by default
    "float": FieldType.FLOAT,
    "decimal": FieldType.FLOAT,
    "double": FieldType.FLOAT,
    "boolean": FieldType.BOOLEAN,
    "bool": FieldType.BOOLEAN,
    "datetime": FieldType.DATE, # Normalize datetime to date as requested
    "date": FieldType.DATE,
    "timestamp": FieldType.DATE,
    "text": FieldType.TEXT,
    "longtext": FieldType.TEXT,
    "email": FieldType.EMAIL,
    "uuid": FieldType.UUID,
    "json": FieldType.JSON,
    "object": FieldType.JSON,
    "array": FieldType.ARRAY,
    "list": FieldType.ARRAY,
}


def parse_json_schema(raw: dict) -> SchemaInput:
    """
    Convert a raw JSON Schema-like dict into our internal SchemaInput.

    Accepts formats like:
    {
        "name": "Product",
        "fields": {
            "title": {"type": "string", "required": true},
            "price": {"type": "float", "min": 0}
        }
    }
    """
    name = raw.get("name") or raw.get("title", "Unnamed")
    description = raw.get("description")
    db_type = raw.get("db_type", "postgresql")
    enable_auth = raw.get("enable_auth", True)
    enable_soft_delete = raw.get("enable_soft_delete", False)

    fields: list[FieldDefinition] = []
    raw_fields = raw.get("fields", {})

    # Support both dict-style and list-style field definitions
    if isinstance(raw_fields, dict):
        for field_name, field_def in raw_fields.items():
            fields.append(_parse_field(field_name, field_def))
    elif isinstance(raw_fields, list):
        for item in raw_fields:
            if isinstance(item, dict) and "name" in item:
                fields.append(_parse_field(item["name"], item))
            elif isinstance(item, dict) and len(item) == 1:
                # Support [{ "field_name": { "type": "string" } }]
                fname, fdef = list(item.items())[0]
                fields.append(_parse_field(fname, fdef))
            else:
                logger.warning(f"Skipping invalid field definition: {item}")
    
    # If no fields were successfully parsed, add a default 'name' field to avoid failure
    if not fields:
        logger.info(f"No fields found for {name}, adding default 'name' field.")
        fields.append(FieldDefinition(name="name", field_type=FieldType.STRING))

    return SchemaInput(
        name=name,
        description=description,
        fields=fields,
        db_type=db_type,
        enable_auth=enable_auth,
        enable_soft_delete=enable_soft_delete,
    )


def _parse_field(name: str, definition: Any) -> FieldDefinition:
    """Parse a single field definition into FieldDefinition."""
    if isinstance(definition, str):
        # Simple shorthand: "title": "string"
        ftype = JSON_TYPE_MAP.get(definition.lower(), FieldType.STRING)
        return FieldDefinition(
            name=name,
            field_type=ftype,
        )

    if isinstance(definition, dict):
        raw_type = definition.get("type", definition.get("field_type", "string"))
        if not isinstance(raw_type, str):
            raw_type = "string"
            
        if raw_type.lower() not in JSON_TYPE_MAP:
            raise ValueError(f"Unsupported field type: '{raw_type}'")
            
        field_type = JSON_TYPE_MAP.get(raw_type.lower(), FieldType.STRING)

        return FieldDefinition(
            name=name,
            field_type=field_type,
            required=definition.get("required", True),
            unique=definition.get("unique", False),
            indexed=definition.get("indexed", False),
            default=definition.get("default"),
            description=definition.get("description"),
            max_length=definition.get("max_length") or definition.get("maxLength"),
            min_value=definition.get("min_value") or definition.get("min") or definition.get("minimum"),
            max_value=definition.get("max_value") or definition.get("max") or definition.get("maximum"),
        )

    # If all else fails, default to a string field
    logger.warning(f"Unknown field definition for '{name}': {definition}. Defaulting to string.")
    return FieldDefinition(name=name, field_type=FieldType.STRING)


def validate_schema(schema: SchemaInput) -> list[str]:
    """Return a list of validation warnings/errors."""
    issues = []
    if not schema.fields:
        issues.append("Schema has no fields defined.")
    seen_names = set()
    for f in schema.fields:
        if f.name in seen_names:
            issues.append(f"Duplicate field name: '{f.name}'")
        seen_names.add(f.name)
        if f.min_value is not None and f.max_value is not None:
            if f.min_value > f.max_value:
                issues.append(f"Field '{f.name}': min_value > max_value")
    return issues
    