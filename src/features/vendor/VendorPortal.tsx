import React, { useState, useEffect } from 'react';
import {
  Store,
  CheckCircle2,
  AlertCircle,
  Plus,
  Package,
  Clock,
  Users,
  ShieldCheck,
  CreditCard,
  Banknote,
  Edit3,
  Trash2,
  Save,
  X,
  Search,
  MapPin,
  Building2,
  Sparkles,
  Sliders,
  ShoppingBag,
  Bell,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Mic,
} from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { Badge } from '../../components/ui/Badge.tsx';
import { Card, CardHeader, CardBody } from '../../components/ui/Card.tsx';
import { Alert } from '../../components/ui/Alert.tsx';
import { VoiceAssistantPanel } from '../../components/voice/VoiceAssistantPanel.tsx';
import { CrowdLevel, Order, PaymentMethod, Product, Shop } from '../../types/index.ts';
import { DEMO_CATEGORIES } from '../../services/api/index.ts';
import {
  getPrototypeProducts,
  getPrototypeOrders,
  getPrototypeVendorSettings,
  updatePrototypeVendorSettings,
  updatePrototypeCrowdReport,
  updatePrototypeOrderStatus,
  updatePrototypeShop,
  getOrCreateVendorShop,
  addPrototypeProduct,
  updatePrototypeProduct,
  deletePrototypeProduct,
  getPrototypeSessionUser,
  VendorSettings,
} from '../../services/storage/prototypeStorage.ts';
import { useAuth } from '../auth/AuthContext.tsx';
import {
  parseCommand,
  speak,
  matchVendorProduct,
  VoiceLanguage,
  Command,
} from '../../services/voice/voiceAssistantService.ts';
import {
  ProposedAction,
  AssistantFeedback,
  ActivityItem,
} from '../../components/voice/VoiceAssistantPanel.tsx';

export const VendorPortal: React.FC = () => {
  const { t, formatCurrency } = useTranslation();
  const { user, profile } = useAuth();

  const [activeTab, setActiveTab] = useState<'products' | 'shop' | 'orders'>('products');

  const [currentShop, setCurrentShop] = useState<Shop | null>(() => {
    if (user) {
      const vendorName = profile?.displayName || user.user_metadata?.full_name || user.email.split('@')[0];
      return getOrCreateVendorShop(user.id, vendorName);
    }
    const sessionUser = getPrototypeSessionUser();
    if (sessionUser && sessionUser.roles.includes('vendor')) {
      return getOrCreateVendorShop(sessionUser.id, sessionUser.displayName);
    }
    return null;
  });

  const [isOpen, setIsOpen] = useState(currentShop ? currentShop.availabilityStatus === 'open' : true);
  const [currentCrowd, setCurrentCrowd] = useState<CrowdLevel>(
    currentShop?.latestCrowd?.level || 'low'
  );
  const [crowdNotice, setCrowdNotice] = useState<string | null>(null);

  const [vendorSettings, setVendorSettings] = useState<VendorSettings>(() =>
    getPrototypeVendorSettings(currentShop?.id || '')
  );
  const [settingsNotice, setSettingsNotice] = useState<string | null>(null);

  const [shopName, setShopName] = useState(currentShop?.name || '');
  const [shopDesc, setShopDesc] = useState(currentShop?.description || '');
  const [shopCategory, setShopCategory] = useState(currentShop?.categoryId || 'cat-1');
  const [shopAddress, setShopAddress] = useState(currentShop?.addressText || '');
  const [shopLandmark, setShopLandmark] = useState(currentShop?.landmark || '');
  const [shopNotice, setShopNotice] = useState<string | null>(null);
  const [isEditingShop, setIsEditingShop] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [productNotice, setProductNotice] = useState<string | null>(null);

  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductDesc, setNewProductDesc] = useState('');
  const [newProductCategory, setNewProductCategory] = useState(currentShop?.categoryId || 'cat-1');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductUnit, setNewProductUnit] = useState('piece');
  const [newProductQty, setNewProductQty] = useState('25');

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const [editQty, setEditQty] = useState('');

  const [orders, setOrders] = useState<Order[]>([]);
  const [isVoiceAssistantOpen, setIsVoiceAssistantOpen] = useState(false);
  const [voiceLanguage, setVoiceLanguage] = useState<VoiceLanguage>('en-US');
  const [proposal, setProposal] = useState<ProposedAction | null>(null);
  const [voiceFeedback, setVoiceFeedback] = useState<AssistantFeedback | null>(null);
  const [isExecutingVoice, setIsExecutingVoice] = useState(false);
  const [voiceActivities, setVoiceActivities] = useState<ActivityItem[]>([]);
  const [executedProposalIds, setExecutedProposalIds] = useState<Set<string>>(new Set());
  const [pendingAmbiguous, setPendingAmbiguous] = useState<{
    actionType: 'update_stock' | 'change_price';
    quantity?: number;
    price?: number;
    unit?: string;
  } | null>(null);

  const handleVoiceCommand = (transcript: string) => {
    const raw = transcript.trim();
    if (!raw) return;

    setVoiceFeedback(null);
    setProposal(null);
    setPendingAmbiguous(null);

    const parsed = parseCommand(raw);

    const addActivity = (status: ActivityItem['status'], summary: string) => {
      setVoiceActivities((prev) => [
        {
          id: 'act-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          transcript: raw,
          status,
          summary,
        },
        ...prev,
      ]);
    };

    if (!parsed || parsed.action === 'unknown') {
      const msg =
        voiceLanguage === 'hi-IN'
          ? 'कमांड समझ नहीं आई। कृपया दोबारा स्पष्ट बोलें या नीचे सुझाव देखें।'
          : "I couldn't understand that command. Try asking to check stock, show orders, add a product, or update prices.";
      speak(msg, voiceLanguage);
      setVoiceFeedback({ type: 'error', message: msg });
      addActivity('error', 'Unrecognized voice command');
      return;
    }

    // 1. Show products
    if (parsed.action === 'show_products') {
      setActiveTab('products');
      const msg =
        voiceLanguage === 'hi-IN'
          ? `आपके पास कुल ${products.length} उत्पाद हैं।`
          : `Showing your catalog with ${products.length} products.`;
      speak(msg, voiceLanguage);
      setVoiceFeedback({ type: 'info', message: msg });
      addActivity('query', 'Viewed product catalog');
      return;
    }

    // 2. Check low stock
    if (parsed.action === 'check_stock') {
      const lowStockProducts = products.filter((p) => {
        const v = p.variants[0];
        return !v || v.quantityAvailable <= 5;
      });
      const outOfStockProducts = products.filter((p) => {
        const v = p.variants[0];
        return !v || v.quantityAvailable <= 0;
      });

      let msg = '';
      if (outOfStockProducts.length === 0 && lowStockProducts.length === 0) {
        msg =
          voiceLanguage === 'hi-IN'
            ? 'सभी उत्पाद पर्याप्त स्टॉक में हैं। कोई भी उत्पाद कम नहीं है।'
            : 'All your products are well stocked. You have zero low stock items.';
      } else {
        const names = lowStockProducts.slice(0, 3).map((p) => p.name).join(', ');
        msg =
          voiceLanguage === 'hi-IN'
            ? `आपके ${lowStockProducts.length} उत्पाद कम स्टॉक में हैं: ${names}.`
            : `You have ${lowStockProducts.length} items low or out of stock (${names}).`;
      }
      setActiveTab('products');
      speak(msg, voiceLanguage);
      setVoiceFeedback({
        type: lowStockProducts.length > 0 ? 'warning' : 'success',
        message: msg,
      });
      addActivity('query', `Checked stock levels (${lowStockProducts.length} low stock)`);
      return;
    }

    // 3. Show orders
    if (parsed.action === 'show_orders') {
      setActiveTab('orders');
      const pendingOrders = orders.filter((o) => o.orderStatus === 'pending_vendor');
      const msg =
        voiceLanguage === 'hi-IN'
          ? `आपके पास ${pendingOrders.length} लंबित ऑर्डर हैं और कुल ${orders.length} ऑर्डर हैं।`
          : `You have ${pendingOrders.length} pending pickup orders out of ${orders.length} total orders.`;
      speak(msg, voiceLanguage);
      setVoiceFeedback({ type: 'info', message: msg });
      addActivity('query', `Viewed orders (${pendingOrders.length} pending)`);
      return;
    }

    // 4. Check shop status
    if (parsed.action === 'check_shop_status') {
      const isOpenNow = currentShop?.availabilityStatus === 'open';
      const msg = isOpenNow
        ? voiceLanguage === 'hi-IN'
          ? 'आपकी दुकान खुली है और नए ग्राहक ऑर्डर स्वीकार कर रही है।'
          : 'Your shop is currently OPEN and accepting customer pickup orders.'
        : voiceLanguage === 'hi-IN'
        ? 'आपकी दुकान वर्तमान में रुकी (बंद) हुई है।'
        : 'Your shop is currently PAUSED (closed for orders).';
      speak(msg, voiceLanguage);
      setVoiceFeedback({ type: 'info', message: msg });
      addActivity('query', 'Checked shop status');
      return;
    }

    // 5. Look up order
    if (parsed.action === 'lookup_order') {
      const qId = (parsed.params.orderId || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const found = orders.find(
        (o) =>
          o.id.toLowerCase().replace(/[^a-z0-9]/g, '').includes(qId) ||
          o.orderNumber.toLowerCase().replace(/[^a-z0-9]/g, '').includes(qId)
      );
      if (found) {
        setActiveTab('orders');
        const st = found.orderStatus === 'pending_vendor' ? 'Pending Vendor' : found.orderStatus;
        const msg =
          voiceLanguage === 'hi-IN'
            ? `ऑर्डर #${found.orderNumber} मिल गया। ग्राहक: ${found.customerName}, स्थिति: ${st}, राशि: ₹${(found.totalMinor / 100).toFixed(0)}.`
            : `Order #${found.orderNumber} for ${found.customerName} found. Status: ${st}, Total: ₹${(found.totalMinor / 100).toFixed(0)}.`;
        speak(msg, voiceLanguage);
        setVoiceFeedback({ type: 'success', message: msg });
        addActivity('query', `Looked up order #${found.orderNumber}`);
      } else {
        const msg =
          voiceLanguage === 'hi-IN'
            ? `ऑर्डर "${parsed.params.orderId}" नहीं मिला।`
            : `Could not find order "${parsed.params.orderId}" in your records.`;
        speak(msg, voiceLanguage);
        setVoiceFeedback({ type: 'warning', message: msg });
        addActivity('query', `Order lookup failed: ${parsed.params.orderId}`);
      }
      return;
    }

    // 6. Pause shop (Requires confirmation)
    if (parsed.action === 'pause_shop') {
      if (currentShop?.availabilityStatus !== 'open') {
        const msg =
          voiceLanguage === 'hi-IN'
            ? 'आपकी दुकान पहले से ही बंद/रुकी हुई है।'
            : 'Your shop is already paused.';
        speak(msg, voiceLanguage);
        setVoiceFeedback({ type: 'info', message: msg });
        return;
      }
      const newProposal: ProposedAction = {
        id: 'prop-pause-' + Date.now(),
        actionType: 'pause_shop',
        title: voiceLanguage === 'hi-IN' ? 'दुकान रोकें (Pause Shop)' : 'Pause Shop Availability',
        summary:
          voiceLanguage === 'hi-IN'
            ? 'दुकान को अस्थायी रूप से रोकें ताकि ग्राहक नए पिकअप ऑर्डर न दे सकें।'
            : 'Temporarily pause your shop so customers cannot place new pickup orders.',
        details: {
          oldValue: 'Open (Accepting Orders)',
          newValue: 'Paused (Temporarily Closed)',
        },
      };
      setProposal(newProposal);
      const speakMsg =
        voiceLanguage === 'hi-IN'
          ? 'क्या आप अपनी दुकान को रोकना चाहते हैं? कृपया पुष्टि करें।'
          : 'Do you want to pause your shop? Please confirm.';
      speak(speakMsg, voiceLanguage);
      return;
    }

    // 7. Resume shop (Requires confirmation)
    if (parsed.action === 'resume_shop') {
      if (currentShop?.availabilityStatus === 'open') {
        const msg =
          voiceLanguage === 'hi-IN'
            ? 'आपकी दुकान पहले से ही खुली है।'
            : 'Your shop is already open.';
        speak(msg, voiceLanguage);
        setVoiceFeedback({ type: 'info', message: msg });
        return;
      }
      const newProposal: ProposedAction = {
        id: 'prop-resume-' + Date.now(),
        actionType: 'resume_shop',
        title: voiceLanguage === 'hi-IN' ? 'दुकान खोलें (Resume Shop)' : 'Resume Shop Availability',
        summary:
          voiceLanguage === 'hi-IN'
            ? 'दुकान को पुनः खोलें और ग्राहकों से नए पिकअप ऑर्डर स्वीकार करना शुरू करें।'
            : 'Re-open your shop and start accepting pickup orders from nearby customers.',
        details: {
          oldValue: 'Paused',
          newValue: 'Open (Accepting Orders)',
        },
      };
      setProposal(newProposal);
      const speakMsg =
        voiceLanguage === 'hi-IN'
          ? 'क्या आप अपनी दुकान चालू करना चाहते हैं? कृपया पुष्टि करें।'
          : 'Do you want to resume your shop? Please confirm.';
      speak(speakMsg, voiceLanguage);
      return;
    }

    // 8. Add product (Requires confirmation)
    if (parsed.action === 'add_product') {
      if (parsed.missingFields && parsed.missingFields.includes('productName')) {
        const msg =
          voiceLanguage === 'hi-IN'
            ? 'कृपया उत्पाद का नाम बताएं।'
            : 'Please specify the name of the product you want to add.';
        speak(msg, voiceLanguage);
        setVoiceFeedback({ type: 'warning', message: msg });
        return;
      }
      if (parsed.missingFields && parsed.missingFields.includes('price')) {
        const msg =
          voiceLanguage === 'hi-IN'
            ? `कृपया ${parsed.params.productName} का दाम/कीमत बताएं।`
            : `Please specify the price for "${parsed.params.productName}".`;
        speak(msg, voiceLanguage);
        setVoiceFeedback({ type: 'warning', message: msg });
        return;
      }

      const pName = parsed.params.productName || 'New Product';
      const price = parsed.params.price || 0;
      const qty = parsed.params.quantity !== undefined ? parsed.params.quantity : 10;
      const unit = parsed.params.unit || 'piece';

      const newProposal: ProposedAction = {
        id: 'prop-add-' + Date.now(),
        actionType: 'add_product',
        title: voiceLanguage === 'hi-IN' ? 'नया उत्पाद जोड़ें' : 'Add New Catalog Product',
        summary:
          voiceLanguage === 'hi-IN'
            ? `${pName} को ₹${price} प्रति ${unit} (स्टॉक: ${qty} ${unit}) पर जोड़ें।`
            : `Add "${pName}" at ₹${price} per ${unit} with initial stock of ${qty} ${unit}.`,
        details: {
          productName: pName,
          price,
          quantity: qty,
          unit,
          newValue: `₹${price} / ${unit}, Initial Stock: ${qty} ${unit}`,
        },
      };
      setProposal(newProposal);
      const speakMsg =
        voiceLanguage === 'hi-IN'
          ? `क्या आप ${pName} ₹${price} प्रति ${unit} में जोड़ना चाहते हैं?`
          : `Do you want to add ${pName} at ₹${price} per ${unit} with ${qty} in stock?`;
      speak(speakMsg, voiceLanguage);
      return;
    }

    // 9. Update stock (Requires confirmation)
    if (parsed.action === 'update_stock') {
      const queryName = parsed.params.productName || '';
      const qty = parsed.params.quantity;

      if (!queryName) {
        const msg =
          voiceLanguage === 'hi-IN'
            ? 'कृपया उत्पाद का नाम बताएं जिसका स्टॉक बदलना है।'
            : 'Please specify which product stock you want to update.';
        speak(msg, voiceLanguage);
        setVoiceFeedback({ type: 'warning', message: msg });
        return;
      }

      if (qty === undefined || isNaN(qty)) {
        const msg =
          voiceLanguage === 'hi-IN'
            ? `कृपया ${queryName} की नई मात्रा/स्टॉक बताएं।`
            : `Please specify the new stock quantity for ${queryName}.`;
        speak(msg, voiceLanguage);
        setVoiceFeedback({ type: 'warning', message: msg });
        return;
      }

      const match = matchVendorProduct(queryName, products);

      if (match.status === 'not_found') {
        const msg =
          voiceLanguage === 'hi-IN'
            ? `उत्पाद "${queryName}" आपकी दुकान के कैटलॉग में नहीं मिला।`
            : `Could not find product "${queryName}" in your catalog.`;
        speak(msg, voiceLanguage);
        setVoiceFeedback({ type: 'error', message: msg });
        addActivity('error', `Product not found: ${queryName}`);
        return;
      }

      if (match.status === 'ambiguous') {
        const names = match.matches?.map((m) => m.name).join(', ') || '';
        const msg =
          voiceLanguage === 'hi-IN'
            ? `एक से अधिक उत्पाद मिले: ${names}। कृपया नीचे से सही उत्पाद चुनें।`
            : `Found multiple matching products (${names}). Please select the intended product below.`;
        speak(
          voiceLanguage === 'hi-IN'
            ? 'कृपया सही उत्पाद चुनें।'
            : 'Please select which product you want to update.',
          voiceLanguage
        );
        setPendingAmbiguous({
          actionType: 'update_stock',
          quantity: qty,
          unit: parsed.params.unit,
        });
        setVoiceFeedback({
          type: 'warning',
          message: msg,
          options: match.matches?.map((m) => ({ label: m.name, value: m.id })),
        });
        return;
      }

      const product = match.product!;
      const currentQty = product.variants[0]?.quantityAvailable ?? 0;
      const unit = parsed.params.unit || product.variants[0]?.unit || 'piece';

      const newProposal: ProposedAction = {
        id: 'prop-stock-' + Date.now(),
        actionType: 'update_stock',
        title: voiceLanguage === 'hi-IN' ? 'स्टॉक मात्रा अपडेट करें' : 'Update Inventory Stock',
        summary:
          voiceLanguage === 'hi-IN'
            ? `${product.name} का स्टॉक ${currentQty} ${product.variants[0]?.unit || unit} से बदलकर ${qty} ${unit} करें।`
            : `Change available stock for "${product.name}" from ${currentQty} to ${qty} ${unit}.`,
        details: {
          productName: product.name,
          productId: product.id,
          oldValue: `${currentQty} ${product.variants[0]?.unit || unit}`,
          newValue: `${qty} ${unit}`,
          quantity: qty,
          unit,
        },
      };
      setProposal(newProposal);
      const speakMsg =
        voiceLanguage === 'hi-IN'
          ? `क्या आप ${product.name} का स्टॉक ${qty} ${unit} करना चाहते हैं?`
          : `Do you want to update ${product.name} stock to ${qty} ${unit}?`;
      speak(speakMsg, voiceLanguage);
      return;
    }

    // 10. Change price (Requires confirmation)
    if (parsed.action === 'change_price') {
      const queryName = parsed.params.productName || '';
      const priceVal = parsed.params.price;

      if (!queryName) {
        const msg =
          voiceLanguage === 'hi-IN'
            ? 'कृपया बताएं किस उत्पाद का दाम बदलना है।'
            : 'Please specify which product price you want to change.';
        speak(msg, voiceLanguage);
        setVoiceFeedback({ type: 'warning', message: msg });
        return;
      }

      if (priceVal === undefined || isNaN(priceVal) || priceVal <= 0) {
        const msg =
          voiceLanguage === 'hi-IN'
            ? `कृपया ${queryName} का नया दाम बताएं।`
            : `Please specify the valid new price for ${queryName}.`;
        speak(msg, voiceLanguage);
        setVoiceFeedback({ type: 'warning', message: msg });
        return;
      }

      const match = matchVendorProduct(queryName, products);

      if (match.status === 'not_found') {
        const msg =
          voiceLanguage === 'hi-IN'
            ? `उत्पाद "${queryName}" आपकी दुकान में नहीं मिला।`
            : `Could not find product "${queryName}" in your catalog.`;
        speak(msg, voiceLanguage);
        setVoiceFeedback({ type: 'error', message: msg });
        addActivity('error', `Product not found: ${queryName}`);
        return;
      }

      if (match.status === 'ambiguous') {
        const names = match.matches?.map((m) => m.name).join(', ') || '';
        const msg =
          voiceLanguage === 'hi-IN'
            ? `एक से अधिक उत्पाद मिले: ${names}। कृपया नीचे से सही उत्पाद चुनें।`
            : `Found multiple matching products (${names}). Please select the intended product below.`;
        speak(
          voiceLanguage === 'hi-IN'
            ? 'कृपया सही उत्पाद चुनें।'
            : 'Please select which product you want to update.',
          voiceLanguage
        );
        setPendingAmbiguous({
          actionType: 'change_price',
          price: priceVal,
          unit: parsed.params.unit,
        });
        setVoiceFeedback({
          type: 'warning',
          message: msg,
          options: match.matches?.map((m) => ({ label: m.name, value: m.id })),
        });
        return;
      }

      const product = match.product!;
      const currentPrice = (product.variants[0]?.priceMinor ?? 0) / 100;
      const unit = parsed.params.unit || product.variants[0]?.unit || 'piece';

      const newProposal: ProposedAction = {
        id: 'prop-price-' + Date.now(),
        actionType: 'change_price',
        title: voiceLanguage === 'hi-IN' ? 'उत्पाद मूल्य (दाम) बदलें' : 'Change Product Price',
        summary:
          voiceLanguage === 'hi-IN'
            ? `${product.name} का दाम ₹${currentPrice} से बदलकर ₹${priceVal} प्रति ${unit} करें।`
            : `Change price for "${product.name}" from ₹${currentPrice} to ₹${priceVal} per ${unit}.`,
        details: {
          productName: product.name,
          productId: product.id,
          oldValue: `₹${currentPrice} / ${product.variants[0]?.unit || 'piece'}`,
          newValue: `₹${priceVal} / ${unit}`,
          price: priceVal,
          unit,
        },
      };
      setProposal(newProposal);
      const speakMsg =
        voiceLanguage === 'hi-IN'
          ? `क्या आप ${product.name} का दाम ₹${priceVal} प्रति ${unit} करना चाहते हैं?`
          : `Do you want to change the price of ${product.name} to ₹${priceVal} per ${unit}?`;
      speak(speakMsg, voiceLanguage);
      return;
    }

    // 11. Mark order ready for pickup (Requires confirmation)
    if (parsed.action === 'mark_order_ready') {
      const qId = (parsed.params.orderId || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const foundOrder = orders.find(
        (o) =>
          o.id.toLowerCase().replace(/[^a-z0-9]/g, '').includes(qId) ||
          o.orderNumber.toLowerCase().replace(/[^a-z0-9]/g, '').includes(qId)
      );

      if (!foundOrder) {
        const msg =
          voiceLanguage === 'hi-IN'
            ? `ऑर्डर "${parsed.params.orderId}" नहीं मिला।`
            : `Order "${parsed.params.orderId}" was not found in your orders list.`;
        speak(msg, voiceLanguage);
        setVoiceFeedback({ type: 'warning', message: msg });
        addActivity('error', `Order not found: ${parsed.params.orderId}`);
        return;
      }

      if (foundOrder.orderStatus === 'ready_for_pickup') {
        const msg =
          voiceLanguage === 'hi-IN'
            ? `ऑर्डर #${foundOrder.orderNumber} पहले से ही पिकअप के लिए तैयार है।`
            : `Order #${foundOrder.orderNumber} is already marked as ready for pickup.`;
        speak(msg, voiceLanguage);
        setVoiceFeedback({ type: 'info', message: msg });
        return;
      }

      if (foundOrder.orderStatus === 'completed') {
        const msg =
          voiceLanguage === 'hi-IN'
            ? `ऑर्डर #${foundOrder.orderNumber} पहले से ही पूरा हो चुका है।`
            : `Order #${foundOrder.orderNumber} is already completed.`;
        speak(msg, voiceLanguage);
        setVoiceFeedback({ type: 'info', message: msg });
        return;
      }

      if (foundOrder.orderStatus !== 'pending_vendor') {
        const msg =
          voiceLanguage === 'hi-IN'
            ? `ऑर्डर #${foundOrder.orderNumber} की वर्तमान स्थिति (${foundOrder.orderStatus}) को पिकअप के लिए तैयार नहीं किया जा सकता।`
            : `Order #${foundOrder.orderNumber} is currently ${foundOrder.orderStatus} and cannot transition to ready for pickup.`;
        speak(msg, voiceLanguage);
        setVoiceFeedback({ type: 'error', message: msg });
        return;
      }

      const newProposal: ProposedAction = {
        id: 'prop-order-' + Date.now(),
        actionType: 'mark_order_ready',
        title: voiceLanguage === 'hi-IN' ? 'ऑर्डर तैयार मार्क करें' : 'Mark Order Ready for Pickup',
        summary:
          voiceLanguage === 'hi-IN'
            ? `ऑर्डर #${foundOrder.orderNumber} (${foundOrder.customerName}) को पिकअप के लिए तैयार मार्क करें।`
            : `Mark order #${foundOrder.orderNumber} for ${foundOrder.customerName} as ready for customer pickup.`,
        details: {
          orderId: foundOrder.id,
          orderNumber: foundOrder.orderNumber,
          oldValue: 'Pending Preparation (लंबित)',
          newValue: 'Ready for Pickup (पिकअप के लिए तैयार)',
        },
      };
      setProposal(newProposal);
      const speakMsg =
        voiceLanguage === 'hi-IN'
          ? `क्या आप ऑर्डर #${foundOrder.orderNumber} को पिकअप के लिए तैयार मार्क करना चाहते हैं?`
          : `Do you want to mark order #${foundOrder.orderNumber} as ready for pickup?`;
      speak(speakMsg, voiceLanguage);
      return;
    }
  };

  const handleConfirmExecution = async (prop: ProposedAction) => {
    if (isExecutingVoice) return;
    if (executedProposalIds.has(prop.id)) {
      setVoiceFeedback({ type: 'warning', message: 'This action has already been executed.' });
      return;
    }

    setIsExecutingVoice(true);
    const activeUserId = currentShop?.ownerUserId || user?.id || getPrototypeSessionUser()?.id || '';

    try {
      if (prop.actionType === 'add_product') {
        if (!currentShop) throw new Error('Shop profile not found');
        const res = addPrototypeProduct(
          currentShop.id,
          {
            name: prop.details.productName || 'New Product',
            description: 'Added via NUKKAD Voice Assistant',
            categoryId: currentShop.categoryId || 'cat-1',
            price: prop.details.price || 0,
            unit: prop.details.unit || 'piece',
            quantity: prop.details.quantity || 10,
          },
          activeUserId
        );
        if (!res.success) {
          throw new Error(res.error || 'Failed to add product to catalog.');
        }
        refreshVendorData();
        setExecutedProposalIds((prev) => new Set(prev).add(prop.id));
        setProposal(null);
        const msg =
          voiceLanguage === 'hi-IN'
            ? `${prop.details.productName} सफलता से जोड़ दिया गया है!`
            : `Product "${prop.details.productName}" added successfully to your catalog.`;
        speak(msg, voiceLanguage);
        setVoiceFeedback({ type: 'success', message: msg });
        setVoiceActivities((prev) => [
          {
            id: 'act-' + Date.now(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            transcript: prop.summary,
            status: 'executed',
            summary: `Added "${prop.details.productName}" (₹${prop.details.price}/${prop.details.unit}, ${prop.details.quantity} in stock)`,
          },
          ...prev,
        ]);
        return;
      }

      if (prop.actionType === 'update_stock') {
        const freshProducts = getPrototypeProducts();
        const product = freshProducts.find((p) => p.id === prop.details.productId);
        if (!product) {
          throw new Error('Product not found or removed from catalog.');
        }
        const res = updatePrototypeProduct(
          product.id,
          {
            quantity: prop.details.quantity,
            unit: prop.details.unit,
          },
          activeUserId
        );
        if (!res.success) {
          throw new Error(res.error || 'Failed to update product stock.');
        }
        refreshVendorData();
        setExecutedProposalIds((prev) => new Set(prev).add(prop.id));
        setProposal(null);
        const msg =
          voiceLanguage === 'hi-IN'
            ? `${product.name} का स्टॉक ${prop.details.quantity} ${prop.details.unit || ''} अपडेट हो गया है!`
            : `Stock for "${product.name}" updated to ${prop.details.quantity} ${prop.details.unit || ''}.`;
        speak(msg, voiceLanguage);
        setVoiceFeedback({ type: 'success', message: msg });
        setVoiceActivities((prev) => [
          {
            id: 'act-' + Date.now(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            transcript: prop.summary,
            status: 'executed',
            summary: `Updated stock: ${product.name} -> ${prop.details.quantity} ${prop.details.unit || ''}`,
          },
          ...prev,
        ]);
        return;
      }

      if (prop.actionType === 'change_price') {
        const freshProducts = getPrototypeProducts();
        const product = freshProducts.find((p) => p.id === prop.details.productId);
        if (!product) {
          throw new Error('Product not found or removed from catalog.');
        }
        const res = updatePrototypeProduct(
          product.id,
          {
            price: prop.details.price,
            unit: prop.details.unit,
          },
          activeUserId
        );
        if (!res.success) {
          throw new Error(res.error || 'Failed to update product price.');
        }
        refreshVendorData();
        setExecutedProposalIds((prev) => new Set(prev).add(prop.id));
        setProposal(null);
        const msg =
          voiceLanguage === 'hi-IN'
            ? `${product.name} का दाम ₹${prop.details.price} प्रति ${prop.details.unit || ''} अपडेट हो गया है!`
            : `Price for "${product.name}" updated to ₹${prop.details.price} / ${prop.details.unit || 'piece'}.`;
        speak(msg, voiceLanguage);
        setVoiceFeedback({ type: 'success', message: msg });
        setVoiceActivities((prev) => [
          {
            id: 'act-' + Date.now(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            transcript: prop.summary,
            status: 'executed',
            summary: `Updated price: ${product.name} -> ₹${prop.details.price} / ${prop.details.unit || 'piece'}`,
          },
          ...prev,
        ]);
        return;
      }

      if (prop.actionType === 'pause_shop') {
        if (!currentShop) throw new Error('Shop not found.');
        const res = updatePrototypeShop(currentShop.id, { availabilityStatus: 'closed' }, activeUserId);
        if (!res.success) {
          throw new Error(res.error || 'Failed to pause shop.');
        }
        refreshVendorData();
        setExecutedProposalIds((prev) => new Set(prev).add(prop.id));
        setProposal(null);
        const msg =
          voiceLanguage === 'hi-IN'
            ? 'दुकान सफलता से रोक दी गई है (बंद)।'
            : 'Your shop has been paused. It is now closed for new pickup orders.';
        speak(msg, voiceLanguage);
        setVoiceFeedback({ type: 'success', message: msg });
        setVoiceActivities((prev) => [
          {
            id: 'act-' + Date.now(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            transcript: prop.summary,
            status: 'executed',
            summary: 'Shop paused (temporarily closed)',
          },
          ...prev,
        ]);
        return;
      }

      if (prop.actionType === 'resume_shop') {
        if (!currentShop) throw new Error('Shop not found.');
        const res = updatePrototypeShop(currentShop.id, { availabilityStatus: 'open' }, activeUserId);
        if (!res.success) {
          throw new Error(res.error || 'Failed to resume shop.');
        }
        refreshVendorData();
        setExecutedProposalIds((prev) => new Set(prev).add(prop.id));
        setProposal(null);
        const msg =
          voiceLanguage === 'hi-IN'
            ? 'दुकान सफलता से पुनः चालू कर दी गई है (खुली है)!'
            : 'Your shop has been resumed. It is now open and accepting pickup orders.';
        speak(msg, voiceLanguage);
        setVoiceFeedback({ type: 'success', message: msg });
        setVoiceActivities((prev) => [
          {
            id: 'act-' + Date.now(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            transcript: prop.summary,
            status: 'executed',
            summary: 'Shop resumed (open for orders)',
          },
          ...prev,
        ]);
        return;
      }

      if (prop.actionType === 'mark_order_ready') {
        const freshOrders = getPrototypeOrders(activeUserId, 'vendor');
        const order = freshOrders.find((o) => o.id === prop.details.orderId);
        if (!order) {
          throw new Error('Order not found.');
        }
        if (order.orderStatus !== 'pending_vendor') {
          throw new Error(`Order is currently "${order.orderStatus}" and cannot be marked ready.`);
        }
        const res = updatePrototypeOrderStatus(order.id, 'ready_for_pickup', 'ready');
        if (!res.success) {
          throw new Error(res.error || 'Failed to advance order status.');
        }
        refreshVendorData();
        setExecutedProposalIds((prev) => new Set(prev).add(prop.id));
        setProposal(null);
        const msg =
          voiceLanguage === 'hi-IN'
            ? `ऑर्डर #${prop.details.orderNumber} पिकअप के लिए तैयार मार्क कर दिया गया है!`
            : `Order #${prop.details.orderNumber} marked ready for pickup. Customer notified!`;
        speak(msg, voiceLanguage);
        setVoiceFeedback({ type: 'success', message: msg });
        setVoiceActivities((prev) => [
          {
            id: 'act-' + Date.now(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            transcript: prop.summary,
            status: 'executed',
            summary: `Marked order #${prop.details.orderNumber} ready for pickup`,
          },
          ...prev,
        ]);
        return;
      }
    } catch (err: any) {
      console.error('[VoiceAssistant] Execution error:', err);
      const errMsg = err?.message || 'Operation failed.';
      speak(errMsg, voiceLanguage);
      setVoiceFeedback({ type: 'error', message: errMsg });
      setVoiceActivities((prev) => [
        {
          id: 'act-' + Date.now(),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          transcript: prop.summary,
          status: 'error',
          summary: `Failed: ${errMsg}`,
        },
        ...prev,
      ]);
    } finally {
      setIsExecutingVoice(false);
    }
  };

  const handleCancelProposal = () => {
    if (proposal) {
      setVoiceActivities((prev) => [
        {
          id: 'act-' + Date.now(),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          transcript: proposal.summary,
          status: 'cancelled',
          summary: `Cancelled: ${proposal.title}`,
        },
        ...prev,
      ]);
    }
    setProposal(null);
    setPendingAmbiguous(null);
    const msg =
      voiceLanguage === 'hi-IN'
        ? 'कमांड रद्द कर दिया गया। कोई बदलाव नहीं किया गया।'
        : 'Action cancelled. No changes were made to your store.';
    speak(msg, voiceLanguage);
    setVoiceFeedback({ type: 'info', message: msg });
  };

  const handleSelectOption = (productId: string) => {
    if (!pendingAmbiguous) return;
    const chosenProduct = products.find((p) => p.id === productId);
    if (!chosenProduct) return;

    if (pendingAmbiguous.actionType === 'update_stock') {
      const currentQty = chosenProduct.variants[0]?.quantityAvailable ?? 0;
      const unit = pendingAmbiguous.unit || chosenProduct.variants[0]?.unit || 'piece';
      const qty = pendingAmbiguous.quantity || 0;

      const newProposal: ProposedAction = {
        id: 'prop-stock-' + Date.now(),
        actionType: 'update_stock',
        title: voiceLanguage === 'hi-IN' ? 'स्टॉक मात्रा अपडेट करें' : 'Update Inventory Stock',
        summary:
          voiceLanguage === 'hi-IN'
            ? `${chosenProduct.name} का स्टॉक ${currentQty} से बदलकर ${qty} ${unit} करें।`
            : `Change available stock for "${chosenProduct.name}" from ${currentQty} to ${qty} ${unit}.`,
        details: {
          productName: chosenProduct.name,
          productId: chosenProduct.id,
          oldValue: `${currentQty} ${chosenProduct.variants[0]?.unit || unit}`,
          newValue: `${qty} ${unit}`,
          quantity: qty,
          unit,
        },
      };
      setPendingAmbiguous(null);
      setProposal(newProposal);
      const speakMsg =
        voiceLanguage === 'hi-IN'
          ? `क्या आप ${chosenProduct.name} का स्टॉक ${qty} ${unit} करना चाहते हैं?`
          : `Do you want to update ${chosenProduct.name} stock to ${qty} ${unit}?`;
      speak(speakMsg, voiceLanguage);
      return;
    }

    if (pendingAmbiguous.actionType === 'change_price') {
      const currentPrice = (chosenProduct.variants[0]?.priceMinor ?? 0) / 100;
      const unit = pendingAmbiguous.unit || chosenProduct.variants[0]?.unit || 'piece';
      const priceVal = pendingAmbiguous.price || 0;

      const newProposal: ProposedAction = {
        id: 'prop-price-' + Date.now(),
        actionType: 'change_price',
        title: voiceLanguage === 'hi-IN' ? 'उत्पाद मूल्य (दाम) बदलें' : 'Change Product Price',
        summary:
          voiceLanguage === 'hi-IN'
            ? `${chosenProduct.name} का दाम ₹${currentPrice} से बदलकर ₹${priceVal} प्रति ${unit} करें।`
            : `Change price for "${chosenProduct.name}" from ₹${currentPrice} to ₹${priceVal} per ${unit}.`,
        details: {
          productName: chosenProduct.name,
          productId: chosenProduct.id,
          oldValue: `₹${currentPrice} / ${chosenProduct.variants[0]?.unit || 'piece'}`,
          newValue: `₹${priceVal} / ${unit}`,
          price: priceVal,
          unit,
        },
      };
      setPendingAmbiguous(null);
      setProposal(newProposal);
      const speakMsg =
        voiceLanguage === 'hi-IN'
          ? `क्या आप ${chosenProduct.name} का दाम ₹${priceVal} प्रति ${unit} करना चाहते हैं?`
          : `Do you want to change the price of ${chosenProduct.name} to ₹${priceVal} per ${unit}?`;
      speak(speakMsg, voiceLanguage);
      return;
    }
  };

  const [newOrderNotice, setNewOrderNotice] = useState<{
    orderNumber: string;
    customerName: string;
    itemCount: number;
    totalMinor: number;
  } | null>(null);

  const refreshVendorData = () => {
    const activeUserId = user?.id || getPrototypeSessionUser()?.id;
    if (!activeUserId) return;
    const vendorName = profile?.displayName || user?.user_metadata?.full_name || user?.email?.split('@')[0] || getPrototypeSessionUser()?.displayName;
    const shop = getOrCreateVendorShop(activeUserId, vendorName);
    setCurrentShop(shop);
    setIsOpen(shop.availabilityStatus === 'open');
    setCurrentCrowd(shop.latestCrowd?.level || 'low');
    setVendorSettings(getPrototypeVendorSettings(shop.id));
    setProducts(getPrototypeProducts().filter((p) => p.shopId === shop.id));

    const latestOrders = getPrototypeOrders(activeUserId, 'vendor');
    const pendingOrders = latestOrders.filter((o) => o.orderStatus === 'pending_vendor');

    setOrders((prev) => {
      if (prev.length === 0 && pendingOrders.length > 0) {
        const newest = pendingOrders[0];
        setNewOrderNotice({
          orderNumber: newest.orderNumber,
          customerName: newest.customerName || 'Customer',
          itemCount: newest.items.reduce((s, it) => s + it.quantity, 0),
          totalMinor: newest.totalMinor,
        });
      }
      return latestOrders;
    });
  };

  useEffect(() => {
    refreshVendorData();
    const interval = setInterval(() => {
      refreshVendorData();
    }, 4000);
    return () => clearInterval(interval);
  }, [user]);

  const handleToggleAvailability = () => {
    if (!currentShop) return;
    const activeUserId = user?.id || getPrototypeSessionUser()?.id || '';
    const nextStatus = isOpen ? 'closed' : 'open';
    const res = updatePrototypeShop(currentShop.id, { availabilityStatus: nextStatus }, activeUserId);
    if (res.success && res.shop) {
      setIsOpen(!isOpen);
      setCurrentShop(res.shop);
    }
  };

  const handleUpdateCrowd = (level: CrowdLevel) => {
    if (!currentShop) return;
    const success = updatePrototypeCrowdReport(currentShop.id, level, 'vendor', 'Counter status updated by merchant');
    if (success) {
      setCurrentCrowd(level);
      setCrowdNotice(`Successfully broadcasted queue status as "${level.toUpperCase()}" to nearby shoppers.`);
      setTimeout(() => setCrowdNotice(null), 4000);
      refreshVendorData();
    }
  };

  const handleUpdateShopProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentShop) return;
    const activeUserId = user?.id || getPrototypeSessionUser()?.id || '';
    const res = updatePrototypeShop(
      currentShop.id,
      {
        name: shopName.trim(),
        description: shopDesc.trim(),
        categoryId: shopCategory,
        addressText: shopAddress.trim(),
        landmark: shopLandmark.trim(),
      },
      activeUserId
    );
    if (res.success && res.shop) {
      setCurrentShop(res.shop);
      setIsEditingShop(false);
      setShopNotice('Store profile updated successfully.');
      setTimeout(() => setShopNotice(null), 4000);
    }
  };

  const handleTogglePaymentMethod = (method: PaymentMethod) => {
    if (!currentShop) return;
    const currentMethods = vendorSettings.acceptedPaymentMethods;
    let updatedMethods: PaymentMethod[];
    if (currentMethods.includes(method)) {
      if (currentMethods.length === 1) {
        setSettingsNotice('Store must accept at least one payment method.');
        setTimeout(() => setSettingsNotice(null), 4000);
        return;
      }
      updatedMethods = currentMethods.filter((m) => m !== method);
    } else {
      updatedMethods = [...currentMethods, method];
    }

    const newSettings = updatePrototypeVendorSettings(currentShop.id, {
      acceptedPaymentMethods: updatedMethods,
    });
    setVendorSettings(newSettings);
    setSettingsNotice('Counter payment modes updated.');
    setTimeout(() => setSettingsNotice(null), 3000);
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentShop) return;
    if (!newProductName.trim() || !newProductPrice) return;

    const priceNum = parseFloat(newProductPrice);
    const qtyNum = parseInt(newProductQty, 10) || 20;
    const activeUserId = user?.id || getPrototypeSessionUser()?.id || '';

    const res = addPrototypeProduct(
      currentShop.id,
      {
        name: newProductName.trim(),
        description: newProductDesc.trim(),
        categoryId: newProductCategory,
        price: isNaN(priceNum) ? 30 : priceNum,
        unit: newProductUnit || 'piece',
        quantity: qtyNum,
      },
      activeUserId
    );

    if (res.success) {
      setNewProductName('');
      setNewProductDesc('');
      setNewProductPrice('');
      setIsAddingProduct(false);
      setProductNotice('New product added to catalog successfully.');
      setTimeout(() => setProductNotice(null), 4000);
      refreshVendorData();
    } else {
      setProductNotice(res.error || 'Failed to add product.');
    }
  };

  const handleStartEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setEditName(prod.name);
    setEditDesc(prod.description || '');
    setEditCategory(prod.categoryId);
    const firstVar = prod.variants[0];
    setEditPrice(firstVar ? String(firstVar.priceMinor / 100) : '30');
    setEditUnit(firstVar ? firstVar.unit : 'piece');
    setEditQty(firstVar ? String(firstVar.quantityAvailable) : '20');
  };

  const handleSaveEditProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const priceNum = parseFloat(editPrice);
    const qtyNum = parseInt(editQty, 10) || 20;
    const activeUserId = user?.id || getPrototypeSessionUser()?.id || '';

    const res = updatePrototypeProduct(
      editingProduct.id,
      {
        name: editName.trim(),
        description: editDesc.trim(),
        categoryId: editCategory,
        price: isNaN(priceNum) ? 30 : priceNum,
        unit: editUnit || 'piece',
        quantity: qtyNum,
      },
      activeUserId
    );

    if (res.success) {
      setEditingProduct(null);
      setProductNotice('Product updated successfully.');
      setTimeout(() => setProductNotice(null), 4000);
      refreshVendorData();
    } else {
      setProductNotice(res.error || 'Failed to update product.');
    }
  };

  const handleDeleteProductProd = (prodId: string) => {
    if (window.confirm('Are you sure you want to delete this item from your catalog?')) {
      const activeUserId = user?.id || getPrototypeSessionUser()?.id || '';
      const res = deletePrototypeProduct(prodId, activeUserId);
      if (res.success) {
        setProductNotice('Product removed.');
        setTimeout(() => setProductNotice(null), 3000);
        refreshVendorData();
      } else {
        setProductNotice(res.error || 'Failed to delete product.');
      }
    }
  };

  const handleAdvanceOrderStatus = (orderId: string, nextStatus: 'ready_for_pickup' | 'completed') => {
    const updated = updatePrototypeOrderStatus(orderId, nextStatus);
    if (updated) {
      refreshVendorData();
    }
  };

  if (!currentShop) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-lg">
        <Card>
          <CardBody className="p-8 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
              <Store className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Store Profile Not Found</h2>
            <p className="text-xs text-slate-500">
              Please sign in with a registered vendor account to manage your shop portal.
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.description?.toLowerCase().includes(productSearch.toLowerCase())
  );

  const pendingCount = orders.filter((o) => o.orderStatus === 'pending_vendor').length;
  const outOfStockCount = products.filter((p) => {
    const v = p.variants[0];
    return !v || v.quantityAvailable <= 0;
  }).length;
  const totalOrdersCount = orders.length;

  return (
    <>
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl py-8 space-y-8 font-sans text-slate-900">
      {/* Real-time New Order Banner notification */}
      {newOrderNotice && (
        <div className="bg-emerald-600 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between animate-bounce">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Bell className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="font-extrabold text-sm">New Order Received! (#{newOrderNotice.orderNumber})</div>
              <div className="text-xs text-emerald-100">
                {newOrderNotice.customerName} ordered {newOrderNotice.itemCount} item(s) for {formatCurrency(newOrderNotice.totalMinor)}.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="bg-white text-emerald-800 hover:bg-emerald-50 text-xs font-bold"
              onClick={() => {
                setActiveTab('orders');
                setNewOrderNotice(null);
              }}
            >
              View Order
            </Button>
            <button
              onClick={() => setNewOrderNotice(null)}
              className="p-1 rounded-lg hover:bg-emerald-700 text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Vendor Portal Hero Header Card */}
      <div className="bg-gradient-to-r from-[#064E46] via-slate-900 to-[#064E46] rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs uppercase tracking-wider border border-emerald-500/30">
                Vendor Portal
              </span>
              <span className="text-xs text-slate-300">ID: {currentShop.id}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              {currentShop.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{currentShop.addressText} {currentShop.landmark ? `(Near ${currentShop.landmark})` : ''}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Open/Closed Toggle */}
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15">
              <span className={`w-3 h-3 rounded-full ${isOpen ? 'bg-emerald-400 animate-ping' : 'bg-rose-500'}`} />
              <span className="text-xs font-bold">{isOpen ? 'Store Open' : 'Store Closed'}</span>
              <button
                type="button"
                onClick={handleToggleAvailability}
                className="ml-2 px-3 py-1 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-extrabold shadow-sm cursor-pointer"
              >
                {isOpen ? 'Close Store' : 'Open Store'}
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="relative z-10 flex items-center gap-2 mt-8 pt-6 border-t border-white/15 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'products'
                ? 'bg-[#08A85A] text-white shadow-lg shadow-emerald-900/40'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Inventory & Products ({products.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('shop')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'shop'
                ? 'bg-[#08A85A] text-white shadow-lg shadow-emerald-900/40'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Store Profile & Settings</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 relative ${
              activeTab === 'orders'
                ? 'bg-[#08A85A] text-white shadow-lg shadow-emerald-900/40'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Pickup Orders</span>
            {pendingCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow">
                {pendingCount}
              </span>
            )}
          </button>
          
          <button
            type="button"
            onClick={() => setIsVoiceAssistantOpen(true)}
            className="ml-auto px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 bg-white text-[#08A85A] hover:bg-emerald-50"
          >
            <Mic className="w-4 h-4" />
            <span>Voice Assistant</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VENDOR LIVE METRICS & MANUAL CROWD TOGGLE SUMMARY BAR */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Out of Stock Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Out of Stock Items</span>
            <div className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              <span>{outOfStockCount}</span>
              {outOfStockCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 text-[11px] font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Restock
                </span>
              )}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* Orders Received Card */}
        <div
          onClick={() => setActiveTab('orders')}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between cursor-pointer hover:border-[#08A85A] transition-colors"
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Orders Received</span>
            <div className="text-2xl font-extrabold text-[#08A85A] flex items-center gap-2">
              <span>{totalOrdersCount}</span>
              {totalOrdersCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold">Active</span>
              ) : (
                <span className="text-xs text-slate-400 font-normal">None yet</span>
              )}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#08A85A] flex items-center justify-center">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Orders Card */}
        <div
          onClick={() => setActiveTab('orders')}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between cursor-pointer hover:border-amber-500 transition-colors"
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Pending Pickup Orders</span>
            <div className="text-2xl font-extrabold text-amber-600">
              {pendingCount}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Manual Crowd Status Control Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <span>Manual Queue Status</span>
            <span className="uppercase text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
              {currentCrowd}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => handleUpdateCrowd('low')}
              className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                currentCrowd === 'low'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              🟢 Low
            </button>
            <button
              type="button"
              onClick={() => handleUpdateCrowd('moderate')}
              className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                currentCrowd === 'moderate'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              🟡 Med
            </button>
            <button
              type="button"
              onClick={() => handleUpdateCrowd('high')}
              className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                currentCrowd === 'high'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              🔴 High
            </button>
          </div>
        </div>
      </div>

      {crowdNotice && (
        <Alert type="success" className="text-xs">
          {crowdNotice}
        </Alert>
      )}

      {productNotice && (
        <Alert type="success" className="text-xs">
          {productNotice}
        </Alert>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: INVENTORY & PRODUCTS */}
      {/* ========================================================================= */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search catalog products..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#08A85A]/20"
              />
            </div>

            <Button
              onClick={() => setIsAddingProduct(true)}
              className="bg-[#08A85A] hover:bg-[#079550] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md cursor-pointer flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </Button>
          </div>

          {/* Add Product Modal Form */}
          {isAddingProduct && (
            <Card className="border-2 border-[#08A85A]/30 shadow-xl bg-emerald-50/20">
              <CardHeader className="flex items-center justify-between bg-white border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#08A85A]" />
                  <span>Add New Product to Store Catalog</span>
                </h3>
                <button
                  onClick={() => setIsAddingProduct(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </CardHeader>
              <CardBody className="p-6">
                <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Product Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Organic Turmeric Powder 500g"
                        value={newProductName}
                        onChange={(e) => setNewProductName(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#08A85A]/20"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Category</label>
                      <select
                        value={newProductCategory}
                        onChange={(e) => setNewProductCategory(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none"
                      >
                        {DEMO_CATEGORIES.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.nameEn}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Price (₹) *</label>
                      <input
                        type="number"
                        step="0.5"
                        required
                        placeholder="e.g. 120"
                        value={newProductPrice}
                        onChange={(e) => setNewProductPrice(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Unit</label>
                        <input
                          type="text"
                          placeholder="packet / kg / piece"
                          value={newProductUnit}
                          onChange={(e) => setNewProductUnit(e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Stock Qty</label>
                        <input
                          type="number"
                          value={newProductQty}
                          onChange={(e) => setNewProductQty(e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-700 mb-1">Description / Details</label>
                      <textarea
                        rows={2}
                        placeholder="Brief product description for nearby buyers."
                        value={newProductDesc}
                        onChange={(e) => setNewProductDesc(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setIsAddingProduct(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" className="bg-[#08A85A] hover:bg-[#079550] text-white">
                      Save Product
                    </Button>
                  </div>
                </form>
              </CardBody>
            </Card>
          )}

          {/* Edit Product Modal Form */}
          {editingProduct && (
            <Card className="border-2 border-amber-500/40 shadow-xl bg-amber-50/20">
              <CardHeader className="flex items-center justify-between bg-white border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-amber-600" />
                  <span>Edit Product: {editingProduct.name}</span>
                </h3>
                <button
                  onClick={() => setEditingProduct(null)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </CardHeader>
              <CardBody className="p-6">
                <form onSubmit={handleSaveEditProduct} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Product Name *</label>
                      <input
                        type="text"
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Category</label>
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                      >
                        {DEMO_CATEGORIES.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.nameEn}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Price (₹) *</label>
                      <input
                        type="number"
                        step="0.5"
                        required
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Unit</label>
                        <input
                          type="text"
                          value={editUnit}
                          onChange={(e) => setEditUnit(e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Stock Qty</label>
                        <input
                          type="number"
                          value={editQty}
                          onChange={(e) => setEditQty(e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingProduct(null)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" className="bg-[#08A85A] hover:bg-[#079550] text-white">
                      Save Changes
                    </Button>
                  </div>
                </form>
              </CardBody>
            </Card>
          )}

          {/* Product Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.length === 0 ? (
              <div className="sm:col-span-3 p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
                <Package className="w-10 h-10 text-slate-300 mx-auto" />
                <div className="text-slate-800 font-bold text-sm">No inventory items found</div>
                <p className="text-xs text-slate-500">
                  Click "Add New Product" to populate your store catalog for nearby buyers.
                </p>
              </div>
            ) : (
              filteredProducts.map((prod) => {
                const variant = prod.variants[0];
                return (
                  <Card key={prod.id} className="hover:shadow-lg transition-all flex flex-col justify-between">
                    <CardBody className="p-5 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                            General
                          </span>
                          <h4 className="font-bold text-slate-900 text-sm mt-1">{prod.name}</h4>
                        </div>
                        <span className="font-extrabold text-[#08A85A] text-sm">
                          {formatCurrency(variant ? variant.priceMinor : 0)}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 line-clamp-2">
                        {prod.description || 'No description provided.'}
                      </p>

                      <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 text-slate-600 font-medium">
                        <span>Stock: <strong className="text-slate-900">{variant ? variant.quantityAvailable : 0} {variant?.unit || 'pcs'}</strong></span>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${variant && variant.quantityAvailable > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                          {variant && variant.quantityAvailable > 0 ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </div>
                    </CardBody>

                    <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
                      <button
                        onClick={() => handleStartEditProduct(prod)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 font-semibold text-slate-700 cursor-pointer flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteProductProd(prod.id)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: STORE PROFILE & SETTINGS */}
      {/* ========================================================================= */}
      {activeTab === 'shop' && (
        <div className="space-y-6 max-w-3xl mx-auto">
          {shopNotice && (
            <Alert type="success" className="text-xs">
              {shopNotice}
            </Alert>
          )}

          <Card>
            <CardHeader className="flex items-center justify-between bg-slate-50/70">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Store className="w-4 h-4 text-[#08A85A]" />
                <span>Store Profile & Location Details</span>
              </h3>
              {!isEditingShop && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditingShop(true)}
                  className="text-xs"
                >
                  <Edit3 className="w-3.5 h-3.5 mr-1" />
                  Edit Profile
                </Button>
              )}
            </CardHeader>
            <CardBody className="p-6">
              {isEditingShop ? (
                <form onSubmit={handleUpdateShopProfile} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Store Name *</label>
                      <input
                        type="text"
                        required
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-[#08A85A]/20"
                        value={shopName}
                        onChange={(e) => setShopName(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Store Category</label>
                      <select
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-[#08A85A]/20"
                        value={shopCategory}
                        onChange={(e) => setShopCategory(e.target.value)}
                      >
                        {DEMO_CATEGORIES.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.nameEn}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-700 mb-1">Store Description</label>
                      <textarea
                        rows={2}
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-[#08A85A]/20"
                        value={shopDesc}
                        onChange={(e) => setShopDesc(e.target.value)}
                        placeholder="Tell nearby shoppers what specialties your store offers."
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Market Address Text *</label>
                      <input
                        type="text"
                        required
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-[#08A85A]/20"
                        value={shopAddress}
                        onChange={(e) => setShopAddress(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Nearby Landmark</label>
                      <input
                        type="text"
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-[#08A85A]/20"
                        value={shopLandmark}
                        onChange={(e) => setShopLandmark(e.target.value)}
                        placeholder="e.g. Near Sanganeri Gate"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsEditingShop(false);
                        setShopName(currentShop.name);
                        setShopDesc(currentShop.description);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" className="bg-[#08A85A] hover:bg-[#079550] text-white">
                      <Save className="w-3.5 h-3.5 mr-1" />
                      Save Store Profile
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                  <div className="space-y-1">
                    <div className="text-slate-400 font-semibold uppercase text-[10px]">Store Name</div>
                    <div className="text-sm font-bold text-slate-900">{currentShop.name}</div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-slate-400 font-semibold uppercase text-[10px]">Category</div>
                    <div className="font-semibold text-slate-800">
                      {currentShop.categoryName || 'General Store'}
                    </div>
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <div className="text-slate-400 font-semibold uppercase text-[10px]">Description</div>
                    <div className="text-slate-700 leading-relaxed">
                      {currentShop.description || 'No description provided.'}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-slate-400 font-semibold uppercase text-[10px]">Market Address</div>
                    <div className="text-slate-700">{currentShop.addressText}</div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-slate-400 font-semibold uppercase text-[10px]">Landmark</div>
                    <div className="text-slate-700">{currentShop.landmark || 'None'}</div>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Quick Crowd Level Reporter Card */}
          <Card>
            <CardHeader className="bg-slate-50/70">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#08A85A]" />
                <span>Store Queue & Crowd Status</span>
              </h3>
            </CardHeader>
            <CardBody className="p-6 space-y-4">
              <p className="text-xs text-slate-600">
                Update customer queue size in real time so nearby shoppers know the best time to pick up orders without waiting in line.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  size="sm"
                  variant={currentCrowd === 'low' ? 'primary' : 'outline'}
                  onClick={() => handleUpdateCrowd('low')}
                  className={`text-xs cursor-pointer ${currentCrowd === 'low' ? 'bg-[#08A85A] hover:bg-[#079550]' : ''}`}
                >
                  🟢 Low (No Queue / Calm)
                </Button>
                <Button
                  size="sm"
                  variant={currentCrowd === 'moderate' ? 'primary' : 'outline'}
                  onClick={() => handleUpdateCrowd('moderate')}
                  className={`text-xs cursor-pointer ${currentCrowd === 'moderate' ? 'bg-amber-600 hover:bg-amber-700' : ''}`}
                >
                  🟡 Medium (Moderate / 3-5 min wait)
                </Button>
                <Button
                  size="sm"
                  variant={currentCrowd === 'high' ? 'danger' : 'outline'}
                  onClick={() => handleUpdateCrowd('high')}
                  className="text-xs cursor-pointer"
                >
                  🔴 High (Busy / Peak rush)
                </Button>
              </div>

              {crowdNotice && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-900 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#08A85A]" />
                  <span>{crowdNotice}</span>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Counter Payment Acceptance Policy Card */}
          <Card>
            <CardHeader className="bg-slate-50/70">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#08A85A]" />
                <span>Store Counter Payment Modes</span>
              </h3>
            </CardHeader>
            <CardBody className="p-6 space-y-4 text-xs">
              <p className="text-slate-600">
                Choose the payment options your counter accepts from customers when they arrive to pick up their items.
              </p>

              <div className="flex flex-wrap gap-4 pt-1">
                <button
                  type="button"
                  onClick={() => handleTogglePaymentMethod('pay_at_shop')}
                  className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-colors cursor-pointer ${
                    vendorSettings.acceptedPaymentMethods.includes('pay_at_shop')
                      ? 'bg-emerald-50/60 border-[#08A85A] text-emerald-950 font-bold'
                      : 'bg-white border-slate-200 text-slate-500'
                  }`}
                >
                  <Banknote className="w-5 h-5 text-[#08A85A]" />
                  <div className="text-left">
                    <div className="text-slate-900 font-bold">Pay at Shop Counter</div>
                    <div className="text-[11px] text-slate-500">Cash or UPI scan at counter</div>
                  </div>
                  {vendorSettings.acceptedPaymentMethods.includes('pay_at_shop') && (
                    <CheckCircle2 className="w-4 h-4 text-[#08A85A] ml-2" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleTogglePaymentMethod('online')}
                  className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-colors cursor-pointer ${
                    vendorSettings.acceptedPaymentMethods.includes('online')
                      ? 'bg-emerald-50/60 border-[#08A85A] text-emerald-950 font-bold'
                      : 'bg-white border-slate-200 text-slate-500'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-[#08A85A]" />
                  <div className="text-left">
                    <div className="text-slate-900 font-bold">Online Payment Pre-order</div>
                    <div className="text-[11px] text-slate-500">Simulated card/netbanking</div>
                  </div>
                  {vendorSettings.acceptedPaymentMethods.includes('online') && (
                    <CheckCircle2 className="w-4 h-4 text-[#08A85A] ml-2" />
                  )}
                </button>
              </div>

              {settingsNotice && (
                <Alert type="info" className="text-xs">
                  {settingsNotice}
                </Alert>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: INCOMING CUSTOMER PICKUP ORDERS */}
      {/* ========================================================================= */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#08A85A]" />
              <span>Incoming Customer Pickup Orders ({orders.length})</span>
            </h3>
            <span className="text-xs text-slate-500">
              Only orders placed for <span className="font-bold text-slate-800">{currentShop.name}</span> appear here.
            </span>
          </div>

          <Card>
            <CardBody className="p-4 space-y-3">
              {orders.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#08A85A] mx-auto flex items-center justify-center">
                    <Clock className="w-7 h-7" />
                  </div>
                  <div className="text-slate-800 font-bold text-sm">{t.vendor.noOrdersYet}</div>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    When nearby customers place orders for pickup from your shop, they will arrive here in real time.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {orders.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-5 rounded-2xl border border-emerald-200/80 bg-emerald-50/20 space-y-3 text-xs shadow-xs"
                    >
                      <div className="flex items-center justify-between font-bold text-slate-900 border-b border-emerald-200/60 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-emerald-950">Order #{ord.orderNumber}</span>
                          <span className="text-[11px] text-slate-500">
                            {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <Badge variant={ord.orderStatus === 'completed' ? 'success' : 'warning'}>
                          {ord.orderStatus.replace(/_/g, ' ')}
                        </Badge>
                      </div>

                      <div className="text-slate-700 space-y-1.5">
                        <div className="font-semibold text-slate-900">Items:</div>
                        {ord.items.map((it) => (
                          <div key={it.id} className="flex justify-between text-slate-600">
                            <span>
                              {it.quantity}x {it.productNameSnapshot} ({it.variantSnapshot})
                            </span>
                            <span className="font-medium text-slate-800">
                              {formatCurrency(it.lineTotalMinor)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between font-bold text-slate-900">
                        <div>
                          <span>Total: </span>
                          <span className="text-[#08A85A]">{formatCurrency(ord.totalMinor)}</span>
                          <span className="text-[11px] text-slate-500 font-normal ml-1">
                            ({ord.paymentMethod.replace(/_/g, ' ')})
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-600 font-medium truncate max-w-[140px]">
                          Shopper: {ord.customerName || 'Customer'}
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="pt-3 flex items-center justify-end gap-2 border-t border-emerald-200/60">
                        {ord.orderStatus === 'pending_vendor' && (
                          <Button
                            size="sm"
                            className="text-xs px-3.5 py-1.5 bg-[#08A85A] hover:bg-[#079550] text-white font-bold"
                            onClick={() => handleAdvanceOrderStatus(ord.id, 'ready_for_pickup')}
                          >
                            Mark Ready for Pickup
                          </Button>
                        )}
                        {ord.orderStatus === 'ready_for_pickup' && (
                          <Button
                            size="sm"
                            className="text-xs px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
                            onClick={() => handleAdvanceOrderStatus(ord.id, 'completed')}
                          >
                            Confirm Handover & Complete
                          </Button>
                        )}
                        {ord.orderStatus === 'completed' && (
                          <span className="text-emerald-700 font-bold text-[11px] flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Completed & Handed Over
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {/* Floating Microphone Button */}
      <button
        onClick={() => setIsVoiceAssistantOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-[#08A85A] text-white rounded-full shadow-lg hover:bg-[#079550] z-40"
      >
        <Mic className="w-6 h-6" />
      </button>

      {/* Voice Assistant Panel */}
      {isVoiceAssistantOpen && (
        <VoiceAssistantPanel
          onClose={() => setIsVoiceAssistantOpen(false)}
          onProcessCommand={handleVoiceCommand}
          onConfirmExecution={handleConfirmExecution}
          onCancelProposal={handleCancelProposal}
          proposal={proposal}
          feedback={voiceFeedback}
          onSelectOption={handleSelectOption}
          isExecuting={isExecutingVoice}
          activities={voiceActivities}
          currentLanguage={voiceLanguage}
          onChangeLanguage={setVoiceLanguage}
        />
      )}
    </div>
    </>
  );
};
