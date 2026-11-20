import {
  ArrowRight,
  ChevronDown,
  Droplets,
  Leaf,
  MessageCircle,
  Minus,
  Plus,
  Recycle,
  Search,
  ShieldCheck,
  Truck,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  FAQ_ITEMS,
  getProductPlasticMrp,
  getProductPrice,
  HERO_IMAGE_URL,
  REUSABLE_CONTAINER_DEPOSIT_INR,
  SAMPLE_TESTIMONIALS,
  WHATSAPP_SUPPORT_NUMBER,
} from '../data/seedCatalog.ts';
import type {
  ContainerMode,
  Product,
  ProductCategory,
  SustainabilityConfig,
  VolumeMl,
} from '../types.ts';
import { ProductImage } from './ProductImage.tsx';

interface HomeAndCatalogProps {
  products: Product[];
  sustainabilityConfig: SustainabilityConfig;
  liveStats: {
    ordersCount: number;
    bottlesAvoided: number;
    moneySaved: number;
  };
  onAddToCart: (payload: {
    product: Product;
    volumeMl: VolumeMl;
    quantity: number;
    containerMode: ContainerMode;
  }) => void;
  onScrollToSection: (id: string) => void;
}

const CATEGORIES: ('All' | ProductCategory)[] = [
  'All',
  'Personal Care',
  'Kitchen',
  'Home Care',
  'Laundry',
];

const VOLUMES: VolumeMl[] = [250, 500, 1000];

export function HomeAndCatalog({
  products,
  sustainabilityConfig,
  liveStats,
  onAddToCart,
  onScrollToSection,
}: HomeAndCatalogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | ProductCategory>('All');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'savings'>(
    'featured'
  );
  const [cardSelections, setCardSelections] = useState<
    Record<string, { volumeMl: VolumeMl; quantity: number; containerMode: ContainerMode }>
  >({});
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  // Interactive Savings Calculator state
  const [calcRoommates, setCalcRoommates] = useState(2);
  const [calcRefillsPerMonth, setCalcRefillsPerMonth] = useState(4);

  const getSelection = (productId: string) =>
    cardSelections[productId] || { volumeMl: 500, quantity: 1, containerMode: 'own' };

  const setSelection = (
    productId: string,
    patch: Partial<{ volumeMl: VolumeMl; quantity: number; containerMode: ContainerMode }>
  ) => {
    const current = getSelection(productId);
    setCardSelections((prev) => ({
      ...prev,
      [productId]: { ...current, ...patch },
    }));
  };

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = products.filter((p) => {
      if (!p.active) return false;
      const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.scent || '').toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'price-asc') return a.price500ml - b.price500ml;
      if (sortBy === 'price-desc') return b.price500ml - a.price500ml;
      if (sortBy === 'savings') {
        return b.mrpPlastic500ml - b.price500ml - (a.mrpPlastic500ml - a.price500ml);
      }
      return Number(b.featured) - Number(a.featured);
    });
  }, [products, searchQuery, selectedCategory, sortBy]);

  // Combined Sustainability Totals (Clearly separating Demo Baseline vs Live Recorded Orders)
  const totalRefills = sustainabilityConfig.demoBaselineRefills + liveStats.ordersCount;
  const totalBottlesAvoided = Math.round(
    sustainabilityConfig.demoBaselineBottlesAvoided + liveStats.bottlesAvoided
  );
  const totalMoneySaved = Math.round(
    sustainabilityConfig.demoBaselineMoneySaved + liveStats.moneySaved
  );
  const totalPlasticKg = (
    (totalBottlesAvoided * sustainabilityConfig.plasticGramsPer500mlBottle) /
    1000
  ).toFixed(1);
  const totalCo2Kg = ((totalBottlesAvoided * sustainabilityConfig.co2GramsPerBottle) / 1000).toFixed(
    1
  );

  // Calculator math (500ml average savings ~ ₹70 vs plastic MRP)
  const avgSavingPer500ml = 70;
  const estSemesterSavings = calcRoommates * calcRefillsPerMonth * avgSavingPer500ml * 5;
  const estSemesterBottles = calcRoommates * calcRefillsPerMonth * 5;

  return (
    <div>
      {/* 1. Storefront Hero */}
      <section className="bg-white border-b border-[#E4E8E2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-12 lg:pt-14 lg:pb-16">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center">
              <p className="text-xs font-medium text-[#176B45] tracking-wide mb-3">
                DBS Global University, Dehradun · Refill More. Waste Less.
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-[46px] font-bold text-[#111814] leading-[1.1] tracking-tight text-balance mb-5">
                Your Everyday Essentials, Without the Plastic Waste.
              </h1>
              <p className="text-base text-[#4A5850] leading-relaxed max-w-xl mb-8">
                Affordable, plant-based handwash, dishwash, floor cleaner, and laundry refills
                delivered straight to hostels and homes around DBS Global University. Bring your
                own bottle or request a sanitized reusable container.
              </p>
              <div className="flex flex-wrap items-center gap-3.5">
                <button
                  type="button"
                  onClick={() => onScrollToSection('catalog')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#176B45] hover:bg-[#125436] text-white text-sm font-semibold rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Shop Refills</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onScrollToSection('how-it-works')}
                  className="inline-flex items-center px-6 py-3 bg-white border border-[#D4DBD3] hover:border-[#176B45] text-[#111814] text-sm font-semibold rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  How It Works
                </button>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="h-72 sm:h-96 lg:h-full min-h-[340px] rounded-2xl overflow-hidden border border-[#E4E8E2] bg-[#F3F5F2]">
                <ProductImage
                  src={HERO_IMAGE_URL}
                  alt="REFILL+ zero-waste household liquid refill station with reusable amber glass dispenser bottles"
                  fallbackLabel="REFILL+ Zero-Waste Refill Station"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* 4-Column Benchmark Strip */}
          <div className="mt-10 pt-8 border-t border-[#E4E8E2] grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-2xl font-bold font-mono tabular-nums text-[#176B45]">38–46%</p>
              <p className="text-sm font-medium text-[#111814] mt-1">Lower than plastic MRP</p>
              <p className="text-xs text-[#6E7C74] mt-0.5">Student-friendly refill pricing</p>
            </div>
            <div>
              <p className="text-2xl font-bold font-mono tabular-nums text-[#111814]">
                250ml · 500ml · 1L
              </p>
              <p className="text-sm font-medium text-[#111814] mt-1">Three flexible refill sizes</p>
              <p className="text-xs text-[#6E7C74] mt-0.5">Sized for dorms and families</p>
            </div>
            <div>
              <p className="text-2xl font-bold font-mono tabular-nums text-[#111814]">28g HDPE</p>
              <p className="text-sm font-medium text-[#111814] mt-1">Saved per 500 ml refill</p>
              <p className="text-xs text-[#6E7C74] mt-0.5">Configurable impact formula</p>
            </div>
            <div>
              <p className="text-2xl font-bold font-mono tabular-nums text-[#111814]">4 Daily Slots</p>
              <p className="text-sm font-medium text-[#111814] mt-1">Campus & hostel delivery</p>
              <p className="text-xs text-[#6E7C74] mt-0.5">DBS hostels, Selaqui & Pondha</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Interactive Refill Product Catalog */}
      <section id="catalog" className="py-14 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-medium text-[#176B45] mb-1.5">Refill Catalog</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#111814] tracking-tight">
                Everyday Household Liquids, Zero New Plastic
              </h2>
            </div>
            <p className="text-sm text-[#4A5850] max-w-md">
              Select your volume, pick own bottle or reusable bottle, and add directly to your
              refill bag.
            </p>
          </div>

          {/* Search, Category Tabs & Sort Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 mb-8 border-b border-[#E4E8E2]">
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#F3F5F2] rounded-xl">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-white text-[#176B45] shadow-xs'
                      : 'text-[#4A5850] hover:text-[#111814]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-[#6E7C74] absolute left-3.5 top-3" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search handwash, citrus, pine..."
                  aria-label="Search refill products"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border border-[#D4DBD3] rounded-xl focus:outline-none focus:border-[#176B45]"
                />
              </div>

              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as 'featured' | 'price-asc' | 'price-desc' | 'savings')
                }
                aria-label="Sort products"
                className="px-3.5 py-2.5 text-sm bg-white border border-[#D4DBD3] rounded-xl text-[#111814] focus:outline-none focus:border-[#176B45] cursor-pointer"
              >
                <option value="featured">Sort: Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="savings">Highest Plastic Savings</option>
              </select>
            </div>
          </div>

          {/* Product Grid */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white border border-[#E4E8E2] rounded-2xl p-12 text-center">
              <p className="text-base font-semibold text-[#111814] mb-1">
                No refill products match your search
              </p>
              <p className="text-sm text-[#4A5850] mb-4">
                Try clearing your filter or searching for handwash, dishwash, floor cleaner, or
                detergent.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
                className="px-4 py-2 text-sm font-medium bg-[#176B45] text-white rounded-xl cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => {
                const sel = getSelection(product.id);
                const price = getProductPrice(product, sel.volumeMl);
                const mrp = getProductPlasticMrp(product, sel.volumeMl);
                const savings = Math.max(0, mrp - price);
                const outOfStock = product.stockLitres <= 0;

                return (
                  <article
                    key={product.id}
                    className="bg-white border border-[#E4E8E2] rounded-2xl overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="aspect-4/3 bg-[#F3F5F2] overflow-hidden relative">
                      <ProductImage
                        src={product.imageUrl}
                        alt={product.name}
                        fallbackLabel={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="p-5 flex-1 flex flex-col">
                      {/* Clean unboxed metadata */}
                      <div className="flex items-center gap-1.5 text-xs text-[#6E7C74] mb-1">
                        <span>{product.category}</span>
                        {product.scent && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="truncate">{product.scent}</span>
                          </>
                        )}
                      </div>

                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h3 className="text-base font-semibold text-[#111814] leading-snug">
                          {product.name}
                        </h3>
                        <button
                          type="button"
                          onClick={() => setDetailProduct(product)}
                          className="text-xs font-medium text-[#176B45] hover:underline shrink-0 cursor-pointer"
                        >
                          Details
                        </button>
                      </div>

                      <p className="text-xs text-[#4A5850] leading-relaxed line-clamp-2 mb-4">
                        {product.description}
                      </p>

                      {/* Volume Selector */}
                      <div className="mb-3">
                        <span className="block text-[11px] font-medium text-[#6E7C74] mb-1.5">
                          Select Volume
                        </span>
                        <div className="grid grid-cols-3 gap-1.5">
                          {VOLUMES.map((vol) => {
                            const active = sel.volumeMl === vol;
                            return (
                              <button
                                key={vol}
                                type="button"
                                onClick={() => setSelection(product.id, { volumeMl: vol })}
                                className={`py-1.5 px-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                                  active
                                    ? 'bg-[#176B45] text-white border-[#176B45]'
                                    : 'bg-[#FAFAF8] text-[#4A5850] border-[#E4E8E2] hover:border-[#176B45]'
                                }`}
                              >
                                {vol === 1000 ? '1 Litre' : `${vol} ml`}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Container Option */}
                      <div className="mb-4">
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelection(product.id, { containerMode: 'own' })}
                            className={`py-1.5 px-2 text-[11px] font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                              sel.containerMode === 'own'
                                ? 'bg-[#DDF3E4] text-[#176B45] border-[#176B45]/40'
                                : 'bg-white text-[#4A5850] border-[#E4E8E2]'
                            }`}
                          >
                            Own Bottle (₹0)
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelection(product.id, { containerMode: 'reusable' })}
                            className={`py-1.5 px-2 text-[11px] font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                              sel.containerMode === 'reusable'
                                ? 'bg-[#DDF3E4] text-[#176B45] border-[#176B45]/40'
                                : 'bg-white text-[#4A5850] border-[#E4E8E2]'
                            }`}
                          >
                            +₹{REUSABLE_CONTAINER_DEPOSIT_INR} Bottle
                          </button>
                        </div>
                      </div>

                      {/* Price & Savings */}
                      <div className="mt-auto pt-3 border-t border-[#E4E8E2]">
                        <div className="flex items-baseline justify-between mb-3">
                          <div className="flex items-baseline gap-2">
                            <span className="text-xl font-bold font-mono tabular-nums text-[#111814]">
                              ₹{price}
                            </span>
                            <span className="text-xs font-mono tabular-nums text-[#6E7C74] line-through">
                              ₹{mrp}
                            </span>
                          </div>
                          <span className="text-xs font-medium text-[#176B45] font-mono tabular-nums">
                            Save ₹{savings}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="inline-flex items-center border border-[#D4DBD3] rounded-xl h-10">
                            <button
                              type="button"
                              onClick={() =>
                                setSelection(product.id, {
                                  quantity: Math.max(1, sel.quantity - 1),
                                })
                              }
                              aria-label="Decrease quantity"
                              className="w-8 h-full flex items-center justify-center text-[#4A5850] hover:bg-[#F3F5F2] rounded-l-xl cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-7 text-center text-xs font-mono tabular-nums font-semibold">
                              {sel.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setSelection(product.id, {
                                  quantity: Math.min(20, sel.quantity + 1),
                                })
                              }
                              aria-label="Increase quantity"
                              className="w-8 h-full flex items-center justify-center text-[#4A5850] hover:bg-[#F3F5F2] rounded-r-xl cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <button
                            type="button"
                            disabled={outOfStock}
                            onClick={() =>
                              onAddToCart({
                                product,
                                volumeMl: sel.volumeMl,
                                quantity: sel.quantity,
                                containerMode: sel.containerMode,
                              })
                            }
                            className="flex-1 h-10 px-4 bg-[#176B45] hover:bg-[#125436] disabled:bg-[#D4DBD3] text-white text-xs font-semibold rounded-xl transition-colors whitespace-nowrap cursor-pointer"
                          >
                            {outOfStock ? 'Out of Stock' : 'Add to Cart'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* 3. How It Works & Why Choose REFILL+ */}
      <section id="how-it-works" className="py-14 lg:py-20 bg-white border-y border-[#E4E8E2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <p className="text-xs font-medium text-[#176B45] mb-1.5">How Refill+ Works</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#111814] tracking-tight text-balance">
              Three Steps from Empty Bottle to Zero-Waste Refill
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 pb-12 border-b border-[#E4E8E2]">
            <div>
              <p className="text-sm font-mono font-semibold text-[#176B45] mb-2">01. Select</p>
              <h3 className="text-lg font-semibold text-[#111814] mb-2">
                Pick Your Liquid & Size
              </h3>
              <p className="text-sm text-[#4A5850] leading-relaxed">
                Choose Handwash, Dishwash, Floor Cleaner, or Laundry Detergent in 250 ml, 500 ml, or
                1 litre quantities sized for hostel rooms or family kitchens.
              </p>
            </div>
            <div>
              <p className="text-sm font-mono font-semibold text-[#176B45] mb-2">02. Container</p>
              <h3 className="text-lg font-semibold text-[#111814] mb-2">
                Bring Your Own or Borrow
              </h3>
              <p className="text-sm text-[#4A5850] leading-relaxed">
                Reuse any clean plastic or glass bottle you already own for ₹0 container cost, or
                request a sanitized Refill+ bottle with a refundable ₹{REUSABLE_CONTAINER_DEPOSIT_INR} deposit.
              </p>
            </div>
            <div>
              <p className="text-sm font-mono font-semibold text-[#176B45] mb-2">03. Refill</p>
              <h3 className="text-lg font-semibold text-[#111814] mb-2">
                Campus Slot Delivery
              </h3>
              <p className="text-sm text-[#4A5850] leading-relaxed">
                Our refill runner fulfills your order during your chosen DBS Global University slot
                and automatically tracks your money and plastic bottles saved.
              </p>
            </div>
          </div>

          {/* Why Choose REFILL+ */}
          <div className="pt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#DDF3E4] text-[#176B45] flex items-center justify-center">
                <Leaf className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-[#111814]">Plant-Based Formulas</h3>
              <p className="text-sm text-[#4A5850] leading-relaxed">
                Biodegradable surfactants free from harsh phosphates, parabens, and synthetic dyes.
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#DDF3E4] text-[#176B45] flex items-center justify-center">
                <Recycle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-[#111814]">Circular Packaging</h3>
              <p className="text-sm text-[#4A5850] leading-relaxed">
                Every refilled container eliminates single-use pumps, triggers, and virgin HDPE jugs.
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#DDF3E4] text-[#176B45] flex items-center justify-center">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-[#111814]">Hostel-First Delivery</h3>
              <p className="text-sm text-[#4A5850] leading-relaxed">
                Built around DBS Boys & Girls Hostels, faculty residences, and Pondha/Selaqui PGs.
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#DDF3E4] text-[#176B45] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-[#111814]">Honest Savings</h3>
              <p className="text-sm text-[#4A5850] leading-relaxed">
                Pay for the liquid—not branded plastic—saving students up to ₹800+ per semester.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Sustainability Impact Tracker & Interactive Savings Calculator */}
      <section id="impact" className="py-14 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Left: Impact Counter */}
            <div className="lg:col-span-7 bg-[#176B45] text-white rounded-2xl p-8 sm:p-10">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
                <p className="text-xs font-medium text-[#DDF3E4]">
                  Campus Sustainability Impact Tracker
                </p>
                <span className="text-xs font-mono text-[#DDF3E4]/90">
                  Demo baseline + {liveStats.ordersCount} live orders
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-balance mb-3">
                Measurable Plastic Reduction Around DBS Global University
              </h2>
              <p className="text-sm text-[#DDF3E4]/90 leading-relaxed mb-8 max-w-xl">
                Transparent environmental accounting: initial showcase baseline figures represent pilot
                targets and are labeled separately from live recorded transactions.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pb-8 border-b border-white/15">
                <div>
                  <p className="text-3xl font-bold font-mono tabular-nums">{totalRefills}</p>
                  <p className="text-xs text-[#DDF3E4] mt-1">Total Refills Completed</p>
                </div>
                <div>
                  <p className="text-3xl font-bold font-mono tabular-nums">
                    {totalBottlesAvoided}
                  </p>
                  <p className="text-xs text-[#DDF3E4] mt-1">Plastic Bottles Avoided</p>
                </div>
                <div>
                  <p className="text-3xl font-bold font-mono tabular-nums">
                    ₹{totalMoneySaved.toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-[#DDF3E4] mt-1">Estimated Student Savings</p>
                </div>
              </div>

              <div className="pt-6 grid sm:grid-cols-2 gap-4 text-xs text-[#DDF3E4]">
                <div>
                  <span className="font-mono font-semibold text-white">{totalPlasticKg} kg</span>{' '}
                  virgin HDPE/PET plastic diverted ({sustainabilityConfig.plasticGramsPer500mlBottle}g
                  per 500 ml bottle)
                </div>
                <div>
                  <span className="font-mono font-semibold text-white">{totalCo2Kg} kg</span>{' '}
                  packaging CO₂e avoided ({sustainabilityConfig.co2GramsPerBottle}g per bottle)
                </div>
              </div>
            </div>

            {/* Right: Interactive Student Savings Estimator */}
            <div className="lg:col-span-5 bg-white border border-[#E4E8E2] rounded-2xl p-8">
              <p className="text-xs font-medium text-[#176B45] mb-1">Interactive Estimator</p>
              <h3 className="text-xl font-bold text-[#111814] mb-2">
                Calculate Your Semester Savings
              </h3>
              <p className="text-sm text-[#4A5850] mb-6">
                Adjust for your hostel wing or household size to estimate 5-month savings.
              </p>

              <div className="space-y-5">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <label htmlFor="calc-people" className="font-medium text-[#111814]">
                      People Sharing Essentials
                    </label>
                    <span className="font-mono tabular-nums font-semibold text-[#176B45]">
                      {calcRoommates} {calcRoommates === 1 ? 'person' : 'people'}
                    </span>
                  </div>
                  <input
                    id="calc-people"
                    type="range"
                    min={1}
                    max={6}
                    value={calcRoommates}
                    onChange={(e) => setCalcRoommates(Number(e.target.value))}
                    className="w-full accent-[#176B45] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <label htmlFor="calc-refills" className="font-medium text-[#111814]">
                      500 ml Refills / Person / Month
                    </label>
                    <span className="font-mono tabular-nums font-semibold text-[#176B45]">
                      {calcRefillsPerMonth} refills
                    </span>
                  </div>
                  <input
                    id="calc-refills"
                    type="range"
                    min={1}
                    max={8}
                    value={calcRefillsPerMonth}
                    onChange={(e) => setCalcRefillsPerMonth(Number(e.target.value))}
                    className="w-full accent-[#176B45] cursor-pointer"
                  />
                </div>

                <div className="pt-4 border-t border-[#E4E8E2] grid grid-cols-2 gap-4">
                  <div className="bg-[#DDF3E4]/60 rounded-xl p-4">
                    <p className="text-xs text-[#4A5850]">Est. Semester Savings</p>
                    <p className="text-2xl font-bold font-mono tabular-nums text-[#176B45] mt-1">
                      ₹{estSemesterSavings.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="bg-[#F3F5F2] rounded-xl p-4">
                    <p className="text-xs text-[#4A5850]">Bottles Avoided</p>
                    <p className="text-2xl font-bold font-mono tabular-nums text-[#111814] mt-1">
                      {estSemesterBottles}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Sample Testimonials & FAQ */}
      <section className="py-14 lg:py-20 bg-white border-t border-[#E4E8E2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-8">
            <div>
              <p className="text-xs font-medium text-[#176B45] mb-1">
                Sample / Demo Testimonials (Illustrative Content)
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#111814] tracking-tight">
                Designed for Hostel & Household Routines
              </h2>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 pb-16 border-b border-[#E4E8E2]">
            {SAMPLE_TESTIMONIALS.map((t) => (
              <div key={t.id} className="bg-[#FAFAF8] border border-[#E4E8E2] rounded-2xl p-6 flex flex-col justify-between">
                <p className="text-sm text-[#111814] leading-relaxed mb-6">“{t.quote}”</p>
                <div>
                  <p className="text-sm font-semibold text-[#111814]">{t.name}</p>
                  <p className="text-xs text-[#6E7C74] mt-0.5">{t.role}</p>
                  <p className="text-xs font-mono text-[#176B45] mt-2">{t.savingsMetric}</p>
                </div>
              </div>
            ))}
          </div>

          {/* FAQ Accordion */}
          <div className="pt-14 max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <p className="text-xs font-medium text-[#176B45] mb-1">Frequently Asked Questions</p>
              <h2 className="text-2xl font-bold text-[#111814]">Refill Logistics & Containers</h2>
            </div>

            <div className="divide-y divide-[#E4E8E2] border-y border-[#E4E8E2]">
              {FAQ_ITEMS.map((item, idx) => {
                const open = openFaqIdx === idx;
                return (
                  <div key={item.q} className="py-4">
                    <button
                      type="button"
                      onClick={() => setOpenFaqIdx(open ? null : idx)}
                      className="w-full flex items-center justify-between gap-4 text-left cursor-pointer"
                    >
                      <span className="text-sm sm:text-base font-semibold text-[#111814]">
                        {item.q}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-[#6E7C74] shrink-0 transition-transform ${
                          open ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {open && (
                      <p className="mt-2.5 text-sm text-[#4A5850] leading-relaxed pr-8">{item.a}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#111814] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 pb-8 border-b border-white/10">
            <div>
              <p className="text-lg font-bold tracking-tight text-white">REFILL+</p>
              <p className="text-xs text-[#DDF3E4] mt-1">Refill More. Waste Less.</p>
              <p className="text-sm text-white/70 mt-3 leading-relaxed max-w-sm">
                Campus-first zero-waste household liquid refill service built around DBS Global
                University, Dehradun, Uttarakhand.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-white mb-3">Campus Service Area</p>
              <ul className="space-y-1.5 text-sm text-white/70">
                <li>DBS Global University Hostels (Block A & B)</li>
                <li>Faculty & Staff Residences</li>
                <li>Selaqui, Pondha & Premnagar, Dehradun</li>
                <li>support@refillplus-dgu.in</li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-white mb-3">Quick Support</p>
              <p className="text-sm text-white/70 mb-4">
                Need a custom hostel wing bulk refill or bottle pickup? Message our campus desk.
              </p>
              <a
                href={`https://wa.me/${WHATSAPP_SUPPORT_NUMBER}?text=${encodeURIComponent(
                  'Hi REFILL+ team, I have a question about household liquid refills around DBS Global University.'
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#176B45] hover:bg-[#4BA82E] text-white text-xs font-semibold rounded-xl transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp Campus Support</span>
              </a>
            </div>
          </div>
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/60">
            <span>© {new Date().getFullYear()} REFILL+ Dehradun · MBA Entrepreneurship & Innovation Capstone</span>
            <span>Refill More. Waste Less.</span>
          </div>
        </div>
      </footer>

      {/* Product Details Modal */}
      {detailProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-label={detailProduct.name}
        >
          <div className="bg-white border border-[#E4E8E2] rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl grid sm:grid-cols-2">
            <div className="bg-[#F3F5F2] min-h-[240px]">
              <ProductImage
                src={detailProduct.imageUrl}
                alt={detailProduct.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6 flex flex-col justify-between relative">
              <button
                type="button"
                onClick={() => setDetailProduct(null)}
                aria-label="Close product details"
                className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-[#6E7C74] hover:bg-[#F3F5F2] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div>
                <p className="text-xs text-[#176B45] font-medium mb-1">
                  {detailProduct.category} · {detailProduct.scent || 'Botanical Formula'}
                </p>
                <h3 className="text-xl font-bold text-[#111814] mb-2">{detailProduct.name}</h3>
                <p className="text-sm text-[#4A5850] leading-relaxed mb-4">
                  {detailProduct.description}
                </p>
                {detailProduct.ingredients && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-[#111814] mb-1">Key Ingredients</p>
                    <p className="text-xs text-[#4A5850] leading-relaxed">
                      {detailProduct.ingredients}
                    </p>
                  </div>
                )}

                <div className="border-t border-[#E4E8E2] pt-3 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#4A5850]">250 ml Refill (Plastic MRP ₹{detailProduct.mrpPlastic250ml})</span>
                    <span className="font-mono font-semibold text-[#111814]">₹{detailProduct.price250ml}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#4A5850]">500 ml Refill (Plastic MRP ₹{detailProduct.mrpPlastic500ml})</span>
                    <span className="font-mono font-semibold text-[#111814]">₹{detailProduct.price500ml}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#4A5850]">1 Litre Refill (Plastic MRP ₹{detailProduct.mrpPlastic1000ml})</span>
                    <span className="font-mono font-semibold text-[#111814]">₹{detailProduct.price1000ml}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between gap-3 pt-4 border-t border-[#E4E8E2]">
                <span className="inline-flex items-center gap-1.5 text-xs text-[#4A5850]">
                  <Droplets className="w-3.5 h-3.5 text-[#176B45]" />
                  {detailProduct.stockLitres} L in bulk tank
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const sel = getSelection(detailProduct.id);
                    onAddToCart({
                      product: detailProduct,
                      volumeMl: sel.volumeMl,
                      quantity: sel.quantity,
                      containerMode: sel.containerMode,
                    });
                    setDetailProduct(null);
                  }}
                  className="px-4 py-2 bg-[#176B45] hover:bg-[#125436] text-white text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Add {getSelection(detailProduct.id).volumeMl === 1000 ? '1L' : `${getSelection(detailProduct.id).volumeMl}ml`} to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
