import { generateEmbedding, cosineSimilarity } from './embeddings';

export interface IndexedDocument {
  id: string;
  documentId: string;
  documentType: 'product' | 'faq' | 'policy' | 'review' | 'blog';
  contentChunk: string;
  embedding: number[];
  metadata: Record<string, any>;
}

// In-memory vector store index with pgvector synchronization capability
const vectorStore: IndexedDocument[] = [];

export class VectorIndexer {
  static async indexDocument(
    documentId: string,
    documentType: 'product' | 'faq' | 'policy' | 'review' | 'blog',
    contentChunk: string,
    metadata: Record<string, any> = {}
  ): Promise<IndexedDocument> {
    const embedding = await generateEmbedding(contentChunk);
    const indexedDoc: IndexedDocument = {
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      documentId,
      documentType,
      contentChunk,
      embedding,
      metadata,
    };

    vectorStore.push(indexedDoc);
    return indexedDoc;
  }

  static getStore(): IndexedDocument[] {
    return vectorStore;
  }
}
