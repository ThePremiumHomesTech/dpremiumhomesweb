"use client";

import React, { useState, useEffect, useMemo, useRef, Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Video,
  Receipt,
  FileText,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  Building2,
  ExternalLink,
  Loader2,
  Maximize2,
  TrendingUp,
  Layers,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { API_BASE } from "@/lib/api";
import {
  fetchUserPaymentInfo,
  resolveDefaultCameraLinks,
  formatTaka,
  parseAmount,
} from "@/lib/client-dashboard";
import { ClientFlat, ClientUser } from "@/components/dashboard/types";
import { Preloader, LoadingScreen } from "@/components/preloader";

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
  overall_progress?: string;
  work_category_progress?: WorkCategoryProgress;
  project_name?: string;
  project_slug?: string;
  project_location?: string;
  project_image?: string;
  cameras?: Array<{
    id: number | string;
    camera_name?: string;
    camera_link: string;
    status?: string;
  }>;
}

function parsePercentage(val?: string | number | null): number {
  if (typeof val === "number") return Math.min(100, Math.max(0, Math.round(val)));
  if (!val) return 0;
  const num = parseFloat(String(val).replace(/%/g, "").trim());
  return isNaN(num) ? 0 : Math.min(100, Math.max(0, Math.round(num)));
}

function normalizeKey(str?: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/^(the\s+)?(premium\s+)?/i, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

function FlatDetailsContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const slugParam = (params?.slug as string) || "";
  const flatNoParam = searchParams.get("flatNo") || "";

  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<ClientUser | null>(null);
  const [flat, setFlat] = useState<ClientFlat | null>(null);
  const [matchedProgress, setMatchedProgress] = useState<ApiConstructionProgressItem | null>(null);
  const [activeCameraIdx, setActiveCameraIdx] = useState<number>(0);

  const videoContainerRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setIsLoading(true);

        // 1. Authenticated User from localStorage
        const storedUser = localStorage.getItem("tphl_user") || localStorage.getItem("user");
        const storedAuthData = localStorage.getItem("tphl_auth_data");
        const storedUserId = localStorage.getItem("tphl_user_id") || localStorage.getItem("user_id");

        let parsedUser: any = null;
        if (storedUser) {
          try {
            parsedUser = JSON.parse(storedUser);
          } catch {}
        } else if (storedAuthData) {
          try {
            const authData = JSON.parse(storedAuthData);
            parsedUser = authData?.user || authData?.data || authData;
          } catch {}
        }

        const effectiveUserId = storedUserId || parsedUser?.id || parsedUser?.user_id;

        if (parsedUser && typeof parsedUser === "object") {
          setUser({
            id: parsedUser.id || effectiveUserId,
            name:
              parsedUser.name ||
              parsedUser.full_name ||
              [parsedUser.first_name, parsedUser.last_name].filter(Boolean).join(" ") ||
              "",
            email: parsedUser.email || "",
            phone: parsedUser.phone || "",
            avatar: parsedUser.avatar || parsedUser.image || "",
          });
        }

        // 2. Fetch User Payment & Flat Info: /user-payment-info/{userId}
        let dynamicFlats: ClientFlat[] = [];
        if (effectiveUserId) {
          const paymentData = await fetchUserPaymentInfo(effectiveUserId);
          if (paymentData) {
            dynamicFlats = paymentData.dynamicFlats || [];
            if (paymentData.clientInfo) {
              setUser((prev) => ({
                ...(prev || {}),
                name: paymentData.clientInfo?.client_name || prev?.name || "",
                phone: paymentData.clientInfo?.phone || prev?.phone || "",
                email: paymentData.clientInfo?.email || prev?.email || "",
              }));
            }
          }
        }

        // 3. Fetch Construction Progress list from /api/constructions/projects-progress
        let progressList: ApiConstructionProgressItem[] = [];
        try {
          const progRes = await fetch(`${API_BASE}/constructions/projects-progress`, {
            cache: "no-store",
            headers: { Accept: "application/json" },
          });
          if (progRes.ok) {
            const progJson = await progRes.json();
            progressList = Array.isArray(progJson)
              ? progJson
              : Array.isArray(progJson?.data)
              ? progJson.data
              : [];
          }
        } catch (e) {
          console.warn("Could not fetch progress list:", e);
        }

        if (!isMounted) return;

        // 4. Match the user's specific Flat
        const normSlug = normalizeKey(slugParam);
        const normFlatNo = normalizeKey(flatNoParam);

        let selectedFlat: ClientFlat | null = null;

        if (dynamicFlats.length > 0) {
          // Exact match by slug AND flatNo
          if (normFlatNo) {
            selectedFlat =
              dynamicFlats.find(
                (f) =>
                  (normalizeKey(f.slug) === normSlug ||
                    normalizeKey(f.title).includes(normSlug) ||
                    normSlug.includes(normalizeKey(f.title))) &&
                  normalizeKey(f.flatNo) === normFlatNo
              ) || null;
          }

          // Match by slug / project title only
          if (!selectedFlat) {
            selectedFlat =
              dynamicFlats.find(
                (f) =>
                  normalizeKey(f.slug) === normSlug ||
                  normalizeKey(f.title).includes(normSlug) ||
                  normSlug.includes(normalizeKey(f.title))
              ) || null;
          }

          // Fallback to first flat
          if (!selectedFlat && dynamicFlats.length > 0) {
            selectedFlat = dynamicFlats[0];
          }
        }

        // If no dynamicFlat, synthesize one from slug & params with fallback links
        if (!selectedFlat) {
          const fallbackMeta = resolveDefaultCameraLinks(slugParam, slugParam);
          selectedFlat = {
            id: `flat-fallback-${slugParam}`,
            title:
              slugParam
                .split("-")
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(" ") || "The Premium Property",
            flatNo: flatNoParam || "8-B",
            flatSize: "1630 sqft",
            location: "Ashulia Model Town, Dhaka",
            image: "/image/progress/tph_green_valley.png",
            status: "Under Construction",
            construction_pct: 0,
            handover_date: "Dec 2028",
            price: "৳ 44,40,000",
            partial_payment: "৳ 17,55,848",
            due_payment: "৳ 26,84,152",
            slug: slugParam,
            videoLink: fallbackMeta.videoLink,
            videoLink2: fallbackMeta.videoLink2,
            moneyReceiptLink: fallbackMeta.moneyReceiptLink,
            purchaseDetailsLink: fallbackMeta.purchaseDetailsLink,
          };
        }

        setFlat(selectedFlat);

        // 5. Match progress data for this project
        const flatTitleNorm = normalizeKey(selectedFlat.title);
        const matched =
          progressList.find((p) => {
            const pSlug = normalizeKey(p.project_slug);
            const pName = normalizeKey(p.project_name || p.property_name);
            const pId = String(p.property_id);
            return (
              pSlug === normSlug ||
              (pName && (pName === flatTitleNorm || pName.includes(flatTitleNorm) || flatTitleNorm.includes(pName))) ||
              (selectedFlat?.project_id && pId === String(selectedFlat.project_id))
            );
          }) || null;

        setMatchedProgress(matched);
      } catch (err) {
        console.error("Error loading flat details:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [slugParam, flatNoParam]);

  // Build Camera List
  const cameraList = useMemo(() => {
    if (!flat) return [];
    const list: Array<{ id: string | number; name: string; url: string }> = [];
    const seenUrls = new Set<string>();

    const addCam = (name: string, url?: string) => {
      if (!url) return;
      const cleanUrl = url.trim();
      if (!cleanUrl || seenUrls.has(cleanUrl)) return;
      seenUrls.add(cleanUrl);
      list.push({ id: `cam-${list.length + 1}`, name, url: cleanUrl });
    };

    // User assigned links from user.json or booking
    const fallbackMeta = resolveDefaultCameraLinks(flat.slug, flat.title);
    const link1 = flat.videoLink || fallbackMeta.videoLink;
    const link2 = flat.videoLink2 || fallbackMeta.videoLink2;

    if (link1) addCam("Camera 1", link1);
    if (link2) addCam("Camera 2", link2);

    // Any cameras from matchedProgress API
    if (Array.isArray(matchedProgress?.cameras)) {
      matchedProgress.cameras.forEach((c, idx) => {
        if (c?.camera_link) {
          addCam(c.camera_name || `Camera ${list.length + 1}`, c.camera_link);
        }
      });
    }

    // Default fallbacks if empty
    if (list.length === 0) {
      addCam("Camera 1", "https://rtsp.me/embed/4BtSR2sB/");
      addCam("Camera 2", "https://rtsp.me/embed/EEKRdE98/");
    }

    return list;
  }, [flat, matchedProgress]);

  const activeCamera = cameraList[activeCameraIdx] || cameraList[0] || null;

  // Milestone Stages
  const stageRows = useMemo(() => {
    const wcp = matchedProgress?.work_category_progress;
    return [
      { label: "Structural Work", pct: parsePercentage(wcp?.structural_work) },
      { label: "Brickwork", pct: parsePercentage(wcp?.brick_work) },
      { label: "Plaster Work", pct: parsePercentage(wcp?.plaster_work) },
      { label: "Electrical", pct: parsePercentage(wcp?.electrical_work) },
      { label: "Plumbing", pct: parsePercentage(wcp?.plumbing_work) },
      { label: "Interior / Tiles", pct: parsePercentage(wcp?.tiles_work) },
      { label: "Finishing / Paint", pct: parsePercentage(wcp?.paint_work) },
    ];
  }, [matchedProgress]);

  // Overall Construction Progress
  const overallProgressPct = useMemo(() => {
    if (matchedProgress?.overall_progress) {
      return parsePercentage(matchedProgress.overall_progress);
    }
    if (matchedProgress?.totalProgress) {
      return parsePercentage(matchedProgress.totalProgress);
    }
    if (flat?.construction_pct) {
      return parsePercentage(flat.construction_pct);
    }
    // Calculate average of stageRows
    const sum = stageRows.reduce((acc, row) => acc + row.pct, 0);
    return Math.round(sum / stageRows.length);
  }, [matchedProgress, flat, stageRows]);

  const toggleFullscreen = () => {
    if (!videoContainerRef.current) return;
    if (!document.fullscreenElement) {
      videoContainerRef.current
        .requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(() => {});
    } else {
      document
        .exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(() => {});
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  const receiptLink =
    flat?.moneyReceiptLink ||
    "https://drive.google.com/drive/folders/1BsUQnHiX-RPLBpcy6Lbc77xWcK4g9P_X?usp=drive_link";
  const purchaseLink =
    flat?.purchaseDetailsLink ||
    "https://docs.google.com/spreadsheets/d/1w44T8yCyybFm1cjRioseVxrs8As7pSgUpyPSZWlsvPk/edit?gid=879783164#gid=879783164";

  const isEmbed = Boolean(
    activeCamera?.url &&
      (activeCamera.url.includes("rtsp.me") ||
        activeCamera.url.includes("/embed/") ||
        activeCamera.url.includes("youtube.com") ||
        activeCamera.url.includes("youtu.be") ||
        activeCamera.url.includes("vimeo.com"))
  );

  return (
    <div className="min-h-screen bg-[#f4f7f6] text-[#1f2723]">
      {/* Top Header Bar */}
      <header className="bg-white border-b border-[#e8ecea] sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Back Button */}
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#054b3c] hover:bg-[#083327] text-white text-xs sm:text-sm font-semibold tracking-wide shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              <span>Back to Dashboard</span>
            </button>

            {/* Breadcrumb Navigation */}
            <div className="hidden md:flex items-center gap-2 text-xs sm:text-sm text-[#546360]">
              <Link href="/dashboard" className="hover:text-[#054b3c] transition-colors">
                Dashboard
              </Link>
              <span>/</span>
              <span className="text-[#1f2723] font-medium truncate max-w-xs">
                {flat?.title}
              </span>
              {flat?.flatNo && (
                <>
                  <span>/</span>
                  <span className="text-[#054b3c] font-semibold bg-[#eaf4f1] px-2 py-0.5 rounded-full text-xs">
                    Unit {flat.flatNo}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
        {/* Project & Unit Hero Banner */}
        <section className="bg-white rounded-[24px] p-6 sm:p-8 border border-[#e6e2d8] shadow-[0_4px_24px_rgba(0,0,0,0.03)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#054b3c]/10 text-[#054b3c] text-xs font-semibold uppercase tracking-wider">
                <span className="size-2 rounded-full bg-[#054b3c] animate-pulse" />
                {flat?.status || "Under Construction"}
              </span>
              {flat?.flatNo && (
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#cfa564]/15 text-[#916a22] text-xs font-bold tracking-wide uppercase">
                  Unit {flat.flatNo}
                </span>
              )}
              {flat?.flatSize && (
                <span className="text-xs text-[#718078] bg-[#f4f7f6] px-3 py-1 rounded-full font-medium">
                  {flat.flatSize}
                </span>
              )}
            </div>

            <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-medium text-[#083327] tracking-tight">
              {flat?.title}
            </h1>

            <div className="flex items-center gap-2 text-xs sm:text-sm text-[#718078]">
              <MapPin className="w-4 h-4 text-[#cfa564] shrink-0" />
              <span>{flat?.location || "Ashulia Model Town, Dhaka"}</span>
            </div>
          </div>

          {/* Quick Financial Highlight Pill */}
          <div className="flex items-center gap-4 bg-[#f8faf9] rounded-2xl p-4 border border-[#e8ecea] w-full md:w-auto justify-between md:justify-end">
            <div>
              <span className="text-[10px] uppercase font-semibold text-[#86958d] tracking-wider block">
                Total Value
              </span>
              <span className="font-heading text-lg sm:text-xl font-bold text-[#083327]">
                {flat?.price || "৳ 44,40,000"}
              </span>
            </div>
            <div className="h-8 w-px bg-[#e0e5e3]" />
            <div>
              <span className="text-[10px] uppercase font-semibold text-[#86958d] tracking-wider block">
                Total Paid
              </span>
              <span className="font-heading text-lg sm:text-xl font-bold text-emerald-700">
                {flat?.partial_payment || "৳ 17,55,848"}
              </span>
            </div>
            <div className="h-8 w-px bg-[#e0e5e3]" />
            <div>
              <span className="text-[10px] uppercase font-semibold text-[#86958d] tracking-wider block">
                Due Balance
              </span>
              <span className="font-heading text-lg sm:text-xl font-bold text-rose-700">
                {flat?.due_payment || "৳ 26,84,152"}
              </span>
            </div>
          </div>
        </section>

        {/* Live Camera Feed & Monitoring */}
        <section className="bg-white rounded-[24px] p-6 sm:p-8 border border-[#e6e2d8] shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#f0f2f1] pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-red-600 animate-pulse" />
                <h2 className="font-heading text-xl sm:text-2xl font-medium text-[#083327]">
                  Live Site Monitoring
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-[#546360] mt-1">
                Real-time high-definition CCTV feed directly from your property site
              </p>
            </div>

            {/* Camera Switcher Buttons (Camera 1 / Camera 2) */}
            {cameraList.length > 1 && (
              <div className="flex items-center gap-2 p-1.5 rounded-full bg-[#f4f7f6] border border-[#e2e8e6] shrink-0">
                {cameraList.map((cam, idx) => (
                  <button
                    key={cam.id}
                    type="button"
                    onClick={() => setActiveCameraIdx(idx)}
                    className={cn(
                      "cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300",
                      activeCameraIdx === idx
                        ? "bg-[#054b3c] text-white shadow-sm"
                        : "text-[#546360] hover:text-[#083327] hover:bg-white"
                    )}
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>{cam.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Video Player Display Container */}
          <div
            ref={videoContainerRef}
            className="relative w-full aspect-[16/9] max-h-[560px] rounded-[20px] overflow-hidden bg-[#111917] shadow-inner group"
          >
            {activeCamera ? (
              <>
                {isEmbed ? (
                  <iframe
                    key={activeCamera.url}
                    src={activeCamera.url}
                    title={`${flat?.title} - ${activeCamera.name}`}
                    className="absolute inset-0 w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    key={activeCamera.url}
                    src={activeCamera.url}
                    playsInline
                    autoPlay
                    controls
                    className="absolute inset-0 w-full h-full object-cover"
                  >
                    Your browser does not support HTML5 video streaming.
                  </video>
                )}

                {/* Live Floating Badge */}
                <div className="absolute top-4 left-4 z-10 flex items-center gap-2 pointer-events-none">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/90 text-white text-xs font-bold tracking-wider uppercase backdrop-blur-md shadow-md animate-pulse">
                    <span className="size-1.5 rounded-full bg-white" />
                    <span>LIVE</span>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-black/60 text-white text-xs font-medium backdrop-blur-md">
                    {activeCamera.name}
                  </div>
                </div>

                {/* Fullscreen Button */}
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="cursor-pointer absolute bottom-4 right-4 z-10 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-all active:scale-95"
                  title="Toggle Fullscreen"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white/70 gap-2">
                <Video className="w-10 h-10 opacity-50" />
                <p className="text-sm">Connecting live site camera feed...</p>
              </div>
            )}
          </div>
          <p className="text-xs text-center text-[#718078]">
            Viewing real-time broadcast stream from {activeCamera?.name || "Site Camera"}.
          </p>
        </section>

        {/* Real-time Construction Progress Section */}
        <section className="bg-white rounded-[24px] p-6 sm:p-8 border border-[#e6e2d8] shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#f0f2f1] pb-5">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#cfa564]" />
                <h2 className="font-heading text-xl sm:text-2xl font-medium text-[#083327]">
                  Construction Stage Breakdown
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-[#546360] mt-1">
                Verified milestone completion tracking for {flat?.title}
              </p>
            </div>

            {matchedProgress?.lastUpdatedDate ? (
              <span className="text-xs text-[#718078] bg-[#f4f7f6] px-3 py-1.5 rounded-full font-medium">
                Last Updated: {matchedProgress.lastUpdatedDate}
              </span>
            ) : (
              <span className="text-xs text-amber-800 bg-amber-50 px-3 py-1.5 rounded-full font-medium border border-amber-200">
                Awaiting Next Milestone Update
              </span>
            )}
          </div>

          {/* Overall Progress Bar */}
          <div className="bg-[#f8faf9] rounded-2xl p-5 border border-[#e8ecea] space-y-2">
            <div className="flex items-baseline justify-between text-xs sm:text-sm">
              <span className="font-semibold text-[#083327] tracking-wider uppercase text-xs">
                Overall Project Progress
              </span>
              <span className="font-heading text-xl sm:text-2xl font-bold text-[#cfa564]">
                {overallProgressPct}%
              </span>
            </div>
            <div className="w-full h-3 bg-[#e8ecea] rounded-full overflow-hidden p-0.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${overallProgressPct}%` }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                className="h-full bg-gradient-to-r from-[#b98e4f] via-[#cfa564] to-[#deb974] rounded-full shadow-xs"
              />
            </div>
          </div>

          {/* Stage Progress Rows */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {stageRows.map((stage, idx) => (
              <div
                key={stage.label}
                className="p-4 rounded-xl bg-[#fafcfb] border border-[#edf1f0] flex flex-col justify-between gap-2.5"
              >
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-medium text-[#232f43]">{stage.label}</span>
                  <span className="font-semibold text-[#054b3c]">{stage.pct}%</span>
                </div>
                <div className="w-full h-2 bg-[#e8ecea] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stage.pct}%` }}
                    transition={{
                      duration: 0.9,
                      delay: 0.1 + idx * 0.05,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="h-full bg-[#054b3c] rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Documents & Official Agreements */}
        <section className="space-y-4">
          <h2 className="font-heading text-xl sm:text-2xl font-medium text-[#083327]">
            Official Documents & Agreements
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Money Receipt Card */}
            <div className="bg-white rounded-[22px] p-6 sm:p-7 border border-[#e6e2d8] shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-lg transition-all flex flex-col justify-between gap-5 group">
              <div className="space-y-3">
                <div className="size-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Receipt className="w-6 h-6" />
                </div>
                <h3 className="font-heading text-lg font-medium text-[#083327]">
                  Money Receipt
                </h3>
                <p className="text-xs sm:text-sm text-[#546360] leading-relaxed">
                  Download your official signed payment receipts and installment transaction statements.
                </p>
              </div>
              <button
                type="button"
                onClick={() => window.open(receiptLink, "_blank")}
                className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold tracking-wide transition-all shadow-xs active:scale-95"
              >
                <span>View Receipt</span>
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>

            {/* Total Expenditure Card */}
            <div className="bg-white rounded-[22px] p-6 sm:p-7 border border-[#e6e2d8] shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-lg transition-all flex flex-col justify-between gap-5 group">
              <div className="space-y-3">
                <div className="size-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="font-heading text-lg font-medium text-[#083327]">
                  Total Expenditure
                </h3>
                <p className="text-xs sm:text-sm text-[#546360] leading-relaxed">
                  View complete property purchase ledger, land share contracts, and breakdown documents.
                </p>
              </div>
              <button
                type="button"
                onClick={() => window.open(purchaseLink, "_blank")}
                className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[#054b3c] hover:bg-[#083327] text-white text-xs sm:text-sm font-semibold tracking-wide transition-all shadow-xs active:scale-95"
              >
                <span>View Details</span>
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>

            {/* Handover Target Card */}
            <div className="bg-white rounded-[22px] p-6 sm:p-7 border border-[#e6e2d8] shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-lg transition-all flex flex-col justify-between gap-5 group">
              <div className="space-y-3">
                <div className="size-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="font-heading text-lg font-medium text-[#083327]">
                  Handover Target
                </h3>
                <p className="text-xs sm:text-sm text-[#546360] leading-relaxed">
                  Anticipated physical handover timeline for your flat unit.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#faf7f0] border border-[#f0e8d5] text-center">
                <span className="text-[10px] uppercase font-semibold text-[#8a7238] tracking-wider block">
                  Estimated Handover
                </span>
                <span className="font-heading text-lg sm:text-xl font-bold text-[#684f18]">
                  {flat?.handover_date || "Dec 2028"}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Owner Information */}
        <section className="bg-white rounded-[24px] p-6 sm:p-8 border border-[#e6e2d8] shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-6">
          <div className="border-b border-[#f0f2f1] pb-4">
            <h2 className="font-heading text-xl sm:text-2xl font-medium text-[#083327]">
              Registered Owner Information
            </h2>
            <p className="text-xs sm:text-sm text-[#546360] mt-1">
              Primary booking and legal ownership contact details
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-[#f8faf9] border border-[#edf1f0]">
              <div className="size-11 rounded-xl bg-white border border-[#e2e8e6] flex items-center justify-center text-[#054b3c] shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] uppercase font-semibold text-[#718078] tracking-wider">
                  Owner Name
                </p>
                <p className="text-sm sm:text-base font-semibold text-[#083327] truncate">
                  {user?.name || "Md Shahin Alam"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-[#f8faf9] border border-[#edf1f0]">
              <div className="size-11 rounded-xl bg-white border border-[#e2e8e6] flex items-center justify-center text-[#054b3c] shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] uppercase font-semibold text-[#718078] tracking-wider">
                  Phone Number
                </p>
                <p className="text-sm sm:text-base font-semibold text-[#083327] truncate">
                  {user?.phone || "+880 1712-000000"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-[#f8faf9] border border-[#edf1f0]">
              <div className="size-11 rounded-xl bg-white border border-[#e2e8e6] flex items-center justify-center text-[#054b3c] shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] uppercase font-semibold text-[#718078] tracking-wider">
                  Email Address
                </p>
                <p className="text-sm sm:text-base font-semibold text-[#083327] truncate">
                  {user?.email || "tphr8b@dpremiumhomes.com"}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function FlatDetailsPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Preloader />
      <FlatDetailsContent />
    </Suspense>
  );
}
