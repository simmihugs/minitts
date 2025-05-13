import React, { useState, useEffect, useRef } from "react";

const ip = "http://localhost";

function AudioStreamPlayer({ text }) {
  const [audioSource, setAudioSource] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => {
    async function fetchAudioStream() {
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

        if (!response.ok) {
          console.error(`HTTP error! status: ${response.status}`);
          return;
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setAudioSource(url);

        if (audioRef.current) {
          audioRef.current.load();
        }
      } catch (error) {
        console.error("Error fetching audio stream:", error);
      }
    }

    fetchAudioStream();

    return () => {
      if (audioSource) {
        URL.revokeObjectURL(audioSource);
      }
    };
  }, []);

  return (
    <audio controls src={audioSource} ref={audioRef}>
      Audio player not available
    </audio>
  );
}

function AudioStreamPlayerStatic() {
  const [audioSource, setAudioSource] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => {
    async function fetchAudioStream() {
      try {
        const response = await fetch(`${ip}:8000/stream-audio-static`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: "Magdalena",
            output_path: "test12.wav",
          }),
        });

        if (!response.ok) {
          console.error(`HTTP error! status: ${response.status}`);
          return;
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setAudioSource(url);

        if (audioRef.current) {
          audioRef.current.load();
        }
      } catch (error) {
        console.error("Error fetching audio stream:", error);
      }
    }

    fetchAudioStream();

    return () => {
      if (audioSource) {
        URL.revokeObjectURL(audioSource);
      }
    };
  }, []);

  return (
    <audio controls src={audioSource} ref={audioRef}>
      Audio player not available
    </audio>
  );
}

export default function App() {
  return (
    <>
      {/*
         <AudioStreamPlayer text="Elara's voice rose and fell, painting vivid images of the prince's sorrow, the sorcerer's dark power, and the perilous journey to the Shadow Peaks. She described the treacherous paths, the whispering winds that carried secrets, and the strange creatures that guarded the crystal cage." />
         <AudioStreamPlayer text="Hi, how are you?" />
        */}
      <AudioStreamPlayerStatic />
    </>
  );
}
