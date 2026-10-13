import { useEffect, useState } from "react";

/** False during prerender and the first client render; true once mounted. */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
