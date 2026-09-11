export class SiteKnowledgeEngine {
  static getFullSiteKnowledge(): string {
    return `
==================================================
FAHAD ALI INTERIOR — COMPLETE WEBSITE & SYSTEM SITEMAP
==================================================

1. WEBSITE PAGES & NAVIGATION ROUTES:
- Home Page [/]: Luxury Hero Slider, Featured Sheesham Collections, Best Sellers, Room Visualizer preview.
- Shop & Catalog [/shop]: Filter products by category, wood finish, or design specification. Total live catalog items.
- Categories [/shop/categories]:
  1. Living Room (Sofas, Sets, Coffee Tables)
  2. Bedroom (Royal Beds, Nightstands, Dressers)
  3. Dining Room (Exquisite Dining Sets)
  4. Office (Modern Office Setups)
  5. Sofas (Comfortable & Stylish Armchairs)
  6. Coffee Chairs (Elegant Coffee Tables & Chairs)
  7. TV Units (Modern Entertainment TV Units)
  8. Storage (Smart Storage Solutions & Cabinets)
  9. Custom Furniture Solutions (Tailored Bespoke Designs)
  10. Outdoor (Outdoor Living Furniture)
  11. Long Mirrors (Luxury Mirrors for Modern Interiors)
  12. Accessories (Decor & Accessories, Lamps, Vases)
  13. Center tables (Luxury Finished Center Tables)
  14. Luxury Showcase (Premium Display Cabinets & Showcases)
  15. Luxury Wardrobes (Beautiful Sheesham Wardrobes)

- Product Details [/product/[id]]: High-res images, 100% Solid Sheesham specs, custom dimensions, wood stain swatches, Add to Cart.
- Cart & Basket [/cart]: Items review, quantity update, coupon code "LUXURY10" application, instant total calculation.
- Checkout [/checkout]: White-glove delivery address, Cash on Delivery (COD) / Bank Transfer, order placement.
- Order History & Tracking [/orders]: Order tracking status by Order ID (e.g. FAI-123456), estimated delivery days (3-5 days in-stock, 10-14 days custom).
- About Us [/about]: Brand story, 30-day kiln seasoning process, 8-12% moisture control, artisan craftsmanship.
- Showroom & Contact [/contact]: Flagship Showroom: Gulberg III, Lahore, Pakistan. Phone/WhatsApp: +92 320 700 6110. Free Nationwide Shipping across Pakistan.
- Terms & Privacy [/privacy, /terms]: 30-day money back / return policy, structural warranty terms.
- Admin AI Intelligence Dashboard [/admin]: Revenue forecasting, stock turnover, AI discount generator, live orders.

2. MATERIAL & GUARANTEE SPECIFICATIONS:
- 100% Solid Seasoned Sheesham Wood (Rosewood): Zero MDF, Zero Particle Board, Zero Synthetic Veneer.
- Kiln Seasoned: 30 days kiln-seasoned for 8–12% equilibrium moisture content. Never cracks, warps, or bends.
- 10-Year Guarantee: Full 10-Year Structural & Anti-Termite (Deemak) Replacement Warranty.
- Finishing: 5-layer scratch-resistant polyurethane sealant highlighting natural wood grains.
- Fabric Upholstery: Italian Royal Velvet, Textured Linen, Top-Grain Leatherette.
- Wood Stains: Royal Dark Walnut, Natural Sheesham, Satin Ebony.

3. DISCOUNTS & LOGISTICS:
- Coupon Code: "LUXURY10" (Instant 10% OFF on orders over PKR 100,000).
- Delivery: FREE White-Glove Nationwide Shipping & Installation on orders over PKR 100,000.
- Timeline: In-stock items (3 to 5 business days), Custom bespoke items (10 to 14 business days).

4. RESPONSE STYLE & RULES:
- SHORT, CONCISE, & CLEAR: Never write long boring essays. Keep responses bulleted, punchy, elegant, and directly helpful.
- FULL ACCURACY: Use real product names, prices (PKR), materials, and site pages.
- BEHAVIOR: Act as the Senior AI Executive Manager of FAHAD ALI INTERIOR. Match the user's language (Roman Urdu or English).
`;
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;

  if (geminiKey) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${geminiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'models/text-embedding-004',
          content: { parts: [{ text }] },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.embedding?.values) {
          return data.embedding.values;
        }
      }
    } catch (e) {
      console.warn('Gemini embedding failed, using fallback vector', e);
    }
  }

  if (openAiKey && !openAiKey.startsWith('AQ.')) {
    try {
      const res = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openAiKey}`,
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: text,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.data?.[0]?.embedding) {
          return data.data[0].embedding;
        }
      }
    } catch (e) {
      console.warn('OpenAI embedding failed, using fallback vector', e);
    }
  }

  // Deterministic 1536-dimensional feature vector for fallback semantic indexing
  const vector = new Array(1536).fill(0);
  const words = text.toLowerCase().split(/\s+/);
  for (let i = 0; i < words.length; i++) {
    const hash = words[i].split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const idx = hash % 1536;
    vector[idx] += 1 / (i + 1);
  }

  // Normalize vector
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0)) || 1;
  return vector.map((v) => v / magnitude);
}

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export interface IndexedDocument {
  id: string;
  documentId: string;
  documentType: 'product' | 'faq' | 'policy' | 'review' | 'blog';
  contentChunk: string;
  embedding: number[];
  metadata: Record<string, any>;
}

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
