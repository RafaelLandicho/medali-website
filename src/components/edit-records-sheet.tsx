"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "./ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "./ui/calendar";
import {
  CalendarIcon,
  Heart,
  Wind,
  Thermometer,
  Droplets,
  Ruler,
  Weight,
  Activity,
  User,
  MapPin,
  Phone,
  ClipboardList,
  Users,
  Stethoscope,
} from "lucide-react";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Patient } from "./medical_records";
import { ref, update, get, set, push } from "firebase/database";
import { db } from "@/firebaseConfig";
import { useAuth } from "@/auth/authprovider";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";

type EditRecordsSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient;
};

function formatDate(date: Date | undefined) {
  if (!date) return "";
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function isValidDate(date: Date | undefined) {
  if (!date) return false;
  return !isNaN(date.getTime());
}

// ── Shared section header ──────────────────────────────────────────────────────
function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-center gap-3 border-l-4 border-[#00c4b4] pl-4">
      <div className="w-8 h-8 rounded-lg bg-[#00c4b4]/10 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <h2 className="text-lg md:text-xl font-semibold text-gray-800">
          {title}
        </h2>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </div>
    </div>
  );
}

// ── Read-only field component ──────────────────────────────────────────────────
function ReadOnlyField({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <Field>
      <div className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 text-sm">
        {value || "—"}
      </div>
      <FieldDescription>{label}</FieldDescription>
    </Field>
  );
}

export function EditRecordsSheet({
  open,
  onOpenChange,
  patient,
}: EditRecordsSheetProps) {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [fields, setFields] = useState<
    Patient & {
      patientDiagnosis?: any[];
      familyHistory?: any[];
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
    }
  >(patient);
  const [openD, setOpenDate] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(undefined);
  const [month, setMonth] = React.useState<Date | undefined>(date);
  const [value, setValue] = React.useState(formatDate(date));

  useEffect(() => {
    if (patient) {
      setFields(patient);
    }
  }, [patient]);

  const handleChange = (key: string, value: string | boolean) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddDiagnosis = () => {
    setFields((prev) => ({
      ...prev,
      patientDiagnosis: [
        ...(prev.patientDiagnosis || []),
        { diagnosis: "", severity: "", notes: "" },
      ],
    }));
  };

  const handleAddHistory = () => {
    setFields((prev) => ({
      ...prev,
      familyHistory: [
        ...(prev.familyHistory || []),
        {
          relation: "",
          age: "",
          healthProblems: "",
          goodHealth: true,
          isAlive: true,
        },
      ],
    }));
  };

  const handleRemoveDiagnosis = (index: number) => {
    setFields((prev) => ({
      ...prev,
      patientDiagnosis: (prev.patientDiagnosis || []).filter(
        (_, i) => i !== index,
      ),
    }));
  };

  const handleRemoveHistory = (index: number) => {
    setFields((prev) => ({
      ...prev,
      familyHistory: (prev.familyHistory || []).filter((_, i) => i !== index),
    }));
  };

  const handleDiagnosisChange = (
    index: number,
    key: "diagnosis" | "severity" | "notes",
    value: string,
  ) => {
    setFields((prev) => {
      const updated = [...(prev.patientDiagnosis || [])];
      updated[index][key] = value;
      return { ...prev, patientDiagnosis: updated };
    });
  };

  const handleHistoryChange = (
    index: number,
    key: "relation" | "age" | "healthProblems" | "goodHealth" | "isAlive",
    value: string | boolean,
  ) => {
    setFields((prev) => {
      const updated = [...(prev.familyHistory || [])];
      if (key === "goodHealth" || key === "isAlive") {
        updated[index][key] = value as boolean;
      } else {
        updated[index][key] = value as string;
      }
      return { ...prev, familyHistory: updated };
    });
  };

  const updateRecords = async () => {
    if (!fields.id) {
      toast.error("Invalid patient record.");
      return;
    }

    try {
      const patientRef = ref(db, `patients/${fields.id}`);
      await update(patientRef, {
        address1: fields.address1 || "",
        address2: fields.address2 || "",
        city: fields.city || "",
        province: fields.province || "",
        telephone: fields.telephone || "",
        address:
          (fields.address1 || "") +
          (fields.address2 || "") +
          (fields.city || "") +
          (fields.province || ""),
      });

      if (fields.recordId) {
        const recordRef = ref(
          db,
          `patients/${fields.id}/records/${fields.recordId}`,
        );
        await update(recordRef, {
          diagnosis: fields.patientDiagnosis || [],
          symptoms: fields.symptoms || "",
          bloodPressure: fields.bloodPressure || "",
          heartRate: fields.heartRate || "",
          respiratoryRate: fields.respiratoryRate || "",
          temperature: fields.temperature || "",
          oxygenSaturation: fields.oxygenSaturation || "",
          weight: fields.weight || "",
          height: fields.height || "",
          // medicalCare: fields.medicalCare ?? false,
          // drugAllergy: fields.drugAllergy ?? false,
          // foodAllergy: fields.foodAllergy ?? false,
          // isTBPositive: fields.isTBPositive ?? false,
          // hasClinician: fields.hasClinician ?? false,
          // diet: fields.diet ?? false,
          // familyHistory: fields.familyHistory || [],
        });
      }

      const logsRef = ref(db, "logs/");
      const newLog = push(logsRef);
      await set(newLog, {
        medicalRecordLog: `Patient record ${fields.firstName} ${fields.lastName} updated by ${user?.firstName} ${user?.lastName} `,
        logTime: new Date().toLocaleString(),
      });

      toast.success("Record updated successfully!");
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating record:", error);
      toast.error("Failed to update record. Please try again.");
    }
  };

  // ── Diagnosis section ──────────────────────────────────────────────────────
  const DiagnosisSection = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SectionHeader
          icon={<ClipboardList className="w-4 h-4 text-[#00a896]" />}
          title="Diagnosis"
        />
        <Button
          type="button"
          size="sm"
          className="!bg-[#00a896] text-white hover:bg-[#028090]"
          onClick={handleAddDiagnosis}
        >
          + Add
        </Button>
      </div>

      <div className="space-y-3">
        {(fields.patientDiagnosis || []).map((d, index) => (
          <div
            key={index}
            className={`p-4 border border-gray-200 rounded-xl bg-gray-50 ${
              isMobile ? "space-y-3" : "grid grid-cols-4 gap-3"
            }`}
          >
            <div className={isMobile ? "space-y-1" : ""}>
              {isMobile && (
                <label className="text-sm font-medium text-gray-700 block">
                  Diagnosis
                </label>
              )}
              <Input
                value={d.diagnosis}
                onChange={(e) =>
                  handleDiagnosisChange(index, "diagnosis", e.target.value)
                }
                placeholder="Diagnosis"
                className="w-full"
              />
            </div>
            <div className={isMobile ? "space-y-1" : ""}>
              {isMobile && (
                <label className="text-sm font-medium text-gray-700 block">
                  Severity
                </label>
              )}
              <Input
                value={d.severity}
                onChange={(e) =>
                  handleDiagnosisChange(index, "severity", e.target.value)
                }
                placeholder="Severity"
                className="w-full"
              />
            </div>
            <div className={isMobile ? "space-y-1" : ""}>
              {isMobile && (
                <label className="text-sm font-medium text-gray-700 block">
                  Notes
                </label>
              )}
              <Input
                value={d.notes}
                onChange={(e) =>
                  handleDiagnosisChange(index, "notes", e.target.value)
                }
                placeholder="Notes"
                className="w-full"
              />
            </div>
            {(fields.patientDiagnosis || []).length > 1 && (
              <div className="flex items-center">
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  className="!bg-red-400 text-white w-full md:w-auto"
                  onClick={() => handleRemoveDiagnosis(index)}
                >
                  Remove
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // ── Family History section ─────────────────────────────────────────────────
  const FamilyHistorySection = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SectionHeader
          icon={<Users className="w-4 h-4 text-[#00a896]" />}
          title="Family History"
          description="Provide age and indicate relevant conditions"
        />
        {isMobile && (
          <Button
            type="button"
            size="sm"
            className="!bg-[#00a896] text-white hover:bg-[#028090]"
            onClick={handleAddHistory}
          >
            + Add
          </Button>
        )}
      </div>

      {isMobile ? (
        <div className="space-y-4">
          {(fields.familyHistory || []).map((h, index) => (
            <Card key={index} className="p-4 space-y-4 border border-gray-200">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Relation
                </label>
                <Input
                  value={h.relation}
                  onChange={(e) =>
                    handleHistoryChange(index, "relation", e.target.value)
                  }
                  placeholder="e.g., Mother, Father"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Age</label>
                <Input
                  value={h.age}
                  onChange={(e) =>
                    handleHistoryChange(index, "age", e.target.value)
                  }
                  placeholder="Age"
                  type="number"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Health Problems
                </label>
                <Input
                  value={h.healthProblems}
                  onChange={(e) =>
                    handleHistoryChange(index, "healthProblems", e.target.value)
                  }
                  placeholder="Any health conditions"
                />
              </div>
              <div className="flex flex-col gap-3 pt-2">
                <div className="flex items-center justify-between hover:bg-gray-50 rounded-lg p-2 transition-colors">
                  <label className="text-sm font-medium text-gray-700">
                    In Good Health
                  </label>
                  <Checkbox
                    className="size-5 border-gray-300 data-[state=unchecked]:!bg-gray-200 data-[state=checked]:!bg-[#00a896]"
                    checked={h.goodHealth}
                    onCheckedChange={(c) =>
                      handleHistoryChange(index, "goodHealth", c === true)
                    }
                  />
                </div>
                <div className="flex items-center justify-between hover:bg-gray-50 rounded-lg p-2 transition-colors">
                  <label className="text-sm font-medium text-gray-700">
                    Alive
                  </label>
                  <Checkbox
                    className="size-5 border-gray-300 data-[state=unchecked]:!bg-gray-200 data-[state=checked]:!bg-[#00a896]"
                    checked={h.isAlive}
                    onCheckedChange={(c) =>
                      handleHistoryChange(index, "isAlive", c === true)
                    }
                  />
                </div>
              </div>
              {(fields.familyHistory || []).length > 1 && (
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  className="!bg-red-400 text-white w-full mt-2"
                  onClick={() => handleRemoveHistory(index)}
                >
                  Remove
                </Button>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-[140px_80px_1fr_120px_80px_100px] px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 rounded-lg">
            <span>Relation</span>
            <span>Age</span>
            <span>Health Problems</span>
            <span className="text-center">Good Health</span>
            <span className="text-center">Alive</span>
            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                className="!bg-[#00a896] text-white hover:bg-[#028090] h-7 text-xs"
                onClick={handleAddHistory}
              >
                + Add
              </Button>
            </div>
          </div>

          <div className="divide-y border border-gray-200 rounded-xl overflow-hidden">
            {(fields.familyHistory || []).map((h, index) => (
              <div
                key={index}
                className="grid grid-cols-[140px_80px_1fr_120px_80px_100px] items-center gap-3 p-3 hover:bg-gray-50 transition-colors"
              >
                <Input
                  placeholder="e.g. Father"
                  value={h.relation}
                  onChange={(e) =>
                    handleHistoryChange(index, "relation", e.target.value)
                  }
                />
                <Input
                  placeholder="Age"
                  value={h.age}
                  onChange={(e) =>
                    handleHistoryChange(index, "age", e.target.value)
                  }
                />
                <Input
                  placeholder="Health Problems"
                  value={h.healthProblems}
                  onChange={(e) =>
                    handleHistoryChange(index, "healthProblems", e.target.value)
                  }
                />
                <div className="flex justify-center">
                  <Checkbox
                    checked={h.goodHealth}
                    className="size-5 border-gray-300 data-[state=unchecked]:!bg-gray-200 data-[state=checked]:!bg-[#00a896]"
                    onCheckedChange={(c) =>
                      handleHistoryChange(index, "goodHealth", c === true)
                    }
                  />
                </div>
                <div className="flex justify-center">
                  <Checkbox
                    checked={h.isAlive}
                    className="size-5 border-gray-300 data-[state=unchecked]:!bg-gray-200 data-[state=checked]:!bg-[#00a896]"
                    onCheckedChange={(c) =>
                      handleHistoryChange(index, "isAlive", c === true)
                    }
                  />
                </div>
                <div className="flex justify-end">
                  {(fields.familyHistory || []).length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="!bg-red-400 text-white h-8 text-xs"
                      onClick={() => handleRemoveHistory(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={
          isMobile
            ? `
            overflow-y-auto
            h-[90vh]
            w-full
            p-0
            bg-white
            rounded-t-2xl
            [&>button]:text-white
            [&>button]:size-6
            [&>button]:!bg-red-500
            [&>button]:top-4
            [&>button]:right-4
          `
            : `
            overflow-y-auto
            !w-[75vw]
            !max-w-none
            p-0
            bg-white
            [&>button]:text-white
            [&>button]:size-7
            [&>button]:!bg-red-500
            [&>button_svg]:w-6
            [&>button_svg]:h-6
          `
        }
      >
        {/* ── SHEET HEADER ── */}
        <SheetHeader className="sticky top-0 z-10 border-b bg-white">
          <div className="text-center pt-6 pb-4 px-4">
            <h1 className="text-xl md:text-2xl font-bold text-[#00a896] tracking-tight uppercase">
              Edit Medical Report
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Update patient vitals, medical history, and other editable fields
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Basic patient information (Name, Gender, Age, DOB) is read-only
            </p>
            <div className="mt-3 h-1 w-16 bg-[#00c4b4] rounded-full mx-auto" />
          </div>
        </SheetHeader>

        <Card className="flex-1 border-none rounded-none">
          <div className="px-4 md:px-8 lg:px-12 py-4">
            <Card className="p-4 md:p-8 rounded-2xl border border-gray-100 shadow-sm">
              <div className="max-w-5xl mx-auto space-y-10">
                {/* ── PATIENT INFORMATION ── READ ONLY ── */}
                <div className="space-y-4">
                  <SectionHeader
                    icon={<User className="w-4 h-4 text-[#00a896]" />}
                    title="Patient Information"
                    description="Basic demographic details (read-only)"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ReadOnlyField
                      label="First Name"
                      value={fields.firstName}
                    />
                    <ReadOnlyField label="Last Name" value={fields.lastName} />
                  </div>

                  <ReadOnlyField
                    label="Date of Birth"
                    value={fields.birthdate}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <ReadOnlyField label="Age" value={fields.age} />
                    <ReadOnlyField label="Gender" value={fields.gender} />
                  </div>
                </div>

                {/* ── ADDRESS ── EDITABLE ── */}
                <div className="space-y-4">
                  <SectionHeader
                    icon={<MapPin className="w-4 h-4 text-[#00a896]" />}
                    title="Address"
                  />
                  <Field>
                    <Input
                      value={fields.address1 || ""}
                      onChange={(e) => handleChange("address1", e.target.value)}
                      placeholder="Street address, building, unit..."
                    />
                    <FieldDescription>Address Line 1</FieldDescription>
                  </Field>
                  <Field>
                    <Input
                      value={fields.address2 || ""}
                      onChange={(e) => handleChange("address2", e.target.value)}
                      placeholder="Apartment, suite, etc. (optional)"
                    />
                    <FieldDescription>Address Line 2</FieldDescription>
                  </Field>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field>
                      <Input
                        value={fields.city || ""}
                        onChange={(e) => handleChange("city", e.target.value)}
                        placeholder="City"
                      />
                      <FieldDescription>City</FieldDescription>
                    </Field>
                    <Field>
                      <Input
                        value={fields.province || ""}
                        onChange={(e) =>
                          handleChange("province", e.target.value)
                        }
                        placeholder="State or Province"
                      />
                      <FieldDescription>State / Province</FieldDescription>
                    </Field>
                  </div>
                </div>

                {/* ── CONTACT NUMBER ── EDITABLE ── */}
                <div className="space-y-4">
                  <SectionHeader
                    icon={<Phone className="w-4 h-4 text-[#00a896]" />}
                    title="Contact Number"
                  />
                  <Field>
                    <Input
                      value={fields.telephone || ""}
                      onChange={(e) =>
                        handleChange("telephone", e.target.value)
                      }
                      placeholder="+63 912 345 6789"
                      type="tel"
                    />
                  </Field>
                </div>

                {/* ── VITAL STATISTICS ── EDITABLE ── */}
                <div className="space-y-4">
                  <SectionHeader
                    icon={<Activity className="w-4 h-4 text-[#00a896]" />}
                    title="Vital Statistics"
                    description="Leave blank if not measured"
                  />

                  <div
                    className={`${isMobile ? "grid grid-cols-1 gap-4" : "grid grid-cols-4 gap-4"}`}
                  >
                    <Field>
                      <div className="relative">
                        <Activity className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00a896]" />
                        <Input
                          value={fields.bloodPressure || ""}
                          onChange={(e) =>
                            handleChange("bloodPressure", e.target.value)
                          }
                          placeholder="120/80"
                          className="pl-9"
                        />
                      </div>
                      <FieldDescription>Blood Pressure (mmHg)</FieldDescription>
                    </Field>

                    <Field>
                      <div className="relative">
                        <Heart className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00a896]" />
                        <Input
                          value={fields.heartRate || ""}
                          onChange={(e) =>
                            handleChange("heartRate", e.target.value)
                          }
                          placeholder="72"
                          className="pl-9"
                        />
                      </div>
                      <FieldDescription>Heart Rate (BPM)</FieldDescription>
                    </Field>

                    <Field>
                      <div className="relative">
                        <Wind className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00a896]" />
                        <Input
                          value={fields.respiratoryRate || ""}
                          onChange={(e) =>
                            handleChange("respiratoryRate", e.target.value)
                          }
                          placeholder="16"
                          className="pl-9"
                        />
                      </div>
                      <FieldDescription>Respiratory Rate</FieldDescription>
                    </Field>

                    <Field>
                      <div className="relative">
                        <Droplets className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00a896]" />
                        <Input
                          value={fields.oxygenSaturation || ""}
                          onChange={(e) =>
                            handleChange("oxygenSaturation", e.target.value)
                          }
                          placeholder="98"
                          className="pl-9"
                        />
                      </div>
                      <FieldDescription>Oxygen Saturation (%)</FieldDescription>
                    </Field>
                  </div>

                  <div
                    className={`${isMobile ? "grid grid-cols-1 gap-4" : "grid grid-cols-3 gap-4"}`}
                  >
                    <Field>
                      <div className="relative">
                        <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00a896]" />
                        <Input
                          value={fields.height || ""}
                          onChange={(e) =>
                            handleChange("height", e.target.value)
                          }
                          placeholder="170"
                          className="pl-9"
                        />
                      </div>
                      <FieldDescription>Height (cm)</FieldDescription>
                    </Field>

                    <Field>
                      <div className="relative">
                        <Weight className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00a896]" />
                        <Input
                          value={fields.weight || ""}
                          onChange={(e) =>
                            handleChange("weight", e.target.value)
                          }
                          placeholder="62"
                          className="pl-9"
                        />
                      </div>
                      <FieldDescription>Weight (kg)</FieldDescription>
                    </Field>

                    <Field>
                      <div className="relative">
                        <Thermometer className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00a896]" />
                        <Input
                          value={fields.temperature || ""}
                          onChange={(e) =>
                            handleChange("temperature", e.target.value)
                          }
                          placeholder="36.5"
                          className="pl-9"
                        />
                      </div>
                      <FieldDescription>Temperature (°C)</FieldDescription>
                    </Field>
                  </div>
                </div>

                {/* HEALTH HISTORY */}
                {/* <div className="space-y-4">
                  <SectionHeader
                    icon={<ClipboardList className="w-4 h-4 text-[#00a896]" />}
                    title="Health History"
                    description="Please check if any of the following apply"
                  />

                  <div className="divide-y rounded-xl border border-gray-200 overflow-hidden">
                    {[
                      {
                        label: "Are you presently under medical care?",
                        checked: fields.medicalCare,
                        key: "medicalCare",
                      },
                      {
                        label: "Do you have any drug allergies?",
                        checked: fields.drugAllergy,
                        key: "drugAllergy",
                      },
                      {
                        label:
                          "Do you have any food or environmental allergies?",
                        checked: fields.foodAllergy,
                        key: "foodAllergy",
                      },
                      {
                        label:
                          "Have you ever had tuberculosis or a positive TB test?",
                        checked: fields.isTBPositive,
                        key: "isTBPositive",
                      },
                      {
                        label:
                          "Have you ever been cared for by a mental health clinician?",
                        checked: fields.hasClinician,
                        key: "hasClinician",
                      },
                      {
                        label: "Have you ever restricted your eating?",
                        checked: fields.diet,
                        key: "diet",
                      },
                    ].map((item) => (
                      <div
                        key={item.key}
                        className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <FieldLabel>{item.label}</FieldLabel>
                        <Checkbox
                          className="size-5 border-gray-300 data-[state=unchecked]:!bg-gray-200 data-[state=checked]:!bg-[#00a896]"
                          checked={item.checked as boolean}
                          onCheckedChange={(checked) =>
                            handleChange(item.key, checked === true)
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div> */}

                {/* ── SYMPTOMS ── EDITABLE ── */}
                <div className="space-y-4">
                  <SectionHeader
                    icon={<Stethoscope className="w-4 h-4 text-[#00a896]" />}
                    title="Symptoms"
                  />
                  <Field>
                    <Input
                      value={fields.symptoms || ""}
                      onChange={(e) => handleChange("symptoms", e.target.value)}
                      placeholder="e.g. fever, cough, headache"
                    />
                    <FieldDescription>
                      Describe current symptoms
                    </FieldDescription>
                  </Field>
                </div>

                {/* ── DIAGNOSIS ── EDITABLE ── */}
                <DiagnosisSection />

                {/* ── FAMILY HISTORY ── EDITABLE ──
                <FamilyHistorySection /> */}

                {/* ── SAVE BUTTON ── */}
                <div className="flex justify-center pt-6 sticky bottom-0 bg-white pb-4">
                  <Button
                    onClick={updateRecords}
                    className="!bg-[#00a896] hover:!bg-[#028090] !text-white !px-12 !py-6 !text-lg font-semibold rounded-xl transition-all shadow-md w-full md:w-auto"
                    size={isMobile ? "lg" : "default"}
                  >
                    Update Record
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </Card>
      </SheetContent>
    </Sheet>
  );
}
