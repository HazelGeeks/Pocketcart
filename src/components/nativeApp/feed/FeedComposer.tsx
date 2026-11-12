import React from "react";
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { randomUUID } from "expo-crypto";
import { launchImageLibraryAsync } from "expo-image-picker";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import {
  FEED_CAPTION_LIMIT,
  type PostDraft,
  publishPost,
  validateDraft,
} from "../../../services/communityFeed";
import Camera from "lucide-react-native/icons/camera";
import { marketingPalette as C } from "../../../shared/design/palette";
import { rs } from "../receipts/receiptStyles";

export function FeedComposer({
  byline,
  authOpen,
  onSignIn,
  userId,
  close,
  onPublished,
}: {
  byline: string;
  authOpen: boolean;
  onSignIn: () => void;
  userId: string | null;
  close: () => void;
  onPublished: () => void;
}) {
  const [draft, setDraft] = React.useState<PostDraft>(() => ({
    id: randomUUID(),
    saleId: null,
    anonymous: false,
    caption: "",
    photo: null,
  }));
  const [busy, setBusy] = React.useState<"photo" | "publish" | null>(null);
  const [error, setError] = React.useState("");
  const locked = React.useRef(false);
  const postDisabled = !!busy || !!validateDraft(draft);
  async function choosePhoto() {
    if (locked.current) return;
    locked.current = true;
    setBusy("photo");
    setError("");
    try {
      const result = await launchImageLibraryAsync({ mediaTypes: ["images"] });
      if (result.canceled) return;
      const asset = result.assets[0];
      const context = ImageManipulator.manipulate(asset.uri);
      try {
        if (Math.max(asset.width, asset.height) > 1600)
          context.resize(asset.width >= asset.height ? { width: 1600 } : { height: 1600 });
        const image = await context.renderAsync();
        try {
          const saved = await image.saveAsync({
            format: SaveFormat.JPEG,
            compress: 0.78,
            base64: true,
          });
          if (!saved.base64) throw new Error("No image data");
          const photo = {
            id: randomUUID(),
            uri: saved.uri,
            base64: saved.base64,
          };
          setDraft((current) => ({ ...current, photo }));
        } finally {
          image.release();
        }
      } finally {
        context.release();
      }
    } catch {
      setError("Could not open that photo. Please choose another image.");
    } finally {
      locked.current = false;
      setBusy(null);
    }
  }
  async function submit() {
    if (locked.current) return;
    const invalid = validateDraft(draft);
    if (invalid) {
      setError(invalid);
      return;
    }
    if (!userId) {
      onSignIn();
      return;
    }
    locked.current = true;
    setError("");
    setBusy("publish");
    try {
      await publishPost(userId, draft);
      onPublished();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not publish. Please try again.");
    } finally {
      locked.current = false;
      setBusy(null);
    }
  }
  return (
    <Modal
      visible={!authOpen}
      transparent
      presentationStyle="overFullScreen"
      animationType="fade"
      onRequestClose={() => {
        if (!locked.current) close();
      }}
    >
      <SafeAreaView style={styles.backdrop}>
        <KeyboardAvoidingView
          style={styles.center}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View accessibilityViewIsModal style={styles.dialog}>
            <View style={styles.bar}>
              <Pressable
                accessibilityRole="button"
                disabled={!!busy}
                onPress={close}
                style={styles.tool}
              >
                <Text style={styles.cancel}>Cancel</Text>
              </Pressable>
              <Text accessibilityRole="header" style={styles.title}>
                New post
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: postDisabled }}
                disabled={postDisabled}
                onPress={() => void submit()}
                style={styles.tool}
              >
                <View style={[styles.post, postDisabled && { opacity: 0.45 }]}>
                  <Text style={styles.postText}>
                    {busy === "publish" ? "Posting…" : userId ? "Post" : "Sign in to post"}
                  </Text>
                </View>
              </Pressable>
            </View>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              style={styles.scroll}
              contentContainerStyle={styles.content}
            >
              <TextInput
                autoFocus
                multiline
                accessibilityLabel="Post text"
                placeholder="What would you like to share?"
                placeholderTextColor={C.textMuted}
                style={styles.body}
                textAlignVertical="top"
                editable={!busy}
                value={draft.caption}
                onChangeText={(text) => {
                  const caption = Array.from(text).slice(0, FEED_CAPTION_LIMIT).join("");
                  setDraft((current) => ({ ...current, caption }));
                }}
              />
              {draft.photo && (
                <Image
                  accessibilityLabel="Selected photo"
                  source={{ uri: draft.photo.uri }}
                  style={styles.preview}
                  resizeMode="contain"
                />
              )}
              <View style={styles.footer}>
                <Pressable
                  accessibilityRole="button"
                  disabled={!!busy}
                  onPress={() => void choosePhoto()}
                  style={styles.photoAction}
                >
                  <Camera size={18} color={C.primaryDeep} />
                  <Text style={styles.photoLabel}>
                    {busy === "photo" ? "Opening…" : draft.photo ? "Change photo" : "Add photo"}
                  </Text>
                </Pressable>
                {draft.photo && (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Remove photo"
                    style={styles.tool}
                    disabled={!!busy}
                    onPress={() => setDraft((current) => ({ ...current, photo: null }))}
                  >
                    <Text style={styles.remove}>Remove</Text>
                  </Pressable>
                )}
                <Text
                  accessibilityLabel={`${Array.from(draft.caption).length} of ${FEED_CAPTION_LIMIT} characters`}
                  style={styles.count}
                >
                  {Array.from(draft.caption).length}/{FEED_CAPTION_LIMIT}
                </Text>
              </View>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityLabel="Post anonymously"
                accessibilityState={{ checked: draft.anonymous }}
                disabled={!!busy}
                style={{ flexDirection: "row", alignItems: "center", gap: 9, minHeight: 44 }}
                onPress={() => setDraft((d) => ({ ...d, anonymous: !d.anonymous }))}
              >
                <View
                  style={{
                    width: 21,
                    height: 21,
                    borderRadius: 5,
                    borderWidth: 1,
                    borderColor: C.primaryDeep,
                    backgroundColor: draft.anonymous ? C.primaryDeep : C.white,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {draft.anonymous ? (
                    <Text style={{ color: C.white, fontWeight: "bold" }}>✓</Text>
                  ) : null}
                </View>
                <Text style={styles.photoLabel}>Post anonymously</Text>
              </Pressable>
              <Text style={rs.muted}>
                {draft.anonymous
                  ? "Posted as Anonymous"
                  : byline
                    ? "Posting as " + byline
                    : "Your profile name will appear on this post."}
              </Text>
              {error ? (
                <Text accessibilityRole="alert" style={rs.error}>
                  {error}
                </Text>
              ) : null}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  body: { minHeight: 110, color: C.text, fontSize: 18, lineHeight: 25, paddingVertical: 8 },
  backdrop: { flex: 1, backgroundColor: "rgba(12, 24, 18, 0.42)" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 18 },
  dialog: {
    backgroundColor: C.white,
    borderRadius: 20,
    width: "100%",
    maxWidth: 460,
    maxHeight: "94%",
    overflow: "hidden",
  },
  title: { fontSize: 16, fontWeight: "700", color: C.text },
  scroll: { flexGrow: 0, flexShrink: 1 },
  content: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  footer: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 12 },
  count: { marginLeft: "auto", color: C.textMuted, fontSize: 13, fontVariant: ["tabular-nums"] },
  remove: { color: C.textMuted, fontSize: 14 },
  preview: { width: "100%", height: 150, borderRadius: 10, backgroundColor: C.primaryGhost },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.line,
  },
  tool: { minHeight: 48, justifyContent: "center" },
  cancel: { color: C.text, fontSize: 16 },
  post: {
    backgroundColor: C.primaryDeep,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 6,
  },
  postText: { color: C.white, fontSize: 15, fontWeight: "700" },
  photoAction: {
    alignSelf: "flex-start",
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  photoLabel: { color: C.primaryDeep, fontSize: 15, fontWeight: "600" },
});
