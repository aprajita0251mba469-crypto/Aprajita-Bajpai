import { onAuthStateChanged, signOut, type User as FirebaseUser } from 'firebase/auth';
import { CheckCircle2, MessageCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';
import { CheckoutView } from './components/CheckoutView.tsx';
import { CustomerDashboard } from './components/CustomerDashboard.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { HomeAndCatalog } from './components/HomeAndCatalog.tsx';
import { Navbar } from './components/Navbar.tsx';
import { OrderTrackingView } from './components/OrderTrackingView.tsx';
import {
  getProductPlasticMrp,
  getProductPrice,
  SEED_PRODUCTS,
  SEED_SUSTAINABILITY_CONFIG,
  WHATSAPP_SUPPORT_NUMBER,
} from './data/seedCatalog.ts';
import { auth } from './lib/firebase.ts';
import {
  removeCartItem,
  seedDefaultCatalog,
  subscribeAddresses,
  subscribeAdminStatus,
  subscribeCart,
  subscribeProducts,
  subscribeSustainabilityConfig,
  subscribeUserOrders,
  subscribeUserProfile,
  syncGuestCartToFirestore,
  syncUserProfile,
  updateCartItem,
  upsertCartItem,
} from './lib/storeService.ts';
import type {
  Address,
  AppView,
  CartItem,
  ContainerMode,
  GuestCartItem,
  Order,
  OrderItem,
  Product,
  SustainabilityConfig,
  UserProfile,
  VolumeMl,
} from './types.ts';

const GUEST_CART_KEY = 'refill_plus_guest_cart_v1';

function loadGuestCart(): GuestCartItem[] {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    return raw ? (JSON.parse(raw) as GuestCartItem[]) : [];
  } catch {
    return [];
  }
}

export default function App() {
  const [activeView, setActiveView] = useState<AppView>('home');
  const [authReady, setAuthReady] = useState(false);
  const [fbUser, setFbUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [products, setProducts] = useState<Product[]>(SEED_PRODUCTS);
  const [catalogFromDb, setCatalogFromDb] = useState(false);
  const [sustConfig, setSustConfig] = useState<SustainabilityConfig>(SEED_SUSTAINABILITY_CONFIG);

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [guestCart, setGuestCart] = useState<GuestCartItem[]>(loadGuestCart);
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);

  const [cartOpen, setCartOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  // Persist guest cart locally until user signs in
  useEffect(() => {
    try {
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(guestCart));
    } catch {
      // Ignore storage quota errors
    }
  }, [guestCart]);

  // Public product & sustainability listeners
  useEffect(() => {
    const unsubProducts = subscribeProducts((list, fromDb) => {
      setProducts(list);
      setCatalogFromDb(fromDb);
    });
    const unsubSust = subscribeSustainabilityConfig((cfg) => {
      setSustConfig(cfg);
    });
    return () => {
      unsubProducts();
      unsubSust();
    };
  }, []);

  // Auth listener
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      setFbUser(user);
      setAuthReady(true);

      if (user) {
        await syncUserProfile(user);
        const pendingGuest = loadGuestCart();
        if (pendingGuest.length > 0 && user.emailVerified) {
          await syncGuestCartToFirestore(user.uid, pendingGuest);
          setGuestCart([]);
          localStorage.removeItem(GUEST_CART_KEY);
        }
      } else {
        setUserProfile(null);
        setIsAdmin(false);
        setCartItems([]);
        setOrders([]);
        setAddresses([]);
      }
    });
    return () => unsubAuth();
  }, []);

  // Authenticated user Firestore subscriptions
  useEffect(() => {
    if (!authReady || !fbUser) return;

    const unsubProfile = subscribeUserProfile(fbUser.uid, setUserProfile);
    const unsubAdmin = subscribeAdminStatus(
      fbUser.uid,
      fbUser.email,
      fbUser.emailVerified,
      (adminFlag) => {
        setIsAdmin(adminFlag);
      }
    );

    let unsubCart = () => {};
    let unsubOrders = () => {};
    let unsubAddresses = () => {};

    if (fbUser.emailVerified) {
      unsubCart = subscribeCart(fbUser.uid, setCartItems);
      unsubOrders = subscribeUserOrders(fbUser.uid, setOrders);
      unsubAddresses = subscribeAddresses(fbUser.uid, setAddresses);
    }

    return () => {
      unsubProfile();
      unsubAdmin();
      unsubCart();
      unsubOrders();
      unsubAddresses();
    };
  }, [authReady, fbUser]);

  // Auto-seed default catalog into Firestore when verified admin connects for the first time
  useEffect(() => {
    if (isAdmin && !catalogFromDb) {
      void seedDefaultCatalog();
    }
  }, [isAdmin, catalogFromDb]);

  const activeCart: (CartItem | GuestCartItem)[] = fbUser?.emailVerified ? cartItems : guestCart;
  const totalCartCount = activeCart.reduce((sum, i) => sum + i.quantity, 0);

  const handleNavigate = (view: AppView, sectionId?: string) => {
    setActiveView(view);
    if (sectionId) {
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleAddToCart = async (payload: {
    product: Product;
    volumeMl: VolumeMl;
    quantity: number;
    containerMode: ContainerMode;
  }) => {
    const unitPrice = getProductPrice(payload.product, payload.volumeMl);
    const plasticMrp = getProductPlasticMrp(payload.product, payload.volumeMl);

    if (fbUser && fbUser.emailVerified) {
      await upsertCartItem(fbUser.uid, {
        productId: payload.product.id,
        productName: payload.product.name,
        imageUrl: payload.product.imageUrl,
        volumeMl: payload.volumeMl,
        unitPrice,
        plasticMrp,
        quantity: payload.quantity,
        containerMode: payload.containerMode,
      });
    } else {
      const guestId = `guest_${payload.product.id}_${payload.volumeMl}_${payload.containerMode}`;
      setGuestCart((prev) => {
        const existing = prev.find((i) => i.id === guestId);
        if (existing) {
          return prev.map((i) =>
            i.id === guestId ? { ...i, quantity: Math.min(50, i.quantity + payload.quantity) } : i
          );
        }
        return [
          ...prev,
          {
            id: guestId,
            productId: payload.product.id,
            productName: payload.product.name,
            imageUrl: payload.product.imageUrl,
            volumeMl: payload.volumeMl,
            unitPrice,
            plasticMrp,
            quantity: payload.quantity,
            containerMode: payload.containerMode,
          },
        ];
      });
    }

    showToast(
      `Added ${payload.product.name} (${
        payload.volumeMl === 1000 ? '1L' : `${payload.volumeMl}ml`
      }) to your refill bag.`
    );
    setCartOpen(true);
  };

  const handleUpdateCartItem = async (
    itemId: string,
    updates: {
      volumeMl: VolumeMl;
      unitPrice: number;
      plasticMrp: number;
      quantity: number;
      containerMode: ContainerMode;
    }
  ) => {
    if (fbUser && fbUser.emailVerified && !itemId.startsWith('guest_')) {
      await updateCartItem(itemId, updates);
    } else {
      setGuestCart((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, ...updates } : i))
      );
    }
  };

  const handleRemoveCartItem = async (itemId: string) => {
    if (fbUser && fbUser.emailVerified && !itemId.startsWith('guest_')) {
      await removeCartItem(itemId);
    } else {
      setGuestCart((prev) => prev.filter((i) => i.id !== itemId));
    }
  };

  const handleReorderItems = async (items: OrderItem[]) => {
    for (const item of items) {
      const prod = products.find((p) => p.id === item.productId) || products[0];
      if (prod) {
        await handleAddToCart({
          product: prod,
          volumeMl: item.volumeMl,
          quantity: item.quantity,
          containerMode: item.containerMode,
        });
      }
    }
    setActiveView('checkout');
  };

  const handleLogout = async () => {
    await signOut(auth);
    setActiveView('home');
    showToast('Signed out of REFILL+.');
  };

  const liveStats = {
    ordersCount: orders.filter((o) => o.status !== 'Cancelled').length,
    bottlesAvoided: orders.reduce(
      (s, o) => (o.status !== 'Cancelled' ? s + o.bottlesAvoided : s),
      0
    ),
    moneySaved: orders.reduce((s, o) => (o.status !== 'Cancelled' ? s + o.moneySaved : s), 0),
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col bg-[#FAFAF8] text-[#111814]">
        <Navbar
          activeView={activeView}
          onNavigate={handleNavigate}
          cartCount={totalCartCount}
          onOpenCart={() => setCartOpen(true)}
          userProfile={userProfile}
          isAdmin={isAdmin}
          onOpenAuth={() => setAuthOpen(true)}
        />

        <main className="flex-1">
          {(activeView === 'home' || activeView === 'catalog') && (
            <HomeAndCatalog
              products={products}
              sustainabilityConfig={sustConfig}
              liveStats={liveStats}
              onAddToCart={handleAddToCart}
              onScrollToSection={(id) =>
                document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
              }
            />
          )}

          {activeView === 'checkout' && (
            <CheckoutView
              userProfile={userProfile}
              cartItems={activeCart}
              addresses={addresses}
              onBackToShop={() => handleNavigate('home', 'catalog')}
              onOpenAuth={() => setAuthOpen(true)}
              onOrderCreated={(orderId) => {
                setSelectedOrderId(orderId);
                setActiveView('orders');
              }}
            />
          )}

          {activeView === 'orders' && (
            <OrderTrackingView
              userProfile={userProfile}
              orders={orders}
              initialOrderId={selectedOrderId}
              onOpenAuth={() => setAuthOpen(true)}
              onReorderItems={handleReorderItems}
            />
          )}

          {activeView === 'dashboard' && (
            <CustomerDashboard
              userProfile={userProfile}
              isAdmin={isAdmin}
              orders={orders}
              addresses={addresses}
              onOpenAuth={() => setAuthOpen(true)}
              onLogout={handleLogout}
              onViewOrder={(id) => {
                setSelectedOrderId(id);
                setActiveView('orders');
              }}
              onReorderItems={handleReorderItems}
              onOpenAdmin={() => setActiveView('admin')}
              onShopNow={() => handleNavigate('home', 'catalog')}
            />
          )}

          {activeView === 'admin' && (
            <AdminDashboard
              userProfile={userProfile}
              isAdmin={isAdmin}
              products={products}
              catalogFromDb={catalogFromDb}
              sustainabilityConfig={sustConfig}
              onOpenAuth={() => setAuthOpen(true)}
            />
          )}
        </main>

        {/* Cart Drawer */}
        <CartDrawer
          isOpen={cartOpen}
          onClose={() => setCartOpen(false)}
          items={activeCart}
          products={products}
          onUpdateItem={handleUpdateCartItem}
          onRemoveItem={handleRemoveCartItem}
          onProceedToCheckout={() => {
            setCartOpen(false);
            setActiveView('checkout');
          }}
        />

        {/* Auth Modal */}
        <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />

        {/* Success Toast */}
        {toast && (
          <div className="fixed bottom-5 left-5 z-50 bg-[#111814] text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2.5 text-xs font-medium max-w-sm">
            <CheckCircle2 className="w-4 h-4 text-[#DDF3E4] shrink-0" />
            <span>{toast}</span>
          </div>
        )}

        {/* WhatsApp Campus Support Button */}
        <a
          href={`https://wa.me/${WHATSAPP_SUPPORT_NUMBER}?text=${encodeURIComponent(
            'Hi REFILL+ team, I need help with my campus refill order.'
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp Support"
          className="fixed bottom-5 right-5 z-30 inline-flex items-center gap-2 px-4 py-2.5 bg-[#176B45] hover:bg-[#125436] text-white text-xs font-semibold rounded-xl shadow-lg transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="hidden sm:inline">WhatsApp Support</span>
        </a>
      </div>
    </ErrorBoundary>
  );
}
