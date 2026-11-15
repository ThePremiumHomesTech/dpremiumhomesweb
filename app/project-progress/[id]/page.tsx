import type { Metadata } from "next";
import Link from "next/link";
import { Building2, ChevronLeft } from "lucide-react";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { ProgressAroundHome } from "@/components/section/project_progress/progress_around_home";
import { ProgressDetailsHero } from "@/components/section/project_progress/progress_details_hero";
import { ProgressFloorPlan } from "@/components/section/project_progress/progress_floor_plan";
import { ProgressGallery } from "@/components/section/project_progress/progress_gallery";
import { ProgressLiveCamera } from "@/components/section/project_progress/progress_live_camera";
import { ProgressOverviewTimeline } from "@/components/section/project_progress/progress_overview_timeline";
import { ProgressSpecsGrid } from "@/components/section/project_progress/progress_specs_grid";
import { API_BASE } from "@/lib/api";

interface PageProps {
  params: Promise<{ id: string }>;
}

function parsePercentage(val?: string | number): number {
  if (typeof val === "number") return val;
  if (!val) return 0;
  const num = parseFloat(String(val).replace(/%/g, "").trim());
  return isNaN(num) ? 0 : Math.round(num);
}

function normalizeProjectName(name?: string): string {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/^(the\s+)?(premium\s+)?/i, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function getProjectProgressData(paramId: string) {
  const baseUrl = API_BASE;

  let slug = paramId;

  // Direct alias normalization (e.g. Figma mock slug 'the-green-valley' -> 'the-premium-green-valley')
  const SLUG_ALIASES: Record<string, string> = {
    "the-green-valley": "the-premium-green-valley",
    "green-valley": "the-premium-green-valley",
    "tph-green-valley": "the-premium-green-valley",
  };
  if (SLUG_ALIASES[slug.toLowerCase()]) {
    slug = SLUG_ALIASES[slug.toLowerCase()];
  }

  // If paramId is numeric, resolve the slug first from /constructions/projects-progress
  if (/^\d+$/.test(paramId)) {
    try {
      const listRes = await fetch(
        `${baseUrl}/constructions/projects-progress`,
        {
          cache: "no-store",
        },
      );
      if (listRes.ok) {
        const listJson = await listRes.json();
        const list = Array.isArray(listJson?.data) ? listJson.data : [];
        const found = list.find(
          (p: any) => String(p.property_id) === String(paramId),
        );
        if (found?.project_slug) {
          slug = found.project_slug;
        }
      }
    } catch (err) {
      console.warn("Could not resolve slug for numeric id:", err);
    }
  }

  try {
    let [res, camRes] = await Promise.allSettled([
      fetch(
        `${baseUrl}/constructions/projects-progress/${encodeURIComponent(slug)}`,
        { cache: "no-store" },
      ),
      fetch(`${baseUrl}/cameras`, {
        cache: "no-store",
        headers: { Accept: "application/json" },
      }),
    ]);

    let json =
      res.status === "fulfilled" && res.value.ok ? await res.value.json() : null;
    let project =
      Array.isArray(json?.data) ? json.data[0] : json?.data || null;

    // If not found and slug doesn't start with "the-premium-", attempt prefixing
    if (!project && !slug.startsWith("the-premium-")) {
      try {
        const altSlug = `the-premium-${slug}`;
        const altRes = await fetch(
          `${baseUrl}/constructions/projects-progress/${encodeURIComponent(altSlug)}`,
          { cache: "no-store" },
        );
        if (altRes.ok) {
          const altJson = await altRes.json();
          if (altJson?.data) {
            project = Array.isArray(altJson.data) ? altJson.data[0] : altJson.data;
            slug = altSlug;
            json = altJson;
          }
        }
      } catch (e) {
        console.warn("Fallback slug lookup failed:", e);
      }
    }

    if (project) {
      const rawInlineCameras =
        Array.isArray(project?.cameras) && project.cameras.length > 0
          ? project.cameras
          : Array.isArray(json?.cameras)
            ? json.cameras
            : [];

      let allApiCameras: any[] = [];
      if (camRes.status === "fulfilled" && camRes.value.ok) {
        try {
          const camJson = await camRes.value.json();
          allApiCameras = Array.isArray(camJson?.cameras)
            ? camJson.cameras
            : Array.isArray(camJson?.data)
              ? camJson.data
              : [];
        } catch {
          allApiCameras = [];
        }
      }

      const targetPropId = Number(project.property_id) || 0;
      const normProjName = normalizeProjectName(
        project.project_name || project.property_name,
      );

      const matchedCameras: any[] = [];
      const seenLinks = new Set<string>();

      // 1. Match rich camera records from /api/cameras for this specific project
      for (const cam of allApiCameras) {
        if (!cam) continue;
        const camProjId = Number(cam.project_id) || 0;
        const normCamProj = normalizeProjectName(cam.project_name);

        const isIdMatch = targetPropId > 0 && camProjId === targetPropId;
        const isNameMatch =
          (!targetPropId || !camProjId) &&
          Boolean(normProjName && normCamProj) &&
          normCamProj === normProjName;

        if (isIdMatch || isNameMatch) {
          const linkKey = String(cam.camera_link || cam.id || "").trim();
          if (linkKey && !seenLinks.has(linkKey)) {
            seenLinks.add(linkKey);
            matchedCameras.push(cam);
          }
        }
      }

      // 2. Merge any inline cameras from the project progress response not already present
      rawInlineCameras.forEach((item: any, idx: number) => {
        if (typeof item === "string") {
          const linkKey = item.trim();
          if (linkKey && !seenLinks.has(linkKey)) {
            seenLinks.add(linkKey);
            matchedCameras.push({
              id: `inline-cam-${idx + 1}`,
              camera_name: `Cam ${matchedCameras.length + 1}`,
              camera_link: linkKey,
            });
          }
        } else if (item && typeof item === "object") {
          const linkKey = String(
            item.camera_link || item.stream_url || item.url || item.id || "",
          ).trim();
          if (linkKey && !seenLinks.has(linkKey)) {
            seenLinks.add(linkKey);
            matchedCameras.push(item);
          }
        }
      });

      return { project, cameras: matchedCameras };
    }
  } catch (err) {
    console.error("Error fetching project progress details:", err);
  }
  return { project: null, cameras: [] };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const { project } = await getProjectProgressData(id);

  const title =
    project?.project_name || project?.property_name || "Project Progress";
  return {
    title: `${title} - Real-Time Construction Progress | Premium Homes`,
    description: `Explore live engineering progress, milestones, specifications, and architecture updates for ${title}.`,
  };
}

export default async function ProjectProgressDetailsPage({
  params,
}: PageProps) {
  const { id } = await params;
  const { project, cameras } = await getProjectProgressData(id);

  const effectiveProject = project || {
    project_name: "TPH Green Valley",
    property_name: "TPH Green Valley",
    project_location: "Bashundhara R/A, Dhaka",
    location: "Bashundhara R/A, Dhaka",
    overall_progress: 65,
    handover: "Dec 2027",
    delivery: "A thoughtfully designed community for modern living.",
    land_area: "5.25 katha",
    total_unit: "256",
    total_share: 16,
    buildingType: "B+G+8",
    totalFloors: "G+10",
    parking_levels: "2 Levels",
    unitType: "3 & 4 Bed, Penthouse",
    developer: "The Premium Homes Ltd.",
    buildingFace: "South-East Facing",
    frontRoad: "25",
    passengerLift: "1",
    cargoLift: "1",
    carParking: "Yes",
    unitPerFloor: "2",
    suiteSizes: "3 & 4 Bed, Penthouse",
    electricityBackup: "Yes",
    constructionStart: "Jan 2024",
    project_image: "/image/progress/tph_green_valley.png",
    floor_plan_image: "/image/progress/FloorPlan.png",
    work_category_progress: {
      handover: "80%",
      structural_work: "80%",
      brick_work: "80%",
      electrical_work: "80%",
      plumbing_work: "80%",
      interior_work: "80%",
      paint_work: "80%",
    },
  };

  const projectName =
    effectiveProject.project_name ||
    effectiveProject.property_name ||
    "TPH Green Valley";
  const location =
    effectiveProject.project_location ||
    effectiveProject.location ||
    "Bashundhara R/A, Dhaka";
  const progressPct = parsePercentage(
    effectiveProject.overall_progress ?? effectiveProject.totalProgress,
  );
  const handoverDate = effectiveProject.handover?.trim() || "Dec 2027";
  const tagline =
    effectiveProject.delivery?.trim() ||
    effectiveProject.hotelOperation?.trim() ||
    "A thoughtfully designed community for modern living.";

  return (
    <div className="flex min-h-screen flex-col justify-between bg-white text-[#1f2723]">
      <Navbar />
      <main className="w-full flex-1">
        {/* 1. Dynamic Hero Section */}
        <ProgressDetailsHero
          projectName={projectName}
          location={location}
          tagline={tagline}
          progressPercentage={progressPct}
          expectedHandover={handoverDate}
          status={progressPct >= 100 ? "completed project" : "ongoing project"}
        />

        {/* 2. Project Overview & Milestone Timeline */}
        <ProgressOverviewTimeline
          overviewText={
            effectiveProject.delivery?.trim() ||
            (effectiveProject.hotelOperation?.trim()
              ? `${projectName} offers premium residential suites with dedicated hospitality management by ${effectiveProject.hotelOperation}. Constructed strictly in accordance with BNBC engineering standards.`
              : undefined)
          }
          workCategoryProgress={effectiveProject.work_category_progress}
          constructionStart={
            effectiveProject.constructionStart?.trim() || "Jan 2024"
          }
          expectedHandover={handoverDate}
          projectName={projectName}
        />

        {/* 3. Live Camera & Real Progress Breakdown */}
        <ProgressLiveCamera
          cameras={cameras}
          workCategoryProgress={effectiveProject.work_category_progress}
          fallbackImage={effectiveProject.project_image}
          overallProgress={progressPct}
          projectName={projectName}
        />

        {/* 4. Key Specifications Grid */}
        <ProgressSpecsGrid
          location={location}
          landArea={effectiveProject.land_area}
          totalShare={effectiveProject.total_share}
          totalUnit={
            effectiveProject.total_unit ||
            effectiveProject.total_share ||
            256
          }
          buildingType={effectiveProject.buildingType}
          totalFloors={effectiveProject.totalFloors || "G+10"}
          parking={effectiveProject.parking_levels || "2 Levels"}
          unitType={
            effectiveProject.unitType ||
            effectiveProject.suiteSizes ||
            "3 & 4 Bed, Penthouse"
          }
          developer={effectiveProject.developer || "The Premium Homes Ltd."}
          frontRoad={effectiveProject.frontRoad}
          passengerLift={
            effectiveProject.passengerLift !== undefined &&
            Number(effectiveProject.passengerLift) > 0
              ? effectiveProject.passengerLift
              : "1"
          }
          carParking={effectiveProject.carParking ?? "Yes"}
          expectedHandover={handoverDate}
          suiteSizes={effectiveProject.suiteSizes}
          unitPerFloor={effectiveProject.unitPerFloor}
        />

        {/* 5. Spacious Floor Plans & Unit Specs */}
        <ProgressFloorPlan
          buildingType={effectiveProject.buildingType || "B+G+8"}
          totalShare={effectiveProject.total_share || "16"}
          unitPerFloor={effectiveProject.unitPerFloor || "2"}
          frontRoad={effectiveProject.frontRoad || "25"}
          passengerLift={
            effectiveProject.passengerLift !== undefined &&
            Number(effectiveProject.passengerLift) > 0
              ? effectiveProject.passengerLift
              : "1"
          }
          cargoLift={effectiveProject.cargoLift}
          carParking={effectiveProject.carParking ?? "Yes"}
          electricityBackup={effectiveProject.electricityBackup ?? "Yes"}
          suiteSizes={effectiveProject.suiteSizes}
          hotelOperation={effectiveProject.hotelOperation}
          delivery={effectiveProject.delivery}
          image={
            effectiveProject.floor_plan_image ||
            "/image/progress/FloorPlan.png"
          }
          projectName={projectName}
        />

        {/* 6. Dynamic Amenities & Highlights Gallery */}
        <ProgressGallery
          amenities={effectiveProject.amenities}
          projectImage={effectiveProject.project_image}
          projectName={projectName}
        />

        {/* 7. Nearby Locations Map */}
        <ProgressAroundHome location={location} projectName={projectName} />
      </main>
      <Footer />
    </div>
  );
}
