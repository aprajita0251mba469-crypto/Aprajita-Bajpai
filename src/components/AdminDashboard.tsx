import {
  CheckCircle2,
  Database,
  Lock,
  Plus,
  ShieldCheck,
  Trash2,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { SEED_PRODUCTS } from '../data/seedCatalog.ts';
import {
  deleteProduct,
  fetchAllUsers,
  grantAdminAccess,
  revokeAdminAccess,
  saveProduct,
  seedDefaultCatalog,
  subscribeAllOrders,
  updateOrderByAdmin,
  updateSustainabilityConfig,
} from '../lib/storeService.ts';
import type {
  Order,
  OrderStatus,
  Product,
  ProductCategory,
  SustainabilityConfig,
  UserProfile,
} from '../types.ts';

interface AdminDashboardProps {
  userProfile: UserProfile | null;
  isAdmin: boolean;
  products: Product[];
  catalogFromDb: boolean;
  sustainabilityConfig: SustainabilityConfig;
  onOpenAuth: () => void;
}

type AdminTab = 'overview' | 'orders' | 'products' | 'customers' | 'sustainability';

const ORDER_STATUSES: OrderStatus[] = [
  'Order Placed',
  'Order Confirmed',
  'Preparing Refill',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
];

const CATEGORIES: ProductCategory[] = ['Personal Care', 'Kitchen', 'Home Care', 'Laundry'];

export function AdminDashboard({
  userProfile,
  isAdmin,
  products,
  catalogFromDb,
  sustainabilityConfig,
  onOpenAuth,
}: AdminDashboardProps) {
  const [tab, setTab] = useState<AdminTab>('overview');
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<UserProfile[]>([]);
  const [statusFilter, setStatusFilter] = useState<'All' | OrderStatus>('All');
  const [notice, setNotice] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  // Product editor state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [formProd, setFormProd] = useState<Product>({
    id: '',
    name: '',
    category: 'Personal Care',
    scent: '',
    ingredients: '',
    description: '',
    imageUrl: SEED_PRODUCTS[0].imageUrl,
    price250ml: 49,
    price500ml: 89,
    price1000ml: 165,
    mrpPlastic250ml: 95,
    mrpPlastic500ml: 165,
    mrpPlastic1000ml: 299,
    stockLitres: 50,
    active: true,
    featured: true,
  });

  // Sustainability form
  const [sustForm, setSustForm] = useState<SustainabilityConfig>(sustainabilityConfig);

  useEffect(() => {
    setSustForm(sustainabilityConfig);
  }, [sustainabilityConfig]);

  useEffect(() => {
    if (!isAdmin) return;
    const unsubOrders = subscribeAllOrders(setAllOrders);
    fetchAllUsers().then(setCustomers);
    return () => {
      unsubOrders();
    };
  }, [isAdmin]);

  const analytics = useMemo(() => {
    const validOrders = allOrders.filter((o) => o.status !== 'Cancelled');
    const totalRevenue = validOrders.reduce((s, o) => s + o.totalAmount, 0);
    const pendingCount = allOrders.filter(
      (o) => !['Delivered', 'Cancelled'].includes(o.status)
    ).length;
    const completedCount = allOrders.filter((o) => o.status === 'Delivered').length;

    const byStatus = ORDER_STATUSES.map((status) => ({
      status: status.replace('Order ', ''),
      count: allOrders.filter((o) => o.status === status).length,
      revenue: allOrders
        .filter((o) => o.status === status)
        .reduce((s, o) => s + o.totalAmount, 0),
    }));

    const stockChart = products.map((p) => ({
      name: p.name.split(' ').slice(0, 2).join(' '),
      stockLitres: p.stockLitres,
      price500ml: p.price500ml,
    }));

    return { totalRevenue, pendingCount, completedCount, byStatus, stockChart };
  }, [allOrders, products]);

  if (!userProfile || !isAdmin) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#F3F5F2] text-[#111814] flex items-center justify-center mx-auto mb-4">
          <Lock className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-[#111814] mb-2">
          Admin Access Protected
        </h1>
        <p className="text-sm text-[#4A5850] leading-relaxed mb-6">
          {userProfile
            ? `Signed in as ${userProfile.email}. Admin console access requires verified allowlist approval in Firestore Security Rules and cannot be granted simply by selecting Admin at signup.`
            : 'Sign in with a verified administrator account to access inventory, order dispatch, and sales analytics.'}
        </p>
        {!userProfile && (
          <button
            type="button"
            onClick={onOpenAuth}
            className="px-6 py-2.5 bg-[#176B45] text-white text-sm font-semibold rounded-xl cursor-pointer"
          >
            Sign In
          </button>
        )}
      </div>
    );
  }

  const showFlash = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  const handleSeedCatalog = async () => {
    setSeeding(true);
    try {
      await seedDefaultCatalog();
      showFlash('Default 4-product catalog & sustainability config synced to Firestore.');
    } finally {
      setSeeding(false);
    }
  };

  const openEditProduct = (p: Product) => {
    setEditingProduct(p);
    setShowNewProduct(false);
    setFormProd({ ...p });
  };

  const openAddProduct = () => {
    setEditingProduct(null);
    setShowNewProduct(true);
    setFormProd({
      id: `prod_${Date.now()}`,
      name: '',
      category: 'Personal Care',
      scent: '',
      ingredients: '',
      description: '',
      imageUrl: SEED_PRODUCTS[0].imageUrl,
      price250ml: 49,
      price500ml: 89,
      price1000ml: 165,
      mrpPlastic250ml: 95,
      mrpPlastic500ml: 165,
      mrpPlastic1000ml: 299,
      stockLitres: 40,
      active: true,
      featured: false,
    });
  };

  const handleSaveProductForm = async (e: FormEvent) => {
    e.preventDefault();
    await saveProduct(formProd);
    setEditingProduct(null);
    setShowNewProduct(false);
    showFlash(`Saved "${formProd.name}" to product catalog.`);
  };

  const handleSaveSust = async (e: FormEvent) => {
    e.preventDefault();
    await updateSustainabilityConfig(sustForm);
    showFlash('Sustainability assumptions updated.');
  };

  const filteredOrders =
    statusFilter === 'All'
      ? allOrders
      : allOrders.filter((o) => o.status === statusFilter);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-[#E4E8E2]">
        <div>
          <p className="text-xs font-medium text-[#176B45] mb-1">
            REFILL+ Operations Console · Verified Admin
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111814]">
            Admin Dashboard
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!catalogFromDb && (
            <button
              type="button"
              disabled={seeding}
              onClick={handleSeedCatalog}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#176B45] text-white text-xs font-semibold rounded-xl cursor-pointer"
            >
              <Database className="w-3.5 h-3.5" />
              <span>{seeding ? 'Syncing...' : 'Sync Default Catalog to DB'}</span>
            </button>
          )}
        </div>
      </div>

      {notice && (
        <div className="p-3.5 rounded-xl bg-[#DDF3E4] border border-[#176B45]/25 flex items-center gap-2 text-xs font-medium text-[#176B45]">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notice}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#F3F5F2] rounded-xl w-fit">
        {(
          [
            ['overview', 'Overview & Charts'],
            ['orders', `Orders (${allOrders.length})`],
            ['products', `Products (${products.length})`],
            ['customers', `Customers (${customers.length})`],
            ['sustainability', 'Impact Assumptions'],
          ] as [AdminTab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              tab === key ? 'bg-white text-[#176B45] shadow-xs' : 'text-[#4A5850]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white border border-[#E4E8E2] rounded-2xl p-5">
              <p className="text-xs text-[#6E7C74]">Total Orders</p>
              <p className="text-2xl font-bold font-mono tabular-nums text-[#111814] mt-1">
                {allOrders.length}
              </p>
            </div>
            <div className="bg-white border border-[#E4E8E2] rounded-2xl p-5">
              <p className="text-xs text-[#6E7C74]">Total Customers</p>
              <p className="text-2xl font-bold font-mono tabular-nums text-[#111814] mt-1">
                {customers.length}
              </p>
            </div>
            <div className="bg-[#DDF3E4]/70 border border-[#176B45]/20 rounded-2xl p-5">
              <p className="text-xs text-[#176B45] font-medium">Gross Order Volume</p>
              <p className="text-2xl font-bold font-mono tabular-nums text-[#176B45] mt-1">
                ₹{analytics.totalRevenue.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="bg-white border border-[#E4E8E2] rounded-2xl p-5">
              <p className="text-xs text-[#6E7C74]">Pending Orders</p>
              <p className="text-2xl font-bold font-mono tabular-nums text-[#111814] mt-1">
                {analytics.pendingCount}
              </p>
            </div>
            <div className="bg-white border border-[#E4E8E2] rounded-2xl p-5 col-span-2 lg:col-span-1">
              <p className="text-xs text-[#6E7C74]">Completed Orders</p>
              <p className="text-2xl font-bold font-mono tabular-nums text-[#111814] mt-1">
                {analytics.completedCount}
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white border border-[#E4E8E2] rounded-2xl p-6">
              <h2 className="text-base font-bold text-[#111814] mb-1">
                Orders & Revenue by Pipeline Stage
              </h2>
              <p className="text-xs text-[#6E7C74] mb-4">Live order counts across fulfillment stages</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.byStatus}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E4E8E2" />
                    <XAxis dataKey="status" tick={{ fontSize: 11, fill: '#4A5850' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#4A5850' }} />
                    <Tooltip />
                    <Bar dataKey="count" name="Orders" fill="#176B45" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white border border-[#E4E8E2] rounded-2xl p-6">
              <h2 className="text-base font-bold text-[#111814] mb-1">
                Bulk Tank Inventory (Litres Available)
              </h2>
              <p className="text-xs text-[#6E7C74] mb-4">Stock levels by household refill SKU</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.stockChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E4E8E2" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#4A5850' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#4A5850' }} />
                    <Tooltip />
                    <Bar dataKey="stockLitres" name="Litres" fill="#4BA82E" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ORDERS */}
      {tab === 'orders' && (
        <div className="bg-white border border-[#E4E8E2] rounded-2xl p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-[#111814]">Order & Delivery Management</h2>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'All' | OrderStatus)}
              className="px-3 py-2 text-xs border border-[#D4DBD3] rounded-xl bg-white"
            >
              <option value="All">All Statuses</option>
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {filteredOrders.length === 0 ? (
            <p className="text-sm text-[#4A5850] py-8 text-center">No orders match this status.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E4E8E2] text-[#6E7C74]">
                    <th className="py-3 pr-4 font-medium">Order ID</th>
                    <th className="py-3 pr-4 font-medium">Customer & Hostel</th>
                    <th className="py-3 pr-4 font-medium">Items</th>
                    <th className="py-3 pr-4 font-medium">Amount</th>
                    <th className="py-3 pr-4 font-medium">Payment</th>
                    <th className="py-3 font-medium">Order Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E8E2]">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="align-top">
                      <td className="py-3.5 pr-4 font-mono font-semibold text-[#176B45] whitespace-nowrap">
                        {order.orderNumber}
                      </td>
                      <td className="py-3.5 pr-4">
                        <p className="font-semibold text-[#111814]">{order.customerName}</p>
                        <p className="text-[#6E7C74]">
                          {order.hostelOrAddress}
                          {order.roomNumber ? ` (${order.roomNumber})` : ''}
                        </p>
                        <p className="text-[#6E7C74] font-mono">{order.phone}</p>
                      </td>
                      <td className="py-3.5 pr-4 max-w-xs text-[#4A5850]">{order.itemsSummary}</td>
                      <td className="py-3.5 pr-4 font-mono tabular-nums font-semibold">
                        ₹{order.totalAmount}
                      </td>
                      <td className="py-3.5 pr-4 space-y-1.5">
                        <span className="block font-medium text-[#111814]">
                          {order.paymentMethod.toUpperCase()} · {order.paymentStatus}
                        </span>
                        {order.paymentStatus !== 'paid_verified' && (
                          <button
                            type="button"
                            onClick={() =>
                              updateOrderByAdmin(order.id, { paymentStatus: 'paid_verified' })
                            }
                            className="px-2.5 py-1 bg-[#DDF3E4] text-[#176B45] hover:bg-[#176B45] hover:text-white rounded-md font-semibold cursor-pointer"
                          >
                            Verify Paid
                          </button>
                        )}
                      </td>
                      <td className="py-3.5">
                        <select
                          value={order.status}
                          onChange={(e) =>
                            updateOrderByAdmin(order.id, {
                              status: e.target.value as OrderStatus,
                            })
                          }
                          className="px-2.5 py-1.5 border border-[#D4DBD3] rounded-lg bg-white text-xs font-medium"
                        >
                          {ORDER_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PRODUCTS */}
      {tab === 'products' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-[#111814]">Product Pricing & Stock</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={seeding}
                onClick={handleSeedCatalog}
                className="px-3.5 py-2 bg-[#F3F5F2] hover:bg-[#DDF3E4] text-[#176B45] text-xs font-semibold rounded-xl cursor-pointer"
              >
                {seeding ? 'Syncing...' : 'Reset / Seed 4 Core Products'}
              </button>
              <button
                type="button"
                onClick={openAddProduct}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#176B45] text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Product</span>
              </button>
            </div>
          </div>

          {(showNewProduct || editingProduct) && (
            <form
              onSubmit={handleSaveProductForm}
              className="bg-white border border-[#176B45] rounded-2xl p-6 space-y-4"
            >
              <h3 className="text-base font-bold text-[#111814]">
                {editingProduct ? `Edit: ${editingProduct.name}` : 'New Refill Product'}
              </h3>
              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#4A5850] mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    value={formProd.name}
                    onChange={(e) => setFormProd({ ...formProd, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#D4DBD3] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4A5850] mb-1">Category</label>
                  <select
                    value={formProd.category}
                    onChange={(e) =>
                      setFormProd({ ...formProd, category: e.target.value as ProductCategory })
                    }
                    className="w-full px-3 py-2 text-xs border border-[#D4DBD3] rounded-lg bg-white"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4A5850] mb-1">
                    Stock (Litres) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formProd.stockLitres}
                    onChange={(e) =>
                      setFormProd({ ...formProd, stockLitres: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-xs border border-[#D4DBD3] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4A5850] mb-1">250ml ₹</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formProd.price250ml}
                    onChange={(e) =>
                      setFormProd({ ...formProd, price250ml: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-xs border border-[#D4DBD3] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4A5850] mb-1">500ml ₹</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formProd.price500ml}
                    onChange={(e) =>
                      setFormProd({ ...formProd, price500ml: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-xs border border-[#D4DBD3] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4A5850] mb-1">1 Litre ₹</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formProd.price1000ml}
                    onChange={(e) =>
                      setFormProd({ ...formProd, price1000ml: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-xs border border-[#D4DBD3] rounded-lg"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-xs font-medium text-[#4A5850] mb-1">
                    Description *
                  </label>
                  <textarea
                    required
                    minLength={10}
                    rows={2}
                    value={formProd.description}
                    onChange={(e) => setFormProd({ ...formProd, description: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#D4DBD3] rounded-lg"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#176B45] text-white text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Save Product
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingProduct(null);
                    setShowNewProduct(false);
                  }}
                  className="px-4 py-2 bg-[#F3F5F2] text-[#4A5850] text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="bg-white border border-[#E4E8E2] rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E4E8E2] bg-[#FAFAF8] text-[#6E7C74]">
                  <th className="py-3 px-4 font-medium">Product</th>
                  <th className="py-3 px-4 font-medium">Category</th>
                  <th className="py-3 px-4 font-medium">250ml / 500ml / 1L</th>
                  <th className="py-3 px-4 font-medium">Stock</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E8E2]">
                {products.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3 px-4 font-semibold text-[#111814]">{p.name}</td>
                    <td className="py-3 px-4 text-[#4A5850]">{p.category}</td>
                    <td className="py-3 px-4 font-mono tabular-nums">
                      ₹{p.price250ml} / ₹{p.price500ml} / ₹{p.price1000ml}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums">{p.stockLitres} L</td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => openEditProduct(p)}
                        className="text-[#176B45] font-semibold hover:underline cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await deleteProduct(p.id);
                          showFlash(`Deleted ${p.name}`);
                        }}
                        aria-label={`Delete ${p.name}`}
                        className="text-red-600 hover:text-red-800 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: CUSTOMERS & ACCESS CONTROL */}
      {tab === 'customers' && (
        <div className="bg-white border border-[#E4E8E2] rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#176B45]" />
            <h2 className="text-lg font-bold text-[#111814]">
              Registered Customers & Admin Access Approvals
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E4E8E2] text-[#6E7C74]">
                  <th className="py-3 pr-4 font-medium">Name</th>
                  <th className="py-3 pr-4 font-medium">Email</th>
                  <th className="py-3 pr-4 font-medium">Orders / Saved</th>
                  <th className="py-3 pr-4 font-medium">Role</th>
                  <th className="py-3 font-medium text-right">Admin Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E8E2]">
                {customers.map((c) => (
                  <tr key={c.uid}>
                    <td className="py-3 pr-4 font-semibold text-[#111814]">{c.displayName}</td>
                    <td className="py-3 pr-4 text-[#4A5850]">{c.email}</td>
                    <td className="py-3 pr-4 font-mono tabular-nums">
                      {c.totalOrders} orders · ₹{c.totalMoneySaved}
                    </td>
                    <td className="py-3 pr-4">
                      <span className="font-medium text-[#111814]">
                        {c.role}
                        {c.adminRequested && c.role !== 'admin' ? ' (Admin Requested)' : ''}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {c.uid !== userProfile.uid &&
                        (c.role === 'admin' ? (
                          <button
                            type="button"
                            onClick={async () => {
                              await revokeAdminAccess(c.uid);
                              setCustomers(await fetchAllUsers());
                              showFlash(`Revoked admin access for ${c.email}`);
                            }}
                            className="px-2.5 py-1 border border-red-200 text-red-700 rounded-lg font-semibold cursor-pointer"
                          >
                            Revoke Admin
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={async () => {
                              await grantAdminAccess(c, userProfile.email);
                              setCustomers(await fetchAllUsers());
                              showFlash(`Approved admin access for ${c.email}`);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#DDF3E4] text-[#176B45] rounded-lg font-semibold cursor-pointer"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Approve Admin</span>
                          </button>
                        ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: SUSTAINABILITY ASSUMPTIONS */}
      {tab === 'sustainability' && (
        <form
          onSubmit={handleSaveSust}
          className="bg-white border border-[#E4E8E2] rounded-2xl p-6 max-w-2xl space-y-4"
        >
          <h2 className="text-lg font-bold text-[#111814]">
            Sustainability Calculation Assumptions & Demo Baseline
          </h2>
          <p className="text-xs text-[#4A5850]">
            Configure how plastic weight, CO₂e avoided, and showcase baseline counters are
            displayed on the storefront Impact Tracker.
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#4A5850] mb-1">
                Plastic Grams per 500 ml Bottle
              </label>
              <input
                type="number"
                min={1}
                value={sustForm.plasticGramsPer500mlBottle}
                onChange={(e) =>
                  setSustForm({ ...sustForm, plasticGramsPer500mlBottle: Number(e.target.value) })
                }
                className="w-full px-3 py-2 text-sm border border-[#D4DBD3] rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4A5850] mb-1">
                CO₂e Grams per Bottle
              </label>
              <input
                type="number"
                min={1}
                value={sustForm.co2GramsPerBottle}
                onChange={(e) =>
                  setSustForm({ ...sustForm, co2GramsPerBottle: Number(e.target.value) })
                }
                className="w-full px-3 py-2 text-sm border border-[#D4DBD3] rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4A5850] mb-1">
                Demo Baseline Refills
              </label>
              <input
                type="number"
                min={0}
                value={sustForm.demoBaselineRefills}
                onChange={(e) =>
                  setSustForm({ ...sustForm, demoBaselineRefills: Number(e.target.value) })
                }
                className="w-full px-3 py-2 text-sm border border-[#D4DBD3] rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4A5850] mb-1">
                Demo Baseline Bottles Avoided
              </label>
              <input
                type="number"
                min={0}
                value={sustForm.demoBaselineBottlesAvoided}
                onChange={(e) =>
                  setSustForm({ ...sustForm, demoBaselineBottlesAvoided: Number(e.target.value) })
                }
                className="w-full px-3 py-2 text-sm border border-[#D4DBD3] rounded-xl"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[#4A5850] mb-1">
                Demo Baseline Money Saved (₹)
              </label>
              <input
                type="number"
                min={0}
                value={sustForm.demoBaselineMoneySaved}
                onChange={(e) =>
                  setSustForm({ ...sustForm, demoBaselineMoneySaved: Number(e.target.value) })
                }
                className="w-full px-3 py-2 text-sm border border-[#D4DBD3] rounded-xl"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 bg-[#176B45] hover:bg-[#125436] text-white text-xs font-semibold rounded-xl cursor-pointer"
          >
            Save Assumptions
          </button>
        </form>
      )}
    </div>
  );
}
