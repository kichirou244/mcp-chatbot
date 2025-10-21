import { Pinecone } from "@pinecone-database/pinecone";
import { AppError } from "../utils/errors";
import type { IProductWithOutlet } from "../models/Product";
import { GoogleGenAI } from "@google/genai";

export interface ProductOutletMetadata {
  productId: number;
  productName: string;
  description?: string;
  price: number;
  quantity: number;
  outletId: number;
  outletName: string;
  outletAddress?: string;
}

export class EmbeddingService {
  private pinecone: Pinecone;
  private indexName: string;
  private namespace: string = process.env.PINECONE_NAMESPACE || "";
  private genAi: GoogleGenAI;

  constructor() {
    const apiKey = process.env.PINECONE_API_KEY || "";

    this.indexName = process.env.PINECONE_INDEX_NAME || "";

    this.pinecone = new Pinecone({
      apiKey: apiKey,
    });

    this.genAi = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || "",
    });
  }

  private buildDocumentText(meta: ProductOutletMetadata): string {
    const price =
      typeof meta.price === "number"
        ? meta.price.toFixed(2)
        : String(meta.price ?? "");
        
    const desc = meta.description ? ` Description: ${meta.description}.` : "";
    const outletAddr = meta.outletAddress ? `, ${meta.outletAddress}` : "";

    return `Product: ${meta.productName}.${desc} Price: ${price}. Quantity: ${meta.quantity}. Outlet: ${meta.outletName}${outletAddr}.`;
  }

  private async embedTexts(texts: string[]): Promise<number[][]> {
    const result = await this.genAi.models.embedContent({
      model: "gemini-embedding-001",
      contents: texts,
    });

    if (!result.embeddings || !Array.isArray(result.embeddings)) {
      throw new AppError("Embeddings not returned from GoogleGenAI", 500);
    }

    return result.embeddings.map((embedding: any) => {
      if (!embedding?.values) {
        throw new AppError("Embedding values missing in response", 500);
      }
      return embedding.values as number[];
    });
  }

  async upsertProductsOutlets(
    docs: ProductOutletMetadata[],
    batchSize: number = 100
  ): Promise<void> {
    if (!docs?.length) return;
    try {
      const index = this.pinecone
        .index(this.indexName)
        .namespace(this.namespace);
      for (let i = 0; i < docs.length; i += batchSize) {
        const batch = docs.slice(i, i + batchSize);
        const texts = batch.map((m) => this.buildDocumentText(m));

        const embeddings = await this.embedTexts(texts);

        const records: any[] = batch.map((m, idx) => ({
          id: `product-${m.productId}`,
          values: embeddings[idx],
          metadata: m as any,
        }));
        await index.upsert(records as any);
        console.log(
          `[Pinecone RAG] Upserted ${i + batch.length}/${docs.length} vectors`
        );
      }
    } catch (error: any) {
      console.error("[Pinecone Upsert Error]", error);
      throw new AppError(`Failed to upsert to Pinecone: ${error.message}`, 500);
    }
  }

  async indexProductWithOutletRows(rows: IProductWithOutlet[]): Promise<void> {
    const docs: ProductOutletMetadata[] = (rows || []).map((p) => ({
      productId: p.id,
      productName: p.name,
      description: p.description,
      price: p.price,
      quantity: p.quantity,
      outletId: p.outletId,
      outletName: p.outletName,
      outletAddress: p.outletAddress,
    }));
    await this.upsertProductsOutlets(docs);
  }

  async searchProductsOutlets(
    queryText: string,
    topK: number = 40,
    minScore: number = 0.3
  ): Promise<ProductOutletMetadata[]> {
    try {
      const index = this.pinecone.index(this.indexName);
      const [queryVec] = await this.embedTexts([queryText]);
      const queryResponse = await index.namespace(this.namespace).query({
        topK: topK,
        includeMetadata: true,
        vector: queryVec as any,
      });

      const results: ProductOutletMetadata[] = queryResponse.matches
        .filter((match: any) => (match.score ?? 0) >= minScore)
        .map((match: any) => match.metadata as ProductOutletMetadata);

      console.log(
        `[Pinecone RAG] Query: "${queryText}" -> ${results.length} results`
      );

      return results;
    } catch (error: any) {
      console.error("[Pinecone Search Error]", error);
      throw new AppError(`Failed to search Pinecone: ${error.message}`, 500);
    }
  }

  async searchWithFallback(
    queryText: string,
    allItems: ProductOutletMetadata[],
    topK: number = 40
  ): Promise<ProductOutletMetadata[]> {
    try {
      const pineconeResults = await this.searchProductsOutlets(queryText, topK);

      if (pineconeResults.length > 0) {
        return pineconeResults;
      }

      console.log("[Pinecone RAG] No results, falling back to keyword search");
      return this.keywordSearch(queryText, allItems, topK);
    } catch (error) {
      console.error("[Pinecone RAG] Error, using keyword fallback", error);
      return this.keywordSearch(queryText, allItems, topK);
    }
  }

  private keywordSearch(
    query: string,
    items: ProductOutletMetadata[],
    limit: number
  ): ProductOutletMetadata[] {
    const normalizedQuery = this.normalize(query);
    const tokens = normalizedQuery
      .split(/\s+/)
      .filter((t) => t && t.length > 1);

    const scored = items
      .filter((p) => (p.quantity ?? 0) > 0)
      .map((p) => {
        const searchText = this.normalize(
          `${p.productName} ${p.description ?? ""} ${p.outletName} ${
            p.outletAddress ?? ""
          }`
        );
        let score = 0;
        for (const token of tokens) {
          if (searchText.includes(token)) score++;
        }
        return { item: p, score };
      })
      .sort((a, b) => b.score - a.score);

    const topResults = scored.filter((s) => s.score > 0).slice(0, limit);
    return topResults.length > 0
      ? topResults.map((s) => s.item)
      : items.slice(0, limit);
  }

  private normalize(text: string): string {
    return (text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  async healthCheck(): Promise<boolean> {
    try {
      const index = this.pinecone.index(this.indexName);
      const stats = await index.describeIndexStats();
      console.log("[Pinecone RAG] Health check OK", stats.namespaces);
      return true;
    } catch (error) {
      console.error("[Pinecone RAG] Health check failed", error);
      return false;
    }
  }
}
