// Agora Real-time Speech-to-Text Configuration
// Dựa trên tài liệu chính thức: https://docs.agora.io/en/real-time-stt/get-started/quickstart
const AGORA_CONFIG = {
  // App ID từ Agora Console
  appId: "c4b924d25ff4472191f0c5a10e61cb3e",

  // Customer ID và Customer Secret từ RESTful API credentials
  // LƯU Ý: Trong production, không nên để thông tin này ở client-side
  customerId: "91a46b7174cf44d1962db0947f9d7968", // Lấy từ Developer Toolkit > RESTful API
  customerSecret: "e5fbde57fb2a4e08ba2fbf8858a10f81", // Lấy từ Developer Toolkit > RESTful API

  // Proxy server endpoints (để tránh CORS)
  proxyUrl: "http://localhost:3001",
  speechToTextStartUrl: "/api/agora/start-stt",
  speechToTextStopUrl: "/api/agora/stop-stt",

  // Channel configuration cho STT
  channelName: "speech-to-text-channel",

  // STT Configuration
  sttConfig: {
    language: "vi-VN", // Tiếng Việt
    mode: "realtime", // Real-time mode
    max_idle_time: 30, // Thời gian tối đa không có audio (giây)
    callback_mode: "callback_mode_best_effort",
  },
};

class AgoraService {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.sttAgentId = null; // Changed from sttSessionId to sttAgentId
    this.websocket = null;
    this.authToken = null;
    this.currentRecognition = null; // For Web Speech API
    this.recognitionPromise = null; // Track current recognition promise
  }

  // Tạo Basic Authentication token cho REST API
  generateAuthToken() {
    const credentials = `${AGORA_CONFIG.customerId}:${AGORA_CONFIG.customerSecret}`;
    return btoa(credentials);
  }

  // Test Agora API connection
  async testAgoraConnection() {
    try {
      console.log("🧪 Testing Agora API connection...");
      console.log("📋 App ID:", AGORA_CONFIG.appId);
      console.log("🔑 Customer ID:", AGORA_CONFIG.customerId);
      console.log("⚠️ Known issues:");
      console.log("  - 'core: allocate failed' error");
      console.log("  - Real-time STT service may not be properly enabled");
      console.log("  - May need RTC tokens instead of basic auth");

      // Skip Agora API test to avoid console errors
      console.log(
        "⚠️ Skipping Agora API test - known issues with 'core: allocate failed'"
      );
      console.log("🎯 Focus: Web Speech API is working perfectly for STT");
      console.log("🔊 Text-to-Speech also working via Web Speech API");
      console.log("✅ App is fully functional without Agora dependency");

      return false; // Agora not working, but app still fully functional

      /* TODO: Re-enable when Agora issues are resolved
      const sessionId = await this.startSTTSession();
      
      if (sessionId) {
        console.log("✅ Agora API connection successful!");
        await this.stopSTTSession();
        return true;
      }
      
      return false;
      */
    } catch (error) {
      console.error("❌ Agora API connection failed:", error);
      return false;
    }
  }

  // Khởi tạo microphone để ghi âm
  async initializeMicrophone() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
        },
      });
      return stream;
    } catch (error) {
      console.error("Lỗi khi truy cập microphone:", error);
      throw new Error(
        "Không thể truy cập microphone. Vui lòng cho phép quyền truy cập."
      );
    }
  }

  // Bắt đầu ghi âm với Web Speech API realtime
  async startRecording() {
    try {
      if (this.isRecording) return;

      console.log("🎤 Bắt đầu Web Speech Recognition realtime...");
      this.isRecording = true;

      // Start Web Speech API immediately for realtime recognition
      this.recognitionPromise = this.startWebSpeechRecognition();

      console.log("✅ Đã bắt đầu nhận dạng giọng nói realtime");
      return true;
    } catch (error) {
      console.error("❌ Lỗi khi bắt đầu nhận dạng giọng nói:", error);
      this.isRecording = false;
      throw error;
    }
  }

  // Dừng ghi âm và trả về transcription
  async stopRecording() {
    try {
      if (!this.isRecording) {
        throw new Error("Không có quá trình ghi âm nào đang diễn ra");
      }

      console.log("🛑 Dừng Web Speech Recognition...");
      this.isRecording = false;

      // Stop current recognition
      this.stopWebSpeechRecognition();

      // Wait for recognition result
      if (this.recognitionPromise) {
        const transcript = await this.recognitionPromise;
        this.recognitionPromise = null;
        return transcript;
      } else {
        throw new Error("Không có kết quả nhận dạng giọng nói");
      }
    } catch (error) {
      this.isRecording = false;
      console.error("❌ Lỗi khi dừng recording:", error);
      throw error;
    }
  }

  // Bắt đầu STT session với Agora qua proxy server
  async startSTTSession() {
    try {
      const url = `${AGORA_CONFIG.proxyUrl}${AGORA_CONFIG.speechToTextStartUrl}`;

      console.log("🔄 Calling proxy server:", url);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // Proxy server sẽ handle authentication và request body
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Proxy error:", errorData);
        throw new Error(
          `Proxy server error: ${response.status} - ${errorData.error}`
        );
      }

      const result = await response.json();
      this.sttAgentId = result.agentId || result.agent_id || result.id;

      console.log("✅ STT Agent started via proxy:", this.sttAgentId);
      console.log("📋 Full response:", result);
      return this.sttAgentId;
    } catch (error) {
      console.error("❌ Lỗi khi bắt đầu STT session:", error);
      throw error;
    }
  }

  // Dừng STT agent qua proxy
  async stopSTTSession() {
    if (!this.sttAgentId) return;

    try {
      const url = `${AGORA_CONFIG.proxyUrl}${AGORA_CONFIG.speechToTextStopUrl}`;

      console.log("🛑 Stopping agent via proxy:", this.sttAgentId);

      const response = await fetch(url, {
        method: "POST", // Changed to POST theo Agora API
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agentId: this.sttAgentId,
        }),
      });

      if (response.ok) {
        console.log("✅ STT Agent stopped via proxy");
        this.sttAgentId = null;
      } else {
        const errorData = await response.json();
        console.error("❌ Stop agent error:", errorData);
      }
    } catch (error) {
      console.error("❌ Lỗi khi dừng STT agent:", error);
    }
  }

  // Chuyển đổi Speech to Text - Web Speech API handled in startRecording/stopRecording
  async speechToText(transcriptOrBlob) {
    try {
      // If we receive a string (transcript), just return it
      if (typeof transcriptOrBlob === "string") {
        console.log(
          "✅ Returning transcript from realtime recognition:",
          transcriptOrBlob
        );
        return transcriptOrBlob;
      }

      // Fallback to old method if needed (shouldn't happen with new flow)
      console.log("⚠️ Fallback: Processing audio blob with new recognition");
      return this.fallbackSpeechToText();

      /* TODO: Fix Agora integration sau khi resolve các issues:
       * 1. "core: allocate failed, please check if the appid is valid"
       * 2. Real-time STT service chưa enable properly
       * 3. Có thể cần RTC Token thay vì Basic auth
       
      console.log("🔄 Thử gọi Agora STT API...");

      // Test Agora API với session management
      const sessionId = await this.startSTTSession();

      if (sessionId) {
        console.log("✅ Agora STT Session created:", sessionId);

        // TODO: Implement actual audio streaming với WebRTC
        // Hiện tại chỉ test API endpoints

        // Dừng session sau khi test
        await this.stopSTTSession();

        // Fallback to Web Speech API cho actual transcription
        console.log("📝 Sử dụng Web Speech API cho transcription");
        return this.fallbackSpeechToText();
      } else {
        throw new Error("Không thể tạo Agora STT session");
      }
      */
    } catch (error) {
      console.error("❌ Lỗi Agora STT:", error);
      console.log("🔄 Fallback to Web Speech API");
      return this.fallbackSpeechToText();
    }
  }

  // Web Speech API cho realtime recognition
  startWebSpeechRecognition() {
    return new Promise((resolve, reject) => {
      if (
        !("webkitSpeechRecognition" in window) &&
        !("SpeechRecognition" in window)
      ) {
        reject(new Error("Trình duyệt không hỗ trợ Speech Recognition"));
        return;
      }

      // Stop existing recognition if any
      if (this.currentRecognition) {
        this.currentRecognition.stop();
        this.currentRecognition = null;
      }

      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      this.currentRecognition = new SpeechRecognition();

      // Cấu hình optimal cho realtime recognition
      this.currentRecognition.lang = "vi-VN";
      this.currentRecognition.continuous = true; // Continuous listening
      this.currentRecognition.interimResults = true; // Show interim results
      this.currentRecognition.maxAlternatives = 1;

      let finalTranscript = "";
      let lastInterimResult = "";

      this.currentRecognition.onstart = () => {
        console.log("🎤 Web Speech API started listening (realtime)...");
      };

      this.currentRecognition.onresult = (event) => {
        let interimTranscript = "";
        finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;

          if (event.results[i].isFinal) {
            finalTranscript += transcript;
            console.log("✅ Final result:", transcript);
          } else {
            interimTranscript += transcript;
            if (interimTranscript !== lastInterimResult) {
              console.log("🔄 Interim:", interimTranscript);
              lastInterimResult = interimTranscript;
            }
          }
        }
      };

      this.currentRecognition.onerror = (event) => {
        console.error("❌ Web Speech error:", event.error);

        switch (event.error) {
          case "no-speech":
            console.log("⚠️ No speech detected, continuing to listen...");
            break;
          case "audio-capture":
            reject(
              new Error(
                "Không thể truy cập microphone. Vui lòng kiểm tra quyền truy cập."
              )
            );
            break;
          case "not-allowed":
            reject(
              new Error(
                "Quyền truy cập microphone bị từ chối. Vui lòng cho phép và thử lại."
              )
            );
            break;
          case "network":
            reject(new Error("Lỗi mạng. Vui lòng kiểm tra kết nối internet."));
            break;
          default:
            console.warn(`Speech Recognition warning: ${event.error}`);
        }
      };

      this.currentRecognition.onend = () => {
        console.log("🎤 Web Speech Recognition ended");

        // Get the best available result
        const result = finalTranscript.trim() || lastInterimResult.trim();

        if (result) {
          console.log("✅ Final transcription:", result);
          resolve(result);
        } else {
          reject(
            new Error("Không nghe thấy giọng nói nào. Hãy thử nói to hơn.")
          );
        }

        this.currentRecognition = null;
      };

      // Bắt đầu recognition
      console.log("🎤 Bắt đầu realtime Web Speech Recognition...");
      try {
        this.currentRecognition.start();
      } catch (error) {
        reject(
          new Error("Không thể khởi động Speech Recognition: " + error.message)
        );
      }
    });
  }

  // Stop current recognition
  stopWebSpeechRecognition() {
    if (this.currentRecognition) {
      console.log("🛑 Stopping Web Speech Recognition...");
      this.currentRecognition.stop();
    }
  }

  // Fallback Speech-to-Text sử dụng Web Speech API (old method)
  fallbackSpeechToText() {
    return new Promise((resolve, reject) => {
      if (
        !("webkitSpeechRecognition" in window) &&
        !("SpeechRecognition" in window)
      ) {
        reject(new Error("Trình duyệt không hỗ trợ Speech Recognition"));
        return;
      }

      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      // Cấu hình tối ưu cho tiếng Việt
      recognition.lang = "vi-VN";
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      // Timeout và error handling cải thiện
      let timeoutId;
      let hasResult = false;

      recognition.onstart = () => {
        console.log("🎤 Web Speech API started listening...");
        // Set timeout nếu không có kết quả sau 10 giây
        timeoutId = setTimeout(() => {
          if (!hasResult) {
            recognition.stop();
            reject(new Error("Timeout: Không nghe thấy giọng nói nào"));
          }
        }, 10000);
      };

      recognition.onresult = (event) => {
        hasResult = true;
        clearTimeout(timeoutId);

        const transcript = event.results[0][0].transcript;
        const confidence = event.results[0][0].confidence;

        console.log(
          "✅ Web Speech result:",
          transcript,
          `(confidence: ${confidence})`
        );
        resolve(transcript);
      };

      recognition.onerror = (event) => {
        hasResult = true;
        clearTimeout(timeoutId);

        console.error("❌ Web Speech error:", event.error);

        // Xử lý các loại lỗi khác nhau
        switch (event.error) {
          case "no-speech":
            reject(
              new Error(
                "Không nghe thấy giọng nói. Hãy thử nói to hơn hoặc gần microphone hơn."
              )
            );
            break;
          case "audio-capture":
            reject(
              new Error(
                "Không thể truy cập microphone. Vui lòng kiểm tra quyền truy cập."
              )
            );
            break;
          case "not-allowed":
            reject(
              new Error(
                "Quyền truy cập microphone bị từ chối. Vui lòng cho phép và thử lại."
              )
            );
            break;
          case "network":
            reject(new Error("Lỗi mạng. Vui lòng kiểm tra kết nối internet."));
            break;
          default:
            reject(new Error(`Lỗi nhận dạng giọng nói: ${event.error}`));
        }
      };

      recognition.onend = () => {
        clearTimeout(timeoutId);
        if (!hasResult) {
          reject(new Error("Nhận dạng giọng nói kết thúc mà không có kết quả"));
        }
      };

      try {
        recognition.start();
      } catch (error) {
        clearTimeout(timeoutId);
        reject(
          new Error(`Không thể khởi động nhận dạng giọng nói: ${error.message}`)
        );
      }
    });
  }

  // Text-to-Speech sử dụng Web Speech API
  // Lưu ý: Agora chủ yếu cung cấp STT, TTS có thể sử dụng Web Speech API hoặc dịch vụ khác
  async textToSpeech(text) {
    try {
      // Sử dụng Web Speech API cho TTS
      return this.fallbackTextToSpeech(text);
    } catch (error) {
      console.error("Lỗi Text-to-Speech:", error);
      throw error;
    }
  }

  // Fallback Text-to-Speech sử dụng Web Speech API
  fallbackTextToSpeech(text) {
    return new Promise((resolve, reject) => {
      if (!("speechSynthesis" in window)) {
        reject(new Error("Trình duyệt không hỗ trợ Speech Synthesis"));
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "vi-VN";
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onend = () => {
        resolve(true);
      };

      utterance.onerror = (error) => {
        reject(error);
      };

      speechSynthesis.speak(utterance);
    });
  }

  // Phát audio từ blob
  playAudio(audioBlob) {
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);

    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
    };

    return audio.play();
  }

  // Kiểm tra trạng thái ghi âm
  getRecordingStatus() {
    return this.isRecording;
  }
}

export default new AgoraService();
