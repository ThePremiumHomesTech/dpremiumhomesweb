"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import {
  Vote,
  CheckCircle2,
  Clock,
  Calendar,
  Building2,
  Globe2,
  Users,
  ChevronRight,
  RefreshCw,
  Sparkles,
  AlertCircle,
  HelpCircle,
  ArrowRight,
} from "lucide-react";
import { ClientUser, ClientFlat } from "./types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface PollOption {
  id: number;
  poll_id: number;
  option_text: string;
  image?: string | null;
  image_url?: string | null;
  sort_order?: number;
  is_user_choice?: boolean;
  votes_count?: number;
  percentage?: number;
}

export interface PollItem {
  id: number;
  project_id: number | null;
  project_name?: string | null;
  title: string;
  description?: string | null;
  image?: string | null;
  image_url?: string | null;
  poll_type: "single_choice" | "multiple_choice" | string;
  status: "active" | "closed" | "draft" | string;
  start_date?: string | null;
  end_date?: string | null;
  created_at?: string | null;
  has_voted: boolean;
  user_voted_option_id?: number | null;
  is_expired?: boolean;
  total_votes?: number;
  options: PollOption[];
}

interface PollsTabProps {
  user: ClientUser | null;
  myFlats?: ClientFlat[];
  isLoading?: boolean;
}

type TopicFilter = "all" | "common" | "my-projects" | number;
type StatusFilter = "all" | "active" | "closed";

const ERP_API_BASE = "https://thepremiumhomesltd.com/TPHL-ERP";

function getAbsoluteImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) return `https://thepremiumhomesltd.com${url}`;
  return `https://thepremiumhomesltd.com/TPHL-ERP/${url.replace(/^\/+/, "")}`;
}

export function PollsTab({ user, myFlats = [] }: PollsTabProps) {
  const [polls, setPolls] = useState<PollItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedTopic, setSelectedTopic] = useState<TopicFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Voting interaction state
  const [selectedOptions, setSelectedOptions] = useState<Record<number, number>>({});
  const [submittingPollId, setSubmittingPollId] = useState<number | null>(null);
  const [changingVotePollIds, setChangingVotePollIds] = useState<Set<number>>(new Set());
  const [remarks, setRemarks] = useState<Record<number, string>>({});

  const effectiveUserId = user?.id || 1;

  // Extract set of user's booked project IDs
  const userProjectIds = useMemo(() => {
    const s = new Set<number>();
    myFlats.forEach((flat) => {
      if (flat.project_id) {
        const num = Number(flat.project_id);
        if (!isNaN(num)) s.add(num);
      }
    });
    return s;
  }, [myFlats]);

  // Load polls from live ERP API
  const fetchPolls = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${ERP_API_BASE}/api/polls?client_id=${effectiveUserId}&is_admin=1`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to fetch polls");

      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setPolls(json.data);

        // Prepopulate selected option if already voted
        const preSelected: Record<number, number> = {};
        json.data.forEach((p: PollItem) => {
          if (p.has_voted && p.user_voted_option_id) {
            preSelected[p.id] = p.user_voted_option_id;
          }
        });
        setSelectedOptions((prev) => ({ ...preSelected, ...prev }));
      } else {
        setPolls([]);
      }
    } catch (err: any) {
      console.error("Error loading polls:", err);
      setError("Unable to load polls. Please try refreshing.");
    } finally {
      setLoading(false);
    }
  }, [effectiveUserId]);

  useEffect(() => {
    fetchPolls();
  }, [fetchPolls]);

  // Cast or change vote
  const handleVote = async (pollId: number) => {
    const optionId = selectedOptions[pollId];
    if (!optionId) {
      toast.error("Please select an option before voting.");
      return;
    }

    try {
      setSubmittingPollId(pollId);
      const res = await fetch(`${ERP_API_BASE}/api/polls/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          poll_id: pollId,
          option_id: optionId,
          client_id: effectiveUserId,
          remarks: remarks[pollId] || "",
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        toast.success(json.message || "Your vote has been recorded successfully!");
        // Update local poll with returned stats
        setPolls((prev) =>
          prev.map((p) => (p.id === pollId ? { ...p, ...json.data, has_voted: true } : p))
        );
        // Turn off changing mode
        setChangingVotePollIds((prev) => {
          const next = new Set(prev);
          next.delete(pollId);
          return next;
        });
      } else {
        toast.error(json.message || "Could not record vote.");
      }
    } catch (err) {
      console.error("Voting error:", err);
      toast.error("Failed to connect to voting server.");
    } finally {
      setSubmittingPollId(null);
    }
  };

  const toggleChangeVote = (pollId: number) => {
    setChangingVotePollIds((prev) => {
      const next = new Set(prev);
      if (next.has(pollId)) {
        next.delete(pollId);
      } else {
        next.add(pollId);
      }
      return next;
    });
  };

  // Distinct projects found in polls
  const projectListInPolls = useMemo(() => {
    const map = new Map<number, string>();
    polls.forEach((p) => {
      if (p.project_id && p.project_name) {
        map.set(p.project_id, p.project_name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [polls]);

  // Filtered polls
  const filteredPolls = useMemo(() => {
    return polls.filter((p) => {
      // 1. Topic Filter
      if (selectedTopic === "common") {
        if (p.project_id !== null) return false;
      } else if (selectedTopic === "my-projects") {
        if (!p.project_id) return false;
        // If user has specific flats, filter to them; otherwise show all project-scoped polls
        if (userProjectIds.size > 0 && !userProjectIds.has(p.project_id)) {
          return false;
        }
      } else if (typeof selectedTopic === "number") {
        if (p.project_id !== selectedTopic) return false;
      }

      // 2. Status Filter
      const isClosed = p.status === "closed" || p.is_expired;
      if (statusFilter === "active" && isClosed) return false;
      if (statusFilter === "closed" && !isClosed) return false;

      return true;
    });
  }, [polls, selectedTopic, statusFilter, userProjectIds]);

  // Counts for topic pills
  const counts = useMemo(() => {
    const commonCount = polls.filter((p) => p.project_id === null).length;
    const myProjectsCount = polls.filter(
      (p) => p.project_id !== null && (userProjectIds.size === 0 || userProjectIds.has(p.project_id))
    ).length;
    return {
      all: polls.length,
      common: commonCount,
      myProjects: myProjectsCount,
    };
  }, [polls, userProjectIds]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e9ebf1]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#054b3c]/10 text-[#054b3c] text-xs font-semibold uppercase tracking-[0.14em] mb-2">
            <Vote className="size-3.5" />
            <span>Community Voting & Decisions</span>
          </div>
          <h1 className="font-[family-name:var(--font-heading)] text-2xl sm:text-3xl lg:text-4xl font-normal text-[#083327]">
            Project & Community Polls
          </h1>
          <p className="font-sans text-xs sm:text-sm text-[#546360] mt-1 max-w-2xl leading-relaxed">
            Vote on architectural decisions, amenities, landscaping styles, and upcoming building developments for your verified properties.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchPolls}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#e9ebf1] bg-white text-xs font-medium text-[#546360] hover:text-[#054b3c] hover:border-[#054b3c]/30 shadow-2xs transition-all cursor-pointer self-start sm:self-auto disabled:opacity-50"
          title="Refresh polls from ERP"
        >
          <RefreshCw className={cn("size-3.5", loading && "animate-spin text-[#054b3c]")} />
          <span>Refresh</span>
        </button>
      </div>

      {/* 2. Topic / Project Selector Tabs (Matching App UI style from screenshot) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* All Polls */}
        <button
          type="button"
          onClick={() => setSelectedTopic("all")}
          className={cn(
            "p-4 rounded-[18px] border text-left transition-all duration-200 cursor-pointer flex items-center justify-between",
            selectedTopic === "all"
              ? "bg-[#054b3c] text-white border-[#054b3c] shadow-sm"
              : "bg-white text-[#1f2723] border-[#e9ebf1] hover:border-[#054b3c]/30"
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "size-10 rounded-xl flex items-center justify-center shrink-0",
                selectedTopic === "all" ? "bg-white/15 text-white" : "bg-[#f1f6f5] text-[#054b3c]"
              )}
            >
              <Vote className="size-5" />
            </div>
            <div>
              <span className="font-sans font-medium text-sm block">All Polls</span>
              <span
                className={cn(
                  "text-[11px] block mt-0.5",
                  selectedTopic === "all" ? "text-white/80" : "text-[#546360]"
                )}
              >
                Public & Project decisions
              </span>
            </div>
          </div>
          <span
            className={cn(
              "text-xs font-semibold px-2 py-0.5 rounded-full",
              selectedTopic === "all"
                ? "bg-white text-[#054b3c]"
                : "bg-[#054b3c]/10 text-[#054b3c]"
            )}
          >
            {counts.all}
          </span>
        </button>

        {/* Common Polls (Public & Community) */}
        <button
          type="button"
          onClick={() => setSelectedTopic("common")}
          className={cn(
            "p-4 rounded-[18px] border text-left transition-all duration-200 cursor-pointer flex items-center justify-between",
            selectedTopic === "common"
              ? "bg-[#054b3c] text-white border-[#054b3c] shadow-sm"
              : "bg-white text-[#1f2723] border-[#e9ebf1] hover:border-[#054b3c]/30"
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "size-10 rounded-xl flex items-center justify-center shrink-0",
                selectedTopic === "common" ? "bg-white/15 text-white" : "bg-emerald-50 text-emerald-600"
              )}
            >
              <Globe2 className="size-5" />
            </div>
            <div>
              <span className="font-sans font-medium text-sm block">Common Polls</span>
              <span
                className={cn(
                  "text-[11px] block mt-0.5",
                  selectedTopic === "common" ? "text-white/80" : "text-[#546360]"
                )}
              >
                Public & community polls
              </span>
            </div>
          </div>
          <span
            className={cn(
              "text-xs font-semibold px-2 py-0.5 rounded-full",
              selectedTopic === "common"
                ? "bg-white text-[#054b3c]"
                : "bg-emerald-100 text-emerald-800"
            )}
          >
            {counts.common}
          </span>
        </button>

        {/* My Projects */}
        <button
          type="button"
          onClick={() => setSelectedTopic("my-projects")}
          className={cn(
            "p-4 rounded-[18px] border text-left transition-all duration-200 cursor-pointer flex items-center justify-between",
            selectedTopic === "my-projects"
              ? "bg-[#054b3c] text-white border-[#054b3c] shadow-sm"
              : "bg-white text-[#1f2723] border-[#e9ebf1] hover:border-[#054b3c]/30"
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "size-10 rounded-xl flex items-center justify-center shrink-0",
                selectedTopic === "my-projects" ? "bg-white/15 text-white" : "bg-amber-50 text-amber-600"
              )}
            >
              <Building2 className="size-5" />
            </div>
            <div>
              <span className="font-sans font-medium text-sm block">My Projects</span>
              <span
                className={cn(
                  "text-[11px] block mt-0.5",
                  selectedTopic === "my-projects" ? "text-white/80" : "text-[#546360]"
                )}
              >
                Verified properties only
              </span>
            </div>
          </div>
          <span
            className={cn(
              "text-xs font-semibold px-2 py-0.5 rounded-full",
              selectedTopic === "my-projects"
                ? "bg-white text-[#054b3c]"
                : "bg-amber-100 text-amber-800"
            )}
          >
            {counts.myProjects}
          </span>
        </button>
      </div>

      {/* Specific Project Sub-filter (if multiple projects exist) */}
      {projectListInPolls.length > 0 && selectedTopic !== "common" && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <span className="text-xs text-[#546360] font-medium shrink-0">Filter by Project:</span>
          <button
            type="button"
            onClick={() => setSelectedTopic("all")}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer",
              selectedTopic === "all" || selectedTopic === "my-projects"
                ? "bg-[#054b3c]/15 text-[#054b3c] font-semibold"
                : "bg-white text-[#546360] hover:bg-stone-100 border border-[#e9ebf1]"
            )}
          >
            All Projects
          </button>
          {projectListInPolls.map((proj) => (
            <button
              key={proj.id}
              type="button"
              onClick={() => setSelectedTopic(proj.id)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1.5",
                selectedTopic === proj.id
                  ? "bg-[#054b3c] text-white shadow-2xs font-semibold"
                  : "bg-white text-[#546360] hover:bg-stone-100 border border-[#e9ebf1]"
              )}
            >
              <Building2 className="size-3" />
              <span>{proj.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Status Filter Pill Row */}
      <div className="flex items-center justify-between gap-4">
        <div className="inline-flex p-1 bg-white border border-[#e9ebf1] rounded-full shadow-2xs">
          {(["all", "active", "closed"] as StatusFilter[]).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-medium capitalize transition-all cursor-pointer",
                statusFilter === st
                  ? "bg-[#054b3c] text-white shadow-xs font-semibold"
                  : "text-[#546360] hover:text-[#054b3c]"
              )}
            >
              {st === "active" && (
                <span className="inline-block size-2 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
              )}
              {st}
            </button>
          ))}
        </div>

        <span className="text-xs text-[#546360] font-sans">
          Showing {filteredPolls.length} {filteredPolls.length === 1 ? "poll" : "polls"}
        </span>
      </div>

      {/* 3. Polls Grid */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-white rounded-[24px] border border-[#e9ebf1] p-6 space-y-4 animate-pulse"
            >
              <div className="h-44 bg-stone-200/70 rounded-2xl w-full" />
              <div className="h-5 bg-stone-200/70 rounded w-3/4" />
              <div className="h-3 bg-stone-200/70 rounded w-full" />
              <div className="space-y-2 pt-2">
                <div className="h-12 bg-stone-100 rounded-xl w-full" />
                <div className="h-12 bg-stone-100 rounded-xl w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-[24px] bg-white border border-red-200 p-8 text-center space-y-3">
          <AlertCircle className="size-10 text-red-500 mx-auto" />
          <h3 className="font-heading text-lg font-medium text-red-900">Failed to Load Polls</h3>
          <p className="text-xs text-red-700 max-w-sm mx-auto font-sans">{error}</p>
          <button
            type="button"
            onClick={fetchPolls}
            className="px-5 py-2 rounded-full bg-[#054b3c] text-white text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-[#083327]"
          >
            Try Again
          </button>
        </div>
      ) : filteredPolls.length === 0 ? (
        <div className="rounded-[24px] bg-white border border-[#e9ebf1] p-12 text-center space-y-3">
          <div className="size-14 rounded-2xl bg-[#f1f6f5] text-[#054b3c] flex items-center justify-center mx-auto">
            <Vote className="size-7 text-[#054b3c]" />
          </div>
          <h3 className="font-[family-name:var(--font-heading)] text-xl font-normal text-[#083327]">
            No Polls Found
          </h3>
          <p className="text-xs text-[#546360] font-sans max-w-sm mx-auto">
            There are currently no polls matching your selected topic or status filter. Please check back soon or switch filters.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedTopic("all");
              setStatusFilter("all");
            }}
            className="mt-2 text-xs font-semibold text-[#054b3c] underline hover:text-[#083327] cursor-pointer"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {filteredPolls.map((poll) => {
            const isClosed = poll.status === "closed" || poll.is_expired;
            const bannerUrl = getAbsoluteImageUrl(poll.image_url || poll.image);
            const isChangingVote = changingVotePollIds.has(poll.id);
            // Show percentage results if user has voted OR if the poll has closed
            const showResults = (poll.has_voted || isClosed) && !isChangingVote;
            const currentSelected = selectedOptions[poll.id];

            return (
              <div
                key={poll.id}
                className="rounded-[24px] bg-white border border-[#e9ebf1] overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between"
              >
                {/* Banner Header */}
                <div className="relative aspect-[16/8] sm:aspect-[16/7] w-full bg-[#09221c] overflow-hidden">
                  {bannerUrl ? (
                    <Image
                      src={bannerUrl}
                      alt={poll.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#061d16] via-[#092e24] to-[#040c18] flex items-center justify-center">
                      <Vote className="size-16 text-white/10" />
                    </div>
                  )}

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/40 pointer-events-none" />

                  {/* Top Badges */}
                  <div className="absolute top-4 inset-x-4 flex items-center justify-between gap-2 z-10">
                    {/* Project / Common Tag (Matching image 2 & 3) */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white text-xs font-medium">
                      {poll.project_name ? (
                        <>
                          <Building2 className="size-3.5 text-[#cfa564]" />
                          <span className="truncate max-w-[180px]">{poll.project_name}</span>
                        </>
                      ) : (
                        <>
                          <Globe2 className="size-3.5 text-emerald-400" />
                          <span>Common Poll</span>
                        </>
                      )}
                    </div>

                    {/* Status Pill */}
                    {isClosed ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-900/80 backdrop-blur-md border border-white/20 text-stone-200 text-xs font-semibold">
                        <span className="size-2 rounded-full bg-red-400" />
                        <span>Closed</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 backdrop-blur-md border border-emerald-400/40 text-emerald-300 text-xs font-semibold">
                        <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Active</span>
                      </span>
                    )}
                  </div>

                  {/* Bottom Banner Info */}
                  <div className="absolute bottom-3 left-4 right-4 z-10 flex items-center justify-between text-xs text-white/90">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="size-3.5 text-[#cfa564]" />
                      <span>
                        {poll.end_date ? `Ends ${poll.end_date}` : "Open-ended"}
                      </span>
                    </div>

                    {poll.has_voted && (
                      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/90 text-white text-[11px] font-semibold">
                        <CheckCircle2 className="size-3" />
                        <span>You Voted</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Content Area */}
                <div className="p-5 sm:p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-[family-name:var(--font-heading)] text-lg sm:text-xl font-normal text-[#083327] leading-snug">
                      {poll.title}
                    </h3>
                    {poll.description && (
                      <p className="font-sans text-xs sm:text-sm text-[#546360] mt-2 leading-relaxed whitespace-pre-line">
                        {poll.description}
                      </p>
                    )}
                  </div>

                  {/* Options List */}
                  <div className="space-y-2.5 pt-2">
                    {poll.options.map((opt) => {
                      const optImageUrl = getAbsoluteImageUrl(opt.image_url || opt.image);
                      const isSelected = currentSelected === opt.id;
                      const isUserChoice = opt.is_user_choice || poll.user_voted_option_id === opt.id;
                      const pct = typeof opt.percentage === "number" ? Math.round(opt.percentage) : 0;

                      return (
                        <div
                          key={opt.id}
                          onClick={() => {
                            if (!isClosed && (!poll.has_voted || isChangingVote)) {
                              setSelectedOptions((prev) => ({ ...prev, [poll.id]: opt.id }));
                            }
                          }}
                          className={cn(
                            "relative overflow-hidden rounded-2xl border p-3 sm:p-3.5 transition-all duration-200 select-none",
                            showResults
                              ? isUserChoice
                                ? "border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-500/30"
                                : "border-[#e9ebf1] bg-white"
                              : isSelected
                              ? "border-[#054b3c] bg-[#054b3c]/5 ring-1 ring-[#054b3c]/20 cursor-pointer"
                              : isClosed
                              ? "border-[#e9ebf1] bg-stone-50/60 opacity-80"
                              : "border-[#e9ebf1] bg-white hover:border-[#054b3c]/40 hover:bg-stone-50/50 cursor-pointer"
                          )}
                        >
                          {/* Animated Progress Bar (Visible after voting or if closed) */}
                          {showResults && (
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                              className={cn(
                                "absolute inset-y-0 left-0 pointer-events-none rounded-2xl",
                                isUserChoice ? "bg-emerald-100/70" : "bg-[#f1f6f5]"
                              )}
                            />
                          )}

                          <div className="relative z-10 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              {/* Selection Indicator */}
                              {!showResults && (
                                <div
                                  className={cn(
                                    "size-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                                    isSelected
                                      ? "border-[#054b3c] bg-[#054b3c]"
                                      : "border-stone-300 bg-white"
                                  )}
                                >
                                  {isSelected && <span className="size-2 rounded-full bg-white" />}
                                </div>
                              )}

                              {/* Thumbnail (if option has image) */}
                              {optImageUrl && (
                                <div className="relative size-12 sm:size-14 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-stone-200/80">
                                  <Image
                                    src={optImageUrl}
                                    alt={opt.option_text}
                                    fill
                                    sizes="56px"
                                    className="object-cover"
                                  />
                                </div>
                              )}

                              {/* Option Text */}
                              <div className="min-w-0 flex-1">
                                <span
                                  className={cn(
                                    "font-sans text-xs sm:text-sm font-medium leading-tight block break-words",
                                    isUserChoice ? "text-emerald-950 font-semibold" : "text-[#1f2723]"
                                  )}
                                >
                                  {opt.option_text}
                                </span>
                                {isUserChoice && showResults && (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 mt-0.5">
                                    <CheckCircle2 className="size-3 text-emerald-600" />
                                    <span>Your Vote</span>
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Percentage & Vote Count (When showing results) */}
                            {showResults && (
                              <div className="text-right shrink-0">
                                <span
                                  className={cn(
                                    "font-sans text-sm sm:text-base font-bold block",
                                    isUserChoice ? "text-emerald-800" : "text-[#083327]"
                                  )}
                                >
                                  {pct}%
                                </span>
                                <span className="text-[11px] text-[#546360] font-sans block">
                                  {opt.votes_count || 0} {opt.votes_count === 1 ? "vote" : "votes"}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Actions / Bottom Footer */}
                  <div className="pt-4 border-t border-[#e9ebf1] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-4 text-xs text-[#546360] font-sans">
                      <div className="flex items-center gap-1.5">
                        <Users className="size-3.5 text-[#054b3c]" />
                        <span className="font-semibold text-[#1f2723]">
                          {poll.total_votes || 0}
                        </span>
                        <span>{poll.total_votes === 1 ? "total vote" : "total votes"}</span>
                      </div>
                    </div>

                    {/* Voting Controls */}
                    <div className="flex items-center gap-2">
                      {isClosed && (
                        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-stone-100 text-stone-600 text-xs font-medium">
                          <Clock className="size-3.5 text-stone-500" />
                          <span>Voting Closed ({poll.end_date || "Ended"})</span>
                        </div>
                      )}

                      {!showResults && !isClosed && (
                        <button
                          type="button"
                          onClick={() => handleVote(poll.id)}
                          disabled={submittingPollId === poll.id || !currentSelected}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#054b3c] hover:bg-[#083327] text-white text-xs font-semibold uppercase tracking-[0.12em] transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                        >
                          {submittingPollId === poll.id ? (
                            <span>Submitting...</span>
                          ) : (
                            <>
                              <span>Submit Vote</span>
                              <ArrowRight className="size-3.5" />
                            </>
                          )}
                        </button>
                      )}

                      {/* If user already voted and poll is active, allow switching vote */}
                      {showResults && !isClosed && (
                        <button
                          type="button"
                          onClick={() => toggleChangeVote(poll.id)}
                          className="text-xs font-semibold text-[#054b3c] hover:underline cursor-pointer py-1"
                        >
                          Change Choice
                        </button>
                      )}

                      {isChangingVote && !isClosed && (
                        <button
                          type="button"
                          onClick={() => toggleChangeVote(poll.id)}
                          className="text-xs text-[#546360] hover:text-[#1f2723] cursor-pointer py-1"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
