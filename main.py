from kokoro import KModel, KPipeline
import soundfile as sf
import numpy as np
import torch
import argparse

MODEL_CONFIG_PATH = "/home/simmi/Projects/minitts/models/v1_0/config.json"
MODEL_PTH_PATH = "/home/simmi/Projects/minitts/models/v1_0/kokoro-v1_0.pth"
VOICE_PATH = "/home/simmi/Projects/minitts/voices/v1_0/am_adam.pt"
LANGUAGE_CODE = "a"
SAMPLE_RATE = 24000


def mini_kokoro_tts(output_path: str, text: str):
    """
    Creates an audio from given text and stores as wav.
    """
    try:
        print("Load model")
        model = KModel(config=MODEL_CONFIG_PATH, model=MODEL_PTH_PATH).eval().cpu()
        print("Estabilsh pipeline")
        pipeline = KPipeline(lang_code=LANGUAGE_CODE, model=model, device="cpu")
        audio_segments = []
        print("Create audio")
        for result in pipeline(text, voice=VOICE_PATH):
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

            sf.write(output_path, full_audio, SAMPLE_RATE)
            print(f"Audio saved successfully to: {output_path}")
        else:
            print("Error: No usable audio data received from the pipeline.")

    except FileNotFoundError as e:
        print(f"Error: File not found - {e}")
    except Exception as e:
        print(f"An error occurred: {e}")

def main():
    parser = argparse.ArgumentParser(description="Text to speech tooly")
    parser.add_argument('-t', '--text', required=True, help='Text to be created into audio speech.')
    parser.add_argument('-o', '--output', required=False, help='Output path.')
    args = parser.parse_args()
    mini_kokoro_tts(text=f"{args.text}", output_path="output.wav" if args.output == None else args.output)

if __name__ == "__main__":
    main()
