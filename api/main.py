from api.speechcreator import SpeechCreator
from api.streamer import Streamer
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import os
from api.models.myrequest import MyRequest

streamer = Streamer()
app = FastAPI()

origins = [
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=["*"],
)

@app.get("/api/data")
async def get_data():
    return {"message": "data from backend"}

@app.post("/stream-audio-static")
async def stream_audio_static(request: MyRequest):
    if not os.path.exists(request.output_path):
        speech_creator = SpeechCreator()
        speech_creator.create_audio(output_path=request.output_path, text=request.text)
    return StreamingResponse(
        streamer.generate_audio_chunks_from_file(request.output_path),
        media_type="audio/wav",
    )


@app.post("/stream-audio")
async def audio_stream(request: MyRequest):
    return StreamingResponse(
        streamer.generate_audio_chunks(request.text), media_type="audio/wav"
    )
