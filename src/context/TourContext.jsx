import { createContext, useCallback, useContext, useState } from 'react';

/**
 * Lets any section request the guided tour without prop drilling.
 * A counter is used instead of a boolean so repeated clicks always restart it.
 */
const TourContext = createContext(null);

export function TourProvider({ children }) {
  const [request, setRequest] = useState(0);
  const startTour = useCallback(() => setRequest((value) => value + 1), []);

  return <TourContext.Provider value={{ request, startTour }}>{children}</TourContext.Provider>;
}

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error('useTour must be used inside TourProvider');
  return ctx;
}
