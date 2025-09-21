"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Phone, PhoneOff, Mic, MicOff, Volume2, User } from 'lucide-react';

interface SimulatedCall {
  id: string;
  customerPhone: string;
  customerName?: string;
  status: 'active' | 'ended';
  duration: number;
  messages: {
    id: string;
    speaker: 'customer' | 'ai';
    message: string;
    timestamp: Date;
  }[];
}

export function CallSimulator() {
  const [calls, setCalls] = useState<SimulatedCall[]>([]);
  const [newCallPhone, setNewCallPhone] = useState('+1 (555) 123-4567');
  const [newCallName, setNewCallName] = useState('Jane Doe');
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [currentMessage, setCurrentMessage] = useState('');

  const startNewCall = () => {
    const newCall: SimulatedCall = {
      id: Date.now().toString(),
      customerPhone: newCallPhone,
      customerName: newCallName,
      status: 'active',
      duration: 0,
      messages: [
        {
          id: Date.now().toString(),
          speaker: 'ai',
          message: "Hello! Thank you for calling Bella's Hair & Beauty Salon. How can I help you today?",
          timestamp: new Date()
        }
      ]
    };

    setCalls(prev => [newCall, ...prev]);
    setActiveCallId(newCall.id);
  };

  const endCall = (callId: string) => {
    setCalls(prev => prev.map(call =>
      call.id === callId ? { ...call, status: 'ended' } : call
    ));
    if (activeCallId === callId) {
      setActiveCallId(null);
    }
  };

  const sendMessage = () => {
    if (!currentMessage.trim() || !activeCallId) return;

    const activeCall = calls.find(call => call.id === activeCallId);
    if (!activeCall) return;

    // Add customer message
    const customerMessage = {
      id: Date.now().toString(),
      speaker: 'customer' as const,
      message: currentMessage,
      timestamp: new Date()
    };

    setCalls(prev => prev.map(call =>
      call.id === activeCallId
        ? { ...call, messages: [...call.messages, customerMessage] }
        : call
    ));

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = generateAIResponse(currentMessage);
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        speaker: 'ai' as const,
        message: aiResponse,
        timestamp: new Date()
      };

      setCalls(prev => prev.map(call =>
        call.id === activeCallId
          ? { ...call, messages: [...call.messages, aiMessage] }
          : call
      ));
    }, 1000);

    setCurrentMessage('');
  };

  const generateAIResponse = (customerMessage: string): string => {
    const message = customerMessage.toLowerCase();

    if (message.includes('hours') || message.includes('open') || message.includes('time')) {
      return "We're open Monday through Friday 9 AM to 7 PM, Saturday 9 AM to 5 PM, and closed on Sundays.";
    }

    if (message.includes('price') || message.includes('cost') || message.includes('how much')) {
      return "Basic haircuts start at $45, and cut and style packages start at $65. Prices may vary based on hair length and complexity.";
    }

    if (message.includes('appointment') || message.includes('book') || message.includes('schedule')) {
      return "I'd be happy to help you schedule an appointment! We prefer appointments but also accept walk-ins when possible. What service are you interested in?";
    }

    if (message.includes('services') || message.includes('offer') || message.includes('do you')) {
      return "We offer haircuts, hair coloring, highlights, blowouts, hair styling, manicures, pedicures, facials, and eyebrow services.";
    }

    if (message.includes('wedding') || message.includes('special event') || message.includes('party')) {
      return "Let me check with my supervisor and get back to you shortly about our special event packages.";
    }

    if (message.includes('cancel') || message.includes('refund') || message.includes('policy')) {
      return "Let me check with my supervisor and get back to you shortly about our cancellation policy.";
    }

    // Default escalation response
    return "Let me check with my supervisor and get back to you shortly.";
  };

  const activeCall = calls.find(call => call.id === activeCallId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Call Simulator</h2>
          <p className="text-gray-600">Test the AI receptionist with simulated customer calls</p>
        </div>
        <Badge className="bg-blue-100 text-blue-800">
          {calls.filter(call => call.status === 'active').length} Active Calls
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Call Controls */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Start New Call</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="phone">Customer Phone</Label>
              <Input
                id="phone"
                value={newCallPhone}
                onChange={(e) => setNewCallPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div>
              <Label htmlFor="name">Customer Name (Optional)</Label>
              <Input
                id="name"
                value={newCallName}
                onChange={(e) => setNewCallName(e.target.value)}
                placeholder="Jane Doe"
              />
            </div>
            <Button
              onClick={startNewCall}
              className="w-full"
              disabled={!newCallPhone.trim()}
            >
              <Phone className="w-4 h-4 mr-2" />
              Start Call
            </Button>
          </div>

          {/* Sample Questions */}
          <div className="mt-6">
            <h4 className="font-medium mb-3">Sample Questions to Test:</h4>
            <div className="space-y-2 text-sm">
              <div className="p-2 bg-gray-50 rounded text-gray-700">
                "What are your business hours?"
              </div>
              <div className="p-2 bg-gray-50 rounded text-gray-700">
                "How much does a haircut cost?"
              </div>
              <div className="p-2 bg-gray-50 rounded text-gray-700">
                "Do you offer wedding packages?" (escalates)
              </div>
              <div className="p-2 bg-gray-50 rounded text-gray-700">
                "What's your cancellation policy?" (escalates)
              </div>
            </div>
          </div>
        </Card>

        {/* Active Call Interface */}
        <Card className="p-6 lg:col-span-2">
          {activeCall ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-full">
                    <Phone className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">
                      {activeCall.customerName || 'Unknown Caller'}
                    </h3>
                    <p className="text-sm text-gray-600">{activeCall.customerPhone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800">Live Call</Badge>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => endCall(activeCall.id)}
                  >
                    <PhoneOff className="w-4 h-4 mr-1" />
                    End Call
                  </Button>
                </div>
              </div>

              {/* Call Messages */}
              <div className="border rounded-lg p-4 h-64 overflow-y-auto bg-gray-50">
                <div className="space-y-3">
                  {activeCall.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.speaker === 'customer' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          message.speaker === 'customer'
                            ? 'bg-blue-500 text-white'
                            : 'bg-white border'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {message.speaker === 'customer' ? (
                            <User className="w-4 h-4" />
                          ) : (
                            <Volume2 className="w-4 h-4" />
                          )}
                          <span className="text-xs font-medium">
                            {message.speaker === 'customer' ? 'Customer' : 'AI Receptionist'}
                          </span>
                        </div>
                        <p className="text-sm">{message.message}</p>
                        <p className={`text-xs mt-1 ${
                          message.speaker === 'customer' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Message Input */}
              <div className="flex gap-2">
                <Textarea
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  placeholder="Type customer message..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  className="flex-1"
                  rows={2}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!currentMessage.trim()}
                  className="px-4"
                >
                  <Mic className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <Phone className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Start a new call to begin testing the AI receptionist</p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Call History */}
      {calls.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Call History</h3>
          <div className="space-y-3">
            {calls.map((call) => (
              <div
                key={call.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    call.status === 'active' ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <Phone className={`w-4 h-4 ${
                      call.status === 'active' ? 'text-green-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium">
                      {call.customerName || 'Unknown Caller'}
                    </p>
                    <p className="text-sm text-gray-600">{call.customerPhone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={
                    call.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }>
                    {call.status === 'active' ? 'Active' : 'Ended'}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {call.messages.length} messages
                  </span>
                  {call.status === 'active' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveCallId(call.id)}
                    >
                      View
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}