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
  CheckCircle2,
  XCircle,
  ClipboardList,
  Users,
  UserPlus,
  AlertTriangle,
  Biohazard,
  UtensilsCrossed,
  FilePenLine,
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
  DialogClose,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { db } from "@/firebaseConfig";
import {
  ref,
  onValue,
  remove,
  set,
  push,
  get,
  update,
} from "firebase/database";
import { useAuth } from "@/auth/authprovider";
import { useIsMobile } from "@/hooks/use-mobile";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PendingPatient = {
  id: string;
  patientId?: string;
  firstName: string;
  lastName: string;
  gender: string;
  age: number;
  birthdate?: string;
  address?: string;
  address1?: string;
  address2?: string;
  city?: string;
  province?: string;
  telephone?: string;
  status?: string;
  addedBy?: string;
  createdBy?: string;
  createdAt?: number;
  sharedWith?: string[];
  // Shared doctor/secretary pair id — anyone whose current linkId matches
  // this value should be able to see and act on this pending patient.
  linkId?: string | null;
};

export type PendingRecord = {
  id: string;
  recordId?: string;
  patientId?: string;
  recordNumber?: number;
  diagnosis?: { diagnosis: string; severity: string; notes: string }[];
  symptoms?: string;
  bloodPressure?: string;
  heartRate?: string;
  respiratoryRate?: string;
  temperature?: string;
  oxygenSaturation?: string;
  weight?: string;
  height?: string;
  medicalCare?: boolean;
  drugAllergy?: boolean;
  foodAllergy?: boolean;
  isTBPositive?: boolean;
  hasClinician?: boolean;
  diet?: boolean;
  familyHistory?: {
    relation: string;
    age: string;
    healthProblems: string;
    goodHealth: boolean;
    isAlive: boolean;
  }[];
  addedBy?: string;
  createdBy?: string;
  createdAt?: number;
  status?: string;
  // Shared doctor/secretary pair id — see PendingPatient.linkId above.
  linkId?: string | null;
};

export type PendingUpdate = {
  id: string;
  recordId?: string;
  patientId: string;
  firstName: string;
  lastName: string;
  gender?: string;
  age?: number;
  birthdate?: string;
  address?: string;
  address1?: string;
  address2?: string;
  city?: string;
  province?: string;
  telephone?: string;
  bloodPressure?: string;
  heartRate?: string;
  respiratoryRate?: string;
  temperature?: string;
  oxygenSaturation?: string;
  weight?: string;
  height?: string;
  symptoms?: string;
  medicalCare?: boolean;
  drugAllergy?: boolean;
  foodAllergy?: boolean;
  isTBPositive?: boolean;
  hasClinician?: boolean;
  diet?: boolean;
  submittedBy?: string;
  submittedAt?: number;
  status?: string;
  updateApprovedBy?: string;
  updateApprovedAt?: string;
};

// ─── Shared Helpers ───────────────────────────────────────────────────────────

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

const RiskIndicators = ({ record }: { record: PendingRecord }) => (
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

async function logAction(message: string) {
  const newLogRef = push(ref(db, "logs/"));
  await set(newLogRef, {
    medicalRecordLog: message,
    logTime: new Date().toLocaleString(),
  });
}

// ─── Reusable confirm dialog ──────────────────────────────────────────────────
const ConfirmAction = ({
  trigger,
  title,
  description,
  confirmLabel,
  confirmingLabel,
  confirmClassName,
  errorMessage,
  onConfirm,
}: {
  trigger: React.ReactNode;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  confirmingLabel: string;
  confirmClassName: string;
  errorMessage: string;
  onConfirm: () => Promise<void>;
}) => {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      setOpen(false);
    } catch (err) {
      console.error(err);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex justify-end gap-2">
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className={confirmClassName}
          >
            {loading ? confirmingLabel : confirmLabel}
          </Button>
          <DialogClose asChild>
            <Button
              variant="outline"
              className="!bg-red-600 !text-white"
              disabled={loading}
            >
              Cancel
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const ApproveButton = (
  props: React.ComponentProps<typeof Button> & { title: string },
) => (
  <Button
    variant="outline"
    size="icon"
    {...props}
    className={`w-7 h-7 border-green-200 !bg-white hover:bg-green-50 ${props.className ?? ""}`}
  >
    <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
  </Button>
);

const RejectButton = (
  props: React.ComponentProps<typeof Button> & { title: string },
) => (
  <Button
    variant="outline"
    size="icon"
    {...props}
    className={`w-7 h-7 border-red-200 !bg-white hover:bg-red-50 ${props.className ?? ""}`}
  >
    <XCircle className="w-3.5 h-3.5 text-red-500" />
  </Button>
);

// ─── Pending Patient Actions ──────────────────────────────────────────────────

const PendingPatientActions = ({
  patient,
  onRemove,
}: {
  patient: PendingPatient;
  onRemove: (id: string) => void;
}) => {
  const { user } = useAuth();
  if (!user) return null;

  const handleApprove = async () => {
    onRemove(patient.id); // optimistic remove
    const targetId = patient.patientId || patient.id;
    await set(ref(db, `patients/${targetId}`), {
      ...patient,
      id: targetId,
      status: "approved",
      approvedBy: `${user.firstName} ${user.lastName}`,
      approvedAt: new Date().toISOString(),
    });
    await remove(ref(db, `pending/patients/${patient.id}`));
    await logAction(
      `Patient approved by ${user.firstName} ${user.lastName}: ${patient.firstName} ${patient.lastName}`,
    );
    toast.success("Patient approved and moved to active records.");
  };

  const handleReject = async () => {
    onRemove(patient.id);
    await remove(ref(db, `pending/patients/${patient.id}`));
    await logAction(
      `Patient rejected by ${user.firstName} ${user.lastName}: ${patient.firstName} ${patient.lastName}`,
    );
    toast.success("Patient record rejected.");
  };

  return (
    <div className="flex items-center gap-1">
      <ConfirmAction
        trigger={<ApproveButton title="Approve patient" />}
        title="Approve Patient"
        description={
          <>
            Move{" "}
            <span className="font-semibold">
              {patient.firstName} {patient.lastName}
            </span>{" "}
            to active patient records?
          </>
        }
        confirmLabel="Approve"
        confirmingLabel="Approving…"
        confirmClassName="bg-green-600 hover:bg-green-700 text-white"
        errorMessage="Failed to approve patient."
        onConfirm={handleApprove}
      />
      <ConfirmAction
        trigger={<RejectButton title="Reject patient" />}
        title="Reject Patient"
        description={
          <>
            Permanently delete the pending record for{" "}
            <span className="font-semibold">
              {patient.firstName} {patient.lastName}
            </span>
            ? This cannot be undone.
          </>
        }
        confirmLabel="Reject"
        confirmingLabel="Rejecting…"
        confirmClassName="bg-red-600 hover:bg-red-700 text-white"
        errorMessage="Failed to reject patient."
        onConfirm={handleReject}
      />
    </div>
  );
};

// ─── Pending Record Actions ───────────────────────────────────────────────────

const PendingRecordActions = ({
  record,
  onRemove,
}: {
  record: PendingRecord;
  onRemove: (id: string) => void;
}) => {
  const { user } = useAuth();
  const [patientName, setPatientName] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!record.patientId) return;
    get(ref(db, `patients/${record.patientId}`)).then((snap) => {
      if (snap.exists()) {
        const p = snap.val();
        setPatientName(`${p.firstName} ${p.lastName}`);
      }
    });
  }, [record.patientId]);

  if (!user) return null;

  const handleApprove = async () => {
    if (!record.patientId) throw new Error("Missing patientId on record");

    onRemove(record.id); // optimistic remove

    const newRecord = push(ref(db, `patients/${record.patientId}/records`));
    const { id: _id, ...recordData } = record;

    await set(newRecord, {
      ...recordData,
      recordId: newRecord.key,
      status: "approved",
      approvedBy: `${user.firstName} ${user.lastName}`,
      approvedAt: new Date().toISOString(),
    });
    await remove(ref(db, `pending/records/${record.id}`));
    await logAction(
      `Consultation record approved by ${user.firstName} ${user.lastName}${
        patientName ? ` for ${patientName}` : ""
      }`,
    );
    toast.success("Consultation record approved.");
  };

  const handleReject = async () => {
    onRemove(record.id); // optimistic remove
    await remove(ref(db, `pending/records/${record.id}`));
    await logAction(
      `Consultation record rejected by ${user.firstName} ${user.lastName}${
        patientName ? ` for ${patientName}` : ""
      }`,
    );
    toast.success("Consultation record rejected.");
  };

  return (
    <div className="flex items-center gap-1">
      <ConfirmAction
        trigger={<ApproveButton title="Approve record" />}
        title="Approve Consultation Record"
        description={
          <>
            Add this consultation record to{" "}
            <span className="font-semibold">
              {patientName ?? "the patient"}
            </span>
            &apos;s active records?
          </>
        }
        confirmLabel="Approve"
        confirmingLabel="Approving…"
        confirmClassName="!bg-green-600 hover:bg-green-700 !text-white"
        errorMessage="Failed to approve record."
        onConfirm={handleApprove}
      />
      <ConfirmAction
        trigger={<RejectButton title="Reject record" />}
        title="Reject Consultation Record"
        description="Permanently delete this pending consultation record? This cannot be undone."
        confirmLabel="Reject"
        confirmingLabel="Rejecting…"
        confirmClassName="!bg-red-600 hover:bg-red-700 !text-white"
        errorMessage="Failed to reject record."
        onConfirm={handleReject}
      />
    </div>
  );
};

// ─── Pending Update Actions ───────────────────────────────────────────────────

const PendingUpdateActions = ({
  update: pendingUpdate,
  onRemove,
}: {
  update: PendingUpdate;
  onRemove: (id: string) => void;
}) => {
  const { user } = useAuth();
  if (!user) return null;

  const handleApprove = async () => {
    const { patientId, recordId, ...updateData } = pendingUpdate;

    if (!recordId) {
      throw new Error("Missing recordId – cannot update record.");
    }

    onRemove(pendingUpdate.id);

    const recordRef = ref(db, `patients/${patientId}/records/${recordId}`);

    const payload: Record<string, any> = {};
    if (updateData.firstName !== undefined)
      payload.firstName = updateData.firstName;
    if (updateData.lastName !== undefined)
      payload.lastName = updateData.lastName;
    if (updateData.gender !== undefined) payload.gender = updateData.gender;
    if (updateData.age !== undefined) payload.age = updateData.age;
    if (updateData.birthdate !== undefined)
      payload.birthdate = updateData.birthdate;
    if (updateData.telephone !== undefined)
      payload.telephone = updateData.telephone;

    if (
      updateData.address1 !== undefined ||
      updateData.address2 !== undefined ||
      updateData.city !== undefined ||
      updateData.province !== undefined
    ) {
      payload.address = [
        updateData.address1,
        updateData.address2,
        updateData.city,
        updateData.province,
      ]
        .filter(Boolean)
        .join(", ");
      if (updateData.address1 !== undefined)
        payload.address1 = updateData.address1;
      if (updateData.address2 !== undefined)
        payload.address2 = updateData.address2;
      if (updateData.city !== undefined) payload.city = updateData.city;
      if (updateData.province !== undefined)
        payload.province = updateData.province;
    }

    if (updateData.bloodPressure !== undefined)
      payload.bloodPressure = updateData.bloodPressure;
    if (updateData.heartRate !== undefined)
      payload.heartRate = updateData.heartRate;
    if (updateData.respiratoryRate !== undefined)
      payload.respiratoryRate = updateData.respiratoryRate;
    if (updateData.temperature !== undefined)
      payload.temperature = updateData.temperature;
    if (updateData.oxygenSaturation !== undefined)
      payload.oxygenSaturation = updateData.oxygenSaturation;
    if (updateData.weight !== undefined) payload.weight = updateData.weight;
    if (updateData.height !== undefined) payload.height = updateData.height;

    if (updateData.medicalCare !== undefined)
      payload.medicalCare = updateData.medicalCare;
    if (updateData.drugAllergy !== undefined)
      payload.drugAllergy = updateData.drugAllergy;
    if (updateData.foodAllergy !== undefined)
      payload.foodAllergy = updateData.foodAllergy;
    if (updateData.isTBPositive !== undefined)
      payload.isTBPositive = updateData.isTBPositive;
    if (updateData.hasClinician !== undefined)
      payload.hasClinician = updateData.hasClinician;
    if (updateData.diet !== undefined) payload.diet = updateData.diet;
    if (updateData.symptoms !== undefined)
      payload.symptoms = updateData.symptoms;

    payload.updateApprovedBy = `${user.firstName} ${user.lastName}`;
    payload.updateApprovedAt = new Date().toISOString();
    payload.updatedBy = `${user.firstName} ${user.lastName}`;
    payload.updatedAt = Date.now();

    await update(recordRef, payload);
    await remove(ref(db, `pending/updates/${pendingUpdate.id}`));
    await logAction(
      `Patient record update approved by ${user.firstName} ${user.lastName} for ${pendingUpdate.firstName} ${pendingUpdate.lastName}`,
    );
    toast.success("Patient record updated successfully.");
  };

  const handleReject = async () => {
    onRemove(pendingUpdate.id); // optimistic remove
    await remove(ref(db, `pending/updates/${pendingUpdate.id}`));
    await logAction(
      `Patient record update rejected by ${user.firstName} ${user.lastName} for ${pendingUpdate.firstName} ${pendingUpdate.lastName}`,
    );
    toast.success("Update rejected.");
  };

  return (
    <div className="flex items-center gap-1">
      <ConfirmAction
        trigger={<ApproveButton title="Approve update" />}
        title="Approve Record Update"
        description={
          <>
            Apply this update to{" "}
            <span className="font-semibold">
              {pendingUpdate.firstName} {pendingUpdate.lastName}
            </span>
            &apos;s patient record?
          </>
        }
        confirmLabel="Approve"
        confirmingLabel="Approving…"
        confirmClassName="!bg-green-600 hover:bg-green-700 !text-white"
        errorMessage="Failed to approve update."
        onConfirm={handleApprove}
      />
      <ConfirmAction
        trigger={<RejectButton title="Reject update" />}
        title="Reject Record Update"
        description={
          <>
            Discard the pending update for{" "}
            <span className="font-semibold">
              {pendingUpdate.firstName} {pendingUpdate.lastName}
            </span>
            ? This cannot be undone.
          </>
        }
        confirmLabel="Reject"
        confirmingLabel="Rejecting…"
        confirmClassName="!bg-green-600 hover:bg-red-700 !text-white"
        errorMessage="Failed to reject update."
        onConfirm={handleReject}
      />
    </div>
  );
};

// ─── Column factory functions ─────────────────────────────────────────────────

function makePatientColumns(
  onRemove: (id: string) => void,
): ColumnDef<PendingPatient>[] {
  return [
    {
      id: "actions",
      header: "",
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <PendingPatientActions patient={row.original} onRemove={onRemove} />
      ),
    },
    {
      accessorKey: "firstName",
      header: "First Name",
      cell: ({ row }) => (
        <span className="text-sm font-medium text-gray-800">
          {row.original.firstName}
        </span>
      ),
    },
    {
      accessorKey: "lastName",
      header: "Last Name",
      cell: ({ row }) => (
        <span className="text-sm font-medium text-gray-800">
          {row.original.lastName}
        </span>
      ),
    },
    {
      accessorKey: "gender",
      header: "Gender",
      cell: ({ row }) => (
        <span className="text-sm text-gray-700">
          {row.original.gender || "—"}
        </span>
      ),
    },
    {
      accessorKey: "age",
      header: "Age",
      cell: ({ row }) => (
        <span className="text-sm text-gray-700">{row.original.age || "—"}</span>
      ),
    },
    {
      accessorKey: "address",
      header: "Address",
      cell: ({ row }) => (
        <span className="text-sm text-gray-700">
          {row.original.address ||
            [row.original.address1, row.original.city, row.original.province]
              .filter(Boolean)
              .join(", ") ||
            "—"}
        </span>
      ),
    },
    {
      accessorKey: "telephone",
      header: "Contact",
      cell: ({ row }) => (
        <span className="text-sm text-gray-700">
          {row.original.telephone || "—"}
        </span>
      ),
    },
    {
      accessorKey: "addedBy",
      header: "Submitted By",
      cell: ({ row }) => (
        <span className="text-sm text-gray-700">
          {row.original.addedBy || "—"}
        </span>
      ),
    },
  ];
}

function makeRecordColumns(
  onRemove: (id: string) => void,
): ColumnDef<PendingRecord>[] {
  return [
    {
      id: "actions",
      header: "",
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <PendingRecordActions record={row.original} onRemove={onRemove} />
      ),
    },
    {
      id: "patientId",
      header: "Patient ID",
      cell: ({ row }) => (
        <span className="text-xs text-gray-500 font-mono">
          {row.original.patientId || "—"}
        </span>
      ),
    },
    {
      id: "diagnosis",
      header: "Diagnosis",
      filterFn: (row, _id, filterValue) => {
        if (!filterValue) return true;
        const diagnoses = row.original.diagnosis || [];
        const term = String(filterValue).toLowerCase();
        return diagnoses.some(
          (d) =>
            d.diagnosis?.toLowerCase().includes(term) ||
            d.severity?.toLowerCase().includes(term) ||
            d.notes?.toLowerCase().includes(term),
        );
      },
      cell: ({ row }) => {
        const diagnosis = row.original.diagnosis;
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
      id: "risks",
      header: "Risk Flags",
      enableSorting: false,
      cell: ({ row }) => <RiskIndicators record={row.original} />,
    },
    {
      accessorKey: "addedBy",
      header: "Submitted By",
      cell: ({ row }) => (
        <span className="text-sm text-gray-700">
          {row.original.addedBy || "—"}
        </span>
      ),
    },
  ];
}

function makeUpdateColumns(
  onRemove: (id: string) => void,
): ColumnDef<PendingUpdate>[] {
  return [
    {
      id: "actions",
      header: "",
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <PendingUpdateActions update={row.original} onRemove={onRemove} />
      ),
    },
    {
      accessorKey: "firstName",
      header: "First Name",
      cell: ({ row }) => (
        <span className="text-sm font-medium text-gray-800">
          {row.original.firstName}
        </span>
      ),
    },
    {
      accessorKey: "lastName",
      header: "Last Name",
      cell: ({ row }) => (
        <span className="text-sm font-medium text-gray-800">
          {row.original.lastName}
        </span>
      ),
    },
    {
      accessorKey: "gender",
      header: "Gender",
      cell: ({ row }) => (
        <span className="text-sm text-gray-700">
          {row.original.gender || "—"}
        </span>
      ),
    },
    {
      accessorKey: "age",
      header: "Age",
      cell: ({ row }) => (
        <span className="text-sm text-gray-700">{row.original.age || "—"}</span>
      ),
    },
    {
      id: "address",
      header: "Address",
      cell: ({ row }) => {
        const u = row.original;
        const addr =
          u.address ||
          [u.address1, u.city, u.province].filter(Boolean).join(", ");
        return <span className="text-sm text-gray-700">{addr || "—"}</span>;
      },
    },
    {
      accessorKey: "telephone",
      header: "Contact",
      cell: ({ row }) => (
        <span className="text-sm text-gray-700">
          {row.original.telephone || "—"}
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
      accessorKey: "temperature",
      header: "Temp",
      cell: ({ row }) => (
        <span className="text-sm text-gray-700">
          {row.original.temperature || "—"}
        </span>
      ),
    },
    {
      accessorKey: "submittedBy",
      header: "Submitted By",
      cell: ({ row }) => (
        <span className="text-sm text-gray-700">
          {row.original.submittedBy || "—"}
        </span>
      ),
    },
  ];
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PendingRecords() {
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const [pendingPatients, setPendingPatients] = React.useState<
    PendingPatient[]
  >([]);
  const [pendingRecords, setPendingRecords] = React.useState<PendingRecord[]>(
    [],
  );
  const [pendingUpdates, setPendingUpdates] = React.useState<PendingUpdate[]>(
    [],
  );
  const [loading, setLoading] = React.useState(true);

  const isAdmin = user?.type?.toLowerCase() === "admin";

  // Patient table state
  const [patSorting, setPatSorting] = React.useState<SortingState>([]);
  const [patFilters, setPatFilters] = React.useState<ColumnFiltersState>([]);
  const [patVisibility, setPatVisibility] = React.useState<
    Record<string, boolean>
  >({});
  const [patRowSel, setPatRowSel] = React.useState({});
  const [patSearch, setPatSearch] = React.useState("");

  // Record table state
  const [recSorting, setRecSorting] = React.useState<SortingState>([]);
  const [recFilters, setRecFilters] = React.useState<ColumnFiltersState>([]);
  const [recVisibility, setRecVisibility] = React.useState<
    Record<string, boolean>
  >({});
  const [recRowSel, setRecRowSel] = React.useState({});
  const [recSearch, setRecSearch] = React.useState("");

  // Update table state
  const [updSorting, setUpdSorting] = React.useState<SortingState>([]);
  const [updFilters, setUpdFilters] = React.useState<ColumnFiltersState>([]);
  const [updVisibility, setUpdVisibility] = React.useState<
    Record<string, boolean>
  >({});
  const [updRowSel, setUpdRowSel] = React.useState({});
  const [updSearch, setUpdSearch] = React.useState("");

  // ─── Optimistic removers ───────────────────────────────────────────────────
  const removePatient = React.useCallback((id: string) => {
    setPendingPatients((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const removeRecord = React.useCallback((id: string) => {
    setPendingRecords((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const removeUpdate = React.useCallback((id: string) => {
    setPendingUpdates((prev) => prev.filter((u) => u.id !== id));
  }, []);

  // ─── Stable column definitions ─────────────────────────────────────────────
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const patientColumns = React.useMemo(
    () => makePatientColumns(removePatient),
    [],
  );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const recordColumns = React.useMemo(
    () => makeRecordColumns(removeRecord),
    [],
  );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const updateColumns = React.useMemo(
    () => makeUpdateColumns(removeUpdate),
    [],
  );

  // ─── Data fetch ────────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (!user) return;

    const usersRef = ref(db, "users");
    let unsubPatients: (() => void) | undefined;
    let unsubRecords: (() => void) | undefined;
    let unsubUpdates: (() => void) | undefined;

    const unsubUsers = onValue(usersRef, (usersSnap) => {
      unsubPatients?.();
      unsubRecords?.();
      unsubUpdates?.();

      const currentUser = (usersSnap.val() || {})[user.uid];
      if (!currentUser) {
        setLoading(false);
        return;
      }

      const isAdminUser = currentUser.type === "admin";
      // Shared doctor/secretary pair id for the current user. A doctor
      // should be able to approve/reject anything their linked secretary
      // submitted (and vice versa), not just their own submissions —
      // matching on linkId (rather than sharedWith, which is never
      // populated by the add-patient/add-record forms) makes that work.
      const linkId: string | null = currentUser.linkId ?? null;

      unsubPatients = onValue(ref(db, "pending/patients"), (snap) => {
        const raw = snap.val() || {};
        const list: PendingPatient[] = Object.entries(raw).map(
          ([id, val]: [string, any]) => ({ id, ...val }),
        );
        setPendingPatients(
          isAdminUser
            ? list
            : list.filter(
                (p) =>
                  p.createdBy === user.uid ||
                  (p.sharedWith || []).includes(user.uid) ||
                  (!!p.linkId && !!linkId && p.linkId === linkId),
              ),
        );
      });

      unsubRecords = onValue(ref(db, "pending/records"), (snap) => {
        const raw = snap.val() || {};
        const list: PendingRecord[] = Object.entries(raw).map(
          ([id, val]: [string, any]) => ({
            id,
            ...val,
            diagnosis: Array.isArray(val.diagnosis) ? val.diagnosis : [],
          }),
        );
        setPendingRecords(
          isAdminUser
            ? list
            : list.filter(
                (r) =>
                  r.createdBy === user.uid ||
                  (!!r.linkId && !!linkId && r.linkId === linkId),
              ),
        );
        setLoading(false);
      });

      if (isAdminUser) {
        unsubUpdates = onValue(ref(db, "pending/updates"), (snap) => {
          const raw = snap.val() || {};
          const list: PendingUpdate[] = Object.entries(raw).map(
            ([id, val]: [string, any]) => ({ id, ...val }),
          );
          setPendingUpdates(list);
        });
      }
    });

    return () => {
      unsubUsers();
      unsubPatients?.();
      unsubRecords?.();
      unsubUpdates?.();
    };
  }, [user]);

  // ─── Tables ────────────────────────────────────────────────────────────────
  const patientTable = useReactTable({
    data: pendingPatients,
    columns: patientColumns,
    onSortingChange: setPatSorting,
    onColumnFiltersChange: setPatFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setPatVisibility,
    onRowSelectionChange: setPatRowSel,
    state: {
      sorting: patSorting,
      columnFilters: patFilters,
      columnVisibility: patVisibility,
      rowSelection: patRowSel,
    },
    initialState: { pagination: { pageSize: isMobile ? 8 : 10 } },
  });

  const recordTable = useReactTable({
    data: pendingRecords,
    columns: recordColumns,
    onSortingChange: setRecSorting,
    onColumnFiltersChange: setRecFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setRecVisibility,
    onRowSelectionChange: setRecRowSel,
    state: {
      sorting: recSorting,
      columnFilters: recFilters,
      columnVisibility: recVisibility,
      rowSelection: recRowSel,
    },
    initialState: { pagination: { pageSize: isMobile ? 8 : 10 } },
  });

  const updateTable = useReactTable({
    data: pendingUpdates,
    columns: updateColumns,
    onSortingChange: setUpdSorting,
    onColumnFiltersChange: setUpdFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setUpdVisibility,
    onRowSelectionChange: setUpdRowSel,
    state: {
      sorting: updSorting,
      columnFilters: updFilters,
      columnVisibility: updVisibility,
      rowSelection: updRowSel,
    },
    initialState: { pagination: { pageSize: isMobile ? 8 : 10 } },
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center p-10 text-gray-500 text-sm gap-2">
        <Spinner className="w-5 h-5" />
        <span>Loading pending records…</span>
      </div>
    );
  }

  const patFilteredRows = patientTable.getFilteredRowModel().rows;
  const recFilteredRows = recordTable.getFilteredRowModel().rows;
  const updFilteredRows = updateTable.getFilteredRowModel().rows;

  // ─── Toolbar ───────────────────────────────────────────────────────────────
  const makeToolbar = (
    searchValue: string,
    onSearch: (v: string) => void,
    placeholder: string,
    table: ReturnType<typeof useReactTable<any>>,
  ) => (
    <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
      <div className="relative flex-1 sm:max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder={placeholder}
          value={searchValue}
          onChange={(e) => onSearch(e.target.value)}
          className="w-full pl-8 pr-3 py-2 text-sm !bg-white border border-gray-200 rounded-lg shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00a896]/40 focus:border-[#00a896] transition"
        />
      </div>
      {!isMobile && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="inline-flex items-center gap-1.5 px-3 py-2 h-auto text-sm font-medium !bg-[#00a896] !text-white rounded-lg shadow-sm hover:opacity-90 transition">
              <Columns3 className="w-3.5 h-3.5" />
              Columns
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel className="text-xs text-gray-400">
              Toggle columns
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {table
              .getAllColumns()
              .filter((c) => c.getCanHide())
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

  // ─── Pagination ────────────────────────────────────────────────────────────
  const makePagination = (
    table: ReturnType<typeof useReactTable<any>>,
    filteredCount: number,
    emptyLabel: string,
  ) => (
    <div className="flex items-center justify-between pt-1 text-xs text-gray-500">
      <span>
        {filteredCount === 0
          ? emptyLabel
          : `${table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}–${Math.min(
              (table.getState().pagination.pageIndex + 1) *
                table.getState().pagination.pageSize,
              filteredCount,
            )} of ${filteredCount}`}
      </span>
      <div className="flex gap-1.5 items-center">
        <Button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className="px-3 py-1.5 h-auto text-xs font-medium rounded border !bg-[#00a896] !text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          ← {isMobile ? "" : "Previous"}
        </Button>
        <span className="px-2">
          {table.getState().pagination.pageIndex + 1} /{" "}
          {table.getPageCount() || 1}
        </span>
        <Button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className="px-3 py-1.5 h-auto text-xs font-medium rounded border !bg-[#00a896] !text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {isMobile ? "" : "Next"} →
        </Button>
      </div>
    </div>
  );

  // ─── Empty states ──────────────────────────────────────────────────────────
  const EmptyPatients = (
    <div className="rounded-xl border border-gray-200 bg-white p-10 flex flex-col items-center justify-center text-center gap-2">
      <div className="w-10 h-10 rounded-lg bg-[#00a896]/10 flex items-center justify-center">
        <UserPlus className="w-5 h-5 text-[#00a896]" />
      </div>
      <p className="text-sm font-medium text-gray-700">No pending patients</p>
      <p className="text-xs text-gray-400 max-w-xs">
        Patients submitted for approval will appear here.
      </p>
    </div>
  );

  const EmptyRecordsEl = (
    <div className="rounded-xl border border-gray-200 bg-white p-10 flex flex-col items-center justify-center text-center gap-2">
      <div className="w-10 h-10 rounded-lg bg-[#00a896]/10 flex items-center justify-center">
        <ClipboardList className="w-5 h-5 text-[#00a896]" />
      </div>
      <p className="text-sm font-medium text-gray-700">No pending records</p>
      <p className="text-xs text-gray-400 max-w-xs">
        Consultation records submitted for approval will appear here.
      </p>
    </div>
  );

  const EmptyUpdatesEl = (
    <div className="rounded-xl border border-gray-200 bg-white p-10 flex flex-col items-center justify-center text-center gap-2">
      <div className="w-10 h-10 rounded-lg bg-[#00a896]/10 flex items-center justify-center">
        <FilePenLine className="w-5 h-5 text-[#00a896]" />
      </div>
      <p className="text-sm font-medium text-gray-700">No pending updates</p>
      <p className="text-xs text-gray-400 max-w-xs">
        Patient record updates submitted for approval will appear here.
      </p>
    </div>
  );

  // ─── Desktop table renderer ────────────────────────────────────────────────
  function DesktopTable<T>({
    table,
    columns,
    empty,
  }: {
    table: ReturnType<typeof useReactTable<T>>;
    columns: ColumnDef<T>[];
    empty: React.ReactNode;
  }) {
    return (
      <div className="rounded-lg border border-gray-200 overflow-hidden shadow-sm bg-white">
        <div className="overflow-x-auto">
          <Table className="min-w-[900px] text-sm">
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id} className="border-0">
                  {hg.headers.map((header) => (
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
                    {empty}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4 p-4 sm:p-5 bg-gray-50 min-h-screen">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 tracking-tight">
          Pending Approvals
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
          Review and approve or reject submitted patients and consultation
          records
        </p>
      </div>

      <Tabs defaultValue="patients" className="w-full">
        <TabsList className="!bg-gray-100">
          <TabsTrigger
            value="patients"
            className="flex items-center gap-1.5 !bg-white text-black"
          >
            <Users className="w-3.5 h-3.5" />
            Pending Patients
          </TabsTrigger>
          <TabsTrigger
            value="records"
            className="flex items-center gap-1.5 !bg-white text-black"
          >
            <ClipboardList className="w-3.5 h-3.5" />
            Pending Records
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger
              value="updates"
              className="flex items-center gap-1.5 !bg-white text-black"
            >
              <FilePenLine className="w-3.5 h-3.5" />
              Pending Updates
              {pendingUpdates.length > 0 && (
                <span className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                  {pendingUpdates.length}
                </span>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        {/* ── Pending Patients Tab ── */}
        <TabsContent value="patients" className="flex flex-col gap-4 mt-4">
          <StatCard
            label="Pending Patients: "
            value={pendingPatients.length}
            icon={<UserPlus className="w-4 h-4" />}
            color="text-amber-600"
            bg="bg-amber-50"
          />
          {makeToolbar(
            patSearch,
            (v) => {
              setPatSearch(v);
              patientTable
                .getColumn("firstName")
                ?.setFilterValue(v || undefined);
            },
            "Search by name…",
            patientTable,
          )}

          {isMobile ? (
            <>
              {patFilteredRows.length === 0 ? (
                EmptyPatients
              ) : (
                <div className="flex flex-col gap-3">
                  {patientTable.getRowModel().rows.map((row) => {
                    const p = row.original;
                    const address =
                      p.address ||
                      [p.address1, p.city, p.province]
                        .filter(Boolean)
                        .join(", ");
                    return (
                      <div
                        key={row.id}
                        className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-gray-800">
                              {p.firstName} {p.lastName}
                            </p>
                            <p className="text-xs text-gray-400">
                              {p.gender} · Age {p.age}
                            </p>
                          </div>
                          <PendingPatientActions
                            patient={p}
                            onRemove={removePatient}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                          {[
                            { label: "Address", value: address },
                            { label: "Contact", value: p.telephone },
                            { label: "Submitted by", value: p.addedBy },
                          ].map(({ label, value }) => (
                            <div key={label}>
                              <span className="text-gray-400">{label}</span>
                              <p className="text-gray-700 font-medium truncate">
                                {value || "—"}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {makePagination(
                patientTable,
                patFilteredRows.length,
                "No pending patients",
              )}
            </>
          ) : (
            <>
              <DesktopTable
                table={patientTable}
                columns={patientColumns}
                empty={EmptyPatients}
              />
              {makePagination(
                patientTable,
                patFilteredRows.length,
                "No pending patients",
              )}
            </>
          )}
        </TabsContent>

        {/* ── Pending Records Tab ── */}
        <TabsContent value="records" className="flex flex-col gap-4 mt-4">
          <StatCard
            label="Pending Records: "
            value={pendingRecords.length}
            icon={<ClipboardList className="w-4 h-4" />}
            color="text-blue-600"
            bg="bg-blue-50"
          />
          {makeToolbar(
            recSearch,
            (v) => {
              setRecSearch(v);
              recordTable
                .getColumn("diagnosis")
                ?.setFilterValue(v || undefined);
            },
            "Search by diagnosis…",
            recordTable,
          )}

          {isMobile ? (
            <>
              {recFilteredRows.length === 0 ? (
                EmptyRecordsEl
              ) : (
                <div className="flex flex-col gap-3">
                  {recordTable.getRowModel().rows.map((row) => {
                    const r = row.original;
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
                            {r.diagnosis?.length ? (
                              r.diagnosis.map((diag, i) => (
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
                          <PendingRecordActions
                            record={r}
                            onRemove={removeRecord}
                          />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-gray-400 font-semibold mb-1">
                            Risk Flags
                          </p>
                          <RiskIndicators record={r} />
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                          {[
                            { label: "Symptoms", value: r.symptoms },
                            { label: "BP", value: r.bloodPressure },
                            { label: "Heart Rate", value: r.heartRate },
                            { label: "Temperature", value: r.temperature },
                            { label: "O₂ Sat", value: r.oxygenSaturation },
                            { label: "Weight", value: r.weight },
                            { label: "Height", value: r.height },
                            { label: "Submitted by", value: r.addedBy },
                          ].map(({ label, value }) => (
                            <div key={label}>
                              <span className="text-gray-400">{label}</span>
                              <p className="text-gray-700 font-medium truncate">
                                {value || "—"}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {makePagination(
                recordTable,
                recFilteredRows.length,
                "No pending records",
              )}
            </>
          ) : (
            <>
              <DesktopTable
                table={recordTable}
                columns={recordColumns}
                empty={EmptyRecordsEl}
              />
              {makePagination(
                recordTable,
                recFilteredRows.length,
                "No pending records",
              )}
            </>
          )}
        </TabsContent>

        {/* ── Pending Updates Tab (admin only) ── */}
        {isAdmin && (
          <TabsContent value="updates" className="flex flex-col gap-4 mt-4">
            <StatCard
              label="Pending Updates: "
              value={pendingUpdates.length}
              icon={<FilePenLine className="w-4 h-4" />}
              color="text-purple-600"
              bg="bg-purple-50"
            />
            {makeToolbar(
              updSearch,
              (v) => {
                setUpdSearch(v);
                updateTable
                  .getColumn("firstName")
                  ?.setFilterValue(v || undefined);
              },
              "Search by name…",
              updateTable,
            )}

            {isMobile ? (
              <>
                {updFilteredRows.length === 0 ? (
                  EmptyUpdatesEl
                ) : (
                  <div className="flex flex-col gap-3">
                    {updateTable.getRowModel().rows.map((row) => {
                      const u = row.original;
                      const address =
                        u.address ||
                        [u.address1, u.city, u.province]
                          .filter(Boolean)
                          .join(", ");
                      return (
                        <div
                          key={row.id}
                          className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 space-y-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-gray-800">
                                {u.firstName} {u.lastName}
                              </p>
                              <p className="text-xs text-gray-400">
                                {u.gender} · Age {u.age}
                              </p>
                            </div>
                            <PendingUpdateActions
                              update={u}
                              onRemove={removeUpdate}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                            {[
                              { label: "Address", value: address },
                              { label: "Contact", value: u.telephone },
                              { label: "BP", value: u.bloodPressure },
                              { label: "Temperature", value: u.temperature },
                              { label: "Submitted by", value: u.submittedBy },
                            ].map(({ label, value }) => (
                              <div key={label}>
                                <span className="text-gray-400">{label}</span>
                                <p className="text-gray-700 font-medium truncate">
                                  {value || "—"}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {makePagination(
                  updateTable,
                  updFilteredRows.length,
                  "No pending updates",
                )}
              </>
            ) : (
              <>
                <DesktopTable
                  table={updateTable}
                  columns={updateColumns}
                  empty={EmptyUpdatesEl}
                />
                {makePagination(
                  updateTable,
                  updFilteredRows.length,
                  "No pending updates",
                )}
              </>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
