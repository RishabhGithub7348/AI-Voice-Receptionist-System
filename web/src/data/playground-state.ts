import { ModalitiesId } from "@/data/modalities";
import { VoiceId } from "@/data/voices";
import { Preset } from "./presets";
import { ModelId } from "./models";

export interface SessionConfig {
  model: ModelId;
  modalities: ModalitiesId;
  voice: VoiceId;
  temperature: number;
  maxOutputTokens: number | null;
}

export interface PlaygroundState {
  sessionConfig: SessionConfig;
  userPresets: Preset[];
  selectedPresetId: string | null;
  geminiAPIKey: string | null | undefined;
  instructions: string;
}

export const defaultSessionConfig: SessionConfig = {
  model: ModelId.GEMINI_2_0_FLASH_EXT,
  modalities: ModalitiesId.AUDIO_ONLY,
  voice: VoiceId.PUCK,
  temperature: 0.8,
  maxOutputTokens: null,
};

// Define the initial state
export const defaultPlaygroundState: PlaygroundState = {
  sessionConfig: { ...defaultSessionConfig },
  userPresets: [],
  selectedPresetId: "helpful-ai",
  geminiAPIKey: undefined,
  instructions: "You are an AI receptionist for Bella's Hair & Beauty Salon. If you need help, say: 'Let me check with my supervisor and get back to you shortly.'",
};
