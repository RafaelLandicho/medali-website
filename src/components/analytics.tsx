"use client";

import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  LabelList,
  AreaChart,
  Area,
} from "recharts";

import { db } from "@/firebaseConfig";
import { ref, onValue } from "firebase/database";
import { useAuth } from "@/auth/authprovider";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "./ui/calendar";

import {
  Activity,
  Download,
  TrendingUp,
  X,
  ChevronDownIcon,
  Users,
  Pill,
  Stethoscope,
  ClipboardList,
} from "lucide-react";

// ─── Color palette ─────────────────────────────────────────────────────────────
const CHART_COLORS = [
  "#00a896",
  "#378add",
  "#ef9f27",
  "#d85a30",
  "#8b5cf6",
  "#d4537e",
  "#0f6e56",
  "#185fa5",
];

// ─── Types ──────────────────────────────────────────────────────────────────────
interface AnalyticsData {
  label: string;
  count: number;
}

interface AnalyticsState {
  diagnoses: AnalyticsData[];
  prescriptions: AnalyticsData[];
  drugs: AnalyticsData[];
  ages: AnalyticsData[];
  genders: AnalyticsData[];
  infant: AnalyticsData[];
  teen: AnalyticsData[];
  adult: AnalyticsData[];
  middleage: AnalyticsData[];
  senior: AnalyticsData[];
  male: AnalyticsData[];
  female: AnalyticsData[];
  trendByDiagnosis: Record<string, AnalyticsData[]>;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
const mapToArray = (map: Record<string, number>): AnalyticsData[] =>
  Object.entries(map)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);

const getDiagnosisCounts = (records: any[]): AnalyticsData[] => {
  const map: Record<string, number> = {};
  records.forEach((p) => {
    if (!Array.isArray(p?.diagnosis)) return;
    p.diagnosis.forEach((d: { diagnosis: string }) => {
      const name = d.diagnosis?.trim();
      if (name) map[name] = (map[name] || 0) + 1;
    });
  });
  return mapToArray(map);
};

const getDrugCounts = (records: any[]): AnalyticsData[] => {
  const map: Record<string, number> = {};
  records.forEach((p) => {
    if (!Array.isArray(p?.drugs)) return;
    p.drugs.forEach((d: { medicine: string }) => {
      const name = d.medicine?.trim();
      if (name) map[name] = (map[name] || 0) + 1;
    });
  });
  return mapToArray(map);
};

const getGenderCounts = (records: any[]): AnalyticsData[] => {
  const map: Record<string, number> = {};
  records.forEach((p) => {
    const g = p.gender?.trim();
    if (g) map[g] = (map[g] || 0) + 1;
  });
  return mapToArray(map);
};

const getAgeCounts = (records: any[]): AnalyticsData[] => {
  const map: Record<string, number> = {};
  records.forEach((p) => {
    const age = p.age?.toString().trim();
    if (age) map[age] = (map[age] || 0) + 1;
  });
  return mapToArray(map).slice(0, 5);
};

const getDiagnosisTrend = (
  records: any[],
  diagnosisName: string,
): AnalyticsData[] => {
  const map: Record<string, number> = {};
  records.forEach((p) => {
    if (!Array.isArray(p?.diagnosis)) return;
    const found = p.diagnosis.some((d: any) => d.diagnosis === diagnosisName);
    if (!found) return;
    const date = new Date(p.createdAt);
    if (isNaN(date.getTime())) return;
    const key = date.toLocaleString("en-US", {
      month: "short",
      year: "numeric",
    });
    map[key] = (map[key] || 0) + 1;
  });
  return Object.entries(map)
    .map(([label, count]) => ({ label, count }))
    .sort(
      (a, b) =>
        new Date("1 " + a.label).getTime() - new Date("1 " + b.label).getTime(),
    );
};

const exportToCSV = (data: AnalyticsData[], filename: string) => {
  const csv = [
    "Label,Count",
    ...data.map((d) => `"${d.label}",${d.count}`),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

// ─── Shared chart components ───────────────────────────────────────────────────

function Top5BarChart({ data }: { data: AnalyticsData[] }) {
  const top5 = data.slice(0, 5);
  const othersCount = data.slice(5).reduce((s, d) => s + d.count, 0);
  const chartData =
    othersCount > 0 ? [...top5, { label: "Others", count: othersCount }] : top5;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={chartData}
        barCategoryGap="25%"
        margin={{ top: 16, right: 8, left: 0, bottom: 0 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#f0f0f0"
          vertical={false}
        />
        <XAxis
          dataKey="label"
          tick={{ fill: "#000000", fontSize: 12, fontWeight: 600 }}
          axisLine={{ stroke: "#e5e7eb" }}
          tickLine={false}
          interval={0}
          tickFormatter={(v: string) =>
            v.length > 12 ? v.slice(0, 11) + "…" : v
          }
        />
        <YAxis
          tick={{ fill: "#000000", fontSize: 12, fontWeight: 600 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            color: "#000000",
            fontSize: "13px",
            fontWeight: 600,
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          }}
          labelStyle={{ color: "#000000", marginBottom: 4, fontWeight: 700 }}
          cursor={{ fill: "rgba(0,0,0,0.03)" }}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          <LabelList
            dataKey="count"
            position="top"
            fill="#000000"
            fontSize={12}
            fontWeight={700}
          />
          {chartData.map((entry, i) => (
            <Cell
              key={i}
              fill={
                entry.label === "Others"
                  ? "#9ca3af"
                  : CHART_COLORS[i % CHART_COLORS.length]
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function Top5PieChart({ data }: { data: AnalyticsData[] }) {
  const top5 = data.slice(0, 5);
  const othersCount = data.slice(5).reduce((s, d) => s + d.count, 0);
  const chartData =
    othersCount > 0 ? [...top5, { label: "Others", count: othersCount }] : top5;
  const total = chartData.reduce((s, d) => s + d.count, 0);
  return (
    <div className="flex flex-col gap-3">
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="count"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius={48}
            outerRadius={80}
            paddingAngle={2}
          >
            {chartData.map((entry, i) => (
              <Cell
                key={i}
                fill={
                  entry.label === "Others"
                    ? "#9ca3af"
                    : CHART_COLORS[i % CHART_COLORS.length]
                }
                stroke="#ffffff"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              color: "#000000",
              fontSize: "13px",
              fontWeight: 600,
              boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-1.5">
        {chartData.map((d, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-2 text-xs"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="h-2 w-2 rounded-full flex-shrink-0"
                style={{
                  backgroundColor:
                    d.label === "Others"
                      ? "#9ca3af"
                      : CHART_COLORS[i % CHART_COLORS.length],
                }}
              />
              <span className="text-black font-semibold truncate">
                {d.label}
              </span>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-black font-bold">{d.count}</span>
              <span className="text-gray-500 font-semibold w-12 text-right">
                {((d.count / total) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarList({
  data,
  onItemClick,
  exportFilename,
  showExport = false,
  title,
  description,
}: {
  data: AnalyticsData[];
  onItemClick?: (label: string) => void;
  exportFilename?: string;
  showExport?: boolean;
  title: string;
  description?: string;
}) {
  const [showAll, setShowAll] = React.useState(false);
  const total = data.reduce((s, d) => s + d.count, 0);
  const display = showAll ? data : data.slice(0, 8);

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between">
        <div>
          {title && <h3 className="text-base font-bold text-black">{title}</h3>}
          {description && (
            <p className="text-sm text-gray-500 font-medium mt-0.5">
              {description}
            </p>
          )}
        </div>
        {showExport && exportFilename && (
          <button
            onClick={() => exportToCSV(data, exportFilename)}
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#00a896] !bg-[#00c4b4] text-white transition-colors px-2 py-1 rounded font-semibold"
          >
            <Download className="h-3 w-3" />
            CSV
          </button>
        )}
      </div>
      <div className="space-y-1.5">
        {display.map((item, i) => (
          <div
            key={i}
            onClick={() => onItemClick?.(item.label)}
            className={`flex items-center gap-3 rounded-lg border border-gray-100 bg-white px-3 py-2 transition-all ${
              onItemClick
                ? "cursor-pointer hover:bg-gray-50 hover:border-gray-300 group"
                : ""
            }`}
          >
            <span
              className="h-2 w-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
            />
            <span
              className={`text-sm font-bold flex-1 truncate ${onItemClick ? "text-black group-hover:text-[#00a896]" : "text-black"}`}
            >
              {item.label}
            </span>
            <span className="text-sm font-bold text-black w-14 text-right">
              {item.count}
            </span>
            <span className="text-sm font-semibold text-gray-500 w-10 text-right">
              {((item.count / total) * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
      {data.length > 8 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full text-sm font-bold !bg-[#00a896] text-white hover:opacity-80 py-1.5 flex items-center justify-center gap-1 transition-opacity"
        >
          {showAll ? "Show less" : `Show all ${data.length} records`}
          <ChevronDownIcon
            className={`h-3 w-3 transition-transform ${showAll ? "rotate-180" : ""}`}
          />
        </button>
      )}
    </div>
  );
}

function TrendChart({
  seriesMap,
  selected,
  onToggle,
  onClear,
}: {
  seriesMap: Record<string, AnalyticsData[]>;
  selected: string[];
  onToggle?: (label: string) => void;
  onClear?: () => void;
}) {
  if (!selected.length) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-gray-500 text-sm gap-2">
        <TrendingUp className="h-6 w-6 opacity-30" />
        <span className="text-sm font-semibold">
          Click any row above to view its monthly trend
        </span>
      </div>
    );
  }

  const allMonths = Array.from(
    new Set(
      selected.flatMap((name) => (seriesMap[name] ?? []).map((d) => d.label)),
    ),
  ).sort((a, b) => new Date("1 " + a).getTime() - new Date("1 " + b).getTime());

  const merged = allMonths.map((month) => {
    const row: Record<string, any> = { month };
    selected.forEach((name) => {
      const point = (seriesMap[name] ?? []).find((d) => d.label === month);
      row[name] = point?.count ?? 0;
    });
    return row;
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {selected.map((name, i) => (
            <span
              key={name}
              onClick={() => onToggle?.(name)}
              className="flex items-center gap-1.5 text-sm font-bold px-2 py-1 rounded-full cursor-pointer border transition-colors"
              style={{
                backgroundColor: CHART_COLORS[i % CHART_COLORS.length] + "15",
                color: CHART_COLORS[i % CHART_COLORS.length],
                borderColor: CHART_COLORS[i % CHART_COLORS.length] + "40",
              }}
            >
              {name} <X className="h-3 w-3 opacity-60" />
            </span>
          ))}
        </div>
        {selected.length > 0 && (
          <button
            onClick={onClear}
            className="text-sm font-bold text-gray-500 hover:text-red-400 transition-colors px-2 py-1 flex items-center gap-1"
          >
            <X className="h-3 w-3" /> Clear
          </button>
        )}
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart
          data={merged}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        >
          <defs>
            {selected.map((name, i) => (
              <linearGradient
                key={name}
                id={`grad-${i}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor={CHART_COLORS[i % CHART_COLORS.length]}
                  stopOpacity={0.15}
                />
                <stop
                  offset="95%"
                  stopColor={CHART_COLORS[i % CHART_COLORS.length]}
                  stopOpacity={0}
                />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#f0f0f0"
            vertical={false}
          />
          <XAxis
            dataKey="month"
            tick={{ fill: "#000000", fontSize: 12, fontWeight: 600 }}
            axisLine={{ stroke: "#e5e7eb" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#000000", fontSize: 12, fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              color: "#000000",
              fontSize: "13px",
              fontWeight: 600,
              boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
            }}
            labelStyle={{ color: "#000000", marginBottom: 4, fontWeight: 700 }}
          />
          {selected.map((name, i) => (
            <Area
              key={name}
              type="monotone"
              dataKey={name}
              stroke={CHART_COLORS[i % CHART_COLORS.length]}
              strokeWidth={2}
              fill={`url(#grad-${i})`}
              dot={{
                r: 3,
                fill: CHART_COLORS[i % CHART_COLORS.length],
                strokeWidth: 0,
              }}
              activeDot={{ r: 5 }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Section wrapper ───────────────────────────────────────────────────────────
function SectionCard({
  title,
  icon: Icon,
  iconColor,
  children,
}: {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100">
        <div
          className="p-1.5 rounded-lg"
          style={{ backgroundColor: iconColor + "15" }}
        >
          <Icon className="h-4 w-4" style={{ color: iconColor }} />
        </div>
        <h2 className="text-base font-bold text-black">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function SubCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50/50 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-gray-100 bg-white">
        <p className="text-xs font-bold uppercase tracking-wider text-black">
          {title}
        </p>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

// ─── Stat pill ─────────────────────────────────────────────────────────────────
function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center px-4 py-2.5 rounded-lg border border-gray-200 bg-white shadow-sm">
      <span className="text-xs uppercase tracking-wider text-black font-bold">
        {label}
      </span>
      <span className="text-2xl font-extrabold text-black">
        {value.toLocaleString()}
      </span>
    </div>
  );
}

// ─── Top1 Banner ───────────────────────────────────────────────────────────────
function Top1Banner({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      className="flex flex-col px-4 py-3 rounded-lg border shadow-sm"
      style={{ borderColor: color + "40", backgroundColor: color + "08" }}
    >
      <span
        className="text-xs uppercase tracking-wider font-bold"
        style={{ color }}
      >
        {label}
      </span>
      <span className="text-lg font-extrabold text-black truncate mt-0.5">
        {value || "—"}
      </span>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export function Analytics() {
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(true);

  const [startDate, setStartDate] = React.useState<Date>();
  const [endDate, setEndDate] = React.useState<Date>();
  const [openStart, setOpenStart] = React.useState(false);
  const [openEnd, setOpenEnd] = React.useState(false);

  const [selectedAgeGroup, setSelectedAgeGroup] = React.useState<
    "general" | "infant" | "teen" | "adult" | "middleage" | "senior"
  >("general");

  const [diagnosisTrends, setDiagnosisTrends] = React.useState<string[]>([]);
  const [prescriptionTrends, setPrescriptionTrends] = React.useState<string[]>(
    [],
  );

  const [analytics, setAnalytics] = React.useState<AnalyticsState>({
    diagnoses: [],
    prescriptions: [],
    drugs: [],
    ages: [],
    genders: [],
    infant: [],
    teen: [],
    adult: [],
    middleage: [],
    senior: [],
    male: [],
    female: [],
    trendByDiagnosis: {},
  });

  const filteredPatientsRef = React.useRef<any[]>([]);

  const filterByDate = React.useCallback(
    (arr: any[]) => {
      let out = arr;
      if (startDate)
        out = out.filter((p) => new Date(p.createdAt) >= startDate);
      if (endDate) out = out.filter((p) => new Date(p.createdAt) <= endDate);
      return out;
    },
    [startDate, endDate],
  );

  const makeToggleTrend =
    (setter: React.Dispatch<React.SetStateAction<string[]>>) =>
    (diagnosisName: string) => {
      setter((prev) => {
        const removing = prev.includes(diagnosisName);
        const next = removing
          ? prev.filter((n) => n !== diagnosisName)
          : prev.length >= 3
            ? [...prev.slice(1), diagnosisName]
            : [...prev, diagnosisName];
        if (!removing) {
          setAnalytics((a) => {
            if (a.trendByDiagnosis[diagnosisName]) return a;
            const trend = getDiagnosisTrend(
              filteredPatientsRef.current,
              diagnosisName,
            );
            return {
              ...a,
              trendByDiagnosis: {
                ...a.trendByDiagnosis,
                [diagnosisName]: trend,
              },
            };
          });
        }
        return next;
      });
    };

  const toggleDiagnosisTrend = React.useMemo(
    () => makeToggleTrend(setDiagnosisTrends),
    [],
  );
  const togglePrescriptionTrend = React.useMemo(
    () => makeToggleTrend(setPrescriptionTrends),
    [],
  );

  React.useEffect(() => {
    if (!user) return;
    const patientRef = ref(db, "patients");
    const prescriptionRef = ref(db, "prescriptions");

    const unsubPatients = onValue(patientRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setLoading(false);
        return;
      }

      const all: any[] = Object.values(data);
      const filtered = filterByDate(all);
      filteredPatientsRef.current = filtered;

      const maleMap: Record<string, number> = {};
      const femaleMap: Record<string, number> = {};
      const infantMap: Record<string, number> = {};
      const teenMap: Record<string, number> = {};
      const adultMap: Record<string, number> = {};
      const middleMap: Record<string, number> = {};
      const seniorMap: Record<string, number> = {};

      filtered.forEach((p: any) => {
        const gender = String(p.gender ?? "").toLowerCase();
        const age = Number(p.age);
        if (!Array.isArray(p.diagnosis)) return;
        p.diagnosis.forEach((d: any) => {
          const dx = d?.diagnosis?.trim();
          if (!dx) return;
          if (gender === "male") maleMap[dx] = (maleMap[dx] || 0) + 1;
          if (gender === "female") femaleMap[dx] = (femaleMap[dx] || 0) + 1;
          if (age <= 1) infantMap[dx] = (infantMap[dx] || 0) + 1;
          else if (age <= 20) teenMap[dx] = (teenMap[dx] || 0) + 1;
          else if (age <= 44) adultMap[dx] = (adultMap[dx] || 0) + 1;
          else if (age <= 64) middleMap[dx] = (middleMap[dx] || 0) + 1;
          else seniorMap[dx] = (seniorMap[dx] || 0) + 1;
        });
      });

      setAnalytics((prev) => {
        const updatedTrends = { ...prev.trendByDiagnosis };
        [...diagnosisTrends, ...prescriptionTrends].forEach((name) => {
          updatedTrends[name] = getDiagnosisTrend(filtered, name);
        });
        return {
          ...prev,
          diagnoses: getDiagnosisCounts(filtered),
          genders: getGenderCounts(filtered),
          ages: getAgeCounts(filtered),
          male: mapToArray(maleMap),
          female: mapToArray(femaleMap),
          infant: mapToArray(infantMap),
          teen: mapToArray(teenMap),
          adult: mapToArray(adultMap),
          middleage: mapToArray(middleMap),
          senior: mapToArray(seniorMap),
          trendByDiagnosis: updatedTrends,
        };
      });
      setLoading(false);
    });

    const unsubPrescriptions = onValue(prescriptionRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;
      const filtered = filterByDate(Object.values(data));
      setAnalytics((prev) => ({
        ...prev,
        prescriptions: getDiagnosisCounts(filtered),
        drugs: getDrugCounts(filtered),
      }));
    });

    return () => {
      unsubPatients();
      unsubPrescriptions();
    };
  }, [user, startDate, endDate]);

  const totalPatients = analytics.genders.reduce((s, d) => s + d.count, 0);

  const ageDataMap = {
    general: analytics.ages,
    infant: analytics.infant,
    teen: analytics.teen,
    adult: analytics.adult,
    middleage: analytics.middleage,
    senior: analytics.senior,
  } as const;

  const ageGroupLabels = {
    general: "Age distribution",
    infant: "Infant (0–1)",
    teen: "Teen (2–20)",
    adult: "Adult (21–44)",
    middleage: "Middle age (45–64)",
    senior: "Senior (65+)",
  } as const;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#00a896]/30 border-t-[#00a896] rounded-full animate-spin" />
          <p className="text-black font-semibold text-sm">Loading analytics…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#00a896]/10">
              <Activity className="h-5 w-5 text-[#00a896]" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-black tracking-tight">
                Medical Records Analytics
              </h1>
              <p className="text-sm text-black font-semibold">
                Records &amp; Prescriptions Overview
              </p>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap items-center">
            <Popover open={openStart} onOpenChange={setOpenStart}>
              <PopoverTrigger asChild>
                <button className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-bold border border-gray-200 rounded-lg !bg-[#00c4b4] text-white hover:bg-gray-50 transition-colors shadow-sm">
                  {startDate ? startDate.toLocaleDateString() : "Start date"}
                  <ChevronDownIcon className="h-3 w-3 opacity-60" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="bg-white border-gray-200 shadow-lg">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(d) => {
                    setStartDate(d);
                    setOpenStart(false);
                  }}
                />
              </PopoverContent>
            </Popover>

            <Popover open={openEnd} onOpenChange={setOpenEnd}>
              <PopoverTrigger asChild>
                <button className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-bold border border-gray-200 rounded-lg !bg-[#00c4b4] text-white hover:bg-gray-50 transition-colors shadow-sm">
                  {endDate ? endDate.toLocaleDateString() : "End date"}
                  <ChevronDownIcon className="h-3 w-3 opacity-60" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="bg-white border-gray-200 shadow-lg">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(d) => {
                    setEndDate(d);
                    setOpenEnd(false);
                  }}
                />
              </PopoverContent>
            </Popover>

            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate(undefined);
                  setEndDate(undefined);
                }}
                className="inline-flex items-center gap-1 text-sm font-bold text-gray-500 hover:text-red-400 transition-colors px-2 py-1"
              >
                <X className="h-3 w-3" /> Clear
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* ══ ROW 1: Patient Demographics ══════════════════════════════════════ */}
        <SectionCard
          title="Patient Demographics"
          icon={Users}
          iconColor="#378add"
        >
          {/* Stat pills */}
          <div className="flex flex-wrap gap-3 mb-6">
            <StatPill
              label="Male"
              value={
                analytics.genders.find((g) => g.label.toLowerCase() === "male")
                  ?.count ?? 0
              }
            />
            <StatPill
              label="Female"
              value={
                analytics.genders.find(
                  (g) => g.label.toLowerCase() === "female",
                )?.count ?? 0
              }
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gender */}
            <SubCard title="Gender distribution">
              {analytics.genders.length ? (
                <Top5PieChart data={analytics.genders} />
              ) : (
                <p className="text-sm font-semibold text-black py-4 text-center">
                  No gender data available
                </p>
              )}
            </SubCard>

            {/* Age group selector + chart */}
            <SubCard title="Age group breakdown">
              <div className="flex flex-wrap gap-1.5 mb-4">
                {(
                  [
                    { id: "general", label: "General" },
                    { id: "infant", label: "Infant (0–1)" },
                    { id: "teen", label: "Teen (2–20)" },
                    { id: "adult", label: "Adult (21–44)" },
                    { id: "middleage", label: "Middle age (45–64)" },
                    { id: "senior", label: "Senior (65+)" },
                  ] as const
                ).map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setSelectedAgeGroup(g.id)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-full border transition-colors ${
                      selectedAgeGroup === g.id
                        ? "!bg-[#00a896] text-white border-[#00a896]"
                        : "!bg-white text-black border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
              {ageDataMap[selectedAgeGroup].length ? (
                selectedAgeGroup === "general" ? (
                  <Top5BarChart data={ageDataMap[selectedAgeGroup]} />
                ) : (
                  <Top5PieChart data={ageDataMap[selectedAgeGroup]} />
                )
              ) : (
                <p className="text-sm font-semibold text-black py-4 text-center">
                  No data for this group
                </p>
              )}
            </SubCard>
          </div>

          {/* Male/Female diagnosis side-by-side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <SubCard title="Top diagnoses — male">
              {analytics.male.length ? (
                <Top5BarChart data={analytics.male} />
              ) : (
                <p className="text-sm font-semibold text-black py-4 text-center">
                  No data
                </p>
              )}
            </SubCard>
            <SubCard title="Top diagnoses — female">
              {analytics.female.length ? (
                <Top5BarChart data={analytics.female} />
              ) : (
                <p className="text-sm font-semibold text-black py-4 text-center">
                  No data
                </p>
              )}
            </SubCard>
          </div>
        </SectionCard>

        {/* ══ ROW 2: Diagnoses ══════════════════════════════════════════════════ */}
        <SectionCard title="Diagnoses" icon={Stethoscope} iconColor="#00a896">
          {/* Top 1 banners only */}
          <div className="flex flex-wrap gap-3 mb-6">
            <Top1Banner
              label="Top Diagnosis — Records"
              value={analytics.diagnoses[0]?.label ?? "—"}
              color="#00a896"
            />
            <Top1Banner
              label="Top Diagnosis — Prescriptions"
              value={analytics.prescriptions[0]?.label ?? "—"}
              color="#378add"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Records diagnoses */}
            <div className="space-y-4">
              <SubCard title="Top 5 — consultation records">
                {analytics.diagnoses.length ? (
                  <Top5BarChart data={analytics.diagnoses} />
                ) : (
                  <p className="text-sm font-semibold text-black py-4 text-center">
                    No data
                  </p>
                )}
              </SubCard>
              <SubCard title="Distribution — consultation records">
                {analytics.diagnoses.length ? (
                  <Top5PieChart data={analytics.diagnoses} />
                ) : (
                  <p className="text-sm font-semibold text-black py-4 text-center">
                    No data
                  </p>
                )}
              </SubCard>
            </div>

            {/* Prescription diagnoses */}
            <div className="space-y-4">
              <SubCard title="Top 5 — prescriptions">
                {analytics.prescriptions.length ? (
                  <Top5BarChart data={analytics.prescriptions} />
                ) : (
                  <p className="text-sm font-semibold text-black py-4 text-center">
                    No data
                  </p>
                )}
              </SubCard>
              <SubCard title="Distribution — prescriptions">
                {analytics.prescriptions.length ? (
                  <Top5PieChart data={analytics.prescriptions} />
                ) : (
                  <p className="text-sm font-semibold text-black py-4 text-center">
                    No data
                  </p>
                )}
              </SubCard>
            </div>
          </div>

          {/* Full list — records diagnoses */}
          <div className="space-y-4">
            <SubCard title="All record diagnoses — click a row to view trend">
              <BarList
                data={analytics.diagnoses}
                title="Consultation records"
                description="Click any row to add it to the trend chart below"
                onItemClick={toggleDiagnosisTrend}
                showExport
                exportFilename="diagnoses-records"
              />
            </SubCard>

            <SubCard title="Monthly trend — consultation records">
              <TrendChart
                seriesMap={analytics.trendByDiagnosis}
                selected={diagnosisTrends}
                onToggle={toggleDiagnosisTrend}
                onClear={() => setDiagnosisTrends([])}
              />
            </SubCard>

            <SubCard title="All prescription diagnoses — click a row to view trend">
              <BarList
                data={analytics.prescriptions}
                title="Prescriptions"
                description="Click any row to add it to the trend chart below"
                onItemClick={togglePrescriptionTrend}
                showExport
                exportFilename="diagnoses-prescriptions"
              />
            </SubCard>

            <SubCard title="Monthly trend — prescriptions">
              <TrendChart
                seriesMap={analytics.trendByDiagnosis}
                selected={prescriptionTrends}
                onToggle={togglePrescriptionTrend}
                onClear={() => setPrescriptionTrends([])}
              />
            </SubCard>
          </div>
        </SectionCard>

        {/* ══ ROW 3: Drugs ══════════════════════════════════════════════════════ */}
        <SectionCard title="Prescribed Drugs" icon={Pill} iconColor="#8b5cf6">
          {/* Top 1 banner only */}
          <div className="flex flex-wrap gap-3 mb-6">
            <Top1Banner
              label="Top Prescribed Drug"
              value={analytics.drugs[0]?.label ?? "—"}
              color="#8b5cf6"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <SubCard title="Top 5 — bar">
              {analytics.drugs.length ? (
                <Top5BarChart data={analytics.drugs} />
              ) : (
                <p className="text-sm font-semibold text-black py-4 text-center">
                  No data
                </p>
              )}
            </SubCard>
            <SubCard title="Top 5 — distribution">
              {analytics.drugs.length ? (
                <Top5PieChart data={analytics.drugs} />
              ) : (
                <p className="text-sm font-semibold text-black py-4 text-center">
                  No data
                </p>
              )}
            </SubCard>
          </div>

          <SubCard title="All prescribed drugs">
            <BarList
              data={analytics.drugs}
              title="Drug frequency"
              showExport
              exportFilename="drugs"
            />
          </SubCard>
        </SectionCard>
      </div>
    </div>
  );
}
