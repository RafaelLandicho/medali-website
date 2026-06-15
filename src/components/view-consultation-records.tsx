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

import { db } from "@/firebaseConfig";
import { ref, onValue } from "firebase/database";

import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/authprovider";
import { useIsMobile } from "@/hooks/use-mobile";
import { EmptyRecords } from "./empty-records";
import { AddRecordsDrawer } from "./add-records-drawer";
import { FullRecordsDrawer } from "./viewfull-records-drawer";
import { EditRecordsSheet } from "./edit-records-sheet";
import { PrescriptionDrawer } from "./add-prescription-drawer";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Prescription = {
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
  doctorId?: string;
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
  sharedWith?: string[];
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
};
type PatientWithRecord = Patient & MedicalRecord;

// ─── Stat Card (single stat) ──────────────────────────────────────────────────

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

// ─── Shared Helpers ────────────────────────────────────────────────────────────

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
        <Biohazard className="w-2.5 h-2.5" />
        TB+
      </span>
    )}
    {record.drugAllergy && (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-orange-100 text-orange-700 border border-orange-200">
        <AlertTriangle className="w-2.5 h-2.5" />
        Drug Allergy
      </span>
    )}
    {record.foodAllergy && (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-yellow-100 text-yellow-700 border border-yellow-200">
        <UtensilsCrossed className="w-2.5 h-2.5" />
        Food Allergy
      </span>
    )}
    {!record.isTBPositive && !record.drugAllergy && !record.foodAllergy && (
      <span className="text-gray-300 text-xs">—</span>
    )}
  </div>
);

// Consultation Record Actions

const ConsultationRecordActions = ({ records }: { records: MedicalRecord }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const patient = location.state as Patient | null;
  const [openUser, setOpenUser] = React.useState(false);
  const [openEdit, setOpenEdit] = React.useState(false);
  const [openPrescription, setOpenPrescription] = React.useState(false);
  const [hasPrescription, sethasPrescription] = React.useState(false);

  React.useEffect(() => {
    if (!patient?.id || !records.recordId) return;

    const prescriptionRef = ref(
      db,
      `patients/${patient.id}/records/${records.recordId}/prescription`,
    );

    const unsub = onValue(prescriptionRef, (snapshot) => {
      sethasPrescription(snapshot.exists());
    });

    return () => unsub();
  }, [patient?.id, records.recordId]);
  const userIsDoctor =
    user?.type?.toLowerCase() === "doctor" ||
    user?.type?.toLowerCase() === "admin";

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

      {/* <button
        onClick={() => setOpenEdit(true)}
        title="Edit patient"
        className="inline-flex items-center justify-center w-7 h-7 rounded border border-gray-200 !bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors"
      >
        <PenIcon className="w-3.5 h-3.5 text-[#00a896]" />
      </button>
      <EditRecordsSheet
        open={openEdit}
        onOpenChange={setOpenEdit}
        patient={patientWithRecord}
      /> */}

      {userIsDoctor && !hasPrescription && (
        <div>
          <button
            onClick={() => setOpenPrescription(true)}
            title="Add Prescription"
            className="inline-flex items-center justify-center w-7 h-7 rounded border border-gray-200 !bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            <PillIcon className="w-3.5 h-3.5 text-[#00a896]" />
          </button>
        </div>
      )}

      {userIsDoctor && hasPrescription && (
        <div>
          <button
            onClick={() => setOpenPrescription(true)}
            title="View Prescription"
            className="inline-flex items-center justify-center w-7 h-7 rounded border border-gray-200 !bg-green-100 hover:bg-green-50 transition-colors"
          >
            <PillIcon className="w-3.5 h-3.5 text-green-600" />
          </button>
        </div>
      )}
      <PrescriptionDrawer
        open={openPrescription}
        onOpenChange={setOpenPrescription}
        patient={patientWithRecord}
      />
    </div>
  );
};

//View Prescription

const ViewPrescriptionDialog = ({
  open,
  onOpenChange,
  record,
  patient,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: MedicalRecord;
  patient: Patient;
}) => {
  const prescription = record.prescription;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Prescription Details</DialogTitle>
          <DialogDescription>
            {patient.firstName} {patient.lastName}
            {prescription?.updatedAt ? ` · ${prescription.updatedAt}` : ""}
            {` · Record #${record.recordNumber ?? record.recordId}`}
          </DialogDescription>
        </DialogHeader>

        {!prescription ? (
          <p className="text-sm text-gray-400 py-4">
            No prescription found for this record.
          </p>
        ) : (
          <div className="space-y-5">
            {/* Diagnosis */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Diagnosis
              </p>
              {prescription.diagnosis?.length ? (
                <div className="space-y-2">
                  {prescription.diagnosis.map((d, i) => (
                    <div
                      key={i}
                      className="flex flex-col gap-1 p-2.5 rounded-lg border border-gray-100 bg-gray-50"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-800">
                          {d.diagnosis}
                        </span>
                        <SeverityBadge severity={d.severity} />
                      </div>
                      {d.notes && (
                        <span className="text-xs text-gray-500 italic">
                          {d.notes}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-300">No diagnosis recorded</p>
              )}
            </div>

            {/* Drugs */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Drugs
              </p>
              {prescription.drugs?.length ? (
                <div className="space-y-1.5">
                  {prescription.drugs.map((drug, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-100 bg-gray-50 text-sm flex-wrap"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00a896] shrink-0" />
                      <span className="font-medium text-gray-800">
                        {drug.medicine}
                      </span>
                      {(drug.dosage || drug.unit) && (
                        <span className="text-gray-400">
                          · {drug.dosage}
                          {drug.unit}
                        </span>
                      )}
                      {drug.frequency && (
                        <span className="text-gray-400">
                          · {drug.frequency}
                        </span>
                      )}
                      {drug.purpose && (
                        <span className="text-gray-400">· {drug.purpose}</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-300">No drugs prescribed</p>
              )}
            </div>

            {/* Examination & Recommendation */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Examination
                </p>
                <p className="text-sm text-gray-700">
                  {prescription.examination || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Recommendation
                </p>
                <p className="text-sm text-gray-700">
                  {prescription.recommendation || "—"}
                </p>
              </div>
            </div>

            {/* Meta */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-400 flex-wrap gap-1">
              <span>
                Added by {prescription.addedBy || "—"}
                {prescription.field ? ` · ${prescription.field}` : ""}
              </span>
              {prescription.updatedAt && <span>{prescription.updatedAt}</span>}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

//  Prescription Record Actions

const PrescriptionRecordActions = ({ record }: { record: MedicalRecord }) => {
  const { user } = useAuth();
  const location = useLocation();
  const patient = location.state as Patient | null;
  const [openView, setOpenView] = React.useState(false);
  const [openEdit, setOpenEdit] = React.useState(false);

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
      <ViewPrescriptionDialog
        open={openView}
        onOpenChange={setOpenView}
        record={record}
        patient={patient}
      />

      {userIsDoctor && (
        <button
          onClick={() => setOpenEdit(true)}
          title="Edit prescription"
          className="inline-flex items-center justify-center w-7 h-7 rounded border border-gray-200 !bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors"
        >
          <PenIcon className="w-3.5 h-3.5 text-[#00a896]" />
        </button>
      )}
      <PrescriptionDrawer
        open={openEdit}
        onOpenChange={setOpenEdit}
        patient={patientWithRecord}
      />
    </div>
  );
};

// Consultation Record Columns

const columns: ColumnDef<MedicalRecord>[] = [
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
  {
    accessorKey: "bloodPressure",
    header: "BP",
    cell: ({ row }) => (
      <span className="text-sm text-gray-700">
        {row.original.bloodPressure || "—"}
      </span>
    ),
  },
  {
    accessorKey: "heartRate",
    header: "Heart Rate",
    cell: ({ row }) => (
      <span className="text-sm text-gray-700">
        {row.original.heartRate || "—"}
      </span>
    ),
  },
  {
    accessorKey: "temperature",
    header: "Temp",
    cell: ({ row }) => (
      <span className="text-sm text-gray-700">
        {row.original.temperature || "—"}
      </span>
    ),
  },
  {
    accessorKey: "oxygenSaturation",
    header: "O₂ Sat",
    cell: ({ row }) => (
      <span className="text-sm text-gray-700">
        {row.original.oxygenSaturation || "—"}
      </span>
    ),
  },
  {
    accessorKey: "weight",
    header: "Weight",
    cell: ({ row }) => (
      <span className="text-sm text-gray-700">
        {row.original.weight || "—"}
      </span>
    ),
  },
  {
    accessorKey: "height",
    header: "Height",
    cell: ({ row }) => (
      <span className="text-sm text-gray-700">
        {row.original.height || "—"}
      </span>
    ),
  },
  {
    id: "risks",
    header: "Risk Flags",
    enableSorting: false,
    cell: ({ row }) => <RiskIndicators record={row.original} />,
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
];

// Prescription Columns──

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
    id: "addedBy",
    header: "Added By",
    cell: ({ row }) => (
      <span className="text-sm text-gray-700">
        {row.original.prescription?.addedBy || "—"}
      </span>
    ),
  },
  {
    id: "updatedAt",
    header: "Date",
    cell: ({ row }) => (
      <span className="text-xs text-gray-500 whitespace-nowrap">
        {row.original.prescription?.updatedAt || "—"}
      </span>
    ),
  },
];

export function ConsultationRecords() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const location = useLocation();

  const patient = location.state as Patient | null;

  const [records, setRecords] = React.useState<MedicalRecord[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] = React.useState<
    Record<string, boolean>
  >({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [searchValue, setSearchValue] = React.useState("");

  const [prescSorting, setPrescSorting] = React.useState<SortingState>([]);
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

    const usersRef = ref(db, "users");
    const outerUnsub = onValue(usersRef, (usersSnap) => {
      innerUnsub?.();

      const currentUser = (usersSnap.val() || {})[user.uid];
      if (!currentUser) {
        setLoading(false);
        return;
      }

      const recordsRef = ref(db, `patients/${patient.id}/records`);
      innerUnsub = onValue(recordsRef, (snapshot) => {
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
                };
              })
              .filter((record) => {
                if (currentUser.type === "admin") return true;
                const sharedWith = record.sharedWith || [];
                return (
                  record.createdBy === user.uid || sharedWith.includes(user.uid)
                );
              })
          : [];
        setRecords(fetched);
        setLoading(false);
      });
    });

    return () => {
      outerUnsub();
      innerUnsub?.();
    };
  }, [user, patient?.id]);

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

  // Records that actually have a prescription attached
  const prescriptionRecords = React.useMemo(
    () => records.filter((r) => !!r.prescription),
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

  // ─── Guards ──────────────────────────────────────────────────────────────────
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
            const col = table.getColumn("patientDiagnosis");
            if (col) col.setFilterValue(e.target.value || undefined);
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

  const Pagination = (
    <div className="flex items-center justify-between pt-1 text-xs text-gray-500">
      <span>
        {filteredRows.length === 0
          ? "No records"
          : `${
              table.getState().pagination.pageIndex *
                table.getState().pagination.pageSize +
              1
            }–${Math.min(
              (table.getState().pagination.pageIndex + 1) *
                table.getState().pagination.pageSize,
              filteredRows.length,
            )} of ${filteredRows.length}`}
      </span>
      <div className="flex gap-1.5 items-center">
        <button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className="px-3 py-1.5 text-xs font-medium rounded border !bg-[#00a896] !text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          ← {isMobile ? "" : "Previous"}
        </button>
        <span className="px-2">
          {table.getState().pagination.pageIndex + 1} /{" "}
          {table.getPageCount() || 1}
        </span>
        <button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className="px-3 py-1.5 text-xs font-medium rounded border !bg-[#00a896] !text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {isMobile ? "" : "Next"} →
        </button>
      </div>
    </div>
  );

  const PrescriptionToolbar = (
    <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
      <div className="relative flex-1 sm:max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search by diagnosis or drug…"
          value={prescSearchValue}
          onChange={(e) => {
            const value = e.target.value;
            setPrescSearchValue(value);
            const diagCol = prescriptionTable.getColumn("diagnosis");
            const drugCol = prescriptionTable.getColumn("drugs");
            diagCol?.setFilterValue(value || undefined);
            drugCol?.setFilterValue(value || undefined);
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
            {prescriptionTable
              .getAllColumns()
              .filter((col) => col.getCanHide())
              .map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  className="capitalize text-sm"
                  checked={col.getIsVisible()}
                  onCheckedChange={(val) => col.toggleVisibility(val)}
                >
                  {col.id
                    .replace(/([A-Z])/g, " $1")
                    .replace(/^./, (s) => s.toUpperCase())}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );

  const PrescriptionPagination = (
    <div className="flex items-center justify-between pt-1 text-xs text-gray-500">
      <span>
        {prescFilteredRows.length === 0
          ? "No prescriptions"
          : `${
              prescriptionTable.getState().pagination.pageIndex *
                prescriptionTable.getState().pagination.pageSize +
              1
            }–${Math.min(
              (prescriptionTable.getState().pagination.pageIndex + 1) *
                prescriptionTable.getState().pagination.pageSize,
              prescFilteredRows.length,
            )} of ${prescFilteredRows.length}`}
      </span>
      <div className="flex gap-1.5 items-center">
        <button
          onClick={() => prescriptionTable.previousPage()}
          disabled={!prescriptionTable.getCanPreviousPage()}
          className="px-3 py-1.5 text-xs font-medium rounded border !bg-[#00a896] !text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          ← {isMobile ? "" : "Previous"}
        </button>
        <span className="px-2">
          {prescriptionTable.getState().pagination.pageIndex + 1} /{" "}
          {prescriptionTable.getPageCount() || 1}
        </span>
        <button
          onClick={() => prescriptionTable.nextPage()}
          disabled={!prescriptionTable.getCanNextPage()}
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

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-5 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 tracking-tight">
            {patient.firstName} {patient.lastName}
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
            Consultation Records
          </p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 text-sm font-semibold text-white !bg-[#00a896] rounded-lg shadow hover:opacity-90 transition"
        >
          ← {isMobile ? "Back" : "Back to Records"}
        </button>
      </div>

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
            {/* {prescriptionRecords.length > 0 && (
              <span className="ml-1 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full bg-[#00a896]/10 text-[#00a896] text-[10px] font-semibold">
                {prescriptionRecords.length}
              </span>
            )} */}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="records" className="flex flex-col gap-4 mt-4">
          <StatCard
            label="Total Records: "
            value={records.length}
            icon={<ClipboardList className="w-4 h-4" />}
            color="text-[#00a896]"
            bg="bg-[#00a896]/10"
          />
          {Toolbar}

          {isMobile ? (
            <>
              {filteredRows.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-white p-6">
                  <div className="rounded-xl border border-gray-200 bg-white p-10 flex flex-col items-center justify-center text-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-[#00a896]/10 flex items-center justify-center">
                      <ClipboardList className="w-5 h-5 text-[#00a896]" />
                    </div>
                    <p className="text-sm font-medium text-gray-700">
                      No consultation records yet
                    </p>
                    <p className="text-xs text-gray-400 max-w-xs">
                      Consultation Records created for your patient will appear
                      here.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {table.getRowModel().rows.map((row) => {
                    const r = row.original;
                    return (
                      <div
                        key={row.id}
                        className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 space-y-3"
                      >
                        {/* Diagnosis */}
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

                        {/* Risk Flags */}
                        <div>
                          <p className="text-[10px] uppercase text-gray-400 font-semibold mb-1">
                            Risk Flags
                          </p>
                          <RiskIndicators record={r} />
                        </div>

                        {/* Vitals */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                          {[
                            { label: "Symptoms", value: r.symptoms },
                            { label: "BP", value: r.bloodPressure },
                            { label: "Heart Rate", value: r.heartRate },
                            { label: "Temperature", value: r.temperature },
                            { label: "O₂ Sat", value: r.oxygenSaturation },
                            { label: "Weight", value: r.weight },
                            { label: "Height", value: r.height },
                            { label: "Added By", value: r.addedBy },
                          ].map(({ label, value }) => (
                            <div key={label}>
                              <span className="text-gray-400">{label}</span>
                              <p className="text-gray-700 font-medium truncate">
                                {value || "—"}
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* Actions */}
                        <div className="pt-2 border-t border-gray-100">
                          <ConsultationRecordActions records={r} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {Pagination}
            </>
          ) : (
            /* ─── Desktop ──────────────────────────────────────────────────── */
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
                      {table.getRowModel().rows.length ? (
                        table.getRowModel().rows.map((row, i) => (
                          <TableRow
                            key={row.id}
                            className={`border-b border-gray-100 transition-colors hover:bg-[#00a896]/5 ${
                              i % 2 === 0 ? "bg-white" : "bg-gray-50/40"
                            }`}
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
                            <div className="rounded-xl border border-gray-200 bg-white p-6">
                              <div className="rounded-xl border border-gray-200 bg-white p-10 flex flex-col items-center justify-center text-center gap-2">
                                <div className="w-10 h-10 rounded-lg bg-[#00a896]/10 flex items-center justify-center">
                                  <ClipboardList className="w-5 h-5 text-[#00a896]" />
                                </div>
                                <p className="text-sm font-medium text-gray-700">
                                  No consultation records yet
                                </p>
                                <p className="text-xs text-gray-400 max-w-xs">
                                  Consultation Records created for your patient
                                  will appear here.
                                </p>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
              {Pagination}
            </>
          )}
        </TabsContent>

        <TabsContent value="prescriptions" className="flex flex-col gap-4 mt-4">
          <StatCard
            label="Total Prescriptions: "
            value={prescriptionRecords.length}
            icon={<Pill className="w-4 h-4" />}
            color="text-purple-600"
            bg="bg-purple-50"
          />
          {prescriptionRecords.length > 0 && PrescriptionToolbar}

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
                            <span className="text-gray-400">Added by</span>
                            <p className="text-gray-700 font-medium truncate">
                              {p.addedBy || "—"}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-400">Date</span>
                            <p className="text-gray-700 font-medium truncate">
                              {p.updatedAt || "—"}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {prescriptionRecords.length > 0 && PrescriptionPagination}
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
                                  className={`border-b border-gray-100 transition-colors hover:bg-[#00a896]/5 ${
                                    i % 2 === 0 ? "bg-white" : "bg-gray-50/40"
                                  }`}
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
                  {PrescriptionPagination}
                </>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
