"use client";

import * as React from "react";
import { Spinner } from "@/components/ui/spinner";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { SortingState, ColumnFiltersState } from "@tanstack/react-table";
import {
  ChevronDown,
  Search,
  Columns3,
  AlertTriangle,
  Biohazard,
  UtensilsCrossed,
  UserIcon,
  PillIcon,
  PenIcon,
  ClipboardList,
  Pill,
  TrendingUp,
  MapPin as MapPinIcon,
  Users as UsersIcon,
  Phone as PhoneIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

import { db } from "@/firebaseConfig";
import { ref, onValue } from "firebase/database";

import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/authprovider";
import { useIsMobile } from "@/hooks/use-mobile";
import { AddRecordsDrawer } from "./add-records-drawer";
import { FullRecordsDrawer } from "./viewfull-records-drawer";
import { FullPrescriptionDrawer } from "./view-full-prescription-drawer";
import { EditRecordsSheet } from "./edit-records-sheet";
import { PrescriptionDrawer } from "./add-prescription-drawer";
import { IconGenderAgender, IconNumber } from "@tabler/icons-react";

export type Prescription = {
  id?: string;
  createdAt?: string;
  doctorId?: string;
  patientFirstName?: string;
  patientLastName?: string;
  patientAddress?: string;
  patientAge?: number;
  patientGender?: string;
  diagnosis?: { diagnosis: string; severity: string; notes: string }[];
  examination?: string | number;
  recommendation?: string;
  drugs?: {
    medicine: string;
    dosage: string;
    unit: string;
    purpose: string;
    frequency: string;
  }[];
  addedBy?: string;
  field?: string;
  createdBy?: string;
  updatedAt?: string;
};

export type MedicalRecord = {
  recordId: string;
  recordNumber: number;
  patientDiagnosis: { diagnosis: string; severity: string; notes: string }[];
  addedBy: string;
  symptoms?: string;
  bloodPressure?: string;
  heartRate?: string;
  respiratoryRate?: string;
  temperature?: string;
  oxygenSaturation?: string;
  weight?: string;
  height?: string;
  medicalCare: boolean;
  drugAllergy: boolean;
  foodAllergy: boolean;
  isTBPositive: boolean;
  hasClinician: boolean;
  diet: boolean;
  createdBy?: string;
  createdAt?: number;
  updatedAt?: number;
  approvedBy?: string;
  linkId?: string | null;
  prescription?: Prescription;
};

export type Patient = {
  id: string;
  firstName: string;
  lastName: string;
  gender: string;
  age: number;
  birthdate: string;
  address: string;
  address1: string;
  address2: string;
  city: string;
  province: string;
  telephone: string;
  addedBy: string;
  medicalCare?: boolean;
  drugAllergy?: boolean;
  foodAllergy?: boolean;
  isTBPositive?: boolean;
  hasClinician?: boolean;
  diet?: boolean;
  symptoms?: string;
  familyHistory?: {
    relation: string;
    age: string;
    healthProblems: string;
    goodHealth: boolean;
    isAlive: boolean;
  }[];
};

type PatientWithRecord = Patient & MedicalRecord;

const healthHistory = [
  { key: "medicalCare", label: "Medical care" },
  { key: "drugAllergy", label: "Drug allergy" },
  { key: "foodAllergy", label: "Food allergy" },
  { key: "isTBPositive", label: "TB positive" },
  { key: "hasClinician", label: "Has clinician" },
  { key: "diet", label: "Restricted diet" },
] as const;

const PatientDetailsCard = ({ patient }: { patient: Patient }) => {
  const activeFlags = healthHistory.filter(
    (item) => !!patient[item.key as keyof Patient],
  );

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#00a896] text-white">
        <div className="flex items-center gap-2">
          <UserIcon className="w-4 h-4 opacity-80" />
          <span className="text-sm font-bold tracking-wide"></span>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-100">
          {[
            {
              label: "Gender",
              value: patient.gender,
            },
            {
              label: "Age",
              value: patient.age,
            },
            {
              label: "Birthdate",
              value: patient.birthdate,
            },
            {
              icon: <PhoneIcon className="w-3 h-3" />,
              label: "Phone",
              value: patient.telephone,
            },
            {
              icon: <MapPinIcon className="w-3 h-3" />,
              label: "City",
              value: patient.city,
            },
            {
              icon: <MapPinIcon className="w-3 h-3" />,
              label: "Province",
              value: patient.province,
            },
            {
              icon: <MapPinIcon className="w-3 h-3" />,
              label: "Address",
              value:
                [patient.address1, patient.address2]
                  .filter(Boolean)
                  .join(", ") || patient.address,
            },
          ].map(({ icon, label, value }) => (
            <div key={label} className="px-4 py-3">
              <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[#00a896] mb-0.5">
                {icon}
                {label}
              </div>
              <p className="text-sm font-semibold text-gray-800 truncate">
                {value || "—"}
              </p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
          <div className="px-4 py-3">
            <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[#00a896] mb-2">
              <AlertTriangle className="w-3 h-3" />
              Health Flags
            </div>
            {activeFlags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {activeFlags.map((item) => (
                  <span
                    key={item.key}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                    {item.label}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-xs text-gray-300 italic">
                No flags recorded
              </span>
            )}
          </div>

          {/* Family history — compact pill list */}
          <div className="px-4 py-3">
            <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[#00a896] mb-2">
              <UsersIcon className="w-3 h-3" />
              Family History
            </div>
            {patient.familyHistory && patient.familyHistory.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {patient.familyHistory.map((fh, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-100 text-xs"
                  >
                    <span className="font-semibold text-gray-700">
                      {fh.relation}
                    </span>
                    {fh.healthProblems && (
                      <>
                        <span className="text-gray-300">·</span>
                        <span className="text-gray-500 truncate max-w-[110px]">
                          {fh.healthProblems}
                        </span>
                      </>
                    )}
                    <span
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        fh.isAlive ? "bg-[#00a896]" : "bg-gray-300"
                      }`}
                      title={fh.isAlive ? "Alive" : "Deceased"}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-xs text-gray-300 italic">
                No family history recorded
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Vital config ─────────────────────────────────────────────────────────────

type VitalKey =
  | "symptoms"
  | "bloodPressure"
  | "heartRate"
  | "respiratoryRate"
  | "temperature"
  | "oxygenSaturation"
  | "weight"
  | "height";

const VITALS: { key: VitalKey; label: string; unit?: string; color: string }[] =
  [
    { key: "symptoms", label: "Symptoms", color: "#00c4b4" },
    { key: "bloodPressure", label: "BP", unit: "mmHg", color: "#00c4b4" },
    { key: "heartRate", label: "Heart Rate", unit: "bpm", color: "#00c4b4" },
    {
      key: "respiratoryRate",
      label: "Resp. Rate",
      unit: "br/min",
      color: "#00c4b4",
    },
    { key: "temperature", label: "Temperature", unit: "°C", color: "#00c4b4" },
    { key: "oxygenSaturation", label: "O₂ Sat", unit: "%", color: "#00c4b4" },
    { key: "weight", label: "Weight", unit: "kg", color: "#00c4b4" },
    { key: "height", label: "Height", unit: "cm", color: "#00c4b4" },
  ];

// ─── Sparkline ────────────────────────────────────────────────────────────────
// Algorithm derive from https://www.shadcn.io/blocks/tables-sparkline

const Sparkline = ({
  records,
  vitalKey,
  color,
  width = 52,
  height = 24,
  onClick,
}: {
  records: MedicalRecord[];
  vitalKey: VitalKey;
  color: string;
  width?: number;
  height?: number;
  onClick?: () => void;
}) => {
  const values = React.useMemo(() => {
    return [...records]
      .filter((r) => r[vitalKey] !== undefined && r[vitalKey] !== "")
      .sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0))
      .map((r) => parseFloat((r[vitalKey] as string).replace(/[^\d.]/g, "")))
      .filter((v) => !isNaN(v))
      .slice(-10);
  }, [records, vitalKey]);

  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pad = 2;
  const w = width - pad * 2;
  const h = height - pad * 2;

  const points = values
    .map((v, i) => {
      const x = pad + (i / (values.length - 1)) * w;
      const y = pad + h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(" ");

  const last = values[values.length - 1];
  const lastX = pad + w;
  const lastY = pad + h - ((last - min) / range) * h;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={
        onClick
          ? "cursor-pointer hover:opacity-70 transition-opacity flex-shrink-0"
          : "flex-shrink-0"
      }
      onClick={onClick}
      style={{ display: "inline-block", verticalAlign: "middle" }}
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity={0.65}
      />
      <circle cx={lastX} cy={lastY} r={2.5} fill={color} opacity={0.9} />
    </svg>
  );
};

// ─── Vital Trend Dialog ───────────────────────────────────────────────────────

const VitalTrendDialog = ({
  open,
  onOpenChange,
  vitalKey,
  label,
  color,
  records,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  vitalKey: VitalKey;
  label: string;
  color: string;
  records: MedicalRecord[];
}) => {
  const chartData = React.useMemo(() => {
    return [...records]
      .filter((r) => r[vitalKey] !== undefined && r[vitalKey] !== "")
      .sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0))
      .map((r, i) => {
        const raw = r[vitalKey] as string | undefined;
        const numeric = raw ? parseFloat(raw.replace(/[^\d.]/g, "")) : null;
        return {
          name: r.createdAt
            ? new Date(r.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })
            : `Record ${i + 1}`,
          value: numeric,
          raw,
          recordNumber: r.recordNumber ?? i + 1,
        };
      });
  }, [records, vitalKey]);

  const hasNumeric = chartData.some((d) => d.value !== null);
  const values = chartData
    .map((d) => d.value)
    .filter((v) => v !== null) as number[];
  const avg = values.length
    ? values.reduce((a, b) => a + b, 0) / values.length
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white border-gray-200 text-gray-800">
        <DialogHeader>
          <DialogTitle className="text-gray-800 flex items-center gap-2">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            {label}
          </DialogTitle>
          <DialogDescription className="text-gray-400 text-xs" />
        </DialogHeader>

        {chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm gap-2">
            <TrendingUp className="h-8 w-8 opacity-30" />
            <span>No {label.toLowerCase()} data recorded yet</span>
          </div>
        ) : !hasNumeric ? (
          <div className="space-y-2 py-2">
            <p className="text-xs text-gray-400 mb-3">
              This vital is recorded as text — showing chronological values:
            </p>
            {chartData.map((d, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
              >
                <span
                  className="mt-1 w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700">{d.raw || "—"}</p>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {d.name}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              {avg !== null && (
                <div className="flex flex-col items-center px-4 py-2 rounded-lg bg-gray-50 border border-gray-200">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                    Average
                  </span>
                  <span className="text-lg font-bold" style={{ color }}>
                    {avg.toFixed(1)}
                  </span>
                </div>
              )}
              {values.length > 0 && (
                <>
                  <div className="flex flex-col items-center px-4 py-2 rounded-lg bg-gray-50 border border-gray-200">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                      Min
                    </span>
                    <span className="text-lg font-bold text-gray-800">
                      {Math.min(...values).toFixed(1)}
                    </span>
                  </div>
                  <div className="flex flex-col items-center px-4 py-2 rounded-lg bg-gray-50 border border-gray-200">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                      Max
                    </span>
                    <span className="text-lg font-bold text-gray-800">
                      {Math.max(...values).toFixed(1)}
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart
                  data={chartData}
                  margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#9ca3af", fontSize: 10 }}
                    axisLine={{ stroke: "#e5e7eb" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#9ca3af", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                    domain={["auto", "auto"]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      color: "#111827",
                      fontSize: "12px",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                    }}
                    labelStyle={{ color: "#6b7280", marginBottom: 4 }}
                  />
                  {avg !== null && (
                    <ReferenceLine
                      y={avg}
                      stroke={color}
                      strokeDasharray="4 4"
                      strokeOpacity={0.5}
                      label={{
                        value: "avg",
                        fill: color,
                        fontSize: 9,
                        position: "insideTopRight",
                      }}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={color}
                    strokeWidth={2}
                    dot={{ r: 4, fill: color, strokeWidth: 0 }}
                    activeDot={{
                      r: 6,
                      fill: color,
                      stroke: "#ffffff",
                      strokeWidth: 2,
                    }}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200 bg-[#1a1a2e]">
                    <th className="text-left px-3 py-2 text-gray-100 font-medium uppercase tracking-wider text-[10px]">
                      Date
                    </th>
                    <th className="text-right px-3 py-2 text-gray-100 font-medium uppercase tracking-wider text-[10px]">
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((d, i) => (
                    <tr
                      key={i}
                      className={`border-b border-gray-100 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/40"}`}
                    >
                      <td className="px-3 py-2 text-gray-500">{d.name}</td>
                      <td className="px-3 py-2 text-right font-semibold text-gray-800">
                        {d.raw || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// ─── Sparkline cell ───────────────────────────────────────────────────────────

const SparklineCell = ({
  vital,
  records,
}: {
  vital: (typeof VITALS)[number];
  records: MedicalRecord[];
}) => {
  const [open, setOpen] = React.useState(false);

  const numericCount = React.useMemo(
    () =>
      records
        .filter((r) => r[vital.key] !== undefined && r[vital.key] !== "")
        .map((r) => parseFloat((r[vital.key] as string).replace(/[^\d.]/g, "")))
        .filter((v) => !isNaN(v)).length,
    [records, vital.key],
  );

  if (numericCount < 2) return null;

  return (
    <>
      <Sparkline
        records={records}
        vitalKey={vital.key}
        color={vital.color}
        width={72}
        height={28}
        onClick={() => setOpen(true)}
      />
      {open && (
        <VitalTrendDialog
          open={open}
          onOpenChange={setOpen}
          vitalKey={vital.key}
          label={vital.label}
          color={vital.color}
          records={records}
        />
      )}
    </>
  );
};

// ─── VitalsGrid (mobile) ──────────────────────────────────────────────────────

const VitalsGrid = ({
  record,
  allRecords,
  patientName,
}: {
  record: MedicalRecord;
  allRecords: MedicalRecord[];
  patientName: string;
}) => {
  const [activeVital, setActiveVital] = React.useState<{
    key: VitalKey;
    label: string;
    unit?: string;
    color: string;
  } | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        {VITALS.map(({ key, label, unit, color }) => {
          const value = record[key] as string | undefined;
          const hasData = allRecords.some(
            (r) => r[key] !== undefined && r[key] !== "",
          );
          return (
            <div key={key}>
              <button
                onClick={() =>
                  hasData && setActiveVital({ key, label, unit, color })
                }
                className={`text-left group flex items-center gap-1 transition-colors ${
                  hasData ? "cursor-pointer hover:opacity-80" : "cursor-default"
                }`}
                title={
                  hasData ? `View ${label} trend across all records` : undefined
                }
              >
                <span
                  className="text-gray-400 group-hover:underline"
                  style={hasData ? { color } : undefined}
                >
                  {label}
                </span>
                {hasData && (
                  <TrendingUp
                    className="w-2.5 h-2.5 opacity-50 group-hover:opacity-100 transition-opacity"
                    style={{ color }}
                  />
                )}
              </button>
              <p className="text-gray-700 font-medium truncate">
                {value || "—"}
              </p>
            </div>
          );
        })}
      </div>

      {activeVital && (
        <VitalTrendDialog
          open={true}
          onOpenChange={(v) => !v && setActiveVital(null)}
          vitalKey={activeVital.key}
          label={activeVital.label}
          color={activeVital.color}
          records={allRecords}
        />
      )}
    </>
  );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const disableEdit = (record: MedicalRecord): boolean => {
  if (!record.createdAt) return false;
  const hoursDiff =
    (Date.now() - new Date(record.createdAt).getTime()) / (1000 * 60 * 60);
  return hoursDiff >= 24;
};

const formatDate = (value?: number | string): string => {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return typeof value === "string" ? value : "—";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const StatCard = ({
  label,
  value,
  icon,
  color,
  bg,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bg: string;
}) => (
  <div className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 px-4 py-2.5 sm:py-3 shadow-sm">
    <div className={`p-1.5 sm:p-2 rounded-md ${bg} ${color}`}>{icon}</div>
    <div>
      <p className="text-lg sm:text-xl font-bold text-gray-800 leading-none">
        {label}
        {value}
      </p>
    </div>
  </div>
);

const SeverityBadge = ({ severity }: { severity: string }) => {
  const s = severity?.toLowerCase() ?? "";
  const styles =
    s === "severe" || s === "critical"
      ? "bg-red-100 text-red-700 border-red-200"
      : s === "moderate"
        ? "bg-amber-100 text-amber-700 border-amber-200"
        : s === "mild" || s === "low"
          ? "bg-green-100 text-green-700 border-green-200"
          : "bg-gray-100 text-gray-500 border-gray-200";
  if (!severity) return null;
  return (
    <span
      className={`inline-block px-1.5 py-0.5 text-[10px] font-semibold rounded border uppercase tracking-wide ${styles}`}
    >
      {severity}
    </span>
  );
};

const RiskIndicators = ({ record }: { record: MedicalRecord }) => (
  <div className="flex items-center gap-1 flex-wrap">
    {record.isTBPositive && (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-700 border border-red-200">
        <Biohazard className="w-2.5 h-2.5" /> TB+
      </span>
    )}
    {record.drugAllergy && (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-orange-100 text-orange-700 border border-orange-200">
        <AlertTriangle className="w-2.5 h-2.5" /> Drug Allergy
      </span>
    )}
    {record.foodAllergy && (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-yellow-100 text-yellow-700 border border-yellow-200">
        <UtensilsCrossed className="w-2.5 h-2.5" /> Food Allergy
      </span>
    )}
    {!record.isTBPositive && !record.drugAllergy && !record.foodAllergy && (
      <span className="text-gray-300 text-xs">—</span>
    )}
  </div>
);

// ─── Action components ────────────────────────────────────────────────────────

const ConsultationRecordActions = ({ records }: { records: MedicalRecord }) => {
  const { user } = useAuth();
  const location = useLocation();
  const patient = location.state as Patient | null;
  const [openUser, setOpenUser] = React.useState(false);
  const [openPrescription, setOpenPrescription] = React.useState(false);
  const [openEdit, setOpenEdit] = React.useState(false);
  const [hasPrescription, setHasPrescription] = React.useState(false);
  const isExpired = React.useMemo(() => disableEdit(records), [records]);

  React.useEffect(() => {
    if (!patient?.id || !records.recordId) return;
    const prescriptionRef = ref(
      db,
      `patients/${patient.id}/records/${records.recordId}/prescription`,
    );
    const unsub = onValue(prescriptionRef, (snapshot) => {
      setHasPrescription(snapshot.exists());
    });
    return () => unsub();
  }, [patient?.id, records.recordId]);

  const userIsDoctor = user?.type?.toLowerCase() === "doctor";
  if (!patient) return null;

  const patientWithRecord: PatientWithRecord = {
    ...patient,
    ...records,
    id: patient.id,
    recordId: records.recordId,
    addedBy: patient.addedBy,
  };

  return (
    <div className="flex items-center gap-1">
      {/* View — always visible */}
      <button
        onClick={() => setOpenUser(true)}
        title="View patient record"
        className="inline-flex items-center justify-center w-7 h-7 rounded border border-gray-200 !bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors"
      >
        <UserIcon className="w-3.5 h-3.5 text-[#00a896]" />
      </button>
      <FullRecordsDrawer
        open={openUser}
        onOpenChange={setOpenUser}
        patient={patientWithRecord}
      />

      {/* Edit pen — hidden when expired */}
      {!isExpired && (
        <>
          <button
            onClick={() => setOpenEdit(true)}
            title="Edit record"
            className="inline-flex items-center justify-center w-7 h-7 rounded border border-gray-200 !bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            <PenIcon className="w-3.5 h-3.5 text-[#00a896]" />
          </button>
          <EditRecordsSheet
            open={openEdit}
            onOpenChange={setOpenEdit}
            patient={patientWithRecord}
          />
        </>
      )}

      {userIsDoctor && !isExpired && (
        <>
          <button
            onClick={() => setOpenPrescription(true)}
            title={
              hasPrescription ? "View / Edit Prescription" : "Add Prescription"
            }
            className={`inline-flex items-center justify-center w-7 h-7 rounded border transition-colors ${
              hasPrescription
                ? "border-gray-200 !bg-green-100 hover:bg-green-50"
                : "border-gray-200 !bg-white hover:bg-gray-50 hover:border-gray-300"
            }`}
          >
            <PillIcon
              className={`w-3.5 h-3.5 ${hasPrescription ? "text-green-600" : "text-[#00a896]"}`}
            />
          </button>
          <PrescriptionDrawer
            open={openPrescription}
            onOpenChange={setOpenPrescription}
            patient={patientWithRecord}
            readOnly={false}
          />
        </>
      )}
    </div>
  );
};

const PrescriptionRecordActions = ({ record }: { record: MedicalRecord }) => {
  const { user } = useAuth();
  const location = useLocation();
  const patient = location.state as Patient | null;
  const [openView, setOpenView] = React.useState(false);
  const [openEdit, setOpenEdit] = React.useState(false);
  const isExpired = React.useMemo(() => disableEdit(record), [record]);

  const userIsDoctor =
    user?.type?.toLowerCase() === "doctor" ||
    user?.type?.toLowerCase() === "admin";
  if (!patient) return null;

  const patientWithRecord: PatientWithRecord = {
    ...patient,
    ...record,
    id: patient.id,
    recordId: record.recordId,
    addedBy: patient.addedBy,
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => setOpenView(true)}
        title="View prescription"
        className="inline-flex items-center justify-center w-7 h-7 rounded border border-gray-200 !bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors"
      >
        <PillIcon className="w-3.5 h-3.5 text-[#00a896]" />
      </button>
      <FullPrescriptionDrawer
        open={openView}
        onOpenChange={setOpenView}
        patient={patientWithRecord}
      />

      {/* Edit pen — hidden when expired */}
      {userIsDoctor && !isExpired && (
        <>
          <button
            onClick={() => setOpenEdit(true)}
            title="Edit prescription"
            className="inline-flex items-center justify-center w-7 h-7 rounded border border-gray-200 !bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            <PenIcon className="w-3.5 h-3.5 text-[#00a896]" />
          </button>
          <PrescriptionDrawer
            open={openEdit}
            onOpenChange={setOpenEdit}
            patient={patientWithRecord}
            readOnly={false}
          />
        </>
      )}
    </div>
  );
};

// ─── Column definitions ───────────────────────────────────────────────────────

function makeVitalColumn(
  vital: (typeof VITALS)[number],
): ColumnDef<MedicalRecord> {
  return {
    accessorKey: vital.key,
    header: vital.label,
    cell: ({ row }) => (
      <span className="text-sm text-gray-700 tabular-nums">
        {(row.original[vital.key] as string | undefined) || "—"}
      </span>
    ),
  };
}

const buildColumns = (): ColumnDef<MedicalRecord>[] => [
  {
    id: "actions",
    header: "",
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }) => <ConsultationRecordActions records={row.original} />,
  },
  {
    accessorKey: "patientDiagnosis",
    header: "Diagnosis",
    filterFn: (row, _id, filterValue) => {
      if (!filterValue) return true;
      const diagnoses = row.original.patientDiagnosis || [];
      const searchTerm = String(filterValue).toLowerCase();
      return diagnoses.some(
        (d) =>
          d.diagnosis.toLowerCase().includes(searchTerm) ||
          d.severity?.toLowerCase().includes(searchTerm) ||
          d.notes?.toLowerCase().includes(searchTerm),
      );
    },
    cell: ({ row }) => {
      const diagnosis = row.original.patientDiagnosis;
      if (!diagnosis?.length)
        return <span className="text-gray-300 text-xs">No diagnosis</span>;
      return (
        <div className="space-y-1.5 max-w-[280px]">
          {diagnosis.map((diag, i) => (
            <div key={i} className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-gray-800">
                {diag.diagnosis}
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <SeverityBadge severity={diag.severity} />
                {diag.notes && (
                  <span className="text-[11px] text-gray-400 italic">
                    {diag.notes}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      );
    },
  },
  {
    accessorKey: "symptoms",
    header: "Symptoms",
    cell: ({ row }) => (
      <span className="text-sm text-gray-700">
        {row.original.symptoms || "—"}
      </span>
    ),
  },
  ...VITALS.filter((v) => v.key !== "symptoms").map((vital) =>
    makeVitalColumn(vital),
  ),
  {
    id: "risks",
    header: "Risk Flags",
    enableSorting: false,
    cell: ({ row }) => <RiskIndicators record={row.original} />,
  },
  {
    accessorKey: "createdBy",
    header: "Created By",
    cell: ({ row }) => (
      <span className="text-sm text-gray-700">
        {row.original.createdBy || row.original.addedBy || "—"}
      </span>
    ),
  },
  {
    accessorKey: "addedBy",
    header: "Added By",
    cell: ({ row }) => (
      <span className="text-sm text-gray-700">
        {row.original.addedBy || "—"}
      </span>
    ),
  },
  {
    accessorKey: "approvedBy",
    header: "Approved By",
    cell: ({ row }) => (
      <span className="text-sm text-gray-700">
        {row.original.approvedBy || "—"}
      </span>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    sortingFn: (a, b) =>
      (a.original.createdAt ?? 0) - (b.original.createdAt ?? 0),
    cell: ({ row }) => (
      <span className="text-xs text-gray-500 whitespace-nowrap">
        {formatDate(row.original.createdAt)}
      </span>
    ),
  },
  {
    accessorKey: "updatedAt",
    header: "Updated At",
    sortingFn: (a, b) =>
      (a.original.updatedAt ?? a.original.createdAt ?? 0) -
      (b.original.updatedAt ?? b.original.createdAt ?? 0),
    cell: ({ row }) => (
      <span className="text-xs text-gray-500 whitespace-nowrap">
        {formatDate(row.original.updatedAt ?? row.original.createdAt)}
      </span>
    ),
  },
];

const prescriptionColumns: ColumnDef<MedicalRecord>[] = [
  {
    id: "actions",
    header: "",
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }) => <PrescriptionRecordActions record={row.original} />,
  },
  {
    id: "diagnosis",
    header: "Diagnosis",
    filterFn: (row, _id, filterValue) => {
      if (!filterValue) return true;
      const diagnoses = row.original.prescription?.diagnosis || [];
      const searchTerm = String(filterValue).toLowerCase();
      return diagnoses.some(
        (d) =>
          d.diagnosis?.toLowerCase().includes(searchTerm) ||
          d.severity?.toLowerCase().includes(searchTerm) ||
          d.notes?.toLowerCase().includes(searchTerm),
      );
    },
    cell: ({ row }) => {
      const diagnosis = row.original.prescription?.diagnosis;
      if (!diagnosis?.length)
        return <span className="text-gray-300 text-xs">No diagnosis</span>;
      return (
        <div className="space-y-1.5 max-w-[260px]">
          {diagnosis.map((diag, i) => (
            <div key={i} className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-gray-800">
                {diag.diagnosis}
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <SeverityBadge severity={diag.severity} />
                {diag.notes && (
                  <span className="text-[11px] text-gray-400 italic">
                    {diag.notes}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      );
    },
  },
  {
    id: "drugs",
    header: "Drugs",
    enableSorting: false,
    filterFn: (row, _id, filterValue) => {
      if (!filterValue) return true;
      const drugs = row.original.prescription?.drugs || [];
      const searchTerm = String(filterValue).toLowerCase();
      return drugs.some(
        (d) =>
          d.medicine?.toLowerCase().includes(searchTerm) ||
          d.purpose?.toLowerCase().includes(searchTerm),
      );
    },
    cell: ({ row }) => {
      const drugs = row.original.prescription?.drugs;
      if (!drugs?.length)
        return <span className="text-gray-300 text-xs">None</span>;
      return (
        <div className="space-y-1 max-w-[220px]">
          {drugs.map((drug, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-[#00a896] shrink-0" />
              <div className="text-xs leading-snug">
                <span className="font-medium text-gray-800">
                  {drug.medicine}
                </span>
                <span className="text-gray-400">
                  {" "}
                  · {drug.dosage}
                  {drug.unit}
                </span>
                {drug.frequency && (
                  <span className="text-gray-400"> · {drug.frequency}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      );
    },
  },
  {
    id: "examination",
    header: "Examination",
    cell: ({ row }) => (
      <p className="text-xs text-gray-600 max-w-[200px] line-clamp-2">
        {row.original.prescription?.examination || (
          <span className="text-gray-300">—</span>
        )}
      </p>
    ),
  },
  {
    id: "recommendation",
    header: "Recommendation",
    cell: ({ row }) => (
      <p className="text-xs text-gray-600 max-w-[200px] line-clamp-2">
        {row.original.prescription?.recommendation || (
          <span className="text-gray-300">—</span>
        )}
      </p>
    ),
  },
  {
    id: "createdBy",
    header: "Created By",
    cell: ({ row }) => (
      <span className="text-sm text-gray-700">
        {row.original.prescription?.createdBy ||
          row.original.prescription?.addedBy ||
          "—"}
      </span>
    ),
  },
  {
    id: "addedBy",
    header: "Added By",
    cell: ({ row }) => (
      <span className="text-sm text-gray-700">
        {row.original.prescription?.addedBy || "—"}
      </span>
    ),
  },

  {
    id: "createdAt",
    header: "Created At",
    sortingFn: (a, b) =>
      (a.original.createdAt ?? 0) - (b.original.createdAt ?? 0),
    cell: ({ row }) => (
      <span className="text-xs text-gray-500 whitespace-nowrap">
        {formatDate(row.original.createdAt)}
      </span>
    ),
  },
  {
    id: "updatedAt",
    header: "Updated At",
    sortingFn: (a, b) => {
      const av = a.original.prescription?.updatedAt ?? a.original.updatedAt;
      const bv = b.original.prescription?.updatedAt ?? b.original.updatedAt;
      return new Date(av ?? 0).getTime() - new Date(bv ?? 0).getTime();
    },
    cell: ({ row }) => (
      <span className="text-xs text-gray-500 whitespace-nowrap">
        {row.original.prescription?.updatedAt ||
          formatDate(row.original.updatedAt) ||
          "—"}
      </span>
    ),
  },
];

// ─── Main component ───────────────────────────────────────────────────────────

export function ConsultationRecords() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const location = useLocation();
  const [openUser, setOpenUser] = React.useState(false);

  const patient = location.state as Patient | null;
  const [records, setRecords] = React.useState<MedicalRecord[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "updatedAt", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] = React.useState<
    Record<string, boolean>
  >({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [searchValue, setSearchValue] = React.useState("");

  const [prescSorting, setPrescSorting] = React.useState<SortingState>([
    { id: "updatedAt", desc: true },
  ]);
  const [prescColumnFilters, setPrescColumnFilters] =
    React.useState<ColumnFiltersState>([]);
  const [prescColumnVisibility, setPrescColumnVisibility] = React.useState<
    Record<string, boolean>
  >({});
  const [prescRowSelection, setPrescRowSelection] = React.useState({});
  const [prescSearchValue, setPrescSearchValue] = React.useState("");

  React.useEffect(() => {
    if (!user || !patient?.id) return;
    let innerUnsub: (() => void) | undefined;

    const outerUnsub = onValue(ref(db, "users"), (usersSnap) => {
      innerUnsub?.();
      const usersData = usersSnap.val() || {};
      const currentUser = usersData[user.uid];
      if (!currentUser) {
        setLoading(false);
        return;
      }

      // Build the same linked-user group used for the patients list,
      // so secretaries/staff linked to a doctor see that doctor's records too.
      const linkedUsers: string[] = [];
      if (currentUser.linkId) {
        for (const uid in usersData) {
          if (usersData[uid].linkId === currentUser.linkId) {
            linkedUsers.push(uid);
          }
        }
      } else {
        linkedUsers.push(user.uid);
      }

      const isAdmin = currentUser.type?.toLowerCase() === "admin";

      innerUnsub = onValue(
        ref(db, `patients/${patient.id}/records`),
        (snapshot) => {
          const raw = snapshot.val();
          const fetched: MedicalRecord[] = raw
            ? Object.entries(raw)
                .map(([id, value]: [string, any]) => {
                  const diagnosisData =
                    value.diagnosis || value.patientDiagnosis || [];
                  return {
                    id,
                    recordId: value.recordId || id,
                    ...value,
                    patientDiagnosis: Array.isArray(diagnosisData)
                      ? diagnosisData
                      : [],
                    createdAt: value.createdAt || Date.now(),
                    updatedAt: value.updatedAt || value.createdAt || Date.now(),
                  };
                })
                .filter((record) => {
                  if (isAdmin) return true;
                  // Visible if created by the current user, by anyone in the
                  // same linked group, or (legacy records) tagged with a
                  // matching linkId directly.
                  return (
                    linkedUsers.includes(record.createdBy) ||
                    (!!record.linkId &&
                      !!currentUser.linkId &&
                      record.linkId === currentUser.linkId)
                  );
                })
                .sort(
                  (a, b) =>
                    (b.updatedAt ?? b.createdAt ?? 0) -
                    (a.updatedAt ?? a.createdAt ?? 0),
                )
            : [];
          setRecords(fetched);
          setLoading(false);
        },
      );
    });

    return () => {
      outerUnsub();
      innerUnsub?.();
    };
  }, [user, patient?.id]);

  const patientName = patient ? `${patient.firstName} ${patient.lastName}` : "";
  const columns = React.useMemo(() => buildColumns(), []);

  const table = useReactTable({
    data: records,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: { sorting, columnFilters, columnVisibility, rowSelection },
    initialState: { pagination: { pageSize: isMobile ? 8 : 10 } },
  });

  const prescriptionRecords = React.useMemo(
    () =>
      records
        .filter((r) => !!r.prescription)
        .sort((a, b) => {
          const av = a.prescription?.updatedAt
            ? new Date(a.prescription.updatedAt).getTime()
            : (a.updatedAt ?? a.createdAt ?? 0);
          const bv = b.prescription?.updatedAt
            ? new Date(b.prescription.updatedAt).getTime()
            : (b.updatedAt ?? b.createdAt ?? 0);
          return bv - av;
        }),
    [records],
  );

  const prescriptionTable = useReactTable({
    data: prescriptionRecords,
    columns: prescriptionColumns,
    onSortingChange: setPrescSorting,
    onColumnFiltersChange: setPrescColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setPrescColumnVisibility,
    onRowSelectionChange: setPrescRowSelection,
    state: {
      sorting: prescSorting,
      columnFilters: prescColumnFilters,
      columnVisibility: prescColumnVisibility,
      rowSelection: prescRowSelection,
    },
    initialState: { pagination: { pageSize: isMobile ? 8 : 10 } },
  });

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-gray-500 text-sm gap-3">
        <p>No patient selected.</p>
        <button
          onClick={() => navigate(-1)}
          className="text-[#00a896] underline text-sm"
        >
          Go back
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-10 text-gray-500 text-sm gap-2">
        <Spinner className="w-5 h-5" />
        <span>Loading consultation records…</span>
      </div>
    );
  }

  const filteredRows = table.getFilteredRowModel().rows;
  const prescFilteredRows = prescriptionTable.getFilteredRowModel().rows;

  const SparklineRow = () => {
    const visibleHeaders = table.getHeaderGroups()[0]?.headers ?? [];
    const SPARKLINE_EXCLUDED: VitalKey[] = ["symptoms", "bloodPressure"];
    const hasAnySpark = visibleHeaders.some((h) =>
      VITALS.find(
        (v) => !SPARKLINE_EXCLUDED.includes(v.key) && v.key === h.column.id,
      ),
    );
    if (!hasAnySpark || records.length < 2) return null;
    return (
      <TableRow className="border-b-2 border-[#00a896]/20 bg-[#f0faf9] hover:bg-[#e8f7f5]">
        {visibleHeaders.map((header) => {
          const vital = VITALS.find(
            (v) =>
              !SPARKLINE_EXCLUDED.includes(v.key) && v.key === header.column.id,
          );
          return (
            <TableCell key={header.id} className="py-2 px-3 align-middle">
              {vital ? <SparklineCell vital={vital} records={records} /> : null}
            </TableCell>
          );
        })}
      </TableRow>
    );
  };

  const Toolbar = (
    <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
      <div className="relative flex-1 sm:max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search by diagnosis…"
          value={searchValue}
          onChange={(e) => {
            setSearchValue(e.target.value);
            table
              .getColumn("patientDiagnosis")
              ?.setFilterValue(e.target.value || undefined);
          }}
          className="w-full pl-8 pr-3 py-2 text-sm !bg-white border border-gray-200 rounded-lg shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00a896]/40 focus:border-[#00a896] transition"
        />
      </div>
      {!isMobile && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium !bg-[#00a896] !text-white rounded-lg shadow-sm hover:opacity-90 transition">
              <Columns3 className="w-3.5 h-3.5" />
              Columns
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel className="text-xs text-gray-400">
              Toggle columns
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {table
              .getAllColumns()
              .filter((col) => col.getCanHide())
              .map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  className="capitalize text-sm"
                  checked={col.getIsVisible()}
                  onCheckedChange={(val) => col.toggleVisibility(val)}
                >
                  {col.id === "patientDiagnosis"
                    ? "Diagnosis"
                    : col.id
                        .replace(/([A-Z])/g, " $1")
                        .replace(/^./, (s) => s.toUpperCase())}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );

  const makePagination = (
    tbl: ReturnType<typeof useReactTable<any>>,
    count: number,
    emptyLabel: string,
  ) => (
    <div className="flex items-center justify-between pt-1 text-xs text-gray-500">
      <span>
        {count === 0
          ? emptyLabel
          : `${tbl.getState().pagination.pageIndex * tbl.getState().pagination.pageSize + 1}–${Math.min(
              (tbl.getState().pagination.pageIndex + 1) *
                tbl.getState().pagination.pageSize,
              count,
            )} of ${count}`}
      </span>
      <div className="flex gap-1.5 items-center">
        <button
          onClick={() => tbl.previousPage()}
          disabled={!tbl.getCanPreviousPage()}
          className="px-3 py-1.5 text-xs font-medium rounded border !bg-[#00a896] !text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          ← {isMobile ? "" : "Previous"}
        </button>
        <span className="px-2">
          {tbl.getState().pagination.pageIndex + 1} / {tbl.getPageCount() || 1}
        </span>
        <button
          onClick={() => tbl.nextPage()}
          disabled={!tbl.getCanNextPage()}
          className="px-3 py-1.5 text-xs font-medium rounded border !bg-[#00a896] !text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {isMobile ? "" : "Next"} →
        </button>
      </div>
    </div>
  );

  const EmptyPrescriptions = (
    <div className="rounded-xl border border-gray-200 bg-white p-10 flex flex-col items-center justify-center text-center gap-2">
      <div className="w-10 h-10 rounded-lg bg-[#00a896]/10 flex items-center justify-center">
        <Pill className="w-5 h-5 text-[#00a896]" />
      </div>
      <p className="text-sm font-medium text-gray-700">No prescriptions yet</p>
      <p className="text-xs text-gray-400 max-w-xs">
        Prescriptions added from a consultation record will appear here.
      </p>
    </div>
  );

  const EmptyConsultation = (
    <div className="rounded-xl border border-gray-200 bg-white p-10 flex flex-col items-center justify-center text-center gap-2">
      <div className="w-10 h-10 rounded-lg bg-[#00a896]/10 flex items-center justify-center">
        <ClipboardList className="w-5 h-5 text-[#00a896]" />
      </div>
      <p className="text-sm font-medium text-gray-700">
        No consultation records yet
      </p>
      <p className="text-xs text-gray-400 max-w-xs">
        Consultation Records created for your patient will appear here.
      </p>
    </div>
  );

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-5 bg-gray-50 min-h-screen">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 tracking-tight">
            {patientName}
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
            Consultation Records
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 text-sm font-semibold text-white !bg-[#00a896] rounded-lg shadow hover:opacity-90 transition"
          >
            ← {isMobile ? "Back" : "Back to Records"}
          </button>
        </div>
      </div>

      {/* ── Compact patient details card ── */}
      <PatientDetailsCard patient={patient} />

      <Tabs defaultValue="records" className="w-full">
        <TabsList className="!bg-gray-100">
          <TabsTrigger
            value="records"
            className="flex items-center gap-1.5 !bg-white text-black"
          >
            <ClipboardList className="w-3.5 h-3.5" />
            Consultation Records
          </TabsTrigger>
          <TabsTrigger
            value="prescriptions"
            className="flex items-center gap-1.5 !bg-white text-black"
          >
            <Pill className="w-3.5 h-3.5" />
            Prescriptions
          </TabsTrigger>
        </TabsList>

        {/* ── Consultation Records Tab ── */}
        <TabsContent value="records" className="flex flex-col gap-4 mt-4">
          <StatCard
            label="Total Records: "
            value={records.length}
            icon={<ClipboardList className="w-4 h-4" />}
            color="text-[#00a896]"
            bg="bg-[#00a896]/10"
          />
          <div className="items-end gap-2">
            <button
              onClick={() => setOpenUser(true)}
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 text-sm font-semibold text-white !bg-[#00a896] rounded-lg shadow hover:opacity-90 transition"
            >
              + Add New Record
            </button>
            <AddRecordsDrawer
              open={openUser}
              onOpenChange={setOpenUser}
              patient={patient}
            />
          </div>
          {Toolbar}

          {isMobile ? (
            <>
              {filteredRows.length === 0 ? (
                EmptyConsultation
              ) : (
                <div className="flex flex-col gap-3">
                  {table.getRowModel().rows.map((row) => {
                    const r = row.original;
                    return (
                      <div
                        key={row.id}
                        className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 space-y-3"
                      >
                        <div>
                          <p className="text-[10px] uppercase text-gray-400 font-semibold mb-1">
                            Diagnosis
                          </p>
                          {r.patientDiagnosis?.length ? (
                            r.patientDiagnosis.map((diag, i) => (
                              <div key={i} className="mb-1">
                                <p className="text-sm font-medium text-gray-800">
                                  {diag.diagnosis}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                  <SeverityBadge severity={diag.severity} />
                                  {diag.notes && (
                                    <span className="text-[11px] text-gray-400 italic">
                                      {diag.notes}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            <span className="text-gray-300 text-xs">
                              No diagnosis
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-gray-400 font-semibold mb-1">
                            Risk Flags
                          </p>
                          <RiskIndicators record={r} />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-gray-400 font-semibold mb-1.5 flex items-center gap-1">
                            Vitals
                            <span className="text-gray-300 font-normal normal-case tracking-normal">
                              · tap label to see trend
                            </span>
                          </p>
                          <VitalsGrid
                            record={r}
                            allRecords={records}
                            patientName={patientName}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-2 border-t border-gray-100 text-[11px] text-gray-500">
                          <div>
                            <span className="text-gray-400">Created</span>
                            <p className="text-gray-700 font-medium">
                              {formatDate(r.createdAt)}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-400">Updated</span>
                            <p className="text-gray-700 font-medium">
                              {formatDate(r.updatedAt ?? r.createdAt)}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-400">Created by</span>
                            <p className="text-gray-700 font-medium truncate">
                              {r.createdBy || r.addedBy || "—"}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-400">Approved by</span>
                            <p className="text-gray-700 font-medium truncate">
                              {r.approvedBy || "—"}
                            </p>
                          </div>
                        </div>
                        <div className="pt-2 border-t border-gray-100">
                          <ConsultationRecordActions records={r} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {makePagination(table, filteredRows.length, "No records")}
            </>
          ) : (
            <>
              <div className="rounded-lg border border-gray-200 overflow-hidden shadow-sm bg-white">
                <div className="overflow-x-auto">
                  <Table className="min-w-[900px] text-sm">
                    <TableHeader>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id} className="border-0">
                          {headerGroup.headers.map((header) => (
                            <TableHead
                              key={header.id}
                              className="bg-[#1a1a2e] text-gray-100 font-medium text-xs uppercase tracking-wider py-3 px-3 border-0 whitespace-nowrap"
                            >
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext(),
                                  )}
                            </TableHead>
                          ))}
                        </TableRow>
                      ))}
                    </TableHeader>
                    <TableBody>
                      <SparklineRow />
                      {table.getRowModel().rows.length ? (
                        table.getRowModel().rows.map((row, i) => (
                          <TableRow
                            key={row.id}
                            className={`border-b border-gray-100 transition-colors hover:bg-[#00a896]/5 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/40"}`}
                          >
                            {row.getVisibleCells().map((cell) => (
                              <TableCell
                                key={cell.id}
                                className="py-2.5 px-3 text-gray-700 text-sm"
                              >
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext(),
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={columns.length}
                            className="h-32 text-center"
                          >
                            {EmptyConsultation}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
              {makePagination(table, filteredRows.length, "No records")}
            </>
          )}
        </TabsContent>

        {/* ── Prescriptions Tab ── */}
        <TabsContent value="prescriptions" className="flex flex-col gap-4 mt-4">
          <StatCard
            label="Total Prescriptions: "
            value={prescriptionRecords.length}
            icon={<Pill className="w-4 h-4" />}
            color="text-purple-600"
            bg="bg-purple-50"
          />

          {isMobile ? (
            <>
              {prescFilteredRows.length === 0 ? (
                EmptyPrescriptions
              ) : (
                <div className="flex flex-col gap-3">
                  {prescriptionTable.getRowModel().rows.map((row) => {
                    const r = row.original;
                    const p = r.prescription!;
                    const primaryDiag = p.diagnosis?.[0];
                    return (
                      <div
                        key={row.id}
                        className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-[10px] uppercase text-gray-400 font-semibold mb-1">
                              Diagnosis
                            </p>
                            {primaryDiag ? (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-sm font-medium text-gray-800">
                                  {primaryDiag.diagnosis}
                                </span>
                                <SeverityBadge
                                  severity={primaryDiag.severity}
                                />
                              </div>
                            ) : (
                              <span className="text-gray-300 text-xs">
                                No diagnosis
                              </span>
                            )}
                            {p.diagnosis && p.diagnosis.length > 1 && (
                              <p className="text-gray-400 text-[10px] mt-0.5">
                                +{p.diagnosis.length - 1} more
                              </p>
                            )}
                          </div>
                          <PrescriptionRecordActions record={r} />
                        </div>
                        {(p.drugs?.length ?? 0) > 0 && (
                          <div>
                            <p className="text-[10px] uppercase text-gray-400 font-semibold mb-1">
                              Drugs
                            </p>
                            <div className="space-y-0.5">
                              {p.drugs!.slice(0, 2).map((drug, i) => (
                                <div
                                  key={i}
                                  className="flex items-center gap-1.5 text-xs"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#00a896] shrink-0" />
                                  <span className="text-gray-700 font-medium truncate">
                                    {drug.medicine}
                                  </span>
                                  <span className="text-gray-400 shrink-0">
                                    {drug.dosage}
                                    {drug.unit}
                                  </span>
                                </div>
                              ))}
                              {p.drugs!.length > 2 && (
                                <p className="text-gray-400 text-[10px]">
                                  +{p.drugs!.length - 2} more
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs pt-2 border-t border-gray-100">
                          <div>
                            <span className="text-gray-400">Created by</span>
                            <p className="text-gray-700 font-medium truncate">
                              {p.createdBy || p.addedBy || "—"}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-400">Added by</span>
                            <p className="text-gray-700 font-medium truncate">
                              {p.addedBy || "—"}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-400">Approved by</span>
                            <p className="text-gray-700 font-medium truncate">
                              {(p as any).approvedBy || "—"}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-400">Created</span>
                            <p className="text-gray-700 font-medium truncate">
                              {formatDate(r.createdAt)}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-400">Updated</span>
                            <p className="text-gray-700 font-medium truncate">
                              {p.updatedAt || formatDate(r.updatedAt) || "—"}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {prescriptionRecords.length > 0 &&
                makePagination(
                  prescriptionTable,
                  prescFilteredRows.length,
                  "No prescriptions",
                )}
            </>
          ) : (
            <>
              {prescriptionRecords.length === 0 ? (
                EmptyPrescriptions
              ) : (
                <>
                  <div className="rounded-lg border border-gray-200 overflow-hidden shadow-sm bg-white">
                    <div className="overflow-x-auto">
                      <Table className="min-w-[900px] text-sm">
                        <TableHeader>
                          {prescriptionTable
                            .getHeaderGroups()
                            .map((headerGroup) => (
                              <TableRow
                                key={headerGroup.id}
                                className="border-0"
                              >
                                {headerGroup.headers.map((header) => (
                                  <TableHead
                                    key={header.id}
                                    className="bg-[#1a1a2e] text-gray-100 font-medium text-xs uppercase tracking-wider py-3 px-3 border-0 whitespace-nowrap"
                                  >
                                    {header.isPlaceholder
                                      ? null
                                      : flexRender(
                                          header.column.columnDef.header,
                                          header.getContext(),
                                        )}
                                  </TableHead>
                                ))}
                              </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                          {prescriptionTable.getRowModel().rows.length ? (
                            prescriptionTable
                              .getRowModel()
                              .rows.map((row, i) => (
                                <TableRow
                                  key={row.id}
                                  className={`border-b border-gray-100 transition-colors hover:bg-[#00a896]/5 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/40"}`}
                                >
                                  {row.getVisibleCells().map((cell) => (
                                    <TableCell
                                      key={cell.id}
                                      className="py-2.5 px-3 text-gray-700 text-sm"
                                    >
                                      {flexRender(
                                        cell.column.columnDef.cell,
                                        cell.getContext(),
                                      )}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              ))
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={prescriptionColumns.length}
                                className="h-32 text-center"
                              >
                                <p className="text-sm text-gray-400">
                                  No prescriptions match your search.
                                </p>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                  {makePagination(
                    prescriptionTable,
                    prescFilteredRows.length,
                    "No prescriptions",
                  )}
                </>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
