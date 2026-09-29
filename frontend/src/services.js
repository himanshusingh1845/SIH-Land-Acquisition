import axios from "axios";
import { io } from "socket.io-client";

// ===============================
// API CONFIGURATION
// ===============================

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

// ===============================
// AXIOS INSTANCE
// ===============================

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// ===============================
// REQUEST INTERCEPTOR
// ===============================

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("nlams-token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ===============================
// RESPONSE INTERCEPTOR
// ===============================

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(
        "NLAMS API Error:",
        error.response.status,
        error.response.data
      );
    } else if (error.request) {
      console.error(
        "NLAMS Network Error: Backend is not responding.",
        error.message
      );
    } else {
      console.error("NLAMS Request Error:", error.message);
    }

    return Promise.reject(error);
  }
);

// ===============================
// GET
// ===============================

export async function get(path, config = {}) {
  const response = await api.get(path, config);
  return response.data;
}

// ===============================
// POST
// ===============================

export async function post(path, data = {}, config = {}) {
  const response = await api.post(path, data, config);
  return response.data;
}

// ===============================
// PUT
// ===============================

export async function put(path, data = {}, config = {}) {
  const response = await api.put(path, data, config);
  return response.data;
}

// ===============================
// PATCH
// ===============================

export async function patch(path, data = {}, config = {}) {
  const response = await api.patch(path, data, config);
  return response.data;
}

// ===============================
// DELETE
// ===============================

export async function del(path, config = {}) {
  const response = await api.delete(path, config);
  return response.data;
}

// ===============================
// FILE UPLOAD
// ===============================

export async function upload(path, formData, onUploadProgress) {
  const response = await api.post(path, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress,
  });

  return response.data;
}

// ===============================
// SOCKET.IO
// ===============================

export function createSocket(token) {
  return io(SOCKET_URL, {
    auth: {
      token,
    },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });
}

// ===============================
// LOGOUT / AUTH CLEANUP
// ===============================

export function clearAuth() {
  localStorage.removeItem("nlams-token");
  localStorage.removeItem("nlams-user");
}

// ===============================
// EXPORTED VALUES
// ===============================

export {
  api,
  API_URL,
  SOCKET_URL,
};