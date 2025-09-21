"use client";

import { useEffect, useState, useRef } from "react";
import { useRemoteParticipants, useVoiceAssistant } from "@livekit/components-react";

interface TranscriptionMessage {
  id: string;
  speaker: "user" | "assistant";
  text: string;
  timestamp: Date;
}

export function TranscriptionDisplay() {
  const [messages, setMessages] = useState<TranscriptionMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { voiceAssistant } = useVoiceAssistant();
  const remoteParticipants = useRemoteParticipants();

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!voiceAssistant) return;

    // Listen for chat messages from the agent
    const handleMessage = (message: any) => {
      if (message.text) {
        const newMessage: TranscriptionMessage = {
          id: Date.now().toString() + "-agent",
          speaker: "assistant",
          text: message.text,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, newMessage]);
      }
    };

    // Listen for user transcriptions
    const handleUserTranscription = (transcription: any) => {
      if (transcription.text) {
        const newMessage: TranscriptionMessage = {
          id: Date.now().toString() + "-user",
          speaker: "user",
          text: transcription.text,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, newMessage]);
      }
    };

    // Add event listeners
    voiceAssistant.on("agent_response", handleMessage);
    voiceAssistant.on("user_speech", handleUserTranscription);

    return () => {
      voiceAssistant.off("agent_response", handleMessage);
      voiceAssistant.off("user_speech", handleUserTranscription);
    };
  }, [voiceAssistant]);

  // Also listen for transcription data from remote participants
  useEffect(() => {
    remoteParticipants.forEach(participant => {
      if (participant.isAgent) {
        participant.on("transcriptionReceived", (transcription: any) => {
          if (transcription.text) {
            const newMessage: TranscriptionMessage = {
              id: Date.now().toString() + "-agent-transcription",
              speaker: "assistant",
              text: transcription.text,
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, newMessage]);
          }
        });
      }
    });
  }, [remoteParticipants]);

  return (
    <div
      ref={scrollRef}
      className="h-full overflow-y-auto space-y-2"
      style={{ scrollBehavior: 'smooth' }}
    >
      {messages.length > 0 ? (
        messages.map((message) => (
          <div
            key={message.id}
            className={`text-xs ${
              message.speaker === "user"
                ? "text-blue-300"
                : "text-gray-300"
            }`}
          >
            <span className="font-semibold">
              {message.speaker === "user" ? "You: " : "AI: "}
            </span>
            <span className="opacity-90">{message.text}</span>
          </div>
        ))
      ) : (
        <div className="text-xs text-gray-500 italic">
          Speak to start...
        </div>
      )}
    </div>
  );
}