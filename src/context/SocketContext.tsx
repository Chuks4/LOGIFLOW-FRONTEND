"use client";

import {
  useCallback,
  useContext,
  createContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { io, type Socket } from "socket.io-client";
import { getValidAccessToken } from "@/services/axios/auth.service";

interface SocketApp {
  socket: Socket | null;
  connectSocket: () => Promise<Socket>;
}

const SocketContext = createContext<SocketApp | null>(null);
export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const connectionPromise = useRef<Promise<Socket> | null>(null);

  const socketUrl = useCallback(() => {
    const apiUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:5000";
    return new URL(apiUrl).origin;
  }, []);

  const connectSocket = useCallback(() => {
    if (connectionPromise.current) return connectionPromise.current;

    const connection = (async () => {
      const token = await getValidAccessToken();
      let sharedSocket = socketRef.current;

      if (!sharedSocket) {
        sharedSocket = io(socketUrl(), {
          auth: { token },
          transports: ["websocket"],
          autoConnect: false,
        });
        socketRef.current = sharedSocket;
        setSocket(sharedSocket);

        sharedSocket.on("connect", () => {
          console.log("Connected to server");
        });

        sharedSocket.on("disconnect", () => {
          console.log("Disconnected from server");
        });

        sharedSocket.on("tracking-error", () => {
          console.log("Tracking error");
        });
      } else {
        sharedSocket.auth = { token };
      }

      if (!sharedSocket.connected && !sharedSocket.active) {
        sharedSocket.connect();
      }

      return sharedSocket;
    })();

    connectionPromise.current = connection;
    void connection.then(
      () => {
        if (connectionPromise.current === connection) {
          connectionPromise.current = null;
        }
      },
      () => {
        if (connectionPromise.current === connection) {
          connectionPromise.current = null;
        }
      },
    );
    return connection;
  }, [socketUrl]);

  useEffect(
    () => () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    },
    [],
  );

  const value = { socket, connectSocket };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
