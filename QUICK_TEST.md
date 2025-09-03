# 🧪 Quick Test Guide

## ✅ **Đã sửa Agora API Schema**

### **Thay đổi chính:**

```diff
- // Old format (không hoạt động)
- {
-   channel: "speech-to-text-channel",
-   config: { language: "vi-VN", ... }
- }

+ // New format (theo Agora docs)
+ {
+   name: "agora-chatbot-stt",
+   languages: ["vi-VN"],
+   maxIdleTime: 30,
+   rtcConfig: {
+     channelName: "speech-to-text-channel",
+     pubBotUid: "888001",
+     subBotUid: "888002"
+   },
+   captionConfig: {
+     sliceDuration: 60,
+     storage: { ... }
+   }
+ }
```

## 🚀 **Test Steps:**

### 1. **Verify Proxy Server**

Open: `http://localhost:3001/test-config`

Expected response:

```json
{
  "appId": "c4b924d25ff4472191f0c5a10e61cb3e",
  "customerId": "91a46b7174cf44d1962db0947f9d7968",
  "authTokenPreview": "OTFhNDZiNzE3NGNmNDRk...",
  "sampleRequestBody": { ... }
}
```

### 2. **Test Agora API via Browser**

Open: `http://localhost:3000`

1. Click 🧪 button
2. Check Console for:

```
🧪 Testing Agora API connection...
🔄 Calling proxy server: http://localhost:3001/api/agora/start-stt
✅ STT Session started via proxy: [sessionId]
📋 Full response: { ... }
```

### 3. **Test Speech Recognition**

1. Click 🎤 to start recording
2. Say something clearly
3. Click 🎤 again to stop
4. Check for transcription in input field

## 🔍 **Expected Results:**

### ✅ **Success Signs:**

- `POST localhost:3001/api/agora/start-stt` → **200 OK**
- Console: `✅ STT Session started via proxy: [sessionId]`
- Web Speech API fallback works for transcription

### ❌ **Possible Issues:**

#### **Still getting 400 errors?**

- Check if Real-time STT is enabled in Agora Console
- Verify storage credentials are correct
- Try different `pubBotUid`/`subBotUid` values

#### **403 Forbidden?**

- Customer credentials might be wrong
- STT service not activated

#### **Network timeout?**

- Firewall blocking port 3001
- Proxy server not running

## 🐛 **Debug Commands:**

```bash
# Check proxy server status
curl http://localhost:3001/health

# Check configuration
curl http://localhost:3001/test-config

# Restart services
npm run start:dev
```

## 📋 **Next Steps if Still Failing:**

1. **Check Agora Console:**

   - Go to project settings
   - Verify Real-time STT is enabled
   - Check if service has usage limits

2. **Try simpler request:**

   - Change `languages: ["en-US"]` instead of `vi-VN`
   - Reduce required fields in request

3. **Contact Agora Support:**
   - Provide App ID: `c4b924d25ff4472191f0c5a10e61cb3e`
   - Share request body format that's failing

**The important thing is Web Speech API fallback should work regardless of Agora API status!** 🎯
