import warnings
warnings.filterwarnings("ignore", category=UserWarning, module="torch")
warnings.filterwarnings("ignore", category=FutureWarning, module="torch")

from kokoro import KModel, KPipeline
import soundfile as sf
import numpy as np
import torch
import argparse
from consts import MODEL_CONFIG_PATH, MODEL_PTH_PATH, VOICE_PATH, LANGUAGE_CODE, SAMPLE_RATE, REPO_ID

class SpeechCreator:
    def __init__(self, debug: bool = False):
        self.debug = debug
        try:
            self.model = KModel(config=MODEL_CONFIG_PATH, model=MODEL_PTH_PATH, repo_id=REPO_ID).eval().cpu()
            self.pipeline = KPipeline(lang_code=LANGUAGE_CODE, model=self.model, device="cpu", repo_id=REPO_ID)
        except FileNotFoundError as e:
            if self.debug:
                print(f"Error: File not found - {e}")
            raise FileNotFoundError(f"{e}")
        except Exception as e:
            if self.debug:
                print(f"An error occurred: {e}")
            raise Exception(f"{e}")

    def create_audio(self, output_path: str, text: str):
        """
        Creates an audio from given text and stores as wav.
        """
        audio_segments = []
        for result in self.pipeline(text, voice=VOICE_PATH):
            if (
                hasattr(result, "output")
                and hasattr(result.output, "audio")
                and isinstance(result.output.audio, torch.Tensor)
            ):
                audio_numpy = result.output.audio.cpu().numpy()
                audio_segments.append(audio_numpy)
                if self.debug:
                    print(f"Appended audio chunk with shape: {audio_numpy.shape}")
            else:
                if self.debug: 
                    print(
                        f"Warning: Result object does not contain expected audio tensor: {result}"
                    )
            if audio_segments:
                full_audio = np.concatenate(audio_segments, axis=0)
                if self.debug:
                    print(f"Generated full audio with shape: {full_audio.shape}")

                sf.write(output_path, full_audio, SAMPLE_RATE)
                if self.debug:
                    print(f"Audio saved successfully to: {output_path}")
            else:
                if self.debug:
                    print("Error: No usable audio data received from the pipeline.")

