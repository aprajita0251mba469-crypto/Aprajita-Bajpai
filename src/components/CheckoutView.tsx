import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  FlaskConical,
  QrCode,
  ShieldAlert,
  Truck,
} from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import {
  CAMPUS_LOCATIONS,
  DELIVERY_SLOTS,
  FREE_DELIVERY_THRESHOLD_INR,
  REUSABLE_CONTAINER_DEPOSIT_INR,
  STANDARD_DELIVERY_FEE_INR,
} from '../data/seedCatalog.ts';
import { placeRefillOrder } from '../lib/storeService.ts';
import type {
  Address,
  CartItem,
  ContainerOption,
  GuestCartItem,
  PaymentMethod,
  PaymentStatus,
  UserProfile,
} from '../types.ts';

interface CheckoutViewProps {
  userProfile: UserProfile | null;
  cartItems: (CartItem | GuestCartItem)[];
  addresses: Address[];
  onBackToShop: () => void;
  onOpenAuth: () => void;
  onOrderCreated: (orderId: string, orderNumber: string) => void;
}

export function CheckoutView({
  userProfile,
  cartItems,
  addresses,
  onBackToShop,
  onOpenAuth,
  onOrderCreated,
}: CheckoutViewProps) {
  const [customerName, setCustomerName] = useState(userProfile?.displayName || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [hostelOrAddress, setHostelOrAddress] = useState(
    userProfile?.hostelOrAddress || CAMPUS_LOCATIONS[0]
  );
  const [roomNumber, setRoomNumber] = useState(userProfile?.roomNumber || '');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [preferredDeliveryTime, setPreferredDeliveryTime] = useState(DELIVERY_SLOTS[0]);
  const [containerOption, setContainerOption] = useState<ContainerOption>(() =>
    cartItems.some((i) => i.containerMode === 'reusable')
      ? 'reusable_container'
      : 'own_container'
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [upiRef, setUpiRef] = useState('');
  const [demoOutcome, setDemoOutcome] = useState<'confirm' | 'fail'>('confirm');
  const [razorpayStatus, setRazorpayStatus] = useState<{
    checked: boolean;
    configured: boolean;
    keyId: string | null;
  }>({ checked: false, configured: false, keyId: null });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<{
    orderId: string;
    orderNumber: string;
    totalAmount: number;
    paymentStatus: PaymentStatus;
  } | null>(null);

  useEffect(() => {
    if (userProfile) {
      if (!customerName) setCustomerName(userProfile.displayName || '');
      if (!phone && userProfile.phone) setPhone(userProfile.phone);
      if (!roomNumber && userProfile.roomNumber) setRoomNumber(userProfile.roomNumber);
    }
  }, [userProfile, customerName, phone, roomNumber]);

  useEffect(() => {
    fetch('/api/payments/razorpay/status')
      .then((res) => res.json())
      .then((data) => {
        setRazorpayStatus({
          checked: true,
          configured: Boolean(data?.configured),
          keyId: data?.keyId || null,
        });
      })
      .catch(() => {
        setRazorpayStatus({ checked: true, configured: false, keyId: null });
      });
  }, []);

  const subtotal = cartItems.reduce((s, item) => s + item.unitPrice * item.quantity, 0);
  const totalBottlesUnits = cartItems.reduce((s, item) => s + item.quantity, 0);
  const containerDeposit =
    containerOption === 'reusable_container'
      ? totalBottlesUnits * REUSABLE_CONTAINER_DEPOSIT_INR
      : 0;
  const deliveryFee =
    cartItems.length === 0 ? 0 : subtotal >= FREE_DELIVERY_THRESHOLD_INR ? 0 : STANDARD_DELIVERY_FEE_INR;
  const totalAmount = subtotal + containerDeposit + deliveryFee;

  const moneySaved = cartItems.reduce(
    (s, item) => s + Math.max(0, item.plasticMrp - item.unitPrice) * item.quantity,
    0
  );
  const bottlesAvoided = cartItems.reduce(
    (s, item) => s + (item.volumeMl / 500) * item.quantity,
    0
  );
  const totalLitres = cartItems.reduce((s, item) => s + (item.volumeMl / 1000) * item.quantity, 0);

  if (confirmedOrder) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-14">
        <div className="bg-white border border-[#E4E8E2] rounded-2xl p-8 text-center">
          <div
            className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-5 ${
              confirmedOrder.paymentStatus === 'failed'
                ? 'bg-red-50 text-red-600'
                : 'bg-[#DDF3E4] text-[#176B45]'
            }`}
          >
            {confirmedOrder.paymentStatus === 'failed' ? (
              <AlertCircle className="w-7 h-7" />
            ) : (
              <CheckCircle2 className="w-7 h-7" />
            )}
          </div>
          <p className="text-xs font-mono text-[#176B45] font-semibold mb-1">
            Order ID: {confirmedOrder.orderNumber}
          </p>
          <h1 className="text-2xl font-bold text-[#111814] mb-2">
            {confirmedOrder.paymentStatus === 'failed'
              ? 'Demo Payment Simulation Failed'
              : 'Refill Order Placed Successfully'}
          </h1>
          <p className="text-sm text-[#4A5850] max-w-md mx-auto mb-6">
            {confirmedOrder.paymentStatus === 'pending_cod' &&
              `Cash on Delivery selected. Please keep ₹${confirmedOrder.totalAmount} ready during your delivery slot.`}
            {confirmedOrder.paymentStatus === 'verification_pending' &&
              'Your UPI reference has been recorded as Verification Pending until confirmed by the Refill+ team.'}
            {confirmedOrder.paymentStatus === 'demo_confirmed' &&
              'Recorded in Demo Test Mode (non-production testing confirmation).'}
            {confirmedOrder.paymentStatus === 'failed' &&
              'As simulated, this payment attempt failed and was NOT marked as paid.'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onOrderCreated(confirmedOrder.orderId, confirmedOrder.orderNumber)}
              className="px-5 py-2.5 bg-[#176B45] hover:bg-[#125436] text-white text-sm font-semibold rounded-xl cursor-pointer"
            >
              Track Order Progress
            </button>
            <button
              type="button"
              onClick={onBackToShop}
              className="px-5 py-2.5 bg-white border border-[#D4DBD3] hover:border-[#176B45] text-[#111814] text-sm font-semibold rounded-xl cursor-pointer"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-[#111814] mb-2">Your cart is empty</h1>
        <p className="text-sm text-[#4A5850] mb-6">
          Add household liquid refills from our catalog before checking out.
        </p>
        <button
          type="button"
          onClick={onBackToShop}
          className="px-5 py-2.5 bg-[#176B45] text-white text-sm font-semibold rounded-xl cursor-pointer"
        >
          Browse Refill Catalog
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!userProfile) {
      onOpenAuth();
      return;
    }

    if (customerName.trim().length < 2) {
      setError('Please enter the recipient full name.');
      return;
    }
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (hostelOrAddress.trim().length < 3) {
      setError('Please enter your hostel block or delivery address.');
      return;
    }

    if (paymentMethod === 'razorpay' && !razorpayStatus.configured) {
      setError(
        'Live Razorpay gateway is not configured in environment variables (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET missing). Please select Cash on Delivery, UPI, or Demo Test Mode.'
      );
      return;
    }

    if (paymentMethod === 'upi' && upiRef.trim().length < 6) {
      setError('Please enter your UPI transaction / UTR reference ID (at least 6 characters) after paying via the UPI link.');
      return;
    }

    let resolvedPaymentStatus: Exclude<PaymentStatus, 'paid_verified'> = 'pending_cod';
    let providerNote = 'Pay cash or UPI upon delivery';
    let txRef: string | undefined;

    if (paymentMethod === 'cod') {
      resolvedPaymentStatus = 'pending_cod';
      providerNote = 'Cash on Delivery — unpaid until handover';
    } else if (paymentMethod === 'upi') {
      resolvedPaymentStatus = 'verification_pending';
      txRef = upiRef.trim();
      providerNote = 'UPI UTR submitted — awaiting admin verification';
    } else if (paymentMethod === 'demo') {
      resolvedPaymentStatus = demoOutcome === 'confirm' ? 'demo_confirmed' : 'failed';
      txRef = `DEMO-${Date.now()}`;
      providerNote =
        demoOutcome === 'confirm'
          ? 'Demo Test Payment Mode (non-production)'
          : 'Demo Test Payment simulated failure';
    } else if (paymentMethod === 'razorpay') {
      // Attempt server-side Razorpay order creation
      setSubmitting(true);
      try {
        const res = await fetch('/api/payments/razorpay/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amountInr: totalAmount, receipt: `rfl_${Date.now()}` }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data?.error || 'Unable to initiate Razorpay order.');
          setSubmitting(false);
          return;
        }
        resolvedPaymentStatus = 'verification_pending';
        txRef = data.orderId;
        providerNote = 'Razorpay order created; awaiting gateway callback verification';
      } catch {
        setError('Unable to connect to Razorpay order endpoint.');
        setSubmitting(false);
        return;
      }
    }

    setSubmitting(true);
    try {
      const normalizedItems: CartItem[] = cartItems.map((i) => ({
        ...i,
        userId: userProfile.uid,
      }));

      const result = await placeRefillOrder({
        user: userProfile,
        items: normalizedItems,
        customerName: customerName.trim(),
        phone: phone.trim(),
        hostelOrAddress: hostelOrAddress.trim(),
        roomNumber: roomNumber.trim() || undefined,
        deliveryInstructions: deliveryInstructions.trim() || undefined,
        preferredDeliveryTime,
        containerOption,
        paymentMethod,
        paymentStatus: resolvedPaymentStatus,
        transactionRef: txRef,
        providerNote,
        subtotal,
        containerDeposit,
        deliveryFee,
        totalAmount,
        moneySaved,
        bottlesAvoided,
        totalLitres,
      });

      setConfirmedOrder({
        orderId: result.orderId,
        orderNumber: result.orderNumber,
        totalAmount,
        paymentStatus: resolvedPaymentStatus,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Order placement failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const upiDeepLink = `upi://pay?pa=refillplus.dgu@upi&pn=REFILL%20Plus%20Dehradun&am=${totalAmount}&cu=INR&tn=CampusRefill`;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <button
        type="button"
        onClick={onBackToShop}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#4A5850] hover:text-[#176B45] mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Catalog
      </button>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left: Checkout Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-[#E4E8E2] rounded-2xl p-6 sm:p-8">
            <h1 className="text-2xl font-bold text-[#111814] mb-1">Campus Refill Checkout</h1>
            <p className="text-sm text-[#4A5850] mb-6">
              Delivering around DBS Global University, Dehradun.
            </p>

            {!userProfile && (
              <div className="mb-6 p-4 rounded-xl bg-[#DDF3E4] border border-[#176B45]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs text-[#111814]">
                  Sign in to link this order to your profile, track delivery status, and save your
                  plastic impact.
                </p>
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="px-4 py-2 bg-[#176B45] text-white text-xs font-semibold rounded-xl shrink-0 cursor-pointer"
                >
                  Sign In to Place Order
                </button>
              </div>
            )}

            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-800">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Saved Address Quick Fill */}
            {addresses.length > 0 && (
              <div className="mb-5">
                <p className="text-xs font-medium text-[#4A5850] mb-2">Saved Addresses</p>
                <div className="flex flex-wrap gap-2">
                  {addresses.map((addr) => (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => {
                        setCustomerName(addr.recipientName);
                        setPhone(addr.phone);
                        setHostelOrAddress(addr.hostelOrAddress);
                        setRoomNumber(addr.roomNumber || '');
                      }}
                      className="px-3 py-1.5 text-xs font-medium bg-[#F3F5F2] hover:bg-[#DDF3E4] text-[#111814] rounded-lg border border-[#E4E8E2] cursor-pointer"
                    >
                      {addr.label} · {addr.hostelOrAddress}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#4A5850] mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Full name"
                  className="w-full px-3.5 py-2.5 text-sm border border-[#D4DBD3] rounded-xl focus:outline-none focus:border-[#176B45]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#4A5850] mb-1">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  className="w-full px-3.5 py-2.5 text-sm border border-[#D4DBD3] rounded-xl focus:outline-none focus:border-[#176B45]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-[#4A5850] mb-1">
                  Hostel / Campus Block or Address *
                </label>
                <select
                  value={CAMPUS_LOCATIONS.includes(hostelOrAddress) ? hostelOrAddress : 'custom'}
                  onChange={(e) =>
                    setHostelOrAddress(e.target.value === 'custom' ? '' : e.target.value)
                  }
                  className="w-full px-3.5 py-2.5 text-sm border border-[#D4DBD3] rounded-xl bg-white mb-2 focus:outline-none focus:border-[#176B45]"
                >
                  {CAMPUS_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                  <option value="custom">Other Dehradun Address (Type below)</option>
                </select>
                <input
                  type="text"
                  required
                  value={hostelOrAddress}
                  onChange={(e) => setHostelOrAddress(e.target.value)}
                  placeholder="Hostel block, PG name, or street address"
                  className="w-full px-3.5 py-2.5 text-sm border border-[#D4DBD3] rounded-xl focus:outline-none focus:border-[#176B45]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#4A5850] mb-1">
                  Room / Flat Number (Optional)
                </label>
                <input
                  type="text"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="e.g., Room 214"
                  className="w-full px-3.5 py-2.5 text-sm border border-[#D4DBD3] rounded-xl focus:outline-none focus:border-[#176B45]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#4A5850] mb-1">
                  Preferred Delivery Time *
                </label>
                <select
                  value={preferredDeliveryTime}
                  onChange={(e) => setPreferredDeliveryTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-[#D4DBD3] rounded-xl bg-white focus:outline-none focus:border-[#176B45]"
                >
                  {DELIVERY_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-[#4A5850] mb-1">
                  Delivery Instructions (Optional)
                </label>
                <input
                  type="text"
                  value={deliveryInstructions}
                  onChange={(e) => setDeliveryInstructions(e.target.value)}
                  placeholder="e.g., Call at Block A gate, leave with hostel guard"
                  className="w-full px-3.5 py-2.5 text-sm border border-[#D4DBD3] rounded-xl focus:outline-none focus:border-[#176B45]"
                />
              </div>
            </div>
          </div>

          {/* Container Preference */}
          <div className="bg-white border border-[#E4E8E2] rounded-2xl p-6 sm:p-8">
            <h2 className="text-lg font-bold text-[#111814] mb-3">Container Preference</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setContainerOption('own_container')}
                className={`p-4 rounded-xl border text-left transition-colors cursor-pointer ${
                  containerOption === 'own_container'
                    ? 'border-[#176B45] bg-[#DDF3E4]/50'
                    : 'border-[#E4E8E2] bg-white hover:border-[#176B45]/50'
                }`}
              >
                <p className="text-sm font-semibold text-[#111814]">Refill Using Own Container</p>
                <p className="text-xs text-[#4A5850] mt-1">
                  Hand over your clean existing bottle during delivery. ₹0 container fee.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setContainerOption('reusable_container')}
                className={`p-4 rounded-xl border text-left transition-colors cursor-pointer ${
                  containerOption === 'reusable_container'
                    ? 'border-[#176B45] bg-[#DDF3E4]/50'
                    : 'border-[#E4E8E2] bg-white hover:border-[#176B45]/50'
                }`}
              >
                <p className="text-sm font-semibold text-[#111814]">
                  Request Reusable Container (+₹{REUSABLE_CONTAINER_DEPOSIT_INR}/bottle)
                </p>
                <p className="text-xs text-[#4A5850] mt-1">
                  Delivered in sanitized Refill+ bottles. Refundable when returned later.
                </p>
              </button>
            </div>
          </div>

          {/* Payment System (Honest, Provider-Verified Architecture) */}
          <div className="bg-white border border-[#E4E8E2] rounded-2xl p-6 sm:p-8">
            <h2 className="text-lg font-bold text-[#111814] mb-1">Payment Method</h2>
            <p className="text-xs text-[#4A5850] mb-4">
              Payments are never marked verified without provider or admin confirmation.
            </p>

            <div className="grid sm:grid-cols-2 gap-3 mb-5">
              <button
                type="button"
                onClick={() => setPaymentMethod('cod')}
                className={`p-3.5 rounded-xl border text-left flex items-start gap-3 cursor-pointer ${
                  paymentMethod === 'cod'
                    ? 'border-[#176B45] bg-[#DDF3E4]/50'
                    : 'border-[#E4E8E2] bg-white'
                }`}
              >
                <Truck className="w-4 h-4 text-[#176B45] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-[#111814]">Cash on Delivery</p>
                  <p className="text-xs text-[#4A5850]">Pay ₹{totalAmount} at hostel doorstep</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('upi')}
                className={`p-3.5 rounded-xl border text-left flex items-start gap-3 cursor-pointer ${
                  paymentMethod === 'upi'
                    ? 'border-[#176B45] bg-[#DDF3E4]/50'
                    : 'border-[#E4E8E2] bg-white'
                }`}
              >
                <QrCode className="w-4 h-4 text-[#176B45] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-[#111814]">UPI Transfer</p>
                  <p className="text-xs text-[#4A5850]">Pay & submit 12-digit UTR</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('razorpay')}
                className={`p-3.5 rounded-xl border text-left flex items-start gap-3 cursor-pointer ${
                  paymentMethod === 'razorpay'
                    ? 'border-[#176B45] bg-[#DDF3E4]/50'
                    : 'border-[#E4E8E2] bg-white'
                }`}
              >
                <CreditCard className="w-4 h-4 text-[#176B45] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-[#111814]">Razorpay Gateway</p>
                  <p className="text-xs text-[#4A5850]">
                    {razorpayStatus.checked
                      ? razorpayStatus.configured
                        ? 'Gateway ready'
                        : 'Requires API credentials'
                      : 'Checking gateway...'}
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('demo')}
                className={`p-3.5 rounded-xl border text-left flex items-start gap-3 cursor-pointer ${
                  paymentMethod === 'demo'
                    ? 'border-[#176B45] bg-[#DDF3E4]/50'
                    : 'border-[#E4E8E2] bg-white'
                }`}
              >
                <FlaskConical className="w-4 h-4 text-[#176B45] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-[#111814]">Demo Test Mode</p>
                  <p className="text-xs text-[#4A5850]">Testing only (non-production)</p>
                </div>
              </button>
            </div>

            {paymentMethod === 'upi' && (
              <div className="p-4 rounded-xl bg-[#FAFAF8] border border-[#E4E8E2] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium text-[#4A5850]">REFILL+ Campus UPI ID</p>
                    <p className="text-sm font-mono font-semibold text-[#111814]">
                      refillplus.dgu@upi
                    </p>
                  </div>
                  <a
                    href={upiDeepLink}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#176B45] text-white text-xs font-semibold rounded-lg"
                  >
                    Open UPI App (₹{totalAmount})
                  </a>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4A5850] mb-1">
                    Enter UPI Transaction / UTR Reference *
                  </label>
                  <input
                    type="text"
                    value={upiRef}
                    onChange={(e) => setUpiRef(e.target.value)}
                    placeholder="e.g., 432519820411"
                    className="w-full px-3.5 py-2 text-sm bg-white border border-[#D4DBD3] rounded-xl focus:outline-none focus:border-[#176B45]"
                  />
                  <p className="text-[11px] text-[#6E7C74] mt-1">
                    Order status starts as Verification Pending until the admin confirms your UTR.
                  </p>
                </div>
              </div>
            )}

            {paymentMethod === 'razorpay' && !razorpayStatus.configured && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
                <span>
                  Razorpay live gateway requires <code>RAZORPAY_KEY_ID</code> and{' '}
                  <code>RAZORPAY_KEY_SECRET</code> environment variables. Without live credentials,
                  REFILL+ never simulates a Razorpay success—please use COD, UPI, or Demo Test
                  Mode.
                </span>
              </div>
            )}

            {paymentMethod === 'demo' && (
              <div className="p-4 rounded-xl bg-[#FAFAF8] border border-[#E4E8E2] space-y-2">
                <p className="text-xs font-semibold text-[#111814]">
                  Demo Test Mode — Choose Simulated Outcome
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setDemoOutcome('confirm')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border cursor-pointer ${
                      demoOutcome === 'confirm'
                        ? 'bg-[#DDF3E4] border-[#176B45] text-[#176B45]'
                        : 'bg-white border-[#E4E8E2] text-[#4A5850]'
                    }`}
                  >
                    Simulate Demo Confirmed
                  </button>
                  <button
                    type="button"
                    onClick={() => setDemoOutcome('fail')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border cursor-pointer ${
                      demoOutcome === 'fail'
                        ? 'bg-red-50 border-red-400 text-red-700'
                        : 'bg-white border-[#E4E8E2] text-[#4A5850]'
                    }`}
                  >
                    Simulate Payment Failure
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 px-6 bg-[#176B45] hover:bg-[#125436] disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer"
          >
            {submitting
              ? 'Processing Order...'
              : userProfile
              ? `Place Refill Order · ₹${totalAmount}`
              : 'Sign In & Place Order'}
          </button>
        </form>

        {/* Right: Order Summary */}
        <aside className="lg:col-span-5 bg-white border border-[#E4E8E2] rounded-2xl p-6 sm:p-7 sticky top-24">
          <h2 className="text-lg font-bold text-[#111814] mb-4">Order Summary</h2>
          <div className="space-y-3 pb-4 border-b border-[#E4E8E2] max-h-72 overflow-y-auto">
            {cartItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium text-[#111814] truncate">{item.productName}</p>
                  <p className="text-xs text-[#6E7C74]">
                    {item.volumeMl === 1000 ? '1 Litre' : `${item.volumeMl} ml`} × {item.quantity}
                  </p>
                </div>
                <span className="font-mono tabular-nums font-semibold text-[#111814]">
                  ₹{item.unitPrice * item.quantity}
                </span>
              </div>
            ))}
          </div>

          <div className="py-4 space-y-2 text-sm border-b border-[#E4E8E2]">
            <div className="flex justify-between text-[#4A5850]">
              <span>Refill Subtotal</span>
              <span className="font-mono tabular-nums">₹{subtotal}</span>
            </div>
            <div className="flex justify-between text-[#4A5850]">
              <span>Reusable Container Deposit</span>
              <span className="font-mono tabular-nums">
                {containerDeposit > 0 ? `₹${containerDeposit}` : '₹0 (Own bottle)'}
              </span>
            </div>
            <div className="flex justify-between text-[#4A5850]">
              <span>Campus Delivery Fee</span>
              <span className="font-mono tabular-nums">
                {deliveryFee === 0 ? 'Free' : `₹${deliveryFee}`}
              </span>
            </div>
          </div>

          <div className="pt-4 flex items-baseline justify-between mb-4">
            <span className="text-base font-bold text-[#111814]">Total Payable</span>
            <span className="text-2xl font-bold font-mono tabular-nums text-[#176B45]">
              ₹{totalAmount}
            </span>
          </div>

          <div className="bg-[#DDF3E4]/70 rounded-xl p-3.5 text-xs text-[#176B45] space-y-1">
            <div className="flex justify-between">
              <span>Money saved vs plastic bottles</span>
              <span className="font-mono font-semibold tabular-nums">₹{moneySaved}</span>
            </div>
            <div className="flex justify-between">
              <span>Plastic bottles avoided</span>
              <span className="font-mono font-semibold tabular-nums">
                {bottlesAvoided.toFixed(1)} bottles ({totalLitres.toFixed(2)} L)
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
