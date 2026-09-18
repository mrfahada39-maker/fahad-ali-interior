/**
 * Master Suite 1: AI Multimodal, Room Analyzer & WebRTC Video/Audio Consultation
 * Fahad Ali Haute Interior Architecture & Artisanal Furniture
 *
 * Direct Production Integration Suite:
 * 1. AI Room Analyzer (@/lib/ai/room-analyzer)
 * 2. Enterprise AI Tool Registry (@/lib/ai/tool-registry)
 * 3. RAG Hybrid Search Engine & Vector Indexer (@/lib/ai/rag)
 * 4. Multi-Agent Intent Router (@/lib/ai/agents)
 * 5. WebRTC Configuration & Client (@/lib/webrtc-call-manager)
 * 6. Web Push Notification Payload contracts (@/lib/push-notifications)
 */

import { RoomAnalyzer } from '@/lib/ai/room-analyzer';
import { ENTERPRISE_AI_TOOLS, AiToolExecutor } from '@/lib/ai/tool-registry';
import { HybridSearchEngine, VectorIndexer } from '@/lib/ai/rag';
import { AgentRouter, AgentRole } from '@/lib/ai/agents';
import { RTC_CONFIGURATION, WebRtcCallClient } from '@/lib/webrtc-call-manager';
import { sendPushNotification } from '@/lib/push-notifications';

describe('Master Suite 1: Production AI Multimodal, RAG & WebRTC Architecture', () => {

  // ── 1. Production AI Room Analyzer ──
  describe('1. Production AI Room Analyzer (@/lib/ai/room-analyzer)', () => {
    it('analyzes room image and returns structured design advice with fallback resilience', async () => {
      const result = await RoomAnalyzer.analyzeRoomImage('data:image/jpeg;base64,dummybase64data', '18x14 Master Bedroom');

      expect(result).toBeDefined();
      expect(result.detectedRoomType).toBeDefined();
      expect(typeof result.detectedRoomType).toBe('string');
      expect(result.spatialDimensionsEstimate).toBeDefined();
      expect(Array.isArray(result.detectedColors)).toBe(true);
      expect(Array.isArray(result.detectedFurniture)).toBe(true);
      expect(Array.isArray(result.suggestedProducts)).toBe(true);
      expect(typeof result.designAdvice).toBe('string');
      expect(result.designAdvice.length).toBeGreaterThan(10);
    });
  });

  // ── 2. Enterprise AI Tool Registry ──
  describe('2. Enterprise AI Tool Registry (@/lib/ai/tool-registry)', () => {
    it('verifies all enterprise AI tools have valid schema declarations', () => {
      expect(ENTERPRISE_AI_TOOLS.length).toBeGreaterThanOrEqual(6);

      const toolNames = ENTERPRISE_AI_TOOLS.map((t) => t.name);
      expect(toolNames).toContain('searchProducts');
      expect(toolNames).toContain('getProduct');
      expect(toolNames).toContain('compareProducts');
      expect(toolNames).toContain('checkStock');
      expect(toolNames).toContain('generateQuote');
      expect(toolNames).toContain('calculateDelivery');
      expect(toolNames).toContain('bookAppointment');

      for (const tool of ENTERPRISE_AI_TOOLS) {
        expect(tool.description).toBeDefined();
        expect(tool.parameters.type).toBe('object');
        expect(tool.parameters.properties).toBeDefined();
      }
    });

    it('executes generateQuote tool with accurate Pakistani bespoke formulas', async () => {
      const quote = await AiToolExecutor.executeTool('generateQuote', {
        itemType: 'Royal Sheesham Bed Set',
        lengthInches: 84,
        widthInches: 78,
        woodStain: 'Royal Dark Walnut',
        fabricType: 'Royal Velvet',
      });

      expect(quote).toBeDefined();
      expect(quote.success).toBe(true);
      expect(quote.quoteId).toMatch(/^QUOTE-/);
      expect(quote.subtotal).toBeGreaterThan(0);
      expect(quote.currency).toBe('PKR');
      expect(quote.warrantyYears).toBe(10);
    });

    it('executes calculateDelivery tool with Pakistani shipping logic', async () => {
      const delivery = await AiToolExecutor.executeTool('calculateDelivery', {
        city: 'Lahore',
        orderAmount: 150000,
      });

      expect(delivery.success).toBe(true);
      expect(delivery.isFreeShipping).toBe(true);
      expect(delivery.shippingFee).toBe(0);
    });
  });

  // ── 3. RAG Knowledge Retrieval & Vector Indexer ──
  describe('3. RAG Knowledge Retrieval & Hybrid Search (@/lib/ai/rag)', () => {
    beforeAll(async () => {
      // Index sample catalog documents into VectorIndexer with correct signature (id, type, chunk, metadata)
      await VectorIndexer.indexDocument(
        '1',
        'product',
        'Monarch Tufted Sheesham King Bed Set with velvet headboard and carved footboard',
        { id: '1', name: 'Monarch King Bed', category: 'Bedroom', price: 345000 }
      );
      await VectorIndexer.indexDocument(
        '2',
        'product',
        'Grand Imperial Sheesham 8-Seater Dining Table with lacquer finish and rosewood inlays and dining chairs',
        { id: '2', name: 'Grand Imperial Dining Table', category: 'Dining', price: 420000 }
      );
    });

    it('indexes documents into the vector store and verifies store size', () => {
      const store = VectorIndexer.getStore();
      expect(store.length).toBeGreaterThanOrEqual(2);
      expect(store[0].embedding.length).toBe(1536);
    });

    it('executes HybridSearchEngine.search combining semantic and keyword ranking', async () => {
      const results = await HybridSearchEngine.search('dining table', { category: 'Dining' }, 3);

      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].document.metadata.category).toBe('Dining');
      expect(results[0].score).toBeGreaterThan(0);
    });
  });

  // ── 4. Multi-Agent Intent Router ──
  describe('4. Multi-Agent Intent Router (@/lib/ai/agents)', () => {
    it('routes bespoke queries to quote agent', () => {
      const role = AgentRouter.routeIntent('I need a custom size quote with specific inches and dimensions');
      expect(role).toBe('quote');
    });

    it('routes interior queries to interior agent', () => {
      const role = AgentRouter.routeIntent('What color fabric and wood design matches my room layout?');
      expect(role).toBe('interior');
    });

    it('generates rich luxury system prompt with catalog context', () => {
      const prompt = AgentRouter.getSystemPromptForAgent('sales', 'Sample Live Catalog Context');
      expect(prompt).toContain('FAHAD ALI');
      expect(prompt).toContain('Sample Live Catalog Context');
      expect(prompt).toContain('Sheesham');
    });
  });

  // ── 5. WebRTC Call Client & ICE Configuration ──
  describe('5. WebRTC Peer Configuration (@/lib/webrtc-call-manager)', () => {
    it('exports valid Google STUN servers in RTC_CONFIGURATION for NAT traversal', () => {
      expect(RTC_CONFIGURATION.iceServers).toBeDefined();
      expect(RTC_CONFIGURATION.iceServers!.length).toBeGreaterThanOrEqual(2);
      const stunUrls = RTC_CONFIGURATION.iceServers!.flatMap((s) => (Array.isArray(s.urls) ? s.urls : [s.urls]));
      expect(stunUrls.some((u) => u.includes('stun.l.google.com'))).toBe(true);
    });

    it('initializes WebRtcCallClient with callbacks and handles cleanup', () => {
      let remoteReceived = false;
      const client = new WebRtcCallClient((_stream) => {
        remoteReceived = true;
      });

      expect(client).toBeDefined();
      expect(client.pc).toBeNull();
      client.cleanup();
      expect(client.pc).toBeNull();
      expect(remoteReceived).toBe(false);
    });
  });

  // ── 6. Push Notifications Contracts ──
  describe('6. Web Push Notification Service (@/lib/push-notifications)', () => {
    it('returns boolean false or graceful recovery when push subscription is invalid', async () => {
      const dummySub = {
        endpoint: 'https://fcm.googleapis.com/fcm/send/invalid-test-token',
        keys: { p256dh: 'invalid_p256dh', auth: 'invalid_auth' },
      };

      const res = await sendPushNotification(dummySub, {
        title: 'Bespoke Order Update',
        body: 'Your custom Sheesham table is now in finishing stage.',
      });

      expect(res).toBe(false);
    });
  });
});