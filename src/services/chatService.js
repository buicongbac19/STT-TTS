class ChatService {
  constructor() {
    this.chatHistory = [];
  }

  async sendMessage(message) {
    try {
      const userMessage = {
        id: Date.now(),
        text: message,
        sender: "user",
        timestamp: new Date().toLocaleTimeString("vi-VN"),
      };

      this.chatHistory.push(userMessage);

      await new Promise((resolve) =>
        setTimeout(resolve, 1000 + Math.random() * 2000)
      );

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

  generateResponse(message) {
    const lowerMessage = message.toLowerCase();

    const responses = {
      "xin chào": "Xin chào! Tôi là AI assistant. Tôi có thể giúp gì cho bạn?",
      chào: "Chào bạn! Rất vui được trò chuyện với bạn.",
      hello: "Hello! Tôi có thể hỗ trợ bạn điều gì?",
      hi: "Hi! Có gì tôi có thể giúp không?",

      "bạn là ai":
        "Tôi là một chatbot AI được tạo ra để hỗ trợ bạn. Tôi có thể hiểu giọng nói và phát âm câu trả lời.",
      "tên bạn":
        "Tôi là AI Assistant với tính năng Speech-to-Text và Text-to-Speech.",

      speech:
        "Tôi hỗ trợ cả Speech-to-Text (bạn nói, tôi chuyển thành text) và Text-to-Speech (tôi đọc câu trả lời).",
      voice:
        "Bạn có thể sử dụng nút microphone để nói với tôi, hoặc nhấn nút speaker để nghe tôi đọc.",

      "bạn khỏe không": "Tôi khỏe, cảm ơn bạn! Còn bạn thì sao?",
      "hôm nay thế nào": "Hôm nay tôi sẵn sàng hỗ trợ bạn! Bạn cần giúp gì?",

      "thời tiết":
        "Tôi chưa có khả năng xem thời tiết, nhưng tôi hy vọng hôm nay là một ngày đẹp trời!",
      trời: "Tôi không thể xem được thời tiết, nhưng tôi luôn hy vọng trời đẹp!",

      "cảm ơn": "Không có gì! Tôi luôn sẵn sàng giúp đỡ bạn.",
      "thank you": "You're welcome! Có gì khác tôi có thể hỗ trợ không?",

      "tạm biệt": "Tạm biệt! Hẹn gặp lại bạn!",
      bye: "Goodbye! Chúc bạn một ngày tốt lành!",
      "chào tạm biệt": "Chào tạm biệt! Rất vui được trò chuyện với bạn.",
    };

    for (const [key, response] of Object.entries(responses)) {
      if (lowerMessage.includes(key)) {
        return response;
      }
    }

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

  getChatHistory() {
    return this.chatHistory;
  }

  clearHistory() {
    this.chatHistory = [];
  }

  searchHistory(query) {
    return this.chatHistory.filter((message) =>
      message.text.toLowerCase().includes(query.toLowerCase())
    );
  }
}

export default new ChatService();
