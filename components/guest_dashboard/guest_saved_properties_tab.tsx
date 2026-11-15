"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  MapPin,
  ArrowRight,
  Trash2,
  Building2,
  Compass,
} from "lucide-react";
import { WishlistPropertyItem } from "@/components/dashboard/types";
import { GuestDashboardTab } from "./guest_sidebar";

interface GuestSavedPropertiesTabProps {
  savedItems: WishlistPropertyItem[];
  onRemoveItem: (propertyId: string) => void;
  onNavigateTab: (tab: GuestDashboardTab) => void;
}

export function GuestSavedPropertiesTab({
  savedItems,
  onRemoveItem,
  onNavigateTab,
}: GuestSavedPropertiesTabProps) {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#e6e2d8]">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d0a65b] block">
            WISHLIST & BOOKMARKS
          </span>
          <h1 className="font-heading text-2xl sm:text-3xl font-medium text-[#083327] mt-1">
            Saved Properties ({savedItems.length})
          </h1>
          <p className="text-xs sm:text-sm text-[#718078] mt-1 font-sans">
            Review and compare your bookmarked luxury apartments and suites.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab("explore-projects")}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#083327] hover:bg-[#0c4434] text-white text-xs font-semibold uppercase tracking-[0.12em] transition-all shadow-xs shrink-0 self-start sm:self-auto cursor-pointer"
        >
          <Compass className="size-3.5" />
          <span>Explore More Projects</span>
        </button>
      </div>

      {/* Content */}
      {savedItems.length === 0 ? (
        <div className="rounded-[24px] bg-white border border-[#e6e2d8] p-12 sm:p-16 text-center flex flex-col items-center justify-center shadow-2xs">
          <div className="size-16 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-400 mb-4">
            <Heart className="size-8 text-[#d0a65b]" />
          </div>
          <h3 className="font-heading text-xl sm:text-2xl font-medium text-[#083327]">
            Your Wishlist Is Empty
          </h3>
          <p className="text-xs sm:text-sm text-[#718078] mt-2 max-w-md leading-relaxed font-sans">
            You haven&apos;t saved any properties yet. Discover our residential and commercial masterpieces and click the heart icon to save them here.
          </p>
          <button
            type="button"
            onClick={() => onNavigateTab("explore-projects")}
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#083327] hover:bg-[#0c4434] text-white text-xs font-semibold uppercase tracking-[0.14em] transition-all shadow-xs cursor-pointer"
          >
            <span>Explore Projects</span>
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-7">
          {savedItems.map((item) => (
            <article
              key={item.id}
              className="group relative rounded-[22px] bg-white border border-[#e6e2d8] p-4 sm:p-[18px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_45px_rgba(8,51,39,0.1)] hover:border-[#083327]/35 hover:-translate-y-1 transition-all duration-500 ease-out flex flex-col justify-between"
            >
              {/* Image Container */}
              <div className="zoom-frame relative block w-full aspect-[16/10] rounded-[16px] overflow-hidden bg-[#eef1ef]">
                <Image
                  src={item.image || "/image/projects/projectsHero.png"}
                  alt={item.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                />

                {/* Remove from Saved Button (Top-Right) */}
                <button
                  type="button"
                  onClick={() => onRemoveItem(item.propertyId)}
                  title="Remove from saved"
                  aria-label="Remove from saved properties"
                  className="absolute top-3 right-3 z-10 size-8 rounded-full bg-white/90 backdrop-blur-md border border-white/60 text-rose-600 hover:bg-rose-600 hover:text-white flex items-center justify-center transition-all shadow-xs cursor-pointer"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>

              {/* Body */}
              <div className="pt-4 px-1 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-heading text-lg sm:text-xl font-medium text-[#083327] tracking-tight leading-snug line-clamp-1 group-hover:text-[#cfa564] transition-colors duration-300">
                    <Link href={`/projects/${item.slug || item.propertyId}`}>
                      {item.title}
                    </Link>
                  </h3>
                  {item.location && (
                    <div className="flex items-center gap-1.5 text-xs text-[#718078] mt-1.5 font-sans">
                      <MapPin className="size-3.5 text-[#cfa564] shrink-0" />
                      <span className="truncate">{item.location}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-[#f0ebe1] flex items-center justify-between gap-3">
                  <span className="font-heading text-base sm:text-lg font-medium text-[#083327]">
                    {item.price || "Contact for Price"}
                  </span>

                  <Link
                    href={`/projects/${item.slug || item.propertyId}`}
                    className="group/btn inline-flex items-center gap-1.5 py-2 px-4 rounded-full text-xs font-semibold tracking-[0.12em] uppercase text-[#083327] border border-[#083327]/30 hover:bg-[#083327] hover:text-white transition-all duration-300 shadow-2xs"
                  >
                    <span>View Project</span>
                    <ArrowRight className="size-3 transition-transform duration-300 group-hover/btn:translate-x-0.5" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
