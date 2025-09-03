const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
const PORT = 3001;

// Agora Configuration
const AGORA_CONFIG = {
  customerId: "91a46b7174cf44d1962db0947f9d7968",
  customerSecret: "e5fbde57fb2a4e08ba2fbf8858a10f81",
  appId: "c4b924d25ff4472191f0c5a10e61cb3e",
  baseUrl: "https://api.agora.io",
};

// Middleware
app.use(cors());
app.use(express.json());

// Generate auth token
function generateAuthToken() {
  const credentials = `${AGORA_CONFIG.customerId}:${AGORA_CONFIG.customerSecret}`;
  return Buffer.from(credentials).toString("base64");
}

// Start STT Session
app.post("/api/agora/start-stt", async (req, res) => {
  try {
    console.log("🔄 Starting Agora STT session...");

    const authToken = generateAuthToken();
    const url = `${AGORA_CONFIG.baseUrl}/api/speech-to-text/v1/projects/${AGORA_CONFIG.appId}/join`;

    const requestBody = {
      languages: ["vi-VN"],
      name: "agora-chatbot-stt",
      maxIdleTime: 50,
      rtcConfig: {
        channelName: "speech-to-text-channel",
        pubBotUid: "888001",
        subBotUid: "888002", // Required by API schema despite examples not showing it
      },
      captionConfig: {
        sliceDuration: 60,
        storage: {
          accessKey: "agora-access-key",
          secretKey: "agora-secret-key",
          bucket: "agora-recording-bucket",
          vendor: 2,
          region: 0,
        },
      },
    };

    console.log("📤 Request URL:", url);
    console.log("📤 Request Body:", JSON.stringify(requestBody, null, 2));

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    console.log("📥 Response Status:", response.status);
    console.log("📥 Response Body:", responseText);

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Agora API error: ${response.status}`,
        details: responseText,
      });
    }

    const result = JSON.parse(responseText);
    console.log("✅ STT Session started successfully");

    // Extract agentId from response
    const agentId = result.agentId || result.agent_id || result.id;
    console.log("📋 Agent ID:", agentId);

    res.json(result);
  } catch (error) {
    console.error("❌ Error starting STT session:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});

// Stop STT Session
app.post("/api/agora/stop-stt", async (req, res) => {
  try {
    const { agentId } = req.body;
    console.log("🛑 Stopping STT agent:", agentId);

    const authToken = generateAuthToken();
    // Sử dụng /agents/:agentId/leave endpoint theo Agora docs
    const url = `${AGORA_CONFIG.baseUrl}/api/speech-to-text/v1/projects/${AGORA_CONFIG.appId}/agents/${agentId}/leave`;

    console.log("📤 Stop URL:", url);

    const response = await fetch(url, {
      method: "POST", // Note: POST, not DELETE theo examples
      headers: {
        Authorization: `Basic ${authToken}`,
        "Content-Type": "application/json",
      },
      // Note: Không cần body theo examples
    });

    const responseText = await response.text();
    console.log("📥 Stop Response:", response.status, responseText);

    if (response.ok) {
      console.log("✅ STT Agent stopped successfully");
      res.json({ success: true });
    } else {
      res.status(response.status).json({
        error: `Stop agent failed: ${response.status}`,
        details: responseText,
      });
    }
  } catch (error) {
    console.error("❌ Error stopping STT agent:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Test STT configuration
app.get("/test-config", (req, res) => {
  const authToken = generateAuthToken();
  res.json({
    appId: AGORA_CONFIG.appId,
    customerId: AGORA_CONFIG.customerId,
    authTokenPreview: authToken.substring(0, 20) + "...",
    sampleRequestBody: {
      name: "agora-chatbot-stt",
      languages: ["vi-VN"],
      maxIdleTime: 30,
      rtcConfig: {
        channelName: "speech-to-text-channel",
        pubBotUid: "888001",
        subBotUid: "888002", // Required by API schema
      },
      captionConfig: {
        sliceDuration: 60,
        storage: {
          accessKey: "agora-stt-access",
          secretKey: "agora-stt-secret",
          bucket: "agora-recording-bucket",
          vendor: 2,
          region: 0,
        },
      },
    },
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Agora Proxy Server running on http://localhost:${PORT}`);
  console.log(`📋 App ID: ${AGORA_CONFIG.appId}`);
  console.log(`🔑 Customer ID: ${AGORA_CONFIG.customerId}`);
  console.log("");
  console.log("Available endpoints:");
  console.log("  POST   /api/agora/start-stt");
  console.log("  DELETE /api/agora/stop-stt");
  console.log("  GET    /health");
  console.log("  GET    /test-config");
});
