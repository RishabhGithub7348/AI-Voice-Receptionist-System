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

  if (messages.length === 0) {
    return (
      <div className="h-[200px] p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border">
        <div className="flex items-center justify-center h-full text-gray-500">
          Conversation will appear here...
        </div>
      </div>
    );
  }

  return (
    <div className="h-[200px] p-4 bg-white dark:bg-gray-800 rounded-lg border">
      <div
        ref={scrollRef}
        className="h-full overflow-y-auto space-y-3 pr-2"
        style={{ scrollBehavior: 'smooth' }}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.speaker === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.speaker === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              }`}
            >
              <div className="text-sm font-medium mb-1">
                {message.speaker === "user" ? "You" : "AI"}
              </div>
              <div className="text-sm">{message.text}</div>
              <div className={`text-xs mt-1 ${
                message.speaker === "user" ? "text-blue-100" : "text-gray-500"
              }`}>
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}