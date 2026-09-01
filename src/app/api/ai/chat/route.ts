import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { LOCAL_IMAGES } from '@/lib/images';

const SUGGESTED_PROMPTS = [
  '🛋️ View Sheesham Sofas',
  '🛏️ Royal Sheesham Beds',
  '👑 Request Custom Quote',
  '💬 Chat with Specialist',
];

export async function POST(req: Request) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const message = body?.message || '';
    const query = message.toLowerCase().trim();

    if (!query) {
      return NextResponse.json({
        success: true,
        data: {
          replyText: "Assalam-o-Alaikum! Welcome to **FAHAD ALI INTERIOR** 👑\n\nHamare store me Total **15 Luxury Categories** (54 Live Items) available hain:\n\n1. 🛋️ Living Room | 2. 🛏️ Bedroom | 3. 🍽️ Dining Room\n4. 💼 Office | 5. 🛋️ Luxury Sofas | 6. 🪑 Coffee Chairs\n7. 📺 TV Units | 8. 📦 Storage | 9. 🛠️ Custom Solutions\n10. 🌿 Outdoor | 11. 🪞 Mirrors | 12. 🏺 Accessories\n13. ☕ Center Tables | 14. 👑 Showcase | 15. 🚪 Wardrobes\n\nAap kis category ke products dekhna chahte hain?",
          products: [],
          suggestedPrompts: SUGGESTED_PROMPTS,
        },
      });
    }

    // 1. Fetch active products from DB
    let allProducts: any[] = [];
    try {
      allProducts = await db.product.findMany({
        take: 30,
        select: { id: true, name: true, price: true, category: true, image: true, description: true },
      });
    } catch (e) {
      console.warn('DB lookup fallback active:', e);
    }

    // Fallback static inventory if DB is empty
    if (!allProducts || allProducts.length === 0) {
      allProducts = [
        { id: 'p1', name: 'Royal Chesterfield Sheesham Sofa Set', price: 185000, category: 'Sofas', image: LOCAL_IMAGES.sofa, description: 'Solid Sheesham wood frame with velvet upholstery.' },
        { id: 'p2', name: 'Imperial Sheesham King Bed Set', price: 165000, category: 'Beds', image: LOCAL_IMAGES.bed, description: 'Solid Rosewood bed with tufted headboard.' },
        { id: 'p3', name: 'Handcrafted 6-Seater Sheesham Dining Table', price: 125000, category: 'Dining', image: LOCAL_IMAGES.dining, description: 'Anti-scratch polyurethane solid wood dining set.' },
        { id: 'p4', name: 'Modern Minimalist Sheesham Center Table', price: 55000, category: 'Coffee Tables', image: LOCAL_IMAGES.dining, description: 'Contemporary solid wood center table.' },
        { id: 'p5', name: 'Luxury Sheesham 3-Door Wardrobe', price: 195000, category: 'Wardrobes', image: LOCAL_IMAGES.wardrobe, description: 'Heavy-duty solid wood storage wardrobe with brass handles.' },
      ];
    }

    let responseText = '';
    let recommendedProducts: any[] = [];

    // 2. Order Tracking Intent
    if (query.includes('track') || query.includes('order') || query.includes('where is my') || query.includes('order #')) {
      const orderMatch = query.match(/#?([a-z0-9-]{4,})/i);
      let orderDetails: any = null;
      if (orderMatch && orderMatch[1] && orderMatch[1].length > 4) {
        try {
          orderDetails = await db.order.findFirst({
            where: { id: { contains: orderMatch[1] } },
            select: { id: true, status: true, createdAt: true },
          });
        } catch {}
      }
      if (orderDetails) {
        responseText = `📦 **Order Found!**\n- **Order ID:** ${orderDetails.id.slice(-8).toUpperCase()}\n- **Status:** **${orderDetails.status.toUpperCase()}**\n- **Date:** ${new Date(orderDetails.createdAt).toLocaleDateString()}\n\nOur white-glove logistics team will contact you prior to delivery!`;
      } else {
        responseText = "📦 **Order Tracking Service:**\nTo track your order status in real time, please enter your **Order ID** (e.g. `#1042` or `ORD-8821`) or visit your **Customer Dashboard → My Orders** page!";
      }
    }

    // 3. Custom Furniture & Quote Intent (English + Roman Urdu)
    else if (query.includes('custom') || query.includes('estimate') || query.includes('bespoke') || query.includes('budget') || query.includes('dimension') || query.includes('size') || query.includes('quote') || query.includes('qeemat') || query.includes('price batao') || query.includes('kitna') || query.includes('calculate')) {
      responseText = "👑 **Bespoke Furniture Studio & Custom Quote:**\nHamare yahan custom pieces bilkul aap ki pasand ke mutabiq banate hain:\n- **Wood Stains:** Natural Sheesham, Rich Walnut, Ebony Black\n- **Fabrics:** Royal Velvet, Emerald Linen, Italian Leatherette\n- **Dimensions:** Aap ki room size ke mutabiq tailored\n\nUpar **🧮 Custom Quote** tab use karein ya neeche likhein: Length x Width (inches)!";
      recommendedProducts = allProducts.slice(0, 2);
    }

    // 4. Sofa Intent (English + Roman Urdu)
    else if (query.includes('sofa') || query.includes('living') || query.includes('couch') || query.includes('seater') || query.includes('darbaar') || query.includes('baithak')) {
      responseText = "🛋️ **Luxury Sheesham Sofas:**\nHamare sofas mein **100% Solid Sheesham Wood frames**, 45-density foam, aur royal velvet upholstery hai. Sath **10-Year Guarantee** bhi milti hai!";
      recommendedProducts = allProducts.filter(p => (p.category || '').toLowerCase().includes('sofa') || p.name.toLowerCase().includes('sofa')).slice(0, 3);
    }

    // 5. Bed Intent (English + Roman Urdu)
    else if (query.includes('bed') || query.includes('bedroom') || query.includes('king') || query.includes('queen') || query.includes('palang') || query.includes('kamra') || query.includes('single')) {
      responseText = "🛏️ **Royal Sheesham Beds & Bedroom Sets:**\nHamare solid wood bed sets mein heavy-duty mortise & tenon slats, tufted headboards, aur optional soft-close storage drawers hain.";
      recommendedProducts = allProducts.filter(p => (p.category || '').toLowerCase().includes('bed') || p.name.toLowerCase().includes('bed')).slice(0, 3);
    }

    // 6. Dining Intent
    else if (query.includes('dining') || query.includes('table') || query.includes('chair') || query.includes('center') || query.includes('khana') || query.includes('mez')) {
      responseText = "🍽️ **Dining Tables & Accent Tables:**\nHamare solid timber dining tables anti-scratch polyurethane coating ke sath aate hain jo spills, heat, aur scratches resist karta hai.";
      recommendedProducts = allProducts.filter(p => (p.category || '').toLowerCase().includes('din') || p.name.toLowerCase().includes('table')).slice(0, 3);
    }

    // 7. Wardrobe Intent
    else if (query.includes('wardrobe') || query.includes('storage') || query.includes('cabinet') || query.includes('closet') || query.includes('almari') || query.includes('almaari')) {
      responseText = "🚪 **Solid Wood Wardrobes & Storage Units:**\nSolid Sheesham doors, soft-close German hinges, solid brass handles, aur customizable hanging rods ke sath!";
      recommendedProducts = allProducts.filter(p => (p.category || '').toLowerCase().includes('wardrobe') || (p.category || '').toLowerCase().includes('storage')).slice(0, 3);
    }

    // 8. Wood Quality & Guarantee Intent
    else if (query.includes('sheesham') || query.includes('wood') || query.includes('walnut') || query.includes('quality') || query.includes('guarantee') || query.includes('warranty') || query.includes('termite') || query.includes('lakdi') || query.includes('solid')) {
      responseText = "🪵 **Sheesham Wood Craftsmanship & 10-Year Guarantee:**\nHam **100% Kiln-Seasoned Solid Sheesham Wood (Rosewood)** use karte hain. 30-day seasoning aur anti-termite treatment se zero warping, cracking, ya moisture degradation guaranteed hai. Har piece ke sath official **10-Year Craftsmanship Guarantee** milti hai!";
    }

    // 9. Pricing Intent
    else if (query.includes('price') || query.includes('cost') || query.includes('rate') || query.includes('discount') || query.includes('sale') || query.includes('payment') || query.includes('cod') || query.includes('sasta') || query.includes('mehnga')) {
      responseText = "💰 **Pricing & Payment Options:**\n- **Coffee Tables:** Starting from PKR 55,000\n- **Dining Sets:** Starting from PKR 125,000\n- **King Bed Sets:** Starting from PKR 165,000\n\nHam **Cash on Delivery (COD)**, Debit/Credit Cards, aur Direct Bank Transfer accept karte hain — 100% secure SSL checkout ke sath!";
    }

    // 10. Delivery & Location Intent
    else if (query.includes('delivery') || query.includes('ship') || query.includes('lahore') || query.includes('karachi') || query.includes('islamabad') || query.includes('location') || query.includes('showroom') || query.includes('address') || query.includes('kahan')) {
      responseText = "🚚 **White-Glove Nationwide Delivery & Showroom:**\n- **Free Delivery** across Lahore, Karachi, Islamabad, Rawalpindi, Multan aur Pakistan bhar.\n- **Delivery Time:** 3–5 days catalog, 10–14 days custom orders.\n- **Showroom:** Lahore, Pakistan (Appointment pe visit karein).";
    }

    // 11. Package / Bundle Intent
    else if (query.includes('package') || query.includes('bundle') || query.includes('set') || query.includes('room package') || query.includes('offer')) {
      responseText = "🎁 **Room Package Deals — Special Savings:**\n- **Living Room Package:** Sofa + Center Table + TV Unit — **Save PKR 25,000**\n- **Bedroom Package:** Bed + Wardrobe + Dresser — **Save PKR 30,000**\n- **Dining Package:** Table + 6 Chairs + Showcase — **Save PKR 20,000**\n\nIn bundles ko 1-Click add karne ke liye neeche dekh!";
      recommendedProducts = allProducts.slice(0, 3);
    }

    // 12. Salam / Greeting Intent
    else if (query.includes('salam') || query.includes('hello') || query.includes('hi') || query.includes('assalam') || query.includes('asslam') || query.includes('hey') || query.includes('helo')) {
      responseText = "Wa Alaikum Assalam! 👑 **FAHAD ALI INTERIOR** mein khush aamdeed!\n\nMain aap ka **Royal AI Furniture Consultant** hoon. Aap ko kisi bhi furniture, custom order, ya interior design mein madad kar sakta hoon.\n\nAap kia dhundh rahe hain aaj?";
      recommendedProducts = allProducts.slice(0, 3);
    }

    // 13. General Search — keyword match in DB
    else {
      const searchMatches = allProducts.filter(p =>
        p.name.toLowerCase().includes(query) ||
        (p.category || '').toLowerCase().includes(query) ||
        (p.description || '').toLowerCase().includes(query)
      );

      if (searchMatches.length > 0) {
        responseText = `✨ **${searchMatches.length} items** mile "${message}" ke liye hamare luxury catalog mein:`;
        recommendedProducts = searchMatches.slice(0, 3);
      } else {
        responseText = `Assalam-o-Alaikum! 👑 **FAHAD ALI INTERIOR** mein khush aamdeed!\n\nMujhe batayein — kia aap ko **sofa, bed, dining table, wardrobe, ya custom furniture** chahiye? Main aap ke liye best options dhundh deta hoon!`;
        recommendedProducts = allProducts.slice(0, 3);
      }
    }

    if (recommendedProducts.length === 0 && allProducts.length > 0) {
      recommendedProducts = allProducts.slice(0, 3);
    }

    // ✅ Correct response format — matches AiEmployeeWidget expectations
    return NextResponse.json({
      success: true,
      data: {
        replyText: responseText,
        products: recommendedProducts,
        suggestedPrompts: SUGGESTED_PROMPTS,
      },
    });

  } catch (err: any) {
    return NextResponse.json({
      success: true,
      data: {
        replyText: "Assalam-o-Alaikum! **FAHAD ALI INTERIOR** mein khush aamdeed 👑\nAap ke furniture ke baare mein kia jaanna chahte hain?",
        products: [],
        suggestedPrompts: SUGGESTED_PROMPTS,
      },
    });
  }
}
