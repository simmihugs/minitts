function AudioStreamPlayer() {
  return (
    <audio controls src="http://localhost:8000/stream-audio">
      Audio player not available
    </audio>
  );
}

export default function App() {
  return <AudioStreamPlayer />;
}
