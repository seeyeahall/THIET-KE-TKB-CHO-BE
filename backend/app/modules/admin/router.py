from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
import os
import pathlib

router = APIRouter(prefix="/admin", tags=["admin"])

class SystemSetupRequest(BaseModel):
    supabase_url: str
    supabase_service_role_key: str

@router.post("/setup-system")
def setup_system(req: SystemSetupRequest):
    """
    Setup the backend system by writing Supabase config to the .env file.
    This allows configuring the app from the UI when deployed locally or where the filesystem persists.
    """
    # Find the backend root directory (where .env should be)
    current_file = pathlib.Path(__file__)
    backend_dir = current_file.parent.parent.parent.parent  # backend/
    env_file = backend_dir / ".env"
    
    try:
        # Read existing .env to preserve other variables, or create new if not exists
        lines = []
        if env_file.exists():
            with open(env_file, "r", encoding="utf-8") as f:
                lines = f.readlines()
                
        # Update or append Supabase config
        new_lines = []
        found_url = False
        found_key = False
        
        for line in lines:
            if line.startswith("SUPABASE_URL="):
                new_lines.append(f"SUPABASE_URL={req.supabase_url}\n")
                found_url = True
            elif line.startswith("SUPABASE_SERVICE_ROLE_KEY="):
                new_lines.append(f"SUPABASE_SERVICE_ROLE_KEY={req.supabase_service_role_key}\n")
                found_key = True
            else:
                new_lines.append(line)
                
        if not found_url:
            new_lines.append(f"SUPABASE_URL={req.supabase_url}\n")
        if not found_key:
            new_lines.append(f"SUPABASE_SERVICE_ROLE_KEY={req.supabase_service_role_key}\n")
            
        with open(env_file, "w", encoding="utf-8") as f:
            f.writelines(new_lines)
            
        # In uvicorn with --reload, modifying the .env file will trigger an automatic restart.
        # This will automatically reload the environment variables and the database connection.
        
        return {"status": "ok", "message": "System configured successfully. Server is restarting..."}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to write configuration: {str(e)}")
