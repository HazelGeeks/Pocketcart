import React from "react";
import type { FoodScanResult } from "../services/foodScan";
import { type FoodScanProductLink, findFoodScanProductLink } from "../services/foodScanProductLink";

export default function useFoodScanProductLink({
  barcode,
  result,
}: {
  barcode: string | null;
  result: FoodScanResult | null;
}) {
  const [link, setLink] = React.useState<FoodScanProductLink | null>(null);
  const [loading, setLoading] = React.useState(false);
  const requestIdRef = React.useRef(0);

  React.useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLink(null);
    if (!result) {
      setLoading(false);
      return;
    }

    setLoading(true);
    void findFoodScanProductLink({ barcode, result })
      .then(({ data }) => {
        if (requestIdRef.current !== requestId) return;
        setLink(data);
        setLoading(false);
      })
      .catch(() => {
        if (requestIdRef.current !== requestId) return;
        setLink(null);
        setLoading(false);
      });
  }, [barcode, result]);

  return { link, loading };
}
