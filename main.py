from api.speechcreator import SpeechCreator
import argparse

def main():
    parser = argparse.ArgumentParser(description="Text to speech tooly")
    parser.add_argument('-t', '--text', required=True, help='Text to be created into audio speech.')
    parser.add_argument('-o', '--output', required=False, help='Output path.')
    args = parser.parse_args()
    speech_creator = SpeechCreator()
    speech_creator.create_audio(text=f"{args.text}", output_path="output.wav" if args.output is None else args.output)

if __name__ == "__main__":
    main()
