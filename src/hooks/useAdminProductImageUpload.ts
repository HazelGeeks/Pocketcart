import React from "react";
import { Platform } from "react-native";

type Mutation<TParams, TResult> = {
  mutateAsync: (params: TParams) => Promise<TResult>;
};

type Params = {
  setProductThumb: (value: string) => void;
  setProductImageUploading: (value: boolean) => void;
  setNotice: (value: string | null) => void;
  uploadProductImageMutation: Mutation<{ file: Blob; fileName?: string; contentType?: string }, { publicUrl: string } | null>;
};

export function extensionFromType(contentType: string): string {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  return "jpg";
}

function imageFileFromClipboardData(data: DataTransfer | null): File | null {
  if (!data) return null;
  for (const file of Array.from(data.files ?? [])) {
    if (file.type.startsWith("image/")) return file;
  }
  for (const item of Array.from(data.items ?? [])) {
    if (item.kind !== "file" || !item.type.startsWith("image/")) continue;
    const file = item.getAsFile();
    if (file) return file;
  }
  return null;
}

function imageUrlFromClipboardData(data: DataTransfer | null): string | null {
  const text = data?.getData("text/plain")?.trim() ?? "";
  if (!/^https?:\/\/\S+/i.test(text)) return null;
  if (/\.(png|jpe?g|webp|gif)(\?.*)?$/i.test(text)) return text;
  return text;
}

export default function useAdminProductImageUpload({
  setProductThumb,
  setProductImageUploading,
  setNotice,
  uploadProductImageMutation,
}: Params) {
  const uploadImageBlob = React.useCallback(
    async (params: { file: Blob; fileName?: string; contentType?: string; successMessage: string }) => {
      setProductImageUploading(true);
      try {
        const data = await uploadProductImageMutation.mutateAsync({
          file: params.file,
          fileName: params.fileName,
          contentType: params.contentType,
        });
        if (!data) {
          setNotice("Image upload failed.");
          return;
        }
        setProductThumb(data.publicUrl);
        setNotice(params.successMessage);
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "Image upload failed.");
      } finally {
        setProductImageUploading(false);
      }
    },
    [setNotice, setProductImageUploading, setProductThumb, uploadProductImageMutation],
  );

  const handleUploadProductImage = React.useCallback(async () => {
    if (Platform.OS !== "web") {
      setNotice("Image file picker is currently available on web admin. On native app, paste image URL.");
      return;
    }
    const doc = (globalThis as { document?: any }).document;
    if (!doc || typeof doc.createElement !== "function") {
      setNotice("Image picker is not available in this environment.");
      return;
    }

    const input = doc.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/webp,image/gif";
    input.multiple = false;
    input.onchange = () => {
      const selected = input.files?.[0];
      if (!selected) return;
      void uploadImageBlob({
        file: selected,
        fileName: selected.name,
        contentType: selected.type,
        successMessage: "Image uploaded to Supabase Storage.",
      });
    };
    input.click();
  }, [setNotice, uploadImageBlob]);

  const handlePasteProductImage = React.useCallback(async () => {
    if (Platform.OS !== "web") {
      setNotice("Clipboard image paste is currently available on web admin.");
      return;
    }

    const clipboard = (globalThis as {
      navigator?: Navigator & {
        clipboard?: Clipboard & {
          read?: () => Promise<ClipboardItem[]>;
        };
      };
    }).navigator?.clipboard;
    if (!clipboard?.read) {
      setNotice("This browser does not support image paste. Use Upload image instead.");
      return;
    }

    try {
      const items = await clipboard.read();
      for (const item of items) {
        const imageType = item.types.find((type) => type.startsWith("image/"));
        if (!imageType) continue;
        const blob = await item.getType(imageType);
        await uploadImageBlob({
          file: blob,
          fileName: `pasted-product-image-${Date.now()}.${extensionFromType(imageType)}`,
          contentType: imageType,
          successMessage: "Pasted image uploaded to Supabase Storage.",
        });
        return;
      }
      setNotice("Clipboard does not contain an image. Copy an image, then try Paste image.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not read image from clipboard.");
    }
  }, [setNotice, uploadImageBlob]);

  const handleProductImagePasteEvent = React.useCallback(
    (event: ClipboardEvent): boolean => {
      if (Platform.OS !== "web") return false;
      const file = imageFileFromClipboardData(event.clipboardData);
      if (file) {
        event.preventDefault();
        void uploadImageBlob({
          file,
          fileName: file.name || `pasted-product-image-${Date.now()}.${extensionFromType(file.type)}`,
          contentType: file.type,
          successMessage: "Pasted image uploaded to Supabase Storage.",
        });
        return true;
      }

      const imageUrl = imageUrlFromClipboardData(event.clipboardData);
      if (imageUrl) {
        event.preventDefault();
        setProductThumb(imageUrl);
        setNotice("Image URL pasted. Save the product to keep it.");
        return true;
      }

      return false;
    },
    [setNotice, setProductThumb, uploadImageBlob],
  );

  return {
    handlePasteProductImage,
    handleProductImagePasteEvent,
    handleUploadProductImage,
  };
}
