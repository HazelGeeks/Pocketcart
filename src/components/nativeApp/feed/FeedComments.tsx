import React from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { QueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { randomUUID } from "expo-crypto";
import X from "lucide-react-native/icons/x";
import {
  FEED_CAPTION_LIMIT,
  type FeedCursor,
  type FeedPost,
  loadComments,
  publishComment,
} from "../../../services/communityFeed";
import { marketingPalette as C } from "../../../shared/design/palette";
import { F } from "../../../screens/nativeAppStyles/fonts";

export function FeedComments({
  post,
  client,
  signedIn,
  byline,
  authOpen,
  close,
  signIn,
}: {
  post: FeedPost;
  client: QueryClient;
  signedIn: boolean;
  byline: string;
  authOpen: boolean;
  close: () => void;
  signIn: () => void;
}) {
  const [text, setText] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const lock = React.useRef(false);
  const draftId = React.useRef("");
  const q = useInfiniteQuery(
    {
      queryKey: ["feed-comments", post.id],
      initialPageParam: null as FeedCursor | null,
      queryFn: ({ pageParam }) => loadComments(post.id, pageParam),
      getNextPageParam: (p) => p.next,
    },
    client,
  );
  const rows = q.data?.pages.flatMap((p) => p.rows) ?? [];
  const list = React.useRef<FlatList<(typeof rows)[number]>>(null);
  async function send() {
    if (!signedIn) {
      signIn();
      return;
    }
    if (lock.current || !text.trim()) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      draftId.current ||= randomUUID();
      await publishComment(post.id, draftId.current, text);
      draftId.current = "";
      setText("");
      void client.invalidateQueries({ queryKey: ["community-feed"] });
      await q.refetch();
      list.current?.scrollToOffset({ offset: 0, animated: false });
    } catch {
      setError("Could not post your comment. Try again.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <Modal
      transparent
      visible={!authOpen}
      presentationStyle="overFullScreen"
      animationType="fade"
      onRequestClose={() => {
        if (!lock.current) close();
      }}
    >
      <SafeAreaView style={s.back}>
        <KeyboardAvoidingView
          style={s.center}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View accessibilityViewIsModal style={s.card}>
            <View style={s.header}>
              <Text accessibilityRole="header" style={s.title}>
                Comments
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close comments"
                onPress={close}
                disabled={busy}
                style={s.button}
              >
                <X size={21} color={C.text} />
              </Pressable>
            </View>
            {post.caption ? (
              <Text style={s.context} numberOfLines={2}>
                {post.caption}
              </Text>
            ) : null}
            <FlatList
              ref={list}
              style={s.list}
              data={rows}
              keyExtractor={(item) => item.id}
              onEndReached={() => {
                if (q.hasNextPage && !q.isFetching && !q.isError) void q.fetchNextPage();
              }}
              onEndReachedThreshold={0.35}
              ListEmptyComponent={
                q.isPending ? (
                  <ActivityIndicator />
                ) : q.isError ? null : (
                  <Text style={s.muted}>Be the first to comment.</Text>
                )
              }
              ListFooterComponent={
                q.isError ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      if (q.isFetchNextPageError) void q.fetchNextPage();
                      else void q.refetch();
                    }}
                  >
                    <Text style={s.muted}>Could not load comments. Try again.</Text>
                  </Pressable>
                ) : q.isFetchingNextPage ? (
                  <ActivityIndicator />
                ) : null
              }
              renderItem={({ item }) => (
                <View style={s.row}>
                  <Text style={s.author}>{item.author_label}</Text>
                  <Text style={s.body}>{item.body}</Text>
                </View>
              )}
            />
            {error ? (
              <Text accessibilityRole="alert" style={s.muted}>
                {error}
              </Text>
            ) : null}
            {signedIn ? (
              <>
                <Text style={s.muted}>
                  {byline ? "Commenting as " + byline : "Your name is shown on comments."}
                </Text>
                <View style={s.write}>
                  <TextInput
                    multiline
                    editable={!busy}
                    value={text}
                    placeholder="Add a comment…"
                    placeholderTextColor={C.textMuted}
                    accessibilityLabel="Comment text"
                    style={s.input}
                    onChangeText={(v) => {
                      draftId.current = "";
                      setText(Array.from(v).slice(0, FEED_CAPTION_LIMIT).join(""));
                    }}
                  />
                  <Pressable
                    accessibilityRole="button"
                    disabled={busy || !text.trim()}
                    onPress={() => void send()}
                    style={s.button}
                  >
                    <Text style={[s.send, (busy || !text.trim()) && { opacity: 0.45 }]}>
                      {busy ? "Sending…" : "Send"}
                    </Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <Pressable accessibilityRole="button" onPress={signIn} style={s.button}>
                <Text style={s.send}>Sign in to comment</Text>
              </Pressable>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
const s = StyleSheet.create({
  back: { flex: 1, backgroundColor: "rgba(12,24,18,0.42)" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 18 },
  card: {
    width: "100%",
    maxWidth: 460,
    height: "75%",
    maxHeight: 540,
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 16,
    gap: 8,
  },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontFamily: F.extraBold, fontSize: 19, color: C.text },
  button: { minHeight: 44, minWidth: 44, justifyContent: "center", alignItems: "center" },
  context: { color: C.textMuted, fontFamily: F.regular, paddingBottom: 8 },
  list: { flex: 1 },
  muted: { color: C.textMuted, fontSize: 13 },
  author: { fontFamily: F.bold, color: C.text },
  body: { color: C.text, fontFamily: F.regular, fontSize: 16 },
  row: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: C.line,
    gap: 3,
    paddingVertical: 10,
  },
  write: { flexDirection: "row", gap: 5, alignItems: "center" },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 90,
    fontSize: 16,
    color: C.text,
    backgroundColor: C.primaryGhost,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  send: { fontFamily: F.bold, color: C.primaryDeep },
});
