import warnings
warnings.filterwarnings("ignore", category=UserWarning, module="torch")
warnings.filterwarnings("ignore", category=FutureWarning, module="torch")

from kokoro import KModel, KPipeline
import soundfile as sf
import numpy as np
import torch
import argparse
from consts import MODEL_CONFIG_PATH, MODEL_PTH_PATH, VOICE_PATH, LANGUAGE_CODE, SAMPLE_RATE, REPO_ID
from io import BytesIO
from typing import Optional
import av

class Streamer:
    def __init__(self, debug: bool = False):
        self.debug = debug
        try:
            self.model = KModel(config=MODEL_CONFIG_PATH, model=MODEL_PTH_PATH, repo_id=REPO_ID).eval().cpu()
            self.pipeline = KPipeline(lang_code=LANGUAGE_CODE, model=self.model, device="cpu", repo_id=REPO_ID)
            self.sample_rate = SAMPLE_RATE
            self.voice_path = VOICE_PATH
            self.channels = 1
            self.bytes_written = 0
            self.pts = 0
        except FileNotFoundError as e:
            if self.debug:
                print(f"Error: File not found - {e}")
            raise FileNotFoundError(f"{e}")
        except Exception as e:
            if self.debug:
                print(f"An error occurred: {e}")
            raise Exception(f"{e}")

        # self.debug = debug
        # try:
        #     self.model = KModel(config=MODEL_CONFIG_PATH, model=MODEL_PTH_PATH, repo_id=REPO_ID).eval().cpu()
        #     self.pipeline = KPipeline(lang_code=LANGUAGE_CODE, model=self.model, device="cpu", repo_id=REPO_ID)
        #     self.sample_rate = SAMPLE_RATE
        #     self.voice_path = VOICE_PATH
        #     self.channels = 1
        #     self.bytes_written = 0
        #     self.pts = 0
        #     self.output_buffer = BytesIO()
        #     self.container = av.open(self.output_buffer, mode="w", format="wav")
        #     self.stream = self.container.add_stream(
        #         'pcm_s16le',
        #         sample_rate=self.sample_rate,
        #         layout='mono' if self.channels == 1 else 'stereo'
        #     )
        #     self.stream.bit_rate = 128000
        # except FileNotFoundError as e:
        #     if self.debug:
        #         print(f"Error: File not found - {e}")
        #     raise FileNotFoundError(f"{e}")
        # except Exception as e:
        #     if self.debug:
        #         print(f"An error occurred: {e}")
        #     raise Exception(f"{e}")

    def create_stream_context(self):
        # Create new PyAV container/stream for each request
        output_buffer = BytesIO()
        container = av.open(output_buffer, mode="w", format="wav")
        stream = container.add_stream('pcm_s16le', rate=16000, layout='mono')
        stream.bit_rate = 128000
        return output_buffer, container, stream
        
    # def write_chunk(
    #     self, audio_data: Optional[np.ndarray] = None, finalize: bool = False
    # ) -> bytes:
    #     if audio_data is None or len(audio_data) == 0:
    #         return b""

    #     frame = av.AudioFrame.from_ndarray(
    #         audio_data.reshape(1, -1),
    #         format='s16',
    #         layout='mono' if self.channels == 1 else 'stereo'
    #     )
    #     frame.sample_rate=self.sample_rate
    #     frame.pts = self.pts
    #     self.pts += frame.samples

    #     packets = self.stream.encode(frame)
    #     for packet in packets:
    #         self.container.mux(packet)

    #     data = self.output_buffer.getvalue()
    #     self.output_buffer.seek(0)
    #     self.output_buffer.truncate(0)
    #     return data        

    # def write_chunk(self, audio_data=None, finalize=False):
    #     if audio_data is not None:
    #         frame = av.AudioFrame.from_ndarray(
    #             audio_data.reshape(-1, 1).T,
    #             format='s16',
    #             layout='mono'
    #         )
    #         for packet in self.stream.encode(frame):
    #             self.container.mux(packet)

    #     if finalize:  # Flush encoder
    #         for packet in self.stream.encode(None):
    #             self.container.mux(packet)

    #     data = self.output_buffer.getvalue()
    #     self.output_buffer.seek(0)
    #     self.output_buffer.truncate()
    #     return data

    def write_chunk(self, output_buffer, container, stream, audio_data=None, finalize=False):
        if audio_data is not None and len(audio_data) > 0:
            frame = av.AudioFrame.from_ndarray(
                audio_data.reshape(1, -1),
                format='s16',
                layout='mono' if self.channels == 1 else 'stereo'
            )
            frame.sample_rate = self.sample_rate
            frame.pts = self.pts
            self.pts += frame.samples

            packets = stream.encode(frame)
            for packet in packets:
                container.mux(packet)
            self.frames_written = True  # <-- add this flag

        if finalize and getattr(self, "frames_written", False):
            for packet in stream.encode(None):
                container.mux(packet)

        data = output_buffer.getvalue()
        output_buffer.seek(0)
        output_buffer.truncate(0)
        return data

   
    # async def generate_audio_chunks(self, text: str):
    #     for result in self.pipeline(text, voice=self.voice_path):
    #         if hasattr(result, 'output') and hasattr(result.output, 'audio') and isinstance(result.output.audio, torch.Tensor):
    #             audio_numpy = result.output.audio.cpu().numpy()
    #             encoded_chunk = self.write_chunk(audio_numpy)
    #             yield encoded_chunk
    #         else:
    #             print(f"Warning: No audio in chunk: {result}")

    #     final_chunk = self.write_chunk(finalize=True)
    #     yield final_chunk

    async def generate_audio_chunks(self, text: str):
        output_buffer, container, stream = self.create_stream_context()
        try:
            for result in self.pipeline(text, voice=self.voice_path):
                if hasattr(result, 'output'):
                    audio_numpy = result.output.audio.cpu().numpy()
                    audio_numpy = (audio_numpy * 32767).astype(np.int16)
                    # self._init_container()
                    encoded_chunk = self.write_chunk(output_buffer=output_buffer, container=container, stream=stream, audio_data=audio_numpy)
                    yield encoded_chunk
        finally:
            if container:
                # Send final WAV header
                final_chunk = self.write_chunk(output_buffer=output_buffer, container=container, stream=stream, finalize=True)
                yield final_chunk
                container.close()

                
    async def generate_audio_chunks_from_file(self, audio_path: str):
        """
        generate audio chunks.
        """
        try:
            with open(f"{audio_path}", "rb") as f:
                while chunk := f.read(1024 * 64):
                    yield chunk
        except FileNotFoundError:
            print(f"path {audio_path} not found")
