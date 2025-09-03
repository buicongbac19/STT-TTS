import React, { useState, useRef, useEffect } from "react";
import { Send, Mic, MicOff } from "lucide-react";
import agoraService from "../services/agoraService";
import "./ChatInput.css";

const ChatInput = ({ onSendMessage, disabled }) => {
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingError, setRecordingError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled && !isProcessing) {
      onSendMessage(message.trim());
      setMessage("");
      setRecordingError("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const startRecording = async () => {
    try {
      setRecordingError("");
      setIsProcessing(true);

      await agoraService.startRecording();
      setIsRecording(true);
      console.log("Bắt đầu ghi âm...");
    } catch (error) {
      console.error("Lỗi khi bắt đầu ghi âm:", error);
      setRecordingError(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const stopRecording = async () => {
    try {
      setIsProcessing(true);

      const transcription = await agoraService.stopRecording();
      setIsRecording(false);

      console.log("✅ Nhận được transcription:", transcription);

      if (transcription && transcription.trim()) {
        setMessage((prev) => prev + (prev ? " " : "") + transcription.trim());
        if (inputRef.current) {
          inputRef.current.focus();
        }
      } else {
        setRecordingError("Không thể nhận dạng giọng nói. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Lỗi khi dừng ghi âm:", error);
      setRecordingError(error.message);
      setIsRecording(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleRecording = () => {
    if (isProcessing) return;

    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const clearError = () => {
    setRecordingError("");
  };

  return (
    <div className="chat-input-container">
      {recordingError && (
        <div className="error-message">
          <span>{recordingError}</span>
          <button onClick={clearError} className="error-close">
            ×
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="chat-input-form">
        <div className="input-wrapper">
          <textarea
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              isRecording
                ? "Đang ghi âm..."
                : "Nhập tin nhắn hoặc nhấn mic để nói..."
            }
            disabled={disabled || isProcessing}
            className={`message-input ${isRecording ? "recording" : ""}`}
            rows="1"
            style={{
              minHeight: "40px",
              maxHeight: "120px",
              resize: "none",
              overflow: "auto",
            }}
          />

          <div className="input-actions">
            <button
              type="button"
              onClick={toggleRecording}
              disabled={disabled || isProcessing}
              className={`mic-button ${isRecording ? "recording" : ""} ${
                isProcessing ? "processing" : ""
              }`}
              title={isRecording ? "Dừng ghi âm" : "Bắt đầu ghi âm"}
            >
              {isProcessing ? (
                <div className="processing-spinner"></div>
              ) : isRecording ? (
                <MicOff size={20} />
              ) : (
                <Mic size={20} />
              )}
            </button>

            <button
              type="submit"
              disabled={
                !message.trim() || disabled || isProcessing || isRecording
              }
              className="send-button"
              title="Gửi tin nhắn"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </form>

      {isRecording && (
        <div className="recording-indicator">
          <div className="recording-dot"></div>
          <span>Đang ghi âm... Nhấn mic để dừng</span>
        </div>
      )}
    </div>
  );
};

export default ChatInput;
