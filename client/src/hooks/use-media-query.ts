import { useState, useEffect } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    
    // Initial check
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    
    // Setup listener
    const listener = () => {
      setMatches(media.matches);
    };
    
    // Modern way to add the listener
    media.addEventListener("change", listener);
    
    // Cleanup function
    return () => {
      media.removeEventListener("change", listener);
    };
  }, [matches, query]);

  return matches;
}
