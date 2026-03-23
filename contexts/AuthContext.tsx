import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { getApiUrl } from "@/lib/query-client";

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  createdAt: number;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  register: (email: string, username: string, password: string) => Promise<void>;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ devOtp?: string }>;
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "leadlocker_token";

async function storeToken(token: string) {
  if (Platform.OS === "web") {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  }
}

async function loadToken(): Promise<string | null> {
  if (Platform.OS === "web") {
    return localStorage.getItem(TOKEN_KEY);
  }
  return SecureStore.getItemAsync(TOKEN_KEY);
}

async function removeToken() {
  if (Platform.OS === "web") {
    localStorage.removeItem(TOKEN_KEY);
  } else {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }
}

async function apiCall(path: string, options: RequestInit = {}) {
  const url = new URL(path, getApiUrl()).toString();
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Something went wrong");
  return data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadToken().then(async (t) => {
      if (t) {
        try {
          const userData = await apiCall("/api/auth/me", {
            headers: { Authorization: `Bearer ${t}` },
          });
          setToken(t);
          setUser(userData);
        } catch {
          await removeToken();
        }
      }
      setIsLoading(false);
    });
  }, []);

  const register = async (email: string, username: string, password: string) => {
    const data = await apiCall("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, username, password }),
    });
    await storeToken(data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const login = async (emailOrUsername: string, password: string) => {
    const data = await apiCall("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ emailOrUsername, password }),
    });
    await storeToken(data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const logout = async () => {
    await removeToken();
    setToken(null);
    setUser(null);
  };

  const deleteAccount = async () => {
    await apiCall("/api/auth/account", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    await removeToken();
    setToken(null);
    setUser(null);
  };

  const forgotPassword = async (email: string) => {
    return apiCall("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  };

  const resetPassword = async (email: string, otp: string, newPassword: string) => {
    await apiCall("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ email, otp, newPassword }),
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, register, login, logout, deleteAccount, forgotPassword, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
