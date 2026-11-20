import { Menu, ShoppingBag, User as UserIcon, X } from 'lucide-react';
import { useState } from 'react';
import type { AppView, UserProfile } from '../types.ts';

interface NavbarProps {
  activeView: AppView;
  onNavigate: (view: AppView, sectionId?: string) => void;
  cartCount: number;
  onOpenCart: () => void;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  onOpenAuth: () => void;
}

export function Navbar({
  activeView,
  onNavigate,
  cartCount,
  onOpenCart,
  userProfile,
  isAdmin,
  onOpenAuth,
}: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (view: AppView, sectionId?: string) => {
    setMobileOpen(false);
    onNavigate(view, sectionId);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E4E8E2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => handleNav('home')}
          className="text-xl font-bold tracking-tight text-[#176B45] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#176B45]"
        >
          REFILL+
        </button>

        {/* Zone 2: 5 Concise Single-Line Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#4A5850]">
          <button
            type="button"
            onClick={() => handleNav('home', 'catalog')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-[#176B45] cursor-pointer ${
              activeView === 'catalog' ? 'text-[#176B45] underline underline-offset-8' : ''
            }`}
          >
            Shop Refills
          </button>
          <button
            type="button"
            onClick={() => handleNav('home', 'how-it-works')}
            className="whitespace-nowrap shrink-0 transition-colors hover:text-[#176B45] cursor-pointer"
          >
            How It Works
          </button>
          <button
            type="button"
            onClick={() => handleNav('home', 'impact')}
            className="whitespace-nowrap shrink-0 transition-colors hover:text-[#176B45] cursor-pointer"
          >
            Impact
          </button>
          <button
            type="button"
            onClick={() => handleNav('orders')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-[#176B45] cursor-pointer ${
              activeView === 'orders' ? 'text-[#176B45] underline underline-offset-8' : ''
            }`}
          >
            Track Order
          </button>
          <button
            type="button"
            onClick={() => handleNav(isAdmin ? 'admin' : 'dashboard')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-[#176B45] cursor-pointer ${
              activeView === 'dashboard' || activeView === 'admin'
                ? 'text-[#176B45] underline underline-offset-8'
                : ''
            }`}
          >
            {isAdmin ? 'Admin' : 'Dashboard'}
          </button>
        </nav>

        {/* Zone 3: Primary Action Zone */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenCart}
            aria-label={`Open shopping cart with ${cartCount} items`}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-[#111814] bg-[#F3F5F2] hover:bg-[#DDF3E4] rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-[#176B45]" />
            <span className="tabular-nums">Cart ({cartCount})</span>
          </button>

          {userProfile ? (
            <button
              type="button"
              onClick={() => handleNav('dashboard')}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#176B45] hover:bg-[#125436] rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <UserIcon className="w-4 h-4" />
              <span className="max-w-[120px] truncate">{userProfile.displayName.split(' ')[0]}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[#176B45] hover:bg-[#125436] rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Sign In
            </button>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl text-[#111814] hover:bg-[#F3F5F2] cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#E4E8E2] bg-white px-4 py-4 space-y-2">
          <button
            type="button"
            onClick={() => handleNav('home', 'catalog')}
            className="block w-full text-left px-3 py-2.5 text-sm font-medium text-[#111814] hover:bg-[#F3F5F2] rounded-xl"
          >
            Shop Refills
          </button>
          <button
            type="button"
            onClick={() => handleNav('home', 'how-it-works')}
            className="block w-full text-left px-3 py-2.5 text-sm font-medium text-[#111814] hover:bg-[#F3F5F2] rounded-xl"
          >
            How It Works
          </button>
          <button
            type="button"
            onClick={() => handleNav('home', 'impact')}
            className="block w-full text-left px-3 py-2.5 text-sm font-medium text-[#111814] hover:bg-[#F3F5F2] rounded-xl"
          >
            Impact
          </button>
          <button
            type="button"
            onClick={() => handleNav('orders')}
            className="block w-full text-left px-3 py-2.5 text-sm font-medium text-[#111814] hover:bg-[#F3F5F2] rounded-xl"
          >
            Track Order
          </button>
          <button
            type="button"
            onClick={() => handleNav('dashboard')}
            className="block w-full text-left px-3 py-2.5 text-sm font-medium text-[#111814] hover:bg-[#F3F5F2] rounded-xl"
          >
            Customer Dashboard
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={() => handleNav('admin')}
              className="block w-full text-left px-3 py-2.5 text-sm font-medium text-[#176B45] hover:bg-[#DDF3E4]/50 rounded-xl"
            >
              Admin Dashboard
            </button>
          )}
          <div className="pt-2 border-t border-[#E4E8E2]">
            {userProfile ? (
              <button
                type="button"
                onClick={() => handleNav('dashboard')}
                className="w-full py-2.5 px-4 bg-[#176B45] text-white text-sm font-medium rounded-xl"
              >
                Account ({userProfile.displayName})
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  onOpenAuth();
                }}
                className="w-full py-2.5 px-4 bg-[#176B45] text-white text-sm font-medium rounded-xl"
              >
                Sign In / Register
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
