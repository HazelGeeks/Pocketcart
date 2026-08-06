import React from "react";
import type useNativeAccount from "./useNativeAccount";
import type useNativeCatalog from "./useNativeCatalog";
import type useNativeSaleAlerts from "./useNativeSaleAlerts";
import type useNativeShellState from "./useNativeShellState";
import type useNativeShoppingPlan from "./useNativeShoppingPlan";
import type { MarketProduct } from "../services/marketData";
import { addWatchlistItem } from "../services/watchlist";
import { isSignInRequiredMessage } from "../utils/serviceErrors";
import { productDisplayName } from "../utils/productNames";

type Options = {
  account: ReturnType<typeof useNativeAccount>;
  alerts: ReturnType<typeof useNativeSaleAlerts>;
  catalog: ReturnType<typeof useNativeCatalog>;
  shell: ReturnType<typeof useNativeShellState>;
  shopping: ReturnType<typeof useNativeShoppingPlan>;
};

export default function useNativeProductActions({
  account,
  alerts,
  catalog,
  shell,
  shopping,
}: Options) {
  const addProductToWatchlist = React.useCallback(
    async (product: MarketProduct) => {
      catalog.setAddSubmitting(true);
      const { error } = await addWatchlistItem({
        productId: product.id,
        storeId: product.best_store_id,
        name: productDisplayName(product),
        store: product.best_store_name ?? "Unknown store",
      });
      catalog.setAddSubmitting(false);

      if (error) {
        if (isSignInRequiredMessage(error)) {
          catalog.setActionMessage(null);
          shell.openMore();
          account.openSignIn();
          catalog.setRoute("catalog");
          shell.showToast("Sign in to enable sale alerts.");
          return;
        }
        catalog.setActionMessage(error);
        return;
      }

      catalog.setActionMessage(null);
      await alerts.loadWatchlist(true);
      shell.showToast("Sale alert enabled.");
    },
    [account, alerts, catalog, shell],
  );

  const addSelectedToWatchlist = React.useCallback(async () => {
    if (catalog.selectedProduct) {
      await addProductToWatchlist(catalog.selectedProduct);
    }
  }, [addProductToWatchlist, catalog.selectedProduct]);

  const addProductToShoppingList = React.useCallback(
    (product: MarketProduct) => {
      const alreadyAdded = shopping.productIds.has(product.id);
      shopping.addProduct(product);
      shell.showToast(
        alreadyAdded ? "Shopping list quantity increased." : "Added to shopping list.",
      );
    },
    [shell, shopping],
  );

  const addShoppingProductFromHome = React.useCallback(
    (productId: string) => {
      const product = catalog.filteredProducts.find((item) => item.id === productId);
      if (product) addProductToShoppingList(product);
    },
    [addProductToShoppingList, catalog.filteredProducts],
  );

  return {
    addProductToShoppingList,
    addSelectedToWatchlist,
    addShoppingProductFromHome,
  };
}
