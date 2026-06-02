from pydantic import BaseModel


class NotImplementedResponse(BaseModel):
    detail: str = "Endpoint skeleton only. Implement service/database logic next."

