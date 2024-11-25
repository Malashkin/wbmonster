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

  // Новые состояния
  array1: string;
  setArray1: (value: string) => void;
  array2: string;
  setArray2: (value: string) => void;
  matches: number[];
  setMatches: (value: number[]) => void;
  numbersWithDash: string;
  setNumbersWithDash: (value: string) => void;
  processedNumbers: string[];
  setProcessedNumbers: (value: string[]) => void;
}

const StateContext = createContext<StateContextProps | undefined>(undefined);

export const StateProvider = ({ children }: { children: ReactNode }) => {
  const [clientId, setClientId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [daysCount, setDaysCount] = useState(35);
  const [nmidList, setNmidList] = useState("");

  // Новые состояния
  const [array1, setArray1] = useState<string>("");
  const [array2, setArray2] = useState<string>("");
  const [matches, setMatches] = useState<number[]>([]);
  const [numbersWithDash, setNumbersWithDash] = useState<string>("");
  const [processedNumbers, setProcessedNumbers] = useState<string[]>([]);

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

        // Новые состояния
        array1,
        setArray1,
        array2,
        setArray2,
        matches,
        setMatches,
        numbersWithDash,
        setNumbersWithDash,
        processedNumbers,
        setProcessedNumbers,
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
