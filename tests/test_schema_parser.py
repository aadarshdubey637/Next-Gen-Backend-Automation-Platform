"""
Tests for the Schema Parser module.
"""
import pytest
from app.core.schema_parser import parse_json_schema, validate_schema
from app.schemas.schema_input import FieldType


def test_parse_dict_style_fields():
    raw = {
        "name": "Product",
        "fields": {
            "title": {"type": "string", "required": True, "max_length": 200},
            "price": {"type": "float", "min": 0},
        },
    }
    schema = parse_json_schema(raw)
    assert schema.name == "Product"
    assert len(schema.fields) == 2
    assert schema.fields[0].name == "title"
    assert schema.fields[0].field_type == FieldType.STRING
    assert schema.fields[0].max_length == 200
    assert schema.fields[1].field_type == FieldType.FLOAT


def test_parse_list_style_fields():
    raw = {
        "name": "Task",
        "fields": [
            {"name": "title", "type": "string", "required": True},
            {"name": "done", "type": "boolean", "default": "false"},
        ],
    }
    schema = parse_json_schema(raw)
    assert schema.name == "Task"
    assert len(schema.fields) == 2
    assert schema.fields[1].default == "false"


def test_parse_shorthand_fields():
    raw = {
        "name": "Simple",
        "fields": {"name": "string", "age": "integer"},
    }
    schema = parse_json_schema(raw)
    assert schema.fields[0].field_type == FieldType.STRING
    assert schema.fields[1].field_type == FieldType.INTEGER


def test_validate_empty_fields():
    raw = {"name": "Empty", "fields": {}}
    schema = parse_json_schema(raw)
    issues = validate_schema(schema)
    assert any("no fields" in i.lower() for i in issues)


def test_validate_duplicate_fields():
    raw = {
        "name": "Dup",
        "fields": [
            {"name": "title", "type": "string"},
            {"name": "title", "type": "integer"},
        ],
    }
    schema = parse_json_schema(raw)
    issues = validate_schema(schema)
    assert any("duplicate" in i.lower() for i in issues)


def test_db_type_default():
    raw = {"name": "Test", "fields": {"x": "string"}}
    schema = parse_json_schema(raw)
    assert schema.db_type == "postgresql"


def test_db_type_mongodb():
    raw = {"name": "Test", "fields": {"x": "string"}, "db_type": "mongodb"}
    schema = parse_json_schema(raw)
    assert schema.db_type == "mongodb"
