const colorPalette = [
  { hex: "#FF6B6B", name: "Coral Red" },
  { hex: "#4ECDC4", name: "Medium Turquoise" },
  { hex: "#45B7D1", name: "Ocean Blue" },
  { hex: "#96CEB4", name: "Sage Green" },
  { hex: "#FFBE0B", name: "Marigold Yellow" },
  { hex: "#9B5DE5", name: "Bright Purple" },
  { hex: "#F15BB5", name: "Hot Pink" },
  { hex: "#00BBF9", name: "Azure Blue" },
  { hex: "#FB5607", name: "Bright Orange" },
  { hex: "#38B000", name: "Fresh Green" },
  { hex: "#FF85A1", name: "Rose Pink" },
  { hex: "#7209B7", name: "Deep Purple" },
  { hex: "#3A86FF", name: "Royal Blue" },
  { hex: "#8AC926", name: "Lime Green" },
  { hex: "#FFD93D", name: "Sunny Yellow" },
  { hex: "#FF4D6D", name: "Strawberry Red" },
  { hex: "#4CC9F0", name: "Sky Blue" },
  { hex: "#95D5B2", name: "Mint Green" },
  { hex: "#FF9E00", name: "Golden Orange" },
  { hex: "#8338EC", name: "Electric Purple" },
];

export function getColorFromString(inputString: string) {
  // Create multiple hash values from different parts of the string
  const len = inputString.length;
  let hash1 = 0;
  let hash2 = 0;

  // First half of string
  for (let i = 0; i < len / 2; i++) {
    hash1 = (hash1 << 5) - hash1 + inputString.charCodeAt(i);
    hash1 = hash1 & hash1;
  }

  // Second half of string
  for (let i = Math.floor(len / 2); i < len; i++) {
    hash2 = (hash2 << 5) - hash2 + inputString.charCodeAt(i);
    hash2 = hash2 & hash2;
  }

  // Combine hashes with string length and character positions
  const combinedHash =
    (hash1 * hash2 * len +
      inputString.charCodeAt(0) +
      inputString.charCodeAt(len - 1)) >>>
    0;

  const index = combinedHash % colorPalette.length;
  return colorPalette[index].hex;
}
