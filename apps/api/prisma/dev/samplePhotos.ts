// Placeholder listing photos (Unsplash) used by the seed and the dev photo fix.
// Sample content only — replace with real landlord photos before launch.

const ids = [
  "1600585154340-be6161a56a0c", "1560448204-e02f11c3d0e2", "1502672260266-1c1ef2d93688",
  "1522708323590-d24dbb6b0267", "1493809842364-78817add7ffb", "1484154218962-a197022b5858",
  "1505691938895-1758d7feb511", "1600596542815-ffad4c1539a9", "1568605114967-8130f3a36994",
  "1512917774080-9991f1c4c750", "1586023492125-27b2c045efd7", "1600607687939-ce8a6c25118c",
  "1564013799919-ab600027ffc6", "1570129477492-45c003edd2be", "1554995207-c18c203602cb",
  "1513694203232-719a280e022f", "1600210492486-724fe5c67fb0", "1615874959474-d609969a20ed",
];

export const SAMPLE_PHOTO_URLS = ids.map((id) => `https://images.unsplash.com/photo-${id}`);

/** A deterministic set of `count` photos for listing number `index`. */
export function samplePhotosFor(index: number, count: number): string[] {
  return Array.from({ length: count }, (_, i) => SAMPLE_PHOTO_URLS[(index * 3 + i) % SAMPLE_PHOTO_URLS.length]);
}
