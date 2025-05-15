import React, { createContext, useContext, useState } from 'react';

// Define the League interface again for consistency
export interface League {
  id: string;
  name: string;
  type: string;
}

interface LeagueContextProps {
  leagues: League[];
  addLeague: (league: Omit<League, 'id'>) => void;
}

const LeagueContext = createContext<LeagueContextProps | undefined>(undefined);

export const LeagueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [leagues, setLeagues] = useState<League[]>([]);

  const addLeague = (newLeagueData: Omit<League, 'id'>) => {
    const newLeague: League = { id: Math.random().toString(36).substring(7), ...newLeagueData };
    setLeagues([...leagues, newLeague]);
  };

  return (
    <LeagueContext.Provider value={{ leagues, addLeague }}>
      {children}
    </LeagueContext.Provider>
  );
};

export const useLeagueContext = () => {
  const context = useContext(LeagueContext);
  if (!context) {
    throw new Error('useLeagueContext must be used within a LeagueProvider');
  }
  return context;
};