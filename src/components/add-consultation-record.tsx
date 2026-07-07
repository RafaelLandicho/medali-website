"use client";

import * as React from "react";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "./ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "./ui/calendar";
import { Switch } from "@/components/animate-ui/components/radix/switch";
import AutocompleteDrugs from "./ui/autocomplete_drugs";
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
  Stethoscope,
  ShieldCheck,
  Pill,
  Users,
  ChevronDown,
  Link2,
  AlertTriangle,
} from "lucide-react";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";
import { db } from "@/firebaseConfig";
import { ref, set, push, onValue, get } from "firebase/database";
import { useAuth } from "@/auth/authprovider";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import Autocomplete from "./ui/autocomplete";
import { Textarea } from "./ui/textarea";

export type MedicalRecords = {
  recordId: string;
  patientDiagnosis: { diagnosis: string; severity: string; notes: string }[];
  addedBy: string;
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
  linkId?: string | null;
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
  linkId?: string | null;
  familyHistory?: {
    relation: string;
    age: string;
    healthProblems: string;
    goodHealth: boolean;
    isAlive: boolean;
  }[];
  records?: { [key: string]: MedicalRecords };
};

type AddConsultationRecordsProps = {
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

function SectionTrigger({
  icon,
  title,
  subtitle,
  open,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  open: boolean;
}) {
  return (
    <CollapsibleTrigger asChild>
      <button
        type="button"
        className="w-full flex items-center justify-between group rounded-xl px-4 py-3 !text-[#00a896] hover:bg-[#028090] transition-colors !bg-white [&_svg]:text-white"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg !bg-[#00a896]/20 flex items-center justify-center flex-shrink-0">
            {icon}
          </div>
          <div className="text-left">
            <p className="text-lg md:text-xl font-semibold text-[#00a896]">
              {title}
            </p>
            {subtitle && (
              <p className="text-sm !text-[#00a896] mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 !text-[#00a896] transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
    </CollapsibleTrigger>
  );
}

export function AddConsultationRecords({
  patient: patientProp,
}: AddConsultationRecordsProps) {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const location = useLocation();
  const patientFromState = location.state as Patient | null;
  const patient = patientFromState ?? patientProp;
  const navigate = useNavigate();

  if (!patient) {
    return (
      <div className="p-6">
        <Card className="max-w-lg mx-auto p-6">
          <h2 className="text-lg font-semibold text-gray-800">
            Patient data is missing
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Please return to the patient list and select a patient record.
          </p>
          <Button onClick={() => navigate("/patients")}>
            Back to patients
          </Button>
        </Card>
      </div>
    );
  }

  const [openPatientInfo, setOpenPatientInfo] = useState(false);
  const [openAddress, setOpenAddress] = useState(false);
  const [openHealthHistory, setOpenHealthHistory] = useState(false);
  const [openFamilyHistory, setOpenFamilyHistory] = useState(false);

  const [calendarOpen, setCalendarOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(undefined);
  const [month, setMonth] = React.useState<Date | undefined>(date);
  const [value, setValue] = React.useState(formatDate(date));

  const initialState = {
    patientSymptoms: "",
    patientBloodPressure: "",
    patientHeartRate: "",
    patientRespiratoryRate: "",
    patientTemperature: "",
    patientOxygenSaturation: "",
    patientHeight: "",
    patientWeight: "",
    patientisMedicalCare: patient.medicalCare ?? false,
    patientDrugAllergy: patient.drugAllergy ?? false,
    patientFoodAllergy: patient.foodAllergy ?? false,
    patientTBPositive: patient.isTBPositive ?? false,
    patientHasClinician: patient.hasClinician ?? false,
    patientDiet: patient.diet ?? false,
  };

  const [fields, setFields] = useState(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [patientDiagnosis, setDiagnosis] = useState([
    { diagnosis: "", severity: "", notes: "" },
  ]);

  const [currentUserLinkId, setCurrentUserLinkId] = React.useState<
    string | null
  >(null);
  const [linkedUser, setLinkedUser] = React.useState<any | null>(null);
  const [includePrescription, setIncludePrescription] = useState(false);

  const [familyHistory, setFamilyHistory] = useState(
    patient.familyHistory && patient.familyHistory.length > 0
      ? patient.familyHistory
      : [
          {
            relation: "",
            age: "",
            healthProblems: "",
            goodHealth: true,
            isAlive: true,
          },
        ],
  );

  const [drugs, setDrugs] = useState([
    { medicine: "", unit: "", dosage: "", purpose: "", frequency: "" },
  ]);
  const [prescriptionFields, setPrescriptionFields] = useState({
    examination: "",
    recommendation: "",
  });

  const userIsAdmin = user?.type?.toLowerCase() === "admin";
  const userIsSecretary = user?.type?.toLowerCase() === "secretary";
  const userIsDoctor = user?.type?.toLowerCase() === "doctor";

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
        return;
      }

      const allUsersSnap = await get(ref(db, "users"));
      const allUsers = allUsersSnap.val() || {};
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

  const handleChange = (key: string, value: string | boolean) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddDiagnosis = () =>
    setDiagnosis([
      ...patientDiagnosis,
      { diagnosis: "", severity: "", notes: "" },
    ]);

  const handleRemoveDiagnosis = (index: number) =>
    setDiagnosis(patientDiagnosis.filter((_, i) => i !== index));

  const handleDiagnosisChange = (
    index: number,
    key: "diagnosis" | "severity" | "notes",
    value: string,
  ) => {
    const updated = [...patientDiagnosis];
    updated[index][key] = value;
    setDiagnosis(updated);
  };

  const handleAddHistory = () =>
    setFamilyHistory([
      ...familyHistory,
      {
        relation: "",
        age: "",
        healthProblems: "",
        goodHealth: true,
        isAlive: true,
      },
    ]);

  const handleRemoveHistory = (index: number) =>
    setFamilyHistory(familyHistory.filter((_, i) => i !== index));

  const handleHistoryChange = (
    index: number,
    key: "relation" | "age" | "healthProblems" | "goodHealth" | "isAlive",
    value: string | boolean,
  ) => {
    const updated = [...familyHistory];
    if (key === "goodHealth" || key === "isAlive") {
      updated[index][key] = value as boolean;
    } else {
      updated[index][key] = value as string;
    }
    setFamilyHistory(updated);
  };

  const handleAddDrug = () =>
    setDrugs([
      ...drugs,
      { medicine: "", unit: "", dosage: "", purpose: "", frequency: "" },
    ]);

  const handleRemoveDrug = (index: number) =>
    setDrugs(drugs.filter((_, i) => i !== index));

  const handleDrugChange = (
    index: number,
    key: "medicine" | "unit" | "dosage" | "purpose" | "frequency",
    value: string,
  ) => {
    const updated = [...drugs];
    updated[index][key] = value;
    setDrugs(updated);
  };

  const addConsultationRecord = async () => {
    if (!patient?.id) {
      toast.error("Patient data is missing");
      return;
    }

    if (userIsSecretary && !currentUserLinkId) {
      toast.error("You must be linked to a doctor before adding records.");
      return;
    }
    setIsLoading(true);
    try {
      const logsRef = ref(db, "logs/");
      const recordsRef = ref(db, `patients/${patient.id}/records`);
      const newRecord = push(recordsRef);
      const recordId = newRecord.key!;
      const newLog = push(logsRef);

      const allPatientsRef = ref(db, "patients");
      const allPatientsSnap = await get(allPatientsRef);
      let totalRecords = 0;
      if (allPatientsSnap.exists()) {
        allPatientsSnap.forEach((patientSnap) => {
          const records = patientSnap.child("records").val();
          if (records) totalRecords += Object.keys(records).length;
        });
      }
      const recordNumber = totalRecords + 1;

      const recordData = {
        recordId,
        recordNumber,
        patientId: patient.id,
        diagnosis: patientDiagnosis,
        symptoms: fields.patientSymptoms,
        bloodPressure: fields.patientBloodPressure,
        heartRate: fields.patientHeartRate,
        respiratoryRate: fields.patientRespiratoryRate,
        temperature: fields.patientTemperature,
        oxygenSaturation: fields.patientOxygenSaturation,
        weight: fields.patientWeight,
        height: fields.patientHeight,
        medicalCare: fields.patientisMedicalCare,
        drugAllergy: fields.patientDrugAllergy,
        foodAllergy: fields.patientFoodAllergy,
        isTBPositive: fields.patientTBPositive,
        hasClinician: fields.patientHasClinician,
        diet: fields.patientDiet,
        familyHistory,

        linkId: currentUserLinkId,
        addedBy: user?.email,
        createdBy: user?.uid,
        createdAt: Date.now(),
      };

      if (userIsSecretary) {
        const pendingRef = ref(db, "pending/records");
        const newPending = push(pendingRef);
        await set(newPending, {
          ...recordData,
          patientId: patient.id,
          linkId: currentUserLinkId,
          status: "pending",
          // approvedBy intentionally omitted here — this record hasn't been
          // approved yet. pending-records.tsx stamps approvedBy/approvedAt
          // when a doctor/admin actually approves it.
        });
        await set(newLog, {
          medicalRecordLog: `Consultation record added for approval by ${user?.firstName} ${user?.lastName} for patient ${patient.firstName} ${patient.lastName}`,
          logTime: new Date().toLocaleString(),
        });
        toast.success("Consultation record submitted for approval!");
      } else {
        // Doctor/admin adding directly — this record is effectively
        // self-approved, so stamp approvedBy immediately.
        await set(newRecord, {
          ...recordData,
          approvedBy: `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim(),
          approvedAt: new Date().toISOString(),
        });

        if (includePrescription) {
          const prescriptionRef = ref(
            db,
            `patients/${patient.id}/records/${recordId}/prescription`,
          );
          await set(prescriptionRef, {
            patientFirstName: patient.firstName,
            patientLastName: patient.lastName,
            patientAddress: patient.address1 ?? patient.address ?? "",
            patientAge: patient.age,
            patientGender: patient.gender,
            diagnosis: patientDiagnosis,
            examination: prescriptionFields.examination,
            recommendation: prescriptionFields.recommendation,
            drugs,
            linkId: currentUserLinkId,
            addedBy: `${user?.firstName} ${user?.lastName}`,
            field: user?.field,
            doctorId: user?.medicalId,
            createdBy: user?.uid,
            approvedBy:
              `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim(),
            updatedAt: new Date().toLocaleString(),
          });
          const prescriptionLog = push(logsRef);
          await set(prescriptionLog, {
            prescriptionLog: `Prescription added by ${user?.firstName} ${user?.lastName} for record ${recordId}`,
            logTime: new Date().toLocaleString(),
          });
        }

        await set(newLog, {
          medicalRecordLog: `Consultation record added by ${user?.firstName} ${user?.lastName} for patient ${patient.firstName} ${patient.lastName}`,
          logTime: new Date().toLocaleString(),
        });
        toast.success(
          includePrescription
            ? "Consultation record and prescription saved!"
            : "Consultation record added successfully!",
        );
      }

      setFields(initialState);
      navigate("/records");
    } catch (error) {
      console.error("Error adding record:", error);
      toast.error("Failed to add record. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        addConsultationRecord();
      }}
      className="space-y-6 md:space-y-8"
    >
      <Card className="flex-1 p-6 md:p-8">
        <div className="text-center mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 tracking-tight">
            Medical Consultation Record Form
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Fill in all required fields marked with{" "}
            <span className="text-red-400">*</span>
          </p>
          <div className="mt-4 h-1 w-16 bg-[#00c4b4] rounded-full mx-auto" />
        </div>

        <div className="px-0 md:px-4 lg:px-8">
          <Card className="p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm">
            <div className="max-w-5xl mx-auto space-y-4">
              <Collapsible
                open={openPatientInfo}
                onOpenChange={setOpenPatientInfo}
              >
                <SectionTrigger
                  icon={<User className="w-4 h-4 !text-[#00a896]" />}
                  title="Patient Information"
                  subtitle="Basic demographic details"
                  open={openPatientInfo}
                />
                <CollapsibleContent className="pt-4 space-y-4">
                  {/* Row 1: Name + DOB */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Field>
                      <Input
                        placeholder="Enter first name *"
                        value={patient.firstName}
                        onChange={(e) =>
                          handleChange("patientFirstName", e.target.value)
                        }
                        required
                      />
                      <FieldDescription>First Name</FieldDescription>
                    </Field>
                    <Field>
                      <Input
                        placeholder="Enter last name *"
                        value={patient.lastName}
                        onChange={(e) =>
                          handleChange("patientLastName", e.target.value)
                        }
                        required
                      />
                      <FieldDescription>Last Name</FieldDescription>
                    </Field>
                    <Field>
                      <InputGroup>
                        <InputGroupInput
                          id="date-required"
                          value={value}
                          placeholder={patient.birthdate}
                          onChange={(e) => {
                            handleChange("patientBirthDate", e.target.value);
                            const d = new Date(e.target.value);
                            setValue(e.target.value);
                            if (isValidDate(d)) {
                              setDate(d);
                              setMonth(d);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "ArrowDown") {
                              e.preventDefault();
                              setCalendarOpen(true);
                            }
                          }}
                        />
                        <InputGroupAddon align="inline-end">
                          <Popover
                            open={calendarOpen}
                            onOpenChange={setCalendarOpen}
                          >
                            <PopoverTrigger asChild>
                              <InputGroupButton
                                id="date-picker"
                                variant="ghost"
                                size="icon-xs"
                                aria-label="Select date"
                                className="!bg-[#00a896] text-white !hover:bg-[#028090] border-none"
                              >
                                <CalendarIcon />
                                <span className="sr-only">Select date</span>
                              </InputGroupButton>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto overflow-hidden p-0"
                              align="end"
                              alignOffset={-8}
                              sideOffset={10}
                            >
                              <Calendar
                                mode="single"
                                selected={date}
                                month={month}
                                onMonthChange={setMonth}
                                onSelect={(d) => {
                                  setDate(d);
                                  setValue(formatDate(d));
                                  setCalendarOpen(false);
                                }}
                              />
                            </PopoverContent>
                          </Popover>
                        </InputGroupAddon>
                      </InputGroup>
                      <FieldDescription>Date of Birth</FieldDescription>
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Field>
                      <Input
                        type="number"
                        placeholder="Enter age *"
                        value={patient.age}
                        onChange={(e) =>
                          handleChange("patientAge", e.target.value)
                        }
                        required
                      />
                      <FieldDescription>Patient Age</FieldDescription>
                    </Field>
                    <Field>
                      <Select
                        value={patient.gender}
                        onValueChange={(v) => handleChange("patientGender", v)}
                      >
                        <SelectTrigger className="!bg-[#00a896] w-full border-gray-300 !text-white">
                          <SelectValue placeholder="Select Gender *" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem
                            className="!bg-white !text-blue-500"
                            value="MALE"
                          >
                            Male
                          </SelectItem>
                          <SelectItem
                            className="!bg-white !text-red-500"
                            value="FEMALE"
                          >
                            Female
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FieldDescription>Gender</FieldDescription>
                    </Field>
                    <Field>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00a896]" />
                        <Input
                          type="text"
                          placeholder="+63 912 345 6789"
                          value={patient.telephone}
                          onChange={(e) =>
                            handleChange("patientTelephone", e.target.value)
                          }
                          className="pl-9"
                        />
                      </div>
                      <FieldDescription>Contact Number</FieldDescription>
                    </Field>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible open={openAddress} onOpenChange={setOpenAddress}>
                <SectionTrigger
                  icon={<MapPin className="w-4 h-4 !text-[#00a896]" />}
                  title="Address"
                  open={openAddress}
                />
                <CollapsibleContent className="pt-4 space-y-4">
                  <Field>
                    <Input
                      type="text"
                      placeholder="Street address, building, unit..."
                      value={patient.address1}
                      onChange={(e) =>
                        handleChange("patientAddress", e.target.value)
                      }
                    />
                    <FieldDescription>Address Line 1</FieldDescription>
                  </Field>
                  <Field>
                    <Input
                      type="text"
                      placeholder="Apartment, suite, etc. (optional)"
                      value={patient.address2}
                      onChange={(e) =>
                        handleChange("patientAddress2", e.target.value)
                      }
                    />
                    <FieldDescription>Address Line 2</FieldDescription>
                  </Field>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field>
                      <Input
                        type="text"
                        placeholder="City"
                        value={patient.city}
                        onChange={(e) =>
                          handleChange("patientCity", e.target.value)
                        }
                      />
                      <FieldDescription>City</FieldDescription>
                    </Field>
                    <Field className="mx-auto w-full">
                      <Input
                        type="text"
                        placeholder="State or Province"
                        value={patient.province}
                        onChange={(e) =>
                          handleChange("patientStateProvince", e.target.value)
                        }
                      />
                      <FieldDescription>State / Province</FieldDescription>
                    </Field>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible
                open={openHealthHistory}
                onOpenChange={setOpenHealthHistory}
              >
                <SectionTrigger
                  icon={<ClipboardList className="w-4 h-4 !text-[#00a896]" />}
                  title="Health History"
                  subtitle="Check all that apply"
                  open={openHealthHistory}
                />
                <CollapsibleContent className="pt-4">
                  <div className="divide-y rounded-xl border border-gray-200 overflow-hidden">
                    {[
                      {
                        key: "patientisMedicalCare",
                        label: "Are you presently under medical care?",
                      },
                      {
                        key: "patientDrugAllergy",
                        label: "Do you have any drug allergies?",
                      },
                      {
                        key: "patientFoodAllergy",
                        label:
                          "Do you have any food or environmental allergies?",
                      },
                      {
                        key: "patientTBPositive",
                        label:
                          "Have you ever had tuberculosis or a positive TB test?",
                      },
                      {
                        key: "patientHasClinician",
                        label:
                          "Have you ever been cared for by a mental health clinician?",
                      },
                      {
                        key: "patientDiet",
                        label: "Have you ever restricted your eating?",
                      },
                    ].map((item) => (
                      <div
                        key={item.key}
                        className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <FieldLabel>{item.label}</FieldLabel>
                        <Checkbox
                          className="size-5 border-gray-300 data-[state=unchecked]:!bg-gray-200 data-[state=checked]:!bg-[#00a896]"
                          checked={
                            fields[item.key as keyof typeof fields] as boolean
                          }
                          onCheckedChange={(checked) =>
                            handleChange(item.key, checked)
                          }
                        />
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible
                open={openFamilyHistory}
                onOpenChange={setOpenFamilyHistory}
              >
                <SectionTrigger
                  icon={<Users className="w-4 h-4 !text-[#00a896]" />}
                  title="Family History"
                  subtitle="Provide age and indicate relevant conditions"
                  open={openFamilyHistory}
                />
                <CollapsibleContent className="pt-4">
                  {isMobile ? (
                    <div className="space-y-4">
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          size="sm"
                          className="!bg-[#00a896] text-white hover:bg-[#028090]"
                          onClick={handleAddHistory}
                        >
                          + Add
                        </Button>
                      </div>
                      {familyHistory.map((history, index) => (
                        <Card
                          key={index}
                          className="p-4 space-y-4 border border-gray-200"
                        >
                          <Input
                            placeholder="Relation"
                            value={history.relation}
                            onChange={(e) =>
                              handleHistoryChange(
                                index,
                                "relation",
                                e.target.value,
                              )
                            }
                          />
                          <Input
                            placeholder="Age"
                            value={history.age}
                            onChange={(e) =>
                              handleHistoryChange(index, "age", e.target.value)
                            }
                          />
                          <Input
                            placeholder="Health Problems"
                            value={history.healthProblems}
                            onChange={(e) =>
                              handleHistoryChange(
                                index,
                                "healthProblems",
                                e.target.value,
                              )
                            }
                          />
                          <div className="flex justify-between items-center hover:bg-gray-50 rounded-lg p-2 transition-colors">
                            <span className="text-sm text-gray-700">
                              In Good Health
                            </span>
                            <Checkbox
                              checked={history.goodHealth}
                              className="size-5 border-gray-300 data-[state=unchecked]:!bg-gray-200 data-[state=checked]:!bg-[#00a896]"
                              onCheckedChange={(checked) =>
                                handleHistoryChange(
                                  index,
                                  "goodHealth",
                                  checked === true,
                                )
                              }
                            />
                          </div>
                          <div className="flex justify-between items-center hover:bg-gray-50 rounded-lg p-2 transition-colors">
                            <span className="text-sm text-gray-700">Alive</span>
                            <Checkbox
                              checked={history.isAlive}
                              className="size-5 border-gray-300 data-[state=unchecked]:!bg-gray-200 data-[state=checked]:!bg-[#00a896]"
                              onCheckedChange={(checked) =>
                                handleHistoryChange(
                                  index,
                                  "isAlive",
                                  checked === true,
                                )
                              }
                            />
                          </div>
                          {familyHistory.length > 1 && (
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="w-full !bg-red-400 text-white"
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
                      <div className="divide-y border border-gray-200 rounded-xl overflow-hidden mt-2">
                        {familyHistory.map((history, index) => (
                          <div
                            key={index}
                            className="grid grid-cols-[140px_80px_1fr_120px_80px_100px] items-center gap-3 p-3 hover:bg-gray-50 transition-colors"
                          >
                            <Input
                              placeholder="e.g. Father"
                              value={history.relation}
                              onChange={(e) =>
                                handleHistoryChange(
                                  index,
                                  "relation",
                                  e.target.value,
                                )
                              }
                            />
                            <Input
                              placeholder="Age"
                              value={history.age}
                              onChange={(e) =>
                                handleHistoryChange(
                                  index,
                                  "age",
                                  e.target.value,
                                )
                              }
                            />
                            <Input
                              placeholder="Health Problems"
                              value={history.healthProblems}
                              onChange={(e) =>
                                handleHistoryChange(
                                  index,
                                  "healthProblems",
                                  e.target.value,
                                )
                              }
                            />
                            <div className="flex justify-center">
                              <Checkbox
                                checked={history.goodHealth}
                                className="size-5 border-gray-300 data-[state=unchecked]:!bg-gray-200 data-[state=checked]:!bg-[#00a896]"
                                onCheckedChange={(checked) =>
                                  handleHistoryChange(
                                    index,
                                    "goodHealth",
                                    checked === true,
                                  )
                                }
                              />
                            </div>
                            <div className="flex justify-center">
                              <Checkbox
                                checked={history.isAlive}
                                className="size-5 border-gray-300 data-[state=unchecked]:!bg-gray-200 data-[state=checked]:!bg-[#00a896]"
                                onCheckedChange={(checked) =>
                                  handleHistoryChange(
                                    index,
                                    "isAlive",
                                    checked === true,
                                  )
                                }
                              />
                            </div>
                            <div className="flex justify-end">
                              {familyHistory.length > 1 && (
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
                </CollapsibleContent>
              </Collapsible>

              <div className="border-t border-gray-100 pt-2" />

              <div className="space-y-4">
                <div className="flex items-center gap-3 border-l-4 border-[#00c4b4] pl-4">
                  <div className="w-8 h-8 rounded-lg bg-[#00c4b4]/10 flex items-center justify-center flex-shrink-0">
                    <Activity className="w-4 h-4 text-[#00a896]" />
                  </div>
                  <div>
                    <h2 className="text-lg md:text-xl font-semibold text-gray-800">
                      Vital Statistics
                    </h2>
                    <p className="text-sm text-gray-500">
                      Leave blank if not measured
                    </p>
                  </div>
                </div>

                <div
                  className={`${isMobile ? "grid grid-cols-1 gap-4" : "grid grid-cols-4 gap-4"}`}
                >
                  <Field>
                    <div className="relative">
                      <Activity className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00a896]" />
                      <Input
                        type="text"
                        placeholder="120/80"
                        value={fields.patientBloodPressure}
                        onChange={(e) =>
                          handleChange("patientBloodPressure", e.target.value)
                        }
                        className="pl-9"
                      />
                    </div>
                    <FieldDescription>Blood Pressure (mmHg)</FieldDescription>
                  </Field>
                  <Field>
                    <div className="relative">
                      <Heart className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00a896]" />
                      <Input
                        type="text"
                        placeholder="72"
                        value={fields.patientHeartRate}
                        onChange={(e) =>
                          handleChange("patientHeartRate", e.target.value)
                        }
                        className="pl-9"
                      />
                    </div>
                    <FieldDescription>Heart Rate (BPM)</FieldDescription>
                  </Field>
                  <Field>
                    <div className="relative">
                      <Wind className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00a896]" />
                      <Input
                        type="text"
                        placeholder="16"
                        value={fields.patientRespiratoryRate}
                        onChange={(e) =>
                          handleChange("patientRespiratoryRate", e.target.value)
                        }
                        className="pl-9"
                      />
                    </div>
                    <FieldDescription>Respiratory Rate</FieldDescription>
                  </Field>
                  <Field>
                    <div className="relative">
                      <Droplets className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00a896]" />
                      <Input
                        type="text"
                        placeholder="98"
                        value={fields.patientOxygenSaturation}
                        onChange={(e) =>
                          handleChange(
                            "patientOxygenSaturation",
                            e.target.value,
                          )
                        }
                        className="pl-9"
                      />
                    </div>
                    <FieldDescription>Oxygen Saturation (%)</FieldDescription>
                  </Field>
                </div>

                <div
                  className={`${isMobile ? "grid grid-cols-1 gap-4" : "grid grid-cols-3 gap-4"}`}
                >
                  <Field className="mx-auto w-full">
                    <div className="relative">
                      <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00a896]" />
                      <Input
                        type="text"
                        placeholder="170"
                        value={fields.patientHeight}
                        onChange={(e) =>
                          handleChange("patientHeight", e.target.value)
                        }
                        className="pl-9"
                      />
                    </div>
                    <FieldDescription>Height (cm)</FieldDescription>
                  </Field>
                  <Field className="mx-auto w-full">
                    <div className="relative">
                      <Weight className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00a896]" />
                      <Input
                        type="text"
                        placeholder="62"
                        value={fields.patientWeight}
                        onChange={(e) =>
                          handleChange("patientWeight", e.target.value)
                        }
                        className="pl-9"
                      />
                    </div>
                    <FieldDescription>Weight (kg)</FieldDescription>
                  </Field>
                  <Field>
                    <div className="relative">
                      <Thermometer className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00a896]" />
                      <Input
                        type="text"
                        placeholder="36.5"
                        value={fields.patientTemperature}
                        onChange={(e) =>
                          handleChange("patientTemperature", e.target.value)
                        }
                        className="pl-9"
                      />
                    </div>
                    <FieldDescription>Temperature (°C)</FieldDescription>
                  </Field>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 border-l-4 border-[#00c4b4] pl-4">
                  <div className="w-8 h-8 rounded-lg bg-[#00c4b4]/10 flex items-center justify-center flex-shrink-0">
                    <Stethoscope className="w-4 h-4 text-[#00a896]" />
                  </div>
                  <h2 className="text-lg md:text-xl font-semibold text-gray-800">
                    Symptoms
                  </h2>
                </div>
                <Field>
                  <Input
                    placeholder="e.g. fever, cough, headache"
                    value={fields.patientSymptoms}
                    onChange={(e) =>
                      handleChange("patientSymptoms", e.target.value)
                    }
                  />
                  <FieldDescription>Describe current symptoms</FieldDescription>
                </Field>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 border-l-4 border-[#00c4b4] pl-4">
                    <div className="w-8 h-8 rounded-lg bg-[#00c4b4]/10 flex items-center justify-center flex-shrink-0">
                      <ClipboardList className="w-4 h-4 text-[#00a896]" />
                    </div>
                    <h2 className="text-lg md:text-xl font-semibold text-gray-800">
                      Illness
                    </h2>
                  </div>
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
                  {patientDiagnosis.map((diagnosis, index) => (
                    <div
                      key={index}
                      className={`grid ${isMobile ? "grid-cols-1" : "md:grid-cols-4"} gap-3 p-4 border border-gray-200 rounded-xl bg-gray-50`}
                    >
                      <Field>
                        <Autocomplete
                          placeholder="Diagnosis"
                          value={diagnosis.diagnosis}
                          onChange={(v) =>
                            handleDiagnosisChange(index, "diagnosis", v)
                          }
                        />
                      </Field>
                      <Field>
                        <Input
                          placeholder="Severity"
                          value={diagnosis.severity}
                          onChange={(e) =>
                            handleDiagnosisChange(
                              index,
                              "severity",
                              e.target.value,
                            )
                          }
                        />
                      </Field>
                      <Field>
                        <Input
                          placeholder="Notes"
                          value={diagnosis.notes}
                          onChange={(e) =>
                            handleDiagnosisChange(
                              index,
                              "notes",
                              e.target.value,
                            )
                          }
                        />
                      </Field>
                      {patientDiagnosis.length > 1 && (
                        <div className="flex items-center">
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="!bg-red-400 text-white hover:bg-[#028090]"
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

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#00c4b4]/10 flex items-center justify-center flex-shrink-0">
                      <Pill className="w-4 h-4 text-[#00a896]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Add Prescription?
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Toggle to attach a prescription to this consultation
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={includePrescription}
                    onCheckedChange={setIncludePrescription}
                  />
                </div>

                {includePrescription && (
                  <div className="border border-[#00c4b4]/30 rounded-2xl overflow-hidden">
                    <div className="bg-[#00c4b4]/5 px-6 py-3 border-b border-[#00c4b4]/20">
                      <p className="text-sm text-[#00a896] font-medium">
                        Prescription will be saved together with this
                        consultation record
                      </p>
                    </div>
                    <div className="p-4 md:p-6 space-y-6">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 border-l-4 border-[#00c4b4] pl-4">
                          <div className="w-8 h-8 rounded-lg bg-[#00c4b4]/10 flex items-center justify-center flex-shrink-0">
                            <Pill className="w-4 h-4 text-[#00a896]" />
                          </div>
                          <h2 className="text-lg font-semibold text-gray-800">
                            Drug Prescriptions
                          </h2>
                        </div>
                        <div className="grid grid-cols-6 bg-gray-50 border border-gray-200 rounded-t-xl px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          <div>Medicine</div>
                          <div>Unit</div>
                          <div>Dosage</div>
                          <div>Purpose</div>
                          <div>Frequency</div>
                          <div className="text-center">Action</div>
                        </div>
                        <div className="border border-t-0 border-gray-200 rounded-b-xl overflow-hidden divide-y divide-gray-200">
                          {drugs.map((drug, index) => (
                            <div
                              key={index}
                              className="grid grid-cols-6 gap-3 px-4 py-3 items-center hover:bg-gray-50 transition-colors"
                            >
                              <AutocompleteDrugs
                                placeholder="Paracetamol"
                                value={drug.medicine}
                                onChange={(v) =>
                                  handleDrugChange(index, "medicine", v)
                                }
                              />
                              <Input
                                placeholder="Tablet / ml"
                                value={drug.unit}
                                onChange={(e) =>
                                  handleDrugChange(
                                    index,
                                    "unit",
                                    e.target.value,
                                  )
                                }
                              />
                              <Input
                                placeholder="500mg"
                                value={drug.dosage}
                                onChange={(e) =>
                                  handleDrugChange(
                                    index,
                                    "dosage",
                                    e.target.value,
                                  )
                                }
                              />
                              <Input
                                placeholder="Pain relief"
                                value={drug.purpose}
                                onChange={(e) =>
                                  handleDrugChange(
                                    index,
                                    "purpose",
                                    e.target.value,
                                  )
                                }
                              />
                              <Input
                                placeholder="2x a day"
                                value={drug.frequency}
                                onChange={(e) =>
                                  handleDrugChange(
                                    index,
                                    "frequency",
                                    e.target.value,
                                  )
                                }
                              />
                              <div className="flex justify-center">
                                {drugs.length > 1 && (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="destructive"
                                    className="!bg-red-400 text-white h-8 text-xs"
                                    onClick={() => handleRemoveDrug(index)}
                                  >
                                    Remove
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          className="!bg-[#00a896] !text-white hover:!bg-[#028090]"
                          onClick={handleAddDrug}
                        >
                          + Add Drug Row
                        </Button>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-3 border-l-4 border-[#00c4b4] pl-4">
                          <div className="w-8 h-8 rounded-lg bg-[#00c4b4]/10 flex items-center justify-center flex-shrink-0">
                            <Stethoscope className="w-4 h-4 text-[#00a896]" />
                          </div>
                          <h2 className="text-lg font-semibold text-gray-800">
                            Examination & Recommendations
                          </h2>
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                          <Field>
                            <FieldLabel className="text-sm text-gray-600 mb-1 block">
                              Examination
                            </FieldLabel>
                            <Textarea
                              placeholder="e.g. Physical examination findings..."
                              value={prescriptionFields.examination}
                              onChange={(e) =>
                                setPrescriptionFields((prev) => ({
                                  ...prev,
                                  examination: e.target.value,
                                }))
                              }
                            />
                          </Field>
                          <Field>
                            <FieldLabel className="text-sm text-gray-600 mb-1 block">
                              Recommendations
                            </FieldLabel>
                            <Textarea
                              placeholder="e.g. Rest, hydration, follow-up in 3 days..."
                              value={prescriptionFields.recommendation}
                              onChange={(e) =>
                                setPrescriptionFields((prev) => ({
                                  ...prev,
                                  recommendation: e.target.value,
                                }))
                              }
                            />
                          </Field>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ── 9. PRIVACY NOTICE ── */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-l-4 border-[#00c4b4] pl-4">
                  <div className="w-8 h-8 rounded-lg bg-[#00c4b4]/10 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-4 h-4 text-[#00a896]" />
                  </div>
                  <h2 className="text-lg md:text-xl font-semibold text-gray-800">
                    Privacy Notice
                  </h2>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <Field>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <Checkbox
                        className="size-5 mt-0.5 rounded-none !border-gray-400
                          data-[state=unchecked]:!bg-white
                          data-[state=checked]:!bg-[#00a896]"
                      />
                      <span className="text-sm text-gray-700 leading-relaxed">
                        I confirm that I have informed the patient about the
                        privacy notice.
                      </span>
                    </label>
                  </Field>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </Card>

      {!userIsAdmin && linkedUser && (
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
          <Label className="text-base font-semibold text-blue-800 mb-1 flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            {userIsSecretary ? "Linked Doctor" : "Linked Secretary"}
          </Label>
          <p className="text-blue-900 font-medium">
            {linkedUser.firstName} {linkedUser.lastName}
            {linkedUser.field && ` · ${linkedUser.field}`}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            {userIsSecretary
              ? "This record will be submitted for approval to your linked doctor."
              : "This record will automatically be shared with your linked secretary."}
          </p>
        </div>
      )}

      {!userIsAdmin && !linkedUser && userIsSecretary && (
        <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            You are not linked to a doctor yet. Link with a doctor before adding
            consultation records — a doctor and secretary can only be linked to
            one account at a time.
          </p>
        </div>
      )}

      <div className="flex justify-center mt-8 md:mt-10 pb-6">
        <Button
          type="submit"
          disabled={isLoading || (userIsSecretary && !currentUserLinkId)}
          className="!bg-[#00a896] hover:!bg-[#028090] !text-white !px-12 !py-6 !text-lg font-semibold rounded-xl transition-all disabled:opacity-50 shadow-md"
        >
          {isLoading ? "Saving..." : "Save Consultation Record"}
        </Button>
      </div>
    </form>
  );
}
