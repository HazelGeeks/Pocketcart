type CartGesture = { dx: number; dy: number; numberActiveTouches?: number };

export function shouldStartCartSwipe({ dx, dy, numberActiveTouches = 1 }: CartGesture) {
  return numberActiveTouches === 1 && Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.5;
}

export function getCartSwipeAction({ dx, dy }: CartGesture): "purchase" | "delete" | null {
  if (Math.abs(dx) < 88 || Math.abs(dx) <= Math.abs(dy) * 1.5) return null;
  return dx > 0 ? "purchase" : "delete";
}
