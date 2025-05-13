# minitts
A minimal test runner for a tts model

## Usage
    ```shell
    usage: main.py [-h] -t TEXT [-o OUTPUT]
    
    Text to speech tooly
    
    options:
      -h, --help            show this help message and exit
      -t TEXT, --text TEXT  Text to be created into audio speech.
      -o OUTPUT, --output OUTPUT
                            Output path.
    ```

## API
   ```shell
   uvicorn api:app --reload 
   ```
