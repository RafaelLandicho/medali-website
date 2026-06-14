"use client";

import * as React from "react";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "./ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  ShieldCheck,
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
import { toast } from "sonner";
import { db } from "@/firebaseConfig";
import { ref, set, push, onValue, get } from "firebase/database";
import { useAuth } from "@/auth/authprovider";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";

export type MedicalRecords = {
  recordId: string;

  patientDiagnosis: { diagnosis: string; severity: string; notes: string }[];
  addedBy: string;
  familyHistory: {
    relation: string;
    age: string;
    healthProblems: string;
    goodHealth: boolean;
    isAlive: boolean;
  }[];
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
  records?: { [key: string]: MedicalRecords };
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

export function AddConsultationRecords() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const location = useLocation();
  const patient = location.state as Patient | null;
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

  const [open, setOpen] = React.useState(false);
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
    patientisMedicalCare: false,
    patientDrugAllergy: false,
    patientFoodAllergy: false,
    patientTBPositive: false,
    patientHasClinician: false,
    patientDiet: false,
  };

  const [fields, setFields] = useState(initialState);
  const [openSections, setOpenSections] = useState<string[]>(["basic"]);
  const [isLoading, setIsLoading] = useState(false);
  const [patientDiagnosis, setDiagnosis] = useState([
    { diagnosis: "", severity: "", notes: "" },
  ]);
  const [familyHistory, setFamilyHistory] = useState([
    {
      relation: "",
      age: "",
      healthProblems: "",
      goodHealth: true,
      isAlive: true,
    },
  ]);
  const [linkedUsers, setLinkedUsers] = React.useState<any[]>([]);
  const [selectedLinkedUser, setSelectedLinkedUser] = React.useState("");

  const userIsAdmin = user?.type?.toLowerCase() === "admin";
  const userIsSecretary = user?.type?.toLowerCase() === "secretary";
  const userIsDoctor = user?.type?.toLowerCase() === "doctor";
  console.log(patient);

  React.useEffect(() => {
    if (!user) return;
    const userRef = ref(db, `users/${user.uid}`);
    const unsubscribe = onValue(userRef, async (snapshot) => {
      const userData = snapshot.val();
      if (!userData) return;
      let linkedUserIds: string[] = [];
      if (user.type?.toLowerCase() === "secretary") {
        linkedUserIds = userData.doctors || [];
      } else if (user.type?.toLowerCase() === "doctor") {
        linkedUserIds = userData.secretaries || [];
      }
      const linkedUsersPromises = linkedUserIds.map(async (userId: string) => {
        const linkedUserRef = ref(db, `users/${userId}`);
        const linkedUserSnap = await get(linkedUserRef);
        if (linkedUserSnap.exists()) {
          return { id: userId, ...linkedUserSnap.val() };
        }
        return null;
      });
      const linkedUsersData = await Promise.all(linkedUsersPromises);
      setLinkedUsers(linkedUsersData.filter(Boolean));
    });
    return () => unsubscribe();
  }, [user]);

  const handleChange = (key: string, value: string | boolean) => {
    setFields((prev) => ({ ...prev, [key]: value }));
    console.log(key, value);
  };
  const handleAddDiagnosis = () =>
    setDiagnosis([
      ...patientDiagnosis,
      { diagnosis: "", severity: "", notes: "" },
    ]);

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

  const handleRemoveDiagnosis = (index: number) =>
    setDiagnosis(patientDiagnosis.filter((_, i) => i !== index));

  const handleRemoveHistory = (index: number) =>
    setFamilyHistory(familyHistory.filter((_, i) => i !== index));

  const handleDiagnosisChange = (
    index: number,
    key: "diagnosis" | "severity" | "notes",
    value: string,
  ) => {
    const updated = [...patientDiagnosis];
    updated[index][key] = value;
    setDiagnosis(updated);
  };

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

  const addConsultationRecord = async () => {
    if (!patient?.id) {
      toast.error("Patient data is missing");
      return;
    }

    setIsLoading(true);

    try {
      const logsRef = ref(db, "logs/");
      const recordsRef = ref(db, `patients/${patient.id}/records`);
      const newRecord = push(recordsRef);
      const newLog = push(logsRef);
      const allPatientsRef = ref(db, "patients");
      const allPatientsSnap = await get(allPatientsRef);
      let totalRecords = 0;
      if (allPatientsSnap.exists()) {
        allPatientsSnap.forEach((patientSnap) => {
          const records = patientSnap.child("records").val();
          if (records) {
            totalRecords += Object.keys(records).length;
          }
        });
      }
      const recordNumber = totalRecords + 1;
      const recordId = newRecord.key || "";

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
        familyHistory: familyHistory,
        addedBy: user?.email,
        createdBy: user?.uid,
        createdAt: Date.now(),
      };

      if (userIsSecretary) {
        const pendingRef = ref(db, "pending");
        const newPending = push(pendingRef);
        await set(newPending, {
          ...recordData,
          patientId: patient.id,
          status: "pending",
        });
        await set(newLog, {
          medicalRecordLog: `Consultation record added for approval by ${user?.firstName} ${user?.lastName} for patient ${patient.firstName} ${patient.lastName}`,
          logTime: new Date().toLocaleString(),
        });
        toast.success("Consultation record submitted for approval!");
      } else {
        await set(newRecord, recordData);
        await set(newLog, {
          medicalRecordLog: `Consultation record added by ${user?.firstName} ${user?.lastName} for patient ${patient.firstName} ${patient.lastName}`,
          logTime: new Date().toLocaleString(),
        });
        toast.success("Consultation record added successfully!");
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
        {/* ── HEADER ── */}
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
            <div className="max-w-5xl mx-auto space-y-10">
              {/* ── PATIENT INFORMATION ── */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-l-4 border-[#00c4b4] pl-4">
                  <div className="w-8 h-8 rounded-lg bg-[#00c4b4]/10 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-[#00a896]" />
                  </div>
                  <div>
                    <h2 className="text-lg md:text-xl font-semibold text-gray-800">
                      Patient Information
                    </h2>
                    <p className="text-sm text-gray-500">
                      Basic demographic details
                    </p>
                  </div>
                </div>

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
                          const date = new Date(e.target.value);
                          setValue(e.target.value);
                          if (isValidDate(date)) {
                            setDate(date);
                            setMonth(date);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "ArrowDown") {
                            e.preventDefault();
                            setOpen(true);
                          }
                        }}
                      />
                      <InputGroupAddon align="inline-end">
                        <Popover open={open} onOpenChange={setOpen}>
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
                              className="text-white"
                              onSelect={(date) => {
                                setDate(date);
                                setValue(formatDate(date));
                                setOpen(false);
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                      </InputGroupAddon>
                    </InputGroup>
                    <FieldDescription>Date of Birth</FieldDescription>
                  </Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                  <Select
                    value={patient.gender}
                    onValueChange={(value) =>
                      handleChange("patientGender", value)
                    }
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
                </div>
              </div>

              {/* ── ADDRESS ── */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-l-4 border-[#00c4b4] pl-4">
                  <div className="w-8 h-8 rounded-lg bg-[#00c4b4]/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-[#00a896]" />
                  </div>
                  <h2 className="text-lg md:text-xl font-semibold text-gray-800">
                    Address
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-4">
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
                </div>
              </div>

              {/* ── CONTACT NUMBER ── */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-l-4 border-[#00c4b4] pl-4">
                  <div className="w-8 h-8 rounded-lg bg-[#00c4b4]/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4 text-[#00a896]" />
                  </div>
                  <h2 className="text-lg md:text-xl font-semibold text-gray-800">
                    Contact Number
                  </h2>
                </div>
                <Field>
                  <Input
                    type="text"
                    placeholder="+63 912 345 6789"
                    value={patient.telephone}
                    onChange={(e) =>
                      handleChange("patientTelephone", e.target.value)
                    }
                  />
                </Field>
              </div>
              {/* ── VITAL STATISTICS ── */}
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

              {/* ── HEALTH HISTORY ── */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-l-4 border-[#00c4b4] pl-4">
                  <div className="w-8 h-8 rounded-lg bg-[#00c4b4]/10 flex items-center justify-center flex-shrink-0">
                    <ClipboardList className="w-4 h-4 text-[#00a896]" />
                  </div>
                  <div>
                    <h2 className="text-lg md:text-xl font-semibold text-gray-800">
                      Health History
                    </h2>
                    <p className="text-sm text-gray-500">
                      Please check if any of the following apply
                    </p>
                  </div>
                </div>

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
                      label: "Do you have any food or environmental allergies?",
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
              </div>

              {/* ── SYMPTOMS ── */}
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

              {/* ── DIAGNOSIS ── */}
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
                      className={`grid ${
                        isMobile ? "grid-cols-1" : "md:grid-cols-4"
                      } gap-3 p-4 border border-gray-200 rounded-xl bg-gray-50`}
                    >
                      <Field>
                        <Input
                          placeholder="Diagnosis"
                          value={diagnosis.diagnosis}
                          onChange={(e) =>
                            handleDiagnosisChange(
                              index,
                              "diagnosis",
                              e.target.value,
                            )
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

              {/* ── FAMILY HISTORY ── */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-l-4 border-[#00c4b4] pl-4">
                  <div className="w-8 h-8 rounded-lg bg-[#00c4b4]/10 flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 text-[#00a896]" />
                  </div>
                  <div>
                    <h2 className="text-lg md:text-xl font-semibold text-gray-800">
                      Family History
                    </h2>
                    <p className="text-sm text-gray-500">
                      Provide age and indicate relevant conditions
                    </p>
                  </div>
                </div>

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

                    <div className="divide-y border border-gray-200 rounded-xl overflow-hidden">
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
              </div>

              {/* ── PRIVACY NOTICE ── */}
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

      {!userIsAdmin && linkedUsers.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
          <Label className="text-base font-semibold text-blue-800 mb-3 block">
            {userIsSecretary && "Share with Doctor"}
            {userIsDoctor && "Share with Secretary"}
          </Label>
          <Select
            value={selectedLinkedUser}
            onValueChange={setSelectedLinkedUser}
          >
            <SelectTrigger className="!bg-white !text-base md:!text-lg h-12 md:h-14 border-blue-300">
              <SelectValue
                placeholder={`Select a ${
                  userIsSecretary ? "doctor" : "secretary"
                } to share this record with`}
              />
            </SelectTrigger>
            <SelectContent>
              {linkedUsers.map((linkedUser) => (
                <SelectItem key={linkedUser.id} value={linkedUser.id}>
                  {linkedUser.firstName} {linkedUser.lastName}
                  {linkedUser.field && ` - ${linkedUser.field}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* ── SUBMIT ── */}
      <div className="flex justify-center mt-8 md:mt-10 pb-6">
        <Button
          type="submit"
          disabled={isLoading}
          className="!bg-[#00a896] hover:!bg-[#028090] !text-white !px-12 !py-6 !text-lg font-semibold rounded-xl transition-all disabled:opacity-50 shadow-md"
        >
          {isLoading ? "Saving..." : "Save Consultation Record"}
        </Button>
      </div>
    </form>
  );
}
