export function ratingColor(rating) {
  if (rating >= 3.8) return "#1D9E75";
  if (rating >= 3.0) return "#EF9F27";
  return "#E24B4A";
}

export function povertyOpacity(rate) {
  return Math.min(rate * 0.5, 0.25);
}
