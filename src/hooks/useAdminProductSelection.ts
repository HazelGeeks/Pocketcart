import React from "react";
import type { AdminProduct } from "../services/adminBackoffice";
import {
  buildProductDeleteConfirmation,
  removeDeletedProductIds,
  type ProductDeleteConfirmation,
} from "../utils/productDeleteConfirmation";

type Params = {
  products: AdminProduct[];
  filteredProducts: AdminProduct[];
  visibleProducts: AdminProduct[];
  onDeleteProduct: (productId: string) => Promise<boolean>;
  onDeleteProducts: (productIds: string[]) => Promise<string[]>;
};

export default function useAdminProductSelection({
  products,
  filteredProducts,
  visibleProducts,
  onDeleteProduct,
  onDeleteProducts,
}: Params) {
  const [selectedProductIds, setSelectedProductIds] = React.useState<Set<string>>(new Set());
  const [deleteConfirmation, setDeleteConfirmation] =
    React.useState<ProductDeleteConfirmation | null>(null);
  const [deleteConfirming, setDeleteConfirming] = React.useState(false);
  const deleteConfirmingRef = React.useRef(false);
  const filteredProductIds = React.useMemo(
    () => filteredProducts.map((product) => product.id),
    [filteredProducts],
  );
  const visibleProductIds = React.useMemo(
    () => visibleProducts.map((product) => product.id),
    [visibleProducts],
  );
  const selectedVisibleCount = visibleProductIds.filter((id) =>
    selectedProductIds.has(id)
  ).length;
  const allVisibleSelected =
    visibleProductIds.length > 0 &&
    selectedVisibleCount === visibleProductIds.length;

  React.useEffect(() => {
    setSelectedProductIds((current) => {
      const filtered = new Set(filteredProductIds);
      const next = new Set(Array.from(current).filter((id) => filtered.has(id)));
      return next.size === current.size ? current : next;
    });
  }, [filteredProductIds]);

  const handleToggleProduct = React.useCallback((productId: string) => {
    setSelectedProductIds((current) => {
      const next = new Set(current);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  }, []);

  const handleToggleAllVisible = React.useCallback(() => {
    setSelectedProductIds((current) => {
      const next = new Set(current);
      visibleProductIds.forEach((id) => {
        if (allVisibleSelected) next.delete(id);
        else next.add(id);
      });
      return next;
    });
  }, [allVisibleSelected, visibleProductIds]);

  const handleRequestDeleteProduct = React.useCallback((productId: string) => {
    const product = products.find((item) => item.id === productId);
    if (product) {
      setDeleteConfirmation(buildProductDeleteConfirmation([product], "single"));
    }
  }, [products]);

  const handleRequestDeleteSelected = React.useCallback(() => {
    const selected = products.filter((product) =>
      selectedProductIds.has(product.id)
    );
    setDeleteConfirmation(buildProductDeleteConfirmation(selected, "bulk"));
  }, [products, selectedProductIds]);

  const handleConfirmDelete = React.useCallback(async () => {
    if (!deleteConfirmation || deleteConfirmingRef.current) return;
    deleteConfirmingRef.current = true;
    setDeleteConfirming(true);

    try {
      let deletedIds: string[] = [];
      if (deleteConfirmation.mode === "single") {
        const deleted = await onDeleteProduct(deleteConfirmation.ids[0]);
        if (deleted) deletedIds = deleteConfirmation.ids;
      } else {
        deletedIds = await onDeleteProducts(deleteConfirmation.ids);
      }
      if (deletedIds.length) {
        setSelectedProductIds((current) =>
          removeDeletedProductIds(current, deletedIds)
        );
      }
    } finally {
      deleteConfirmingRef.current = false;
      setDeleteConfirming(false);
      setDeleteConfirmation(null);
    }
  }, [deleteConfirmation, onDeleteProduct, onDeleteProducts]);

  return {
    allVisibleSelected,
    deleteConfirmation,
    deleteConfirming,
    selectedProductIds,
    selectedVisibleCount,
    clearSelection: () => setSelectedProductIds(new Set()),
    dismissDeleteConfirmation: () => setDeleteConfirmation(null),
    handleConfirmDelete,
    handleRequestDeleteProduct,
    handleRequestDeleteSelected,
    handleToggleAllVisible,
    handleToggleProduct,
  };
}
