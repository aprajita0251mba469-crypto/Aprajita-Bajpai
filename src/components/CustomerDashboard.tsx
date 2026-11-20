import {
  CheckCircle2,
  LogOut,
  MapPin,
  Package,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  User as UserIcon,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { CAMPUS_LOCATIONS } from '../data/seedCatalog.ts';
import {
  createAddress,
  deleteAddress,
  fetchOrderItems,
  updateUserProfile,
} from '../lib/storeService.ts';
import type { Address, Order, OrderItem, UserProfile } from '../types.ts';

interface CustomerDashboardProps {
  userProfile: UserProfile | null;
  isAdmin: boolean;
  orders: Order[];
  addresses: Address[];
  onOpenAuth: () => void;
  onLogout: () => void;
  onViewOrder: (orderId: string) => void;
  onReorderItems: (items: OrderItem[]) => void;
  onOpenAdmin: () => void;
  onShopNow: () => void;
}

export function CustomerDashboard({
  userProfile,
  isAdmin,
  orders,
  addresses,
  onOpenAuth,
  onLogout,
  onViewOrder,
  onReorderItems,
  onOpenAdmin,
  onShopNow,
}: CustomerDashboardProps) {
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [hostelOrAddress, setHostelOrAddress] = useState(
    userProfile?.hostelOrAddress || CAMPUS_LOCATIONS[0]
  );
  const [roomNumber, setRoomNumber] = useState(userProfile?.roomNumber || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileNotice, setProfileNotice] = useState<string | null>(null);

  const [addrLabel, setAddrLabel] = useState('Hostel Room');
  const [addrRecipient, setAddrRecipient] = useState(userProfile?.displayName || '');
  const [addrPhone, setAddrPhone] = useState(userProfile?.phone || '');
  const [addrLocation, setAddrLocation] = useState(CAMPUS_LOCATIONS[0]);
  const [addrRoom, setAddrRoom] = useState('');
  const [addingAddr, setAddingAddr] = useState(false);
  const [reorderingId, setReorderingId] = useState<string | null>(null);

  if (!userProfile) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#DDF3E4] text-[#176B45] flex items-center justify-center mx-auto mb-4">
          <UserIcon className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-[#111814] mb-2">Customer Dashboard</h1>
        <p className="text-sm text-[#4A5850] mb-6">
          Sign in to access your refill order history, saved campus addresses, and personal plastic
          reduction metrics.
        </p>
        <button
          type="button"
          onClick={onOpenAuth}
          className="px-6 py-2.5 bg-[#176B45] text-white text-sm font-semibold rounded-xl cursor-pointer"
        >
          Sign In / Register
        </button>
      </div>
    );
  }

  const pendingOrders = orders.filter(
    (o) => !['Delivered', 'Cancelled'].includes(o.status)
  ).length;
  const completedOrders = orders.filter((o) => o.status === 'Delivered').length;
  const computedMoneySaved = orders.reduce(
    (sum, o) => (o.status !== 'Cancelled' ? sum + o.moneySaved : sum),
    0
  );
  const computedBottlesAvoided = orders.reduce(
    (sum, o) => (o.status !== 'Cancelled' ? sum + o.bottlesAvoided : sum),
    0
  );

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileNotice(null);
    try {
      await updateUserProfile(userProfile.uid, {
        displayName,
        phone,
        hostelOrAddress,
        roomNumber,
      });
      setProfileNotice('Profile saved.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddAddress = async (e: FormEvent) => {
    e.preventDefault();
    if (addrRecipient.trim().length < 2 || addrPhone.replace(/\D/g, '').length < 10) return;
    setAddingAddr(true);
    try {
      await createAddress(userProfile.uid, {
        label: addrLabel.trim() || 'Hostel',
        recipientName: addrRecipient.trim(),
        phone: addrPhone.trim(),
        hostelOrAddress: addrLocation.trim(),
        roomNumber: addrRoom.trim() || undefined,
      });
      setAddrRoom('');
    } finally {
      setAddingAddr(false);
    }
  };

  const handleQuickReorder = async (orderId: string) => {
    setReorderingId(orderId);
    try {
      const items = await fetchOrderItems(orderId);
      if (items.length > 0) {
        onReorderItems(items);
      }
    } finally {
      setReorderingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E4E8E2]">
        <div>
          <p className="text-xs font-medium text-[#176B45] mb-1">
            {isAdmin ? 'Verified Admin & Customer Account' : 'Campus Customer Account'}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111814]">
            Welcome back, {userProfile.displayName}
          </h1>
          <p className="text-sm text-[#4A5850] mt-1">{userProfile.email}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isAdmin && (
            <button
              type="button"
              onClick={onOpenAdmin}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#111814] text-white text-xs font-semibold rounded-xl cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-[#DDF3E4]" />
              <span>Open Admin Console</span>
            </button>
          )}
          <button
            type="button"
            onClick={onShopNow}
            className="px-4 py-2.5 bg-[#176B45] hover:bg-[#125436] text-white text-xs font-semibold rounded-xl cursor-pointer"
          >
            New Refill Order
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-[#D4DBD3] hover:border-red-300 text-[#111814] text-xs font-semibold rounded-xl cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {userProfile.adminRequested && !isAdmin && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
          Your request for Admin access is pending verification by an existing REFILL+
          administrator. Customer features remain fully active.
        </div>
      )}

      {/* 5 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-[#E4E8E2] rounded-2xl p-5">
          <p className="text-xs text-[#6E7C74]">Total Orders</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-[#111814] mt-1">
            {orders.length}
          </p>
        </div>
        <div className="bg-white border border-[#E4E8E2] rounded-2xl p-5">
          <p className="text-xs text-[#6E7C74]">Pending Orders</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-[#111814] mt-1">
            {pendingOrders}
          </p>
        </div>
        <div className="bg-white border border-[#E4E8E2] rounded-2xl p-5">
          <p className="text-xs text-[#6E7C74]">Completed Orders</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-[#111814] mt-1">
            {completedOrders}
          </p>
        </div>
        <div className="bg-[#DDF3E4]/60 border border-[#176B45]/20 rounded-2xl p-5">
          <p className="text-xs text-[#176B45] font-medium">Total Money Saved</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-[#176B45] mt-1">
            ₹{Math.max(userProfile.totalMoneySaved || 0, computedMoneySaved)}
          </p>
        </div>
        <div className="bg-[#176B45] text-white rounded-2xl p-5 col-span-2 lg:col-span-1">
          <p className="text-xs text-[#DDF3E4]">Plastic Bottles Avoided</p>
          <p className="text-2xl font-bold font-mono tabular-nums mt-1">
            {Math.max(userProfile.totalBottlesAvoided || 0, computedBottlesAvoided).toFixed(1)}
          </p>
        </div>
      </div>

      {/* Main Grid: Recent Orders + Profile & Addresses */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Recent Orders */}
        <div className="lg:col-span-7 bg-white border border-[#E4E8E2] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#111814]">Recent Orders</h2>
            <span className="text-xs text-[#6E7C74] font-mono tabular-nums">
              {orders.length} total
            </span>
          </div>

          {orders.length === 0 ? (
            <div className="py-10 text-center">
              <Package className="w-7 h-7 text-[#176B45] mx-auto mb-2" />
              <p className="text-sm font-medium text-[#111814] mb-1">No refills ordered yet</p>
              <p className="text-xs text-[#4A5850] mb-4">
                Start with a 500 ml Handwash or Dishwash refill to see your live savings here.
              </p>
              <button
                type="button"
                onClick={onShopNow}
                className="px-4 py-2 bg-[#176B45] text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                Shop Refills
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#E4E8E2]">
              {orders.slice(0, 6).map((order) => (
                <div
                  key={order.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono font-semibold text-[#176B45]">
                        {order.orderNumber}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="text-[#4A5850] font-medium">{order.status}</span>
                    </div>
                    <p className="text-sm font-semibold text-[#111814] truncate mt-0.5">
                      {order.itemsSummary}
                    </p>
                    <p className="text-xs text-[#6E7C74] mt-0.5 font-mono tabular-nums">
                      ₹{order.totalAmount} · Saved ₹{order.moneySaved}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onViewOrder(order.id)}
                      className="px-3 py-1.5 text-xs font-medium border border-[#D4DBD3] hover:border-[#176B45] rounded-lg cursor-pointer"
                    >
                      Track
                    </button>
                    <button
                      type="button"
                      disabled={reorderingId === order.id}
                      onClick={() => handleQuickReorder(order.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-[#DDF3E4] text-[#176B45] hover:bg-[#176B45] hover:text-white rounded-lg transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>{reorderingId === order.id ? 'Adding...' : 'Reorder'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Profile & Saved Addresses */}
        <div className="lg:col-span-5 space-y-6">
          {/* Profile Form */}
          <form
            onSubmit={handleSaveProfile}
            className="bg-white border border-[#E4E8E2] rounded-2xl p-6 space-y-4"
          >
            <h2 className="text-lg font-bold text-[#111814]">Profile Details</h2>

            {profileNotice && (
              <div className="p-2.5 rounded-lg bg-[#DDF3E4] text-xs text-[#176B45] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{profileNotice}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[#4A5850] mb-1">Full Name</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#D4DBD3] rounded-xl focus:outline-none focus:border-[#176B45]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#4A5850] mb-1">Mobile</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit mobile"
                  className="w-full px-3 py-2 text-sm border border-[#D4DBD3] rounded-xl focus:outline-none focus:border-[#176B45]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4A5850] mb-1">Room No.</label>
                <input
                  type="text"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="e.g., 214"
                  className="w-full px-3 py-2 text-sm border border-[#D4DBD3] rounded-xl focus:outline-none focus:border-[#176B45]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#4A5850] mb-1">
                Default Hostel / Address
              </label>
              <input
                type="text"
                value={hostelOrAddress}
                onChange={(e) => setHostelOrAddress(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#D4DBD3] rounded-xl focus:outline-none focus:border-[#176B45]"
              />
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="w-full py-2.5 bg-[#176B45] hover:bg-[#125436] text-white text-xs font-semibold rounded-xl cursor-pointer"
            >
              {savingProfile ? 'Saving...' : 'Save Profile'}
            </button>
          </form>

          {/* Saved Addresses */}
          <div className="bg-white border border-[#E4E8E2] rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#176B45]" />
              <h2 className="text-lg font-bold text-[#111814]">Saved Addresses</h2>
            </div>

            {addresses.length > 0 && (
              <div className="space-y-2">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="p-3 rounded-xl bg-[#FAFAF8] border border-[#E4E8E2] flex items-start justify-between gap-2"
                  >
                    <div className="text-xs">
                      <p className="font-semibold text-[#111814]">
                        {addr.label} · {addr.recipientName}
                      </p>
                      <p className="text-[#4A5850]">
                        {addr.hostelOrAddress}
                        {addr.roomNumber ? `, Room ${addr.roomNumber}` : ''}
                      </p>
                      <p className="text-[#6E7C74] font-mono">{addr.phone}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteAddress(addr.id)}
                      aria-label="Delete address"
                      className="text-[#6E7C74] hover:text-red-600 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleAddAddress} className="pt-3 border-t border-[#E4E8E2] space-y-2.5">
              <p className="text-xs font-semibold text-[#111814]">Add New Campus Address</p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  value={addrLabel}
                  onChange={(e) => setAddrLabel(e.target.value)}
                  placeholder="Label (Hostel / Home)"
                  className="px-3 py-2 text-xs border border-[#D4DBD3] rounded-lg"
                />
                <input
                  type="text"
                  required
                  value={addrRecipient}
                  onChange={(e) => setAddrRecipient(e.target.value)}
                  placeholder="Recipient name"
                  className="px-3 py-2 text-xs border border-[#D4DBD3] rounded-lg"
                />
                <input
                  type="tel"
                  required
                  value={addrPhone}
                  onChange={(e) => setAddrPhone(e.target.value)}
                  placeholder="10-digit mobile"
                  className="px-3 py-2 text-xs border border-[#D4DBD3] rounded-lg"
                />
                <input
                  type="text"
                  value={addrRoom}
                  onChange={(e) => setAddrRoom(e.target.value)}
                  placeholder="Room no. (optional)"
                  className="px-3 py-2 text-xs border border-[#D4DBD3] rounded-lg"
                />
              </div>
              <select
                value={addrLocation}
                onChange={(e) => setAddrLocation(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#D4DBD3] rounded-lg bg-white"
              >
                {CAMPUS_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={addingAddr}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#F3F5F2] hover:bg-[#DDF3E4] text-[#176B45] text-xs font-semibold rounded-lg cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{addingAddr ? 'Saving...' : 'Save Address'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
