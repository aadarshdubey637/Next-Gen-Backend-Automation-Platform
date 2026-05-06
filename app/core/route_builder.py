"""
Dynamic Route Builder — mounts CRUD routes on the live FastAPI app
for any generated schema, without server restart.

Supports both PostgreSQL (SQLAlchemy) and MongoDB (Motor) backends.
"""
import uuid
from datetime import datetime
from typing import Any, Optional, Type, Union, Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import create_model, Field, EmailStr
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Date, Text, JSON
from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Mapped, mapped_column

from app.schemas.schema_input import SchemaInput, FieldType
from app.db.postgresql import Base, get_db, engine
from app.db.mongodb import get_collection
from app.auth.dependencies import get_current_user
from app.models.user import User
from loguru import logger

# Registry of dynamically created routers
_dynamic_routers: dict[str, APIRouter] = {}


# ── SQLAlchemy type mapping for dynamic models ─────────
SA_COLUMN_MAP = {
    FieldType.STRING: lambda f: Column(String(f.max_length or 255), default=f.default),
    FieldType.INTEGER: lambda f: Column(Integer, default=f.default),
    FieldType.FLOAT: lambda f: Column(Float, default=f.default),
    FieldType.BOOLEAN: lambda f: Column(Boolean, default=f.default),
    FieldType.DATETIME: lambda f: Column(DateTime, default=None),
    FieldType.DATE: lambda f: Column(Date, default=None),
    FieldType.TEXT: lambda f: Column(Text, default=f.default),
    FieldType.EMAIL: lambda f: Column(String(255), default=f.default),
    FieldType.UUID: lambda f: Column(String(36), default=None),
    FieldType.JSON: lambda f: Column(JSON, default=None),
    FieldType.ARRAY: lambda f: Column(JSON, default=None),
}


def _to_snake(name: str) -> str:
    import re
    # Convert PascalCase to snake_case
    s1 = re.sub(r"(.)([A-Z][a-z]+)", r"\1_\2", name)
    name = re.sub(r"([a-z0-9])([A-Z])", r"\1_\2", s1).lower().replace("-", "_")
    # Remove any double pluralization at the end
    if name.endswith("ss"): # e.g. "classs"
        name = name[:-1]
    return name


def _to_pascal(name: str) -> str:
    return "".join(word.capitalize() for word in name.replace("-", "_").split("_"))


def _create_dynamic_pydantic_model(schema: SchemaInput, model_type: str = "Create") -> Type:
    """Dynamically create a Pydantic model for validation."""
    fields = {}
    
    # Add id for Read models
    if model_type == "Read":
        fields["id"] = (str, Field(..., description="System generated UUID"))

    for field in schema.fields:
        if field.name == "id":
            continue # Handled automatically
            
        # Determine the base type
        python_type: Any = Any
        if field.field_type == FieldType.STRING:
            python_type = str
        elif field.field_type == FieldType.INTEGER:
            python_type = int
        elif field.field_type == FieldType.FLOAT:
            python_type = float
        elif field.field_type == FieldType.BOOLEAN:
            python_type = bool
        elif field.field_type == FieldType.DATETIME:
            python_type = datetime
        elif field.field_type == FieldType.DATE:
            from datetime import date
            python_type = date
        elif field.field_type == FieldType.TEXT:
            python_type = str
        elif field.field_type == FieldType.EMAIL:
            python_type = EmailStr
        elif field.field_type == FieldType.UUID:
            python_type = str
        elif field.field_type == FieldType.JSON:
            python_type = dict
        elif field.field_type == FieldType.ARRAY:
            python_type = list

        # Handle Enums/Options
        if field.options:
            python_type = Literal[tuple(field.options)]

        # Build Field constraints
        field_kwargs = {
            "description": field.description,
            "default": ... if field.required and model_type == "Create" else None
        }

        # Add default value if provided and not required (or if Update/Read model)
        if field.default is not None and field.default != "":
            field_kwargs["default"] = field.default
        
        if field.max_length:
            field_kwargs["max_length"] = field.max_length
        if field.min_value is not None:
            field_kwargs["gt" if field.field_type == FieldType.INTEGER or field.field_type == FieldType.FLOAT else "ge"] = field.min_value
        if field.max_value is not None:
            field_kwargs["le"] = field.max_value

        fields[field.name] = (python_type, Field(**field_kwargs))

    return create_model(
        f"{_to_pascal(schema.name)}{model_type}",
        **fields
    )


async def build_and_mount_routes(
    app,
    schema: SchemaInput,
    sync_db: bool = True,
) -> APIRouter:
    """
    Build CRUD routes for the given schema and mount them on the FastAPI app.
    Returns the created router.
    """
    resource_snake = _to_snake(schema.name)
    resource_pascal = _to_pascal(schema.name)
    prefix = f"/api/v1/{resource_snake}s"
    tag = f"{resource_pascal} (Generated)"

    if schema.db_type == "mongodb":
        router = _build_mongo_routes(schema, prefix, tag)
    else:
        # Build SQLAlchemy model dynamically
        await _create_dynamic_sql_model(schema, sync_db=sync_db)
        router = _build_sql_routes(schema, prefix, tag)

    # Mount on the app
    app.include_router(router)
    _dynamic_routers[schema.name] = router

    # Reset the OpenAPI schema cache so the new routes appear in /docs
    if sync_db:
        app.openapi_schema = None

    logger.info(f"✅ Mounted dynamic CRUD routes at {prefix}")
    return router


async def sync_database():
    """Run create_all for all currently defined models in metadata."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("✅ Database schema synchronized.")


async def load_and_mount_all_schemas(app):
    """Load all active schemas from the registry and mount their routes."""
    from sqlalchemy import select
    from app.db.postgresql import async_session
    from app.models.schema_registry import SchemaRegistry
    from app.core.schema_parser import parse_json_schema

    async with async_session() as db:
        result = await db.execute(
            select(SchemaRegistry).where(SchemaRegistry.is_active == True)
        )
        schemas = result.scalars().all()

        for entry in schemas:
            try:
                schema_input = parse_json_schema(entry.schema_definition)
                # Load all routes without immediate DB sync
                await build_and_mount_routes(app, schema_input, sync_db=False)
                logger.info(f"Loaded routes for schema: {entry.name}")
            except Exception as e:
                logger.error(f"Failed to load routes for {entry.name}: {e}")

    # Synchronize database once after all routes are mounted
    await sync_database()
    # Final refresh of OpenAPI schema
    app.openapi_schema = None


async def cleanup_schema_resources(app, schema_name: str, db_type: str):
    """
    Clean up physical resources (tables/collections) associated with a schema.
    Also removes dynamic routes from the FastAPI app to prevent performance bloat.
    """
    resource_snake = _to_snake(schema_name)
    table_name = f"{resource_snake}s"
    prefix = f"/api/v1/{table_name}"

    try:
        # 1. Physical Cleanup
        if db_type == "mongodb":
            from app.db.mongodb import get_mongodb
            db = get_mongodb()
            await db.drop_collection(table_name)
            logger.info(f"🗑️ Dropped MongoDB collection: {table_name}")
        else:
            from sqlalchemy import text
            from app.db.postgresql import engine
            dialect = engine.url.get_dialect().name
            async with engine.begin() as conn:
                if dialect == "mysql":
                    await conn.execute(text("SET FOREIGN_KEY_CHECKS = 0"))
                    await conn.execute(text(f"DROP TABLE IF EXISTS `{table_name}`"))
                    await conn.execute(text("SET FOREIGN_KEY_CHECKS = 1"))
                elif dialect == "postgresql":
                    await conn.execute(text(f'DROP TABLE IF EXISTS "{table_name}" CASCADE'))
                else:
                    await conn.execute(text(f"DROP TABLE IF EXISTS {table_name}"))
            
            if table_name in Base.metadata.tables:
                Base.metadata.remove(Base.metadata.tables[table_name])
            logger.info(f"🗑️ Dropped SQL table: {table_name}")

        # 2. Router Registry Cleanup
        if schema_name in _dynamic_routers:
            del _dynamic_routers[schema_name]
            logger.info(f"🗑️ Removed {schema_name} from internal router registry")

        # 3. FastAPI Route List Cleanup (Crucial for performance)
        from fastapi.routing import APIRoute
        original_count = len(app.router.routes)
        app.router.routes = [r for r in app.router.routes if not (isinstance(r, APIRoute) and r.path.startswith(prefix))]
        logger.info(f"🗑️ Removed {original_count - len(app.router.routes)} routes from app. Total routes now: {len(app.router.routes)}")

        # 4. Refresh OpenAPI
        app.openapi_schema = None
        
    except Exception as e:
        logger.error(f"❌ Failed to cleanup resources for {schema_name}: {e}")
        raise e


# ══════════════════════════════════════════════════════════
# PostgreSQL (SQLAlchemy) Routes
# ══════════════════════════════════════════════════════════

async def _create_dynamic_sql_model(schema: SchemaInput, sync_db: bool = True):
    """Dynamically create a SQLAlchemy model and its table."""
    table_name = _to_snake(schema.name) + "s"
    class_name = _to_pascal(schema.name)

    # Check if model already exists
    if table_name in Base.metadata.tables:
        logger.info(f"Table '{table_name}' already exists, skipping creation.")
        return

    # Build columns dynamically
    attrs = {
        "__tablename__": table_name,
        "id": Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4())),
    }

    for field in schema.fields:
        if field.name == "id":
            continue  # System reserved primary key

        col_factory = SA_COLUMN_MAP.get(field.field_type, lambda f: Column(String(255)))
        col = col_factory(field)
        col.nullable = not field.required
        col.unique = field.unique
        col.index = field.indexed
        attrs[field.name] = col

    if schema.enable_soft_delete:
        attrs["is_deleted"] = Column(Boolean, default=False)
        attrs["deleted_at"] = Column(DateTime, nullable=True)

    # Create the model class dynamically
    model = type(class_name, (Base,), attrs)

    if sync_db:
        # Create the table in the database
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    return model


def _build_sql_routes(schema: SchemaInput, prefix: str, tag: str) -> APIRouter:
    """Create a FastAPI router with CRUD endpoints for PostgreSQL."""
    router = APIRouter(prefix=prefix, tags=[tag])
    table_name = _to_snake(schema.name) + "s"
    
    # Create validation models
    CreateSchema = _create_dynamic_pydantic_model(schema, "Create")
    UpdateSchema = _create_dynamic_pydantic_model(schema, "Update")

    # ── CREATE ──────────────────────────────────────────
    @router.post("/", status_code=status.HTTP_201_CREATED)
    async def create_item(
        item_data: Union[CreateSchema, list[CreateSchema]],
        db: AsyncSession = Depends(get_db),
        current_user: Any = Depends(get_current_user) if schema.enable_auth else None,
    ):
        """Create new record(s). Supports bulk insert if a list is provided."""
        table = Base.metadata.tables.get(table_name)
        if table is None:
            raise HTTPException(404, f"Table '{table_name}' not found")

        is_bulk = isinstance(item_data, list)
        items_to_create = item_data if is_bulk else [item_data]
        
        created_ids = []
        now = datetime.utcnow()
        valid_columns = {c.name for c in table.columns}

        for item in items_to_create:
            data = item.model_dump()
            item_id = str(uuid.uuid4())
            data["id"] = item_id
            
            # Ensure timestamps are set and not None
            data["created_at"] = data.get("created_at") or now
            data["updated_at"] = data.get("updated_at") or now

            filtered_data = {k: v for k, v in data.items() if k in valid_columns}
            await db.execute(table.insert().values(**filtered_data))
            created_ids.append(item_id)

        await db.commit()

        if is_bulk:
            # For bulk, return a summary and the count
            return {
                "message": f"Successfully created {len(created_ids)} records.",
                "ids": created_ids
            }

        # For single item, return the full record
        result = await db.execute(table.select().where(table.c.id == created_ids[0]))
        created = result.mappings().first()
        return dict(created) if created else {"id": created_ids[0]}

    # ── LIST (paginated) ────────────────────────────────
    @router.get("/")
    async def list_items(
        skip: int = Query(0, ge=0),
        limit: int = Query(20, ge=1, le=100),
        db: AsyncSession = Depends(get_db),
        current_user: Any = Depends(get_current_user) if schema.enable_auth else None,
    ):
        """List all records with pagination."""
        table = Base.metadata.tables.get(table_name)
        if table is None:
            raise HTTPException(404, f"Table '{table_name}' not found")

        query = table.select()

        if schema.enable_soft_delete and "is_deleted" in table.c:
            query = query.where(table.c.is_deleted == False)

        query = query.offset(skip).limit(limit)
        result = await db.execute(query)
        items = [dict(row) for row in result.mappings().all()]

        # Count total
        from sqlalchemy import func
        count_q = select(func.count()).select_from(table)
        if schema.enable_soft_delete and "is_deleted" in table.c:
            count_q = count_q.where(table.c.is_deleted == False)
        total = (await db.execute(count_q)).scalar()

        return {"items": items, "total": total, "skip": skip, "limit": limit}

    # ── GET BY ID ───────────────────────────────────────
    @router.get("/{item_id}")
    async def get_item(
        item_id: str,
        db: AsyncSession = Depends(get_db),
        current_user: Any = Depends(get_current_user) if schema.enable_auth else None,
    ):
        """Get a single record by ID."""
        table = Base.metadata.tables.get(table_name)
        if table is None:
            raise HTTPException(404, f"Table '{table_name}' not found")

        query = table.select().where(table.c.id == item_id)
        
        # Apply soft-delete filter if enabled
        if schema.enable_soft_delete and "is_deleted" in table.c:
            query = query.where(table.c.is_deleted == False)

        logger.info(f"🔍 Fetching {schema.name} with ID: {item_id} from table: {table_name}")
        result = await db.execute(query)
        item = result.mappings().first()

        if not item:
            logger.warning(f"⚠️ {schema.name} with ID {item_id} not found in {table_name}")
            raise HTTPException(404, f"{schema.name} not found")
            
        return dict(item)

    # ── UPDATE ──────────────────────────────────────────
    @router.put("/{item_id}")
    async def update_item(
        item_id: str,
        item_data: UpdateSchema,
        db: AsyncSession = Depends(get_db),
        current_user: Any = Depends(get_current_user) if schema.enable_auth else None,
    ):
        """Update a record by ID."""
        data = item_data.model_dump(exclude_unset=True)
        table = Base.metadata.tables.get(table_name)
        if table is None:
            raise HTTPException(404, f"Table '{table_name}' not found")

        data["updated_at"] = datetime.utcnow()
        data.pop("id", None)  # Prevent ID mutation

        # Filter data to only include valid column names
        valid_columns = {c.name for c in table.columns}
        filtered_data = {k: v for k, v in data.items() if k in valid_columns}

        if not filtered_data:
            raise HTTPException(400, "No valid fields to update")

        await db.execute(
            table.update().where(table.c.id == item_id).values(**filtered_data)
        )
        await db.commit()

        result = await db.execute(table.select().where(table.c.id == item_id))
        updated = result.mappings().first()
        if not updated:
            raise HTTPException(404, f"{schema.name} not found")
        return dict(updated)

    # ── DELETE ──────────────────────────────────────────
    @router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
    async def delete_item(
        item_id: str,
        db: AsyncSession = Depends(get_db),
        current_user: Any = Depends(get_current_user) if schema.enable_auth else None,
    ):
        """Delete a record by ID (soft-delete if enabled)."""
        table = Base.metadata.tables.get(table_name)
        if table is None:
            raise HTTPException(404, f"Table '{table_name}' not found")

        if schema.enable_soft_delete and "is_deleted" in table.c:
            await db.execute(
                table.update().where(table.c.id == item_id).values(
                    is_deleted=True, deleted_at=datetime.utcnow()
                )
            )
        else:
            await db.execute(table.delete().where(table.c.id == item_id))

        await db.commit()
        return None

    return router


# ══════════════════════════════════════════════════════════
# MongoDB (Motor) Routes
# ══════════════════════════════════════════════════════════

def _build_mongo_routes(schema: SchemaInput, prefix: str, tag: str) -> APIRouter:
    """Create a FastAPI router with CRUD endpoints for MongoDB."""
    router = APIRouter(prefix=prefix, tags=[tag])
    collection_name = _to_snake(schema.name) + "s"

    # Create validation models
    CreateSchema = _create_dynamic_pydantic_model(schema, "Create")
    UpdateSchema = _create_dynamic_pydantic_model(schema, "Update")

    # ── CREATE ──────────────────────────────────────────
    @router.post("/", status_code=status.HTTP_201_CREATED)
    async def create_item(
        item_data: Union[CreateSchema, list[CreateSchema]],
        current_user: Any = Depends(get_current_user) if schema.enable_auth else None,
    ):
        """Create new record(s). Supports bulk insert if a list is provided."""
        collection = get_collection(collection_name)
        is_bulk = isinstance(item_data, list)
        items_to_create = item_data if is_bulk else [item_data]
        
        created_docs = []
        now = datetime.utcnow()

        for item in items_to_create:
            data = item.model_dump()
            item_id = str(uuid.uuid4())
            data["_id"] = item_id
            
            # Ensure timestamps are set and not None
            data["created_at"] = data.get("created_at") or now
            data["updated_at"] = data.get("updated_at") or now
            
            created_docs.append(data)

        if is_bulk:
            await collection.insert_many(created_docs)
            return {
                "message": f"Successfully created {len(created_docs)} documents.",
                "ids": [d["_id"] for d in created_docs]
            }
        
        # Single insert
        await collection.insert_one(created_docs[0])
        created = await collection.find_one({"_id": created_docs[0]["_id"]})
        if created:
            created["id"] = created.pop("_id")
        return created

    @router.get("/")
    async def list_items(
        skip: int = Query(0, ge=0),
        limit: int = Query(20, ge=1, le=100),
        current_user: Any = Depends(get_current_user) if schema.enable_auth else None,
    ):
        """List all documents with pagination."""
        collection = get_collection(collection_name)

        filter_query = {}
        if schema.enable_soft_delete:
            filter_query["is_deleted"] = {"$ne": True}

        cursor = collection.find(filter_query).skip(skip).limit(limit)
        items = []
        async for doc in cursor:
            doc["id"] = str(doc.pop("_id"))
            items.append(doc)

        total = await collection.count_documents(filter_query)
        return {"items": items, "total": total, "skip": skip, "limit": limit}

    @router.get("/{item_id}")
    async def get_item(
        item_id: str,
        current_user: Any = Depends(get_current_user) if schema.enable_auth else None,
    ):
        """Get a document by ID."""
        collection = get_collection(collection_name)
        
        filter_query = {"_id": item_id}
        if schema.enable_soft_delete:
            filter_query["is_deleted"] = {"$ne": True}

        logger.info(f"🔍 Fetching Mongo document {schema.name} with ID: {item_id}")
        doc = await collection.find_one(filter_query)
        
        if not doc:
            logger.warning(f"⚠️ Mongo document {schema.name} with ID {item_id} not found")
            raise HTTPException(404, f"{schema.name} not found")
            
        doc["id"] = str(doc.pop("_id"))
        return doc

    @router.put("/{item_id}")
    async def update_item(
        item_id: str,
        item_data: UpdateSchema,
        current_user: Any = Depends(get_current_user) if schema.enable_auth else None,
    ):
        """Update a record by ID."""
        data = item_data.model_dump(exclude_unset=True)
        collection = get_collection(collection_name)
        data["updated_at"] = datetime.utcnow()
        data.pop("id", None)
        data.pop("_id", None)

        await collection.update_one({"_id": item_id}, {"$set": data})
        updated = await collection.find_one({"_id": item_id})
        if updated:
            updated["id"] = updated.pop("_id")
            return updated
        raise HTTPException(404, f"{schema.name} not found")

    @router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
    async def delete_item(
        item_id: str,
        current_user: Any = Depends(get_current_user) if schema.enable_auth else None,
    ):
        """Delete a document by ID."""
        collection = get_collection(collection_name)

        if schema.enable_soft_delete:
            await collection.update_one(
                {"_id": item_id},
                {"$set": {"is_deleted": True, "deleted_at": datetime.utcnow().isoformat()}},
            )
        else:
            await collection.delete_one({"_id": item_id})

        return None

    return router


def get_registered_routes() -> dict[str, list[str]]:
    """Return all dynamically registered route names and their paths."""
    result = {}
    for name, router in _dynamic_routers.items():
        paths = [route.path for route in router.routes]
        result[name] = paths
    return result
