import React from "react";
import { searchMapLocations, type MapSearchLocation } from "../services/mapLocationSearch";

export default function useMapLocationSearch() {
  const [results, setResults] = React.useState<MapSearchLocation[]>([]);
  const [selected, setSelected] = React.useState<MapSearchLocation | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const request = React.useRef(0);
  const cancel = React.useCallback(() => {
    request.current += 1;
    setLoading(false);
    setResults([]);
    setMessage(null);
  }, []);
  React.useEffect(() => () => { request.current += 1; }, []);
  const search = React.useCallback(async (text: string) => {
    const id = ++request.current;
    setResults([]);
    setMessage(null);
    if (!text.trim()) { setLoading(false); return; }
    setLoading(true);
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const places = await Promise.race([
        searchMapLocations(text),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error("Location search timed out. Please try again.")), 15000);
        }),
      ]);
      if (id !== request.current) return;
      setResults(places);
      if (!places.length) setMessage("Location not found. Try a full address, city and province, or postal code.");
    } catch (error) {
      if (id === request.current) setMessage(error instanceof Error ? error.message : "Location search failed. Please try again.");
    } finally {
      clearTimeout(timer);
      if (id === request.current) setLoading(false);
    }
  }, []);
  return { results, selected, setSelected, loading, message, search, cancel };
}
