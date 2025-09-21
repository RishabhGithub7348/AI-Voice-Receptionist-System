"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  User,
  MessageSquare,
  Clock,
  Wifi,
  WifiOff
} from "lucide-react";
import {
  useVoiceAssistant,
  useConnectionState,
  useLocalParticipant,
} from "@livekit/components-react";
import { ConnectionState } from "livekit-client";
import { TranscriptionDisplay } from "@/components/transcription-display";

interface PhoneChatProps {
  customerPhone: string;
  customerName?: string;
  onEndCall: () => void;
}

export function PhoneChat({ customerPhone, customerName, onEndCall }: PhoneChatProps) {
  const connectionState = useConnectionState();
  const { localParticipant } = useLocalParticipant();
  const { voiceAssistant } = useVoiceAssistant();
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [showTranscript, setShowTranscript] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout>();

  const isConnected = connectionState === ConnectionState.Connected;
  const isConnecting = connectionState === ConnectionState.Connecting;

  // Call duration timer
  useEffect(() => {
    if (isConnected && !intervalRef.current) {
      intervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else if (!isConnected && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isConnected]);

  // Format call duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Toggle microphone
  const toggleMute = async () => {
    if (localParticipant) {
      await localParticipant.setMicrophoneEnabled(isMuted);
      setIsMuted(!isMuted);
    }
  };

  // Toggle speaker
  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
  };

  // Handle call end
  const handleEndCall = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setCallDuration(0);
    onEndCall();
  };

  return (
    <div className="w-full max-w-sm mx-auto bg-gray-100 rounded-3xl shadow-2xl overflow-hidden">
      {/* Phone Screen */}
      <div className="bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white relative">
        {/* Status Bar */}
        <div className="flex justify-between items-center px-4 py-2 text-xs">
          <span className="font-medium">9:41 AM</span>
          <div className="flex items-center space-x-2">
            <Wifi className="w-3 h-3" />
            <div className="flex space-x-1">
              <div className="w-1 h-3 bg-white rounded-sm"></div>
              <div className="w-1 h-3 bg-white rounded-sm"></div>
              <div className="w-1 h-3 bg-white rounded-sm opacity-50"></div>
            </div>
            <div className="w-6 h-3 border border-white rounded-sm">
              <div className="w-4 h-2 bg-white rounded-sm m-0.5"></div>
            </div>
          </div>
        </div>

        {/* Call Header */}
        <div className="text-center py-8 px-6">
          {/* Connection Status */}
          <div className="mb-4">
            {isConnecting ? (
              <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/50 animate-pulse">
                Connecting...
              </Badge>
            ) : isConnected ? (
              <Badge className="bg-green-500/20 text-green-300 border-green-500/50">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                Connected
              </Badge>
            ) : (
              <Badge className="bg-red-500/20 text-red-300 border-red-500/50">
                Disconnected
              </Badge>
            )}
          </div>

          {/* Customer Avatar */}
          <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <User className="w-12 h-12 text-white" />
          </div>

          {/* Customer Info */}
          <h2 className="text-2xl font-semibold mb-1">
            {customerName || 'Customer'}
          </h2>
          <p className="text-blue-300 text-sm mb-1">{customerPhone}</p>
          <p className="text-green-400 text-xs">Bella&apos;s Hair & Beauty Salon</p>

          {/* Call Duration */}
          <div className="mt-4">
            <span className="text-3xl font-light tracking-wider">
              {formatDuration(callDuration)}
            </span>
          </div>
        </div>

        {/* Live Transcript Section - Compact */}
        {showTranscript && (
          <div className="bg-black/30 backdrop-blur-sm mx-4 mb-4 rounded-2xl p-3 max-h-32 overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-400">Live Transcript</span>
              </div>
              {isConnected && (
                <div className="flex items-center space-x-1">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-red-400">REC</span>
                </div>
              )}
            </div>
            <div className="overflow-y-auto max-h-20">
              <TranscriptionDisplay />
            </div>
          </div>
        )}
      </div>

      {/* Call Controls */}
      <div className="bg-white p-6">
        <div className="grid grid-cols-4 gap-4 mb-4">
          {/* Mute Button */}
          <button
            onClick={toggleMute}
            disabled={!isConnected}
            className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all ${
              isMuted
                ? 'bg-red-100 text-red-600'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            } ${!isConnected && 'opacity-50 cursor-not-allowed'}`}
          >
            {isMuted ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
            <span className="text-xs mt-1">{isMuted ? 'Unmute' : 'Mute'}</span>
          </button>

          {/* Speaker Button */}
          <button
            onClick={toggleSpeaker}
            disabled={!isConnected}
            className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all ${
              isSpeakerOn
                ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                : 'bg-gray-200 text-gray-500'
            } ${!isConnected && 'opacity-50 cursor-not-allowed'}`}
          >
            {isSpeakerOn ? (
              <Volume2 className="w-5 h-5" />
            ) : (
              <VolumeX className="w-5 h-5" />
            )}
            <span className="text-xs mt-1">Speaker</span>
          </button>

          {/* Transcript Toggle */}
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all ${
              showTranscript
                ? 'bg-blue-100 text-blue-600'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-xs mt-1">Transcript</span>
          </button>

          {/* Add Contact (placeholder) */}
          <button
            disabled
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gray-100 text-gray-400 cursor-not-allowed"
          >
            <User className="w-5 h-5" />
            <span className="text-xs mt-1">Contact</span>
          </button>
        </div>

        {/* End Call Button */}
        <button
          onClick={handleEndCall}
          className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-full flex items-center justify-center space-x-3 transition-colors shadow-lg"
        >
          <PhoneOff className="w-6 h-6" />
          <span className="font-semibold text-lg">End Call</span>
        </button>

        {/* Status Text */}
        <div className="text-center mt-3">
          {isConnecting ? (
            <p className="text-xs text-gray-500">Connecting to AI receptionist...</p>
          ) : isConnected ? (
            <p className="text-xs text-green-600 font-medium">AI Assistant Ready</p>
          ) : (
            <p className="text-xs text-red-600">Call disconnected</p>
          )}
        </div>
      </div>
    </div>
  );
}