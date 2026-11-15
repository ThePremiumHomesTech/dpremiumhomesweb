"use client";

import { motion } from "motion/react";
import { Appear, Counter } from "@/components/ui/motion";
import { Eyebrow, Heading } from "@/components/ui/primitives";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { fluid, SETTLE } from "@/lib/utils";

interface ProgressDetailsHeroProps {
  projectName: string;
  location: string;
  tagline?: string;
  progressPercentage?: number;
  expectedHandover?: string;
  status?: string;
}

export function ProgressDetailsHero({
  projectName,
  location,
  tagline,
  progressPercentage = 0,
  expectedHandover,
  status = "ongoing project",
}: ProgressDetailsHeroProps) {
  const reduce = useReducedMotion();
  const radius = 27;
  const circumference = 2 * Math.PI * radius;
  const safePct = Math.min(100, Math.max(0, Math.round(progressPercentage)));
  const strokeDashoffset = circumference - (safePct / 100) * circumference;

  return (
    <section
      aria-label="Project Progress Details Hero"
      className="relative w-full overflow-hidden bg-[#09221c] text-white"
    >
      <div className="shell relative z-10 flex min-h-[480px] flex-col justify-end pb-14 pt-32 sm:min-h-[540px] sm:pb-[85px] sm:pt-40">
        <div className="flex flex-col justify-between gap-10 lg:flex-row lg:items-end lg:gap-12">
          {/* Left Content (Figma 8036:24968) */}
          <div className="flex max-w-[758px] flex-col gap-6">
            <div className="flex flex-col gap-4">
              <Eyebrow className="text-[#cfa564]">{status}</Eyebrow>
              <Heading
                as="h1"
                size={100}
                min={34}
                leading={1.05}
                mask
                className="text-white"
              >
                {projectName}
              </Heading>
            </div>

            {tagline && (
              <Appear preset="lift" delay={0.18}>
                <p
                  className="max-w-[672px] font-sans font-normal leading-[1.6] text-white/80"
                  style={{ fontSize: fluid(20, 15) }}
                >
                  {tagline}
                </p>
              </Appear>
            )}

            {location && (
              <Appear preset="lift" delay={0.24}>
                <div className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/image/progress/icons/hero-location.svg"
                    alt=""
                    width={24}
                    height={24}
                    className="size-5 shrink-0 sm:size-6"
                  />
                  <span
                    className="font-sans font-normal leading-[1.4] text-white"
                    style={{ fontSize: fluid(20, 15) }}
                  >
                    {location}
                  </span>
                </div>
              </Appear>
            )}
          </div>

          {/* Right Stat Cards (Figma 8036:24981) */}
          <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row sm:items-center sm:gap-5 lg:gap-[40px]">
            {/* Construction Complete Card (288 × 104) */}
            <Appear
              preset="lift"
              delay={0.22}
              className="flex h-[104px] w-full items-center bg-white/[0.08] p-[16px] sm:w-[288px] sm:p-[20px]"
            >
              <div className="flex w-full items-center gap-[16px] sm:gap-[20px]">
                <div className="relative flex size-[56px] shrink-0 items-center justify-center sm:size-[64px]">
                  <svg
                    className="size-[56px] -rotate-90 sm:size-[64px]"
                    viewBox="0 0 64 64"
                    aria-hidden
                  >
                    <circle
                      cx="32"
                      cy="32"
                      r={radius}
                      className="fill-none stroke-white/15"
                      strokeWidth="5"
                    />
                    <motion.circle
                      cx="32"
                      cy="32"
                      r={radius}
                      className="fill-none stroke-[#cfa564]"
                      strokeWidth="5"
                      strokeDasharray={circumference}
                      initial={{ strokeDashoffset: circumference }}
                      animate={{ strokeDashoffset }}
                      transition={
                        reduce
                          ? { duration: 0 }
                          : { duration: 1.6, ease: SETTLE, delay: 0.3 }
                      }
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                <div className="flex flex-col items-start gap-[6px] sm:gap-[10px]">
                  <Counter
                    value={`${safePct}%`}
                    className="trim font-display text-[26px] font-medium leading-[1.1] text-white sm:text-[32px]"
                  />
                  <span className="trim whitespace-nowrap font-sans text-[12px] font-normal leading-[1.7] tracking-[1px] text-white sm:text-[14px]">
                    Construction Complete
                  </span>
                </div>
              </div>
            </Appear>

            {/* Expected Handover Card (254 × 106) */}
            {expectedHandover && (
              <Appear
                preset="lift"
                delay={0.3}
                className="flex h-[106px] w-full items-center bg-white/[0.08] p-[16px] sm:w-[254px] sm:p-[20px]"
              >
                <div className="flex items-center gap-[16px] sm:gap-[20px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/image/progress/icons/hero-calendar.svg"
                    alt=""
                    width={56}
                    height={56}
                    className="size-[48px] shrink-0 sm:size-[56px]"
                  />

                  <div className="flex flex-col items-start gap-[6px] sm:gap-[10px]">
                    <span className="trim whitespace-nowrap font-display text-[26px] font-medium leading-[1.1] text-white sm:text-[32px]">
                      {expectedHandover}
                    </span>
                    <span className="trim whitespace-nowrap font-sans text-[12px] font-normal leading-[1.7] tracking-[1px] text-white sm:text-[14px]">
                      Expected Handover
                    </span>
                  </div>
                </div>
              </Appear>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
