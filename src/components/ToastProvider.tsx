"use client";

import { Toaster } from "react-hot-toast";

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4500,
        style: {
          border: "1px solid #dce1d9",
          borderRadius: "10px",
          color: "#111512",
          background: "#ffffff",
          fontSize: "14px",
        },
        success: {
          iconTheme: {
            primary: "#3c8625",
            secondary: "#ffffff",
          },
        },
        error: {
          iconTheme: {
            primary: "#b43c2d",
            secondary: "#ffffff",
          },
        },
      }}
    />
  );
}
