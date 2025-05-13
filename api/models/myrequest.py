from pydantic import BaseModel

class MyRequest(BaseModel):
    text: str
    output_path: str
