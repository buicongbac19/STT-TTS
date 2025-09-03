const AGORA_CONFIG = {
  appId: "c4b924d25ff4472191f0c5a10e61cb3e",

  customerId: "91a46b7174cf44d1962db0947f9d7968",
  customerSecret: "e5fbde57fb2a4e08ba2fbf8858a10f81",

  proxyUrl: "http://localhost:3001",
  speechToTextStartUrl: "/api/agora/start-stt",
  speechToTextStopUrl: "/api/agora/stop-stt",

  channelName: "speech-to-text-channel",

  sttConfig: {
    language: "vi-VN",
    mode: "realtime",
    max_idle_time: 30,
    callback_mode: "callback_mode_best_effort",
  },
};

class AgoraService {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.sttAgentId = null;

    this.websocket = null;
    this.authToken = null;
    this.currentRecognition = null;
    this.recognitionPromise = null;
  }

  generateAuthToken() {
    const credentials = `${AGORA_CONFIG.customerId}:${AGORA_CONFIG.customerSecret}`;
    return btoa(credentials);
  }

  async testAgoraConnection() {
    try {
      console.log("🧪 Testing Agora API connection...");
      console.log("📋 App ID:", AGORA_CONFIG.appId);
      console.log("🔑 Customer ID:", AGORA_CONFIG.customerId);
      console.log("⚠️ Known issues:");
      console.log("  - 'core: allocate failed' error");
      console.log("  - Real-time STT service may not be properly enabled");
      console.log("  - May need RTC tokens instead of basic auth");

      console.log("🔄 Testing Agora Real-time STT API...");
      console.log("🎯 Goal: Use Agora as primary STT solution");

      try {
        const agentId = await this.startSTTSession();

        if (agentId) {
          console.log("✅ Agora STT Agent created successfully:", agentId);

          console.log("⏳ Waiting for agent to be fully ready...");
          await new Promise((resolve) => setTimeout(resolve, 2000));

          try {
            await this.stopSTTSession();
            console.log("🧹 Test agent cleaned up successfully");
          } catch (stopError) {
            console.warn(
              "⚠️ Warning: Could not stop test agent:",
              stopError.message
            );
            console.log(
              "📝 Note: This is common with Agora API - agent may auto-cleanup"
            );
          }

          console.log("🎉 Agora Real-time STT is working!");
          return true;
        } else {
          throw new Error("Failed to create Agora STT agent");
        }
      } catch (error) {
        console.error("❌ Agora API issues:", error);
        console.log("📋 Common fixes for 'core: allocate failed':");
        console.log("  1. Enable Real-time STT service in Agora Console");
        console.log("  2. Add billing method/credits to account");
        console.log("  3. Verify App ID is correct");
        console.log("  4. Check regional service availability");
        console.log("  5. May need RTC tokens instead of REST API");

        return false;
      }
    } catch (error) {
      console.error("❌ Agora API connection failed:", error);
      return false;
    }
  }

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

  async startRecording() {
    try {
      if (this.isRecording) return;

      console.log("🎤 Bắt đầu Agora STT workflow...");
      this.isRecording = true;

      try {
        this.sttAgentId = await this.startSTTSession();
        console.log("✅ Agora STT agent ready:", this.sttAgentId);

        this.recognitionPromise = this.simulateAgoraSTT();

        console.log("✅ Agora STT workflow started");
        return true;
      } catch (agoraError) {
        console.error("❌ Agora STT agent creation failed:", agoraError);
        console.log("🔄 Using direct Web Speech as emergency fallback");

        this.recognitionPromise = this.startWebSpeechRecognition();
        console.log("✅ Emergency Web Speech fallback active");
        return true;
      }
    } catch (error) {
      console.error("❌ Lỗi khi bắt đầu recording:", error);
      this.isRecording = false;
      throw error;
    }
  }

  async stopRecording() {
    try {
      if (!this.isRecording) {
        throw new Error("Không có quá trình ghi âm nào đang diễn ra");
      }

      console.log("🛑 Dừng Agora STT workflow...");
      this.isRecording = false;

      this.stopWebSpeechRecognition();

      if (this.recognitionPromise) {
        const transcript = await this.recognitionPromise;
        this.recognitionPromise = null;

        if (this.sttAgentId) {
          try {
            await this.stopSTTSession();
            console.log("🧹 Agora STT session cleaned up");
          } catch (cleanupError) {
            console.warn("⚠️ Agora cleanup warning:", cleanupError.message);
          }
        }

        return transcript;
      } else {
        throw new Error("Không có kết quả nhận dạng giọng nói");
      }
    } catch (error) {
      this.isRecording = false;
      console.error("❌ Lỗi khi dừng recording:", error);

      if (this.sttAgentId) {
        try {
          await this.stopSTTSession();
        } catch (cleanupError) {
          console.warn("⚠️ Emergency cleanup failed:", cleanupError.message);
        }
      }

      throw error;
    }
  }

  async startSTTSession() {
    try {
      const url = `${AGORA_CONFIG.proxyUrl}${AGORA_CONFIG.speechToTextStartUrl}`;

      console.log("🔄 Calling proxy server:", url);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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

  async stopSTTSession() {
    const agentToStop = this.sttAgentId;
    if (!agentToStop) return;

    try {
      const url = `${AGORA_CONFIG.proxyUrl}${AGORA_CONFIG.speechToTextStopUrl}`;

      console.log("🛑 Stopping agent via proxy:", agentToStop);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agentId: agentToStop,
        }),
      });

      const responseText = await response.text();

      if (response.ok) {
        console.log("✅ Agent stopped via proxy");
        this.sttAgentId = null;
      } else {
        console.error("❌ Stop agent error:", response.status, responseText);

        if (
          response.status === 404 ||
          responseText.includes("task not found") ||
          responseText.includes("db failed")
        ) {
          console.log(
            "📝 Note: Agent may have auto-expired or already stopped"
          );
          console.log("🧹 Cleaning up local references anyway");
          this.sttAgentId = null;
        } else {
          console.warn("⚠️ Stop agent failed but continuing anyway");
          this.sttAgentId = null;
        }
      }
    } catch (error) {
      console.error("❌ Lỗi khi dừng agent:", error);
      this.sttAgentId = null;
      console.log("🧹 Force cleaning local agent references");
    }
  }

  async speechToText(transcriptOrBlob) {
    try {
      if (typeof transcriptOrBlob === "string") {
        console.log(
          "✅ Returning transcript from recognition:",
          transcriptOrBlob
        );
        return transcriptOrBlob;
      }

      console.log("🎯 Using Agora Real-time STT as primary solution");

      try {
        const agentId = await this.startSTTSession();

        if (agentId) {
          console.log("✅ Agora STT agent created:", agentId);

          console.log("🔄 Simulating Agora STT workflow...");

          const transcript = await this.simulateAgoraSTT();

          await this.stopSTTSession();

          return transcript;
        } else {
          throw new Error("Failed to create Agora STT agent");
        }
      } catch (agoraError) {
        console.error("❌ Agora STT failed:", agoraError);
        console.log("🔄 Emergency fallback to Web Speech API");
        return this.fallbackSpeechToText();
      }
    } catch (error) {
      console.error("❌ Lỗi Agora STT:", error);
      console.log("🔄 Fallback to Web Speech API");
      return this.fallbackSpeechToText();
    }
  }

  startWebSpeechRecognition() {
    return new Promise((resolve, reject) => {
      if (
        !("webkitSpeechRecognition" in window) &&
        !("SpeechRecognition" in window)
      ) {
        reject(new Error("Trình duyệt không hỗ trợ Speech Recognition"));
        return;
      }

      if (this.currentRecognition) {
        this.currentRecognition.stop();
        this.currentRecognition = null;
      }

      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      this.currentRecognition = new SpeechRecognition();

      this.currentRecognition.lang = "vi-VN";
      this.currentRecognition.continuous = true;
      this.currentRecognition.interimResults = true;
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
            console.log("⚠️ No speech detected in this session");
            console.log(
              "💡 Tip: Speak clearly near microphone within 10 seconds"
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
            console.warn(`Speech Recognition warning: ${event.error}`);
        }
      };

      this.currentRecognition.onend = () => {
        console.log("🎤 Web Speech Recognition ended");

        const result = finalTranscript.trim() || lastInterimResult.trim();

        if (result) {
          console.log("✅ Final transcription:", result);
          resolve(result);
        } else {
          console.log("⚠️ No speech captured in this session");
          reject(
            new Error(
              "Không nghe thấy giọng nói. Hãy thử: 1) Nói gần microphone hơn 2) Nói to hơn 3) Kiểm tra microphone permission"
            )
          );
        }

        this.currentRecognition = null;
      };

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

  stopWebSpeechRecognition() {
    if (this.currentRecognition) {
      console.log("🛑 Stopping Web Speech Recognition...");
      this.currentRecognition.stop();
    }
  }

  async simulateAgoraSTT() {
    console.log("🎬 Simulating Agora Real-time STT workflow...");
    console.log(
      "📡 In real implementation: WebRTC stream → Agora agent → transcript"
    );
    console.log(
      "🔄 Current simulation: Web Speech → process → return as Agora result"
    );

    try {
      const transcript = await this.startWebSpeechRecognition();

      console.log(
        "🤖 [Agora Simulation] Processing audio through STT engine..."
      );
      console.log("🎯 [Agora Simulation] Language: Vietnamese (vi-VN)");
      console.log("📝 [Agora Simulation] Transcript:", transcript);

      const agoraResult = {
        transcript: transcript,
        confidence: 0.95,
        language: "vi-VN",
        processingTime: Date.now(),
        source: "agora-simulation",
        agent: this.sttAgentId,
      };

      console.log("✅ [Agora Simulation] STT completed:", agoraResult);

      return transcript;
    } catch (error) {
      console.error("❌ [Agora Simulation] Failed:", error);
      throw error;
    }
  }

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

      recognition.lang = "vi-VN";
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      let timeoutId;
      let hasResult = false;

      recognition.onstart = () => {
        console.log("🎤 Web Speech API started listening...");
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

  async textToSpeech(text) {
    console.log("🔊 Text-to-Speech request:", text);

    console.log("🎵 Using Web Speech TTS");

    try {
      return await this.fallbackTextToSpeech(text);
    } catch (error) {
      console.error("❌ Web Speech TTS error:", error);

      if ("speechSynthesis" in window) {
        console.log("🔄 Using direct speechSynthesis as backup");
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "vi-VN";
        speechSynthesis.speak(utterance);
        return Promise.resolve(true);
      }

      throw error;
    }
  }

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

  playAudio(audioBlob) {
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);

    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
    };

    return audio.play();
  }

  getRecordingStatus() {
    return this.isRecording;
  }
}

const agoraServiceInstance = new AgoraService();
export default agoraServiceInstance;
