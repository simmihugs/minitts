from pydantic import BaseModel
from speechcreator import SpeechCreator
from streamer import Streamer
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import os

class MyRequest(BaseModel):
    text: str
    output_path: str
    
app = FastAPI()

@app.post("/stream-audio-static")
async def stream_audio_static(request: MyRequest):
    """
    stream an audio source in an async way.
    """
    if not os.path.exists(request.output_path):
        speech_creator = SpeechCreator()
        speech_creator.create_audio(output_path=request.output_path, text=request.text)
    streamer = Streamer()
    return StreamingResponse(
        streamer.generate_audio_chunks_from_file(request.output_path),
        media_type="audio/wav"
    )

@app.post("/stream-audio")
async def audio_stream(request: MyRequest):
    streamer = Streamer()
    return StreamingResponse(
        streamer.generate_audio_chunks(request.text), 
        media_type="audio/wav"
    )
