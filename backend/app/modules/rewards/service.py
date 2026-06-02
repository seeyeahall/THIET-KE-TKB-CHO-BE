from uuid import UUID


def grant_completion_reward(child_id: UUID, schedule_item_id: UUID) -> dict[str, int]:
    return {"coins": 0, "xp": 0}

