import React, { useState, useEffect } from 'react';
import { Shop, Product, ProductVariant, Order } from '../../types/index.ts';
import { getPrototypeShops, getPrototypeProducts, getPrototypeOrders, getPrototypeSessionUser, getPrototypeVendorSettings } from '../../services/storage/prototypeStorage.ts';
import { ShoppingCart, Search, Info, MapPin, Store, Package } from 'lucide-react';
import { DEMO_CATEGORIES } from '../../services/api/index.ts';

interface CustomerPortalProps {
  onAddToCart: (shop: Shop, product: Product, variant: ProductVariant) => void;
  onOpenCart: () => void;
  onOpenSetupGuide: () => void;
  onNavigate: (route: string) => void;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({
  onAddToCart,
  onOpenCart,
  onNavigate,
}) => {
  const [shops, setShops] = useState<Shop[]>(getPrototypeShops());
  const [products, setProducts] = useState<Product[]>(getPrototypeProducts());
  const [orders, setOrders] = useState<Order[]>([]);
  const currentUser = getPrototypeSessionUser();
  const currentUserRef = React.useRef(currentUser);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      setOrders(getPrototypeOrders(currentUser.id, 'customer'));
    }
  }, [currentUser]);

  useEffect(() => {
    const handleStorageUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ key: string }>;
      if (customEvent.detail.key === 'aaspass_proto_shops_v2') {
        setShops(getPrototypeShops());
      } else if (customEvent.detail.key === 'aaspass_proto_products_v2') {
        setProducts(getPrototypeProducts());
      } else if (customEvent.detail.key === 'aaspass_proto_orders_v2' && currentUserRef.current) {
        setOrders(getPrototypeOrders(currentUserRef.current.id, 'customer'));
      }
    };

    window.addEventListener('aaspass_storage_update', handleStorageUpdate);
    return () => window.removeEventListener('aaspass_storage_update', handleStorageUpdate);
  }, []);

  const handleNavigation = (route: string) => {
    if (route === 'orders') setSelectedView('orders');
    else if (route === 'wishlist') setSelectedView('wishlist');
    else if (route === 'cart') setSelectedView('cart');
    else if (route === 'settings') setSelectedView('settings');
    else if (route === 'help') setSelectedView('help');
    else if (route === 'categories') setSelectedView('categories');
    else setSelectedView('dashboard');
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<'dashboard' | 'shop-details' | 'product-details' | 'orders' | 'wishlist' | 'cart' | 'settings' | 'help' | 'categories'>('dashboard');
  const [selectedItem, setSelectedItem] = useState<Shop | Product | null>(null);

  const filteredShops = shops.filter(shop =>
    shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    shop.categoryName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const Dashboard = () => (
    <div className="space-y-8">
      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex items-center justify-between overflow-hidden relative">
        <div className="space-y-4 max-w-lg z-10">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Good Things Are Nearby!</h1>
          <p className="text-slate-600">Discover local shops, fresh products and great deals — right in your neighbourhood.</p>
          <div className="flex gap-2">
            <input 
              className="flex-1 p-3 rounded-xl border border-slate-200" 
              placeholder="Search for shops, products..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="bg-[#08A85A] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2">
              <Search size={20} /> Search
            </button>
          </div>
        </div>
      </div>

      {searchQuery ? (
        <section>
          <h2 className="font-bold text-lg mb-4">Search Results</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredProducts.map(product => (
              <div key={product.id} className="bg-white p-6 rounded-2xl border flex flex-col gap-3">
                <h3 className="font-bold text-lg">{product.name}</h3>
                <p className="text-sm text-slate-500">{product.shopName}</p>
                <p className="text-lg font-bold">₹{(product.variants[0].priceMinor / 100).toFixed(2)}</p>
                <button 
                  onClick={() => onAddToCart({ id: product.shopId } as Shop, product, product.variants[0])}
                  className="mt-auto bg-[#08A85A] text-white p-2 rounded-lg font-bold text-sm"
                >Add to Cart</button>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section>
          <h2 className="font-bold text-lg mb-4">Popular Nearby Shops</h2>
          <div className="grid grid-cols-2 gap-6">
            {filteredShops.slice(0, 4).map(shop => (
              <div key={shop.id} className="bg-white p-6 rounded-2xl border flex flex-col gap-3">
                <div className="h-32 bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center text-slate-400">
                    <Store size={32} />
                </div>
                <h3 className="font-bold text-lg">{shop.name}</h3>
                <p className="text-sm text-slate-500">{shop.addressText}</p>
                <div className="flex gap-2 mt-auto items-center justify-between">
                  <span className={`text-xs px-2 py-1 rounded ${shop.latestCrowd?.level === 'high' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    Crowd: {shop.latestCrowd?.level || 'unknown'}
                  </span>
                  <button 
                    onClick={() => { setSelectedItem(shop); setSelectedView('shop-details'); }}
                    className="bg-slate-100 text-slate-700 p-2 rounded-lg font-bold text-sm"
                  >View Shop</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );

  const ShopDetails = () => {
    const shop = selectedItem as Shop;
    return (
      <div className="bg-white p-8 rounded-3xl border">
        <button onClick={() => setSelectedView('dashboard')} className="mb-4 text-[#08A85A] font-bold">← Back to Dashboard</button>
        <div className="h-64 bg-slate-100 rounded-3xl mb-6 overflow-hidden flex items-center justify-center text-slate-400">
          <Store size={64} />
        </div>
        <h1 className="text-3xl font-bold mb-2">{shop.name}</h1>
        <p className="text-slate-600 mb-6">{shop.description}</p>
        <div className="flex items-center gap-2 text-slate-500 mb-6">
          <MapPin size={18} /> {shop.addressText}
        </div>
        <h2 className="font-bold text-xl mb-4">Products</h2>
        <div className="grid grid-cols-1 gap-4">
        </div>
      </div>
    );
  };

  const Orders = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">My Orders</h2>
      {orders.map(order => {
        const settings = getPrototypeVendorSettings(order.shopId);
        const createdAt = new Date(order.createdAt).getTime();
        const etaMinutes = Math.max(0, settings.preparationLeadMinutes - Math.round((Date.now() - createdAt) / 60000));
        
        return (
          <div key={order.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">{order.shopName}</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${order.orderStatus === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                {order.orderStatus.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-slate-500">Order #{order.orderNumber}</p>
            <div className="space-y-2">
              {order.items.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.quantity}x {item.productNameSnapshot} ({item.variantSnapshot})</span>
                  <span>₹{(item.lineTotalMinor / 100).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-4 flex justify-between items-center text-sm font-bold">
              <span>Total: ₹{(order.totalMinor / 100).toFixed(2)}</span>
              {order.orderStatus !== 'completed' && (
                <span className="text-[#08A85A]">Ready in ~{etaMinutes} mins</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const filteredProducts = products.filter(product =>
    (product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     (product.shopName?.toLowerCase() || '').includes(searchQuery.toLowerCase())) &&
    (selectedCategory ? product.categoryId === selectedCategory : true)
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <div className="border-b border-slate-200 bg-white p-4 flex justify-between items-center">
            <h1 className="text-xl font-bold text-[#064E46]">Nukkad</h1>
            <button onClick={onOpenCart} className="p-2 bg-slate-100 rounded-full"><ShoppingCart size={20} /></button>
        </div>
        
        <div className="flex-1 overflow-auto p-8">
            {selectedView === 'dashboard' && <Dashboard />}
            {selectedView === 'shop-details' && <ShopDetails />}
            {selectedView === 'orders' && <Orders />}
            {selectedView === 'wishlist' && <div className="text-2xl font-bold">Wishlist View</div>}
            {selectedView === 'cart' && <div className="text-2xl font-bold">Cart View</div>}
            {selectedView === 'settings' && <div className="text-2xl font-bold">Settings View</div>}
            {selectedView === 'help' && <div className="text-2xl font-bold">Help & Support View</div>}
            {selectedView === 'categories' && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  {selectedCategory && <button onClick={() => setSelectedCategory(null)} className="text-[#08A85A] font-bold">← Back to Categories</button>}
                  <h2 className="text-3xl font-bold">{selectedCategory ? DEMO_CATEGORIES.find(c => c.id === selectedCategory)?.nameEn : 'Shop by Category'}</h2>
                </div>
                
                {!selectedCategory ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {DEMO_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center gap-4 hover:border-[#08A85A] transition-all"
                        onClick={() => setSelectedCategory(cat.id)}
                      >
                        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-[#08A85A]">
                          <Store size={32} />
                        </div>
                        <span className="font-bold text-lg">{cat.nameEn}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredProducts.map(product => (
                      <div key={product.id} className="bg-white p-6 rounded-2xl border flex flex-col gap-3">
                        <h3 className="font-bold text-lg">{product.name}</h3>
                        <p className="text-sm text-slate-500">{product.shopName}</p>
                        <p className="text-lg font-bold">₹{(product.variants[0].priceMinor / 100).toFixed(2)}</p>
                        <button 
                          onClick={() => onAddToCart({ id: product.shopId } as Shop, product, product.variants[0])}
                          className="mt-auto bg-[#08A85A] text-white p-2 rounded-lg font-bold text-sm"
                        >Add to Cart</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
        </div>
      </main>
    </div>
  );
};
