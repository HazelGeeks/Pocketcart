import React from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Platform,
  Share,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { QueryClient, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import Heart from "lucide-react-native/icons/heart";
import MessageCircle from "lucide-react-native/icons/message-circle";
import { FeedComments } from "./FeedComments";
import Ellipsis from "lucide-react-native/icons/ellipsis";
import Share2 from "lucide-react-native/icons/share-2";
import Trash2 from "lucide-react-native/icons/trash-2";
import Images from "lucide-react-native/icons/images";
import Pencil from "lucide-react-native/icons/pencil";
import ArrowLeft from "lucide-react-native/icons/arrow-left";
import { money } from "../../../screens/nativeAppData";
import { F } from "../../../screens/nativeAppStyles/fonts";
import {
  type FeedCursor,
  type FeedPost,
  loadFeed,
  deleteFeedPost,
  myFeedName,
  setFeedLike,
} from "../../../services/communityFeed";
import { marketingPalette as C, semanticPalette } from "../../../shared/design/palette";
import { FeedComposer } from "./FeedComposer";

type PostMenu = { post: FeedPost; top: number; right: number; userId: string | null };
type Anchor = { x: number; y: number; width: number; height: number };

function InlineAction({
  label,
  icon,
  onPress,
  a11y,
  selected,
  disabled,
}: {
  label: string;
  icon?: React.ReactNode;
  a11y?: string;
  selected?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11y}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [s.action, pressed && s.pressed]}
    >
      {icon}
      <Text style={s.actionLabel}>{label}</Text>
    </Pressable>
  );
}

function FeedPostRow({
  post,
  pad,
  onMore,
  onThread,
  onComments,
  onLike,
  likeBusy,
}: {
  post: FeedPost;
  pad: number;
  onMore: (anchor: Anchor) => void;
  onThread: () => void;
  onComments: () => void;
  onLike: () => void;
  likeBusy: boolean;
}) {
  const more = React.useRef<View>(null);
  return (
    <View style={[s.post, { paddingHorizontal: pad }]}>
      <View style={s.body}>
        <View style={s.heading}>
          <View style={s.byline}>
            <Text style={s.author}>{post.author_label}</Text>
            <Text style={s.date}>
              {new Date(post.created_at).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </Text>
          </View>
          <Pressable
            ref={more}
            accessibilityRole="button"
            accessibilityLabel="More post options"
            hitSlop={4}
            onPress={() =>
              more.current?.measureInWindow((x, y, width, height) =>
                onMore({ x, y, width, height }),
              )
            }
            style={({ pressed }) => [s.more, pressed && s.pressed]}
          >
            <Ellipsis size={21} color={C.textMuted} />
          </Pressable>
        </View>
        {post.product && <Text style={s.product}>{post.product}</Text>}
        {(post.price !== null || post.store) && (
          <Text style={s.detail}>
            {post.price !== null && <Text style={s.price}>{money.format(post.price)}</Text>}
            {post.price !== null && post.store ? "  ·  " : ""}
            {post.store}
          </Text>
        )}
        {post.caption ? <Text style={s.caption}>{post.caption}</Text> : null}
        {post.photoUrl ? (
          <Image
            accessible
            accessibilityLabel={post.product ? `Photo of ${post.product}` : "Shopper’s photo"}
            source={{ uri: post.photoUrl }}
            style={s.photo}
          />
        ) : post.photo_path ? (
          <Text style={s.detail}>Photo unavailable</Text>
        ) : null}
        <View style={s.actions}>
          <InlineAction
            label={String(post.comment_count)}
            a11y={`Comments, ${post.comment_count}`}
            icon={<MessageCircle size={17} color={C.primaryDeep} />}
            onPress={onComments}
          />
          <InlineAction
            label={String(post.like_count)}
            a11y={`${post.liked_by_me ? "Unlike" : "Like"}, ${post.like_count}`}
            selected={post.liked_by_me}
            disabled={likeBusy}
            icon={
              <Heart
                size={17}
                color={C.primaryDeep}
                fill={post.liked_by_me ? C.primaryDeep : "none"}
              />
            }
            onPress={onLike}
          />
          {!post.sale_id && post.gotcha_count > 0 && (
            <InlineAction
              label={`${post.gotcha_count} ${post.gotcha_count === 1 ? "Gotcha" : "Gotchas"}`}
              icon={<Images size={17} color={C.primaryDeep} />}
              onPress={onThread}
            />
          )}
        </View>
      </View>
    </View>
  );
}

export function NativeFeedTab({
  userId,
  pad,
  bottomInset,
  onSignIn,
  authOpen,
}: {
  userId: string | null;
  pad: number;
  bottomInset: number;
  onSignIn: () => void;
  authOpen: boolean;
}) {
  const [client] = React.useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: 1 } } }),
  );
  const [thread, setThread] = React.useState<FeedPost | null>(null);
  const [composerOpen, setComposerOpen] = React.useState(false);
  const [comments, setComments] = React.useState<FeedPost | null>(null);
  const lock = React.useRef(new Set<string>());
  const [pending, setPending] = React.useState<Set<string>>(new Set());
  const name = useQuery(
    { queryKey: ["feed-name", userId], queryFn: myFeedName, enabled: !!userId },
    client,
  );
  const byline = userId ? (name.data ?? "") : "";
  const like = async (post: FeedPost) => {
    if (!userId) {
      onSignIn();
      return;
    }
    if (lock.current.has(post.id)) return;
    lock.current.add(post.id);
    setPending(new Set(lock.current));
    try {
      await setFeedLike(post.id, !post.liked_by_me);
      await client.invalidateQueries({ queryKey: ["community-feed"] });
    } catch {
      Alert.alert("Could not update your reaction", "Please try again.");
    } finally {
      lock.current.delete(post.id);
      setPending(new Set(lock.current));
    }
  };
  const root = React.useRef<View>(null);
  const [menu, setMenu] = React.useState<PostMenu | null>(null);
  const activeMenu = menu?.userId === userId ? menu : null;
  const deleting = React.useRef(new Set<string>());
  React.useEffect(() => {
    if (!activeMenu) return;
    const back = BackHandler.addEventListener("hardwareBackPress", () => {
      setMenu(null);
      return true;
    });
    return () => back.remove();
  }, [activeMenu]);
  const openMenu = (post: FeedPost, anchor: Anchor) => {
    root.current?.measureInWindow((x, y, width, height) => {
      const below = anchor.y - y + anchor.height;
      const menuHeight = post.isMine ? 110 : 60;
      const top = below + menuHeight <= height - 8 ? below : Math.max(8, anchor.y - y - menuHeight);
      setMenu({ post, userId, top, right: Math.max(8, x + width - anchor.x - anchor.width) });
    });
  };
  const sharePost = async (post: FeedPost) => {
    setMenu(null);
    const url = "https://pocketcart.app/feed/" + post.id;
    try {
      await Share.share(Platform.OS === "ios" ? { url } : { message: url });
    } catch {
      Alert.alert("Could not share this post", "Please try again.");
    }
  };
  const confirmDelete = (post: FeedPost) => {
    setMenu(null);
    if (!post.isMine || !userId) return;
    Alert.alert("Delete this post?", "Its photo, comments and reactions will also be removed.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          if (deleting.current.has(post.id)) return;
          deleting.current.add(post.id);
          try {
            await deleteFeedPost(post.id);
            await client.invalidateQueries({ queryKey: ["community-feed"] });
          } catch {
            Alert.alert("Could not delete the post", "Please try again.");
          } finally {
            deleting.current.delete(post.id);
          }
        },
      },
    ]);
  };
  const list = React.useRef<FlatList<FeedPost>>(null);
  const feed = useInfiniteQuery(
    {
      queryKey: ["community-feed", userId, { parentId: thread?.id ?? null }],
      initialPageParam: null as FeedCursor | null,
      queryFn: ({ pageParam }) => loadFeed(thread?.id ?? null, pageParam, userId),
      getNextPageParam: (page) => page.next,
    },
    client,
  );
  const posts = feed.data?.pages.flatMap((page) => page.posts) ?? [];
  const scrollToTop = () => list.current?.scrollToOffset({ offset: 0, animated: false });
  const loadMore = () => {
    if (feed.hasNextPage && !feed.isFetching && !feed.isError)
      void feed.fetchNextPage({ cancelRefetch: false });
  };
  return (
    <View ref={root} collapsable={false} style={s.root} onLayout={() => setMenu(null)}>
      <FlatList
        accessibilityElementsHidden={!!activeMenu}
        importantForAccessibility={activeMenu ? "no-hide-descendants" : "auto"}
        ref={list}
        data={posts}
        keyExtractor={(post) => post.id}
        style={s.root}
        contentContainerStyle={{ paddingBottom: 112 + bottomInset }}
        onEndReached={loadMore}
        onEndReachedThreshold={0.55}
        refreshing={feed.isRefetching && !feed.isFetchingNextPage}
        onRefresh={() => void feed.refetch()}
        ListHeaderComponent={
          thread ? (
            <View style={[s.thread, { paddingHorizontal: pad }]}>
              <InlineAction
                icon={<ArrowLeft size={17} color={C.primaryDeep} />}
                label="Back to feed"
                onPress={() => {
                  setThread(null);
                  scrollToTop();
                }}
              />
              <Text accessibilityRole="header" style={s.product}>
                {thread.caption || thread.product || "Original post"}
              </Text>
            </View>
          ) : (
            <View style={[s.compose, { paddingHorizontal: pad }]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Write a post"
                onPress={() => setComposerOpen(true)}
                style={({ pressed }) => [s.prompt, pressed && s.pressed]}
              >
                <View style={s.mark}>
                  <Pencil size={17} color={C.primaryDeep} />
                </View>
                <Text style={s.promptText}>Write a post…</Text>
              </Pressable>
            </View>
          )
        }
        renderItem={({ item }) => (
          <FeedPostRow
            post={item}
            pad={pad}
            likeBusy={pending.has(item.id)}
            onLike={() => void like(item)}
            onComments={() => setComments(item)}
            onMore={(anchor) => openMenu(item, anchor)}
            onThread={() => {
              setThread(item);
              scrollToTop();
            }}
          />
        )}
        ListEmptyComponent={
          feed.isPending ? (
            <ActivityIndicator style={s.empty} accessibilityLabel="Loading posts" />
          ) : feed.isError ? null : (
            <View style={s.empty}>
              <Text style={s.emptyTitle}>{thread ? "No responses yet" : "No posts yet"}</Text>
            </View>
          )
        }
        ListFooterComponent={
          feed.isError ? (
            <View style={s.status}>
              <Text accessibilityRole="alert" style={s.detail}>
                {feed.error.message}
              </Text>
              <InlineAction
                label="Try again"
                onPress={() => {
                  if (feed.isFetchNextPageError) void feed.fetchNextPage({ cancelRefetch: false });
                  else void feed.refetch();
                }}
              />
            </View>
          ) : feed.isFetchingNextPage ? (
            <ActivityIndicator style={s.status} accessibilityLabel="Loading more posts" />
          ) : null
        }
      />
      {activeMenu && (
        <View
          style={StyleSheet.absoluteFill}
          accessibilityViewIsModal
          onAccessibilityEscape={() => setMenu(null)}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            accessibilityRole="button"
            accessibilityLabel="Close post menu"
            onPress={() => setMenu(null)}
          />
          <View style={[s.menu, { top: activeMenu.top, right: activeMenu.right }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Share"
              onPress={() => void sharePost(activeMenu.post)}
              style={s.menuItem}
            >
              <Share2 size={17} color={C.text} />
              <Text style={s.menuLabel}>Share</Text>
            </Pressable>
            {activeMenu.post.isMine && !!userId && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Delete"
                onPress={() => confirmDelete(activeMenu.post)}
                style={s.menuItem}
              >
                <Trash2 size={17} color={semanticPalette.priceIncrease} />
                <Text style={[s.menuLabel, { color: semanticPalette.priceIncrease }]}>Delete</Text>
              </Pressable>
            )}
          </View>
        </View>
      )}
      {comments && (
        <FeedComments
          key={comments.id}
          post={comments}
          client={client}
          signedIn={!!userId}
          byline={byline}
          authOpen={authOpen}
          close={() => setComments(null)}
          signIn={onSignIn}
        />
      )}
      {composerOpen && (
        <FeedComposer
          byline={byline}
          onSignIn={onSignIn}
          authOpen={authOpen}
          userId={userId}
          close={() => setComposerOpen(false)}
          onPublished={() => {
            setComposerOpen(false);
            setThread(null);
            scrollToTop();
            void client.invalidateQueries({ queryKey: ["community-feed"] });
          }}
        />
      )}
    </View>
  );
}

const rule = { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.line };
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.white },
  compose: { ...rule, flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 7 },
  prompt: { flex: 1, minHeight: 48, flexDirection: "row", alignItems: "center", gap: 10 },
  promptText: { flex: 1, fontFamily: F.regular, color: C.textMuted, fontSize: 16 },
  mark: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: C.primaryGhost,
    alignItems: "center",
    justifyContent: "center",
  },
  thread: { ...rule, paddingVertical: 8, alignItems: "flex-start", gap: 3 },
  post: { ...rule, flexDirection: "row", gap: 10, paddingVertical: 14 },
  body: { flex: 1, minWidth: 0, gap: 4 },
  heading: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  more: {
    width: 44,
    height: 44,
    marginTop: -10,
    marginBottom: -10,
    alignItems: "flex-end",
    justifyContent: "center",
    paddingRight: 4,
  },
  menu: {
    position: "absolute",
    width: 158,
    padding: 4,
    borderRadius: 14,
    backgroundColor: C.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.line,
    boxShadow: "0 4px 18px rgba(0,0,0,0.16)",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  menuLabel: { fontFamily: F.bold, fontSize: 15, color: C.text },
  byline: { flex: 1, flexDirection: "row", alignItems: "baseline", flexWrap: "wrap", gap: 8 },
  author: { fontFamily: F.bold, color: C.text, fontSize: 15 },
  date: { fontFamily: F.regular, color: C.textMuted, fontSize: 13 },
  product: { fontFamily: F.extraBold, color: C.text, fontSize: 18 },
  detail: { fontFamily: F.regular, color: C.textMuted, fontSize: 14 },
  price: { fontFamily: F.bold, color: C.primaryDeep },
  caption: { fontFamily: F.regular, color: C.text, fontSize: 16, lineHeight: 22 },
  photo: {
    width: "100%",
    aspectRatio: 4 / 3,
    marginTop: 4,
    borderRadius: 14,
    backgroundColor: C.primaryGhost,
  },
  actions: { flexDirection: "row", flexWrap: "wrap", columnGap: 20 },
  action: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 2,
  },
  actionLabel: { fontFamily: F.bold, color: C.primaryDeep, fontSize: 13 },
  pressed: { opacity: 0.65 },
  empty: { alignItems: "center", paddingVertical: 54, paddingHorizontal: 20, gap: 6 },
  emptyTitle: { fontFamily: F.bold, color: C.text, fontSize: 19, marginTop: 6 },
  status: { alignItems: "center", padding: 14 },
});
