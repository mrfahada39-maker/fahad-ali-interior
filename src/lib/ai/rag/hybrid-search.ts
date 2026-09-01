import { generateEmbedding, cosineSimilarity } from './embeddings';
import { VectorIndexer, IndexedDocument } from './vector-indexer';

export interface HybridSearchResult {
  document: IndexedDocument;
  score: number;
  semanticScore: number;
  keywordScore: number;
}

export class HybridSearchEngine {
  static async search(
    query: string,
    filters?: {
      documentType?: string;
      category?: string;
      maxPrice?: number;
    },
    limit: number = 5
  ): Promise<HybridSearchResult[]> {
    const queryVector = await generateEmbedding(query);
    const store = VectorIndexer.getStore();
    const queryTerms = query.toLowerCase().split(/\s+/).filter(Boolean);

    const results: HybridSearchResult[] = [];

    for (const doc of store) {
      if (filters?.documentType && doc.documentType !== filters.documentType) continue;
      if (filters?.category && doc.metadata.category && doc.metadata.category.toLowerCase() !== filters.category.toLowerCase()) continue;
      if (filters?.maxPrice && doc.metadata.price && doc.metadata.price > filters.maxPrice) continue;

      const semanticScore = cosineSimilarity(queryVector, doc.embedding);

      let keywordMatches = 0;
      const contentLower = doc.contentChunk.toLowerCase();
      for (const term of queryTerms) {
        if (contentLower.includes(term)) keywordMatches++;
      }
      const keywordScore = queryTerms.length > 0 ? keywordMatches / queryTerms.length : 0;

      // Weighted Hybrid Score (70% Semantic Vector + 30% Keyword Match)
      const combinedScore = semanticScore * 0.7 + keywordScore * 0.3;

      results.push({
        document: doc,
        score: parseFloat(combinedScore.toFixed(4)),
        semanticScore: parseFloat(semanticScore.toFixed(4)),
        keywordScore: parseFloat(keywordScore.toFixed(4)),
      });
    }

    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  }
}
