import { AccessToken } from "livekit-server-sdk";
import { PlaygroundState } from "@/data/playground-state";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), "../.env.local") });

export async function POST(request: Request) {
  let requestData: PlaygroundState & {
    customerPhone?: string;
    customerName?: string;
  };

  try {
    requestData = await request.json();
  } catch (error) {
    return Response.json(
      { error: "Invalid JSON in request body" },
      { status: 400 }
    );
  }

  const {
    instructions,
    sessionConfig: { modalities, voice, temperature, maxOutputTokens },
    customerPhone,
    customerName,
  } = requestData;

  // Gemini API key is now handled by the backend agent, not needed here

  const roomName = Math.random().toString(36).slice(7);
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!apiKey || !apiSecret) {
    throw new Error("LIVEKIT_API_KEY and LIVEKIT_API_SECRET must be set");
  }

  const at = new AccessToken(apiKey, apiSecret, {
    identity: customerPhone || "human",
    metadata: JSON.stringify({
      instructions: instructions,
      modalities: modalities,
      voice: voice,
      temperature: temperature,
      max_output_tokens: maxOutputTokens,
      customer_phone: customerPhone || "+1 (555) 123-4567",
      customer_name: customerName || "Test Customer",
      // Gemini API key is handled by backend agent
    }),
  });
  at.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
    canUpdateOwnMetadata: true,
  });
  return Response.json({
    accessToken: await at.toJwt(),
    url: process.env.LIVEKIT_URL,
  });
}
