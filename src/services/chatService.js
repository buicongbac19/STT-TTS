// Chat Service - Xử lý logic chatbot
class ChatService {
  constructor() {
    this.chatHistory = [];
  }

  // Mô phỏng AI response - trong thực tế bạn có thể tích hợp với OpenAI, Gemini, etc.
  async sendMessage(message) {
    try {
      // Lưu tin nhắn của user
      const userMessage = {
        id: Date.now(),
        text: message,
        sender: "user",
        timestamp: new Date().toLocaleTimeString("vi-VN"),
      };

      this.chatHistory.push(userMessage);

      // Mô phỏng delay để tạo trải nghiệm thực tế
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 + Math.random() * 2000)
      );

      // Tạo response đơn giản - có thể thay thế bằng API thực
      const botResponse = this.generateResponse(message);

      const botMessage = {
        id: Date.now() + 1,
        text: botResponse,
        sender: "bot",
        timestamp: new Date().toLocaleTimeString("vi-VN"),
      };

      this.chatHistory.push(botMessage);

      return {
        userMessage,
        botMessage,
      };
    } catch (error) {
      console.error("Lỗi khi gửi tin nhắn:", error);
      throw error;
    }
  }

  // Tạo response đơn giản - có thể thay thế bằng AI thực
  generateResponse(message) {
    const lowerMessage = message.toLowerCase();

    const responses = {
      // Chào hỏi
      "xin chào": "Xin chào! Tôi là AI assistant. Tôi có thể giúp gì cho bạn?",
      chào: "Chào bạn! Rất vui được trò chuyện với bạn.",
      hello: "Hello! Tôi có thể hỗ trợ bạn điều gì?",
      hi: "Hi! Có gì tôi có thể giúp không?",

      // Thông tin cá nhân
      "bạn là ai":
        "Tôi là một chatbot AI được tạo ra để hỗ trợ bạn. Tôi có thể hiểu giọng nói và phát âm câu trả lời.",
      "tên bạn":
        "Tôi là AI Assistant với tính năng Speech-to-Text và Text-to-Speech.",

      // Tính năng
      speech:
        "Tôi hỗ trợ cả Speech-to-Text (bạn nói, tôi chuyển thành text) và Text-to-Speech (tôi đọc câu trả lời).",
      voice:
        "Bạn có thể sử dụng nút microphone để nói với tôi, hoặc nhấn nút speaker để nghe tôi đọc.",

      // Hỏi thăm
      "bạn khỏe không": "Tôi khỏe, cảm ơn bạn! Còn bạn thì sao?",
      "hôm nay thế nào": "Hôm nay tôi sẵn sàng hỗ trợ bạn! Bạn cần giúp gì?",

      // Thời tiết
      "thời tiết":
        "Tôi chưa có khả năng xem thời tiết, nhưng tôi hy vọng hôm nay là một ngày đẹp trời!",
      trời: "Tôi không thể xem được thời tiết, nhưng tôi luôn hy vọng trời đẹp!",

      // Cảm ơn
      "cảm ơn": "Không có gì! Tôi luôn sẵn sàng giúp đỡ bạn.",
      "thank you": "You're welcome! Có gì khác tôi có thể hỗ trợ không?",

      // Tạm biệt
      "tạm biệt": "Tạm biệt! Hẹn gặp lại bạn!",
      bye: "Goodbye! Chúc bạn một ngày tốt lành!",
      "chào tạm biệt": "Chào tạm biệt! Rất vui được trò chuyện với bạn.",
    };

    // Tìm response phù hợp
    for (const [key, response] of Object.entries(responses)) {
      if (lowerMessage.includes(key)) {
        return response;
      }
    }

    // Response mặc định thông minh hơn
    if (
      lowerMessage.includes("?") ||
      lowerMessage.includes("sao") ||
      lowerMessage.includes("gì")
    ) {
      return "Đó là một câu hỏi thú vị! Tôi sẽ cố gắng tìm hiểu và trả lời bạn tốt hơn trong tương lai.";
    }

    if (lowerMessage.includes("giúp")) {
      return "Tôi sẵn sàng giúp đỡ bạn! Bạn có thể nói với tôi bằng cách nhấn nút microphone, hoặc gõ tin nhắn trực tiếp.";
    }

    if (lowerMessage.includes("làm") || lowerMessage.includes("thực hiện")) {
      return "Tôi hiểu bạn muốn thực hiện điều gì đó. Hãy nói rõ hơn để tôi có thể hỗ trợ bạn tốt nhất!";
    }

    // Response mặc định
    const defaultResponses = [
      'Tôi hiểu bạn đang nói về "' +
        message +
        '". Bạn có thể giải thích rõ hơn không?',
      "Thật thú vị! Bạn có thể chia sẻ thêm về chủ đề này không?",
      "Tôi đang học hỏi từ cuộc trò chuyện này. Bạn có câu hỏi gì khác không?",
      "Cảm ơn bạn đã chia sẻ. Tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn!",
      "Điều bạn nói rất có ý nghĩa. Bạn có muốn thảo luận thêm về vấn đề này không?",
    ];

    return defaultResponses[
      Math.floor(Math.random() * defaultResponses.length)
    ];
  }

  // Lấy lịch sử chat
  getChatHistory() {
    return this.chatHistory;
  }

  // Xóa lịch sử chat
  clearHistory() {
    this.chatHistory = [];
  }

  // Tìm kiếm trong lịch sử
  searchHistory(query) {
    return this.chatHistory.filter((message) =>
      message.text.toLowerCase().includes(query.toLowerCase())
    );
  }
}

export default new ChatService();
