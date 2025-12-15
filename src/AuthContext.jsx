import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const interceptor = axios.interceptors.request.use(
      (config) => {
        const currentToken =
          localStorage.getItem("authToken") ||
          sessionStorage.getItem("authToken");
        if (currentToken && config.url?.includes("/api/")) {
          config.headers.Authorization = `Bearer ${currentToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
          logout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(interceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken =
        localStorage.getItem("authToken") ||
        sessionStorage.getItem("authToken");
      const storedUser =
        localStorage.getItem("user") || sessionStorage.getItem("user");
      const isRemembered = localStorage.getItem("rememberMe") === "true";

      setRememberMe(isRemembered);

      if (storedToken && storedUser) {
        try {
          const response = await axios.get(`${API}/auth/verify`, {
            headers: { Authorization: `Bearer ${storedToken}` },
          });

          if (response.data.valid) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
          } else {
            logout();
          }
        } catch (err) {
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = (newToken, newUser, remember = false) => {
    setToken(newToken);
    setUser(newUser);
    setRememberMe(remember);

    if (remember) {
      localStorage.setItem("authToken", newToken);
      localStorage.setItem("user", JSON.stringify(newUser));
      localStorage.setItem("rememberMe", "true");
    } else {
      sessionStorage.setItem("authToken", newToken);
      sessionStorage.setItem("user", JSON.stringify(newUser));
      localStorage.removeItem("rememberMe");
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setRememberMe(false);
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    localStorage.removeItem("rememberMe");
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("user");
  };

  const value = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!token,
    loading,
    rememberMe,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
