import asyncio
import sys
import os

# Add the project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.batch_engine import BatchExecutionEngine
from loguru import logger

# Multi-Entity Schema with some deliberate errors
TEST_SCHEMA = [
    {"name": "Teacher", "fields": [{"name": "full_name", "type": "string"}]},
    {"name": "Class", "fields": [{"name": "name", "type": "string"}, {"name": "teacher_id", "type": "uuid"}]},
    {"name": "Broken", "fields": [{"name": "error", "type": "invalid_type"}]}, # Validation failure
    {"name": "CircularA", "fields": [{"name": "circularb_id", "type": "uuid"}]},
    {"name": "CircularB", "fields": [{"name": "circulara_id", "type": "uuid"}]}  # Circular dependency
]

async def mock_creation(schema_dict, is_update=False, force=False):
    if schema_dict["name"] == "CircularA" or schema_dict["name"] == "CircularB":
        # These shouldn't even reach here if SORT works
        pass
    logger.info(f"Mock creating {schema_dict['name']}")
    return True

async def final_stability_test():
    logger.info("🧪 [TEST:STABILITY] Starting final stability test...")
    
    engine = BatchExecutionEngine(TEST_SCHEMA, mock_creation)
    report = await engine.execute()
    
    logger.info(f"Final Report Status: {report['status']}")
    logger.info(f"Created: {report['created']}")
    logger.info(f"Skipped: {report['skipped']}")
    logger.info(f"Failed: {report['failed']}")
    logger.info(f"Errors: {report['errors']}")
    
    # Assertions
    assert report["status"] == "completed"
    assert "Teacher" in report["created"]
    assert "Class" in report["created"]
    assert "Broken" in report["failed"]
    assert "CircularA" in report["failed"]
    assert "CircularB" in report["failed"]
    assert "global" not in report["errors"] # No global crash
    
    logger.info("✅ [TEST:STABILITY] Test passed! System is stable and reports errors gracefully.")

if __name__ == "__main__":
    asyncio.run(final_stability_test())
