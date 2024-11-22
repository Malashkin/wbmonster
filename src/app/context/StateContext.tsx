"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface StateContextProps {
  clientId: string;
  setClientId: (value: string) => void;
  apiKey: string;
  setApiKey: (value: string) => void;
  daysCount: number;
  setDaysCount: (value: number) => void;
  nmidList: string;
  setNmidList: (value: string) => void;
}

const StateContext = createContext<StateContextProps | undefined>(undefined);

export const StateProvider = ({ children }: { children: ReactNode }) => {
  const [clientId, setClientId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [daysCount, setDaysCount] = useState(35);
  const [nmidList, setNmidList] = useState("");

  return (
    <StateContext.Provider
      value={{
        clientId,
        setClientId,
        apiKey,
        setApiKey,
        daysCount,
        setDaysCount,
        nmidList,
        setNmidList,
      }}
    >
      {children}
    </StateContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(StateContext);
  if (!context) {
    throw new Error("useAppState must be used within a StateProvider");
  }
  return context;
};
