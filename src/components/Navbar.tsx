"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Building2, Search, Menu, X, ChevronDown, LayoutDashboard, LogOut, User, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">
              Local<span className="text-brand-600">Spot</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/businesses" className="text-sm font-medium text-gray-600 hover:text-brand-600 transition-colors">
              Businesses
            </Link>
            <Link href="/deals" className="text-sm font-medium text-gray-600 hover:text-rose-600 transition-colors flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
              Deals
            </Link>
            <Link href="/events" className="text-sm font-medium text-gray-600 hover:text-violet-600 transition-colors">
              Events
            </Link>
            <Link href="/businesses?category=restaurant" className="text-sm font-medium text-gray-600 hover:text-brand-600 transition-colors">
              Restaurants
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/businesses" className="p-2 text-gray-500 hover:text-brand-600 transition-colors" aria-label="Search">
              <Search className="w-5 h-5" />
            </Link>

            {session ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-brand-600 transition-colors"
                >
                  <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-brand-600" />
                  </div>
                  <span className="max-w-24 truncate">{session.user?.name?.split(" ")[0] || "Account"}</span>
                  <ChevronDown className={cn("w-4 h-4 transition-transform", userMenuOpen && "rotate-180")} />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl border border-gray-200 shadow-lg py-1 z-50">
                    {(session.user as { role?: string })?.role === "BUSINESS_OWNER" || (session.user as { role?: string })?.role === "ADMIN" ? (
                      <>
                        <Link href="/dashboard" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                          <LayoutDashboard className="w-4 h-4" /> Dashboard
                        </Link>
                        <Link href="/dashboard/edit" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                          <Plus className="w-4 h-4" /> Add Business
                        </Link>
                      </>
                    ) : (
                      <Link href="/dashboard/edit" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                        <Plus className="w-4 h-4" /> List Your Business
                      </Link>
                    )}
                    <hr className="my-1 border-gray-100" />
                    <button
                      onClick={() => { signOut(); setUserMenuOpen(false); }}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/auth/signin" className="text-sm font-medium text-gray-700 hover:text-brand-600 transition-colors">
                  Sign In
                </Link>
                <Link href="/auth/signup" className="text-sm font-medium bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors">
                  List Your Business
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-gray-500">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-3">
          <Link href="/businesses" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-gray-700 py-1">Browse Businesses</Link>
          <Link href="/deals" onClick={() => setMobileOpen(false)} className="block text-sm text-rose-600 font-medium py-1">🏷️ Local Deals</Link>
          <Link href="/events" onClick={() => setMobileOpen(false)} className="block text-sm text-violet-600 font-medium py-1">📅 Events</Link>
          <Link href="/businesses?category=restaurant" onClick={() => setMobileOpen(false)} className="block text-sm text-gray-600 py-1">Restaurants</Link>
          <hr className="border-gray-100" />
          {session ? (
            <>
              <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-brand-600 py-1">Dashboard</Link>
              <button onClick={() => signOut()} className="block text-sm text-red-600 py-1">Sign Out</button>
            </>
          ) : (
            <>
              <Link href="/auth/signin" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-gray-700 py-1">Sign In</Link>
              <Link href="/auth/signup" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-brand-600 py-1">List Your Business</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
