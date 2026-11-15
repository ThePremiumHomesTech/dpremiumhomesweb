"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  Heart,
  Building2,
  UserCheck,
  Compass,
  ArrowRight,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { ClientUser, WishlistPropertyItem } from "@/components/dashboard/types";
import { GuestDashboardTab } from "./guest_sidebar";

interface GuestOverviewTabProps {
  user: ClientUser | null;
  savedItems: WishlistPropertyItem[];
  totalOngoingProjects: number;
  onNavigateTab: (tab: GuestDashboardTab) => void;
  onOpenConsultationModal?: () => void;
}

export function GuestOverviewTab({
  user,
  savedItems,
  totalOngoingProjects,
  onNavigateTab,
  onOpenConsultationModal,
}: GuestOverviewTabProps) {
  const displayName = user?.name || user?.full_name || "Guest Member";

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1. Hero Welcome Banner (Matches New Website Aesthetic) */}
      <div className="rounded-[24px] bg-[#061d16] bg-[radial-gradient(ellipse_100%_80%_at_50%_25%,#092e24_0%,#061d16_70%,#03130f_100%)] p-6 sm:p-8 text-white relative overflow-hidden shadow-sm border border-white/10">
        <div
          className="absolute inset-0 pointer-events-none opacity-25"
          style={{
            backgroundImage:
              "radial-gradient(circle at 75% 30%, rgba(208, 166, 91, 0.18) 0%, transparent 65%)",
          }}
        />

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[#d0a65b] text-[11px] font-semibold tracking-[0.16em] uppercase">
            <Sparkles className="size-3 text-[#d0a65b]" />
            <span>Registered Member</span>
          </div>

          <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-normal text-white leading-tight tracking-tight">
            Welcome, {displayName}!
          </h1>

          <p className="font-sans text-xs sm:text-sm text-white/80 leading-relaxed max-w-2xl">
            Browse our exclusive residential & commercial architectural masterpieces, save your dream flats, or get personalized advice from our property specialists.
          </p>
        </div>
      </div>

      {/* 2. "Become an Onboarded Client" Notice Card */}
      <div className="rounded-[22px] bg-[#fdfaf3] border border-[#d0a65b]/35 p-5 sm:p-6 shadow-2xs relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4 max-w-2xl">
          <div className="size-10 rounded-2xl bg-[#083327] text-[#d0a65b] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
            <Compass className="size-5" />
          </div>
          <div>
            <h2 className="font-heading text-base sm:text-lg font-medium text-[#083327]">
              Become an Onboarded Client
            </h2>
            <p className="text-xs sm:text-sm text-[#718078] mt-1 leading-relaxed font-sans">
              Once you book or purchase a flat with The Premium Homes Ltd., your account is upgraded to our full Client Portal. This unlocks live 24/7 site CCTV monitoring, construction progress timelines, and payment schedule records.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab("explore-projects")}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#083327] hover:bg-[#0c4434] text-white text-xs font-semibold uppercase tracking-[0.12em] transition-all shrink-0 cursor-pointer self-start md:self-auto shadow-xs active:scale-[0.98]"
        >
          <span>Explore Developments</span>
          <ArrowRight className="size-3.5" />
        </button>
      </div>

      {/* 3. Three Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {/* Saved Properties */}
        <div
          onClick={() => onNavigateTab("saved-properties")}
          className="group rounded-[22px] bg-white border border-[#e6e2d8] p-5 sm:p-6 shadow-2xs hover:shadow-md hover:border-[#083327]/30 transition-all duration-300 flex items-center justify-between cursor-pointer"
        >
          <div>
            <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#718078]">
              Saved Properties
            </span>
            <span className="font-heading text-3xl sm:text-4xl font-normal text-[#083327] mt-1 block group-hover:text-[#cfa564] transition-colors">
              {savedItems.length}
            </span>
          </div>
          <div className="size-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Heart className="size-5" />
          </div>
        </div>

        {/* Ongoing Projects */}
        <div
          onClick={() => onNavigateTab("explore-projects")}
          className="group rounded-[22px] bg-white border border-[#e6e2d8] p-5 sm:p-6 shadow-2xs hover:shadow-md hover:border-[#083327]/30 transition-all duration-300 flex items-center justify-between cursor-pointer"
        >
          <div>
            <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#718078]">
              Ongoing Projects
            </span>
            <span className="font-heading text-3xl sm:text-4xl font-normal text-[#083327] mt-1 block group-hover:text-[#cfa564] transition-colors">
              {totalOngoingProjects > 0 ? totalOngoingProjects : 58}
            </span>
          </div>
          <div className="size-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Building2 className="size-5" />
          </div>
        </div>

        {/* Account Status */}
        <div className="rounded-[22px] bg-white border border-[#e6e2d8] p-5 sm:p-6 shadow-2xs flex items-center justify-between">
          <div>
            <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#718078]">
              Account Status
            </span>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-heading text-lg sm:text-xl font-medium text-emerald-800">
                Active Member
              </span>
            </div>
          </div>
          <div className="size-12 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
            <UserCheck className="size-5" />
          </div>
        </div>
      </div>

      {/* 4. Two Quick Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* Browse Projects */}
        <div
          onClick={() => onNavigateTab("explore-projects")}
          className="group rounded-[22px] bg-white border border-[#e6e2d8] p-5 sm:p-6 shadow-2xs hover:shadow-md hover:border-[#083327]/30 transition-all duration-300 flex items-center justify-between cursor-pointer"
        >
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading text-lg sm:text-xl font-medium text-[#083327] group-hover:text-[#cfa564] transition-colors">
                Browse Projects
              </h3>
              <ArrowRight className="size-4 text-[#083327] transition-transform duration-300 group-hover:translate-x-1" />
            </div>
            <p className="text-xs text-[#718078] mt-1 font-sans">
              Discover luxury residential & commercial complexes
            </p>
          </div>
          <div className="size-10 rounded-xl bg-stone-100 text-[#083327] flex items-center justify-center shrink-0">
            <Building2 className="size-5" />
          </div>
        </div>

        {/* Support & Consultation */}
        <div
          onClick={() => onNavigateTab("support")}
          className="group rounded-[22px] bg-white border border-[#e6e2d8] p-5 sm:p-6 shadow-2xs hover:shadow-md hover:border-[#083327]/30 transition-all duration-300 flex items-center justify-between cursor-pointer"
        >
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading text-lg sm:text-xl font-medium text-[#083327] group-hover:text-[#cfa564] transition-colors">
                Book a Consultation
              </h3>
              <ArrowRight className="size-4 text-[#083327] transition-transform duration-300 group-hover:translate-x-1" />
            </div>
            <p className="text-xs text-[#718078] mt-1 font-sans">
              Connect with property specialists for in-person advisory
            </p>
          </div>
          <div className="size-10 rounded-xl bg-stone-100 text-[#083327] flex items-center justify-center shrink-0">
            <Sparkles className="size-5 text-[#cfa564]" />
          </div>
        </div>
      </div>

      {/* 5. Saved Properties Preview Section */}
      <div className="rounded-[24px] bg-white border border-[#e6e2d8] p-6 sm:p-8 shadow-2xs space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="size-5 text-[#cfa564]" />
            <h2 className="font-heading text-xl sm:text-2xl font-medium text-[#083327]">
              Saved Properties
            </h2>
          </div>

          {savedItems.length > 0 && (
            <button
              type="button"
              onClick={() => onNavigateTab("saved-properties")}
              className="text-xs font-semibold uppercase tracking-[0.14em] text-[#083327] hover:text-[#cfa564] transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              <span>View All ({savedItems.length})</span>
              <ArrowRight className="size-3.5" />
            </button>
          )}
        </div>

        {savedItems.length === 0 ? (
          /* Empty State */
          <div className="py-10 sm:py-12 flex flex-col items-center justify-center text-center">
            <div className="size-14 rounded-full bg-stone-50 border border-stone-200/80 flex items-center justify-center text-stone-300 mb-3">
              <Heart className="size-7" />
            </div>
            <h4 className="font-heading text-lg font-medium text-[#083327]">
              No saved properties yet
            </h4>
            <p className="text-xs sm:text-sm text-[#718078] mt-1 max-w-sm font-sans">
              Click the heart icon on any property in the Explore Projects tab to save it here for quick review.
            </p>
            <button
              type="button"
              onClick={() => onNavigateTab("explore-projects")}
              className="mt-5 inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#083327] hover:bg-[#0c4434] text-white text-xs font-semibold uppercase tracking-[0.12em] transition-all shadow-xs cursor-pointer"
            >
              <span>Explore Projects</span>
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        ) : (
          /* Grid of Saved Properties (Preview up to 3) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedItems.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="group rounded-[20px] bg-white border border-[#e6e2d8] p-3.5 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between"
              >
                <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-stone-100">
                  <Image
                    src={item.image || "/image/projects/projectsHero.png"}
                    alt={item.title}
                    fill
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                <div className="pt-3 flex flex-col justify-between flex-1">
                  <div>
                    <h4 className="font-heading text-base font-medium text-[#083327] line-clamp-1 group-hover:text-[#cfa564] transition-colors">
                      {item.title}
                    </h4>
                    {item.location && (
                      <div className="flex items-center gap-1 text-xs text-[#718078] mt-1 font-sans">
                        <MapPin className="size-3 text-[#cfa564] shrink-0" />
                        <span className="truncate">{item.location}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#f0ebe1] flex items-center justify-between">
                    <span className="font-heading text-sm font-medium text-[#083327]">
                      {item.price || "Contact for Price"}
                    </span>
                    <Link
                      href={`/projects/${item.slug || item.propertyId}`}
                      className="text-xs font-semibold uppercase tracking-wider text-[#083327] hover:text-[#cfa564] inline-flex items-center gap-1 transition-colors"
                    >
                      <span>Explore</span>
                      <ArrowRight className="size-3" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
