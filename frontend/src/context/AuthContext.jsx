import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  get,
  post,
  createSocket,
} from "../services";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("nlams-user") || "null"
      );
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(
    () => localStorage.getItem("nlams-token") || null
  );

  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // ----------------------------------------
  // Validate existing session
  // ----------------------------------------
  useEffect(() => {
    async function validateSession() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const result = await get("/auth/me");

        setUser(result.user);

        localStorage.setItem(
          "nlams-user",
          JSON.stringify(result.user)
        );
      } catch (error) {
        console.error("Session validation failed:", error);

        localStorage.removeItem("nlams-token");
        localStorage.removeItem("nlams-user");

        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    }

    validateSession();
  }, [token]);

  // ----------------------------------------
  // Socket.IO
  // ----------------------------------------
  useEffect(() => {
    if (!user || !token) return;

    console.log(
      "Connecting Socket.IO for:",
      user.username,
      user.role
    );

    const newSocket = createSocket(token);

    newSocket.on("connect", () => {
      console.log(
        "🟢 NLAMS real-time connection established"
      );

      // Join role room
      newSocket.emit("join-role", user.role);

      // Join personal room
      if (user.id) {
        newSocket.emit("join-user", user.id);
      }
    });

    // ----------------------------------------
    // REAL-TIME NOTIFICATION
    // ----------------------------------------
    newSocket.on("notification", (notification) => {
      console.log(
        "🔔 REAL-TIME NOTIFICATION:",
        notification
      );

      setNotifications((old) => [
        {
          ...notification,
          _id:
            notification._id ||
            `live-${Date.now()}`,
          createdAt:
            notification.createdAt ||
            new Date().toISOString(),
          read: false,
        },
        ...old,
      ]);
    });

    // ----------------------------------------
    // Workflow update
    // ----------------------------------------
    newSocket.on("workflow:update", (event) => {
      setNotifications((old) => [
        {
          _id: `workflow-${Date.now()}`,
          title: event.title || "Workflow Updated",
          message:
            event.message ||
            "A workflow was updated.",
          read: false,
          createdAt: new Date(),
        },
        ...old,
      ]);
    });

    newSocket.on("connect_error", (error) => {
      console.error(
        "Socket connection error:",
        error.message
      );
    });

    setSocket(newSocket);

    // Useful for debugging
    window.nlamsSocket = newSocket;

    return () => {
      console.log("Disconnecting NLAMS Socket");

      newSocket.disconnect();

      if (window.nlamsSocket === newSocket) {
        window.nlamsSocket = null;
      }

      setSocket(null);
    };
  }, [user, token]);

  // ----------------------------------------
  // Login
  // ----------------------------------------
  async function login(username, password) {
    const result = await post("/auth/login", {
      username,
      password,
    });

    localStorage.setItem(
      "nlams-token",
      result.token
    );

    localStorage.setItem(
      "nlams-user",
      JSON.stringify(result.user)
    );

    setToken(result.token);
    setUser(result.user);

    return result;
  }

  // ----------------------------------------
  // Logout
  // ----------------------------------------
  function logout() {
    if (socket) {
      socket.disconnect();
    }

    window.nlamsSocket = null;

    localStorage.removeItem("nlams-token");
    localStorage.removeItem("nlams-user");

    setToken(null);
    setUser(null);
    setNotifications([]);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        socket,

        notifications,
        setNotifications,

        login,
        logout,

        isAuthenticated:
          Boolean(user && token),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}