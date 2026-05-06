import uvicorn
import os
from dotenv import load_dotenv

if __name__ == "__main__":
    load_dotenv()
    
    # Get settings from .env or use defaults
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", 8001))
    
    print(f"Starting Backend at http://{host}:{port}")
    print(f"Dashboard: http://{host}:{port}/dashboard")
    print("-" * 40)
    
    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=True,
        log_level="info"
    )
