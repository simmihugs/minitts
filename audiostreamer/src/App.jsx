import React, { useState, useEffect, useRef, useCallback } from "react";

const ip = "http://localhost";
const inputText =
  "Long ago, in a realm beyond the silver mountains, lived a young prince named Caius. He possessed a voice of pure magic, a voice that could soothe the wildest beasts and mend the brokenhearted. But one day, a shadow fell upon the land. A sorcerer, envious of Caius's gift, stole his song, locking it away in a crystal cage at the heart of the Shadow Peaks.";

export default function App() {
  useEffect(() => {
    const audioContext = new window.AudioContext();
    let nextPlayTime = 0;
    let reader;

    const startStream = async () => {
      try {
        const response = await fetch(`${ip}:8000/stream-audio`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: inputText,
            output_path: "output.wav",
          }),
        });
        reader = response.body.getReader();

        const processChunk = ({ done, value }) => {
          if (done) {
            console.log("Stream complete");
            return;
          }

          // Decode and schedule the audio chunk
          audioContext.decodeAudioData(value.buffer, (decodedBuffer) => {
            const source = audioContext.createBufferSource();
            source.buffer = decodedBuffer;
            source.connect(audioContext.destination);

            if (nextPlayTime === 0) {
              nextPlayTime = audioContext.currentTime + 0.1; // Initial latency buffer
            }

            source.start(nextPlayTime);
            nextPlayTime += decodedBuffer.duration;
          });

          // Read next chunk
          reader.read().then(processChunk);
        };

        // Start reading chunks
        reader.read().then(processChunk);
      } catch (error) {
        console.error("Stream error:", error);
      }
    };

    startStream();

    return () => {
      if (reader) reader.cancel();
      audioContext.close();
    };
  }, []);

  async function fetchit(text) {
    const audioContext = new window.AudioContext();
    let nextPlayTime = 0;
    let reader;

    try {
      const response = await fetch(`${ip}:8000/stream-audio`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: text,
          output_path: "output.wav",
        }),
      });
      reader = response.body.getReader();
      const processChunk = ({ done, value }) => {
        if (done) {
          console.log("Stream complete");
          return;
        }
        audioContext.decodeAudioData(value.buffer, (decodedBuffer) => {
          const source = audioContext.createBufferSource();
          source.buffer = decodedBuffer;
          source.connect(audioContext.destination);
          if (nextPlayTime === 0) {
            nextPlayTime = audioContext.currentTime + 0.1;
          }
          source.start(nextPlayTime);
          nextPlayTime += decodedBuffer.duration;
        });
        reader.read().then(processChunk);
      };
      reader.read().then(processChunk);
    } catch (error) {
      console.error("Stream error:", error);
    }
    return () => {
      if (reader) reader.cancel();
      audioContext.close();
    };
  }

  return (
    <>
      <div>Audio Streaming Player</div>

      <div>
        <button onClick={fetchit("Do you want me to explain this paragraph?")}>
          Stream it
        </button>
        <p>Do you want me to explain this paragraph?</p>
      </div>
      <div>
        <button onClick={fetchit("Want me to make this clearer?")}>
          Stream it
        </button>
        <p>Want me to make this clearer?</p>
      </div>
      <div>
        <button onClick={fetchit("Need assistance with this?")}>
          Stream it
        </button>
        <p>Need assistance with this?</p>
      </div>
      <div>
        <button onClick={fetchit("Should I shed some light on it?")}>
          Stream it
        </button>
        <p>Should I shed some light on it?</p>
      </div>
    </>
  );
}
