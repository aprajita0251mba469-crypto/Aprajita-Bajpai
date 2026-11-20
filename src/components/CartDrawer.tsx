import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import {
  FREE_DELIVERY_THRESHOLD_INR,
  getProductPlasticMrp,
  getProductPrice,
  REUSABLE_CONTAINER_DEPOSIT_INR,
  STANDARD_DELIVERY_FEE_INR,
} from '../data/seedCatalog.ts';
import type { CartItem, ContainerMode, GuestCartItem, Product, VolumeMl } from '../types.ts';
import { ProductImage } from './ProductImage.tsx';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: (CartItem | GuestCartItem)[];
  products: Product[];
  onUpdateItem: (
    itemId: string,
    updates: {
      volumeMl: VolumeMl;
      unitPrice: number;
      plasticMrp: number;
      quantity: number;
      containerMode: ContainerMode;
    }
  ) => void;
  onRemoveItem: (itemId: string) => void;
  onProceedToCheckout: () => void;
}

const VOLUMES: VolumeMl[] = [250, 500, 1000];

export function CartDrawer({
  isOpen,
  onClose,
  items,
  products,
  onUpdateItem,
  onRemoveItem,
  onProceedToCheckout,
}: CartDrawerProps) {
  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const reusableCount = items.reduce(
    (sum, item) => sum + (item.containerMode === 'reusable' ? item.quantity : 0),
    0
  );
  const containerDeposit = reusableCount * REUSABLE_CONTAINER_DEPOSIT_INR;
  const deliveryFee =
    items.length === 0 ? 0 : subtotal >= FREE_DELIVERY_THRESHOLD_INR ? 0 : STANDARD_DELIVERY_FEE_INR;
  const totalAmount = subtotal + containerDeposit + deliveryFee;

  const totalSaved = items.reduce(
    (sum, item) => sum + Math.max(0, item.plasticMrp - item.unitPrice) * item.quantity,
    0
  );
  const bottlesAvoided = items.reduce(
    (sum, item) => sum + (item.volumeMl / 500) * item.quantity,
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs" role="dialog" aria-modal="true" aria-label="Shopping Cart">
      <div className="w-full max-w-md bg-white h-full flex flex-col border-l border-[#E4E8E2] shadow-2xl">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#E4E8E2] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-[#176B45]" />
            <h2 className="text-lg font-bold text-[#111814]">Your Refill Bag</h2>
            <span className="text-xs font-mono tabular-nums text-[#6E7C74]">
              ({items.reduce((s, i) => s + i.quantity, 0)} items)
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close cart"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#6E7C74] hover:bg-[#F3F5F2] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <div className="w-14 h-14 rounded-2xl bg-[#DDF3E4] flex items-center justify-center text-[#176B45] mb-4">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-[#111814] mb-1">Your refill bag is empty</h3>
              <p className="text-sm text-[#4A5850] max-w-xs mb-5">
                Pick a household liquid refill and choose 250 ml, 500 ml, or 1 litre to start saving.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-[#176B45] text-white text-sm font-medium rounded-xl hover:bg-[#125436] transition-colors cursor-pointer"
              >
                Browse Refills
              </button>
            </div>
          ) : (
            items.map((item) => {
              const product = products.find((p) => p.id === item.productId);
              return (
                <div
                  key={item.id}
                  className="pb-5 border-b border-[#E4E8E2] last:border-b-0 flex gap-4"
                >
                  <ProductImage
                    src={item.imageUrl}
                    alt={item.productName}
                    className="w-20 h-20 rounded-xl object-cover shrink-0 border border-[#E4E8E2]"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-[#111814] truncate">
                        {item.productName}
                      </h3>
                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.id)}
                        aria-label={`Remove ${item.productName}`}
                        className="text-[#6E7C74] hover:text-red-600 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Volume Switcher */}
                    <div className="flex items-center gap-1.5 mt-2">
                      {VOLUMES.map((vol) => {
                        const nextPrice = product ? getProductPrice(product, vol) : item.unitPrice;
                        const nextMrp = product ? getProductPlasticMrp(product, vol) : item.plasticMrp;
                        const active = item.volumeMl === vol;
                        return (
                          <button
                            key={vol}
                            type="button"
                            onClick={() =>
                              onUpdateItem(item.id, {
                                volumeMl: vol,
                                unitPrice: nextPrice,
                                plasticMrp: nextMrp,
                                quantity: item.quantity,
                                containerMode: item.containerMode,
                              })
                            }
                            className={`px-2 py-1 text-[11px] font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                              active
                                ? 'bg-[#176B45] text-white border-[#176B45]'
                                : 'bg-white text-[#4A5850] border-[#E4E8E2] hover:border-[#176B45]'
                            }`}
                          >
                            {vol === 1000 ? '1 L' : `${vol} ml`}
                          </button>
                        );
                      })}
                    </div>

                    {/* Container Mode Toggle */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateItem(item.id, {
                            volumeMl: item.volumeMl,
                            unitPrice: item.unitPrice,
                            plasticMrp: item.plasticMrp,
                            quantity: item.quantity,
                            containerMode: item.containerMode === 'own' ? 'reusable' : 'own',
                          })
                        }
                        className="text-xs text-[#176B45] hover:underline cursor-pointer"
                      >
                        {item.containerMode === 'own'
                          ? 'Using own bottle (₹0) · Switch'
                          : `+₹${REUSABLE_CONTAINER_DEPOSIT_INR} reusable bottle · Switch`}
                      </button>
                    </div>

                    {/* Stepper + Line Total */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="inline-flex items-center border border-[#E4E8E2] rounded-lg">
                        <button
                          type="button"
                          onClick={() =>
                            item.quantity > 1
                              ? onUpdateItem(item.id, {
                                  volumeMl: item.volumeMl,
                                  unitPrice: item.unitPrice,
                                  plasticMrp: item.plasticMrp,
                                  quantity: item.quantity - 1,
                                  containerMode: item.containerMode,
                                })
                              : onRemoveItem(item.id)
                          }
                          aria-label="Decrease quantity"
                          className="w-7 h-7 flex items-center justify-center text-[#4A5850] hover:bg-[#F3F5F2] cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-xs font-mono tabular-nums font-medium">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateItem(item.id, {
                              volumeMl: item.volumeMl,
                              unitPrice: item.unitPrice,
                              plasticMrp: item.plasticMrp,
                              quantity: Math.min(50, item.quantity + 1),
                              containerMode: item.containerMode,
                            })
                          }
                          aria-label="Increase quantity"
                          className="w-7 h-7 flex items-center justify-center text-[#4A5850] hover:bg-[#F3F5F2] cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-semibold font-mono tabular-nums text-[#111814]">
                          ₹{item.unitPrice * item.quantity}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Summary Footer */}
        {items.length > 0 && (
          <div className="border-t border-[#E4E8E2] bg-[#FAFAF8] px-6 py-5 space-y-3">
            <div className="text-xs text-[#176B45] bg-[#DDF3E4] px-3.5 py-2.5 rounded-xl flex items-center justify-between">
              <span>Estimated bag impact</span>
              <span className="font-mono tabular-nums font-semibold">
                Save ₹{totalSaved} · {bottlesAvoided.toFixed(1)} bottles avoided
              </span>
            </div>

            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-[#4A5850]">
                <span>Refill Subtotal</span>
                <span className="font-mono tabular-nums">₹{subtotal}</span>
              </div>
              {containerDeposit > 0 && (
                <div className="flex justify-between text-[#4A5850]">
                  <span>Reusable Bottles ({reusableCount} × ₹{REUSABLE_CONTAINER_DEPOSIT_INR})</span>
                  <span className="font-mono tabular-nums">₹{containerDeposit}</span>
                </div>
              )}
              <div className="flex justify-between text-[#4A5850]">
                <span>Campus Delivery (Free ≥ ₹{FREE_DELIVERY_THRESHOLD_INR})</span>
                <span className="font-mono tabular-nums">
                  {deliveryFee === 0 ? 'Free' : `₹${deliveryFee}`}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold text-[#111814] pt-2 border-t border-[#E4E8E2]">
                <span>Total Amount</span>
                <span className="font-mono tabular-nums">₹{totalAmount}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onProceedToCheckout}
              className="w-full py-3 px-4 bg-[#176B45] hover:bg-[#125436] text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
