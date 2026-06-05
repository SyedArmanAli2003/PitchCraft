import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

interface IdeaContextValue {
  idea: string;
  setIdea: (idea: string) => void;
}

const IdeaContext = createContext<IdeaContextValue | null>(null);

export function IdeaProvider({ children }: { children: ReactNode }) {
  const [idea, setIdeaState] = useState<string>(() => {
    return localStorage.getItem("pitchcraft_idea") ?? "";
  });

  const setIdea = (value: string) => {
    setIdeaState(value);
    localStorage.setItem("pitchcraft_idea", value);
  };

  return (
    <IdeaContext.Provider value={{ idea, setIdea }}>
      {children}
    </IdeaContext.Provider>
  );
}

export function useIdea(): IdeaContextValue {
  const ctx = useContext(IdeaContext);
  if (!ctx) throw new Error("useIdea must be used inside IdeaProvider");
  return ctx;
}
