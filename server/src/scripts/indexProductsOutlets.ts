import "dotenv/config";

import { createServices } from "../services/index.js";

async function main() {
  const services = createServices();
  const { productService, embeddingService } = services;

  console.log("[Indexer] Fetching products with outlets...");
  const rows = await productService.getProductsOutlets();
  console.log(`[Indexer] Found ${rows.length} product-outlet rows`);

  if (!rows.length) {
    console.log("[Indexer] No rows to index. Exiting.");
    return;
  }

  console.log("[Indexer] Upserting to Pinecone...");
  await embeddingService.upsertProductWithOutletRows(rows);
  console.log("[Indexer] Done.");
}

main().catch((err) => {
  console.error("[Indexer] Failed:", err);
  process.exitCode = 1;
});
