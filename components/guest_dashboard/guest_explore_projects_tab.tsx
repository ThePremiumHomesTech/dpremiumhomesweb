"use client";

import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  Search,
  ArrowRight,
  ArrowUpRight,
  Heart,
  Building2,
  ChevronDown,
} from "lucide-react";
import { HoverShutter } from "@/components/ui/hover_shutter";
import { cn } from "@/lib/utils";
import { API_BASE } from "@/lib/api";
import { toast } from "sonner";

export interface ProjectCardItem {
  id: number | string;
  name: string;
  slug: string;
  location: string;
  image: string;
  image2?: string;
  price?: string;
  status?: string;
  category?: "ONGOING" | "UPCOMING" | "COMPLETED";
}

interface GuestExploreProjectsTabProps {
  savedIds: Set<string>;
  onToggleSave: (project: ProjectCardItem) => void;
  externalSearchQuery?: string;
}

const SECONDARY_IMAGE_POOL = [
  "/image/progress/Lobby.png",
  "/image/progress/Gym.png",
  "/image/progress/Mosque.png",
  "/image/progress/parking.png",
  "/image/progress/playground.png",
  "/image/progress/FloorPlan.png",
];

const TABS = ["ALL", "ONGOING", "UPCOMING", "COMPLETED"] as const;
type TabType = (typeof TABS)[number];

export function GuestExploreProjectsTab({
  savedIds,
  onToggleSave,
  externalSearchQuery = "",
}: GuestExploreProjectsTabProps) {
  const [projects, setProjects] = useState<ProjectCardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("ALL");
  const [searchQuery, setSearchQuery] = useState(externalSearchQuery);
  const [selectedLocation, setSelectedLocation] = useState<string>("ALL");
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);

  useEffect(() => {
    if (externalSearchQuery !== undefined) {
      setSearchQuery(externalSearchQuery);
    }
  }, [externalSearchQuery]);

  useEffect(() => {
    let isMounted = true;

    async function loadProjects() {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/projects`, { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          const list = Array.isArray(json)
            ? json
            : json?.projects || json?.data || [];

          if (Array.isArray(list) && isMounted) {
            const mapped: ProjectCardItem[] = list.map((item: any, idx: number) => {
              let img = item.image || item.featured_image || "";
              if (img && !img.startsWith("http")) {
                img = `https://thepremiumhomesltd.com/TPHL-ERP/public/uploads/projects/${img.replace(/^\/+/, "")}`;
              }
              if (!img) img = "/image/projects/projectsHero.png";

              const rawStatus = (item.status || item.project_sale_status || "").toLowerCase();
              let cat: "ONGOING" | "UPCOMING" | "COMPLETED" = "ONGOING";
              if (rawStatus.includes("complete")) cat = "COMPLETED";
              else if (rawStatus.includes("upcoming")) cat = "UPCOMING";
              else cat = "ONGOING";

              const loc =
                (typeof item.location === "string" && item.location.trim()) ||
                (typeof item.project_map_location === "string" && item.project_map_location.trim()) ||
                (typeof item.community?.name === "string" && item.community.name.trim()) ||
                "Ashulia Model Town";

              const price = item.price || item.price_range || "Contact for Price";
              const slug = item.slug || String(item.id || idx + 1);

              return {
                id: item.id || idx + 1,
                name: item.name || item.title || `Project ${item.id}`,
                slug,
                location: loc,
                image: img,
                image2: SECONDARY_IMAGE_POOL[idx % SECONDARY_IMAGE_POOL.length],
                price,
                status: item.status || "Ongoing",
                category: cat,
              };
            });

            setProjects(mapped);
          }
        }
      } catch (err) {
        console.error("Error loading projects in GuestExploreProjectsTab:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadProjects();

    return () => {
      isMounted = false;
    };
  }, []);

  // Locations list
  const locations = useMemo(() => {
    const locSet = new Set<string>();
    projects.forEach((p) => {
      if (p.location) locSet.add(p.location.trim());
    });
    return ["ALL", ...Array.from(locSet).sort()];
  }, [projects]);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (activeTab !== "ALL" && p.category !== activeTab) return false;
      if (
        selectedLocation !== "ALL" &&
        !p.location.toLowerCase().includes(selectedLocation.toLowerCase())
      ) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = p.name.toLowerCase().includes(q);
        const matchLoc = p.location.toLowerCase().includes(q);
        if (!matchName && !matchLoc) return false;
      }
      return true;
    });
  }, [projects, activeTab, selectedLocation, searchQuery]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-[#e6e2d8]">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d0a65b] block">
            PREMIER PORTFOLIO
          </span>
          <h1 className="font-heading text-2xl sm:text-3xl font-medium text-[#083327] mt-1">
            Ongoing & Upcoming Projects
          </h1>
          <p className="text-xs sm:text-sm text-[#718078] mt-1 font-sans">
            Explore our portfolio of premier commercial & residential buildings.
          </p>
        </div>

        {/* Counter Badge */}
        <div className="text-xs font-semibold uppercase tracking-wider text-[#718078]">
          {filteredProjects.length} Projects Available
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-full bg-white border border-[#e6e2d8] shadow-2xs self-start">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-3.5 sm:px-4 py-1.5 rounded-full text-[11px] font-semibold tracking-[0.12em] uppercase transition-all duration-300 cursor-pointer",
                activeTab === tab
                  ? "bg-[#083327] text-white shadow-xs"
                  : "text-[#59657b] hover:text-[#083327]"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search & Location Filter */}
        <div className="flex items-center gap-2.5">
          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-[#8b9891]" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-white border border-[#e6e2d8] rounded-full focus:outline-hidden focus:border-[#083327] transition-all"
            />
          </div>

          {/* Location Dropdown */}
          {locations.length > 2 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setLocationDropdownOpen(!locationDropdownOpen)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-[#e6e2d8] text-[11px] font-semibold tracking-[0.12em] uppercase text-[#59657b] hover:text-[#083327] transition-all cursor-pointer whitespace-nowrap"
              >
                <MapPin className="size-3 text-[#cfa564]" />
                <span className="truncate max-w-[120px]">
                  {selectedLocation === "ALL" ? "Location" : selectedLocation}
                </span>
                <ChevronDown className="size-3" />
              </button>

              {locationDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-48 rounded-xl bg-white border border-[#e6e2d8] shadow-lg py-1 z-30">
                  {locations.map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => {
                        setSelectedLocation(loc);
                        setLocationDropdownOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-3.5 py-2 text-xs font-medium transition-colors cursor-pointer",
                        selectedLocation === loc
                          ? "bg-[#083327]/10 text-[#083327] font-semibold"
                          : "text-[#59657b] hover:bg-stone-50"
                      )}
                    >
                      {loc === "ALL" ? "All Locations" : loc}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-7">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={`skeleton-proj-${n}`}
              className="rounded-[22px] bg-white border border-[#e6e2d8] p-4 sm:p-[18px] animate-pulse space-y-4"
            >
              <div className="w-full aspect-[16/10] rounded-[16px] bg-stone-200" />
              <div className="h-5 bg-stone-200 rounded w-3/4" />
              <div className="h-3 bg-stone-100 rounded w-1/2" />
              <div className="pt-3 border-t border-[#f0ebe1] flex justify-between items-center">
                <div className="h-4 bg-stone-200 rounded w-1/3" />
                <div className="h-8 bg-stone-200 rounded-full w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="rounded-[24px] bg-white border border-[#e6e2d8] p-12 text-center flex flex-col items-center justify-center">
          <Building2 className="size-10 text-stone-300 mb-2" />
          <h3 className="font-heading text-lg font-medium text-[#083327]">
            No projects found
          </h3>
          <p className="text-xs text-[#718078] mt-1 font-sans">
            Try resetting your search query or location filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-7">
          {filteredProjects.map((project) => {
            const isSaved = savedIds.has(String(project.id));

            return (
              <article
                key={project.id}
                className="group relative rounded-[22px] bg-white border border-[#e6e2d8] p-4 sm:p-[18px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_45px_rgba(8,51,39,0.1)] hover:border-[#083327]/35 hover:-translate-y-1.5 transition-all duration-500 ease-out flex flex-col justify-between"
              >
                {/* Image Container with Shutter Effect */}
                <Link
                  href={`/projects/${project.slug}`}
                  className="zoom-frame relative block w-full aspect-[16/10] rounded-[16px] overflow-hidden bg-[#eef1ef]"
                >
                  <div className="absolute inset-0">
                    <Image
                      src={project.image}
                      alt={project.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                  </div>

                  {project.image2 && (
                    <HoverShutter
                      src={project.image2}
                      armed={true}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  )}

                  {/* Status Badge (Top-Left) */}
                  <div className="absolute top-3.5 left-3.5 z-10 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[rgba(8,51,39,0.78)] backdrop-blur-md border border-white/20 text-white text-[10px] font-medium tracking-[1.4px] uppercase shadow-sm">
                    <span
                      className={cn(
                        "size-1.5 rounded-full shrink-0",
                        project.category === "COMPLETED"
                          ? "bg-emerald-400"
                          : project.category === "UPCOMING"
                            ? "bg-amber-300"
                            : "bg-[#cfa564] animate-pulse"
                      )}
                    />
                    <span className="leading-[1.6]">{project.category}</span>
                  </div>

                  {/* Save to Wishlist Heart Button (Top-Right) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onToggleSave(project);
                    }}
                    aria-label={isSaved ? "Remove from wishlist" : "Save property"}
                    className={cn(
                      "absolute top-3.5 right-3.5 z-10 size-8 rounded-full backdrop-blur-md border flex items-center justify-center transition-all duration-300 shadow-md cursor-pointer",
                      isSaved
                        ? "bg-white text-rose-500 border-rose-200"
                        : "bg-white/80 text-[#083327] border-white/50 hover:bg-white hover:text-rose-500"
                    )}
                  >
                    <Heart
                      className={cn("size-4", isSaved && "fill-rose-500")}
                    />
                  </button>
                </Link>

                {/* Body */}
                <div className="pt-4 px-1 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-heading text-xl sm:text-[22px] font-medium text-[#083327] tracking-tight leading-snug line-clamp-1 group-hover:text-[#cfa564] transition-colors duration-300">
                      <Link href={`/projects/${project.slug}`}>
                        {project.name}
                      </Link>
                    </h3>

                    <div className="flex items-center gap-1.5 text-xs text-[#718078] mt-1.5 font-sans">
                      <MapPin className="size-3.5 text-[#cfa564] shrink-0" />
                      <span className="truncate">{project.location}</span>
                    </div>
                  </div>

                  {/* Animated Brand Reveal Line on hover */}
                  <div className="mt-4 pt-1 relative">
                    <span className="relative block h-px w-full overflow-hidden bg-[#e8e2d2]">
                      <span className="absolute inset-0 origin-left scale-x-0 bg-[#083327] transition-transform duration-700 ease-out group-hover:scale-x-100" />
                    </span>
                  </div>

                  {/* Price & Action Button */}
                  <div className="mt-4 pt-3 flex items-center justify-between gap-3">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#86958d]">
                        Starting Price
                      </span>
                      <span className="font-heading text-base sm:text-lg font-medium text-[#083327] mt-0.5 truncate">
                        {project.price}
                      </span>
                    </div>

                    <Link
                      href={`/projects/${project.slug}`}
                      className="group/btn inline-flex items-center gap-1.5 py-2.5 px-4 rounded-full text-xs font-semibold tracking-[0.14em] uppercase text-[#083327] border border-[#083327]/30 hover:bg-[#083327] hover:text-white transition-all duration-300 shadow-2xs active:scale-[0.98]"
                    >
                      <span>Explore</span>
                      <ArrowRight className="size-3.5 transition-transform duration-300 group-hover/btn:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
