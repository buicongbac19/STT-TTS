import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, Trash2, Settings, TestTube } from "lucide-react";
import ChatMessage from "./components/ChatMessage";
import ChatInput from "./components/ChatInput";
import chatService from "./services/chatService";
import agoraService from "./services/agoraService";
import "./App.css";

function App() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll xuống cuối khi có tin nhắn mới
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Khởi tạo với tin nhắn chào mừng
  useEffect(() => {
    const welcomeMessage = {
      id: "welcome",
      text: "Xin chào! Tôi là AI Assistant với tính năng Speech-to-Text và Text-to-Speech. Bạn có thể gõ tin nhắn hoặc sử dụng nút microphone để nói với tôi. Tôi cũng có thể đọc to câu trả lời bằng nút speaker.",
      sender: "bot",
      timestamp: new Date().toLocaleTimeString("vi-VN"),
    };
    setMessages([welcomeMessage]);
  }, []);

  const handleSendMessage = async (messageText) => {
    if (!messageText.trim() || isLoading) return;

    try {
      setIsLoading(true);

      // Gửi tin nhắn và nhận response
      const { userMessage, botMessage } = await chatService.sendMessage(
        messageText
      );

      // Cập nhật messages
      setMessages((prevMessages) => [...prevMessages, userMessage, botMessage]);
    } catch (error) {
      console.error("Lỗi khi gửi tin nhắn:", error);

      // Thêm thông báo lỗi
      const errorMessage = {
        id: Date.now(),
        text: "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.",
        sender: "bot",
        timestamp: new Date().toLocaleTimeString("vi-VN"),
      };

      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    const confirmClear = window.confirm(
      "Bạn có chắc muốn xóa toàn bộ cuộc trò chuyện?"
    );
    if (confirmClear) {
      setMessages([]);
      chatService.clearHistory();

      // Thêm lại tin nhắn chào mừng
      const welcomeMessage = {
        id: "welcome-new",
        text: "Cuộc trò chuyện đã được xóa. Chúng ta bắt đầu lại nhé!",
        sender: "bot",
        timestamp: new Date().toLocaleTimeString("vi-VN"),
      };
      setMessages([welcomeMessage]);
    }
  };

  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  const testAgoraAPI = async () => {
    console.log("🧪 Bắt đầu test Agora API...");
    try {
      const success = await agoraService.testAgoraConnection();
      if (success) {
        alert(`🎉 EXCELLENT! Agora Real-time STT is Working!

✅ Status: Successfully connected to Agora API
✅ Agent Creation: Working perfectly
✅ Authentication: Credentials verified
✅ Ready to Use: Professional STT service active

📱 How to Use:
1. Click 🎤 → Start speech recognition
2. Speak clearly near microphone
3. Click 🎤 again → Text appears in input
4. Ignore any console warnings (normal API behavior)

🚀 Your app now uses enterprise-grade speech recognition!`);
      } else {
        alert(`⚠️ Agora Real-time STT API Issues Detected

🔧 Current Status:
❌ Agora API: Connection failed
✅ Emergency Fallback: Web Speech API active

🎯 To Fix Agora Issues:
1. Enable Real-time STT service in Agora Console
2. Add billing method/credits to account  
3. Verify App ID and credentials
4. Check regional service availability

📱 App Still Works:
✅ Speech-to-Text functioning (via fallback)
✅ Text-to-Speech working
✅ Chat with AI bot active

Check console for detailed error information.`);
      }
    } catch (error) {
      console.error("Test error:", error);
      alert(
        "❌ Lỗi khi test: " +
          error.message +
          "\n\nNhưng Web Speech API vẫn hoạt động!"
      );
    }
  };

  return (
    <div className="app">
      <div className="app-container">
        {/* Header */}
        <header className="app-header">
          <div className="header-content">
            <div className="header-left">
              <MessageCircle size={24} className="header-icon" />
              <h1 className="app-title">AI Chatbot Speech</h1>
            </div>
            <div className="header-actions">
              <button
                onClick={testAgoraAPI}
                className="header-button test"
                title="Test Agora API"
              >
                <TestTube size={20} />
              </button>
              <button
                onClick={toggleSettings}
                className="header-button"
                title="Cài đặt"
              >
                <Settings size={20} />
              </button>
              <button
                onClick={clearChat}
                className="header-button danger"
                title="Xóa cuộc trò chuyện"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        </header>

        {/* Settings Panel */}
        {showSettings && (
          <div className="settings-panel">
            <div className="settings-content">
              <h3>Cấu hình Agora API</h3>
              <p className="settings-note">
                Trạng thái hiện tại: App ID và Customer credentials đã được cấu
                hình.
              </p>
              <ul className="settings-list">
                <li>✅ App ID: c4b924d25ff4472191f0c5a10e61cb3e</li>
                <li>✅ Customer ID: 91a46b7174cf44d1962db0947f9d7968</li>
                <li>✅ Customer Secret: e5fbde57fb2a4e08ba2fbf8858a10f81</li>
                <li>🔄 Real-time STT: Cần enable trong Agora Console</li>
              </ul>
              <p className="settings-fallback">
                Nhấn nút 🧪 để test kết nối Agora API. Nếu thất bại, app sẽ dùng
                Web Speech API.
              </p>
              <p className="settings-note">
                <strong>Lưu ý bảo mật:</strong> Trong production, Customer
                Secret không nên ở client-side.
              </p>
            </div>
          </div>
        )}

        {/* Chat Container */}
        <div className="chat-container">
          <div className="messages-container">
            {messages.length === 0 ? (
              <div className="empty-chat">
                <MessageCircle size={48} className="empty-icon" />
                <h3>Bắt đầu cuộc trò chuyện</h3>
                <p>Gõ tin nhắn hoặc sử dụng microphone để nói</p>
              </div>
            ) : (
              messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))
            )}

            {/* Loading indicator */}
            {isLoading && (
              <div className="loading-message">
                <div className="loading-dots">
                  <div className="loading-dot"></div>
                  <div className="loading-dot"></div>
                  <div className="loading-dot"></div>
                </div>
                <span>AI đang suy nghĩ...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
        </div>

        {/* Footer */}
        <footer className="app-footer">
          <p>Được xây dựng với ❤️ sử dụng React + Agora Speech Services</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
