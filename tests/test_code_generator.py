"""
Tests for the Code Generator module.
"""
import pytest
from app.core.code_generator import (
    generate_sqlalchemy_model,
    generate_pydantic_schemas,
    generate_mongo_collection_info,
    generate_endpoint_metadata,
)
from app.core.schema_parser import parse_json_schema


@pytest.fixture
def product_schema():
    return parse_json_schema({
        "name": "Product",
        "description": "E-commerce product",
        "fields": {
            "title": {"type": "string", "required": True, "max_length": 200},
            "price": {"type": "float", "required": True, "min": 0},
            "sku": {"type": "string", "unique": True},
            "in_stock": {"type": "boolean", "default": "true"},
        },
        "db_type": "postgresql",
        "enable_soft_delete": True,
    })


def test_generate_sqlalchemy_model(product_schema):
    code = generate_sqlalchemy_model(product_schema)
    assert "class Product(Base):" in code
    assert '__tablename__ = "products"' in code
    assert "title:" in code
    assert "price:" in code
    assert "is_deleted:" in code
    assert "String(200)" in code


def test_generate_pydantic_schemas(product_schema):
    code = generate_pydantic_schemas(product_schema)
    assert "class ProductCreate(BaseModel):" in code
    assert "class ProductRead(BaseModel):" in code
    assert "class ProductUpdate(BaseModel):" in code
    assert "title:" in code


def test_generate_mongo_collection_info(product_schema):
    info = generate_mongo_collection_info(product_schema)
    assert info["collection_name"] == "products"
    assert any(idx["key"] == "sku" and idx["unique"] for idx in info["indexes"])


def test_generate_endpoint_metadata(product_schema):
    endpoints = generate_endpoint_metadata(product_schema)
    assert len(endpoints) == 5
    methods = [ep["method"] for ep in endpoints]
    assert "POST" in methods
    assert "GET" in methods
    assert "PUT" in methods
    assert "DELETE" in methods
    assert all("/api/v1/products" in ep["path"] for ep in endpoints)


def test_mongo_schema():
    schema = parse_json_schema({
        "name": "Log",
        "fields": {"message": "text", "level": "string"},
        "db_type": "mongodb",
    })
    info = generate_mongo_collection_info(schema)
    validator = info["schema_validation"]
    assert "$jsonSchema" in validator
    assert "message" in validator["$jsonSchema"]["properties"]
