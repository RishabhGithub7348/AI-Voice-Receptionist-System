"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useConnection } from "@/hooks/use-connection";
import { Loader2 } from "lucide-react";
export function ConnectButton() {
  const { connect, disconnect, shouldConnect } = useConnection();
  const [connecting, setConnecting] = useState<boolean>(false);

  const handleConnectionToggle = async () => {
    if (shouldConnect) {
      await disconnect();
    } else {
      // No API key required - backend handles it
      await initiateConnection();
    }
  };

  const initiateConnection = useCallback(async () => {
    setConnecting(true);
    try {
      await connect();
    } catch (error) {
      console.error("Connection failed:", error);
    } finally {
      setConnecting(false);
    }
  }, [connect]);

  return (
    <Button
      onClick={handleConnectionToggle}
      disabled={connecting}
      className="text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white"
    >
      {connecting || shouldConnect ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {shouldConnect ? "Connected" : "Connecting..."}
        </>
      ) : (
        <>📞 Start Call</>
      )}
    </Button>
  );
}
