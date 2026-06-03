from uuid import UUID, uuid4
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from app.core.config import get_settings
from app.core.database import get_supabase_client
from app.core.dependencies import get_current_family
from app.core.security import CurrentUser, get_current_user

router = APIRouter(prefix="/media", tags=["media"])


class SignUploadRequest(BaseModel):
    asset_type: str = Field(pattern="^(avatar|activity|theme|chat)$")
    child_id: UUID | None = None
    filename: str = Field(min_length=1, max_length=180)
    content_type: str


class ConfirmUploadRequest(BaseModel):
    bucket: str
    path: str
    asset_type: str = Field(pattern="^(avatar|activity|theme|chat)$")
    child_id: UUID | None = None
    public_url: str | None = None


BUCKET_MAP = {
    "avatar": "avatars",
    "activity": "activity-images",
    "theme": "theme-images",
    "chat": "chat-images",
}


@router.post("/sign-upload")
def sign_upload(
    payload: SignUploadRequest,
    family: dict = Depends(get_current_family),
    user: CurrentUser = Depends(get_current_user),
) -> dict[str, object]:
    settings = get_settings()
    client = get_supabase_client()
    bucket = BUCKET_MAP.get(payload.asset_type)
    if not bucket:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid asset type")

    ext = payload.filename.split(".")[-1].lower() if "." in payload.filename else "bin"
    safe_name = f"{uuid4()}.{ext}"
    family_id = str(family["id"])
    path = f"{family_id}/{safe_name}"

    try:
        # Supabase Python client v2: storage.from_(bucket).create_signed_upload_url(path)
        storage = client.storage.from_(bucket)
        result = storage.create_signed_upload_url(path)
        signed_url = result.get("signedURL") or result.get("signedUrl")
        token = result.get("token")
        if not signed_url:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create signed URL")
        return {
            "signed_url": signed_url,
            "token": token,
            "bucket": bucket,
            "path": path,
            "public_url": f"{settings.supabase_url}/storage/v1/object/public/{bucket}/{path}",
        }
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Storage error: {exc}") from exc


@router.post("/confirm-upload")
def confirm_upload(
    payload: ConfirmUploadRequest,
    family: dict = Depends(get_current_family),
    user: CurrentUser = Depends(get_current_user),
) -> dict[str, object]:
    client = get_supabase_client()
    data = {
        "family_id": str(family["id"]),
        "child_id": str(payload.child_id) if payload.child_id else None,
        "bucket": payload.bucket,
        "path": payload.path,
        "asset_type": payload.asset_type,
        "public_url": payload.public_url,
        "source": "upload",
        "metadata": {"content_type": payload.content_type} if hasattr(payload, "content_type") else {},
    }
    result = client.table("media_assets").insert(data).execute()
    return {"status": "ok", "asset": result.data[0] if result.data else {}}


@router.get("/assets")
def list_assets(
    asset_type: str | None = None,
    child_id: UUID | None = None,
    family: dict = Depends(get_current_family),
    user: CurrentUser = Depends(get_current_user),
) -> list[dict[str, object]]:
    client = get_supabase_client()
    q = client.table("media_assets").select("*").eq("family_id", str(family["id"])).is_("deleted_at", None)
    if asset_type:
        q = q.eq("asset_type", asset_type)
    if child_id:
        q = q.eq("child_id", str(child_id))
    return q.execute().data or []
