import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Package,
  RefreshCw,
  Search,
  Truck,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { cancelOrderByCustomer, fetchOrderItems } from '../lib/storeService.ts';
import type { Order, OrderItem, OrderStatus, UserProfile } from '../types.ts';

interface OrderTrackingViewProps {
  userProfile: UserProfile | null;
  orders: Order[];
  initialOrderId?: string | null;
  onOpenAuth: () => void;
  onReorderItems: (items: OrderItem[]) => void;
}

const PROGRESS_STEPS: OrderStatus[] = [
  'Order Placed',
  'Order Confirmed',
  'Preparing Refill',
  'Out for Delivery',
  'Delivered',
];

export function OrderTrackingView({
  userProfile,
  orders,
  initialOrderId,
  onOpenAuth,
  onReorderItems,
}: OrderTrackingViewProps) {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(initialOrderId || null);
  const [lookupQuery, setLookupQuery] = useState('');
  const [lineItems, setLineItems] = useState<OrderItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (initialOrderId) {
      setSelectedOrderId(initialOrderId);
    } else if (!selectedOrderId && orders.length > 0) {
      setSelectedOrderId(orders[0].id);
    }
  }, [initialOrderId, orders, selectedOrderId]);

  const filteredOrders = orders.filter((o) => {
    const q = lookupQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      o.itemsSummary.toLowerCase().includes(q) ||
      o.status.toLowerCase().includes(q)
    );
  });

  const activeOrder =
    orders.find((o) => o.id === selectedOrderId) || filteredOrders[0] || null;

  useEffect(() => {
    if (!activeOrder) {
      setLineItems([]);
      return;
    }
    setLoadingItems(true);
    fetchOrderItems(activeOrder.id)
      .then((items) => setLineItems(items))
      .finally(() => setLoadingItems(false));
  }, [activeOrder?.id]);

  if (!userProfile) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#DDF3E4] text-[#176B45] flex items-center justify-center mx-auto mb-4">
          <Package className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-[#111814] mb-2">Track Your Refill Orders</h1>
        <p className="text-sm text-[#4A5850] mb-6">
          Sign in to view real-time campus delivery progress, payment verification status, and
          one-click reorder history.
        </p>
        <button
          type="button"
          onClick={onOpenAuth}
          className="px-6 py-2.5 bg-[#176B45] text-white text-sm font-semibold rounded-xl cursor-pointer"
        >
          Sign In to View Orders
        </button>
      </div>
    );
  }

  const handleCancel = async (order: Order) => {
    setCancelling(true);
    try {
      await cancelOrderByCustomer(order.id);
    } finally {
      setCancelling(false);
    }
  };

  const renderPaymentLabel = (status: Order['paymentStatus']) => {
    switch (status) {
      case 'paid_verified':
        return { text: 'Paid (Verified)', cls: 'text-[#176B45] bg-[#DDF3E4]' };
      case 'demo_confirmed':
        return { text: 'Demo Confirmed (Test Mode)', cls: 'text-[#176B45] bg-[#DDF3E4]' };
      case 'verification_pending':
        return { text: 'Verification Pending', cls: 'text-amber-800 bg-amber-100' };
      case 'failed':
        return { text: 'Payment Failed', cls: 'text-red-800 bg-red-100' };
      default:
        return { text: 'Cash on Delivery (Unpaid)', cls: 'text-[#4A5850] bg-[#F3F5F2]' };
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-medium text-[#176B45] mb-1">Order Tracking</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111814]">
            Your Refill Orders & Delivery Status
          </h1>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#6E7C74] absolute left-3.5 top-3" />
          <input
            type="search"
            value={lookupQuery}
            onChange={(e) => setLookupQuery(e.target.value)}
            placeholder="Search by Order ID (RFL-...)"
            className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border border-[#D4DBD3] rounded-xl focus:outline-none focus:border-[#176B45]"
          />
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white border border-[#E4E8E2] rounded-2xl p-12 text-center">
          <Package className="w-8 h-8 text-[#176B45] mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-[#111814] mb-1">No orders placed yet</h2>
          <p className="text-sm text-[#4A5850]">
            Once you place a household refill order, you can track all 6 delivery stages here.
          </p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          {/* Order List */}
          <div className="lg:col-span-4 space-y-3">
            {filteredOrders.map((order) => {
              const selected = activeOrder?.id === order.id;
              return (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => setSelectedOrderId(order.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-colors cursor-pointer ${
                    selected
                      ? 'bg-[#DDF3E4]/50 border-[#176B45]'
                      : 'bg-white border-[#E4E8E2] hover:border-[#176B45]/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-mono font-semibold text-[#176B45]">
                      {order.orderNumber}
                    </span>
                    <span className="text-xs font-mono font-semibold text-[#111814] tabular-nums">
                      ₹{order.totalAmount}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-[#111814] truncate">
                    {order.itemsSummary}
                  </p>
                  <div className="flex items-center justify-between mt-2 text-xs text-[#4A5850]">
                    <span>{order.status}</span>
                    <span>{order.itemCount} items</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Order Tracker */}
          {activeOrder && (
            <div className="lg:col-span-8 bg-white border border-[#E4E8E2] rounded-2xl p-6 sm:p-8 space-y-8">
              <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-[#E4E8E2]">
                <div>
                  <p className="text-xs font-mono text-[#176B45] font-semibold">
                    {activeOrder.orderNumber}
                  </p>
                  <h2 className="text-xl font-bold text-[#111814] mt-1">
                    Status: {activeOrder.status}
                  </h2>
                  <p className="text-xs text-[#6E7C74] mt-1">
                    {activeOrder.hostelOrAddress}
                    {activeOrder.roomNumber ? ` · ${activeOrder.roomNumber}` : ''} ·{' '}
                    {activeOrder.preferredDeliveryTime}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {(() => {
                    const p = renderPaymentLabel(activeOrder.paymentStatus);
                    return (
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${p.cls}`}>
                        {p.text}
                      </span>
                    );
                  })()}
                  {['Order Placed', 'Order Confirmed'].includes(activeOrder.status) && (
                    <button
                      type="button"
                      disabled={cancelling}
                      onClick={() => handleCancel(activeOrder)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-700 hover:bg-red-50 text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      {cancelling ? 'Cancelling...' : 'Cancel Order'}
                    </button>
                  )}
                </div>
              </div>

              {/* 6-Stage Progress Tracker */}
              {activeOrder.status === 'Cancelled' ? (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-sm text-red-800">
                  <XCircle className="w-5 h-5 shrink-0 text-red-600" />
                  <span>This order was cancelled before dispatch. You can reorder below anytime.</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {PROGRESS_STEPS.map((step, idx) => {
                    const activeIdx = PROGRESS_STEPS.indexOf(activeOrder.status);
                    const reached = idx <= activeIdx;
                    const isCurrent = idx === activeIdx;
                    return (
                      <div
                        key={step}
                        className={`p-3 rounded-xl border ${
                          reached
                            ? 'bg-[#DDF3E4]/60 border-[#176B45]/40'
                            : 'bg-[#FAFAF8] border-[#E4E8E2]'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1.5">
                          {reached ? (
                            <CheckCircle2 className="w-4 h-4 text-[#176B45] shrink-0" />
                          ) : (
                            <Clock className="w-4 h-4 text-[#6E7C74] shrink-0" />
                          )}
                          <span className="text-[11px] font-mono text-[#6E7C74]">0{idx + 1}</span>
                        </div>
                        <p
                          className={`text-xs font-semibold ${
                            isCurrent
                              ? 'text-[#176B45]'
                              : reached
                              ? 'text-[#111814]'
                              : 'text-[#6E7C74]'
                          }`}
                        >
                          {step}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Itemized Receipt */}
              <div>
                <h3 className="text-sm font-bold text-[#111814] mb-3">Refill Items</h3>
                {loadingItems ? (
                  <p className="text-xs text-[#6E7C74]">Loading order items...</p>
                ) : lineItems.length === 0 ? (
                  <p className="text-sm text-[#4A5850]">{activeOrder.itemsSummary}</p>
                ) : (
                  <div className="divide-y divide-[#E4E8E2] border-y border-[#E4E8E2]">
                    {lineItems.map((item) => (
                      <div key={item.id} className="py-3 flex items-center justify-between text-sm">
                        <div>
                          <p className="font-medium text-[#111814]">{item.productName}</p>
                          <p className="text-xs text-[#6E7C74]">
                            {item.volumeMl === 1000 ? '1 Litre' : `${item.volumeMl} ml`} ×{' '}
                            {item.quantity} ·{' '}
                            {item.containerMode === 'own' ? 'Own Bottle' : 'Reusable Bottle'}
                          </p>
                        </div>
                        <span className="font-mono tabular-nums font-semibold">
                          ₹{item.lineTotal}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Totals + Impact + Reorder */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                <div className="text-xs text-[#4A5850] space-y-1">
                  <p>
                    Impact: <strong className="text-[#176B45]">₹{activeOrder.moneySaved} saved</strong>{' '}
                    · {activeOrder.bottlesAvoided.toFixed(1)} plastic bottles avoided
                  </p>
                  <p>
                    Container:{' '}
                    {activeOrder.containerOption === 'own_container'
                      ? 'Customer Own Container'
                      : 'REFILL+ Reusable Container'}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={lineItems.length === 0}
                  onClick={() => onReorderItems(lineItems)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#176B45] hover:bg-[#125436] disabled:opacity-50 text-white text-xs font-semibold rounded-xl cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reorder These Refills</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
