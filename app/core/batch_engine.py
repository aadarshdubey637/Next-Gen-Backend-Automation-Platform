"""
Dependency Graph and Topological Sorting for Batch Schema Generation.
Handles entity relationships and determines correct execution order.
"""
from typing import List, Dict, Set, Tuple, Any
from loguru import logger
from collections import defaultdict, deque
from app.schemas.schema_input import SchemaInput
from app.core.schema_parser import parse_json_schema

class DependencyResolver:
    """
    Analyzes a set of SchemaInput objects, builds a dependency graph, 
    and determines the optimal creation order.
    """
    def __init__(self, schemas: List[SchemaInput], existing_names: Set[str] = None):
        self.schemas = schemas
        self.existing_names = existing_names or set()
        self.entities: Dict[str, SchemaInput] = {s.name: s for s in schemas}
        self.graph = defaultdict(list)
        self.in_degree = defaultdict(int)
        self._build_graph()

    def _extract_dependencies(self, schema: SchemaInput) -> Set[str]:
        """
        Detect dependencies based on field names (e.g., student_id -> Student).
        Uses the parsed SchemaInput for more reliability.
        """
        deps = set()
        
        # Build a mapping of potential table names to match against
        # Includes both provided schemas and existing schemas in the DB
        lookup = {}
        all_known_names = set(self.entities.keys()) | self.existing_names
        
        for name in all_known_names:
            n = name.lower()
            lookup[n] = name
            # Handle pluralization
            if n.endswith('s'):
                lookup[n[:-1]] = name
            else:
                lookup[f"{n}s"] = name

        for field in schema.fields:
            fname = field.name.lower()
            target = None
            
            if fname.endswith("_id"):
                target = lookup.get(fname[:-3])
            elif fname.endswith("id") and len(fname) > 2:
                target = lookup.get(fname[:-2])
            
            if target and target != schema.name:
                deps.add(target)
                logger.debug(f"Detected dependency: {schema.name} -> {target} via {field.name}")
        
        return deps

    def _build_graph(self):
        """Build the adjacency list and calculate in-degrees."""
        for name in self.entities.keys():
            self.in_degree[name] = 0

        for name, schema in self.entities.items():
            deps = self._extract_dependencies(schema)
            for dep in deps:
                # If the dependency is something we are about to create, add to graph
                if dep in self.entities:
                    self.graph[dep].append(name)
                    self.in_degree[name] += 1
                # If it's already in the DB, it's already satisfied, no need to add to graph
                elif dep in self.existing_names:
                    logger.debug(f"Dependency {dep} for {name} is already satisfied by DB.")
                else:
                    logger.warning(f"Entity {name} depends on {dep}, which is neither in the batch nor in the DB.")

    def resolve(self) -> Tuple[List[str], List[str]]:
        """
        Performs topological sort. 
        Returns (ordered_names, circular_dependencies).
        """
        queue = deque([name for name in self.entities.keys() if self.in_degree[name] == 0])
        ordered = []
        
        while queue:
            u = queue.popleft()
            ordered.append(u)
            
            if u in self.graph:
                for v in self.graph[u]:
                    self.in_degree[v] -= 1
                    if self.in_degree[v] == 0:
                        queue.append(v)
        
        cycles = []
        if len(ordered) != len(self.entities):
            remaining = set(self.entities.keys()) - set(ordered)
            cycles = list(remaining)
            
        return ordered, cycles

class BatchExecutionEngine:
    """
    Ultra-Robust Execution Engine: INIT → VALIDATE → SORT → EXECUTE → FINALIZE.
    Guaranteed to never crash the entire batch; always returns a structured report.
    """
    def __init__(self, raw_schemas: List[Dict], creation_func: Any, existing_metadata: Dict[str, Dict] = None, force: bool = False):
        self.raw_schemas = raw_schemas
        self.creation_func = creation_func
        self.existing_metadata = existing_metadata or {}
        self.force = force
        self.report = {
            "status": "INIT",
            "created": [],
            "updated": [],
            "skipped": [],
            "failed": [],
            "errors": {}
        }

    async def execute(self) -> Dict[str, Any]:
        logger.info("🚀 [BULK:INIT] Starting robust bulk generation pipeline...")
        
        try:
            # 1. VALIDATE & PARSE
            logger.info(f"🔍 [BULK:VALIDATE] Validating {len(self.raw_schemas)} schemas...")
            self.report["status"] = "VALIDATE"
            parsed_schemas: List[SchemaInput] = []
            entity_map: Dict[str, Dict] = {} 
            
            for rs in self.raw_schemas:
                name = rs.get("name") or rs.get("title", "Unknown")
                entity_map[name] = rs
                
                try:
                    from app.core.schema_parser import parse_json_schema, get_schema_hash
                    schema = parse_json_schema(rs)
                    current_hash = get_schema_hash(schema)
                    rs["_hash"] = current_hash
                    
                    # Logic check: Should we skip?
                    if name in self.existing_metadata and not self.force:
                        old_meta = self.existing_metadata[name]
                        if old_meta.get("hash") == current_hash:
                            logger.info(f"⏭️ [BULK:SKIP] {name} - No structural changes detected.")
                            self.report["skipped"].append(name)
                            continue
                        else:
                            logger.info(f"📝 [BULK:UPDATE] {name} - Change detected.")
                            rs["_is_update"] = True
                    
                    parsed_schemas.append(schema)
                    logger.debug(f"✅ [BULK:VALIDATE] {name} passed validation.")
                except Exception as e:
                    logger.error(f"❌ [BULK:VALIDATE] {name} failed: {e}")
                    self.report["failed"].append(name)
                    self.report["errors"][name] = f"Validation failed: {str(e)}"

            # 2. SORT (Dependency Resolution)
            logger.info("🔗 [BULK:SORT] Building dependency graph and resolving order...")
            self.report["status"] = "SORT"
            try:
                resolver = DependencyResolver(parsed_schemas, set(self.existing_metadata.keys()))
                order, cycles = resolver.resolve()
                
                if cycles:
                    for name in cycles:
                        logger.error(f"🔄 [BULK:SORT] Circular dependency detected for {name}")
                        if name not in self.report["failed"] and name not in self.report["skipped"]:
                            self.report["failed"].append(name)
                            self.report["errors"][name] = "Circular dependency detected."
                
                logger.info(f"📊 [BULK:SORT] Execution order determined: {' -> '.join(order)}")
            except Exception as e:
                logger.critical(f"💥 [BULK:SORT] Critical failure in dependency resolution: {e}")
                self.report["status"] = "SORT_FAILED"
                self.report["errors"]["global"] = f"Dependency resolution failed: {str(e)}"
                return self.report

            # 3. EXECUTE (CREATE/UPDATE)
            logger.info(f"🏗️ [BULK:EXECUTE] Processing {len(order)} entities in sorted order...")
            self.report["status"] = "EXECUTE"
            available_entities = set(self.existing_metadata.keys())

            for name in order:
                raw_entity = entity_map[name]
                schema_obj = resolver.entities[name]
                
                # Double-check dependencies are satisfied
                deps = resolver._extract_dependencies(schema_obj)
                failed_deps = [d for d in deps if d in self.report["failed"]]
                
                if failed_deps:
                    logger.warning(f"⏭️ [BULK:EXECUTE] {name} skipped because dependencies failed: {failed_deps}")
                    self.report["failed"].append(name)
                    self.report["errors"][name] = f"Dependency failed: {', '.join(failed_deps)}"
                    continue

                try:
                    is_update = raw_entity.get("_is_update", False)
                    logger.info(f"🔨 [BULK:EXECUTE] Processing {name} (Update: {is_update}, Force: {self.force})...")
                    
                    await self.creation_func(raw_entity, is_update=is_update, force=self.force)
                    
                    if is_update and not self.force:
                        self.report["updated"].append(name)
                    else:
                        self.report["created"].append(name)
                        
                    available_entities.add(name)
                    logger.info(f"✅ [BULK:EXECUTE] {name} processed successfully.")
                except Exception as e:
                    logger.error(f"❌ [BULK:EXECUTE] {name} failed: {e}")
                    if name not in self.report["failed"]:
                        self.report["failed"].append(name)
                    self.report["errors"][name] = str(e)

            # 4. FINALIZE
            logger.info("🏁 [BULK:FINALIZE] Cleaning up and finalizing batch...")
            self.report["status"] = "completed"
            return self.report

        except Exception as e:
            logger.critical(f"💥 [BULK:FATAL] Unexpected pipeline crash: {e}")
            self.report["status"] = "completed"
            self.report["errors"]["global"] = f"Internal Engine Error: {str(e)}"
            return self.report

# ── Simulation Function ────────────────────────────────
async def simulate_creation(schema_dict: Dict):
    """Mocks the creation process for testing/validation."""
    import asyncio
    # Just parse it to ensure it's valid
    parse_json_schema(schema_dict)
    await asyncio.sleep(0.01) # Simulate some work
    return True
