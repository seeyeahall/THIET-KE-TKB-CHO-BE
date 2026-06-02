from uuid import UUID


async def build_child_context(child_id: UUID) -> dict[str, object]:
    return {
        "child_id": str(child_id),
        "status": "skeleton",
        "sources": ["children", "schedules", "activities", "chat_history", "rewards"],
    }

