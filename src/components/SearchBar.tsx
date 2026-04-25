"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, X } from "lucide-react";

interface SearchBarProps {
  defaultQuery?: string;
  defaultLocation?: string;
  size?: "sm" | "lg";
}

export function SearchBar({ defaultQuery = "", defaultLocation = "", size = "lg" }: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultQuery);
  const [location, setLocation] = useState(defaultLocation);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setQuery(defaultQuery);
    setLocation(defaultLocation);
  }, [defaultQuery, defaultLocation]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (location.trim()) params.set("city", location.trim());
    router.push(`/businesses?${params.toString()}`);
  };

  if (size === "sm") {
    return (
      <form onSubmit={handleSearch} className="flex items-center gap-2 w-full max-w-lg">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search businesses..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-gray-50"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <button type="submit" className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors">
          Search
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSearch} className="w-full max-w-3xl">
      <div className="flex flex-col sm:flex-row bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Query input */}
        <div className="flex-1 flex items-center px-5 py-3 gap-3 border-b sm:border-b-0 sm:border-r border-gray-100">
          <Search className="w-5 h-5 text-brand-500 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for businesses, services, food..."
            className="flex-1 text-gray-800 placeholder-gray-400 text-base focus:outline-none bg-transparent min-w-0"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Location input */}
        <div className="flex items-center px-5 py-3 gap-3 sm:w-56">
          <MapPin className="w-5 h-5 text-brand-500 flex-shrink-0" />
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City or neighborhood"
            className="flex-1 text-gray-800 placeholder-gray-400 text-base focus:outline-none bg-transparent min-w-0"
          />
          {location && (
            <button type="button" onClick={() => setLocation("")} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          type="submit"
          className="m-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors text-base whitespace-nowrap"
        >
          Find Businesses
        </button>
      </div>
    </form>
  );
}
