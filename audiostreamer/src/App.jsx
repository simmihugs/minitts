import React, { useState, useEffect, useRef, useCallback } from "react";
// REMOVED: import { Play, StopCircle, Volume2, DownloadCloud, Loader2, XCircle } from "lucide-react";
const ip = "http://localhost";

const AudioStreamPlayer = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [volume, setVolume] = useState(100); // 0-100
  const audioRefs = useRef([]);

  // Function to add a new message to the chat
  const addMessage = useCallback((message) => {
    setMessages((prevMessages) => [...prevMessages, message]);
  }, []);

  // Function to send the text and receive audio stream
  const sendText = useCallback(async () => {
    if (!inputText.trim()) return;

    // Add the user's text message
    addMessage({ type: "text", content: inputText });
    setInputText(""); // Clear the input

    // Add a placeholder message for the audio response
    addMessage({
      type: "audio",
      content: "Generating audio...",
      isLoading: true,
      audioRef: React.createRef(), // Create a ref
    });

    try {
      const response = await fetch(`${ip}:8000/stream-audio`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: inputText,
          output_path: "output.wav", // This path is relevant to the server
        }),
      });

      if (!response.ok) {
        console.error(`HTTP error! status: ${response.status}`);
        // Update the message with an error state
        setMessages((prevMessages) =>
          prevMessages.map((m) =>
            m.isLoading
              ? { ...m, isLoading: false, content: "Error generating audio" }
              : m,
          ),
        );
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      // Update the message with the audio URL and remove loading state
      setMessages((prevMessages) =>
        prevMessages.map((m) =>
          m.isLoading
            ? {
                ...m,
                audioUrl: url,
                isLoading: false,
                content: "Audio Response", // Or any other suitable message
                isPlaying: false,
              }
            : m,
        ),
      );
    } catch (error) {
      console.error("Error fetching audio stream:", error);
      // Update the message with an error state
      setMessages((prevMessages) =>
        prevMessages.map((m) =>
          m.isLoading
            ? { ...m, isLoading: false, content: "Error fetching audio" }
            : m,
        ),
      );
    }
  }, [inputText, addMessage]);

  // Handle input change
  const handleInputChange = (e) => {
    setInputText(e.target.value);
  };

  // Handle key press (for Enter to send)
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      sendText();
    }
  };

  // Handle play/pause
  const handlePlayPause = useCallback((index) => {
    setMessages((prevMessages) =>
      prevMessages.map((msg, i) => {
        if (i === index && msg.type === "audio") {
          const newIsPlaying = !msg.isPlaying;
          if (msg.audioRef?.current) {
            if (newIsPlaying) {
              msg.audioRef.current.play().catch((e) => {
                console.error("Playback failed:", e);
                setMessages((prev) =>
                  prev.map((m, mi) =>
                    mi === index ? { ...m, isPlaying: false } : m,
                  ),
                );
              });
            } else {
              msg.audioRef.current.pause();
            }
          }
          return { ...msg, isPlaying: newIsPlaying };
        }
        return msg;
      }),
    );
  }, []);

  // Handle volume change
  const handleVolumeChange = useCallback((newVolume) => {
    setVolume(newVolume[0]);
    // Apply volume to all playing audio elements
    audioRefs.current.forEach((audioRef) => {
      if (audioRef.current) {
        audioRef.current.volume = newVolume[0] / 100; // Volume is 0-1
      }
    });
    setMessages((prevMessages) =>
      prevMessages.map((msg) => {
        if (msg.type === "audio" && msg.isPlaying && msg.audioRef?.current) {
          msg.audioRef.current.volume = newVolume[0] / 100;
        }
        return msg;
      }),
    );
  }, []);

  // Handle Download
  const handleDownload = useCallback((audioUrl, fileName = "audio.wav") => {
    fetch(audioUrl)
      .then((response) => response.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName; // Set the filename
        document.body.appendChild(a); // Append, trigger, and remove
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url); // Clean up the URL object
      })
      .catch((error) => {
        console.error("Error downloading audio:", error);
      });
  }, []);

  // Clear all messages
  const clearChat = () => {
    setMessages([]);
  };

  useEffect(() => {
    audioRefs.current = messages.map(
      (msg) => msg.audioRef || React.createRef(),
    );
  }, [messages]);

  // Inline styles object (since we're avoiding external CSS)
  const styles = {
    container: {
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      backgroundColor: "#f3f4f6", // bg-gray-100
    },
    chatMessagesArea: {
      flex: 1,
      overflowY: "auto",
      padding: "1rem",
      spaceY: "1rem",
    },
    message: {
      display: "inline-flex",
      maxWidth: "70%",
      borderRadius: "0.75rem",
      padding: "0.75rem",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)", // shadow-md
    },
    textMessage: {
      backgroundColor: "#3b82f6", // bg-blue-500
      color: "#fff", // text-white
      marginLeft: "auto",
    },
    audioMessage: {
      backgroundColor: "#e5e7eb", // bg-gray-200
      color: "#374151", // text-gray-800
    },
    inputArea: {
      padding: "1rem",
      borderTop: "1px solid #d1d5db", // border-t border-gray-200
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
    },
    input: {
      flex: 1,
      padding: "0.75rem",
      borderRadius: "0.375rem",
      border: "1px solid #d1d5db",
      outline: "none",
    },
    button: {
      padding: "0.75rem 1rem",
      borderRadius: "0.375rem",
      backgroundColor: "#3b82f6",
      color: "#fff",
      cursor: "pointer",
      "&:disabled": {
        opacity: 0.5,
        cursor: "not-allowed",
      },
      "&:hover": {
        backgroundColor: "#2563eb",
      },
    },
    destructiveButton: {
      backgroundColor: "#dc2626",
      color: "#fff",
      "&:hover": {
        backgroundColor: "#b91c1c",
      },
    },
    playPauseButton: {
      borderRadius: "9999px", // rounded-full
      padding: "0.5rem",
      border: "1px solid #6b7280",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
    },
    volumeContainer: {
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
    },
    volumeSlider: {
      width: "8rem",
    },
    downloadButton: {
      color: "#3b82f6", // text-blue-500
      "&:hover": {
        color: "#1e40af", // hover:text-blue-700
      },
      padding: "0.25rem",
    },
    loader: {
      animation: "spin 1s linear infinite",
    },
    "@keyframes spin": {
      from: { transform: "rotate(0deg)" },
      to: { transform: "rotate(360deg)" },
    },
  };

  return (
    <div style={styles.container}>
      {/* Chat Messages Area */}
      <div style={styles.chatMessagesArea}>
        {messages.map((message, index) => (
          <div
            key={index}
            style={{
              ...styles.message,
              ...(message.type === "text"
                ? styles.textMessage
                : styles.audioMessage),
            }}
          >
            {message.type === "text" ? (
              <p>{message.content}</p>
            ) : (
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                {message.isLoading ? (
                  <>
                    <svg
                      style={styles.loader}
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-loader-2"
                    >
                      <path d="M21 12a9 9 0 1 0-6.21-8.53"></path>
                      <path d="M12 3v5"></path>
                    </svg>
                    <p>{message.content}</p>
                  </>
                ) : message.audioUrl ? (
                  <>
                    <audio
                      ref={audioRefs[index]}
                      src={message.audioUrl}
                      hidden
                      onEnded={() =>
                        setMessages((prev) =>
                          prev.map((m, i) =>
                            i === index ? { ...m, isPlaying: false } : m,
                          ),
                        )
                      }
                    />
                    <button
                      style={styles.playPauseButton}
                      onClick={() => handlePlayPause(index)}
                    >
                      {message.isPlaying ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="lucide lucide-stop-circle"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <rect x="9" y="9" width="6" height="6" />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="lucide lucide-play"
                        >
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                      )}
                    </button>
                    <div style={styles.volumeContainer}>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={volume}
                        onChange={(e) =>
                          handleVolumeChange([parseInt(e.target.value, 10)])
                        }
                        style={styles.volumeSlider}
                      />
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-volume-2"
                      >
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                      </svg>
                    </div>

                    <button
                      style={styles.downloadButton}
                      onClick={() => handleDownload(message.audioUrl)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-download-cloud"
                      >
                        <path d="M8 17.93a4 4 0 0 0 8 0" />
                        <path d="M12 12v6.93" />
                        <path d="M12 12l-4-4" />
                        <path d="M12 12l4-4" />
                        <path d="M20 16.71A8 8 0 1 0 4.29 7.3" />
                      </svg>
                    </button>
                  </>
                ) : (
                  <p>{message.content}</p> // Display message content
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div style={styles.inputArea}>
        <input
          type="text"
          placeholder="Enter text to convert to audio..."
          value={inputText}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          style={styles.input}
        />
        <button
          onClick={sendText}
          disabled={!inputText.trim()}
          style={styles.button}
        >
          Send
        </button>
        <button
          onClick={clearChat}
          style={{ ...styles.button, ...styles.destructiveButton }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-x-circle"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="m15 9-6 6" />
            <path d="m9 9 6 6" />
          </svg>
          Clear
        </button>
      </div>
    </div>
  );
};

export default function App() {
  return <AudioStreamPlayer />;
}
