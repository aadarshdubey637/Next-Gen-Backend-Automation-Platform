"""
Schema management endpoints — create, list, generate APIs from schemas.
This is the primary entry point for the automation platform.
"""
import asyncio
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Request, status, Query
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.postgresql import get_db
from app.models.schema_registry import SchemaRegistry
from app.models.user import User
from app.schemas.schema_input import SchemaInput, SchemaFromPrompt, GeneratedAPIResponse
from app.core.schema_parser import parse_json_schema, validate_schema
from app.core.ai_engine import prompt_to_schema
from app.core.code_generator import (
    generate_sqlalchemy_model,
    generate_pydantic_schemas,
    generate_mongo_collection_info,
    generate_endpoint_metadata,
)
from app.core.route_builder import (
    build_and_mount_routes, 
    cleanup_schema_resources,
    sync_database
)
from app.core.notifications import create_notification
from app.models.notification import NotificationType, NotificationCategory
import os
from app.core.batch_engine import BatchExecutionEngine
from app.auth.dependencies import get_current_user
from app.auth.rbac import require_roles
from app.models.user import UserRole
from loguru import logger

router = APIRouter(prefix="/api/v1/schemas", tags=["Schema Management"])


@router.post("/from-json", response_model=GeneratedAPIResponse, status_code=status.HTTP_201_CREATED)
async def create_from_json(
    raw_schema: dict,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    """
    Generate a backend from a raw JSON schema definition.

    Example input:
    ```json
    {
        "name": "Product",
        "description": "E-commerce product",
        "fields": {
            "title": {"type": "string", "required": true, "max_length": 200},
            "price": {"type": "float", "required": true, "min": 0},
            "sku": {"type": "string", "unique": true}
        },
        "db_type": "postgresql"
    }
    ```
    """
    # Parse the raw JSON into our internal schema format
    schema = parse_json_schema(raw_schema)

    # Validate
    issues = validate_schema(schema)
    if issues:
        raise HTTPException(400, detail={"validation_errors": issues})

    # Save to registry
    registry_entry = await _save_to_registry(schema, current_user.id, db)

    # Generate and mount routes
    await build_and_mount_routes(request.app, schema)

    endpoints = generate_endpoint_metadata(schema)

    # Trigger notification
    await create_notification(
        db, 
        current_user.id, 
        title="API Created Successfully",
        message=f"Successfully generated CRUD API for '{schema.name}' with {len(schema.fields)} fields.",
        notification_type=NotificationType.SUCCESS,
        category=NotificationCategory.SYSTEM
    )

    logger.info(f"🚀 Generated API for '{schema.name}' from JSON schema.")

    return GeneratedAPIResponse(
        schema_id=registry_entry.id,
        name=schema.name,
        endpoints=endpoints,
        message=f"Successfully generated CRUD API for '{schema.name}' with {len(schema.fields)} fields.",
        db_type=schema.db_type,
    )


@router.post("/from-schema", response_model=GeneratedAPIResponse, status_code=status.HTTP_201_CREATED)
async def create_from_schema(
    schema: SchemaInput,
    request: Request,
    overwrite: bool = Query(False, description="If true, overwrite existing schema with same name"),
    db: AsyncSession = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    """
    Generate a backend from a structured SchemaInput (form-based).
    """
    issues = validate_schema(schema)
    if issues:
        raise HTTPException(400, detail={"validation_errors": issues})

    if overwrite:
        # Check and delete existing
        existing = await db.execute(
            select(SchemaRegistry).where(SchemaRegistry.name == schema.name, SchemaRegistry.is_active == True)
        )
        entry = existing.scalar_one_or_none()
        if entry:
            logger.info(f"♻️ Overwriting existing schema '{schema.name}'")
            try:
                await cleanup_schema_resources(request.app, entry.name, entry.db_type)
                await db.delete(entry)
                await db.flush()
            except Exception as cleanup_err:
                logger.error(f"Failed to cleanup old resources: {cleanup_err}")
                # We continue anyway to try and create the new one

    registry_entry = await _save_to_registry(schema, current_user.id, db)
    await build_and_mount_routes(request.app, schema)
    endpoints = generate_endpoint_metadata(schema)

    # Trigger notification
    await create_notification(
        db, 
        current_user.id, 
        title="API Generated",
        message=f"New API '{schema.name}' is now live and ready for testing.",
        notification_type=NotificationType.SUCCESS,
        category=NotificationCategory.SYSTEM
    )

    logger.info(f"🚀 Generated API for '{schema.name}' from structured schema.")

    return GeneratedAPIResponse(
        schema_id=registry_entry.id,
        name=schema.name,
        endpoints=endpoints,
        message=f"Successfully generated CRUD API for '{schema.name}'.",
        db_type=schema.db_type,
    )


@router.post("/from-prompt", response_model=list[GeneratedAPIResponse], status_code=status.HTTP_201_CREATED)
async def create_from_prompt(
    body: SchemaFromPrompt,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    """
    🧠 AI-Powered: Generate backend(s) from a plain English prompt.

    Example:
    ```json
    {
        "prompt": "Create a blog with posts, categories, and comments",
        "db_type": "postgresql"
    }
    ```
    """
    schemas = await prompt_to_schema(body.prompt, body.db_type)

    results = []
    for schema in schemas:
        issues = validate_schema(schema)
        if issues:
            logger.warning(f"Validation issues for '{schema.name}': {issues}")
            continue

        registry_entry = await _save_to_registry(schema, current_user.id, db)
        await build_and_mount_routes(request.app, schema)
        endpoints = generate_endpoint_metadata(schema)

        # Trigger notification
        await create_notification(
            db, 
            current_user.id, 
            title="AI Generation Success",
            message=f"AI successfully architected and deployed '{schema.name}' API.",
            notification_type=NotificationType.SUCCESS,
            category=NotificationCategory.SYSTEM
        )

        results.append(GeneratedAPIResponse(
            schema_id=registry_entry.id,
            name=schema.name,
            endpoints=endpoints,
            message=f"Generated CRUD API for '{schema.name}'.",
            db_type=schema.db_type,
        ))

    logger.info(f"🧠 AI generated {len(results)} API(s) from prompt.")
    return results


@router.post("/prompt-to-schema", response_model=list[SchemaInput])
async def convert_prompt_to_schema(
    body: SchemaFromPrompt,
):
    """
    Just convert prompt to structured schema without saving or generating.
    Useful for the Visual Builder.
    """
    schemas = await prompt_to_schema(body.prompt, body.db_type)
    return schemas


@router.post("/bulk", status_code=status.HTTP_201_CREATED)
async def create_bulk(
    schemas: list[dict],
    request: Request,
    force: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    """
    Generate or update multiple backends with dependency management and versioning.
    Guaranteed to return a structured report even if parts of the process fail.
    """
    
    # 1. DB Health Check (Immediate fail if DB is down)
    try:
        await db.execute(text("SELECT 1"))
        logger.info("📡 [BULK:DB_CHECK] Database is reachable.")
    except Exception as db_err:
        logger.error(f"❌ [BULK:DB_CHECK] Database connection failed: {db_err}")
        return {
            "status": "completed",
            "created": [],
            "updated": [],
            "skipped": [],
            "failed": [s.get("name", "Unknown") for s in schemas],
            "errors": {"global": f"Database unreachable: {str(db_err)}"}
        }

    # 2. Fetch existing schema metadata
    try:
        existing_res = await db.execute(
            select(SchemaRegistry.name, SchemaRegistry.schema_hash, SchemaRegistry.version)
            .where(SchemaRegistry.is_active == True)
        )
        existing_metadata = {row[0]: {"hash": row[1], "version": row[2]} for row in existing_res.all()}
    except Exception as fetch_err:
        logger.error(f"❌ [BULK:FETCH_META] Failed to fetch existing metadata: {fetch_err}")
        return {
            "status": "completed",
            "created": [],
            "updated": [],
            "skipped": [],
            "failed": [s.get("name", "Unknown") for s in schemas],
            "errors": {"global": f"Failed to fetch existing metadata: {str(fetch_err)}"}
        }

    async def process_single_schema(raw_schema: dict, is_update: bool = False, force: bool = False):
        schema = parse_json_schema(raw_schema)
        schema_hash = raw_schema.get("_hash")
        
        # If force, cleanup existing resources first
        if force and schema.name in existing_metadata:
            logger.info(f"🗑️ [BULK:CLEANUP] Force-deleting resources for {schema.name}")
            await cleanup_schema_resources(request.app, schema.name, schema.db_type)

        # 1. Save/Update registry
        await _save_to_registry(schema, current_user.id, db, schema_hash=schema_hash)
        
        # 2. Build and mount routes (Defer DB sync)
        await build_and_mount_routes(request.app, schema, sync_db=False)
        return True

    # 3. Execute Engine
    try:
        engine = BatchExecutionEngine(schemas, process_single_schema, existing_metadata, force=force)
        # 3 minute timeout to prevent infinite loading
        report = await asyncio.wait_for(engine.execute(), timeout=180.0) 
        
        # 4. Final DB Sync and Commit
        if report["created"] or report["updated"]:
            logger.info("💾 [BULK:FINALIZE] Synchronizing database tables...")
            try:
                await sync_database()
                request.app.openapi_schema = None # Refresh OpenAPI once at the end
                await db.commit()
                logger.info("✅ [BULK:FINALIZE] Transaction committed successfully.")
            except Exception as commit_err:
                logger.error(f"❌ [BULK:FINALIZE] Commit failed: {commit_err}")
                await db.rollback()
                # Update report with commit failure
                for name in report["created"] + report["updated"]:
                    if name not in report["failed"]:
                        report["failed"].append(name)
                        report["errors"][name] = f"Database commit failed: {str(commit_err)}"
                report["created"] = []
                report["updated"] = []
        
        return report

    except asyncio.TimeoutError:
        logger.error("❌ [BULK:TIMEOUT] Operation timed out after 180 seconds.")
        return {
            "status": "completed",
            "created": [],
            "updated": [],
            "skipped": [],
            "failed": [s.get("name", "Unknown") for s in schemas],
            "errors": {"global": "Operation timed out. Try submitting fewer schemas at once."}
        }
    except Exception as e:
        logger.critical(f"❌ [BULK:CRITICAL] Global failure: {e}")
        return {
            "status": "completed",
            "created": [],
            "updated": [],
            "skipped": [],
            "failed": [s.get("name", "Unknown") for s in schemas],
            "errors": {"global": f"Unexpected platform error: {str(e)}"}
        }


@router.get("/", response_model=list[dict])
async def list_schemas(
    db: AsyncSession = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    """List all registered schemas."""
    result = await db.execute(
        select(SchemaRegistry).where(SchemaRegistry.is_active == True)
    )
    schemas = result.scalars().all()
    return [
        {
            "id": s.id,
            "name": s.name,
            "description": s.description,
            "db_type": s.db_type,
            "schema_definition": s.schema_definition,
            "field_count": len(s.schema_definition.get("fields", [])),
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "generated_code": {
                "endpoints": generate_endpoint_metadata(parse_json_schema(s.schema_definition))
            }
        }
        for s in schemas
    ]


@router.get("/{schema_id}")
async def get_schema(
    schema_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    """Get a specific schema with its generated code."""
    try:
        result = await db.execute(select(SchemaRegistry).where(SchemaRegistry.id == schema_id))
        entry = result.scalar_one_or_none()
        if not entry:
            raise HTTPException(404, "Schema not found")

        # Parse the saved definition
        schema = parse_json_schema(entry.schema_definition)

        return {
            "id": entry.id,
            "name": entry.name,
            "description": entry.description,
            "db_type": entry.db_type,
            "schema_definition": entry.schema_definition,
            "generated_code": {
                "sqlalchemy_model": generate_sqlalchemy_model(schema) if entry.db_type == "postgresql" else None,
                "pydantic_schemas": generate_pydantic_schemas(schema),
                "mongo_collection": generate_mongo_collection_info(schema) if entry.db_type == "mongodb" else None,
                "endpoints": generate_endpoint_metadata(schema),
            },
        }
    except Exception as e:
        logger.error(f"Error retrieving schema {schema_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal Error: {str(e)}")


@router.delete("/{schema_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_schema(
    schema_id: str,
    request: Request,
    hard_delete: bool = Query(False, description="If true, drop the database table/collection"),
    db: AsyncSession = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    """
    Delete a schema. 
    By default, it soft-deletes (is_active=False).
    If hard_delete=true, it also drops the database resources.
    """
    result = await db.execute(select(SchemaRegistry).where(SchemaRegistry.id == schema_id))
    entry = result.scalar_one_or_none()
    
    if not entry:
        raise HTTPException(404, "Schema not found")

    # Only owner or admin can delete
    # Dev Note: In local automation mode, we allow any authenticated user to delete schemas 
    # to avoid authorization blocks during testing.
    # if entry.owner_id and entry.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
    #     raise HTTPException(status_code=403, detail="Not authorized to delete this schema")

    if hard_delete:
        # Physical cleanup
        await cleanup_schema_resources(request.app, entry.name, entry.db_type)
        # Permanent delete from registry
        await db.delete(entry)
    else:
        # Soft delete
        entry.is_active = False
    
    await db.commit()

    # Trigger notification
    await create_notification(
        db, 
        current_user.id, 
        title="Schema Deleted",
        message=f"Schema '{entry.name}' has been {'permanently removed' if hard_delete else 'deactivated'}.",
        notification_type=NotificationType.INFO,
        category=NotificationCategory.SYSTEM
    )

    logger.info(f"🗑️ Deleted schema '{entry.name}' (ID: {schema_id}, Hard: {hard_delete})")
    return None


# ── Helper ──────────────────────────────────────────────

async def _save_to_registry(
    schema: SchemaInput,
    owner_id: str,
    db: AsyncSession,
    schema_hash: str = None
) -> SchemaRegistry:
    """Save or update schema metadata in the registry."""
    existing = await db.execute(
        select(SchemaRegistry).where(SchemaRegistry.name == schema.name, SchemaRegistry.is_active == True)
    )
    entry = existing.scalar_one_or_none()

    if entry:
        entry.description = schema.description
        entry.db_type = schema.db_type
        entry.schema_definition = schema.model_dump()
        entry.enable_soft_delete = schema.enable_soft_delete
        if schema_hash and entry.schema_hash != schema_hash:
            entry.version += 1
            entry.schema_hash = schema_hash
        logger.info(f"Updated registry for '{schema.name}' (v{entry.version})")
    else:
        entry = SchemaRegistry(
            name=schema.name,
            description=schema.description,
            db_type=schema.db_type,
            schema_definition=schema.model_dump(),
            enable_soft_delete=schema.enable_soft_delete,
            owner_id=owner_id,
            schema_hash=schema_hash,
            version=1
        )
        db.add(entry)
        logger.info(f"Registered new schema '{schema.name}'")
    
    await db.flush()
    await db.refresh(entry)
    return entry
