function editDistance(left: string, right: string): number {
  if (left === right) return 0;
  if (!left) return right.length;
  if (!right) return left.length;

  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex];
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1),
      );
    }
    previous.splice(0, previous.length, ...current);
  }
  return previous[right.length];
}

export function productNamesAreNear(left: string, right: string): boolean {
  if (!left || !right || left === right) return false;
  const longest = Math.max(left.length, right.length);
  if (longest < 6) return false;
  if (Math.abs(left.length - right.length) > 2) return false;
  const distance = editDistance(left, right);
  return distance <= 2 && distance / longest <= 0.2;
}
