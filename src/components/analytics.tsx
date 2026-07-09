"use client";

import * as React from "react";
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";

import { db } from "@/firebaseConfig";
import { ref, onValue, get } from "firebase/database";
import { useAuth } from "@/auth/authprovider";
import { Search } from "lucide-react";
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
  FileText,
  Link2,
  AlertTriangle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";

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
  ageCategories: AnalyticsData[]; // NEW: aggregated counts per age group
}

const EMPTY_ANALYTICS: AnalyticsState = {
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
  ageCategories: [],
};

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

function ReportDocument({
  analytics,
  generatedAt,
  dateRange,
  scopeLabel,
}: {
  analytics: AnalyticsState;
  generatedAt: string;
  dateRange: string;
  scopeLabel: string;
}) {
  const totalPatients = analytics.genders.reduce((s, d) => s + d.count, 0);
  const totalDiagnoses = analytics.diagnoses.reduce((s, d) => s + d.count, 0);
  const totalPrescriptions = analytics.prescriptions.reduce(
    (s, d) => s + d.count,
    0,
  );
  const maleCount =
    analytics.genders.find((g) => g.label.toLowerCase() === "male")?.count ?? 0;
  const femaleCount =
    analytics.genders.find((g) => g.label.toLowerCase() === "female")?.count ??
    0;

  const ReportSection = ({
    title,
    color = "#00a896",
  }: {
    title: string;
    color?: string;
  }) => (
    <div
      className="px-2 py-1.5 mb-4 font-bold text-white text-sm rounded-sm uppercase tracking-wide"
      style={{ backgroundColor: color }}
    >
      {title}
    </div>
  );

  const TableSection = ({
    title,
    data,
    color = "#00a896",
  }: {
    title: string;
    data: AnalyticsData[];
    color?: string;
  }) => {
    const top5 = data.slice(0, 5);
    const total = data.reduce((s, d) => s + d.count, 0);
    if (!top5.length) return null;
    return (
      <div className="mb-6">
        <p className="font-bold text-sm mb-2" style={{ color }}>
          {title}
        </p>
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr style={{ backgroundColor: color + "15" }}>
              <th className="text-left p-2 font-bold" style={{ color }}>
                #
              </th>
              <th className="text-left p-2 font-bold" style={{ color }}>
                Name
              </th>
              <th className="text-right p-2 font-bold" style={{ color }}>
                Count
              </th>
              <th className="text-right p-2 font-bold" style={{ color }}>
                %
              </th>
            </tr>
          </thead>
          <tbody>
            {top5.map((item, i) => (
              <tr
                key={i}
                className="border-b"
                style={{ borderColor: color + "20" }}
              >
                <td className="p-2 font-bold" style={{ color }}>
                  {i + 1}
                </td>
                <td className="p-2 text-[#004d45] font-semibold">
                  {item.label}
                </td>
                <td className="p-2 text-right font-bold text-[#004d45]">
                  {item.count}
                </td>
                <td className="p-2 text-right text-gray-500">
                  {total > 0 ? ((item.count / total) * 100).toFixed(1) : 0}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div
      className="w-full bg-white text-[#004d45] font-sans"
      style={{ minWidth: 794 }}
    >
      <div className="text-center pt-10 pb-4 px-10 bg-gradient-to-br from-[#00a896]/10 to-white">
        <div className="flex justify-center mb-3">
          <div className="bg-[#00a896]/10 rounded-full p-3">
            <FileText className="w-8 h-8 text-[#00a896]" />
          </div>
        </div>
        <h1 className="text-3xl font-bold tracking-wide text-[#00a896] uppercase">
          Medical Analytics Report
        </h1>
        <p className="text-xs text-[#007a6e]/60 mt-1 tracking-widest uppercase">
          Confidential — Internal Use Only
        </p>
        <p className="text-sm font-semibold text-[#004d45] mt-2">
          Generated: {generatedAt}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">Scope: {scopeLabel}</p>
        {dateRange && (
          <p className="text-xs text-gray-500 mt-0.5">Period: {dateRange}</p>
        )}
      </div>
      <div className="flex w-full h-3 mb-8">
        <div className="w-1/2 bg-[#00a896]" />
        <div className="w-1/2 bg-[#ffd166]" />
      </div>
      <div className="px-10 space-y-8">
        <div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            {[
              {
                label: "Total Patients",
                value: totalPatients,
                color: "#378add",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg border p-3 text-center"
                style={{
                  borderColor: stat.color + "30",
                  backgroundColor: stat.color + "08",
                }}
              >
                <p
                  className="text-xs font-bold uppercase tracking-wide"
                  style={{ color: stat.color }}
                >
                  {stat.label}
                </p>
                <p className="text-2xl font-extrabold text-[#004d45] mt-1">
                  {stat.value.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-[#00a896]/20 bg-[#00a896]/5 p-4 mt-4">
            <p className="font-bold text-sm text-[#00a896] mb-2">
              Key Insights
            </p>
            <ul className="space-y-1.5 text-sm text-[#004d45]">
              {analytics.diagnoses[0] && (
                <li>
                  • Most common diagnosis:{" "}
                  <strong>{analytics.diagnoses[0].label}</strong> (
                  {analytics.diagnoses[0].count} cases,{" "}
                  {totalDiagnoses > 0
                    ? (
                        (analytics.diagnoses[0].count / totalDiagnoses) *
                        100
                      ).toFixed(1)
                    : 0}
                  % of all records)
                </li>
              )}
              {(maleCount > 0 || femaleCount > 0) && (
                <li>
                  • Gender split: <strong>{maleCount} male</strong> /{" "}
                  <strong>{femaleCount} female</strong> patients
                  {totalPatients > 0
                    ? ` (${((maleCount / totalPatients) * 100).toFixed(1)}% / ${((femaleCount / totalPatients) * 100).toFixed(1)}%)`
                    : ""}
                </li>
              )}
              {analytics.prescriptions[0] && (
                <li>
                  • Top prescription diagnosis:{" "}
                  <strong>{analytics.prescriptions[0].label}</strong> (
                  {analytics.prescriptions[0].count} cases)
                </li>
              )}
              {analytics.male[0] && (
                <li>
                  • Top male diagnosis:{" "}
                  <strong>{analytics.male[0].label}</strong> (
                  {analytics.male[0].count} cases)
                </li>
              )}
              {analytics.female[0] && (
                <li>
                  • Top female diagnosis:{" "}
                  <strong>{analytics.female[0].label}</strong> (
                  {analytics.female[0].count} cases)
                </li>
              )}
            </ul>
          </div>
        </div>
        <div>
          <ReportSection title="Patient Demographics" color="#378add" />
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="font-bold text-sm text-[#378add] mb-2">
                Gender Distribution
              </p>
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-[#378add]/10">
                    <th className="text-left p-2 font-bold text-[#378add]">
                      Gender
                    </th>
                    <th className="text-right p-2 font-bold text-[#378add]">
                      Count
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.genders.map((g, i) => (
                    <tr key={i} className="border-b border-[#378add]/10">
                      <td className="p-2 font-semibold text-[#004d45]">
                        {g.label}
                      </td>
                      <td className="p-2 text-right font-bold text-[#004d45]">
                        {g.count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <p className="font-bold text-sm text-[#378add] mb-2">
                Age Distribution (Top 5)
              </p>
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-[#378add]/10">
                    <th className="text-left p-2 font-bold text-[#378add]">
                      Age
                    </th>
                    <th className="text-right p-2 font-bold text-[#378add]">
                      Count
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.ages.slice(0, 5).map((a, i) => (
                    <tr key={i} className="border-b border-[#378add]/10">
                      <td className="p-2 font-semibold text-[#004d45]">
                        {a.label} yrs old
                      </td>
                      <td className="p-2 text-right font-bold text-[#004d45]">
                        {a.count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div>
          <ReportSection title="Diagnosis Analysis" color="#00a896" />
          <div className="grid grid-cols-2 gap-6">
            <TableSection
              title="Top Diagnoses — Consultation Records"
              data={analytics.diagnoses}
              color="#00a896"
            />
            <TableSection
              title="Top Diagnoses — Prescriptions"
              data={analytics.prescriptions}
              color="#378add"
            />
          </div>
          <div className="grid grid-cols-2 gap-6 mt-2">
            <TableSection
              title="Top Diagnoses — Male Patients"
              data={analytics.male}
              color="#378add"
            />
            <TableSection
              title="Top Diagnoses — Female Patients"
              data={analytics.female}
              color="#d4537e"
            />
          </div>
        </div>
      </div>
      <div className="px-10 mt-12 pb-10">
        <div className="border-t-2 border-[#00a896] pt-4 flex items-center justify-between text-xs text-gray-400">
          <span>Medali Medical Records System</span>
          <span>Generated: {generatedAt}</span>
          <span>Confidential</span>
        </div>
      </div>
      <div className="flex w-full h-3">
        <div className="w-1/2 bg-[#00a896]" />
        <div className="w-1/2 bg-[#ffd166]" />
      </div>
    </div>
  );
}

// ─── Pie chart ─────────────────────────────────────────────────────────────────
//reference: https://www.shadcn-svelte.com/charts/pie -- interactive pie chart
function Top5PieChart({ data }: { data: AnalyticsData[] }) {
  const top5 = data.slice(0, 5);
  const othersCount = data.slice(5).reduce((s, d) => s + d.count, 0);
  const chartData =
    othersCount > 0 ? [...top5, { label: "Others", count: othersCount }] : top5;
  const total = chartData.reduce((s, d) => s + d.count, 0);
  return (
    <div className="flex flex-col gap-3">
      <ResponsiveContainer width="100%" height={180} className="!bg-[#e2e8f0]">
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
                stroke="#302828"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid #101011",
              borderRadius: "8px",
              color: "#000000",
              fontSize: "13px",
              fontWeight: 600,
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="space-y-1 rounded-lg bg-[#e2e8f0] px-3 py-2">
        {chartData.map((d, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-2 text-sm"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                style={{
                  backgroundColor:
                    d.label === "Others"
                      ? "#9ca3af"
                      : CHART_COLORS[i % CHART_COLORS.length],
                }}
              />
              <span className="text-gray-800 font-semibold truncate text-sm">
                {d.label}
              </span>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-gray-900 font-bold text-base">
                {d.count}
              </span>
              <span className="text-gray-600 font-semibold w-12 text-right text-sm">
                {((d.count / total) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Full list dialog ──────────────────────────────────────────────────────────
function FullListDialog({
  open,
  onOpenChange,
  data,
  title,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: AnalyticsData[];
  title: string;
}) {
  const [search, setSearch] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(0);
  const pageSize = 10;
  const filtered = React.useMemo(() => {
    if (!search) return data;
    const s = search.toLowerCase();
    return data.filter((d) => d.label.toLowerCase().includes(s));
  }, [data, search]);
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const start = currentPage * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);
  const totalCount = data.reduce((sum, d) => sum + d.count, 0);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] bg-white border-gray-200 flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-gray-800">{title}</DialogTitle>
          <DialogDescription className="text-gray-400 text-sm">
            {data.length} entries · {totalCount} total occurrences
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 flex-1 overflow-hidden">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(0);
              }}
              className="w-full pl-8 pr-3 py-1.5 text-sm !bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a896]/40"
            />
          </div>
          <div className="flex-1 overflow-auto border border-gray-200 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-[#1a1a2e] text-gray-100 sticky top-0">
                <tr>
                  <th className="text-left py-2 px-3 font-semibold text-xs uppercase tracking-wider">
                    #
                  </th>
                  <th className="text-left py-2 px-3 font-semibold text-xs uppercase tracking-wider">
                    Label
                  </th>
                  <th className="text-right py-2 px-3 font-semibold text-xs uppercase tracking-wider">
                    Count
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-gray-400">
                      No results
                    </td>
                  </tr>
                ) : (
                  pageItems.map((item, i) => (
                    <tr
                      key={i}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-2 px-3 text-gray-400">
                        {start + i + 1}
                      </td>
                      <td className="py-2 px-3 font-medium text-gray-800">
                        {item.label}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-gray-800">
                        {item.count}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
              <span>
                {start + 1}–{Math.min(start + pageSize, totalItems)} of{" "}
                {totalItems}
              </span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="px-3 py-1 rounded border !bg-[#00a896] !text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  ← Prev
                </button>
                <span className="px-2">
                  {currentPage + 1} / {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages - 1, p + 1))
                  }
                  disabled={currentPage === totalPages - 1}
                  className="px-3 py-1 rounded border !bg-[#00a896] !text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Bar list ──────────────────────────────────────────────────────────────────
function BarList({
  data,
  onItemClick,
  title,
  description,
}: {
  data: AnalyticsData[];
  onItemClick?: (label: string) => void;
  title: string;
  description?: string;
}) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const total = data.reduce((s, d) => s + d.count, 0);
  const top5 = data.slice(0, 5);

  const filtered = React.useMemo(() => {
    if (!searchTerm.trim()) return [];
    const s = searchTerm.toLowerCase().trim();
    return data.filter((d) => d.label.toLowerCase().includes(s));
  }, [data, searchTerm]);

  const displayData = searchTerm.trim() ? filtered : top5;

  return (
    <div className="space-y-3">
      <div>
        {title && (
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
        )}
        {description && (
          <p className="text-sm text-gray-600 font-medium mt-0.5">
            {description}
          </p>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <input
          type="text"
          placeholder="Search ..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 text-sm !bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a896]/40"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div
        className={`rounded-lg bg-slate-100 p-2 space-y-1.5 ${
          searchTerm.trim() ? "max-h-[300px] overflow-y-auto" : ""
        }`}
      >
        {displayData.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            {searchTerm ? "No matching diagnoses" : "No data"}
          </p>
        ) : (
          displayData.map((item, i) => (
            <div
              key={i}
              onClick={() => onItemClick?.(item.label)}
              className={`flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 transition-all shadow-sm ${
                onItemClick
                  ? "cursor-pointer hover:bg-slate-50 hover:border-slate-300 group"
                  : ""
              }`}
            >
              <span
                className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                }}
              />
              <span
                className={`text-base font-bold flex-1 truncate ${
                  onItemClick
                    ? "text-gray-900 group-hover:text-[#00a896]"
                    : "text-gray-900"
                }`}
              >
                {item.label}
              </span>
              <span className="text-base font-bold text-gray-900 w-14 text-right tabular-nums">
                {item.count}
              </span>
              <span className="text-sm font-semibold text-gray-500 w-12 text-right tabular-nums">
                {((item.count / total) * 100).toFixed(1)}%
              </span>
            </div>
          ))
        )}
      </div>

      {!searchTerm && data.length > 5 && (
        <button
          onClick={() => setDialogOpen(true)}
          className="w-full text-sm font-bold !bg-[#00a896] text-white hover:opacity-80 py-1.5 flex items-center justify-center gap-1 transition-opacity rounded"
        >
          Show all records
        </button>
      )}

      <FullListDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        data={data}
        title={title || "Full list"}
      />
    </div>
  );
}

// ─── Trend chart ───────────────────────────────────────────────────────────────
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
      <div className="flex flex-col items-center justify-center h-full min-h-[220px] rounded-lg bg-slate-100 text-gray-500 text-sm gap-2">
        <TrendingUp className="h-8 w-8 opacity-30" />
        <span className="text-sm font-semibold text-center px-4">
          Click any row in the list to view its monthly trend here
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
    <div className="space-y-3 h-full flex flex-col">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex flex-wrap gap-2">
          {selected.map((name, i) => (
            <span
              key={name}
              onClick={() => onToggle?.(name)}
              className="flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-full cursor-pointer border transition-colors"
              style={{
                backgroundColor: CHART_COLORS[i % CHART_COLORS.length] + "20",
                color: CHART_COLORS[i % CHART_COLORS.length],
                borderColor: CHART_COLORS[i % CHART_COLORS.length] + "50",
              }}
            >
              {name} <X className="h-3 w-3 opacity-60" />
            </span>
          ))}
        </div>
        {selected.length > 0 && (
          <button
            onClick={onClear}
            className="text-xs font-bold !bg-white text-red-500 !border-red-200 hover:text-red-400 transition-colors px-2 py-1 flex items-center gap-1"
          >
            <X className="h-3 w-3" /> Clear
          </button>
        )}
      </div>
      <div className="flex-1 rounded-lg bg-slate-100 p-3">
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
                    stopOpacity={0.25}
                  />
                  <stop
                    offset="95%"
                    stopColor={CHART_COLORS[i % CHART_COLORS.length]}
                    stopOpacity={0.02}
                  />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#cbd5e1"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={{ fill: "#1e293b", fontSize: 11, fontWeight: 600 }}
              axisLine={{ stroke: "#94a3b8" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#1e293b", fontSize: 11, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                color: "#0f172a",
                fontSize: "13px",
                fontWeight: 600,
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
              labelStyle={{
                color: "#0f172a",
                marginBottom: 4,
                fontWeight: 700,
              }}
            />
            {selected.map((name, i) => (
              <Area
                key={name}
                type="monotone"
                dataKey={name}
                stroke={CHART_COLORS[i % CHART_COLORS.length]}
                strokeWidth={2.5}
                fill={`url(#grad-${i})`}
                dot={{
                  r: 3.5,
                  fill: CHART_COLORS[i % CHART_COLORS.length],
                  strokeWidth: 0,
                }}
                activeDot={{ r: 5 }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Shared layout ─────────────────────────────────────────────────────────────
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
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
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
    <div className="rounded-lg border border-slate-200 bg-slate-100 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-200">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
          {title}
        </p>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center px-5 py-3 rounded-lg border border-slate-300 bg-slate-100 shadow-sm">
      <span className="text-sm uppercase tracking-wider text-slate-600 font-bold">
        {label}
      </span>
      <span className="text-3xl font-extrabold text-slate-900">
        {value.toLocaleString()}
      </span>
    </div>
  );
}

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
      className="flex flex-col px-4 py-3 rounded-lg border shadow-sm flex-1 min-w-[180px]"
      style={{ borderColor: color + "50", backgroundColor: color + "12" }}
    >
      <span
        className="text-sm uppercase tracking-wider font-bold"
        style={{ color }}
      >
        {label}
      </span>
      <span className="text-2xl font-extrabold text-gray-900 truncate mt-0.5">
        {value || "—"}
      </span>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export function Analytics() {
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [reportOpen, setReportOpen] = React.useState(false);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const reportRef = React.useRef<HTMLDivElement>(null);

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

  const [activeTab, setActiveTab] = React.useState<"global" | "user">("global");

  const userIsAdmin = user?.type?.toLowerCase() === "admin";
  const userIsSecretary = user?.type?.toLowerCase() === "secretary";
  const userIsDoctor = user?.type?.toLowerCase() === "doctor";

  //
  if (userIsAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-10 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Access Restricted
          </h2>
          <p className="text-gray-500">
            Administrators are not permitted to view patient analytics.
          </p>
        </div>
      </div>
    );
  }

  // Fetch the current user's linkId, the full group of linked user ids
  // (so we can scope patients correctly), and — for secretaries — the
  // doctor they're linked to, for display purposes.
  const [currentUserLinkId, setCurrentUserLinkId] = React.useState<
    string | null
  >(null);
  const [linkedUser, setLinkedUser] = React.useState<any | null>(null);
  const [linkedUserIds, setLinkedUserIds] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (!user) return;
    const userRef = ref(db, `users/${user.uid}`);
    const unsubscribe = onValue(userRef, async (snapshot) => {
      const userData = snapshot.val();
      if (!userData) return;
      const linkId: string | null = userData.linkId ?? null;
      setCurrentUserLinkId(linkId);

      if (!linkId) {
        setLinkedUser(null);
        setLinkedUserIds([user.uid]);
        return;
      }

      const allUsersSnap = await get(ref(db, "users"));
      const allUsers = allUsersSnap.val() || {};

      // Everyone sharing this linkId (doctor + secretary, etc.) — mirrors
      // the linkedUsers logic used on the patients/records pages, so a
      // secretary's "User Analytics" tab actually includes their linked
      // doctor's patients instead of only patients they personally created.
      const group = Object.entries(allUsers)
        .filter(([, u]: [string, any]) => u.linkId === linkId)
        .map(([id]) => id);
      setLinkedUserIds(group.length ? group : [user.uid]);

      const partnerEntry = Object.entries(allUsers).find(
        ([id, u]: [string, any]) => id !== user.uid && u.linkId === linkId,
      );
      setLinkedUser(
        partnerEntry
          ? { id: partnerEntry[0], ...(partnerEntry[1] as any) }
          : null,
      );
    });
    return () => unsubscribe();
  }, [user]);

  const [analytics, setAnalytics] =
    React.useState<AnalyticsState>(EMPTY_ANALYTICS);

  // Raw, unfiltered patients straight from the DB.
  const [rawPatients, setRawPatients] = React.useState<any[] | null>(null);

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

  // ── 1. Subscribe once to the raw patients tree ──────────────────────────
  React.useEffect(() => {
    if (!user || userIsAdmin) return;
    const unsubPatients = onValue(ref(db, "patients"), (snapshot) => {
      const raw = snapshot.val();
      setRawPatients(raw ? Object.values(raw) : []);
      setLoading(false);
    });
    return () => unsubPatients();
  }, [user, userIsAdmin]);

  // ── 2. Recompute analytics whenever the raw data, tab, date range, or
  //       linked-account scope changes ─────────────────────────────────────
  React.useEffect(() => {
    if (rawPatients === null || userIsAdmin) return;

    const scopedPatients =
      activeTab === "global"
        ? rawPatients
        : rawPatients.filter(
            (p: any) =>
              linkedUserIds.includes(p.createdBy) ||
              (!!p.linkId &&
                !!currentUserLinkId &&
                p.linkId === currentUserLinkId),
          );

    const allRecords: any[] = [];
    const allPrescriptions: any[] = [];

    scopedPatients.forEach((patient: any) => {
      if (!patient?.records || typeof patient.records !== "object") return;
      Object.values(patient.records).forEach((record: any) => {
        if (!record) return;

        allRecords.push({
          ...record,
          gender: patient.gender,
          age: patient.age,
        });

        if (record.prescription) {
          allPrescriptions.push({
            ...record.prescription,
            createdAt: record.createdAt,
          });
        }
      });
    });

    const filteredPatients = filterByDate(scopedPatients);
    const filteredRecords = filterByDate(allRecords);
    const filteredPrescriptions = filterByDate(allPrescriptions);

    filteredPatientsRef.current = filteredRecords;

    const maleMap: Record<string, number> = {};
    const femaleMap: Record<string, number> = {};
    const infantMap: Record<string, number> = {};
    const teenMap: Record<string, number> = {};
    const adultMap: Record<string, number> = {};
    const middleMap: Record<string, number> = {};
    const seniorMap: Record<string, number> = {};

    filteredRecords.forEach((r: any) => {
      const gender = String(r.gender ?? "").toLowerCase();
      const age = Number(r.age);
      if (!Array.isArray(r?.diagnosis)) return;

      r.diagnosis.forEach((d: any) => {
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

    // ── Compute age categories for the "General" pie chart ──
    const ageCategoryMap: Record<string, number> = {};
    filteredPatients.forEach((p: any) => {
      const age = Number(p.age);
      let category = "";
      if (age <= 1) category = "Infant";
      else if (age <= 20) category = "Teen";
      else if (age <= 44) category = "Adult";
      else if (age <= 64) category = "Middle age";
      else category = "Senior";
      if (category) {
        ageCategoryMap[category] = (ageCategoryMap[category] || 0) + 1;
      }
    });
    const ageCategories = Object.entries(ageCategoryMap)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);

    setAnalytics((prev) => {
      const updatedTrends = { ...prev.trendByDiagnosis };
      [...diagnosisTrends, ...prescriptionTrends].forEach((name) => {
        updatedTrends[name] = getDiagnosisTrend(filteredRecords, name);
      });

      return {
        ...prev,
        diagnoses: getDiagnosisCounts(filteredRecords),
        prescriptions: getDiagnosisCounts(filteredPrescriptions),
        drugs: getDrugCounts(filteredPrescriptions),
        genders: getGenderCounts(filteredPatients),
        ages: getAgeCounts(filteredPatients),
        male: mapToArray(maleMap),
        female: mapToArray(femaleMap),
        infant: mapToArray(infantMap),
        teen: mapToArray(teenMap),
        adult: mapToArray(adultMap),
        middleage: mapToArray(middleMap),
        senior: mapToArray(seniorMap),
        trendByDiagnosis: updatedTrends,
        ageCategories, // new field
      };
    });
  }, [
    rawPatients,
    startDate,
    endDate,
    activeTab,
    currentUserLinkId,
    linkedUserIds,
    user,
    userIsAdmin,
    filterByDate,
    diagnosisTrends,
    prescriptionTrends,
  ]);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    await new Promise((r) => setTimeout(r, 300));

    const element = reportRef.current;
    if (!element) {
      setIsGenerating(false);
      return;
    }

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        scrollY: 0,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const scopeSuffix = activeTab === "global" ? "Global" : "User";
      const fileName = `Medali_Analytics_Report_${scopeSuffix}_${new Date().toISOString().split("T")[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error("Report generation failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generatedAt = new Date().toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const dateRange =
    startDate || endDate
      ? `${startDate ? startDate.toLocaleDateString() : "All time"} – ${endDate ? endDate.toLocaleDateString() : "Present"}`
      : "";

  const scopeLabel =
    activeTab === "global"
      ? "Global (all patients)"
      : userIsSecretary
        ? linkedUser
          ? `Linked Doctor — ${linkedUser.firstName} ${linkedUser.lastName}`
          : "Linked Doctor — not linked"
        : `My Patients — ${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();

  const ageDataMap = {
    general: analytics.ages,
    infant: analytics.infant,
    teen: analytics.teen,
    adult: analytics.adult,
    middleage: analytics.middleage,
    senior: analytics.senior,
  } as const;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#00a896]/30 border-t-[#00a896] rounded-full animate-spin" />
          <p className="text-gray-700 font-semibold text-sm">
            Loading analytics…
          </p>
        </div>
      </div>
    );
  }

  const totalPatients = analytics.genders.reduce((s, d) => s + d.count, 0);
  const maleCount =
    analytics.genders.find((g) => g.label.toLowerCase() === "male")?.count ?? 0;
  const femaleCount =
    analytics.genders.find((g) => g.label.toLowerCase() === "female")?.count ??
    0;

  const userTabLocked = userIsSecretary && !linkedUser;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ── */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#00a896]/10">
              <Activity className="h-5 w-5 text-[#00a896]" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
                Medical Records Analytics
              </h1>
              <p className="text-sm text-gray-600 font-semibold">
                Records &amp; Prescriptions Overview
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <Popover open={openStart} onOpenChange={setOpenStart}>
              <PopoverTrigger asChild>
                <button className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-bold border border-gray-200 rounded-lg !bg-[#00c4b4] text-white hover:opacity-90 transition-colors shadow-sm">
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
                <button className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-bold border border-gray-200 rounded-lg !bg-[#00c4b4] text-white hover:opacity-90 transition-colors shadow-sm">
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
                className="inline-flex items-center gap-1 text-sm font-bold !bg-white text-red-500  border-black hover:text-red-400 transition-colors px-2 py-1"
              >
                <X className="h-3 w-3" /> Clear
              </button>
            )}
            {/* <button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg !bg-[#00a896] text-white hover:opacity-90 transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{" "}
                  Generating…
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" /> Generate Report
                </>
              )}
            </button> */}
          </div>
        </div>

        <div className="container mx-auto px-4 pb-3">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "global" | "user")}
          >
            <TabsList className="!bg-gray-100">
              <TabsTrigger
                value="global"
                className="flex items-center gap-1.5 !bg-white text-black"
              >
                <Users className="w-3.5 h-3.5" />
                Global Analytics
              </TabsTrigger>
              {!userIsAdmin && (
                <TabsTrigger
                  value="user"
                  className="flex items-center gap-1.5 !bg-white text-black"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  {userIsSecretary
                    ? "Linked Doctor's Analytics"
                    : "User Analytics"}
                </TabsTrigger>
              )}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* ── Hidden report ── */}
      <div
        className="fixed -left-[9999px] top-0 pointer-events-none"
        aria-hidden
      >
        <div ref={reportRef}>
          <ReportDocument
            analytics={analytics}
            generatedAt={generatedAt}
            dateRange={dateRange}
            scopeLabel={scopeLabel}
          />
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* ── Scope banner ── */}
        {activeTab === "user" && (
          <>
            {userTabLocked ? (
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  You are not linked to a doctor yet, so there's no linked data
                  to show. Link with a doctor to view their analytics here.
                </p>
              </div>
            ) : (
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 flex items-center gap-2">
                <Link2 className="w-4 h-4 text-blue-700 flex-shrink-0" />
                <p className="text-sm text-blue-800">
                  {userIsSecretary ? (
                    <>
                      Analytics of:{" "}
                      <strong>
                        {linkedUser?.firstName} {linkedUser?.lastName}
                      </strong>
                      .
                    </>
                  ) : (
                    <>
                      Showing analytics for patients you personally registered.
                    </>
                  )}
                </p>
              </div>
            )}
          </>
        )}

        {/* ══ Demographics ══ */}
        <SectionCard
          title="Patient Demographics"
          icon={Users}
          iconColor="#378add"
        >
          <div className="flex flex-wrap gap-3 mb-6">
            <StatPill label="Male" value={maleCount} />
            <StatPill label="Female" value={femaleCount} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SubCard title="Gender distribution">
              {analytics.genders.length ? (
                <Top5PieChart data={analytics.genders} />
              ) : (
                <p className="text-sm font-semibold text-gray-600 py-4 text-center">
                  No gender data available
                </p>
              )}
            </SubCard>
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
                        : "!bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
              {selectedAgeGroup === "general" ? (
                analytics.ageCategories.length ? (
                  <Top5PieChart data={analytics.ageCategories} />
                ) : (
                  <p className="text-sm font-semibold text-gray-600 py-4 text-center">
                    No age data available
                  </p>
                )
              ) : ageDataMap[selectedAgeGroup].length ? (
                <Top5PieChart
                  data={ageDataMap[selectedAgeGroup].map((d) => ({
                    ...d,
                    label: d.label + " yrs old",
                  }))}
                />
              ) : (
                <p className="text-sm font-semibold text-gray-600 py-4 text-center">
                  No data for this group
                </p>
              )}
            </SubCard>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <SubCard title="Top diagnoses — male">
              {analytics.male.length ? (
                <Top5PieChart data={analytics.male} />
              ) : (
                <p className="text-sm font-semibold text-gray-600 py-4 text-center">
                  No data
                </p>
              )}
            </SubCard>
            <SubCard title="Top diagnoses — female">
              {analytics.female.length ? (
                <Top5PieChart data={analytics.female} />
              ) : (
                <p className="text-sm font-semibold text-gray-600 py-4 text-center">
                  No data
                </p>
              )}
            </SubCard>
          </div>
        </SectionCard>

        {/* ══ Diagnoses ══ */}
        <SectionCard title="Diagnoses" icon={Stethoscope} iconColor="#00a896">
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

          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
              Consultation Records
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <SubCard title="Distribution">
                {analytics.diagnoses.length ? (
                  <Top5PieChart data={analytics.diagnoses} />
                ) : (
                  <p className="text-sm font-semibold text-gray-600 py-4 text-center">
                    No data
                  </p>
                )}
              </SubCard>
              <SubCard title="Monthly trend — click a row in the list below to plot">
                <TrendChart
                  seriesMap={analytics.trendByDiagnosis}
                  selected={diagnosisTrends}
                  onToggle={toggleDiagnosisTrend}
                  onClear={() => setDiagnosisTrends([])}
                />
              </SubCard>
            </div>
          </div>
          <SubCard title="CLICK A ROW BELOW TO VIEW ITS  MONTHLY TREND">
            <BarList
              data={analytics.diagnoses}
              title="Consultation records"
              description="Click any row to add it to the trend chart above"
              onItemClick={toggleDiagnosisTrend}
            />
          </SubCard>

          <div className="mt-6 mb-4">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
              Prescriptions
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <SubCard title="Distribution">
                {analytics.prescriptions.length ? (
                  <Top5PieChart data={analytics.prescriptions} />
                ) : (
                  <p className="text-sm font-semibold text-gray-600 py-4 text-center">
                    No data
                  </p>
                )}
              </SubCard>
              <SubCard title="Monthly trend — click a row in the list below to plot">
                <TrendChart
                  seriesMap={analytics.trendByDiagnosis}
                  selected={prescriptionTrends}
                  onToggle={togglePrescriptionTrend}
                  onClear={() => setPrescriptionTrends([])}
                />
              </SubCard>
            </div>
          </div>
          <SubCard title="CLICK A ROW BELOW TO VIEW ITS  MONTHLY TREND">
            <BarList
              data={analytics.prescriptions}
              title="Prescriptions"
              description="Click any row to add it to the trend chart above"
              onItemClick={togglePrescriptionTrend}
            />
          </SubCard>
        </SectionCard>

        {/* ══ Drugs ══ */}
        <SectionCard title="Prescribed Drugs" icon={Pill} iconColor="#8b5cf6">
          <div className="flex flex-wrap gap-3 mb-6">
            <Top1Banner
              label="Top Prescribed Drug"
              value={analytics.drugs[0]?.label ?? "—"}
              color="#8b5cf6"
            />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <SubCard title="Top 5 — distribution">
              {analytics.drugs.length ? (
                <Top5PieChart data={analytics.drugs} />
              ) : (
                <p className="text-sm font-semibold text-gray-600 py-4 text-center">
                  No data
                </p>
              )}
            </SubCard>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
