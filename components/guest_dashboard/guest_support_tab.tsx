"use client";

import React, { useState } from "react";
import {
  PhoneCall,
  Clock,
  Mail,
  Calendar,
  Building2,
  CheckCircle2,
  Send,
  MessageSquare,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { ClientUser } from "@/components/dashboard/types";
import { toast } from "sonner";

interface GuestSupportTabProps {
  user: ClientUser | null;
}

export function GuestSupportTab({ user }: GuestSupportTabProps) {
  const [fullName, setFullName] = useState(
    user?.name || user?.full_name || ""
  );
  const [phone, setPhone] = useState(user?.phone || "");
  const [email, setEmail] = useState(user?.email || "");
  const [date, setDate] = useState("");
  const [projectInterest, setProjectInterest] = useState("");
  const [meetingType, setMeetingType] = useState("In-Person (Head Office)");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBooked, setIsBooked] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone) {
      toast.error("Please fill in your name and phone number.");
      return;
    }

    setIsSubmitting(true);
    // Simulate consultation submission or connect to lead API
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setIsBooked(true);
      toast.success("Consultation request received! Our team will contact you shortly.");
    } catch {
      toast.error("Could not submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="pb-2 border-b border-[#e6e2d8]">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d0a65b] block">
          VIP MEMBER CARE
        </span>
        <h1 className="font-heading text-2xl sm:text-3xl font-medium text-[#083327] mt-1">
          Member Support & Consultation
        </h1>
        <p className="text-xs sm:text-sm text-[#718078] mt-1 font-sans">
          Our senior property specialists and relationship officers are dedicated to guiding you through every step of your real estate journey.
        </p>
      </div>

      {/* 3 Contact Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 1. Direct Helpline */}
        <div className="rounded-[22px] bg-white border border-[#e6e2d8] p-5 sm:p-6 shadow-2xs hover:border-[#083327]/30 transition-all flex flex-col justify-between">
          <div className="space-y-3">
            <div className="size-11 rounded-2xl bg-[#083327]/5 text-[#083327] flex items-center justify-center">
              <PhoneCall className="size-5 text-[#d0a65b]" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-medium text-[#083327]">
                Direct Helpline
              </h3>
              <p className="text-xs text-[#718078] mt-1 font-sans">
                Call us directly for flat bookings, pricing inquiries, and private site visits.
              </p>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-[#f0ebe1] space-y-2">
            <a
              href="tel:+8801713255555"
              className="font-heading text-lg font-medium text-[#083327] hover:text-[#cfa564] block tracking-wide transition-colors"
            >
              +880 1713-255555
            </a>
            <a
              href="https://wa.me/8801713255555"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-700 hover:text-emerald-800 transition-colors"
            >
              <span>Chat on WhatsApp</span>
              <ArrowRight className="size-3" />
            </a>
          </div>
        </div>

        {/* 2. Office Hours & Location */}
        <div className="rounded-[22px] bg-white border border-[#e6e2d8] p-5 sm:p-6 shadow-2xs hover:border-[#083327]/30 transition-all flex flex-col justify-between">
          <div className="space-y-3">
            <div className="size-11 rounded-2xl bg-[#083327]/5 text-[#083327] flex items-center justify-center">
              <Clock className="size-5 text-[#d0a65b]" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-medium text-[#083327]">
                Office Hours
              </h3>
              <p className="text-xs text-[#718078] mt-1 font-sans">
                Saturday – Thursday: 9:30 AM – 6:30 PM
              </p>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-[#f0ebe1] space-y-1">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#86958d]">
              Head Office
            </span>
            <p className="text-xs font-medium text-[#083327]">
              The Premium Homes Ltd., Dhaka, Bangladesh
            </p>
          </div>
        </div>

        {/* 3. Priority Member Desk */}
        <div className="rounded-[22px] bg-white border border-[#e6e2d8] p-5 sm:p-6 shadow-2xs hover:border-[#083327]/30 transition-all flex flex-col justify-between">
          <div className="space-y-3">
            <div className="size-11 rounded-2xl bg-[#083327]/5 text-[#083327] flex items-center justify-center">
              <Mail className="size-5 text-[#d0a65b]" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-medium text-[#083327]">
                Priority Desk
              </h3>
              <p className="text-xs text-[#718078] mt-1 font-sans">
                Average email response time is under 2 hours for registered members.
              </p>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-[#f0ebe1] space-y-1">
            <a
              href="mailto:tech@dpremiumhomes.com"
              className="text-xs font-medium text-[#083327] hover:text-[#cfa564] block truncate transition-colors"
            >
              tech@dpremiumhomes.com
            </a>
            <div className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
              <ShieldCheck className="size-3 text-emerald-600" />
              <span>Verified Desk Support</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Consultation Booking Form */}
      <div className="rounded-[24px] bg-white border border-[#e6e2d8] p-6 sm:p-8 shadow-2xs relative overflow-hidden">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#083327]/5 text-[#083327] text-[11px] font-semibold tracking-wider uppercase mb-2">
            <Sparkles className="size-3 text-[#d0a65b]" />
            <span>Private Appointment</span>
          </div>
          <h2 className="font-heading text-xl sm:text-2xl font-medium text-[#083327]">
            Book an In-Person Consultation
          </h2>
          <p className="text-xs sm:text-sm text-[#718078] mt-1 font-sans">
            Schedule a personalized session with our senior investment architects to review blueprints, pricing models, and private site visits.
          </p>
        </div>

        {isBooked ? (
          <div className="mt-6 p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center max-w-lg space-y-2">
            <div className="size-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto">
              <CheckCircle2 className="size-6" />
            </div>
            <h4 className="font-heading text-lg font-medium text-emerald-900">
              Consultation Scheduled
            </h4>
            <p className="text-xs text-emerald-700">
              Thank you, {fullName}! Our relations officer will call you at {phone} to confirm your appointment time and site visit schedule.
            </p>
            <button
              type="button"
              onClick={() => setIsBooked(false)}
              className="mt-3 text-xs font-semibold uppercase tracking-wider text-emerald-800 underline hover:text-emerald-950 cursor-pointer"
            >
              Book another consultation
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
            {/* Full Name */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#718078] mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                className="w-full px-4 py-2.5 text-xs sm:text-sm bg-white border border-[#e6e2d8] rounded-xl focus:outline-hidden focus:border-[#083327] focus:ring-1 focus:ring-[#083327]"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#718078] mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="017XXXXXXXX"
                className="w-full px-4 py-2.5 text-xs sm:text-sm bg-white border border-[#e6e2d8] rounded-xl focus:outline-hidden focus:border-[#083327] focus:ring-1 focus:ring-[#083327]"
              />
            </div>

            {/* Preferred Date */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#718078] mb-1.5">
                Preferred Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2.5 text-xs sm:text-sm bg-white border border-[#e6e2d8] rounded-xl focus:outline-hidden focus:border-[#083327] focus:ring-1 focus:ring-[#083327]"
              />
            </div>

            {/* Meeting Type */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#718078] mb-1.5">
                Consultation Format
              </label>
              <select
                value={meetingType}
                onChange={(e) => setMeetingType(e.target.value)}
                className="w-full px-4 py-2.5 text-xs sm:text-sm bg-white border border-[#e6e2d8] rounded-xl focus:outline-hidden focus:border-[#083327] focus:ring-1 focus:ring-[#083327]"
              >
                <option value="In-Person (Head Office)">In-Person (Head Office)</option>
                <option value="On-Site Project Visit">On-Site Project Visit</option>
                <option value="Online Video Conference">Online Video Conference</option>
              </select>
            </div>

            {/* Project of Interest */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#718078] mb-1.5">
                Project or Area of Interest
              </label>
              <input
                type="text"
                value={projectInterest}
                onChange={(e) => setProjectInterest(e.target.value)}
                placeholder="e.g. The Premium Green Valley, Bashundhara, Studio Suite..."
                className="w-full px-4 py-2.5 text-xs sm:text-sm bg-white border border-[#e6e2d8] rounded-xl focus:outline-hidden focus:border-[#083327] focus:ring-1 focus:ring-[#083327]"
              />
            </div>

            {/* Notes */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#718078] mb-1.5">
                Special Inquiries or Requirements
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tell us what size, budget, or architectural specifications you are looking for..."
                className="w-full px-4 py-2.5 text-xs sm:text-sm bg-white border border-[#e6e2d8] rounded-xl focus:outline-hidden focus:border-[#083327] focus:ring-1 focus:ring-[#083327] resize-none"
              />
            </div>

            {/* Submit Button */}
            <div className="sm:col-span-2 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#083327] hover:bg-[#0c4434] text-white text-xs font-semibold uppercase tracking-[0.14em] transition-all shadow-md active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Submitting...</span>
                ) : (
                  <>
                    <span>Confirm Consultation Request</span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
