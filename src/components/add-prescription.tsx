import { Button } from "@/components/ui/button";
import Autocomplete from "@/components/ui/autocomplete";
import AutocompleteDrugs from "./ui/autocomplete_drugs";
import { toast } from "sonner";
import { Field, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ClipboardList, Pill, Stethoscope, User } from "lucide-react";
import { useState, useEffect } from "react";
import { db } from "@/firebaseConfig";
import { ref, set, onValue } from "firebase/database";
import { useAuth } from "@/auth/authprovider";

export type User = {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  field: string;
  medicalId: string;
  type: string;
  email: string;
  requestedBy?: string[];
  requestedTo?: string[];
  uid?: string;
};

type AddPrescriptionProps = {
  patient: {
    // Patient-level fields
    patientId: string;
    firstName: string;
    lastName: string;
    gender?: string;
    age?: number;
    address: string;
    // Record-level fields — scoped to the specific record
    recordId: string;
    patientDiagnosis: {
      diagnosis: string;
      severity: string;
      notes: string;
    }[];
    readOnly?: boolean;
  };
};

export function AddPrescription({ patient }: AddPrescriptionProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [alreadyExists, setAlreadyExists] = useState(false);

  const [prescriptions, setPrescriptions] = useState([
    { medicine: "", unit: "", dosage: "", purpose: "", frequency: "" },
  ]);

  const [diagnosisPres, setDiagnosisPres] = useState<
    { diagnosis: string; severity: string; notes: string }[]
  >([]);

  const [fields, setFields] = useState({
    patientExamination: "",
    patientRecommendation: "",
  });

  useEffect(() => {
    if (!patient?.patientId || !patient?.recordId) return;

    // Pre-fill diagnosis from the record
    if (patient.patientDiagnosis?.length) {
      setDiagnosisPres(
        patient.patientDiagnosis.map((d) => ({
          diagnosis: d.diagnosis,
          severity: d.severity,
          notes: d.notes,
        })),
      );
    } else {
      setDiagnosisPres([{ diagnosis: "", severity: "", notes: "" }]);
    }

    // Check if a prescription already exists for this record
    const prescriptionRef = ref(
      db,
      `patients/${patient.patientId}/records/${patient.recordId}/prescription`,
    );

    const unsub = onValue(prescriptionRef, (snapshot) => {
      if (snapshot.exists()) {
        const existing = snapshot.val();
        // Load existing prescription into state for editing
        setAlreadyExists(true);

        if (existing.drugs) setPrescriptions(existing.drugs);
        if (existing.diagnosis) setDiagnosisPres(existing.diagnosis);
        setFields({
          patientExamination: existing.examination ?? "",
          patientRecommendation: existing.recommendation ?? "",
        });
      } else {
        setAlreadyExists(false);
      }
      setIsLoading(false);
    });

    return () => unsub();
  }, [patient?.patientId, patient?.recordId]);

  const handleChange = (key: string, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddPrescription = () =>
    setPrescriptions([
      ...prescriptions,
      { medicine: "", unit: "", dosage: "", purpose: "", frequency: "" },
    ]);

  const handleRemovePrescription = (index: number) =>
    setPrescriptions(prescriptions.filter((_, i) => i !== index));

  const handlePrescriptionChange = (
    index: number,
    key: "medicine" | "unit" | "dosage" | "purpose" | "frequency",
    value: string,
  ) => {
    const updated = [...prescriptions];
    updated[index][key] = value;
    setPrescriptions(updated);
  };

  const handleAddDiagnosis = () =>
    setDiagnosisPres([
      ...diagnosisPres,
      { diagnosis: "", severity: "", notes: "" },
    ]);

  const handleRemoveDiagnosis = (index: number) =>
    setDiagnosisPres(diagnosisPres.filter((_, i) => i !== index));

  const handleDiagnosisChange = (
    index: number,
    key: "diagnosis" | "severity" | "notes",
    value: string,
  ) => {
    const updated = [...diagnosisPres];
    updated[index][key] = value;
    setDiagnosisPres(updated);
  };

  const savePrescription = async () => {
    try {
      const prescriptionRef = ref(
        db,
        `patients/${patient.patientId}/records/${patient.recordId}/prescription`,
      );

      await set(prescriptionRef, {
        patientFirstName: patient.firstName,
        patientLastName: patient.lastName,
        patientAddress: patient.address,
        patientAge: patient.age,
        patientGender: patient.gender,
        diagnosis: diagnosisPres,
        examination: fields.patientExamination,
        recommendation: fields.patientRecommendation,
        drugs: prescriptions,
        addedBy: `${user?.firstName} ${user?.lastName}`,
        field: user?.field,
        doctorId: user?.medicalId,
        createdBy: user?.uid,
        updatedAt: new Date().toLocaleString(),
      });

      const logsRef = ref(db, "logs/");
      const { push } = await import("firebase/database");
      const newLog = push(logsRef);
      await set(newLog, {
        prescriptionLog: `Prescription ${alreadyExists ? "updated" : "added"} by ${user?.firstName} ${user?.lastName} for record ${patient.firstName}${patient.lastName}`,
        logTime: new Date().toLocaleString(),
      });
      console.log(
        "Writing to:",
        `patients/${patient.patientId}/records/${patient.recordId}/prescription`,
      );

      toast.success(
        `Prescription ${alreadyExists ? "updated" : "added"} for  ${patient.firstName}${patient.lastName}`,
      );
      setAlreadyExists(true);
    } catch (error) {
      console.error(error);
      toast.error("Failed to save prescription");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-10 text-gray-500 text-sm">
        Loading…
      </div>
    );
  }

  return (
    <div className="w-full">
      {alreadyExists && (
        <div className="mb-4 px-4 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium">
          A prescription already exists for this record. Saving will overwrite
          it.
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          savePrescription();
        }}
      >
        <FieldGroup>
          <FieldSet className="space-y-6">
            {/* ── HEADER ── */}
            <div className="text-center mb-8">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800 tracking-tight">
                Prescription Form
              </h1>
              <div className="mt-4 h-1 w-16 bg-[#00c4b4] rounded-full mx-auto" />
            </div>

            {/* ── PATIENT BANNER ── */}
            <div className="flex items-center gap-4 p-4 rounded-xl border border-[#00c4b4]/30 bg-[#00c4b4]/5">
              <div className="w-10 h-10 rounded-full bg-[#00c4b4]/15 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-[#00a896]" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#00a896] uppercase tracking-widest mb-0.5">
                  Patient
                </p>
                <p className="text-base font-bold text-gray-800">
                  {patient.firstName} {patient.lastName}
                </p>
                {(patient.age || patient.gender) && (
                  <p className="text-sm text-gray-500">
                    {patient.gender && <span>{patient.gender}</span>}
                    {patient.age && patient.gender && <span> · </span>}
                    {patient.age && <span>{patient.age} yrs old</span>}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-10 max-w-[1100px] mx-auto">
              {/* ── DIAGNOSIS ── */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 border-l-4 border-[#00c4b4] pl-4">
                    <div className="w-8 h-8 rounded-lg bg-[#00c4b4]/10 flex items-center justify-center flex-shrink-0">
                      <ClipboardList className="w-4 h-4 text-[#00a896]" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-800">
                      Diagnosis
                    </h2>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className="!bg-[#00a896] !text-white hover:!bg-[#028090]"
                    onClick={handleAddDiagnosis}
                  >
                    + Add
                  </Button>
                </div>

                <div className="space-y-3">
                  {diagnosisPres.map((item, index) => (
                    <div
                      key={index}
                      className="p-4 border border-gray-200 rounded-xl bg-gray-50 space-y-3"
                    >
                      <div className="grid md:grid-cols-2 gap-3">
                        <Autocomplete
                          placeholder="Illness"
                          value={item.diagnosis}
                          onChange={(value) =>
                            handleDiagnosisChange(index, "diagnosis", value)
                          }
                        />
                        <Input
                          placeholder="Severity"
                          value={item.severity}
                          onChange={(e) =>
                            handleDiagnosisChange(
                              index,
                              "severity",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                      <Input
                        placeholder="Notes"
                        value={item.notes}
                        onChange={(e) =>
                          handleDiagnosisChange(index, "notes", e.target.value)
                        }
                      />
                      {diagnosisPres.length > 1 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          className="!bg-red-400 text-white"
                          onClick={() => handleRemoveDiagnosis(index)}
                        >
                          Remove Diagnosis
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
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
                  {prescriptions.map((drug, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-6 gap-3 px-4 py-3 items-center hover:bg-gray-50 transition-colors"
                    >
                      <AutocompleteDrugs
                        placeholder="Paracetamol"
                        value={drug.medicine}
                        onChange={(value) =>
                          handlePrescriptionChange(index, "medicine", value)
                        }
                      />
                      <Input
                        placeholder="Tablet / ml"
                        value={drug.unit}
                        onChange={(e) =>
                          handlePrescriptionChange(
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
                          handlePrescriptionChange(
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
                          handlePrescriptionChange(
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
                          handlePrescriptionChange(
                            index,
                            "frequency",
                            e.target.value,
                          )
                        }
                      />
                      <div className="flex justify-center">
                        {prescriptions.length > 1 && (
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            className="!bg-red-400 text-white h-8 text-xs"
                            onClick={() => handleRemovePrescription(index)}
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
                  onClick={handleAddPrescription}
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
                    <Input
                      placeholder="e.g. Physical examination findings..."
                      value={fields.patientExamination}
                      onChange={(e) =>
                        handleChange("patientExamination", e.target.value)
                      }
                    />
                  </Field>

                  <Field>
                    <FieldLabel className="text-sm text-gray-600 mb-1 block">
                      Recommendations
                    </FieldLabel>
                    <Input
                      placeholder="e.g. Rest, hydration, follow-up in 3 days..."
                      value={fields.patientRecommendation}
                      onChange={(e) =>
                        handleChange("patientRecommendation", e.target.value)
                      }
                    />
                  </Field>
                </div>
              </div>

              <div className="flex justify-center pb-6">
                <Button
                  type="submit"
                  className="!bg-[#00a896] hover:!bg-[#028090] !text-white !px-12 !py-6 !text-lg font-semibold rounded-xl transition-all shadow-md"
                >
                  {alreadyExists ? "Update Prescription" : "Save Prescription"}
                </Button>
              </div>
            </div>
          </FieldSet>
        </FieldGroup>
      </form>
    </div>
  );
}
