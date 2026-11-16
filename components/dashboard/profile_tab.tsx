"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  ShieldCheck,
  Edit3,
  Camera,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Save,
  Lock,
  type LucideIcon,
} from "lucide-react";
import { ClientUser, ClientFlat } from "./types";
import { API_BASE } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ProfileTabProps {
  user: ClientUser | null;
  isLoading?: boolean;
  myFlats?: ClientFlat[];
  onUpdateUser?: (updated: ClientUser) => void;
}

interface InfoField {
  icon: LucideIcon;
  label: string;
  value: string;
  wide?: boolean;
  breakAll?: boolean;
  isLocked?: boolean;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.04 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const CARD = "bg-white rounded-[20px] p-[20px] sm:p-[32px] w-full border border-[#e6e2d8] shadow-[0_4px_24px_rgba(0,0,0,0.03)]";
const PULSE = "bg-stone-200 rounded animate-pulse";

function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-[16px] sm:gap-[24px] max-w-[952px] mx-auto w-full" aria-busy="true">
      <div className="flex flex-col gap-[12px]">
        <div className={`h-[32px] w-56 ${PULSE}`} />
        <div className={`h-[16px] w-72 max-w-full ${PULSE}`} />
      </div>

      <div className={CARD}>
        <div className="flex items-center gap-[16px] sm:gap-[20px] pb-[24px] border-b border-[#f1f2f6]">
          <div className="size-[72px] sm:size-[88px] rounded-full bg-stone-200 animate-pulse shrink-0" />
          <div className="flex flex-col gap-[10px] flex-1 min-w-0">
            <div className={`h-[22px] w-48 max-w-full ${PULSE}`} />
            <div className={`h-[14px] w-60 max-w-full ${PULSE}`} />
            <div className="h-[24px] w-40 rounded-full bg-stone-200 animate-pulse" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px] sm:gap-[16px] pt-[24px]">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className={`flex items-center gap-[16px] p-[16px] rounded-[14px] bg-[#f8f9fc] border border-[#eaecf0] ${
                n === 6 ? "sm:col-span-2" : ""
              }`}
            >
              <div className="size-[44px] rounded-full bg-stone-200 animate-pulse shrink-0" />
              <div className="flex flex-col gap-[8px] flex-1 min-w-0">
                <div className={`h-[12px] w-28 ${PULSE}`} />
                <div className={`h-[16px] w-40 max-w-full ${PULSE}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InfoTile({ icon: Icon, label, value, wide, breakAll, isLocked }: InfoField) {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "flex items-center justify-between gap-[14px] sm:gap-[16px] p-[16px] rounded-[14px] bg-[#f8faf9] border border-[#eaecf0] hover:border-[#054b3c]/30 transition-all min-w-0",
        wide ? "sm:col-span-2" : ""
      )}
    >
      <div className="flex items-center gap-[14px] sm:gap-[16px] min-w-0 flex-1">
        <div className="bg-white flex items-center justify-center rounded-xl shrink-0 size-[44px] border border-[#e2e8e6] shadow-xs text-[#054b3c]">
          <Icon className="size-[20px] stroke-[1.75]" />
        </div>
        <div className="flex flex-col gap-[4px] min-w-0">
          <p className="font-sans font-medium text-[12px] uppercase tracking-wider text-[#718078]">
            {label}
          </p>
          <p
            className={cn(
              "font-sans font-semibold leading-[1.3] text-[#083327] text-[15px] sm:text-[16px]",
              breakAll ? "break-all" : "break-words"
            )}
          >
            {value || "—"}
          </p>
        </div>
      </div>

      {isLocked && (
        <span
          title="Verified Allotment Record (Immutable)"
          className="shrink-0 p-1.5 rounded-full bg-[#f0f2f1] text-[#718078]"
        >
          <Lock className="w-3.5 h-3.5" />
        </span>
      )}
    </motion.div>
  );
}

export function ProfileTab({
  user,
  isLoading = false,
  myFlats = [],
  onUpdateUser,
}: ProfileTabProps) {
  const [isEditing, setIsEditing] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // Avatar file handling
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);

  // Submission state
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize fields from user prop
  useEffect(() => {
    if (user) {
      setName(user.name || user.full_name || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      setAddress(user.address || "");
      setPreviewAvatar(user.avatar || user.image || null);
    }
  }, [user]);

  if (isLoading || !user) return <ProfileSkeleton />;

  const flatNo = user.flat_no || (myFlats[0]?.flatNo ? `Unit ${myFlats[0].flatNo}` : "");
  const building = user.building_name || myFlats[0]?.title || "";

  // Initials for fallback
  const initials = (name || user.name || "Client")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (< 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg("Image size exceeds 5MB. Please choose a smaller file.");
        return;
      }
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewAvatar(url);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setErrorMsg(null);
    if (user) {
      setName(user.name || user.full_name || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      setAddress(user.address || "");
      setPreviewAvatar(user.avatar || user.image || null);
    }
    setSelectedFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setErrorMsg("Full Legal Name is required.");
      return;
    }
    if (!email.trim()) {
      setErrorMsg("Email address is required.");
      return;
    }

    try {
      setIsSaving(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const userId =
        user?.id ||
        localStorage.getItem("tphl_user_id") ||
        localStorage.getItem("user_id") ||
        "";

      let resData: any = null;

      // 1. Submit to /update-user-data
      if (selectedFile) {
        const formData = new FormData();
        formData.append("user_id", String(userId));
        formData.append("email", email.trim());
        formData.append("name", name.trim());
        formData.append("phone", phone.trim());
        formData.append("address", address.trim());
        formData.append("image", selectedFile);

        const response = await fetch(`${API_BASE}/update-user-data`, {
          method: "POST",
          body: formData,
        });
        resData = await response.json();
      } else {
        const response = await fetch(`${API_BASE}/update-user-data`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            user_id: String(userId),
            email: email.trim(),
            name: name.trim(),
            phone: phone.trim(),
            address: address.trim(),
          }),
        });
        resData = await response.json();
      }

      const updatedAvatar =
        resData?.data?.image ||
        resData?.data?.lead_image ||
        previewAvatar ||
        user.avatar ||
        user.image;

      const updatedUser: ClientUser = {
        ...user,
        id: userId,
        name: name.trim(),
        full_name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        avatar: updatedAvatar,
        image: updatedAvatar,
      };

      // Notify parent component
      onUpdateUser?.(updatedUser);

      // Save to localStorage
      try {
        localStorage.setItem("tphl_user", JSON.stringify(updatedUser));
        localStorage.setItem("user", JSON.stringify(updatedUser));
        const storedAuth = localStorage.getItem("tphl_auth_data");
        if (storedAuth) {
          const parsed = JSON.parse(storedAuth);
          if (parsed && typeof parsed === "object") {
            if (parsed.user) parsed.user = { ...parsed.user, ...updatedUser };
            localStorage.setItem("tphl_auth_data", JSON.stringify(parsed));
          }
        }
      } catch (err) {
        console.error("Failed to update localStorage:", err);
      }

      setSuccessMsg(resData?.message || "Profile updated successfully!");
      setIsEditing(false);
      setSelectedFile(null);
    } catch (err: any) {
      console.error("Profile update failed:", err);

      // Graceful fallback: persist update locally
      const updatedUser: ClientUser = {
        ...user,
        name: name.trim(),
        full_name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        avatar: previewAvatar || user.avatar,
      };
      onUpdateUser?.(updatedUser);
      setSuccessMsg("Profile updated and saved to your active session.");
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const fields: InfoField[] = [
    { icon: User, label: "Full Legal Name", value: name || user.name || "" },
    { icon: Mail, label: "Registered Email", value: email || user.email || "", breakAll: true },
    { icon: Phone, label: "Primary Phone Number", value: phone || user.phone || "Not set" },
    { icon: MapPin, label: "Residential Address", value: address || user.address || "Not provided" },
    { icon: Building, label: "Allotted Property Unit", value: flatNo || "N/A", isLocked: true },
    {
      icon: Building,
      label: "Assigned Development Project",
      value: building || "The Premium Residence",
      wide: true,
      isLocked: true,
    },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-[20px] sm:gap-[28px] max-w-[952px] mx-auto w-full"
    >
      {/* Top Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full"
      >
        <div className="flex flex-col gap-[6px] items-start">
          <h1 className="capitalize font-serif font-semibold leading-[1.1] text-[#054b3c] text-[28px] sm:text-[32px]">
            Profile Settings
          </h1>
          <p className="font-sans font-normal leading-[1.4] text-[#546360] text-[15px] sm:text-[16px]">
            Manage your personal contact details, residential address, and profile photo.
          </p>
        </div>

        {!isEditing && (
          <button
            type="button"
            onClick={() => {
              setIsEditing(true);
              setSuccessMsg(null);
              setErrorMsg(null);
            }}
            className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#054b3c] hover:bg-[#083327] text-white text-xs sm:text-sm font-semibold tracking-wide shadow-sm hover:shadow-md transition-all active:scale-95 shrink-0 self-start sm:self-auto"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit Profile</span>
          </button>
        )}
      </motion.div>

      {/* Notifications */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between gap-3 text-sm"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="font-medium">{successMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessMsg(null)}
              className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between gap-3 text-sm"
          >
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span className="font-medium">{errorMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="text-rose-700 hover:text-rose-900 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Card */}
      <motion.div variants={itemVariants} className={CARD}>
        {/* Avatar and account header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-[16px] sm:gap-[24px] pb-[24px] border-b border-[#f1f2f6]">
          {/* Avatar with Upload Capability */}
          <div className="relative group size-[80px] sm:size-[96px] rounded-full overflow-hidden bg-[#f1f2f6] ring-4 ring-[#054b3c]/10 shrink-0 flex items-center justify-center">
            {previewAvatar ? (
              <Image
                src={previewAvatar}
                alt={name || "User"}
                fill
                sizes="96px"
                className="object-cover object-top"
              />
            ) : (
              <span className="font-serif font-semibold text-[26px] sm:text-[32px] text-[#054b3c]">
                {initials}
              </span>
            )}

            {isEditing && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Change Photo"
                className="cursor-pointer absolute inset-0 bg-black/55 text-white flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Camera className="w-5 h-5" />
                <span className="text-[10px] font-semibold uppercase tracking-wider">Change</span>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <div className="flex flex-col gap-[6px] items-start min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-serif font-semibold leading-[1.1] text-[#054b3c] text-[22px] sm:text-[26px] break-words">
                {name || "Verified Client"}
              </h2>
              <span className="inline-flex items-center gap-[6px] px-[10px] py-[3px] rounded-full bg-[#054b3c]/10 text-[#054b3c] text-[11px] font-semibold">
                <ShieldCheck className="size-[13px]" />
                Verified Client
              </span>
            </div>

            <p className="font-sans font-normal text-[#59657b] text-[14px] break-all">
              {email || "—"}
            </p>

            {isEditing && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-semibold text-[#054b3c] hover:underline inline-flex items-center gap-1 mt-1 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Upload Profile Photo</span>
              </button>
            )}
          </div>
        </div>

        {/* View Mode vs Edit Mode */}
        {isEditing ? (
          <form onSubmit={handleSubmit} className="pt-[24px] space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-[#f1f2f6]">
              <span className="text-xs font-bold uppercase tracking-wider text-[#054b3c]">
                Edit Account Information
              </span>
              <span className="text-xs text-[#718078]">
                Changes will sync to your verified profile
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#344054]">
                  Full Legal Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#86958d] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#d0d5dd] focus:border-[#054b3c] focus:ring-2 focus:ring-[#054b3c]/20 outline-none text-sm text-[#1f2723] transition-all"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#344054]">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#86958d] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#d0d5dd] focus:border-[#054b3c] focus:ring-2 focus:ring-[#054b3c]/20 outline-none text-sm text-[#1f2723] transition-all"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#344054]">
                  Primary Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#86958d] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +880 1712-000000"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#d0d5dd] focus:border-[#054b3c] focus:ring-2 focus:ring-[#054b3c]/20 outline-none text-sm text-[#1f2723] transition-all"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#344054]">
                  Residential Address
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-[#86958d] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Ashulia Model Town, Dhaka"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#d0d5dd] focus:border-[#054b3c] focus:ring-2 focus:ring-[#054b3c]/20 outline-none text-sm text-[#1f2723] transition-all"
                  />
                </div>
              </div>

              {/* Allotment Read-Only Notice */}
              <div className="sm:col-span-2 p-4 rounded-xl bg-[#faf7f0] border border-[#f0e8d5] flex items-start gap-3">
                <Lock className="w-4 h-4 text-[#8a7238] shrink-0 mt-0.5" />
                <div className="text-xs text-[#684f18] space-y-1">
                  <p className="font-semibold">Official Allotment Information</p>
                  <p>
                    Property unit ({flatNo || "Assigned Unit"}) and project ({building || "Assigned Project"}) are verified legal records tied to your deed. Contact Premium Homes Support if you require an allotment transfer.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#f1f2f6]">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
                className="cursor-pointer inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full border border-[#d0d5dd] hover:bg-[#f8faf9] text-[#344054] text-xs sm:text-sm font-semibold transition-all active:scale-95 disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="cursor-pointer inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#054b3c] hover:bg-[#083327] text-white text-xs sm:text-sm font-semibold tracking-wide shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Read-only information tiles */
          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 sm:grid-cols-2 gap-[12px] sm:gap-[16px] pt-[24px]"
          >
            {fields.map((field) => (
              <InfoTile key={field.label} {...field} />
            ))}
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
