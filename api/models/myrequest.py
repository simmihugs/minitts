from pydantic import BaseModel
import hashlib

class MyRequest(BaseModel):
    text: str

    def output_path(self) -> str:
        text_bytes = self.text.encode('utf-8')
        hashed_text = hashlib.md5(text_bytes).hexdigest()
        return f"{hashed_text}.wav"
