from main import mini_kokoro_tts
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import os

AUDIO = "audio.wav"
STORY = "Once upon a time there was a little witch"

def create_audio():
    mini_kokoro_tts(output_path=AUDIO, text=STORY)

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

app = FastAPI()

@app.get("/stream-audio")
async def stream_audio():
    """
    stream an audio source in an async way.
    """
    if not os.path.exists(f"{AUDIO}"):
        create_audio()
        print("created audio")
        
    return StreamingResponse(audio_generator(), media_type="audio/wav")

