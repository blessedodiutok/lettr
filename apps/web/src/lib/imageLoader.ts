// next/image loader: ask the image host for a resized copy instead of routing
// through Next's optimiser. Unknown hosts and local uploads load as-is.

import { optimizeImage } from "@lettr/utils";

export default function imageLoader({ src, width }: { src: string; width: number; quality?: number }): string {
  return optimizeImage(src, width);
}
