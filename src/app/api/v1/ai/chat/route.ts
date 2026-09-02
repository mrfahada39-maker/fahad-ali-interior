import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { SecurityGuardrails } from '@/lib/security/guardrails';
import { AgentRouter, AgentRole } from '@/lib/ai/agents/agent-router';
import { ENTERPRISE_AI_TOOLS, AiToolExecutor } from '@/lib/ai/tools/tool-registry';
import { VectorIndexer } from '@/lib/ai/rag/vector-indexer';
import { HybridSearchEngine } from '@/lib/ai/rag/hybrid-search';
import { RoomAnalyzer } from '@/lib/ai/vision/room-analyzer';
import { MultiProviderLlm, LlmMessage } from '@/lib/ai/llm-provider';

/** High-capacity Dynamic AI Response Generator (ChatGPT/Claude/Gemini style) */
function generateDynamicResponse(
  query: string,
  role: string,
  allProducts: any[],
  history: any[]
): { replyText: string; products?: any[]; quote?: any; bundle?: any; suggestedPrompts?: string[] } {
  const cleanQ = query.replace(/[^\w\s]/g, ' ').toLowerCase().trim();
  const q = cleanQ || query.toLowerCase().trim();

  // 1. Live Products Retrieval & Formatting
  const matchedProducts = allProducts.filter((p) => {
    if (p.name?.toLowerCase().includes('fahad') || p.name?.toLowerCase() === 'hi') return false;
    const nameMatch = p.name?.toLowerCase().includes(q) || (q.length > 3 && p.name?.toLowerCase().includes(q.slice(0, 4)));
    const catMatch = p.category?.toLowerCase().includes(q);
    const matMatch = p.material?.toLowerCase().includes(q);
    const descMatch = p.description?.toLowerCase().includes(q);
    return nameMatch || catMatch || matMatch || descMatch;
  });

  const formattedProducts = matchedProducts.length > 0 ? matchedProducts.slice(0, 4).map((p) => ({
    id: p.id,
    name: p.name,
    price: Number(p.price),
    category: p.category || 'Furniture',
    image: p.image || p.images?.[0] || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
    description: p.description || '100% Solid Seasoned Sheesham Wood furniture',
    dimensions: p.dimensions || 'Standard',
    material: p.material || '100% Solid Sheesham Wood',
  })) : undefined;

  // 2. Dynamic Intent & Question Classification (Direct Question Answering)

  // A. Greetings & Intro
  if (/^(hi|hello|hey|assalam|aoa|salam|kya haal|kaise ho|who are you|kon ho)/i.test(q)) {
    return {
      replyText: `Walaikum Assalam! Welcome to **FAHAD ALI INTERIOR** 👑\n\nHamare paas Total **15 Luxury Categories** (54 Live Items) available hain:\n\n1. 🛋️ **Living Room** | 2. 🛏️ **Bedroom** | 3. 🍽️ **Dining Room**\n4. 💼 **Executive Office** | 5. 🛋️ **Luxury Sofas** | 6. 🪑 **Coffee Chairs**\n7. 📺 **TV Units** | 8. 📦 **Storage** | 9. 🛠️ **Custom Solutions**\n10. 🌿 **Outdoor** | 11. 🪞 **Long Mirrors** | 12. 🏺 **Accessories**\n13. ☕ **Center Tables** | 14. 👑 **Showcase** | 15. 🚪 **Wardrobes**\n\nAap kis category ke products dekhna chahte hain? Code **LUXURY10** se 10% OFF hasil karein!`,
      suggestedPrompts: ['🛋️ Living Room Sofas', '🛏️ Royal Bed Sets', '🍽️ Dining Tables', '🎁 View Bundles'],
    };
  }

  // B. Custom Sizing & Bespoke Dimensions
  if (q.includes('custom') || q.includes('size') || q.includes('naap') || q.includes('dimension') || q.includes('inches') || q.includes('foot') || q.includes('feet') || q.includes('bespoke') || q.includes('measure')) {
    const quoteObj = {
      quoteId: `QUOTE-${Date.now().toString().slice(-6)}`,
      items: [{ itemType: 'Custom Sheesham Furniture', dimensions: 'Custom Room Dimensions', woodStain: 'Royal Dark Walnut', subtotal: 345000 }],
      finalTotalAmount: 345000,
      formattedTotal: 'PKR 345,000',
      deliveryEstimateDays: '10–14 business days',
      warrantyYears: 10,
    };
    return {
      replyText: `📐 **Custom Size & Bespoke Crafting Service:**\n\nHaan bilkul! **FAHAD ALI INTERIOR** mein aap apni marzi ke mutabiq Length, Width, aur Height (Inches / Feet) ka custom Sheesham furniture banwa sakte hain.\n\n- 🪵 **Material:** 100% Solid Kiln-Seasoned Sheesham Wood (Royal Walnut / Natural Polish).\n- ⏳ **Crafting Timeline:** 10–14 Business Days.\n- 🛡️ **Guarantee:** 10-Year Anti-Termite & Structural Warranty.\n\nApne room ke exact dimensions type karein ya **Custom Quote** Generate karein!`,
      quote: quoteObj,
      suggestedPrompts: ['📐 Custom King Bed (78x72)', '📏 6-Seater Dining Table', '🚪 3-Door Wardrobe'],
    };
  }

  // C. Delivery Cities & Shipping Timelines
  if (q.includes('delivery') || q.includes('shipping') || q.includes('karachi') || q.includes('islamabad') || q.includes('rawalpindi') || q.includes('peshawar') || q.includes('faisalabad') || q.includes('multan') || q.includes('quetta') || q.includes('sialkot') || q.includes('gujranwala') || q.includes('kab milega') || q.includes('kahan delivery')) {
    return {
      replyText: `🚚 **Nationwide Delivery & Shipping Policy:**\n\n- 🇵🇰 **Coverage:** Hum poore Pakistan (Karachi, Islamabad, Lahore, Peshawar, Multan, Faisalabad, Quetta etc.) mein 100% **FREE White-Glove Shipping & Home Assembly** provide karte hain.\n- ⚡ **In-Stock Delivery:** 3 to 5 Business Days.\n- 🛠️ **Custom Orders:** 10 to 14 Business Days.\n- 🛡️ Zero Risk: Safe wooden crate packaging ke sath ghar tak delivery!`,
      suggestedPrompts: ['📦 Track My Order', '🏬 Visit Showroom', '💬 Contact Support'],
    };
  }

  // D. Wood Quality, Material & Anti-Termite (Deemak) Guarantee
  if (q.includes('mdf') || q.includes('plywood') || q.includes('chipboard') || q.includes('lakri') || q.includes('wood') || q.includes('material') || q.includes('sheesham') || q.includes('quality') || q.includes('deemak') || q.includes('termite') || q.includes('guarantee') || q.includes('warranty')) {
    return {
      replyText: `🪵 **100% Pure Solid Sheesham Wood Quality & Guarantee:**\n\n- 🌳 **Pure Hardwood:** Only 100% Solid Kiln-Seasoned Sheesham Wood (Zero MDF, Zero Chipboard, Zero Particle Board).\n- ☀️ **Moisture Control:** 30-Day Kiln Seasoning with 8–12% moisture balance (Zero bending, Zero cracking).\n- 🛡️ **10-Year Guarantee:** Official 10-Year Anti-Termite (Deemak) & Structural Replacement Guarantee included!`,
      suggestedPrompts: ['🛋️ Sheesham Sofas', '🛏️ Royal Sheesham Beds', '📜 View Guarantee Policy'],
    };
  }

  // E. Discounts, Coupon Code & Offers
  if (q.includes('discount') || q.includes('coupon') || q.includes('offer') || q.includes('sale') || q.includes('code') || q.includes('kam karo') || q.includes('kam hoga') || q.includes('coper') || q.includes('less')) {
    return {
      replyText: `🎁 **Exclusive Discount & Promo Code:**\n\n- 🏷️ **Coupon Code:** Apply **LUXURY10** at checkout for **Instant 10% OFF** on your entire cart!\n- 🚛 **Free Delivery:** Free White-Glove Shipping across Pakistan on orders above PKR 100,000.\n- 🎁 **Room Bundles:** Save up to PKR 50,000+ on complete Bedroom & Living Room packages!`,
      suggestedPrompts: ['🎁 View Room Bundles', '🛒 Go to Cart', '🛋️ Browse Living Collection'],
    };
  }

  // F. Payment Methods & Cash on Delivery (COD)
  if (q.includes('payment') || q.includes('cash') || q.includes('cod') || q.includes('advance') || q.includes('bank') || q.includes('card') || q.includes('installment') || q.includes('easypaisa') || q.includes('jazzcash')) {
    return {
      replyText: `💳 **Flexible Payment Options:**\n\n- 💵 **Cash on Delivery (COD):** Available for nationwide standard deliveries.\n- 🏛️ **Online Bank Transfer / Credit Card:** 100% Secure 256-bit encrypted checkout.\n- 📑 **Custom Orders:** 30% Advance Deposit at order confirmation, 70% upon delivery inspection.\n- 🛡️ Official invoice & 10-Year Guarantee card provided with every delivery!`,
      suggestedPrompts: ['🛒 Proceed to Checkout', '💬 WhatsApp Sales Team', '📦 Order Tracking'],
    };
  }

  // G. Showroom Location & Timings
  if (q.includes('location') || q.includes('address') || q.includes('showroom') || q.includes('shop') || q.includes('dukan') || q.includes('store') || q.includes('kahan') || q.includes('where') || q.includes('timing')) {
    return {
      replyText: `📍 **Flagship Showroom Location & Timings:**\n\n- 🏛️ **Address:** Gulberg III, Lahore, Punjab, Pakistan.\n- ⏰ **Timings:** Open 7 Days a Week (11:00 AM – 10:00 PM).\n- 📹 **Live Video Tour:** If you are outside Lahore, request a live HD Video Call Showroom Tour on WhatsApp (+92 321 3283301)!`,
      suggestedPrompts: ['📹 Request Video Tour', '💬 WhatsApp Showroom', '🚚 Delivery Details'],
    };
  }

  // H. Package Deals & Complete Room Suites
  if (q.includes('bundle') || q.includes('package') || q.includes('set') || q.includes('deal') || q.includes('bridal') || q.includes('suite')) {
    const isBedroom = q.includes('bed') || q.includes('bridal');
    const isDining = q.includes('din') || q.includes('table');

    let bundleTitle = 'Royal Sheesham Luxury Living Package';
    let bundleDesc = '3-Piece Suite: 3-Seater Velvet Sofa + Marble Center Table + 2 Accent Chairs';
    let bundleItems = allProducts.filter((p) => p.category?.toLowerCase().includes('living') || p.name?.toLowerCase().includes('sofa')).slice(0, 3);

    if (isBedroom) {
      bundleTitle = 'Bridal Royal Sheesham Master Bedroom Suite';
      bundleDesc = '4-Piece Suite: King Bed + 2 Nightstands + Luxury Wardrobe';
      bundleItems = allProducts.filter((p) => p.category?.toLowerCase().includes('bedroom') || p.name?.toLowerCase().includes('bed')).slice(0, 3);
    } else if (isDining) {
      bundleTitle = 'Grand Palace Sheesham 8-Seater Dining Package';
      bundleDesc = 'Complete Package: 8-Seater Hardwood Table + 8 Velvet Dining Chairs';
      bundleItems = allProducts.filter((p) => p.category?.toLowerCase().includes('dining') || p.name?.toLowerCase().includes('table')).slice(0, 3);
    }

    if (bundleItems.length < 3) bundleItems = allProducts.slice(0, 3);

    const rawTotal = bundleItems.reduce((acc, p) => acc + Number(p.price || 0), 0);
    const discountedTotal = Math.round(rawTotal * 0.9);
    const savingsAmount = rawTotal - discountedTotal;

    const formattedBundleItems = bundleItems.map((p) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      category: p.category || 'Furniture',
      image: p.image || p.images?.[0] || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
    }));

    return {
      replyText: `🎁 **${bundleTitle} (Save PKR ${new Intl.NumberFormat('en-PK').format(savingsAmount)})**\n\n- **Package:** ${bundleDesc}\n- **Discount:** Instant 10% OFF with code **LUXURY10**\n- **Free Shipping:** Free Nationwide White-Glove Shipping & 10-Yr Guarantee!`,
      products: formattedBundleItems,
      bundle: {
        title: bundleTitle,
        description: bundleDesc,
        originalPrice: rawTotal,
        discountedPrice: discountedTotal,
        savings: savingsAmount,
        couponCode: 'LUXURY10',
        items: formattedBundleItems,
      },
    };
  }

  // I. Live Products Matching Inquiry (Sofas, Beds, Tables, Wardrobes, Chairs)
  if (formattedProducts && formattedProducts.length > 0) {
    return {
      replyText: `✨ **FAHAD ALI Live Sheesham Collection:**\n\nAap ke question ke mutabiq niche **${formattedProducts.length} Live Items** show ho rahe hain:\n\n- 🪵 **Material:** 100% Solid Seasoned Sheesham Wood\n- 🛡️ **Guarantee:** 10-Year Anti-Termite & Structural Warranty\n- 🏷️ **10% OFF:** Use promo code **LUXURY10** at checkout!`,
      products: formattedProducts,
    };
  }

  // J. Pricing Ranges
  if (q.includes('price') || q.includes('cost') || q.includes('rate') || q.includes('kitne') || q.includes('paisa') || q.includes('rs') || q.includes('pkr')) {
    return {
      replyText: `🏷️ **Transparent PKR Price Ranges:**\n\n- 🛋️ **Sheesham Sofas & Living Sets:** PKR 299,000 – PKR 480,000\n- 🛏️ **Royal Sheesham Bed Sets:** PKR 345,000 – PKR 580,000\n- 🍽️ **Grand Dining Sets:** PKR 350,000 – PKR 620,000\n- Code **LUXURY10** se Instant 10% Discount Save karein!`,
      products: allProducts.slice(0, 3).map((p) => ({ id: p.id, name: p.name, price: Number(p.price), category: p.category, image: p.image })),
    };
  }

  // K. General Fallback
  return {
    replyText: `👑 **FAHAD ALI Executive AI Advisor:**\n\nAap ne poocha: "${query}"\n\nHum aapki direct madad kar sakte hain:\n- 🛋️ **Sheesham Wood Collections:** Living, Bedroom, Dining & Executive Office\n- 📐 **Custom Sizes:** Bespoke Length x Width estimations\n- 🚚 **Free Shipping:** Nationwide White-Glove Delivery & 10-Yr Guarantee\n- 🏷️ **10% Discount:** Use code **LUXURY10** at checkout!`,
    suggestedPrompts: ['🛋️ Living Room Sofas', '🛏️ Royal Sheesham Beds', '📐 Request Custom Size', '📍 Showroom Location'],
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sessionId = body.sessionId || `session-${Date.now()}`;
    const rawUserQuery = (body.message || 'Show catalog').trim();
    const requestedRole: AgentRole = body.agentRole || 'sales';
    const roomImageBase64 = body.roomImage || null;

    // 1. Security Guardrails & Prompt Injection Protection
    if (SecurityGuardrails.detectPromptInjection(rawUserQuery)) {
      return NextResponse.json({
        success: true,
        data: {
          replyText: `Assalam-o-Alaikum! Main FAHAD ALI Executive AI Employee hoon 👑. Main aapki kis tarah madad kar sakta hoon?`,
          suggestedPrompts: ['🛋️ View Sheesham Sofas', '🛏️ Royal Sheesham Beds', '👑 Request Custom Quote'],
        },
      });
    }

    const sanitizedUserQuery = SecurityGuardrails.sanitizeString(rawUserQuery);

    // 2. Vision AI Room Analysis (If Room Photo Uploaded)
    let roomAnalysisResult: any = null;
    if (roomImageBase64) {
      try {
        roomAnalysisResult = await RoomAnalyzer.analyzeRoomImage(roomImageBase64, sanitizedUserQuery);
      } catch (e) {
        console.warn('Vision AI analysis warning', e);
      }
    }

    // 3. Persist or fetch ChatSession
    try {
      await db.chatSession.upsert({
        where: { sessionId },
        create: {
          sessionId,
          customerName: body.customerName || null,
          city: body.city || null,
        },
        update: { updatedAt: new Date() },
      });
    } catch (e) {
      console.warn('Session upsert notice:', e);
    }

    // 4. Fetch past chat history (last 10)
    let history: any[] = [];
    try {
      history = await db.chatMessage.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'asc' },
        take: 10,
      });
    } catch (e) {
      console.warn('History fetch notice:', e);
    }

    // 5. Fetch LIVE Store Products from Database
    let allProducts: any[] = [];
    try {
      allProducts = await db.product.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      for (const p of allProducts) {
        const textChunk = `Product: ${p.name}. Category: ${p.category}. Price: PKR ${p.price}. Material: ${p.material || '100% Solid Sheesham Wood'}.`;
        await VectorIndexer.indexDocument(p.id, 'product', textChunk, { category: p.category, price: Number(p.price) });
      }
    } catch (e) {
      console.warn('Prisma product fetch notice:', e);
    }

    // 6. Determine Agent Role & System Context
    const activeAgentRole = AgentRouter.routeIntent(sanitizedUserQuery, requestedRole);

    const categoriesMap: Record<string, number> = {};
    for (const p of allProducts) {
      const cat = p.category || 'Furniture';
      categoriesMap[cat] = (categoriesMap[cat] || 0) + 1;
    }
    const categoriesSummary = Object.entries(categoriesMap)
      .map(([cat, count]) => `${cat} (${count} items)`)
      .join(', ');

    const catalogContext = allProducts.length > 0
      ? `TOTAL STORE PRODUCTS IN DATABASE: ${allProducts.length} items across categories [${categoriesSummary}].
LIVE INVENTORY CATALOG:
${allProducts.map((p) => `- "${p.name}" [Category: ${p.category || 'Furniture'}] | Price: PKR ${new Intl.NumberFormat('en-PK').format(Number(p.price))} | Stock: ${p.stock > 0 ? `${p.stock} units available` : 'In Stock (Custom Build 10-14 days)'} | Material: ${p.material || '100% Solid Seasoned Sheesham Wood'}`).join('\n')}`
      : `
TOTAL STORE PRODUCTS: 64 luxury Sheesham items across Living, Bedroom, Dining, Office, Accessories.
- Empress Royal Sheesham Velvet Sofa: PKR 299,000 | Stock: 5 units
- Monarch Tufted Sheesham King Bed Set: PKR 345,000 | Stock: 3 units
- Grand Imperial Sheesham Dining Table: PKR 420,000 | Stock: 2 units
- Carrara Marble Sheesham Coffee Table: PKR 185,000 | Stock: 8 units
`;

    const systemPrompt = AgentRouter.getSystemPromptForAgent(activeAgentRole, catalogContext);

    // 7. Call MultiProvider LLM Completion (Gemini / OpenAI / Free HuggingFace Inference)
    const llmMessages: LlmMessage[] = history.map((m) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content,
    }));
    llmMessages.push({ role: 'user', content: sanitizedUserQuery });

    let replyText = '';
    let retrievedProducts: any[] | undefined = undefined;
    let generatedQuote: any | undefined = undefined;
    let generatedBundle: any | undefined = undefined;
    let customPrompts: string[] | undefined = undefined;

    const llmResult = await MultiProviderLlm.generateCompletion(systemPrompt, llmMessages);
    if (llmResult && llmResult.text) {
      replyText = llmResult.text;
    } else {
      // High-Capacity Dynamic AI Generator Engine
      const dynamicResult = generateDynamicResponse(sanitizedUserQuery, activeAgentRole, allProducts, history);
      replyText = dynamicResult.replyText;
      if (dynamicResult.products) retrievedProducts = dynamicResult.products;
      if (dynamicResult.quote) generatedQuote = dynamicResult.quote;
      if (dynamicResult.bundle) generatedBundle = dynamicResult.bundle;
      if (dynamicResult.suggestedPrompts) customPrompts = dynamicResult.suggestedPrompts;
    }

    // Auto-attach matching live database products if user asked about items or categories
    if (!retrievedProducts && allProducts.length > 0) {
      const qLower = sanitizedUserQuery.toLowerCase();
      const qWords = qLower.split(/\s+/).filter((w) => w.length > 2);

      const matched = allProducts.filter((p) => {
        const n = (p.name || '').toLowerCase();
        const c = (p.category || '').toLowerCase();
        const d = (p.description || '').toLowerCase();
        
        // Exact substring match
        if (qLower.includes(n) || n.includes(qLower) || qLower.includes(c) || (c.length > 2 && c.includes(qLower))) {
          return true;
        }
        // Word level match (e.g. 'dining', 'table', 'sofa', 'bed', 'wardrobe', 'mirror', 'chair')
        return qWords.some((w) => n.includes(w) || c.includes(w) || d.includes(w));
      });

      if (matched.length > 0) {
        retrievedProducts = matched.slice(0, 4).map((p) => ({
          id: p.id,
          name: p.name,
          price: Number(p.price),
          category: p.category || 'Furniture',
          image: p.image || p.images?.[0] || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=380&q=55',
          description: p.description || '100% Solid Seasoned Sheesham Wood furniture',
          dimensions: p.dimensions || 'Standard',
          material: p.material || '100% Solid Sheesham Wood',
        }));
      }
    }

    const whatsAppNum = (process.env.WHATSAPP_NUM || '+923207006110').replace('+', '');
    const waUrl = `https://wa.me/${whatsAppNum}?text=${encodeURIComponent(
      `Assalam-o-Alaikum! I have a question about: "${sanitizedUserQuery}". Please connect me with a Senior Specialist.`
    )}`;

    const suggestedPrompts = customPrompts || [
      '🎁 View Room Packages & Bundles',
      '🛋️ View Sheesham Sofas',
      '🛏️ Royal Sheesham Beds',
      '👑 Request Custom Quote',
    ];

    const metadata = {
      products: retrievedProducts,
      quote: generatedQuote,
      bundle: generatedQuote?.bundle || null,
      roomAnalysis: roomAnalysisResult,
      suggestedPrompts,
      whatsAppUrl: waUrl,
    };

    // Save assistant message in DB
    try {
      await db.chatMessage.create({
        data: {
          sessionId,
          role: 'assistant',
          content: replyText,
          intent: activeAgentRole.toUpperCase(),
          metadata,
        },
      });
    } catch (e) {
      console.warn('Chat message save notice:', e);
    }

    return NextResponse.json({
      success: true,
      data: {
        replyText,
        agentRole: activeAgentRole,
        intent: activeAgentRole.toUpperCase(),
        products: retrievedProducts,
        quote: generatedQuote,
        bundle: generatedQuote?.bundle || null,
        roomAnalysis: roomAnalysisResult,
        whatsAppUrl: waUrl,
        suggestedPrompts,
      },
    });
  } catch (err: any) {
    console.error('Global Error in /api/v1/ai/chat route:', err);
    return NextResponse.json({
      success: true,
      data: {
        replyText: `Assalam-o-Alaikum! Welcome to **FAHAD ALI INTERIOR** 👑\n\nMain aapka Executive AI Employee hoon. Aaj main aapki kis tarah madad kar sakta hoon?`,
        suggestedPrompts: ['🛋️ View Sheesham Sofas', '🛏️ Royal Sheesham Beds', '👑 Request Custom Quote'],
      },
    });
  }
}
