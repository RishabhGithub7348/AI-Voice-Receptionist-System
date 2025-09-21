"use client";

import { useState } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  StartAudio,
} from "@livekit/components-react";

import { SimpleConfigurationForm } from "@/components/simple-configuration-form";
import { PhoneChat } from "@/components/phone-chat";
import { useConnection } from "@/hooks/use-connection";
import { useCustomerSession } from "@/hooks/useCustomerSession";
import { AgentProvider } from "@/hooks/use-agent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Phone, Smartphone, Loader2 } from "lucide-react";

export function RoomComponent() {
  const { shouldConnect, wsUrl, token, connect } = useConnection();
  const { currentSession, createSession, endSession: endCustomerSession, loading, error } = useCustomerSession();
  const [customerPhone, setCustomerPhone] = useState("+1 (555) 123-4567");
  const [customerName, setCustomerName] = useState("Jane Doe");
  const [sessionStarted, setSessionStarted] = useState(false);

  const startSession = async () => {
    try {
      // Create customer session first
      await createSession(customerPhone, customerName);

      // Then connect to LiveKit
      await connect({
        customerPhone,
        customerName,
      });
      setSessionStarted(true);
    } catch (error) {
      console.error("Failed to start session:", error);
    }
  };

  const endSession = async () => {
    try {
      // End customer session if exists
      if (currentSession) {
        await endCustomerSession(currentSession.sessionId);
      }
      setSessionStarted(false);
    } catch (error) {
      console.error("Failed to end session:", error);
      // Still end the session even if API call fails
      setSessionStarted(false);
    }
  };

  if (!sessionStarted) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Smartphone className="w-10 h-10 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Start Voice Call Session</h2>
          <p className="text-gray-600">Enter customer details to begin testing the AI receptionist</p>
        </div>

        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="customer-phone">Customer Phone Number</Label>
              <Input
                id="customer-phone"
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="text-center text-lg"
              />
            </div>

            <div>
              <Label htmlFor="customer-name">Customer Name (Optional)</Label>
              <Input
                id="customer-name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Jane Doe"
                className="text-center"
              />
            </div>

            <div className="pt-4">
              <SimpleConfigurationForm />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                {error}
              </div>
            )}

            <Button
              onClick={startSession}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg"
              disabled={!customerPhone.trim() || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Starting Call...
                </>
              ) : (
                <>
                  <Phone className="w-5 h-5 mr-2" />
                  Start Call
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <LiveKitRoom
      serverUrl={wsUrl}
      token={token}
      connect={shouldConnect}
      audio={true}
      className="flex flex-col items-center justify-center min-h-[600px]"
      options={{
        publishDefaults: {
          stopMicTrackOnMute: true,
        },
      }}
    >
      <AgentProvider>
        <div className="max-w-md mx-auto">
          <PhoneChat
            customerPhone={customerPhone}
            customerName={customerName}
            onEndCall={endSession}
          />
        </div>
        <RoomAudioRenderer />
        <StartAudio label="Click to allow audio playback" />
      </AgentProvider>
    </LiveKitRoom>
  );
}
