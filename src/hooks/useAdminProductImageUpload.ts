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

export default function useAdminProductImageUpload({
  setProductThumb,
  setProductImageUploading,
  setNotice,
  uploadProductImageMutation,
}: Params) {
  return React.useCallback(async () => {
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
      void (async () => {
        setProductImageUploading(true);
        try {
          const data = await uploadProductImageMutation.mutateAsync({
            file: selected,
            fileName: selected.name,
            contentType: selected.type,
          });
          if (!data) {
            setNotice("Image upload failed.");
            return;
          }
          setProductThumb(data.publicUrl);
          setNotice("Image uploaded to Supabase Storage.");
        } catch (error) {
          setNotice(error instanceof Error ? error.message : "Image upload failed.");
        } finally {
          setProductImageUploading(false);
        }
      })();
    };
    input.click();
  }, [setNotice, setProductImageUploading, setProductThumb, uploadProductImageMutation]);
}
