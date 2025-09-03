# AI Chatbot với Speech-to-Text và Text-to-Speech

Ứng dụng chatbot React.js tích hợp tính năng Speech-to-Text và Text-to-Speech sử dụng Agora API.

## ✨ Tính năng

- 💬 **Chat thông thường**: Gõ và gửi tin nhắn như chatbot bình thường
- 🎤 **Speech-to-Text**: Nói vào microphone, ứng dụng sẽ chuyển giọng nói thành text trong ô input
- 🔊 **Text-to-Speech**: Phát âm các response từ bot bằng cách nhấn nút speaker
- 📱 **Responsive**: Giao diện tối ưu cho cả desktop và mobile
- 🎨 **UI/UX đẹp**: Thiết kế hiện đại với animations mượt mà

## 🚀 Cài đặt và chạy

### 1. Cài đặt dependencies

```bash
cd ai-chatbot
npm install
```

### 2. Cấu hình Agora API

Mở file `src/services/agoraService.js` và cập nhật thông tin API:

```javascript
const AGORA_CONFIG = {
  appId: 'YOUR_AGORA_APP_ID',           // Thay bằng App ID từ Agora Console
  apiKey: 'YOUR_AGORA_API_KEY',         // Thay bằng API Key của bạn
  speechToTextUrl: 'https://api.agora.io/v1/speech-to-text',
  textToSpeechUrl: 'https://api.agora.io/v1/text-to-speech'
};
```

### 3. Chạy ứng dụng

```bash
npm start
```

Ứng dụng sẽ chạy tại `http://localhost:3000`

## 🎯 Cách sử dụng

### Chat bình thường
1. Gõ tin nhắn vào ô input
2. Nhấn Enter hoặc nút Send để gửi

### Speech-to-Text
1. Nhấn nút microphone (🎤) để bắt đầu ghi âm
2. Nói vào microphone
3. Nhấn lại nút microphone để dừng ghi âm
4. Text sẽ xuất hiện trong ô input, bạn có thể chỉnh sửa trước khi gửi

### Text-to-Speech
1. Sau khi bot trả lời, nhấn nút speaker (🔊) bên cạnh tin nhắn
2. Bot sẽ đọc to nội dung tin nhắn

## 🔧 Cấu hình Agora

### Đăng ký Agora Account
1. Truy cập [Agora Console](https://console.agora.io/)
2. Đăng ký tài khoản miễn phí
3. Tạo project mới

### Lấy thông tin API
1. **App ID**: Từ project settings
2. **API Key**: Tạo API key với quyền Speech Services
3. **Endpoints**: Có thể khác nhau theo region

### Fallback Option
Nếu chưa có Agora API, ứng dụng sẽ tự động sử dụng Web Speech API có sẵn trong trình duyệt (hỗ trợ hạn chế).

## 🛠️ Công nghệ sử dụng

- **React 18**: Framework chính
- **Agora Speech Services**: Speech-to-Text và Text-to-Speech
- **Web Speech API**: Fallback option
- **Lucide React**: Icons
- **CSS3**: Styling với animations

## 📁 Cấu trúc project

```
src/
├── components/
│   ├── ChatMessage.js      # Component hiển thị tin nhắn
│   ├── ChatMessage.css
│   ├── ChatInput.js        # Component input với mic
│   └── ChatInput.css
├── services/
│   ├── agoraService.js     # Tích hợp Agora API
│   └── chatService.js      # Logic chatbot
├── App.js                  # Component chính
├── App.css
├── index.js
└── index.css
```

## 🎨 Customization

### Thay đổi giao diện
- Chỉnh sửa file CSS để thay đổi màu sắc, font chữ
- Gradient background có thể được thay đổi trong `index.css`

### Tích hợp AI thực
- Thay thế `chatService.js` để gọi API AI thực (OpenAI, Gemini, v.v.)
- Cập nhật `generateResponse()` method

### Thêm ngôn ngữ
- Cập nhật `lang` parameter trong `agoraService.js`
- Thêm hỗ trợ đa ngôn ngữ trong UI

## 🐛 Troubleshooting

### Microphone không hoạt động
- Kiểm tra quyền truy cập microphone trong trình duyệt
- Đảm bảo sử dụng HTTPS (Web Speech API yêu cầu)

### API không hoạt động
- Kiểm tra App ID và API Key
- Verify network connection
- Check browser console cho error details

### Audio không phát
- Kiểm tra volume và speaker
- Thử fallback Text-to-Speech
- Check browser compatibility

## 📄 License

MIT License - Tự do sử dụng cho mục đích cá nhân và thương mại.

## 🤝 Contributing

Mọi đóng góp đều được chào đón! Hãy tạo issue hoặc pull request.

## 📞 Support

Nếu gặp vấn đề, hãy tạo issue trên GitHub repository.
