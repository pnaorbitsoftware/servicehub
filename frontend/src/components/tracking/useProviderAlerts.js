import { useEffect } from "react";
import { io } from "socket.io-client";

import { socketUrlFromApi } from "./trackingShared";

export default function useProviderAlerts({ apiUrl, token, enabled, onBookingAlert }) {
  useEffect(() => {
    if (!enabled || !token) return undefined;

    const socket = io(socketUrlFromApi(apiUrl), {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socket.on("provider:booking-alert", (event) => onBookingAlert?.(event));

    return () => {
      socket.disconnect();
    };
  }, [apiUrl, enabled, onBookingAlert, token]);
}
