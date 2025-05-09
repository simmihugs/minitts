from kokoro import KModel, KPipeline
import soundfile as sf
import numpy as np
import torch

model_config_path = "models/v1_0/config.json"
model_pth_path = "models/v1_0/kokoro-v1_0.pth"
voice_path = "voices/v1_0/am_adam.pt"
output_audio_path = "output.wav"

text_to_synthesize = "I am just a dreamer! I dream my live away... tam tam"
language_code = "a"
sample_rate = 24000

try:
    # 1. Load the KModel
    model = KModel(config=model_config_path, model=model_pth_path).eval().cpu()

    # 2. Create a KPipeline
    pipeline = KPipeline(lang_code=language_code, model=model, device="cpu")

    # 3. Run Generation and Collect Audio
    audio_segments = []
    for result in pipeline(text_to_synthesize, voice=voice_path):
        if (
            hasattr(result, "output")
            and hasattr(result.output, "audio")
            and isinstance(result.output.audio, torch.Tensor)
        ):
            audio_numpy = result.output.audio.cpu().numpy()
            audio_segments.append(audio_numpy)
            print(f"Appended audio chunk with shape: {audio_numpy.shape}")
        else:
            print(
                f"Warning: Result object does not contain expected audio tensor: {result}"
            )

    if audio_segments:
        full_audio = np.concatenate(audio_segments, axis=0)
        print(f"Generated full audio with shape: {full_audio.shape}")

        # 4. Save the audio to a .wav file
        sf.write(output_audio_path, full_audio, sample_rate)
        print(f"Audio saved successfully to: {output_audio_path}")
    else:
        print("Error: No usable audio data received from the pipeline.")

except FileNotFoundError as e:
    print(f"Error: File not found - {e}")
except Exception as e:
    print(f"An error occurred: {e}")
