import React from "react";
import { Volume2, VolumeX } from "lucide-react";
import agoraService from "../services/agoraService";
import "./ChatMessage.css";

const ChatMessage = ({ message, onPlayAudio }) => {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [audioError, setAudioError] = React.useState(false);

  const handlePlayAudio = async () => {
    if (isPlaying) return;

    try {
      setIsPlaying(true);
      setAudioError(false);

      await agoraService.textToSpeech(message.text);
    } catch (error) {
      console.error("Lỗi khi phát audio:", error);
      setAudioError(true);
    } finally {
      setIsPlaying(false);
    }
  };

  return (
    <div className={`chat-message ${message.sender}`}>
      <div className="message-content">
        <div className="message-text">{message.text}</div>
        <div className="message-meta">
          <span className="message-time">{message.timestamp}</span>
          {message.sender === "bot" && (
            <button
              className={`audio-button ${isPlaying ? "playing" : ""} ${
                audioError ? "error" : ""
              }`}
              onClick={handlePlayAudio}
              disabled={isPlaying}
              title={
                isPlaying
                  ? "Đang phát..."
                  : audioError
                  ? "Lỗi phát audio"
                  : "Phát âm"
              }
            >
              {audioError ? <VolumeX size={16} /> : <Volume2 size={16} />}
              {isPlaying && <div className="audio-spinner"></div>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
