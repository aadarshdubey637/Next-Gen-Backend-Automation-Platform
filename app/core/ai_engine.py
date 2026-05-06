"""
AI Engine — converts plain English prompts into structured SchemaInput
using OpenAI's API (or any compatible LLM).
"""
import json
from typing import Optional
from app.config import settings
from app.schemas.schema_input import SchemaInput
from app.core.schema_parser import parse_json_schema
from loguru import logger

# System prompt that instructs the LLM to output a valid schema
SYSTEM_PROMPT = """You are a backend architecture AI. Given a plain English description, 
generate a JSON schema that defines a backend data model.

OUTPUT FORMAT (strict JSON, no markdown):
{
    "name": "ResourceName",
    "description": "What this resource represents",
    "fields": [
        {
            "name": "field_name",
            "field_type": "string|integer|float|boolean|datetime|text|email|uuid|json|array",
            "required": true/false,
            "unique": true/false,
            "indexed": true/false,
            "max_length": null or number,
            "min_value": null or number,
            "max_value": null or number,
            "description": "field description"
        }
    ],
    "enable_auth": true,
    "enable_soft_delete": false
}

RULES:
1. Use snake_case for field names
2. Always include an appropriate set of fields based on the description
3. Add timestamps (created_at, updated_at) where appropriate
4. Use appropriate types (email for emails, datetime for dates, etc.)
5. Set reasonable constraints (max_length, min/max values)
6. Output ONLY valid JSON, no explanations

If the prompt describes MULTIPLE resources, output a JSON array of schemas."""


async def prompt_to_schema(
    prompt: str,
    db_type: str = "postgresql",
) -> list[SchemaInput]:
    """
    Convert a plain English prompt into one or more SchemaInput objects.
    Supports Gemini, OpenAI, or falls back to a rule-based parser.
    Automatically chains providers if one fails (e.g. quota exhausted).
    """
    # 1. Try Primary Provider (Gemini or OpenAI as configured)
    if settings.AI_PROVIDER == "gemini" and settings.GEMINI_API_KEY:
        try:
            return await _gemini_generate(prompt, db_type)
        except Exception as e:
            logger.warning(f"Primary provider (Gemini) failed: {e}. Trying Grok...")

    # 2. Try Grok (xAI) if key available
    if settings.GROK_API_KEY:
        try:
            return await _grok_generate(prompt, db_type)
        except Exception as e:
            logger.warning(f"Grok provider failed: {e}. Trying secondary LLM...")
    
    # 3. Try Secondary Provider (OpenAI or Custom/Local LLM)
    if settings.OPENAI_API_KEY or settings.CUSTOM_AI_BASE_URL:
        try:
            return await _llm_generate(prompt, db_type)
        except Exception as e:
            logger.warning(f"Secondary provider (LLM) failed: {e}. Using rule-based fallback.")

    # 3. Rule-based fallback
    logger.warning("No AI providers available or all failed — using rule-based fallback.")
    return _fallback_generate(prompt, db_type)


async def _gemini_generate(prompt: str, db_type: str) -> list[SchemaInput]:
    """Call Google Gemini API to generate schemas using the new google-genai SDK."""
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    full_prompt = f"{SYSTEM_PROMPT}\n\nUSER PROMPT: {prompt}"
    
    # Use standard model names. The new SDK might be defaulting to v1beta 
    # for some reason, so we try the most stable IDs.
    models_to_try = ["gemini-1.5-flash-latest", "gemini-1.5-flash", "gemini-2.0-flash"]
    
    last_error = None
    for model_id in models_to_try:
        try:
            response = await client.aio.models.generate_content(
                model=model_id,
                contents=full_prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                ),
            )

            raw_text = response.text.strip()
            # Remove markdown if any
            if raw_text.startswith("```json"):
                raw_text = raw_text[7:-3].strip()
            elif raw_text.startswith("```"):
                raw_text = raw_text[3:-3].strip()

            raw_json = json.loads(raw_text)

            # Handle single schema or array of schemas
            if isinstance(raw_json, list):
                schemas = raw_json
            elif "schemas" in raw_json:
                schemas = raw_json["schemas"]
            else:
                schemas = [raw_json]

            results = []
            for schema_dict in schemas:
                schema_dict["db_type"] = db_type
                parsed = parse_json_schema(schema_dict)
                results.append(parsed)

            logger.info(f"Gemini ({model_id}) generated {len(results)} schema(s) from prompt.")
            return results

        except Exception as e:
            last_error = e
            if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                logger.warning(f"Gemini {model_id} quota exhausted, trying next model...")
                continue
            elif "404" in str(e) or "NOT_FOUND" in str(e):
                logger.warning(f"Gemini {model_id} not found (404), trying next model...")
                continue
            
            logger.error(f"Gemini {model_id} failed with unexpected error: {e}")
            continue # Try next model anyway to be safe

    logger.error(f"All Gemini models failed. Last error: {last_error}. Falling back to rule-based.")
    return _fallback_generate(prompt, db_type)


async def _grok_generate(prompt: str, db_type: str) -> list[SchemaInput]:
    """Call xAI Grok API to generate schemas."""
    try:
        from openai import AsyncOpenAI

        # Grok uses OpenAI-compatible SDK
        client = AsyncOpenAI(
            api_key=settings.GROK_API_KEY,
            base_url="https://api.x.ai/v1"
        )

        response = await client.chat.completions.create(
            model=settings.GROK_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
            stream=False
        )

        raw_text = response.choices[0].message.content.strip()
        # Clean markdown
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:-3].strip()
        elif raw_text.startswith("```"):
            raw_text = raw_text[3:-3].strip()

        raw_json = json.loads(raw_text)

        # Handle list or object
        schemas = raw_json if isinstance(raw_json, list) else (raw_json.get("schemas", [raw_json]))
        
        results = []
        for schema_dict in schemas:
            schema_dict["db_type"] = db_type
            results.append(parse_json_schema(schema_dict))

        logger.info(f"Grok generated {len(results)} schema(s) from prompt.")
        return results
    except Exception as e:
        logger.error(f"Grok failed: {e}")
        raise e


async def _llm_generate(prompt: str, db_type: str) -> list[SchemaInput]:
    """Call OpenAI API or Custom Base URL to generate schemas."""
    try:
        from openai import AsyncOpenAI

        # Use OpenAI Key if available, otherwise use custom base URL (Ollama/Local)
        api_key = settings.OPENAI_API_KEY or "not-needed"
        base_url = settings.CUSTOM_AI_BASE_URL
        model = settings.OPENAI_MODEL if settings.OPENAI_API_KEY else settings.CUSTOM_AI_MODEL

        client = AsyncOpenAI(api_key=api_key, base_url=base_url)

        response = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
            max_tokens=4000,
            response_format={"type": "json_object"} if "gpt" in model.lower() else None,
        )

        raw_text = response.choices[0].message.content.strip()
        # Handle cases where non-OpenAI models might not respect json_object
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:-3].strip()
        elif raw_text.startswith("```"):
            raw_text = raw_text[3:-3].strip()

        raw_json = json.loads(raw_text)

        # Handle single schema or array of schemas
        if isinstance(raw_json, list):
            schemas = raw_json
        elif "schemas" in raw_json:
            schemas = raw_json["schemas"]
        else:
            schemas = [raw_json]

        results = []
        for schema_dict in schemas:
            schema_dict["db_type"] = db_type
            parsed = parse_json_schema(schema_dict)
            results.append(parsed)

        logger.info(f"AI generated {len(results)} schema(s) from prompt.")
        return results

    except Exception as e:
        logger.error(f"LLM generation failed: {e}. Falling back to rule-based.")
        return _fallback_generate(prompt, db_type)


def _fallback_generate(prompt: str, db_type: str) -> list[SchemaInput]:
    """
    Rule-based fallback when no LLM is available.
    Extracts keywords to build a basic schema.
    """
    prompt_lower = prompt.lower()

    # ── Detect common patterns ──────────────────────────
    schemas = []

    if any(word in prompt_lower for word in ["user", "login", "signup", "register", "auth"]):
        schemas.append(parse_json_schema({
            "name": "User",
            "description": "User account with authentication",
            "db_type": db_type,
            "fields": [
                {"name": "email", "type": "email", "required": True, "unique": True},
                {"name": "username", "type": "string", "required": True, "unique": True, "max_length": 100},
                {"name": "full_name", "type": "string", "required": False, "max_length": 200},
                {"name": "hashed_password", "type": "string", "required": True},
                {"name": "role", "type": "string", "required": True, "default": "user"},
                {"name": "is_active", "type": "boolean", "required": False, "default": "true"},
                {"name": "created_at", "type": "datetime", "required": False},
                {"name": "updated_at", "type": "datetime", "required": False},
            ],
            "enable_auth": True,
        }))

    if any(word in prompt_lower for word in ["product", "item", "catalog", "shop", "store"]):
        schemas.append(parse_json_schema({
            "name": "Product",
            "description": "Product catalog item",
            "db_type": db_type,
            "fields": [
                {"name": "title", "type": "string", "required": True, "max_length": 200},
                {"name": "description", "type": "text", "required": False},
                {"name": "price", "type": "float", "required": True, "min": 0},
                {"name": "sku", "type": "string", "required": True, "unique": True},
                {"name": "category", "type": "string", "required": False},
                {"name": "in_stock", "type": "boolean", "default": "true"},
                {"name": "created_at", "type": "datetime"},
            ],
        }))

    if any(word in prompt_lower for word in ["blog", "post", "article", "content"]):
        schemas.append(parse_json_schema({
            "name": "BlogPost",
            "description": "Blog article",
            "db_type": db_type,
            "fields": [
                {"name": "title", "type": "string", "required": True, "max_length": 300},
                {"name": "slug", "type": "string", "required": True, "unique": True},
                {"name": "content", "type": "text", "required": True},
                {"name": "author", "type": "string", "required": True},
                {"name": "status", "type": "string", "required": True, "default": "draft"},
                {"name": "tags", "type": "array"},
                {"name": "published_at", "type": "datetime"},
                {"name": "created_at", "type": "datetime"},
                {"name": "updated_at", "type": "datetime"},
            ],
            "enable_soft_delete": True,
        }))

    if any(word in prompt_lower for word in ["order", "checkout", "purchase"]):
        schemas.append(parse_json_schema({
            "name": "Order",
            "description": "Purchase order",
            "db_type": db_type,
            "fields": [
                {"name": "order_number", "type": "string", "required": True, "unique": True},
                {"name": "customer_id", "type": "uuid", "required": True},
                {"name": "items", "type": "json", "required": True},
                {"name": "total_amount", "type": "float", "required": True, "min": 0},
                {"name": "status", "type": "string", "default": "pending"},
                {"name": "shipping_address", "type": "text"},
                {"name": "created_at", "type": "datetime"},
            ],
        }))

    if any(word in prompt_lower for word in ["task", "todo", "ticket", "issue"]):
        schemas.append(parse_json_schema({
            "name": "Task",
            "description": "Task / ticket tracker",
            "db_type": db_type,
            "fields": [
                {"name": "title", "type": "string", "required": True, "max_length": 200},
                {"name": "description", "type": "text"},
                {"name": "assignee", "type": "string"},
                {"name": "priority", "type": "string", "default": "medium"},
                {"name": "status", "type": "string", "default": "open"},
                {"name": "due_date", "type": "datetime"},
                {"name": "created_at", "type": "datetime"},
                {"name": "updated_at", "type": "datetime"},
            ],
        }))

    if any(word in prompt_lower for word in ["inventory", "stock", "warehouse", "supplier"]):
        schemas.append(parse_json_schema({
            "name": "InventoryItem",
            "description": "Inventory and Stock Management",
            "db_type": db_type,
            "fields": [
                {"name": "item_name", "type": "string", "required": True},
                {"name": "sku", "type": "string", "required": True, "unique": True},
                {"name": "stock_level", "type": "integer", "required": True, "default": 0},
                {"name": "min_stock_level", "type": "integer", "required": True, "default": 5},
                {"name": "supplier_name", "type": "string", "required": True},
                {"name": "supplier_contact", "type": "string", "required": False},
                {"name": "unit_price", "type": "float", "required": True},
                {"name": "last_restocked", "type": "datetime", "required": False},
            ],
        }))

    # ── Default Fallback if no keywords match ──────────
    if not schemas:
        # Generic fallback: create a simple resource from the prompt
        schemas.append(parse_json_schema({
            "name": "Resource",
            "description": f"Auto-generated from: {prompt[:100]}",
            "db_type": db_type,
            "fields": [
                {"name": "name", "type": "string", "required": True, "max_length": 200},
                {"name": "description", "type": "text"},
                {"name": "data", "type": "json"},
                {"name": "is_active", "type": "boolean", "default": "true"},
                {"name": "created_at", "type": "datetime"},
                {"name": "updated_at", "type": "datetime"},
            ],
        }))

    return schemas
