import dotenv from "dotenv";
import path from "path";

dotenv.config();  // Ensure .env is loaded correctly
console.log("🔹 LANGFLOW_APPLICATION_TOKEN:", process.env.LANGFLOW_APPLICATION_TOKEN);

class LangflowClient {
  baseURL: string;
  applicationToken: string;

  constructor(baseURL: string, applicationToken: string) {
    this.baseURL = baseURL.replace(/\/$/, ""); // Ensure no trailing slash
    this.applicationToken = applicationToken;
  }

  async post(endpoint: string, body: any, headers = { "Content-Type": "application/json" }) {
    headers["Authorization"] = `Bearer ${this.applicationToken}`;
    
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      console.log("🔹 Sending request to:", url);
      console.log("🔹 Request Body:", JSON.stringify(body, null, 2));

      const response = await fetch(url, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(body),
      });

      console.log("🔹 Raw Fetch Response:", response);

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(`${response.status} ${response.statusText} - ${errorMessage}`);
      }

      const responseMessage = await response.json();
      // console.log("🔹 Parsed JSON Response:", JSON.stringify(responseMessage, null, 2));
      JSON.stringify(responseMessage, null, 2);

      return responseMessage;
    } catch (error) {
      console.error("❌ Request Error:", error.message);
      throw error;
    }
  }

  async initiateSession(
    flowId: string,
    langflowId: string,
    inputValue: string,
    inputType = "chat",
    outputType = "chat",
    stream = false,
    tweaks = {}
  ) {
    const endpoint = `/lf/${langflowId}/api/v1/run/${flowId}?stream=${stream}`;
    return this.post(endpoint, {
      input_value: inputValue,
      input_type: inputType,
      output_type: outputType,
      tweaks: tweaks,
    });
  }

  handleStream(streamUrl: string, onUpdate: Function, onClose: Function, onError: Function) {
    const eventSource = new EventSource(streamUrl);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onUpdate(data);
    };

    eventSource.onerror = (event) => {
      console.error("❌ Stream Error:", event);
      onError(event);
      eventSource.close();
    };

    eventSource.addEventListener("close", () => {
      onClose("Stream closed");
      eventSource.close();
    });

    return eventSource;
  }

  async runFlow(
    flowIdOrName: string,
    langflowId: string,
    inputValue: string,
    inputType = "chat",
    outputType = "chat",
    tweaks = {},
    stream = false,
    onUpdate: Function,
    onClose: Function,
    onError: Function
  ) {
    try {
      const initResponse = await this.initiateSession(
        flowIdOrName,
        langflowId,
        inputValue,
        inputType,
        outputType,
        stream,
        tweaks
      );

      // console.log("🔹 Full API Response:", JSON.stringify(initResponse, null, 2));
      JSON.stringify(initResponse, null, 2);

      if (!initResponse || typeof initResponse !== "object") {
        console.error("❌ API returned an unexpected response format:", initResponse);
        return "Error: Invalid AI response.";
      }

      if (!initResponse.outputs || !Array.isArray(initResponse.outputs) || initResponse.outputs.length === 0) {
        console.error("❌ No valid outputs received from Langflow API:", initResponse);
        return "Error: No AI response received.";
      }

      const firstComponentOutputs = initResponse.outputs[0];
      if (!firstComponentOutputs.outputs || firstComponentOutputs.outputs.length === 0) {
        console.error("❌ No valid component outputs found:", initResponse);
        return "Error: AI response structure is incomplete.";
      }

      const firstOutput = firstComponentOutputs.outputs[0];
      if (!firstOutput.results || !firstOutput.results.message) {
        console.error("❌ No message output found:", initResponse);
        return "Error: AI response is incomplete.";
      }

      const output = firstOutput.results.message.text;  // ✅ Corrected Access
      // console.log("🔹 AI Output:", output);
      return output;
      
    } catch (error) {
      console.error("❌ Error running flow:", error);
      onError("Error initiating session");
    }
  }
}

export async function runAIWorkFlow(
  inputValue: string,
  inputType = "chat",
  outputType = "chat",
  stream = false
) {
  const flowIdOrName = "7cef2924-d59c-44a7-95f7-c7516c66c99c";
  const langflowId = "669234a1-7ebe-41d0-8948-42d2b140ae9b";
  const applicationToken = process.env.LANGFLOW_APPLICATION_TOKEN;

  if (!applicationToken) {
    console.error("❌ Missing LANGFLOW_APPLICATION_TOKEN in environment variables");
    return "Error: API token is missing.";
  }

  const langflowClient = new LangflowClient(
    "https://api.langflow.astra.datastax.com",
    applicationToken
  );

  try {
    const tweaks = {};
    console.log("🔹 Sending request to Langflow with input:", inputValue);

    let response = await langflowClient.runFlow(
      flowIdOrName,
      langflowId,
      inputValue,
      inputType,
      outputType,
      tweaks,
      stream,
      (data: any) => console.log("✅ Received:", data.chunk), // onUpdate
      (message: any) => console.log("✅ Stream Closed:", message), // onClose
      (error: any) => console.log("❌ Stream Error:", error) // onError
    );

    return response;
  } catch (error) {
    console.error("❌ Main Error:", error.message);
    return "Error: Unable to process request.";
  }
}
