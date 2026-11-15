"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  Sparkles,
  Building2,
  ChevronRight,
  ArrowRight,
  ArrowUpRight,
  Search,
  ChevronDown,
  Layers,
  Activity,
  CheckCircle2,
} from "lucide-react";
import { HoverShutter } from "@/components/ui/hover_shutter";
import { ClientFlat, ClientUser } from "./types";
import { API_BASE } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ProgressTabProps {
  myFlats?: ClientFlat[];
  user?: ClientUser | null;
  isLoading?: boolean;
}

interface WorkCategoryProgress {
  structural_work?: string;
  plaster_work?: string;
  brick_work?: string;
  electrical_work?: string;
  plumbing_work?: string;
  tiles_work?: string;
  paint_work?: string;
  [key: string]: string | undefined;
}

interface ApiConstructionProgressItem {
  property_id: number;
  property_name?: string;
  lastUpdatedDate?: string;
  lastMonthTarget?: string;
  lastMonthAchieved?: string;
  totalProgress?: string;
  work_category_progress?: WorkCategoryProgress;
  project_name?: string;
  project_slug?: string;
  project_location?: string;
  project_image?: string;
  overall_progress?: string;
  category?: "ONGOING" | "UPCOMING" | "COMPLETED";
}

interface UserProjectCard {
  id: string | number;
  propertyId: number;
  title: string;
  flatNo?: string;
  location: string;
  image: string;
  image2?: string;
  progress: number;
  currentStage: string;
  handover: string;
  slug: string;
  category: "ONGOING" | "UPCOMING" | "COMPLETED";
  isUserOwned?: boolean;
}

const STAGE_ORDER: { key: string; label: string }[] = [
  { key: "paint_work", label: "Finishing & Handover" },
  { key: "tiles_work", label: "Tiles & Interior" },
  { key: "plumbing_work", label: "Plumbing Work" },
  { key: "electrical_work", label: "Electrical Work" },
  { key: "brick_work", label: "Brick & Plaster" },
  { key: "plaster_work", label: "Brick & Plaster" },
  { key: "structural_work", label: "Structural Work" },
];

const SECONDARY_GALLERY_POOL = [
  "/image/progress/Lobby.png",
  "/image/progress/Gym.png",
  "/image/progress/Mosque.png",
  "/image/progress/parking.png",
  "/image/progress/playground.png",
  "/image/progress/FloorPlan.png",
];

function parsePercentage(val?: string | number): number {
  if (typeof val === "number") return val;
  if (!val) return 0;
  const num = parseFloat(String(val).replace(/%/g, "").trim());
  return isNaN(num) ? 0 : num;
}

function determineStage(workProgress?: WorkCategoryProgress): string {
  if (!workProgress) return "Structural Work";

  for (const stage of STAGE_ORDER) {
    const val = parsePercentage(workProgress[stage.key]);
    if (val > 0) {
      return stage.label;
    }
  }

  return "Site Preparation";
}

function calculateOverallProgress(
  overallStr?: string,
  totalProg?: string,
  workProgress?: WorkCategoryProgress
): number {
  if (overallStr !== undefined && overallStr !== null && overallStr !== "") {
    return Math.round(parsePercentage(overallStr));
  }
  if (totalProg !== undefined && totalProg !== null && totalProg !== "") {
    return Math.round(parsePercentage(totalProg));
  }
  if (workProgress) {
    const values = Object.values(workProgress).map((v) => parsePercentage(v));
    if (values.length > 0) {
      const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
      return Math.round(avg);
    }
  }
  return 0;
}

const TABS = ["MY PROPERTIES", "ALL DEVELOPMENTS"] as const;
type TabType = (typeof TABS)[number];

const STATUS_FILTERS = ["ALL", "ONGOING", "UPCOMING", "COMPLETED"] as const;
type StatusFilterType = (typeof STATUS_FILTERS)[number];

export function ProgressTab({
  myFlats = [],
  user,
  isLoading: isParentLoading = false,
}: ProgressTabProps) {
  const [userCards, setUserCards] = useState<UserProjectCard[]>([]);
  const [allCards, setAllCards] = useState<UserProjectCard[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab & Filters
  const [activeMainTab, setActiveMainTab] = useState<TabType>(
    myFlats && myFlats.length > 0 ? "MY PROPERTIES" : "ALL DEVELOPMENTS"
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<string>("ALL");
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProjectProgressData() {
      try {
        setLoading(true);
        const baseUrl = API_BASE;

        // Fetch constructions projects progress and projects list in parallel
        const [progressRes, projectsRes] = await Promise.allSettled([
          fetch(`${baseUrl}/constructions/projects-progress`, { cache: "no-store" }),
          fetch(`${baseUrl}/projects`, { cache: "no-store" }),
        ]);

        let progressList: ApiConstructionProgressItem[] = [];
        if (progressRes.status === "fulfilled" && progressRes.value.ok) {
          const json = await progressRes.value.json();
          progressList = Array.isArray(json)
            ? json
            : Array.isArray(json?.data)
            ? json.data
            : [];
        }

        // Map project handover dates and slugs from /projects endpoint
        const handoverMap: Record<string, string> = {};
        const slugMap: Record<string, string> = {};
        if (projectsRes.status === "fulfilled" && projectsRes.value.ok) {
          try {
            const pJson = await projectsRes.value.json();
            const pList = Array.isArray(pJson)
              ? pJson
              : pJson?.projects || pJson?.data || [];
            if (Array.isArray(pList)) {
              pList.forEach((proj: any) => {
                if (proj) {
                  const handoverDate =
                    proj.handover ||
                    proj.handover_date ||
                    proj.delivery ||
                    proj.estimated_date ||
                    "";
                  if (proj.id && handoverDate) {
                    handoverMap[String(proj.id)] = handoverDate;
                  }
                  if (proj.slug && handoverDate) {
                    handoverMap[String(proj.slug)] = handoverDate;
                  }
                  if (proj.name && handoverDate) {
                    handoverMap[proj.name.toLowerCase().trim()] = handoverDate;
                  }
                  if (proj.id && proj.slug) {
                    slugMap[String(proj.id)] = proj.slug;
                  }
                }
              });
            }
          } catch (e) {
            console.warn("Could not parse projects handover list:", e);
          }
        }

        // 1. Build all 19 construction project cards
        const allProgressCards: UserProjectCard[] = progressList.map((item, idx) => {
          const pId = item.property_id || idx + 1;
          const name =
            item.project_name || item.property_name || `Project ${pId}`;
          const location =
            item.project_location || "Ashulia Model Town";
          const progressPct = calculateOverallProgress(
            item.overall_progress,
            item.totalProgress,
            item.work_category_progress
          );
          const stage = determineStage(item.work_category_progress);

          let cat: "ONGOING" | "UPCOMING" | "COMPLETED" = "ONGOING";
          if (progressPct >= 100) cat = "COMPLETED";
          else if (progressPct === 0 && stage === "Site Preparation") cat = "UPCOMING";
          else cat = "ONGOING";

          const slug =
            item.project_slug ||
            slugMap[String(pId)] ||
            `project-${pId}`;

          const handover =
            handoverMap[String(pId)] ||
            handoverMap[slug] ||
            handoverMap[name.toLowerCase().trim()] ||
            (item.lastUpdatedDate ? item.lastUpdatedDate : "Dec 2027");

          return {
            id: `all-${pId}-${idx}`,
            propertyId: pId,
            title: name,
            location,
            image:
              item.project_image || "/image/progress/tph_green_valley.png",
            image2: SECONDARY_GALLERY_POOL[idx % SECONDARY_GALLERY_POOL.length],
            progress: progressPct,
            currentStage: stage,
            handover,
            slug,
            category: cat,
            isUserOwned: false,
          };
        });

        // 2. Build user-specific flat cards
        const userFlats = myFlats && myFlats.length > 0 ? myFlats : [];
        const mappedUserCards: UserProjectCard[] = userFlats.map((flat, idx) => {
          const rawPropId = Number(flat.project_id) || 0;
          const flatTitle = (flat.title || "").toLowerCase().trim();
          const flatSlug = flat.slug || "";

          // Match from progressList
          const matchedProgress = progressList.find((p) => {
            if (rawPropId > 0 && p.property_id === rawPropId) return true;
            if (flatSlug && p.project_slug === flatSlug) return true;
            const pName = (p.project_name || p.property_name || "").toLowerCase().trim();
            if (pName && flatTitle && (pName === flatTitle || flatTitle.includes(pName) || pName.includes(flatTitle))) {
              return true;
            }
            return false;
          });

          const progressPct = calculateOverallProgress(
            matchedProgress?.overall_progress,
            matchedProgress?.totalProgress,
            matchedProgress?.work_category_progress
          );

          const stage = determineStage(matchedProgress?.work_category_progress);

          let cat: "ONGOING" | "UPCOMING" | "COMPLETED" = "ONGOING";
          if (progressPct >= 100) cat = "COMPLETED";
          else if (progressPct === 0 && stage === "Site Preparation") cat = "UPCOMING";
          else cat = "ONGOING";

          const resolvedSlug =
            matchedProgress?.project_slug ||
            (rawPropId && slugMap[String(rawPropId)]) ||
            flat.slug ||
            String(rawPropId || idx + 1);

          const resolvedHandover =
            (rawPropId && handoverMap[String(rawPropId)]) ||
            (flatSlug && handoverMap[flatSlug]) ||
            handoverMap[flatTitle] ||
            flat.handover_date ||
            "Dec 2027";

          return {
            id: flat.id || `user-card-${rawPropId || idx}`,
            propertyId: matchedProgress?.property_id || rawPropId,
            title: matchedProgress?.project_name || matchedProgress?.property_name || flat.title,
            flatNo: flat.flatNo,
            location: matchedProgress?.project_location || flat.location || "Ashulia Model Town",
            image:
              matchedProgress?.project_image ||
              flat.image ||
              "/image/progress/tph_green_valley.png",
            image2: SECONDARY_GALLERY_POOL[idx % SECONDARY_GALLERY_POOL.length],
            progress: progressPct,
            currentStage: stage,
            handover: resolvedHandover,
            slug: resolvedSlug,
            category: cat,
            isUserOwned: true,
          };
        });

        if (isMounted) {
          setUserCards(mappedUserCards);
          setAllCards(allProgressCards);
          // Auto switch tab if user has flats
          if (mappedUserCards.length > 0) {
            setActiveMainTab("MY PROPERTIES");
          } else {
            setActiveMainTab("ALL DEVELOPMENTS");
          }
        }
      } catch (err) {
        console.error("Error loading project progress in ProgressTab:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadProjectProgressData();

    return () => {
      isMounted = false;
    };
  }, [myFlats]);

  // Available locations
  const availableLocations = useMemo(() => {
    const activeList = activeMainTab === "MY PROPERTIES" ? userCards : allCards;
    const locs = new Set<string>();
    activeList.forEach((c) => {
      if (c.location) locs.add(c.location.trim());
    });
    return ["ALL", ...Array.from(locs).sort()];
  }, [activeMainTab, userCards, allCards]);

  // Filtered Cards
  const displayedCards = useMemo(() => {
    const list = activeMainTab === "MY PROPERTIES" ? userCards : allCards;

    return list.filter((card) => {
      // Status Filter
      if (statusFilter !== "ALL" && card.category !== statusFilter) {
        return false;
      }
      // Location Filter
      if (
        selectedLocation !== "ALL" &&
        !card.location.toLowerCase().includes(selectedLocation.toLowerCase())
      ) {
        return false;
      }
      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = card.title.toLowerCase().includes(q);
        const matchLoc = card.location.toLowerCase().includes(q);
        const matchStage = card.currentStage.toLowerCase().includes(q);
        const matchFlat = card.flatNo && card.flatNo.toLowerCase().includes(q);
        if (!matchTitle && !matchLoc && !matchStage && !matchFlat) return false;
      }
      return true;
    });
  }, [activeMainTab, userCards, allCards, statusFilter, selectedLocation, searchQuery]);

  // Aggregated Stats
  const activeStats = useMemo(() => {
    const list = userCards.length > 0 ? userCards : allCards;
    const total = list.length;
    const ongoing = list.filter((c) => c.category === "ONGOING").length;
    const completed = list.filter((c) => c.category === "COMPLETED").length;
    const avgProg =
      total > 0
        ? Math.round(list.reduce((sum, c) => sum + c.progress, 0) / total)
        : 0;
    return { total, ongoing, completed, avgProg };
  }, [userCards, allCards]);

  const showLoading = isParentLoading || loading;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1. Luxury Section Header (Matches Frontend Theme) */}
      <div className="rounded-[24px] bg-[#061d16] bg-[radial-gradient(ellipse_100%_80%_at_50%_25%,#092e24_0%,#061d16_70%,#03130f_100%)] p-6 sm:p-8 text-white relative overflow-hidden shadow-sm border border-white/10">
        <div
          className="absolute inset-0 pointer-events-none opacity-25"
          style={{
            backgroundImage:
              "radial-gradient(circle at 70% 30%, rgba(208, 166, 91, 0.15) 0%, transparent 65%)",
          }}
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="max-w-2xl">
            <span className="inline-block font-sans text-xs font-semibold uppercase tracking-[0.2em] text-[#d0a65b] mb-2 sm:mb-3">
              REAL-TIME MILESTONES & MONITORING
            </span>
            <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-normal text-white leading-tight tracking-tight">
              {activeMainTab === "MY PROPERTIES" && userCards.length > 0
                ? "Your Construction Progress"
                : "Building Your Future Step By Step"}
            </h1>
            <p className="font-sans text-xs sm:text-sm text-white/75 mt-2 leading-relaxed">
              Track the engineering milestones, architectural execution, and live site progress from foundation to final handover.
            </p>
          </div>

          {/* Quick Stats Pill Row */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-4 shrink-0">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-white/15 text-center min-w-[90px] sm:min-w-[110px]">
              <span className="block text-[10px] sm:text-[11px] font-medium tracking-[0.14em] uppercase text-white/70">
                Active Sites
              </span>
              <span className="font-heading text-xl sm:text-2xl font-normal text-[#d0a65b] mt-0.5 block">
                {activeStats.ongoing}
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-white/15 text-center min-w-[90px] sm:min-w-[110px]">
              <span className="block text-[10px] sm:text-[11px] font-medium tracking-[0.14em] uppercase text-white/70">
                Avg Progress
              </span>
              <span className="font-heading text-xl sm:text-2xl font-normal text-[#d0a65b] mt-0.5 block">
                {activeStats.avgProg}%
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-white/15 text-center min-w-[90px] sm:min-w-[110px]">
              <span className="block text-[10px] sm:text-[11px] font-medium tracking-[0.14em] uppercase text-white/70">
                Completed
              </span>
              <span className="font-heading text-xl sm:text-2xl font-normal text-emerald-400 mt-0.5 block">
                {activeStats.completed}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Controls & Filter Bar */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Main Tab Toggle (My Properties vs All Developments) */}
          <div className="inline-flex p-1 rounded-full bg-white border border-[#e6e2d8] shadow-2xs self-start">
            <button
              type="button"
              onClick={() => setActiveMainTab("MY PROPERTIES")}
              className={cn(
                "px-4 sm:px-6 py-2 rounded-full text-xs font-semibold tracking-[0.12em] uppercase transition-all duration-300 cursor-pointer flex items-center gap-1.5",
                activeMainTab === "MY PROPERTIES"
                  ? "bg-[#083327] text-white shadow-xs"
                  : "text-[#59657b] hover:text-[#083327]"
              )}
            >
              <span>My Properties</span>
              {userCards.length > 0 && (
                <span className="size-5 rounded-full bg-[#cfa564] text-[#083327] text-[10px] font-bold inline-flex items-center justify-center">
                  {userCards.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveMainTab("ALL DEVELOPMENTS")}
              className={cn(
                "px-4 sm:px-6 py-2 rounded-full text-xs font-semibold tracking-[0.12em] uppercase transition-all duration-300 cursor-pointer flex items-center gap-1.5",
                activeMainTab === "ALL DEVELOPMENTS"
                  ? "bg-[#083327] text-white shadow-xs"
                  : "text-[#59657b] hover:text-[#083327]"
              )}
            >
              <span>All Developments</span>
              <span className="size-5 rounded-full bg-black/5 text-[#59657b] text-[10px] font-bold inline-flex items-center justify-center">
                {allCards.length}
              </span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-[320px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8b9891]" />
            <input
              type="text"
              placeholder="Search by project, unit or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-white border border-[#e6e2d8] rounded-full focus:outline-hidden focus:border-[#083327] focus:ring-1 focus:ring-[#083327] transition-all"
            />
          </div>
        </div>

        {/* Sub-Filters: Status & Location Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Status Badges */}
          <div className="flex flex-wrap items-center gap-2">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-[11px] font-semibold tracking-[0.12em] uppercase transition-all duration-200 cursor-pointer border",
                  statusFilter === s
                    ? "bg-[#083327] border-[#083327] text-white shadow-xs"
                    : "bg-white border-[#e6e2d8] text-[#59657b] hover:border-[#083327]/40 hover:text-[#083327]"
                )}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Location Dropdown */}
          {availableLocations.length > 2 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setLocationDropdownOpen(!locationDropdownOpen)}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#e6e2d8] text-[11px] font-semibold tracking-[0.12em] uppercase text-[#59657b] hover:text-[#083327] transition-all cursor-pointer"
              >
                <MapPin className="size-3 text-[#cfa564]" />
                <span>
                  {selectedLocation === "ALL" ? "All Locations" : selectedLocation}
                </span>
                <ChevronDown className="size-3 text-[#59657b]" />
              </button>

              {locationDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-48 rounded-xl bg-white border border-[#e6e2d8] shadow-lg py-1 z-30">
                  {availableLocations.map((loc) => (
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

      {/* 3. Skeletons Loading State */}
      {showLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-7">
          {[1, 2, 3].map((n) => (
            <div
              key={`progress-card-skeleton-${n}`}
              className="rounded-[22px] bg-white border border-[#e6e2d8] p-4 sm:p-[18px] shadow-xs animate-pulse"
            >
              <div className="w-full aspect-[16/10] rounded-[16px] bg-stone-200" />
              <div className="pt-4 space-y-3 px-1">
                <div className="h-5 bg-stone-200 rounded-md w-3/4" />
                <div className="h-3.5 bg-stone-100 rounded-md w-1/2" />
                <div className="pt-4 border-t border-[#f0ebe1] space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="h-3 bg-stone-200 rounded w-1/3" />
                    <div className="h-6 bg-stone-200 rounded w-12" />
                  </div>
                  <div className="h-2.5 bg-stone-100 rounded-full w-full" />
                </div>
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#f0ebe1]">
                  <div className="h-8 bg-stone-100 rounded" />
                  <div className="h-8 bg-stone-100 rounded" />
                </div>
                <div className="h-11 bg-stone-200 rounded-full mt-4" />
              </div>
            </div>
          ))}
        </div>
      ) : displayedCards.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-[24px] p-10 sm:p-14 border border-[#e6e2d8] text-center flex flex-col items-center justify-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-[#083327]/10 flex items-center justify-center text-[#083327] mb-4">
            <Building2 className="w-8 h-8" />
          </div>
          <h3 className="font-heading text-xl sm:text-2xl font-medium text-[#083327]">
            {activeMainTab === "MY PROPERTIES"
              ? "No Registered Properties Found"
              : "No Developments Matched Your Filter"}
          </h3>
          <p className="text-xs sm:text-sm text-[#718078] mt-2 max-w-md leading-relaxed font-sans">
            {activeMainTab === "MY PROPERTIES"
              ? "You do not have any registered apartments or suites with construction tracking under your account. You can explore all active developments below."
              : "Try adjusting your search query or status filter to see other construction sites."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            {activeMainTab === "MY PROPERTIES" ? (
              <button
                type="button"
                onClick={() => setActiveMainTab("ALL DEVELOPMENTS")}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#083327] hover:bg-[#0c4434] text-white text-xs font-semibold uppercase tracking-[0.14em] transition-all shadow-xs cursor-pointer"
              >
                <span>Browse All Developments</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("ALL");
                  setSelectedLocation("ALL");
                }}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-[#083327] text-[#083327] hover:bg-[#083327] hover:text-white text-xs font-semibold uppercase tracking-[0.14em] transition-all cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      ) : (
        /* 4. Luxury Project Cards Grid (Exact Frontend Alignment) */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-7">
          {displayedCards.map((card) => (
            <article
              key={card.id}
              className="group relative rounded-[22px] bg-white border border-[#e6e2d8] p-4 sm:p-[18px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_45px_rgba(8,51,39,0.1)] hover:border-[#083327]/35 hover:-translate-y-1.5 transition-all duration-500 ease-out flex flex-col justify-between"
            >
              {/* Image Container with HoverShutter effect like Frontend */}
              <Link
                href={`/project-progress/${card.slug || card.propertyId || card.id}`}
                className="zoom-frame relative block w-full aspect-[16/10] rounded-[16px] overflow-hidden bg-[#eef1ef]"
              >
                <div className="absolute inset-0">
                  <Image
                    src={card.image}
                    alt={card.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                </div>

                {/* Shutter Reveal on hover */}
                {card.image2 && (
                  <HoverShutter
                    src={card.image2}
                    armed={true}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                )}

                {/* Top-Left Badges (Status + Flat Unit) */}
                <div className="absolute top-3.5 left-3.5 z-10 flex items-center gap-1.5 flex-wrap">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[rgba(8,51,39,0.78)] backdrop-blur-md border border-white/20 text-white text-[10px] font-medium tracking-[1.4px] uppercase shadow-sm">
                    <span
                      className={cn(
                        "size-1.5 rounded-full shrink-0",
                        card.category === "COMPLETED"
                          ? "bg-emerald-400"
                          : card.category === "UPCOMING"
                            ? "bg-amber-300"
                            : "bg-[#cfa564] animate-pulse"
                      )}
                    />
                    <span className="leading-[1.6]">{card.category}</span>
                  </div>

                  {card.flatNo && (
                    <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md border border-white/50 text-[#083327] text-[10px] font-semibold tracking-wide uppercase shadow-sm">
                      Unit {card.flatNo}
                    </div>
                  )}
                </div>

                {/* Top-Right Quick Action Indicator */}
                <div className="absolute top-3.5 right-3.5 z-10 size-8 rounded-full bg-white/25 backdrop-blur-md border border-white/30 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300 shadow-md">
                  <ArrowUpRight className="size-4 text-white" />
                </div>
              </Link>

              {/* Card Content Body */}
              <div className="pt-4 px-1 flex-1 flex flex-col justify-between">
                {/* Title & Location */}
                <div>
                  <h3 className="font-heading text-xl sm:text-[23px] font-medium text-[#083327] tracking-tight leading-snug line-clamp-1 group-hover:text-[#cfa564] transition-colors duration-300">
                    <Link
                      href={`/project-progress/${card.slug || card.propertyId || card.id}`}
                    >
                      {card.title}
                    </Link>
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-[#718078] mt-1.5 font-sans">
                    <MapPin className="h-3.5 w-3.5 text-[#cfa564] shrink-0" />
                    <span className="truncate">{card.location}</span>
                  </div>
                </div>

                {/* Animated Brand Reveal Line on hover */}
                <div className="mt-4 pt-1 relative">
                  <span className="relative block h-px w-full overflow-hidden bg-[#e8e2d2]">
                    <span className="absolute inset-0 origin-left scale-x-0 bg-[#083327] transition-transform duration-700 ease-out group-hover:scale-x-100" />
                  </span>
                </div>

                {/* Progress Section */}
                <div className="mt-3">
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.16em] uppercase text-[#718078]">
                      <svg
                        className="h-3.5 w-3.5 text-[#cfa564] shrink-0"
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="2 11 6 7 10 11 14 5" />
                        <circle cx="14" cy="5" r="1.2" fill="currentColor" />
                      </svg>
                      <span>PROJECT PROGRESS</span>
                    </div>
                    <span className="font-heading text-2xl sm:text-[28px] font-normal text-[#cfa564] leading-none">
                      {card.progress}%
                    </span>
                  </div>

                  {/* Gold Gradient Progress Bar */}
                  <div
                    role="progressbar"
                    aria-valuenow={card.progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${card.title} progress ${card.progress}%`}
                    className="w-full h-2.5 bg-[#f4ede4] rounded-full overflow-hidden mt-2.5 relative p-0.5"
                  >
                    <div
                      style={{
                        width: `${Math.min(100, Math.max(0, card.progress))}%`,
                      }}
                      className="h-full bg-gradient-to-r from-[#b98e4f] via-[#cfa564] to-[#deb974] rounded-full transition-all duration-1000 ease-out shadow-xs"
                    />
                  </div>
                </div>

                {/* Current Stage & Handover */}
                <div className="grid grid-cols-2 gap-3 mt-4 pt-3.5 border-t border-[#f0ebe1]">
                  <div className="flex flex-col">
                    <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#86958d]">
                      CURRENT STAGE
                    </span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="size-1.5 rounded-full bg-[#cfa564] shrink-0" />
                      <span className="block font-heading text-sm sm:text-[15px] font-medium text-[#083327] truncate">
                        {card.currentStage}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#86958d]">
                      HANDOVER
                    </span>
                    <span className="block font-heading text-sm sm:text-[15px] font-medium text-[#083327] mt-1 truncate">
                      {card.handover}
                    </span>
                  </div>
                </div>

                {/* View Progress Action Button with Sliding Arrow */}
                <div className="mt-5 pt-1">
                  <Link
                    href={`/project-progress/${card.slug || card.propertyId || card.id}`}
                    className="group/btn relative w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-full text-xs font-semibold tracking-[0.14em] uppercase text-[#083327] border border-[#083327]/30 bg-transparent hover:bg-[#083327] hover:text-white hover:border-[#083327] transition-all duration-300 shadow-2xs active:scale-[0.98]"
                  >
                    <span>VIEW PROGRESS</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover/btn:translate-x-1" />
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
