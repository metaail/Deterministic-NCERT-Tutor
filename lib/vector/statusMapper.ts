export function mapToVectorStatus(chunkStatus: string): "published" | "draft" {
  if (chunkStatus === "published") {
    return "published";
  }
  return "draft";
}
