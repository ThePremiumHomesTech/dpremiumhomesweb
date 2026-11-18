"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { GreenPill } from "@/components/ui/primitives";
import { SectionIntro } from "@/components/section/shared/section_intro";
import { ERP_BASE_URL } from "@/lib/api";
import { cn, SETTLE } from "@/lib/utils";

export interface JobVacancy {
  id: string;
  title: string;
  department: string;
  location: string;
  jobType: string;
  salaryRange: string;
  deadline: string;
  description?: string;
  vacancies?: number;
}

const INITIAL_JOBS: JobVacancy[] = [
  { id: "job-1", title: "Business Analysts", department: "Analytics & Strategy", location: "Gulshan, Dhaka", jobType: "Full Time", salaryRange: "100k - 150k", deadline: "Feb 28, 2025" },
  { id: "job-2", title: "Accounts", department: "Finance & Accounts", location: "Gulshan, Dhaka", jobType: "Full Time", salaryRange: "100k - 150k", deadline: "Feb 28, 2025" },
  { id: "job-3", title: "Executive Assistant", department: "Executive Office", location: "Gulshan, Dhaka", jobType: "Full Time", salaryRange: "100k - 150k", deadline: "Feb 28, 2025" },
  { id: "job-4", title: "Administration", department: "Operations & Admin", location: "Gulshan, Dhaka", jobType: "Full Time", salaryRange: "100k - 150k", deadline: "Feb 28, 2025" },
];

const ADDITIONAL_JOBS: JobVacancy[] = [
  { id: "job-5", title: "Architectural Project Lead", department: "Design & Planning", location: "Gulshan, Dhaka", jobType: "Full Time", salaryRange: "140k - 180k", deadline: "Mar 15, 2025" },
  { id: "job-6", title: "Senior Sales Consultant", department: "Client Relations", location: "Gulshan, Dhaka", jobType: "Full Time", salaryRange: "90k - 130k", deadline: "Mar 20, 2025" },
];

/** `null` means "no filter": the pill then shows its own label. */
const FILTERS = {
  department: {
    label: "Department",
    options: ["Analytics & Strategy", "Finance & Accounts", "Executive Office", "Operations & Admin", "Design & Planning", "Client Relations"],
  },
  jobType: { label: "Employment Type", options: ["Full Time", "Part Time", "Contract"] },
} as const;
type FilterKey = keyof typeof FILTERS;

const META: { label: string; key: keyof JobVacancy }[] = [
  { label: "Location", key: "location" },
  { label: "Job type", key: "jobType" },
  { label: "Salary Range", key: "salaryRange" },
  { label: "Deadline", key: "deadline" },
];

const EMPTY_FORM = { name: "", email: "", phone: "", resume: "", note: "" };

/** Outlined filter pill with a menu; the chevron turns while it is open. */
function FilterDropdown({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly string[];
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const choose = (option: string | null) => {
    onChange(option);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={cn(
          "press flex h-12 items-center gap-6 rounded-full border px-6 text-[14px] font-medium uppercase tracking-[2px]",
          value || open ? "border-green text-green" : "border-chip text-sage hover:border-green/40",
        )}
      >
        <span className="trim leading-[1.7]">{value ?? label}</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/image/career/icons/chevron-down.svg"
          alt=""
          className={cn("transition-transform duration-300 ease-out-expo", open ? "-rotate-90" : "rotate-90")}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.25, ease: SETTLE }}
            className="absolute left-0 top-full z-40 mt-2 w-60 origin-top-left overflow-hidden rounded-2xl border border-chip bg-white py-1.5 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.2)]"
          >
            {[null, ...options].map((option) => (
              <li key={option ?? "all"}>
                <button
                  type="button"
                  onClick={() => choose(option)}
                  className={cn(
                    "flex w-full items-center justify-between px-4 py-2.5 text-left text-[14px] transition-colors hover:bg-warm",
                    option === value ? "font-medium text-green" : "text-sage",
                  )}
                >
                  {option ?? `All ${label.toLowerCase()}s`}
                  {option === value && <Check className="size-4" />}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Figma job row: title over four label / value columns, "Apply now" at the far right. */
function JobCard({ job, index, onSelect, onApply }: { job: JobVacancy; index: number; onSelect: () => void; onApply: () => void }) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 48 }}
      whileInView={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16, transition: { duration: 0.2 } }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ type: "spring", bounce: 0, duration: 0.9, delay: index * 0.08 }}
      onClick={onSelect}
      className="group flex cursor-pointer flex-col gap-7 bg-white p-6 transition-shadow duration-500 hover:shadow-[0_18px_40px_-20px_rgba(5,75,60,0.25)]"
    >
      <h3 className="font-display text-[clamp(24px,1.75vw,28px)] font-medium capitalize leading-[1.1] text-green transition-colors group-hover:text-ink">{job.title}</h3>
      <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
        {/* 2×2 on phones, four columns on tablets, and the Figma single row (button inline) from xl. */}
        <dl className="grid grid-cols-2 gap-6 md:grid-cols-4 xl:flex xl:max-w-[1100px] xl:flex-1 xl:justify-between">
          {META.map(({ label, key }) => (
            <div key={key} className="flex flex-col gap-4 xl:w-[170px]">
              <dt className="trim text-[14px] uppercase leading-[1.7] tracking-[2px] text-[#727679]">{label}</dt>
              <dd className="trim text-[18px] font-medium capitalize leading-[1.2] tracking-[-0.36px] text-ink">{job[key]}</dd>
            </div>
          ))}
        </dl>
        <div onClick={(e) => e.stopPropagation()}>
          <GreenPill onClick={onApply} arrow className="h-12 w-[164px] justify-center px-[29px] text-[16px] text-white">
            apply now
          </GreenPill>
        </div>
      </div>
    </motion.li>
  );
}

function renderInlineBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-semibold text-ink">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    ),
  );
}

function JobDescriptionBody({ description }: { description?: string }) {
  if (!description?.trim()) {
    return <p className="text-[15px] leading-relaxed text-sage">No detailed description provided for this position.</p>;
  }

  const lines = description.replace(/\r\n/g, "\n").split("\n");
  return (
    <div className="space-y-3 text-[15px] leading-relaxed text-sage">
      {lines.map((raw, idx) => {
        const line = raw.trim();
        if (!line) return null;
        if (line.startsWith("# ")) {
          return (
            <h4 key={idx} className="pt-1 font-display text-[22px] font-medium text-green">
              {line.slice(2)}
            </h4>
          );
        }
        if (line.startsWith("## ")) {
          return (
            <h5 key={idx} className="pt-3 font-display text-[18px] font-medium text-ink">
              {line.slice(3)}
            </h5>
          );
        }
        if (line.startsWith("- ")) {
          return (
            <div key={idx} className="flex gap-2.5 pl-1">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-gold" />
              <span>{renderInlineBold(line.slice(2))}</span>
            </div>
          );
        }
        return <p key={idx}>{renderInlineBold(line)}</p>;
      })}
    </div>
  );
}

function JobDetailsModal({ job, onClose, onApply }: { job: JobVacancy; onClose: () => void; onApply: () => void }) {
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="job-details-title">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={onClose}
        className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.96 }}
        transition={{ duration: 0.35, ease: SETTLE }}
        className="relative z-10 flex max-h-[88vh] w-full max-w-2xl flex-col rounded-3xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-chip px-6 py-5 sm:px-8">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[2px] text-gold">{job.department}</p>
            <h3 id="job-details-title" className="mt-1 font-display text-[28px] leading-[1.15] text-green">
              {job.title}
            </h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 text-sage hover:bg-warm">
            <X className="size-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 border-b border-chip bg-[#f9fafb] px-6 py-4 sm:grid-cols-4 sm:px-8">
          {META.map(({ label, key }) => (
            <div key={key}>
              <p className="text-[11px] uppercase tracking-[1.5px] text-[#727679]">{label}</p>
              <p className="mt-0.5 text-[14px] font-medium text-ink">{job[key]}</p>
            </div>
          ))}
        </div>

        <div data-lenis-prevent className="flex-1 overflow-y-auto overscroll-contain px-6 py-6 sm:px-8">
          <JobDescriptionBody description={job.description} />
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-chip px-6 py-4 sm:px-8">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-full border border-chip px-6 text-[13px] font-medium uppercase tracking-[1.6px] text-sage hover:bg-warm"
          >
            Close
          </button>
          <GreenPill onClick={onApply} arrow className="h-11 px-7 text-[14px] text-white">
            Apply Now
          </GreenPill>
        </div>
      </motion.div>
    </div>
  );
}

const FIELD_LABEL = "text-[12px] font-medium uppercase tracking-[1.5px] text-sage";
const FIELD_CONTROL =
  "w-full rounded-lg border border-chip px-3.5 py-2.5 text-[14px] text-ink outline-none transition-colors focus:border-green";

function Field({
  label,
  className,
  ...input
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className={FIELD_LABEL}>{label}</span>
      <input {...input} className={FIELD_CONTROL} />
    </label>
  );
}

function ApplyModal({ job, onClose }: { job: JobVacancy; onClose: () => void }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bind = (key: keyof typeof EMPTY_FORM) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [key]: e.target.value }),
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("job_id", job.id);
      body.append("full_name", form.name);
      body.append("email", form.email);
      body.append("phone", form.phone);
      if (form.note.trim()) body.append("cover_note", form.note.trim());
      if (resumeFile) {
        body.append("resume_file", resumeFile);
      } else {
        body.append("resume_link", form.resume.trim());
      }

      const res = await fetch(`${ERP_BASE_URL}/api/jobs/apply`, {
        method: "POST",
        headers: { Accept: "application/json" },
        body,
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok || payload?.success === false) {
        throw new Error(payload?.message || `HTTP ${res.status}`);
      }
      setSent(true);
      setTimeout(onClose, 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" data-lenis-prevent>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-green-deep/70 backdrop-blur-sm"
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={`Apply for ${job.title}`}
        initial={{ opacity: 0, scale: 0.95, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 24 }}
        transition={{ duration: 0.35, ease: SETTLE }}
        className="relative w-full max-w-lg bg-white p-6 sm:p-8"
      >
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-5 top-5 text-sage transition-colors hover:text-green">
          <X className="size-5" />
        </button>

        {sent ? (
          <div className="flex flex-col items-center py-8 text-center">
            <span className="mb-4 grid size-14 place-items-center rounded-full bg-green/10 text-green">
              <Check className="size-7" />
            </span>
            <h4 className="font-display text-[28px] font-medium text-green">Application Submitted!</h4>
            <p className="mt-2 max-w-xs text-[14px] text-sage">
              Thank you for applying for the {job.title} position. Our HR team will review your application shortly.
            </p>
          </div>
        ) : (
          <>
            <p className="text-[14px] font-medium uppercase tracking-[2px] text-gold">Apply for position</p>
            <h4 className="mt-1 font-display text-[clamp(24px,2vw,32px)] font-medium text-green">{job.title}</h4>
            <p className="mt-1 text-[13px] text-sage">
              {job.location} • {job.jobType} • {job.salaryRange}
            </p>
            <form onSubmit={submit} className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Full Name *" required placeholder="John Doe" className="sm:col-span-2" {...bind("name")} />
              <Field label="Email Address *" type="email" required placeholder="john@example.com" {...bind("email")} />
              <Field label="Phone Number *" type="tel" required placeholder="+880 1700 000000" {...bind("phone")} />
              <div className="relative sm:col-span-2">
                <Field
                  label="Resume / Portfolio Link *"
                  required
                  placeholder="Google Drive link or select a file"
                  value={form.resume}
                  onChange={(e) => {
                    if (resumeFile) setResumeFile(null);
                    setForm({ ...form, resume: e.target.value });
                  }}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 10 * 1024 * 1024) {
                      setError("Resume file must be 10 MB or smaller.");
                      e.target.value = "";
                      return;
                    }
                    setError(null);
                    setResumeFile(file);
                    setForm((f) => ({ ...f, resume: file.name }));
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Upload resume from device"
                  title="Upload resume (.pdf, .doc, .docx)"
                  className="absolute right-2.5 top-[32px] rounded-md p-1.5 text-sage transition-colors hover:bg-warm hover:text-green"
                >
                  <Upload className="size-4" />
                </button>
              </div>
              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className={FIELD_LABEL}>Cover Note (Optional)</span>
                <textarea
                  rows={3}
                  placeholder="Brief note about why you are interested in this role..."
                  className={cn(FIELD_CONTROL, "resize-none")}
                  {...bind("note")}
                />
              </label>
              {error && <p className="text-[13px] text-red-600 sm:col-span-2">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="press mt-2 h-12 rounded-full bg-green text-[14px] font-medium uppercase tracking-[2px] text-gold disabled:opacity-60 sm:col-span-2"
              >
                {submitting ? "Submitting..." : "Submit Application"}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}

export function CareerOpportunities() {
  const [filters, setFilters] = useState<Record<FilterKey, string | null>>({ department: null, jobType: null });
  const [departmentOptions, setDepartmentOptions] = useState<readonly string[]>(FILTERS.department.options);
  const [allJobs, setAllJobs] = useState<JobVacancy[]>([...INITIAL_JOBS, ...ADDITIONAL_JOBS]);
  const [showAll, setShowAll] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobVacancy | null>(null);
  const [activeJob, setActiveJob] = useState<JobVacancy | null>(null);

  useEffect(() => {
    let ignore = false;
    fetch(`${ERP_BASE_URL}/api/departments`, { headers: { Accept: "application/json" } })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((payload) => {
        if (ignore || !Array.isArray(payload?.data)) return;
        const names = payload.data
          .map((d: { name?: string }) => (typeof d?.name === "string" ? d.name.trim() : ""))
          .filter(Boolean);
        if (names.length > 0) setDepartmentOptions(Array.from(new Set(names)));
      })
      .catch((err) => console.warn("[CareerOpportunities] Failed to load departments, using fallback:", err));

    fetch(`${ERP_BASE_URL}/api/jobs`, { headers: { Accept: "application/json" } })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((payload) => {
        if (ignore || !Array.isArray(payload?.data)) return;
        const mapped: JobVacancy[] = payload.data.map(
          (item: {
            id: number | string;
            title?: string;
            department_name?: string;
            location?: string;
            employment_type?: string;
            salary_range?: string;
            deadline_formatted?: string;
            deadline?: string;
            description?: string;
            vacancies?: number;
          }) => ({
            id: String(item.id),
            title: item.title || "Untitled Position",
            department: item.department_name || "General",
            location: item.location || "Gulshan, Dhaka",
            jobType: item.employment_type || "Full Time",
            salaryRange: item.salary_range || "Negotiable",
            deadline: item.deadline_formatted || item.deadline || "",
            description: item.description,
            vacancies: item.vacancies,
          }),
        );
        setAllJobs(mapped);
      })
      .catch((err) => console.warn("[CareerOpportunities] Failed to load jobs, using fallback:", err));

    return () => {
      ignore = true;
    };
  }, []);

  const filteredJobs = allJobs.filter((job) =>
    (Object.keys(filters) as FilterKey[]).every((key) => !filters[key] || job[key] === filters[key]),
  );
  const jobs = showAll ? filteredJobs : filteredJobs.slice(0, 4);

  return (
    <section id="open-positions" aria-label="Current opportunities" className="scroll-mt-20 bg-[#f5f6f7] py-[clamp(64px,7.5vw,120px)]">
      <div className="shell flex flex-col items-center gap-12">
        <div className="flex w-full flex-col items-center gap-8">
          <SectionIntro title="Current Opportunities" />
          <div className="flex flex-wrap justify-center gap-4">
            {(Object.keys(FILTERS) as FilterKey[]).map((key) => (
              <FilterDropdown
                key={key}
                label={FILTERS[key].label}
                options={key === "department" ? departmentOptions : FILTERS[key].options}
                value={filters[key]}
                onChange={(value) => setFilters((f) => ({ ...f, [key]: value }))}
              />
            ))}
          </div>
        </div>

        <ul className="flex w-full flex-col gap-4">
          <AnimatePresence mode="popLayout">
            {jobs.map((job, i) => (
              <JobCard
                key={job.id}
                job={job}
                index={i % 4}
                onSelect={() => setSelectedJob(job)}
                onApply={() => setActiveJob(job)}
              />
            ))}
          </AnimatePresence>
          {jobs.length === 0 && (
            <li className="bg-white p-10 text-center text-[16px] text-sage">
              No vacancies match these filters.{" "}
              <button
                type="button"
                onClick={() => setFilters({ department: null, jobType: null })}
                className="font-medium text-green underline-offset-4 hover:underline"
              >
                Reset filters
              </button>
            </li>
          )}
        </ul>

        {!showAll && filteredJobs.length > 4 && (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="press relative h-14 rounded-full border border-gold bg-gold/15 px-10 text-[14px] font-medium uppercase tracking-[2px] text-[#2f3233] shadow-[0_12px_20px_0_rgba(108,73,19,0.1),inset_0_7px_21px_0_rgba(255,255,255,0.27),inset_0_-6px_21px_0_rgba(207,165,100,0.07)] backdrop-blur-[50px] hover:bg-gold/25 hover:tracking-[2.6px]"
          >
            <span className="trim leading-[1.7]">See more vacancies</span>
          </button>
        )}
      </div>

      <AnimatePresence>
        {selectedJob && (
          <JobDetailsModal
            key={`details-${selectedJob.id}`}
            job={selectedJob}
            onClose={() => setSelectedJob(null)}
            onApply={() => {
              const jobToApply = selectedJob;
              setSelectedJob(null);
              setActiveJob(jobToApply);
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>{activeJob && <ApplyModal key={activeJob.id} job={activeJob} onClose={() => setActiveJob(null)} />}</AnimatePresence>
    </section>
  );
}
