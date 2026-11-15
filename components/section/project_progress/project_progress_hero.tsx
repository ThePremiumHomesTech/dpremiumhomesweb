"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProjectProgressHero() {
  return (
    <section
      aria-label="Project Progress Hero Section"
      className="relative w-full bg-[#061d16] bg-[radial-gradient(ellipse_100%_80%_at_50%_25%,#092e24_0%,#061d16_65%,#03130f_100%)] text-white overflow-hidden"
    >
      {/* Background Ambience Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 30%, rgba(208, 166, 91, 0.08) 0%, transparent 65%)",
        }}
      />

      <div className="shell relative z-10 flex min-h-[500px] flex-col justify-between pb-16 pt-24 sm:min-h-[560px] sm:pb-24 sm:pt-28 md:min-h-[640px] md:pb-32 md:pt-36">

        {/* Hero Content Section */}
        <div className="mt-8 flex flex-1 flex-col justify-center sm:mt-12 md:mt-16">
          <div className="grid grid-cols-1 items-center gap-8 md:gap-10 lg:grid-cols-12 lg:gap-12">
            {/* Left Column: Heading and Subtitle */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-start text-left lg:col-span-7"
            >
              {/* Breadcrumb / Category Tag */}
              <span className="mb-3 inline-block font-sans text-xs font-medium uppercase tracking-[0.22em] text-[#d0a65b] sm:mb-5 sm:text-[13px]">
                HOMEPAGE / PROJECT PROGRESS
              </span>

              {/* Display Headline */}
              <h1 className="font-heading text-3xl font-normal leading-[1.08] tracking-tight text-white sm:text-5xl sm:leading-[1.04] md:text-6xl lg:text-[72px] xl:text-[80px]">
                Building Your Future
                <br />
                Step By Step
              </h1>

              {/* Subtitle */}
              <p className="mt-4 max-w-xl font-sans text-xs font-normal leading-relaxed text-white/75 sm:mt-6 sm:text-sm md:text-base">
                Track the progress of our communities as they take shape - from
                foundation to handover.
              </p>
            </motion.div>

            {/* Right Column: Featured Project Progress Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="flex justify-center lg:col-span-5 lg:justify-end"
            >
              <Link
                href="/project-progress/the-premium-green-valley"
                className="group block w-full max-w-[340px] cursor-pointer rounded-2xl border border-white/10 bg-[#0c2620]/80 p-4 shadow-2xl backdrop-blur-md transition-all duration-300 hover:border-white/25 hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)] sm:max-w-[360px] sm:p-5"
              >
                {/* Project Image */}
                <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden bg-black/40">
                  <Image
                    src="/image/progress/tph_green_valley.png"
                    alt="TPH Green Valley"
                    fill
                    sizes="(max-width: 640px) 300px, 360px"
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    priority
                  />
                </div>

                {/* Project Details */}
                <div className="mt-4">
                  <h2 className="font-heading text-lg sm:text-xl font-medium text-white tracking-wide group-hover:text-[#d0a65b] transition-colors">
                    TPH Green Valley
                  </h2>

                  <div className="flex items-center gap-1.5 text-xs text-white/60 mt-1">
                    <MapPin className="h-3.5 w-3.5 text-[#d0a65b] shrink-0" />
                    <span>Bashundhara R/A, Dhaka</span>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-white/10 my-3.5 sm:my-4" />

                  {/* Progress Info */}
                  <div>
                    <span className="font-heading text-xs sm:text-[13px] text-white/80 tracking-wide block">
                      Construction Progress
                    </span>

                    <span className="font-heading text-3xl sm:text-4xl text-[#d0a65b] font-normal leading-tight block mt-1">
                      68%
                    </span>

                    {/* Progress Bar */}
                    <div
                      role="progressbar"
                      aria-valuenow={68}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label="TPH Green Valley construction progress 68%"
                      className="w-full h-2 sm:h-2.5 bg-white/20 rounded-full overflow-hidden mt-3 relative"
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "68%" }}
                        transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full bg-[#d0a65b] rounded-full"
                      />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
