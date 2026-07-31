import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { INITIAL_PRODUCTS, INITIAL_BANNERS, INITIAL_AD_BANNER, PINCODES_DB, INITIAL_QUERIES, INITIAL_ORDERS } from './src/data/initialData';
import { Product, Banner, AdBanner, Order, OrderStatus, CustomerQuery, WalletTransaction } from './src/types';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// In-memory persistent state (simulating MongoDB / DB persistence)
let products: Product[] = [...INITIAL_PRODUCTS];
let banners: Banner[] = [...INITIAL_BANNERS];
let adBanner: AdBanner = { ...INITIAL_AD_BANNER };
let orders: Order[] = [...INITIAL_ORDERS];
let queries: CustomerQuery[] = [...INITIAL_QUERIES];
let userWalletCoins = 250; // Welcome signup coins
let walletHistory: WalletTransaction[] = [
  {
    id: 'wt1',
    type: 'ADMIN_CREDIT',
    coins: 250,
    description: 'Welcome Bonus for joining SareeKart!',
    date: new Date().toISOString().split('T')[0],
  },
];

// Initialize Gemini Client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// ================= API ROUTES ================= //

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'SareeKart API Engine' });
});

// Products Endpoints
app.get('/api/products', (req, res) => {
  const { category, search, tag, flashSale } = req.query;
  let result = [...products];

  if (category && category !== 'All') {
    result = result.filter((p) => p.category.toLowerCase() === String(category).toLowerCase());
  }

  if (flashSale === 'true') {
    result = result.filter((p) => p.isFlashSale);
  }

  if (tag) {
    result = result.filter((p) => p.tags.some((t) => t.toLowerCase() === String(tag).toLowerCase()));
  }

  if (search) {
    const q = String(search).toLowerCase();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.fabric.toLowerCase().includes(q) ||
        p.work.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  res.json({ success: true, count: result.length, products: result });
});

app.post('/api/products', (req, res) => {
  const newProduct: Product = {
    ...req.body,
    id: `p_${Date.now()}`,
    rating: req.body.rating || 5.0,
    reviewCount: req.body.reviewCount || 1,
    rewardPoints: req.body.rewardPoints || Math.floor(req.body.salePrice * 0.05),
    inStock: req.body.stockCount > 0,
  };
  products.unshift(newProduct);
  res.status(201).json({ success: true, product: newProduct });
});

app.put('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }
  products[index] = { ...products[index], ...req.body };
  res.json({ success: true, product: products[index] });
});

app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;
  products = products.filter((p) => p.id !== id);
  res.json({ success: true, message: 'Product deleted' });
});

// Banners Endpoints
app.get('/api/banners', (req, res) => {
  res.json({ success: true, banners, adBanner });
});

app.post('/api/banners', (req, res) => {
  const newBanner: Banner = {
    ...req.body,
    id: `b_${Date.now()}`,
    active: true,
  };
  banners.push(newBanner);
  res.status(201).json({ success: true, banners });
});

app.put('/api/banners/:id', (req, res) => {
  const { id } = req.params;
  const index = banners.findIndex((b) => b.id === id);
  if (index !== -1) {
    banners[index] = { ...banners[index], ...req.body };
  }
  res.json({ success: true, banners });
});

app.put('/api/ad-banner', (req, res) => {
  adBanner = { ...adBanner, ...req.body };
  res.json({ success: true, adBanner });
});

// Pincode Verification Endpoint
app.get('/api/pincode/:code', (req, res) => {
  const { code } = req.params;
  if (PINCODES_DB[code]) {
    res.json({ success: true, info: PINCODES_DB[code] });
  } else if (/^\d{6}$/.test(code)) {
    // Generate valid estimate for standard 6 digit Indian pincode
    const isMetro = ['11', '40', '56', '70', '50', '60'].some((prefix) => code.startsWith(prefix));
    res.json({
      success: true,
      info: {
        pincode: code,
        city: isMetro ? 'Metro Region' : 'Regional Location',
        state: 'India',
        deliveryDays: isMetro ? 2 : 4,
        codAvailable: true,
        deliveryFee: 0,
      },
    });
  } else {
    res.status(400).json({ success: false, message: 'Invalid 6-digit Pincode' });
  }
});

// Mock Firebase OTP Auth
app.post('/api/auth/send-otp', (req, res) => {
  const { phone } = req.body;
  if (!phone || phone.length < 10) {
    return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit mobile number' });
  }
  res.json({
    success: true,
    message: `OTP sent successfully to +91 ${phone}. Use default OTP: 123456`,
    mockOtp: '123456',
  });
});

app.post('/api/auth/verify-otp', (req, res) => {
  const { phone, otp } = req.body;
  if (otp === '123456' || otp === '111111') {
    res.json({
      success: true,
      user: {
        name: 'Royal SareeKart Patron',
        phone,
        email: 'patron@sareekart.com',
        walletCoins: userWalletCoins,
        isLoggedIn: true,
      },
    });
  } else {
    res.status(400).json({ success: false, message: 'Invalid OTP. Enter 123456 for instant login.' });
  }
});

// Orders Endpoint
app.get('/api/orders', (req, res) => {
  res.json({ success: true, count: orders.length, orders });
});

app.post('/api/orders', (req, res) => {
  const orderData = req.body;
  const initialStatus: OrderStatus = 'Weaving';
  const nowStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const newOrder: Order = {
    ...orderData,
    id: `SK_${Date.now().toString().slice(-6)}`,
    status: initialStatus,
    currentLocation: 'Varanasi Handloom Weaving Cluster, UP',
    masterWeaver: 'Ustad Rameshwar Shastri (Loom #18)',
    stageHistory: [
      {
        stage: 'Weaving',
        timestamp: `Today, ${nowStr}`,
        location: 'Varanasi Handloom Weaving Cluster, UP',
        note: 'Artisan hand-spinning pure 24k gold zari thread onto traditional wooden loom shuttle.',
        completed: false,
      },
    ],
    orderDate: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    estimatedDelivery: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
  };

  orders.unshift(newOrder);

  // Credit earned reward coins to wallet
  if (newOrder.earnedCoins > 0) {
    userWalletCoins += newOrder.earnedCoins;
    walletHistory.unshift({
      id: `wt_${Date.now()}`,
      type: 'EARNED',
      coins: newOrder.earnedCoins,
      description: `Earned Coins for Order #${newOrder.id}`,
      date: new Date().toISOString().split('T')[0],
    });
  }

  // Deduct coins if used
  if (newOrder.coinsUsed > 0) {
    userWalletCoins = Math.max(0, userWalletCoins - newOrder.coinsUsed);
    walletHistory.unshift({
      id: `wt_${Date.now()}_deduct`,
      type: 'REDEEMED',
      coins: newOrder.coinsUsed,
      description: `Redeemed Coins on Order #${newOrder.id}`,
      date: new Date().toISOString().split('T')[0],
    });
  }

  res.status(201).json({ success: true, order: newOrder, currentCoins: userWalletCoins });
});

app.put('/api/orders/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, note, location, courierName, trackingId } = req.body;
  const order = orders.find((o) => o.id === id);

  if (order) {
    order.status = status;
    if (courierName) order.courierPartner = courierName;
    if (trackingId) order.trackingNumber = trackingId;

    const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    if (!order.stageHistory) order.stageHistory = [];

    // Mark previous steps as completed
    order.stageHistory.forEach((step) => {
      step.completed = true;
    });

    const defaultNotes: Record<OrderStatus, string> = {
      Placed: 'Order successfully placed & payment verified.',
      Weaving: 'Handloom weaving in progress on traditional pit loom.',
      'Quality Check': 'Silk Mark Authority lab inspection & zari purity verified.',
      Packed: 'Sealed in royal velvet keepsake box with lavender pouch.',
      'Out for Delivery': 'Out for final doorstep delivery by courier agent.',
      Delivered: 'Safely delivered to patron address.',
      CANCELLED: 'Order cancelled.',
    };

    const defaultLocations: Record<OrderStatus, string> = {
      Placed: 'Order Processing Desk, Varanasi',
      Weaving: 'Varanasi Weaving Hub, UP',
      'Quality Check': 'Kanchipuram Quality Certification Desk',
      Packed: 'Central Fulfillment Hub, Bengaluru',
      'Out for Delivery': 'Local City Dispatch Hub',
      Delivered: 'Patron Destination Address',
      CANCELLED: 'Cancellation Processing',
    };

    const newStep = {
      stage: status as OrderStatus,
      timestamp: `Today, ${timeStr}`,
      location: location || defaultLocations[status as OrderStatus] || 'Logistics Center',
      note: note || defaultNotes[status as OrderStatus] || `Order updated to ${status}`,
      completed: status === 'Delivered',
    };

    const existingIndex = order.stageHistory.findIndex((h) => h.stage === status);
    if (existingIndex >= 0) {
      order.stageHistory[existingIndex] = newStep;
    } else {
      order.stageHistory.push(newStep);
    }

    order.currentLocation = newStep.location;
    res.json({ success: true, order });
  } else {
    res.status(404).json({ success: false, message: 'Order not found' });
  }
});

// Wallet Endpoint
app.get('/api/wallet', (req, res) => {
  res.json({ success: true, walletCoins: userWalletCoins, history: walletHistory });
});

app.post('/api/wallet/credit', (req, res) => {
  const { coins, reason } = req.body;
  const amount = Number(coins) || 100;
  userWalletCoins += amount;
  walletHistory.unshift({
    id: `wt_${Date.now()}`,
    type: 'ADMIN_CREDIT',
    coins: amount,
    description: reason || 'SareeKart Festive Reward Bonus',
    date: new Date().toISOString().split('T')[0],
  });
  res.json({ success: true, walletCoins: userWalletCoins, history: walletHistory });
});

// Queries Endpoint
app.get('/api/queries', (req, res) => {
  res.json({ success: true, queries });
});

app.post('/api/queries', (req, res) => {
  const newQuery: CustomerQuery = {
    id: `q_${Date.now()}`,
    userName: req.body.userName || 'Anonymous Customer',
    phone: req.body.phone || 'N/A',
    subject: req.body.subject || 'General Inquiry',
    message: req.body.message,
    status: 'OPEN',
    date: new Date().toISOString().split('T')[0],
  };
  queries.unshift(newQuery);
  res.status(201).json({ success: true, query: newQuery });
});

app.put('/api/queries/:id/resolve', (req, res) => {
  const { id } = req.params;
  const q = queries.find((item) => item.id === id);
  if (q) {
    q.status = 'RESOLVED';
    res.json({ success: true, query: q });
  } else {
    res.status(404).json({ success: false, message: 'Query not found' });
  }
});

// AI Saree Stylist & Visual Image Search Endpoint
app.post('/api/ai/stylist', async (req, res) => {
  try {
    const { prompt, occasion, fabricPreference, budget, imageBase64 } = req.body;
    const aiClient = getGeminiClient();

    if (!aiClient) {
      // Fallback response if API key is not yet set up
      return res.json({
        success: true,
        reply: `Namaste! As your SareeKart AI Stylist, I recommend our royal **Banarasi Katan Silk Saree** or lightweight **Chanderi Gold Tissue Saree** for your special occasion. Both feature exquisite zari craftsmanship and come with high reward points!`,
        recommendedProductIds: ['p1', 'p3'],
      });
    }

    const availableInventorySummary = products
      .map((p) => `ID: ${p.id} | Name: ${p.name} | Category: ${p.category} | Price: ₹${p.salePrice} | Fabric: ${p.fabric}`)
      .join('\n');

    const systemInstruction = `You are "SareeKart AI Stylist", a world-class Indian Saree Expert and Personal Fashion Stylist.
    You help customers find the perfect saree based on occasion (wedding, reception, festive puja, office, farewell), body drape styling tips, color combinations, blouse design ideas, and budget.
    Always speak with warmth, royal Indian hospitality ("Namaste!"), and expert saree knowledge.
    
    Here is SareeKart's active inventory:
    ${availableInventorySummary}

    When giving advice, recommend 1-3 specific products from our inventory by mentioning their exact product names and prices.
    At the end of your response, ALWAYS include a JSON array of recommended product IDs in this exact format on a new line:
    RECOMMENDED_IDS: ["p1", "p2"]
    `;

    const parts: any[] = [];
    if (imageBase64) {
      // Image visual search mode
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Data,
        },
      });
      parts.push({
        text: `Analyze this saree image uploaded by the customer. Identify its pattern, color, fabric style, and find the closest matching sarees from our SareeKart inventory.`,
      });
    } else {
      let queryText = prompt || `Help me pick a saree for ${occasion || 'a special occasion'}.`;
      if (fabricPreference) queryText += ` I prefer ${fabricPreference} fabric.`;
      if (budget) queryText += ` My budget is under ₹${budget}.`;
      parts.push({ text: queryText });
    }

    let response;
    try {
      response = await aiClient.models.generateContent({
        model: 'gemini-flash-latest',
        contents: { parts },
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });
    } catch (_apiErr: any) {
      // Quietly use curated smart fallback if API call fails or quota limit is reached
    }

    if (response && response.text) {
      const replyText = response.text;
      const idMatch = replyText.match(/RECOMMENDED_IDS:\s*(\[[^\]]+\])/);
      let recommendedProductIds: string[] = ['p1', 'p2'];
      if (idMatch) {
        try {
          recommendedProductIds = JSON.parse(idMatch[1]);
        } catch (e) {
          // Fallback
        }
      }

      const cleanReply = replyText.replace(/RECOMMENDED_IDS:\s*\[[^\]]+\]/, '').trim();

      return res.json({
        success: true,
        reply: cleanReply,
        recommendedProductIds,
      });
    }

    res.json({
      success: true,
      reply: 'Namaste! As your SareeKart AI Stylist, I recommend our royal Banarasi Katan Silk Saree or lightweight Chanderi Gold Tissue Saree for your special occasion. Both feature exquisite zari craftsmanship and come with high reward points!',
      recommendedProductIds: ['p1', 'p2'],
    });
  } catch (error: any) {
    console.warn('Gemini AI fallback active:', error?.message || error);
    res.json({
      success: true,
      reply: 'Namaste! As your SareeKart AI Stylist, I recommend our royal Banarasi Katan Silk Saree or lightweight Chanderi Gold Tissue Saree for your special occasion. Both feature exquisite zari craftsmanship and come with high reward points!',
      recommendedProductIds: ['p1', 'p2'],
    });
  }
});

// Advanced AI Style Recommendation Engine Endpoint
app.post('/api/ai/recommendations', async (req, res) => {
  try {
    const { browsingHistory = [], pastPurchases = [], preferences = {}, imageBase64 } = req.body;
    const aiClient = getGeminiClient();

    // Map browsing history and purchases to actual product details
    const viewedProducts = products.filter((p) => browsingHistory.includes(p.id) || browsingHistory.includes(p.name));
    const purchasedProducts = products.filter((p) => pastPurchases.includes(p.id) || pastPurchases.includes(p.name));

    const inventoryDetails = products.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: p.salePrice,
      fabric: p.fabric,
      work: p.work,
      tags: p.tags,
      isBestseller: p.isBestseller,
    }));

    const getFallbackRecommendations = () => {
      let matchedProds = [...products];

      if (preferences.category && preferences.category !== 'All') {
        matchedProds = matchedProds.filter(p => p.category.toLowerCase().includes(String(preferences.category).toLowerCase()));
      }
      if (preferences.fabric && preferences.fabric !== 'All') {
        matchedProds = matchedProds.filter(p => p.fabric.toLowerCase().includes(String(preferences.fabric).toLowerCase()));
      }
      if (preferences.maxPrice && Number(preferences.maxPrice) > 0) {
        matchedProds = matchedProds.filter(p => p.salePrice <= Number(preferences.maxPrice));
      }

      if (matchedProds.length === 0) matchedProds = products.slice(0, 4);

      const recommendations = matchedProds.slice(0, 4).map((p, idx) => ({
        productId: p.id,
        matchPercentage: 98 - idx * 4,
        matchReason: `Aligns with your preference for ${preferences.fabric || p.fabric} and ${preferences.occasion || 'festive occasions'}.`,
        styleTip: `Pair with gold jhumkas and a contrasting silk blouse for a regal look.`,
      }));

      return {
        success: true,
        stylePersona: preferences.occasion ? `${preferences.occasion} Style Connoisseur` : 'Royal Heritage Connoisseur',
        stylistAnalysis: `Based on your interest in ${viewedProducts.length} recent saree views and preference for ${preferences.fabric || 'fine silk'}, our AI engine curated these top matching sarees for you.`,
        recommendations,
      };
    };

    if (!aiClient) {
      return res.json(getFallbackRecommendations());
    }

    const promptPayload = {
      browsingHistory: viewedProducts.map(p => ({ name: p.name, category: p.category, fabric: p.fabric, price: p.salePrice })),
      pastPurchases: purchasedProducts.map(p => ({ name: p.name, category: p.category })),
      userPreferences: preferences,
      catalog: inventoryDetails,
    };

    const systemInstruction = `You are the master AI Style Recommendation Engine for SareeKart, the world's premier Indian Saree destination.
    Analyze the user's signals (Browsing History, Past Purchases, Explicit Preferences like Occasion, Fabric, Color Palette, Budget, or uploaded Outfit Image).

    Return ONLY a valid JSON object with NO markdown code block formatting (or pure JSON) with the following structure:
    {
      "stylePersona": "A catchy regal persona name (e.g. 'Royal Banarasi Heritage Connoisseur')",
      "stylistAnalysis": "A 2-3 sentence personalized analysis explaining how their browsing behavior and preferences influenced these picks.",
      "recommendations": [
        {
          "productId": "valid product ID from catalog",
          "matchPercentage": 96,
          "matchReason": "Detailed explanation linking their history/preference to this item",
          "styleTip": "Accessorizing, blouse design, or draping tip for this item"
        }
      ]
    }`;

    const parts: any[] = [];
    if (imageBase64) {
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Data,
        },
      });
      parts.push({
        text: `Analyze this uploaded outfit/saree image. Match it visually (color, border pattern, zari work, fabric texture) against our catalog and rank the best 3-4 matches. User preferences: ${JSON.stringify(preferences)}. Catalog: ${JSON.stringify(inventoryDetails)}`,
      });
    } else {
      parts.push({
        text: `Analyze customer signals and pick the top 3-4 best saree recommendations from catalog. Context: ${JSON.stringify(promptPayload)}`,
      });
    }

    let response;
    try {
      response = await aiClient.models.generateContent({
        model: 'gemini-flash-latest',
        contents: { parts },
        config: {
          systemInstruction,
          temperature: 0.5,
          responseMimeType: 'application/json',
        },
      });
    } catch (_apiErr: any) {
      // Quietly fall back to catalog match algorithm when API call fails or quota is reached
    }

    if (response && response.text) {
      const jsonText = response.text || '{}';
      let parsedData: any = {};
      try {
        parsedData = JSON.parse(jsonText.trim().replace(/^```json\n?/, '').replace(/\n?```$/, ''));
      } catch (e) {
        console.warn('Failed to parse AI recommendations JSON', e);
      }

      if (parsedData.recommendations && Array.isArray(parsedData.recommendations) && parsedData.recommendations.length > 0) {
        return res.json({
          success: true,
          ...parsedData,
        });
      }
    }

    return res.json(getFallbackRecommendations());
  } catch (_err: any) {
    res.json({
      success: true,
      stylePersona: 'Royal Saree Connoisseur',
      stylistAnalysis: 'Handpicked bestsellers based on your active browsing context.',
      recommendations: products.slice(0, 4).map((p, i) => ({
        productId: p.id,
        matchPercentage: 94 - i * 3,
        matchReason: `Top rated ${p.category} saree matching your style preferences.`,
        styleTip: `Ideal for festive occasions and family celebrations.`,
      })),
    });
  }
});

// AI 5-Question Style Quiz Endpoint
app.post('/api/ai/style-quiz', async (req, res) => {
  try {
    const { answers } = req.body;
    const { occasion, palette, fabric, drapeVibe, jewelryStyle } = answers || {};
    const aiClient = getGeminiClient();

    const inventoryDetails = products.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: p.salePrice,
      fabric: p.fabric,
      work: p.work,
      tags: p.tags,
      isBestseller: p.isBestseller,
    }));

    const getFallbackQuizResult = () => {
      let matched = [...products];
      if (fabric) {
        const fabLower = String(fabric).toLowerCase();
        const fabMatches = matched.filter((p) => p.fabric.toLowerCase().includes(fabLower) || p.category.toLowerCase().includes(fabLower));
        if (fabMatches.length > 0) matched = fabMatches;
      }

      const topProducts = matched.slice(0, 3);
      return {
        success: true,
        personaTitle: `${occasion || 'Festive'} ${fabric || 'Silk'} Connoisseur`,
        personaDescription: `Your style profile radiates elegance and refined Indian heritage. You appreciate ${fabric || 'luxurious textures'}, paired with ${palette || 'striking color harmonies'} and ${drapeVibe || 'graceful draping silhouettes'}.`,
        recommendedColors: ['#9D174D', '#D97706', '#047857', '#F59E0B'],
        blouseStyleTip: 'Elbow-length embroidered sleeves with a deep sweet-heart neckline or high boat neck.',
        drapeTip: 'Nivi drape with neatly pinned pleated pallu pinned at the left shoulder to highlight zari borders.',
        jewelryTip: jewelryStyle || 'Antique gold Kundan jhumkas and matching matha patti.',
        recommendedProductIds: topProducts.map((p) => p.id),
        matchReasons: topProducts.map((p) => `98% match for your ${fabric || 'silk'} preference & ${occasion || 'festive'} occasion.`),
      };
    };

    if (!aiClient) {
      return res.json(getFallbackQuizResult());
    }

    const systemInstruction = `You are "SareeKart AI Style Guru", a top celebrity saree stylist in India.
    A user completed a 5-question style quiz:
    - Occasion: ${occasion}
    - Color Palette Preference: ${palette}
    - Preferred Fabric: ${fabric}
    - Drape Vibe: ${drapeVibe}
    - Jewelry & Accessory Style: ${jewelryStyle}

    Given our active saree catalog: ${JSON.stringify(inventoryDetails)}

    Return ONLY a valid JSON object (no markdown, or pure JSON) formatted exactly like this:
    {
      "personaTitle": "A creative 3-4 word regal style title (e.g. 'Royal Banarasi Heritage Maven' or 'Chic Pastel Organza Princess')",
      "personaDescription": "2-3 insightful, enthusiastic sentences summarizing their aesthetic archetype and why these choices suit them.",
      "recommendedColors": ["#9D174D", "#D97706", "#047857"],
      "blouseStyleTip": "Specific blouse cut, sleeve length, and neckline recommendation.",
      "drapeTip": "Specific draping technique recommendation (e.g. Pleated Pallu, Floating Pallu, Seedha Pallu).",
      "jewelryTip": "Accessorizing and footwear recommendation.",
      "recommendedProductIds": ["p1", "p2", "p3"],
      "matchReasons": ["Why product 1 fits their quiz choices", "Why product 2 fits", "Why product 3 fits"]
    }`;

    let response;
    try {
      response = await aiClient.models.generateContent({
        model: 'gemini-flash-latest',
        contents: { parts: [{ text: 'Generate personalized Saree Style Profile JSON based on quiz answers.' }] },
        config: {
          systemInstruction,
          temperature: 0.6,
          responseMimeType: 'application/json',
        },
      });
    } catch (_apiErr: any) {
      // Quietly fall back to quiz fallback result
    }

    if (response && response.text) {
      try {
        const jsonText = response.text || '{}';
        const parsedData = JSON.parse(jsonText.trim().replace(/^```json\n?/, '').replace(/\n?```$/, ''));
        if (parsedData.personaTitle) {
          return res.json({
            success: true,
            ...parsedData,
          });
        }
      } catch (e) {
        console.warn('Failed to parse quiz response', e);
      }
    }

    return res.json(getFallbackQuizResult());
  } catch (_err: any) {
    res.json({
      success: true,
      personaTitle: 'Royal Heritage Saree Maven',
      personaDescription: 'You possess timeless taste for rich Indian drapes, opulent borders, and graceful ethnic silhouettes.',
      recommendedColors: ['#9D174D', '#D97706', '#047857'],
      blouseStyleTip: 'Classic elbow-length sleeves with intricate zari piping.',
      drapeTip: 'Traditional Nivi drape with crisp 6-inch pleats.',
      jewelryTip: 'Grand temple jewelry with red rubies and emerald drops.',
      recommendedProductIds: products.slice(0, 3).map((p) => p.id),
      matchReasons: ['Bestselling royal silk saree matching your occasion.', 'Lightweight luxury weave.', 'Classic festive highlight.'],
    });
  }
});

// Serve Vite dev server or production static assets
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌸 SareeKart Server running on http://0.0.0.0:${PORT}`);
  });
}

setupServer();
