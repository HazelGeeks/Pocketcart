import React from "react";
import { listProducts, type MarketProduct } from "../services/marketData";

export function useShoppingProductSearch(query: string) {
  const [state, setState] = React.useState<{
    query: string;
    products: MarketProduct[];
    loading: boolean;
    error: string | null;
  }>({ query: "", products: [], loading: false, error: null });
  const search = query.trim();
  React.useEffect(() => {
    if (search.length < 2) return;
    let active = true;
    const timer = setTimeout(() => {
      setState({ query: search, products: [], loading: true, error: null });
      void listProducts({ search, onSaleOnly: false, includePriceSummaries: false })
        .then(({ data, error }) => {
          if (active) setState({ query: search, products: data.slice(0, 8), loading: false, error });
        })
        .catch(() => {
          if (active) setState({ query: search, products: [], loading: false, error: "Couldn't search products. Try again or add a custom item." });
        });
    }, 300);
    return () => { active = false; clearTimeout(timer); };
  }, [search]);
  if (search.length < 2) return { products: [], loading: false, error: null };
  return state.query === search ? state : { products: [], loading: true, error: null };
}
