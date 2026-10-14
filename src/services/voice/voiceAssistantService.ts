// Define speech recognition types as they might not be fully supported in all TS environments
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

import { Product } from '../../types/index.ts';

export type VoiceLanguage = 'en-US' | 'hi-IN';

export type CommandAction =
  | 'add_product'
  | 'update_stock'
  | 'change_price'
  | 'pause_shop'
  | 'resume_shop'
  | 'check_shop_status'
  | 'show_products'
  | 'check_stock'
  | 'show_orders'
  | 'lookup_order'
  | 'mark_order_ready'
  | 'unknown';

export interface CommandParams {
  productName?: string;
  price?: number;
  quantity?: number;
  unit?: string;
  orderId?: string;
}

export interface Command {
  action: CommandAction;
  rawTranscript: string;
  params: CommandParams;
  missingFields?: string[];
  validationErrors?: string[];
  requiresConfirmation: boolean;
}

export const speak = (text: string, language: VoiceLanguage = 'en-US') => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('[VoiceAssistant] Speech synthesis error:', err);
  }
};

export const isSpeechRecognitionSupported = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
};

export const getSpeechRecognition = () => {
  if (typeof window === 'undefined') return null;
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  return SpeechRecognition ? new SpeechRecognition() : null;
};

/**
 * Normalizes units into standard marketplace formats: kg, packet, piece, litre, gram, etc.
 */
export function normalizeUnit(raw?: string): string {
  if (!raw) return 'piece';
  const r = raw.trim().toLowerCase();
  if (/^(kg|kgs|kilo|kilos|kilogram|kilograms|किलो|किलोग्राम)$/i.test(r)) return 'kg';
  if (/^(pkt|pkts|packet|packets|pack|packs|पैकेट)$/i.test(r)) return 'packet';
  if (/^(pc|pcs|piece|pieces|unit|units|नग|पीस)$/i.test(r)) return 'piece';
  if (/^(l|lt|ltr|ltrs|liter|liters|litre|litres|लीटर)$/i.test(r)) return 'litre';
  if (/^(g|gm|gms|gram|grams|ग्राम)$/i.test(r)) return 'gram';
  if (/^(btl|btls|bottle|bottles|बोतल)$/i.test(r)) return 'bottle';
  if (/^(box|boxes|डिब्बा)$/i.test(r)) return 'box';
  if (/^(dz|dozen|दर्जन)$/i.test(r)) return 'dozen';
  return r;
}

/**
 * Helper to parse spoken numbers including words and digits.
 */
const NUMBER_WORD_MAP: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
  sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,
  twentyfive: 25, thirty: 30, thirtyfive: 35, forty: 40, fortyfive: 45,
  fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90, hundred: 100,
  // Hindi number words
  एक: 1, दो: 2, तीन: 3, चार: 4, पांच: 5, पाँच: 5,
  छह: 6, सात: 7, आठ: 8, नौ: 9, दस: 10,
  ग्यारह: 11, बारह: 12, तेरह: 13, चौदह: 14, पंद्रह: 15,
  सोलह: 16, सत्रह: 17, अठारह: 18, उन्नीस: 19, बीस: 20,
  पच्चीस: 25, तीस: 30, पैंतीस: 35, चालीस: 40, पचास: 50,
  साठ: 60, सत्तर: 70, अस्सी: 80, नब्बे: 90, सौ: 100
};

export function parseNumber(raw?: string): number | undefined {
  if (!raw) return undefined;
  const cleaned = raw.trim().toLowerCase();
  const digitMatch = cleaned.match(/(\d+(?:\.\d+)?)/);
  if (digitMatch) {
    const num = parseFloat(digitMatch[1]);
    return isNaN(num) ? undefined : num;
  }
  const cleanWord = cleaned.replace(/[^a-z\u0900-\u097F]/g, '');
  if (NUMBER_WORD_MAP[cleanWord] !== undefined) {
    return NUMBER_WORD_MAP[cleanWord];
  }
  return undefined;
}

/**
 * Normalizes text for comparison by removing punctuation and extra spaces.
 */
export function cleanText(text: string): string {
  return text
    .toLowerCase()
    .replace(/₹/g, ' ')
    .replace(/[,\/#!$%\^&\*;:{}=`~()?"']/g, ' ')
    // Replace period only if not between digits
    .replace(/(?!\b\d+\.\d+\b)\./g, ' ')
    // Replace hyphens only when surrounded by whitespace or not between alphanumeric
    .replace(/(?<![a-z0-9])-|-(?![a-z0-9])/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Removes singular/plural variations (e.g. tomatoes -> tomato, apples -> apple).
 */
export function stemWord(word: string): string {
  const w = word.trim().toLowerCase();
  if (w.endsWith('ies') && w.length > 4) return w.slice(0, -3) + 'y';
  if (w.endsWith('es') && w.length > 3) return w.slice(0, -2);
  if (w.endsWith('s') && !w.endsWith('ss') && w.length > 2) return w.slice(0, -1);
  return w;
}

export function stemmedPhrase(phrase: string): string {
  return phrase.split(' ').map(stemWord).join(' ');
}

export interface ProductMatchResult {
  status: 'exact' | 'ambiguous' | 'not_found';
  product?: Product;
  matches?: Product[];
  candidateName: string;
}

/**
 * Matches a spoken product name against the vendor's actual catalog.
 */
export function matchVendorProduct(queryName: string, vendorProducts: Product[]): ProductMatchResult {
  const cleanedQuery = cleanText(queryName);
  const stemmedQuery = stemmedPhrase(cleanedQuery);

  if (!cleanedQuery || vendorProducts.length === 0) {
    return { status: 'not_found', candidateName: queryName };
  }

  // 1. Exact match (case & whitespace insensitive)
  const exact = vendorProducts.find(
    (p) => cleanText(p.name) === cleanedQuery || stemmedPhrase(cleanText(p.name)) === stemmedQuery
  );
  if (exact) {
    return { status: 'exact', product: exact, candidateName: queryName };
  }

  // 2. Full phrase substring match (e.g. "basmati rice" inside "Organic Basmati Rice")
  const phraseMatches = vendorProducts.filter((p) => {
    const pClean = cleanText(p.name);
    const pStem = stemmedPhrase(pClean);
    return (
      pClean.includes(cleanedQuery) ||
      pStem.includes(stemmedQuery) ||
      (cleanedQuery.length > 3 && (cleanedQuery.includes(pClean) || stemmedQuery.includes(pStem)))
    );
  });

  if (phraseMatches.length === 1) {
    return { status: 'exact', product: phraseMatches[0], candidateName: queryName };
  }

  if (phraseMatches.length > 1) {
    // If one candidate is an exact match for one of the primary words
    const exactWordMatch = phraseMatches.filter((p) => cleanText(p.name).split(' ').includes(cleanedQuery));
    if (exactWordMatch.length === 1) {
      return { status: 'exact', product: exactWordMatch[0], candidateName: queryName };
    }
    return { status: 'ambiguous', matches: phraseMatches, candidateName: queryName };
  }

  // 3. Token match: check if key tokens match (when full phrase did not match)
  const queryTokens = stemmedQuery.split(' ').filter((t) => t.length > 2);
  if (queryTokens.length === 0) {
    return { status: 'not_found', candidateName: queryName };
  }

  // Score candidates by how many query tokens they match
  const scored = vendorProducts
    .map((p) => {
      const pClean = cleanText(p.name);
      const pStem = stemmedPhrase(pClean);
      const pTokens = pStem.split(' ').concat(pClean.split(' '));
      const matchCount = queryTokens.filter((t) => pTokens.includes(t)).length;
      return { product: p, matchCount };
    })
    .filter((item) => item.matchCount > 0);

  if (scored.length === 0) {
    return { status: 'not_found', candidateName: queryName };
  }

  // Find maximum match count
  const maxScore = Math.max(...scored.map((s) => s.matchCount));
  const topMatches = scored.filter((s) => s.matchCount === maxScore).map((s) => s.product);

  if (topMatches.length === 1) {
    return { status: 'exact', product: topMatches[0], candidateName: queryName };
  }

  return { status: 'ambiguous', matches: topMatches, candidateName: queryName };
}

/**
 * Parses spoken English and Hindi vendor transcripts into structured commands.
 */
export const parseCommand = (transcript: string): Command => {
  const raw = transcript.trim();
  const t = cleanText(raw);

  // --------------------------------------------------------------------------
  // 1. Queries (Read-only, no confirmation required)
  // --------------------------------------------------------------------------

  // Show products / catalog
  if (
    /^(show|open|view|list|check)\s+(my\s+)?(catalog|products?|inventory|items?)$/i.test(t) ||
    t === 'show products' ||
    t === 'show my products' ||
    t.includes('mere product') ||
    t.includes('saman dikhao') ||
    t.includes('utpad dikhao') ||
    /^(सामान|उत्पाद|प्रॉडक्ट्स)\s+दिखाओ$/i.test(t) ||
    /^(mere\s+)?(products?|utpad|saman)\s+(dikhao|dekho|kholo)$/i.test(t)
  ) {
    return {
      action: 'show_products',
      rawTranscript: raw,
      params: {},
      requiresConfirmation: false,
    };
  }

  // Check low stock
  if (
    t.includes('low in stock') ||
    t.includes('low stock') ||
    t.includes('out of stock') ||
    t.includes('check stock') ||
    t.includes('check low stock') ||
    t.includes('how many items are low in stock') ||
    t.includes('how many products are low in stock') ||
    /कम\s+स्टॉक/i.test(t) ||
    /स्टॉक\s+चेक/i.test(t)
  ) {
    return {
      action: 'check_stock',
      rawTranscript: raw,
      params: {},
      requiresConfirmation: false,
    };
  }

  // Pending / new orders summary
  if (
    t.includes('new orders') ||
    t.includes('pending orders') ||
    t.includes('how many orders are pending') ||
    t.includes('show my new orders') ||
    t.includes('show orders') ||
    t.includes('view orders') ||
    t.includes('orders list') ||
    t === 'orders' ||
    /लंबित\s+ऑर्डर/i.test(t) ||
    /ऑर्डर\s+दिखाओ/i.test(t) ||
    /नए\s+ऑर्डर/i.test(t)
  ) {
    return {
      action: 'show_orders',
      rawTranscript: raw,
      params: {},
      requiresConfirmation: false,
    };
  }

  // Shop status query
  if (
    t.includes('shop status') ||
    t.includes('what is my shop status') ||
    t.includes('check shop status') ||
    /दुकान\s+की\s+स्थिति/i.test(t)
  ) {
    return {
      action: 'check_shop_status',
      rawTranscript: raw,
      params: {},
      requiresConfirmation: false,
    };
  }

  // Order lookup (e.g., "order number 123", "lookup order AAP-123456", "show order 123")
  const orderLookupMatch = t.match(
    /(?:lookup\s+order|show\s+order|order\s+number|order\s+#?|check\s+order|ऑर्डर\s+नंबर|ऑर्डर)\s+([a-zA-Z0-9\-_]+(?:\s+[0-9]+)?)/i
  );
  if (orderLookupMatch && !t.includes('ready') && !t.includes('pickup') && !t.includes('तैयार')) {
    return {
      action: 'lookup_order',
      rawTranscript: raw,
      params: { orderId: orderLookupMatch[1].trim() },
      requiresConfirmation: false,
    };
  }

  // --------------------------------------------------------------------------
  // 2. Shop Availability Management (Requires confirmation)
  // --------------------------------------------------------------------------
  if (
    /^(pause|close|stop)\s+(my\s+)?(shop|store)$/i.test(t) ||
    /^(दुकान|शॉप)\s+(बंद\s+करो|रोको)$/i.test(t) ||
    t === 'pause my shop' ||
    t === 'pause shop'
  ) {
    return {
      action: 'pause_shop',
      rawTranscript: raw,
      params: {},
      requiresConfirmation: true,
    };
  }

  if (
    /^(resume|open|start)\s+(my\s+)?(shop|store)$/i.test(t) ||
    /^(दुकान|शॉप)\s+(खोलो|चालू\s+करो)$/i.test(t) ||
    t === 'resume my shop' ||
    t === 'resume shop'
  ) {
    return {
      action: 'resume_shop',
      rawTranscript: raw,
      params: {},
      requiresConfirmation: true,
    };
  }

  // --------------------------------------------------------------------------
  // 3. Order Status Update (Requires confirmation)
  // --------------------------------------------------------------------------
  // E.g., “Mark order [order ID] as ready for pickup.” / "Order [order ID] ready for pickup"
  const markReadyMatch =
    t.match(/(?:mark\s+)?order\s+(?:#|number\s+)?([a-zA-Z0-9\-_]+(?:\s+[0-9]+)?)\s+(?:as\s+)?ready(?:\s+for\s+pickup)?/i) ||
    t.match(/ऑर्डर\s+(?:#|नंबर\s+)?([a-zA-Z0-9\-_]+(?:\s+[0-9]+)?)\s+(?:पिकअप\s+के\s+लिए\s+)?तैयार/i);

  if (markReadyMatch) {
    return {
      action: 'mark_order_ready',
      rawTranscript: raw,
      params: { orderId: markReadyMatch[1].trim() },
      requiresConfirmation: true,
    };
  }

  // --------------------------------------------------------------------------
  // 4. Add Product Command (Requires confirmation)
  // --------------------------------------------------------------------------
  // Examples:
  // - “Add tomatoes at 40 rupees per kilo with 20 kilos in stock.”
  // - “Add a product called rice, price 60 rupees per packet, stock 15 packets.”
  // - “Add a product named tomatoes at ₹40 per kilo.”
  // - "नया उत्पाद जोड़ो टमाटर भाव 40 रुपये प्रति किलो 20 किलो स्टॉक"
  if (
    t.startsWith('add ') ||
    t.startsWith('add a product') ||
    t.startsWith('add product') ||
    t.includes('जोड़ो') ||
    t.includes('नया उत्पाद')
  ) {
    // Extract price
    let price: number | undefined;
    const priceMatch =
      t.match(/(?:at|price(?:\s+is)?|cost|rate|for|भाव|दाम|कीमत|दर)\s+(\d+(?:\.\d+)?)\s*(?:rupees|rupee|rs|रुपये|रु)?/i) ||
      t.match(/(\d+(?:\.\d+)?)\s*(?:rupees|rupee|rs|रुपये|रु)\s*(?:per|\/|प्रति)/i);
    if (priceMatch) {
      price = parseFloat(priceMatch[1]);
    }

    // Extract quantity / stock
    let quantity: number | undefined;
    const qtyMatch =
      t.match(/(?:with|having|and|stock(?:\s+is)?|स्टॉक|मात्रा)\s+(\d+(?:\.\d+)?)\s*(?:kilos?|kg|packets?|pieces?|pcs|litres?|लीटर|किलो|पैकेट|नग)?(?:\s+(?:in\s+stock|stock))?/i) ||
      t.match(/(\d+(?:\.\d+)?)\s*(?:kilos?|kg|packets?|pieces?|pcs|litres?|लीटर|किलो|पैकेट|नग)?\s*(?:in\s+stock|stock|स्टॉक)/i);
    if (qtyMatch) {
      quantity = parseInt(qtyMatch[1], 10);
    }

    // Extract unit
    let unit: string | undefined;
    const unitMatch = t.match(/(?:per|\/|प्रति)\s+([a-zA-Z\u0900-\u097F]+)/i);
    if (unitMatch) {
      unit = normalizeUnit(unitMatch[1]);
    } else {
      // Look for unit mentions in qty
      const genericUnitMatch = t.match(/\b(kg|kgs|kilo|kilos|kilogram|kilograms|packet|packets|pack|packs|piece|pieces|litre|litres|liter|liters|gram|grams|bottle|bottles|box|boxes|dozen|pouch|किलो|पैकेट|लीटर|पीस)\b/i);
      if (genericUnitMatch) {
        unit = normalizeUnit(genericUnitMatch[1]);
      }
    }

    // Extract product name
    let productName: string | undefined;
    let nameSegment = t
      .replace(/^(add\s+(a\s+)?product\s+(called|named)\s+|add\s+(a\s+)?product\s+|add\s+|नया\s+उत्पाद\s+जोड़ो\s+|जोड़ो\s+)/i, '')
      .trim();

    // Strip out the price and stock clauses cleanly
    nameSegment = nameSegment
      .replace(/(?:at|price(?:\s+is)?|cost|rate|for|भाव|दाम|कीमत|दर)\s+\d+(?:\.\d+)?\s*(?:rupees|rupee|rs|रुपये|रु)?(?:\s*(?:per|\/|प्रति)\s*[a-zA-Z\u0900-\u097F]+)?/gi, ' ')
      .replace(/(?:with|having|and|stock(?:\s+is)?|स्टॉक|मात्रा)\s+\d+(?:\.\d+)?\s*(?:kilos?|kg|packets?|pieces?|pcs|litres?|लीटर|किलो|पैकेट|नग)?(?:\s+(?:in\s+stock|stock))?/gi, ' ')
      .replace(/\d+(?:\.\d+)?\s*(?:kilos?|kg|packets?|pieces?|pcs|litres?|लीटर|किलो|पैकेट|नग)?\s*(?:in\s+stock|stock|स्टॉक)/gi, ' ')
      .replace(/\d+(?:\.\d+)?\s*(?:rupees|rupee|rs|रुपये|रु)/gi, ' ')
      .replace(/(?:per|\/|प्रति)\s*[a-zA-Z\u0900-\u097F]+/gi, ' ')
      .replace(/\b(in stock|stock|left|at|for|price|cost|rate)\b/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (nameSegment.length > 0) {
      productName = nameSegment;
    }

    const missingFields: string[] = [];
    if (!productName) missingFields.push('productName');
    if (price === undefined || isNaN(price) || price <= 0) missingFields.push('price');
    if (quantity === undefined || isNaN(quantity) || quantity < 0) {
      // Default to 10 if not explicitly specified in brief
      quantity = 10;
    }
    if (!unit) {
      unit = 'piece';
    }

    return {
      action: 'add_product',
      rawTranscript: raw,
      params: {
        productName,
        price,
        quantity,
        unit,
      },
      missingFields: missingFields.length > 0 ? missingFields : undefined,
      requiresConfirmation: true,
    };
  }

  // --------------------------------------------------------------------------
  // 5. Update Inventory / Stock (Requires confirmation)
  // --------------------------------------------------------------------------
  // Examples:
  // - “Change tomato stock to 10 kilos.”
  // - “Set rice stock to 15 packets.”
  // - “I have only 5 milk packets left.”
  // - “Update rice stock to 15 packets.”
  // - “Update rice to 15”
  // - "टमाटर का स्टॉक 10 किलो करो"
  if (
    t.includes('stock') ||
    t.includes('left') ||
    t.includes('बचा') ||
    t.includes('बची') ||
    t.includes('स्टॉक') ||
    t.startsWith('update ') ||
    t.startsWith('set ') ||
    t.startsWith('change ')
  ) {
    // Match: "I have only 5 milk packets left" / "mere pas sirf 5 packet doodh bacha hai" / "only 5 milk packets left"
    const leftMatch =
      t.match(/(?:i\s+have\s+)?(?:only|sirf|सिर्फ)?\s*(\d+)\s+([a-zA-Z\u0900-\u097F\s]+?)\s+(?:left|बचा|बची)/i) ||
      t.match(/(\d+)\s+([a-zA-Z\u0900-\u097F\s]+?)\s+left/i);

    if (leftMatch) {
      const qty = parseInt(leftMatch[1], 10);
      const rawProductAndUnit = leftMatch[2].trim();
      const tokens = rawProductAndUnit.split(' ').filter(Boolean);
      let detectedUnit: string | undefined;
      let detectedName = rawProductAndUnit;

      if (tokens.length > 1) {
        const lastToken = tokens[tokens.length - 1];
        const norm = normalizeUnit(lastToken);
        if (['kg', 'packet', 'piece', 'litre', 'gram', 'bottle', 'box', 'dozen', 'pouch'].includes(norm)) {
          detectedUnit = norm;
          detectedName = tokens.slice(0, -1).join(' ');
        }
      }

      return {
        action: 'update_stock',
        rawTranscript: raw,
        params: {
          productName: detectedName,
          quantity: qty,
          unit: detectedUnit,
        },
        requiresConfirmation: true,
      };
    }

    // Match: "change [product] stock to [qty] [unit?]"
    // or: "set [product] stock to [qty] [unit?]"
    // or: "update [product] stock to [qty] [unit?]"
    // or: "update [product] to [qty] [unit?]"
    const stockChangeMatch =
      t.match(/(?:change|set|update)\s+(?:the\s+)?(?:stock\s+of\s+)?(.*?)(?:\s+stock)?\s+(?:to|as)\s+(\d+)(?:\s+([a-zA-Z\u0900-\u097F]+))?/i) ||
      t.match(/(.*?)\s+(?:का\s+)?स्टॉक\s+(\d+)(?:\s+([a-zA-Z\u0900-\u097F]+))?\s*(?:करो|सेट\s+करो)/i);

    // Make sure this is not a price update
    if (stockChangeMatch && !t.includes('price') && !t.includes('rupees') && !t.includes('कीमत') && !t.includes('दाम')) {
      const pName = stockChangeMatch[1].replace(/^(the|my)\s+/i, '').trim();
      const qty = parseInt(stockChangeMatch[2], 10);
      const unit = stockChangeMatch[3] ? normalizeUnit(stockChangeMatch[3]) : undefined;

      const missingFields: string[] = [];
      if (!pName) missingFields.push('productName');
      if (isNaN(qty)) missingFields.push('quantity');

      return {
        action: 'update_stock',
        rawTranscript: raw,
        params: {
          productName: pName,
          quantity: qty,
          unit,
        },
        missingFields: missingFields.length > 0 ? missingFields : undefined,
        requiresConfirmation: true,
      };
    }
  }

  // --------------------------------------------------------------------------
  // 6. Update Price (Requires confirmation)
  // --------------------------------------------------------------------------
  // Examples:
  // - “Change the price of apples to 120 rupees per kilo.”
  // - “Set rice price to 65 rupees per packet.”
  // - “Change apple price to 120”
  // - “Change price of apples to 120”
  // - "सेब का दाम 120 रुपये प्रति किलो करो"
  if (t.includes('price') || t.includes('कीमत') || t.includes('दाम') || t.includes('rate') || t.includes('भाव')) {
    const priceChangeMatch =
      t.match(/(?:change|set|update)\s+(?:the\s+)?(?:price\s+of\s+|rate\s+of\s+)?(.*?)(?:\s+price|\s+rate)?\s+(?:to|as)\s+(\d+(?:\.\d+)?)(?:\s*(?:rupees|rupee|rs|रुपये|रु)?)?(?:\s*(?:per|\/|प्रति)\s*([a-zA-Z\u0900-\u097F]+))?/i) ||
      t.match(/(.*?)\s+(?:का\s+दाम|की\s+कीमत|का\s+भाव|की\s+दर)\s+(\d+(?:\.\d+)?)(?:\s*(?:rupees|rupee|rs|रुपये|रु)?)?(?:\s*(?:प्रति|per)\s*([a-zA-Z\u0900-\u097F]+))?\s*(?:करो|सेट\s+करो)/i);

    if (priceChangeMatch) {
      const pName = priceChangeMatch[1].replace(/^(the|my)\s+/i, '').trim();
      const priceVal = parseFloat(priceChangeMatch[2]);
      const unit = priceChangeMatch[3] ? normalizeUnit(priceChangeMatch[3]) : undefined;

      const missingFields: string[] = [];
      if (!pName) missingFields.push('productName');
      if (isNaN(priceVal) || priceVal <= 0) missingFields.push('price');

      return {
        action: 'change_price',
        rawTranscript: raw,
        params: {
          productName: pName,
          price: priceVal,
          unit,
        },
        missingFields: missingFields.length > 0 ? missingFields : undefined,
        requiresConfirmation: true,
      };
    }
  }

  // Fallback / Unknown
  return {
    action: 'unknown',
    rawTranscript: raw,
    params: {},
    requiresConfirmation: false,
  };
};
