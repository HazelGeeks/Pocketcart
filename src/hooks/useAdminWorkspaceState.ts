import React from "react";
import type { AdminStore } from "../services/adminBackoffice";
import { useAdminStore } from "../state/adminStore";
import type { StoreImportPreviewRow } from "../utils/adminValidation";
import {
  createStorePriceSet,
  type StorePriceSetInput,
} from "../utils/adminScreenHelpers";

export default function useAdminWorkspaceState() {
  const [authEmail, setAuthEmail] = React.useState("");
  const [authPassword, setAuthPassword] = React.useState("");
  const [notice, setNotice] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [deletingKey, setDeletingKey] = React.useState<string | null>(null);
  const [resolvingReviewId, setResolvingReviewId] = React.useState<string | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);

  const [productName, setProductName] = React.useState("");
  const [productEnglishName, setProductEnglishName] = React.useState("");
  const [productBrand, setProductBrand] = React.useState("");
  const [productGtin, setProductGtin] = React.useState("");
  const [productUnit, setProductUnit] = React.useState("");
  const [productCategory, setProductCategory] = React.useState("");
  const [productCategoryCustom, setProductCategoryCustom] = React.useState("");
  const [productThumb, setProductThumb] = React.useState("");
  const [productStorePriceSets, setProductStorePriceSets] = React.useState<StorePriceSetInput[]>([createStorePriceSet()]);
  const [productModalOpen, setProductModalOpen] = React.useState(false);
  const [editingProductId, setEditingProductId] = React.useState<string | null>(null);
  const [productImageUploading, setProductImageUploading] = React.useState(false);

  const [editingStoreId, setEditingStoreId] = React.useState<string | null>(null);
  const [storeModalOpen, setStoreModalOpen] = React.useState(false);
  const [storeBrand, setStoreBrand] = React.useState("");
  const [storeName, setStoreName] = React.useState("");
  const [storeLatitude, setStoreLatitude] = React.useState("");
  const [storeLongitude, setStoreLongitude] = React.useState("");
  const [storePriceNote, setStorePriceNote] = React.useState("");
  const [storeAddress, setStoreAddress] = React.useState("");
  const [storePlaceId, setStorePlaceId] = React.useState("");
  const [storePhone, setStorePhone] = React.useState("");
  const [storeWebsite, setStoreWebsite] = React.useState("");
  const [storeHours, setStoreHours] = React.useState("");
  const [storeType, setStoreType] = React.useState("grocery");
  const [storeIsActive, setStoreIsActive] = React.useState(true);
  const [storeSearchQuery, setStoreSearchQuery] = React.useState("");
  const [storeBrandFilter, setStoreBrandFilter] = React.useState("all");
  const [storeStatusFilter, setStoreStatusFilter] = React.useState("all");
  const [storeTypeFilter, setStoreTypeFilter] = React.useState("all");
  const [selectedStoreMapId, setSelectedStoreMapId] = React.useState<string | null>(null);
  const [storeImportPreviewRows, setStoreImportPreviewRows] = React.useState<StoreImportPreviewRow[]>([]);
  const [storeImportPreviewOpen, setStoreImportPreviewOpen] = React.useState(false);
  const [storeDeleteCandidate, setStoreDeleteCandidate] = React.useState<AdminStore | null>(null);

  const adminUi = useAdminStore();

  return {
    auth: { authEmail, setAuthEmail, authPassword, setAuthPassword },
    status: { notice, setNotice, submitting, setSubmitting, deletingKey, setDeletingKey, resolvingReviewId, setResolvingReviewId, refreshing, setRefreshing },
    product: {
      productName, setProductName, productEnglishName, setProductEnglishName,
      productBrand, setProductBrand, productGtin, setProductGtin,
      productUnit, setProductUnit, productCategory, setProductCategory,
      productCategoryCustom, setProductCategoryCustom, productThumb, setProductThumb,
      productStorePriceSets, setProductStorePriceSets, productModalOpen, setProductModalOpen,
      editingProductId, setEditingProductId, productImageUploading, setProductImageUploading,
    },
    store: {
      editingStoreId, setEditingStoreId, storeModalOpen, setStoreModalOpen,
      storeBrand, setStoreBrand, storeName, setStoreName,
      storeLatitude, setStoreLatitude, storeLongitude, setStoreLongitude,
      storePriceNote, setStorePriceNote, storeAddress, setStoreAddress,
      storePlaceId, setStorePlaceId, storePhone, setStorePhone,
      storeWebsite, setStoreWebsite, storeHours, setStoreHours,
      storeType, setStoreType, storeIsActive, setStoreIsActive,
      storeSearchQuery, setStoreSearchQuery, storeBrandFilter, setStoreBrandFilter,
      storeStatusFilter, setStoreStatusFilter, storeTypeFilter, setStoreTypeFilter,
      selectedStoreMapId, setSelectedStoreMapId,
      storeImportPreviewRows, setStoreImportPreviewRows,
      storeImportPreviewOpen, setStoreImportPreviewOpen,
      storeDeleteCandidate, setStoreDeleteCandidate,
    },
    adminUi,
  };
}

export type AdminWorkspaceState = ReturnType<typeof useAdminWorkspaceState>;
