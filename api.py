from pydantic import BaseModel
from speechcreator import SpeechCreator
from streamer import Streamer
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import os

AUDIO = "audio.wav"
STORY = "Once upon a time there was a little witch"

app = FastAPI()
speech_creator = SpeechCreator()
streamer = Streamer()

def create_audio():
    speech_creator.create_audio(output_path=AUDIO, text=STORY)

async def audio_generator():
    """
    generate audio chunks.
    """
    try:
        with open(f"{AUDIO}", "rb") as f:
            while chunk := f.read(1024 * 64):
                yield chunk
    except FileNotFoundError:
        print(f"path {AUDIO} not found")

@app.get("/stream-audio-static")
async def stream_audio_static():
    """
    stream an audio source in an async way.
    """
    if not os.path.exists(f"{AUDIO}"):
        create_audio()
        print("created audio")
        
    return StreamingResponse(audio_generator(), media_type="audio/wav")


class MyRequest(BaseModel):
    text: str

@app.post("/stream-audio")
async def audio_stream_exp(request: MyRequest):
    return StreamingResponse(streamer.generate_audio_chunks(request.text), media_type="audio/wav")
