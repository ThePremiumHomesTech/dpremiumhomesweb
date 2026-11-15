"use client";

import React, { useState, useEffect, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { GuestSidebar, GuestDashboardTab } from "@/components/guest_dashboard/guest_sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard_header";
import { GuestOverviewTab } from "@/components/guest_dashboard/guest_overview_tab";
import { GuestSavedPropertiesTab } from "@/components/guest_dashboard/guest_saved_properties_tab";
import {
  GuestExploreProjectsTab,
  ProjectCardItem,
} from "@/components/guest_dashboard/guest_explore_projects_tab";
import { GuestSupportTab } from "@/components/guest_dashboard/guest_support_tab";
import { ClientUser, WishlistPropertyItem } from "@/components/dashboard/types";
import {
  fetchUserWishlist,
  addToUserWishlist,
  removeFromUserWishlist,
} from "@/lib/client-dashboard";
import { Preloader, LoadingScreen } from "@/components/preloader";
import { API_BASE } from "@/lib/api";
import { toast } from "sonner";
import { Lock, ArrowRight } from "lucide-react";
import Link from "next/link";

function GuestDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab =
    (searchParams?.get("tab") as GuestDashboardTab) || "overview";

  const [activeTab, setActiveTab] = useState<GuestDashboardTab>(initialTab);
  const [user, setUser] = useState<ClientUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [savedItems, setSavedItems] = useState<WishlistPropertyItem[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [totalOngoingProjects, setTotalOngoingProjects] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // 1. Strict Authentication Guard & User Loading
  useEffect(() => {
    let parsedUser: any = null;
    const storedUser =
      localStorage.getItem("tphl_user") || localStorage.getItem("user");
    const storedAuth = localStorage.getItem("tphl_auth_data");
    const storedToken =
      localStorage.getItem("tphl_auth_token") || localStorage.getItem("token");
    const storedUserId =
      localStorage.getItem("tphl_user_id") || localStorage.getItem("user_id");

    // If completely unauthenticated, block access and redirect to login
    if (!storedUser && !storedAuth && !storedToken && !storedUserId) {
      setIsAuthenticated(false);
      setIsLoading(false);
      router.push("/login?redirect=/guest/dashboard");
      return;
    }

    if (storedUser) {
      try {
        parsedUser = JSON.parse(storedUser);
      } catch {
        // ignore
      }
    } else if (storedAuth) {
      try {
        const authData = JSON.parse(storedAuth);
        parsedUser = authData?.user || authData?.data || authData;
      } catch {
        // ignore
      }
    }

    const effectiveId =
      storedUserId || parsedUser?.id || parsedUser?.user_id;

    if (!effectiveId && !parsedUser && !storedToken) {
      setIsAuthenticated(false);
      setIsLoading(false);
      router.push("/login?redirect=/guest/dashboard");
      return;
    }

    setIsAuthenticated(true);
    setUser({
      id: effectiveId || "guest-member",
      name:
        parsedUser?.name ||
        parsedUser?.full_name ||
        [parsedUser?.first_name, parsedUser?.last_name].filter(Boolean).join(" ") ||
        "Member",
      email: parsedUser?.email || "",
      phone: parsedUser?.phone || "",
      avatar: parsedUser?.avatar || parsedUser?.image || "",
      total_paid: "৳ 0",
      outstanding: "৳ 0",
      total_expense: "৳ 0",
      completion: 0,
    });
    setIsLoading(false);
  }, [router]);

  // 2. Load Wishlist & Projects Count
  const loadSavedData = useCallback(async () => {
    const userId = user?.id || localStorage.getItem("tphl_user_id") || "guest";
    try {
      const items = await fetchUserWishlist(userId);
      setSavedItems(items);
      setSavedIds(new Set(items.map((i) => String(i.propertyId))));
    } catch {
      // ignore
    }

    try {
      const res = await fetch(`${API_BASE}/projects`, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        const list = Array.isArray(json) ? json : json?.projects || json?.data || [];
        if (Array.isArray(list)) {
          setTotalOngoingProjects(list.length);
        }
      }
    } catch {
      // ignore
    }
  }, [user?.id]);

  useEffect(() => {
    loadSavedData();
  }, [loadSavedData]);

  // Handle Add/Remove Save in Explore Projects
  const handleToggleSave = async (project: ProjectCardItem) => {
    const pId = String(project.id);
    const userId = user?.id || localStorage.getItem("tphl_user_id") || "guest";

    if (savedIds.has(pId)) {
      // Remove
      setSavedIds((prev) => {
        const next = new Set(prev);
        next.delete(pId);
        return next;
      });
      setSavedItems((prev) => prev.filter((i) => String(i.propertyId) !== pId));
      await removeFromUserWishlist(userId, pId);
      toast.success(`Removed ${project.name} from saved properties.`);
    } else {
      // Add
      setSavedIds((prev) => new Set([...prev, pId]));
      const newItem: WishlistPropertyItem = {
        id: `saved-${pId}`,
        propertyId: pId,
        title: project.name,
        slug: project.slug,
        location: project.location,
        image: project.image,
        price: project.price,
      };
      setSavedItems((prev) => [newItem, ...prev]);
      await addToUserWishlist(userId, pId);
      toast.success(`Added ${project.name} to saved properties!`);
    }
  };

  const handleRemoveSavedItem = async (propertyId: string) => {
    const userId = user?.id || localStorage.getItem("tphl_user_id") || "guest";
    setSavedIds((prev) => {
      const next = new Set(prev);
      next.delete(String(propertyId));
      return next;
    });
    setSavedItems((prev) =>
      prev.filter((i) => String(i.propertyId) !== String(propertyId))
    );
    await removeFromUserWishlist(userId, propertyId);
    toast.success("Removed property from saved wishlist.");
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem("tphl_auth_token");
      localStorage.removeItem("token");
      localStorage.removeItem("tphl_user_id");
      localStorage.removeItem("user_id");
      localStorage.removeItem("tphl_user");
      localStorage.removeItem("user");
      localStorage.removeItem("tphl_auth_data");
    } catch {
      // ignore
    }
    router.push("/login");
  };

  const handleTabChange = (tab: GuestDashboardTab) => {
    setActiveTab(tab);
    setIsMobileSidebarOpen(false);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (query.trim() && activeTab !== "explore-projects") {
      setActiveTab("explore-projects");
    }
  };

  if (isLoading || isAuthenticated === null) {
    return <LoadingScreen />;
  }

  if (isAuthenticated === false || !user) {
    return (
      <div className="min-h-screen bg-[#f1f6f5] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[24px] border border-[#e6e2d8] p-8 text-center shadow-lg space-y-4">
          <div className="size-16 rounded-2xl bg-[#083327]/10 text-[#083327] flex items-center justify-center mx-auto">
            <Lock className="size-8 text-[#d0a65b]" />
          </div>
          <h2 className="font-heading text-2xl font-medium text-[#083327]">
            Authentication Required
          </h2>
          <p className="text-xs sm:text-sm text-[#718078] font-sans">
            Please log in or register to access your personal Member Dashboard, saved properties, and VIP consultations.
          </p>
          <div className="pt-2 flex flex-col gap-2.5">
            <Link
              href="/login?redirect=/guest/dashboard"
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-full bg-[#083327] hover:bg-[#0c4434] text-white text-xs font-semibold uppercase tracking-[0.14em] transition-all shadow-md"
            >
              <span>Log In To Continue</span>
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/register"
              className="w-full inline-flex items-center justify-center py-2.5 rounded-full border border-[#083327]/30 text-[#083327] hover:bg-stone-50 text-xs font-semibold uppercase tracking-[0.14em] transition-all"
            >
              <span>Create New Account</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-dvh flex overflow-hidden bg-[#f1f6f5] text-[#1f2723]">
      {/* 1. Guest Sidebar (exact visual styling to DashboardSidebar, with Guest menus) */}
      <GuestSidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        user={user}
        savedCount={savedItems.length}
        onLogout={handleLogout}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-dvh overflow-y-auto">
        {/* Top Header Bar */}
        <DashboardHeader
          user={user}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          searchQuery={searchQuery}
          setSearchQuery={handleSearchChange}
          onNotificationClick={() => setActiveTab("support")}
          onSparklesClick={() => setActiveTab("support")}
        />

        {/* Scrollable Tab Content Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1320px] w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12, filter: "blur(3px)" }}
              animate={{
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
                transitionEnd: { filter: "none" },
              }}
              exit={{ opacity: 0, y: -8, filter: "blur(2px)" }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              {activeTab === "overview" && (
                <GuestOverviewTab
                  user={user}
                  savedItems={savedItems}
                  totalOngoingProjects={totalOngoingProjects}
                  onNavigateTab={handleTabChange}
                />
              )}

              {activeTab === "saved-properties" && (
                <GuestSavedPropertiesTab
                  savedItems={savedItems}
                  onRemoveItem={handleRemoveSavedItem}
                  onNavigateTab={handleTabChange}
                />
              )}

              {activeTab === "explore-projects" && (
                <GuestExploreProjectsTab
                  savedIds={savedIds}
                  onToggleSave={handleToggleSave}
                  externalSearchQuery={searchQuery}
                />
              )}

              {activeTab === "support" && <GuestSupportTab user={user} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default function GuestDashboardPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Preloader />
      <GuestDashboardContent />
    </Suspense>
  );
}
