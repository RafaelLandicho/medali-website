"use client";

import * as React from "react";
import { Button } from "./ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "./ui/field";
import { ref, onValue } from "firebase/database";
import { db } from "@/firebaseConfig";
import { useAuth } from "@/auth/authprovider";
import { useNavigate } from "react-router-dom";

import homePic from "./images/home1.jpg";

import {
  Users,
  ClipboardList,
  Pill,
  BarChart2,
  UserCog,
  Activity,
  AlertTriangle,
  Biohazard,
  UtensilsCrossed,
  Clock,
  ArrowRight,
} from "lucide-react";

import { FullRecordsDrawer } from "./viewfull-records-drawer";
import type { Patient, MedicalRecord } from "./view-consultation-records";

// ─── Types ─────────────────────────────────────────────────────────────────────
type PatientRaw = {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
  birthdate?: string;
  address?: string;
  address1?: string;
  address2?: string;
  city?: string;
  province?: string;
  telephone?: string;
  addedBy?: string;
  createdAt?: number;
  records?: Record<string, any>;
};

// ─── Live patient card ─────────────────────────────────────────────────────────
function LivePatientCard() {
  const { user } = useAuth();
  const [patient, setPatient] = React.useState<PatientRaw | null>(null);
  const [latestRecord, setLatestRecord] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  React.useEffect(() => {
    if (!user) return;
    const patientsRef = ref(db, "patients");
    const unsub = onValue(patientsRef, (snap) => {
      const data = snap.val();
      if (!data) {
        setLoading(false);
        return;
      }

      let bestPatient: PatientRaw | null = null;
      let bestRecord: any = null;
      let bestTime = 0;

      Object.entries(data).forEach(([id, p]: [string, any]) => {
        if (!p.records) return;
        Object.values(p.records).forEach((r: any) => {
          const t = r.createdAt ?? 0;
          if (t > bestTime) {
            bestTime = t;
            bestRecord = r;
            bestPatient = { id, ...p };
          }
        });
      });

      setPatient(bestPatient);
      setLatestRecord(bestRecord);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  // Build the merged patient+record object for the drawer
  const drawerPatient = React.useMemo<(Patient & MedicalRecord) | null>(() => {
    if (!patient || !latestRecord) return null;
    const diagnosisData =
      latestRecord.diagnosis || latestRecord.patientDiagnosis || [];
    return {
      // Patient fields
      id: patient.id,
      firstName: patient.firstName,
      lastName: patient.lastName,
      gender: patient.gender,
      age: patient.age,
      birthdate: patient.birthdate ?? "",
      address: patient.address ?? "",
      address1: patient.address1 ?? "",
      address2: patient.address2 ?? "",
      city: patient.city ?? "",
      province: patient.province ?? "",
      telephone: patient.telephone ?? "",
      addedBy: patient.addedBy ?? "",

      recordId: latestRecord.recordId ?? latestRecord.id ?? "",
      recordNumber: latestRecord.recordNumber ?? 1,
      patientDiagnosis: Array.isArray(diagnosisData) ? diagnosisData : [],
      symptoms: latestRecord.symptoms,
      bloodPressure: latestRecord.bloodPressure,
      heartRate: latestRecord.heartRate,
      respiratoryRate: latestRecord.respiratoryRate,
      temperature: latestRecord.temperature,
      oxygenSaturation: latestRecord.oxygenSaturation,
      weight: latestRecord.weight,
      height: latestRecord.height,

      medicalCare:
        (patient as any).medicalCare ?? latestRecord.medicalCare ?? false,
      drugAllergy:
        (patient as any).drugAllergy ?? latestRecord.drugAllergy ?? false,
      foodAllergy:
        (patient as any).foodAllergy ?? latestRecord.foodAllergy ?? false,
      isTBPositive:
        (patient as any).isTBPositive ?? latestRecord.isTBPositive ?? false,
      hasClinician:
        (patient as any).hasClinician ?? latestRecord.hasClinician ?? false,
      diet: (patient as any).diet ?? latestRecord.diet ?? false,

      familyHistory: (patient as any).familyHistory,

      createdBy: latestRecord.createdBy,
      createdAt: latestRecord.createdAt,
      sharedWith: latestRecord.sharedWith,
      prescription: latestRecord.prescription,
    } as Patient & MedicalRecord;
  }, [patient, latestRecord]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 animate-pulse h-48 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#00c4b4]/30 border-t-[#00c4b4] rounded-full animate-spin" />
      </div>
    );
  }

  if (!patient || !latestRecord) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
        <ClipboardList className="w-10 h-10 text-white/20 mx-auto mb-3" />
        <p className="text-white/40 text-sm font-semibold">No records yet</p>
        <p className="text-white/25 text-xs mt-1">
          Add your first patient to get started
        </p>
      </div>
    );
  }

  const diagnoses: { diagnosis: string; severity: string }[] =
    latestRecord.diagnosis ?? latestRecord.patientDiagnosis ?? [];

  const timeAgo = latestRecord.createdAt
    ? (() => {
        const diff = Date.now() - latestRecord.createdAt;
        const mins = Math.floor(diff / 60000);
        const hrs = Math.floor(mins / 60);
        const days = Math.floor(hrs / 24);
        if (days > 0) return `${days}d ago`;
        if (hrs > 0) return `${hrs}h ago`;
        return `${mins}m ago`;
      })()
    : null;

  const SeverityBadge = ({ severity }: { severity: string }) => {
    const s = severity?.toLowerCase() ?? "";
    const color =
      s === "severe" || s === "critical"
        ? "bg-red-500/20 text-red-300 border-red-500/30"
        : s === "moderate"
          ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
          : "bg-green-500/20 text-green-300 border-green-500/30";
    return severity ? (
      <span
        className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide ${color}`}
      >
        {severity}
      </span>
    ) : null;
  };

  return (
    <>
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
        {/* Card header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/8 bg-[#00c4b4]/10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00c4b4] animate-pulse" />
            <span className="text-xs font-bold text-[#00c4b4] uppercase tracking-widest">
              Latest record update
            </span>
          </div>
          {timeAgo && (
            <div className="flex items-center gap-1 text-xs text-white/40 font-semibold">
              <Clock className="w-3 h-3" />
              {timeAgo}
            </div>
          )}
        </div>

        <div className="p-5 space-y-4">
          {/* Patient info */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xl font-extrabold text-white leading-tight">
                {patient.firstName} {patient.lastName}
              </p>
              <p className="text-sm text-white/50 font-semibold mt-0.5">
                {patient.age} yrs · {patient.gender}
              </p>
            </div>
            <div className="flex gap-1.5">
              {latestRecord.isTBPositive && (
                <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border bg-red-500/20 text-red-300 border-red-500/30">
                  <Biohazard className="w-2.5 h-2.5" /> TB+
                </span>
              )}
              {latestRecord.drugAllergy && (
                <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border bg-orange-500/20 text-orange-300 border-orange-500/30">
                  <AlertTriangle className="w-2.5 h-2.5" /> Drug
                </span>
              )}
              {latestRecord.foodAllergy && (
                <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                  <UtensilsCrossed className="w-2.5 h-2.5" /> Food
                </span>
              )}
            </div>
          </div>

          {/* Vitals row */}
          {(latestRecord.bloodPressure ||
            latestRecord.heartRate ||
            latestRecord.temperature ||
            latestRecord.oxygenSaturation) && (
            <div className="grid grid-cols-4 gap-2">
              {[
                {
                  label: "BP",
                  value: latestRecord.bloodPressure,
                  unit: "mmHg",
                },
                { label: "HR", value: latestRecord.heartRate, unit: "bpm" },
                {
                  label: "Temp",
                  value: latestRecord.temperature,
                  unit: "°C",
                },
                {
                  label: "SpO₂",
                  value: latestRecord.oxygenSaturation,
                  unit: "%",
                },
              ].map(({ label, value, unit }) =>
                value ? (
                  <div
                    key={label}
                    className="rounded-lg bg-white/5 border border-white/8 px-2 py-2 text-center"
                  >
                    <p className="text-[10px] text-white/40 font-bold uppercase">
                      {label}
                    </p>
                    <p className="text-sm font-extrabold text-white leading-tight">
                      {value}
                    </p>
                    <p className="text-[9px] text-white/30">{unit}</p>
                  </div>
                ) : null,
              )}
            </div>
          )}

          {/* Diagnoses */}
          {diagnoses.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                Diagnosis
              </p>
              {diagnoses.slice(0, 2).map((d, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00c4b4] flex-shrink-0" />
                  <span className="text-sm font-semibold text-white/80 truncate">
                    {d.diagnosis}
                  </span>
                  <SeverityBadge severity={d.severity} />
                </div>
              ))}
              {diagnoses.length > 2 && (
                <p className="text-xs text-white/30 pl-3.5">
                  +{diagnoses.length - 2} more
                </p>
              )}
            </div>
          )}

          {/* Symptoms */}
          {latestRecord.symptoms && (
            <div>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">
                Symptoms
              </p>
              <p className="text-sm text-white/60 font-semibold">
                {latestRecord.symptoms}
              </p>
            </div>
          )}

          {/* View button — opens FullRecordsDrawer instead of navigating */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#00c4b4]/15 border border-[#00c4b4]/30 text-[#00c4b4] text-sm font-bold hover:bg-[#00c4b4]/25 transition-colors"
          >
            View full record <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* FullRecordsDrawer — only mounted when we have the merged patient */}
      {drawerPatient && (
        <FullRecordsDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          patient={drawerPatient}
        />
      )}
    </>
  );
}

// ─── Quick action buttons ──────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  {
    label: "Patients",
    icon: Users,
    path: "/patients",
    color: "#378add",
    desc: "View & manage all patients",
  },
  {
    label: "Records",
    icon: ClipboardList,
    path: "/records",
    color: "#00a896",
    desc: "Consultation history",
  },
  {
    label: "Prescriptions",
    icon: Pill,
    path: "/prescriptions",
    color: "#8b5cf6",
    desc: "Issued prescriptions",
  },
  {
    label: "Analytics",
    icon: BarChart2,
    path: "/analytics",
    color: "#ef9f27",
    desc: "Trends & reports",
  },
  {
    label: "Users",
    icon: UserCog,
    path: "/users",
    color: "#d4537e",
    desc: "Doctors & secretaries",
  },
];

function QuickActions() {
  const navigate = useNavigate();
  return (
    <div className="grid grid-cols-3 gap-2">
      {QUICK_ACTIONS.map(({ label, icon: Icon, path, color, desc }) => (
        <button
          key={label}
          onClick={() => navigate(path)}
          className="group flex flex-col items-start gap-2 p-3 rounded-xl border border-white/8 bg-white/4 hover:bg-white/8 hover:border-white/15 transition-all text-left"
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: color + "20" }}
          >
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
          <div>
            <p className="text-xs font-bold text-white leading-none">{label}</p>
            <p className="text-[10px] text-white/40 mt-0.5 leading-tight">
              {desc}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}

export function Homepage() {
  const { user } = useAuth();

  return (
    <div className="w-full !bg-white text-[#e8edf5] font-sans">
      {/* ── HERO ── */}
      <section className="min-h-screen bg-[#080f1a] grid md:grid-cols-2 items-center px-10 md:px-14 py-24 gap-16 max-w-7xl mx-auto">
        {/* LEFT */}
        <div className="flex flex-col">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#00c4b4]/25 bg-[#00c4b4]/8 text-[#00c4b4] text-xs font-bold uppercase tracking-widest mb-6 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00c4b4] animate-pulse" />
            Medical Records Platform
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.07] tracking-tight text-white mb-6">
            Your clinic's records,{" "}
            <em className="not-italic text-[#00c4b4]">reimagined</em> for the
            digital age.
          </h1>

          <p className="text-lg text-white/60 leading-relaxed mb-10 max-w-md font-semibold">
            Medali centralizes patient records, prescriptions, and analytics
            into a single platform — so your team spends less time on paperwork
            and more time on care.
          </p>

          {user ? (
            <div className="space-y-4">
              <p className="text-sm font-bold text-white/40 uppercase tracking-widest">
                Quick access
              </p>
              <QuickActions />
            </div>
          ) : (
            <>
              <div className="flex max-w-md mb-8">
                <Field className="w-full">
                  <Input
                    placeholder="Your work email"
                    className="rounded-l-lg rounded-r-none h-12 text-base bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#00c4b4]"
                  />
                </Field>
                <Button className="h-12 px-6 rounded-l-none rounded-r-lg !bg-[#00c4b4] hover:bg-[#00a896] text-white font-bold text-base whitespace-nowrap">
                  Get started
                </Button>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {[
                  "Electronic Medical Records",
                  "Digital Prescriptions",
                  "Analytics Dashboard",
                  "Team Accounts",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 text-sm text-[#00c4b4]"
                  >
                    <span className="w-4 h-4 rounded-full bg-[#00c4b4]/15 flex items-center justify-center">
                      <svg
                        viewBox="0 0 10 10"
                        className="w-2.5 h-2.5"
                        fill="none"
                      >
                        <path
                          d="M2 5l2 2 4-4"
                          stroke="#04a093"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    {item}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* RIGHT */}
        <div className="flex flex-col gap-4">
          {user ? (
            <LivePatientCard />
          ) : (
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 bg-[#00c4b4]/10 blur-3xl rounded-full scale-75 pointer-events-none" />
              <img
                src={homePic}
                className="relative w-full max-w-xl rounded-2xl shadow-2xl border border-white/8"
                alt="Medali dashboard"
              />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
