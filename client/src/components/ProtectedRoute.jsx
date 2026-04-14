import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          height: "100vh",
          width: "100vw",
          background: "#0a0a14",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div
          style={{
            width: "36px",
            height: "36px",
            border: "3px solid rgba(59, 130, 246, 0.15)",
            borderTop: "3px solid #3b82f6",
            borderRadius: "50%",
            animation: "protectedSpin 0.8s linear infinite",
          }}
        />
        <span
          style={{
            color: "rgba(255,255,255,0.4)",
            fontSize: "0.85rem",
            letterSpacing: "1px",
          }}
        >
          Checking authentication...
        </span>
        <style>{`
          @keyframes protectedSpin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
