import React, { createContext, useContext, useState, useCallback } from "react";

export interface AppError {
  id: string;
  message: string;
  type: "error" | "warning" | "info";
  timestamp: number;
}

interface ErrorContextType {
  errors: AppError[];
  addError: (message: string, type?: AppError["type"]) => void;
  removeError: (id: string) => void;
  clearErrors: () => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export function ErrorProvider({ children }: { children: React.ReactNode }) {
  const [errors, setErrors] = useState<AppError[]>([]);

  const addError = useCallback((message: string, type: AppError["type"] = "error") => {
    const error: AppError = {
      id: Date.now().toString(),
      message,
      type,
      timestamp: Date.now(),
    };
    setErrors(prev => [...prev, error]);
  }, []);

  const removeError = useCallback((id: string) => {
    setErrors(prev => prev.filter(error => error.id !== id));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  return (
    <ErrorContext.Provider value={{ errors, addError, removeError, clearErrors }}>
      {children}
    </ErrorContext.Provider>
  );
}

export function useError() {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error("useError must be used within ErrorProvider");
  }
  return context;
}