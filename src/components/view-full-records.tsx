"use client";

import { useState, useEffect, useRef } from "react";
import type { Patient } from "./medical_records";
import type { MedicalRecord } from "./view-consultation-records";
import html2canvas from "html2canvas-pro";
import { Button } from "@/components/ui/button";
import { db } from "@/firebaseConfig";
import { ref, set, push, onValue } from "firebase/database";
import { useAuth } from "@/auth/authprovider";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Download,
  FileText,
  Pill,
  Stethoscope,
  Users,
  Heart,
  ChevronDown,
} from "lucide-react";

type FullDetails = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient & MedicalRecord;
};

type Prescription = {
  drugs?: {
    medicine: string;
    unit: string;
    dosage: string;
    purpose: string;
    frequency: string;
  }[];
  diagnosis?: { diagnosis: string; severity: string; notes: string }[];
  examination?: string;
  recommendation?: string;
  addedBy?: string;
  doctorId?: string;
  field?: string;
  updatedAt?: string;
};

export function ViewFullPatient({ patient }: FullDetails) {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const printRef = useRef<HTMLDivElement>(null);
  const [prescription, setPrescription] = useState<Prescription | null>(null);

  const logsRef = ref(db, "logs/");

  useEffect(() => {
    if (!patient.id || !patient.recordId) return;

    const prescriptionRef = ref(
      db,
      `patients/${patient.id}/records/${patient.recordId}/prescription`,
    );

    const unsub = onValue(prescriptionRef, (snapshot) => {
      if (snapshot.exists()) {
        setPrescription(snapshot.val());
      } else {
        setPrescription(null);
      }
    });

    return () => unsub();
  }, [patient.id, patient.recordId]);

  const updateLog = async () => {
    const newLog = push(logsRef);
    await set(newLog, {
      medicalRecordLog: `Medical Record ${patient.id} ${patient.firstName} ${patient.lastName} downloaded by ${user?.firstName} ${user?.lastName}`,
      logTime: new Date().toLocaleString(),
    });
  };

  const handleDownloadImage = async () => {
    if (!printRef.current) return;
    const canvas = await html2canvas(printRef.current, {
      scale: isMobile ? 2 : 3,
      useCORS: true,
      backgroundColor: "#ffffff",
      scrollY: -window.scrollY,
      windowWidth: printRef.current.scrollWidth,
      windowHeight: printRef.current.scrollHeight,
    });
    const imgData = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = imgData;
    link.download = `${patient.firstName}_${patient.lastName}_MedicalRecord.png`;
    link.click();
    updateLog();
  };

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {/* TOOLBAR */}
      <div
        className={`${isMobile ? "sticky top-0 z-10 bg-[#f0faf9] py-2 px-2 rounded-xl shadow-sm" : ""}`}
      >
        <div className="flex justify-center">
          <Button
            onClick={handleDownloadImage}
            className="!bg-[#ff6b6b] hover:!bg-[#e05555] text-white font-semibold px-6 md:px-8 w-full md:w-auto shadow-md transition-all"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Medical Record
          </Button>
        </div>
      </div>

      {/* DOCUMENT */}
      <div className="overflow-auto max-h-[85vh] bg-[#e6f7f5] p-2 md:p-4 rounded-xl">
        <div
          ref={printRef}
          className="w-full max-w-[794px] min-h-[1123px] bg-white mx-auto shadow-xl border border-[#b2e4df] text-[11px] md:text-[13px] text-[#004d45] font-sans"
        >
          {/* HEADER */}
          <div className="text-center pt-6 md:pt-10 pb-3 md:pb-4 px-4 bg-gradient-to-br from-[#00a896]/10 to-white">
            <div className="flex justify-center mb-2 md:mb-3">
              <div className="bg-[#00a896]/10 rounded-full p-2 md:p-3">
                <FileText className="w-6 h-6 md:w-8 md:h-8 text-[#00a896]" />
              </div>
            </div>
            <h1 className="text-xl md:text-3xl font-bold tracking-wide text-[#00a896] uppercase">
              Medical Record
            </h1>
            <p className="text-[10px] md:text-xs text-[#007a6e]/60 mt-1 tracking-widest uppercase">
              Confidential Patient Document
            </p>
          </div>

          {/* Accent bar */}
          <div className="flex w-full h-2 md:h-3 mb-4 md:mb-8">
            <div className="w-1/2 bg-[#00a896]"></div>
            <div className="w-1/2 bg-[#ffd166]"></div>
          </div>

          {/* RECORD NO + DATE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-10 px-4 md:px-10 mb-6 md:mb-8">
            <div>
              <p className="font-semibold text-xs md:text-sm text-[#00a896]">
                Medical Record No.
              </p>
              <p className="text-xs md:text-sm break-all text-[#004d45]">
                {patient.recordNumber}
              </p>
            </div>
            <div>
              <p className="font-semibold text-xs md:text-sm text-[#00a896]">
                Record Date
              </p>
              <p className="text-xs md:text-sm text-[#004d45]">
                {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* PATIENT INFORMATION */}
          <div className="px-4 md:px-10">
            <SectionHeader label="Patient Information" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 md:gap-x-14 px-4 md:px-10 mb-6 md:mb-8">
            <Info
              label="Name"
              value={`${patient.firstName} ${patient.lastName}`}
            />
            <Info label="Age" value={patient.age} />
            <Info label="Gender" value={patient.gender} />
            <Info label="Phone Number" value={patient.telephone} />
            <Info label="Address" value={patient.address} />
            <Info label="Symptoms" value={patient.symptoms} />
          </div>

          {/* VITAL SIGNS */}
          <div className="px-4 md:px-10">
            <SectionHeader label="Vital Signs" />
          </div>
          <div className="grid grid-cols-2 gap-x-14 gap-y-4 px-4 md:px-10 mb-6 md:mb-8">
            <Info label="Blood Pressure" value={patient.bloodPressure} />
            <Info label="Heart Rate" value={patient.heartRate} />
            <Info label="Respiratory Rate" value={patient.respiratoryRate} />
            <Info label="Temperature" value={patient.temperature} />
            <Info label="Oxygen Saturation" value={patient.oxygenSaturation} />
            <Info
              label="Height / Weight"
              value={`${patient.height || "-"} / ${patient.weight || "-"}`}
            />
          </div>

          {/* DIAGNOSIS */}
          <div className="px-4 md:px-10">
            <SectionHeader label="Diagnosis Report" />
            <table className="w-full border-collapse text-[11px] md:text-[12px] mb-8 md:mb-10">
              <thead>
                <tr className="bg-[#e6f7f5] text-left text-[#007a6e]">
                  <th className="p-2">Diagnosis</th>
                  <th className="p-2">Severity</th>
                  <th className="p-2">Notes</th>
                </tr>
              </thead>
              <tbody>
                {patient.patientDiagnosis?.length ? (
                  patient.patientDiagnosis.map((diag, i) => (
                    <tr
                      key={i}
                      className="border-b border-[#e6f7f5] hover:bg-[#f7fdfc]"
                    >
                      <td className="p-2">{diag.diagnosis || "-"}</td>
                      <td className="p-2">{diag.severity || "-"}</td>
                      <td className="p-2">{diag.notes || "-"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={3}
                      className="p-3 text-center text-gray-400 italic"
                    >
                      No diagnosis available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ── PRESCRIPTION (if exists) ── */}
          {prescription && (
            <div className="px-4 md:px-10">
              <Collapsible>
                <CollapsibleTrigger className="w-full flex items-center justify-between !bg-[#00a896] text-white font-bold px-2 md:px-3 py-1.5 mb-3 md:mb-4 text-xs md:text-sm rounded-sm tracking-wide uppercase">
                  <span className="text-l font-bold">Prescription</span>
                  <ChevronDown className="w-4 h-4 transition-transform duration-200 [[data-state=open]_&]:rotate-180" />
                </CollapsibleTrigger>

                <CollapsibleContent className="space-y-0">
                  {/* RX DATE */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-10 mb-6 md:mb-8">
                    <div>
                      <p className="font-semibold text-xs md:text-sm text-[#00a896]">
                        Prescription Date
                      </p>
                      <p className="text-xs md:text-sm text-[#004d45]">
                        {prescription.updatedAt}
                      </p>
                    </div>
                  </div>

                  {/* EXAMINATION */}
                  <SectionHeader label="Prescription — Patient Information" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 md:gap-x-14 mb-6 md:mb-8">
                    <Info
                      label="Examination"
                      value={prescription.examination}
                    />
                  </div>

                  {/* MEDICAL NOTES / DIAGNOSIS */}
                  <SectionHeader label="Medical Notes / Diagnosis" />
                  <div className="mb-6 md:mb-8">
                    {isMobile ? (
                      <div className="space-y-4">
                        <div className="bg-[#f0faf9] border border-[#b2e4df] p-3 rounded-xl">
                          <div className="flex items-center gap-2 mb-2">
                            <Stethoscope className="w-4 h-4 text-[#00a896]" />
                            <p className="font-semibold text-sm text-[#004d45]">
                              Diagnosis
                            </p>
                          </div>
                          {prescription.diagnosis?.length ? (
                            <div className="space-y-2">
                              {prescription.diagnosis.map((d, i) => (
                                <div
                                  key={i}
                                  className="border-l-2 border-[#00a896] pl-3"
                                >
                                  <p className="text-sm font-medium text-[#004d45]">
                                    {d.diagnosis}
                                  </p>
                                  <p className="text-xs text-[#007a6e]">
                                    Severity: {d.severity}
                                  </p>
                                  {d.notes && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      {d.notes}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-400 italic">
                              No diagnosis listed
                            </p>
                          )}
                        </div>
                        <div className="bg-[#f0faf9] border border-[#b2e4df] p-3 rounded-xl">
                          <p className="font-semibold text-sm text-[#004d45] mb-2">
                            Recommendation
                          </p>
                          <p className="text-sm text-[#004d45]">
                            {prescription.recommendation || "None"}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-x-14 gap-y-4">
                        <div>
                          <p className="font-semibold mb-1 text-[#00a896]">
                            Diagnosis
                          </p>
                          {prescription.diagnosis?.length ? (
                            prescription.diagnosis.map((d, i) => (
                              <p key={i} className="text-[#004d45]">
                                • {d.diagnosis} — {d.severity} {d.notes}
                              </p>
                            ))
                          ) : (
                            <p className="text-gray-400 italic">
                              No diagnosis listed
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold mb-1 text-[#00a896]">
                            Recommendation
                          </p>
                          <p className="text-[#004d45]">
                            {prescription.recommendation || "None"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* PRESCRIBED MEDICATIONS */}
                  <SectionHeader label="List of Prescribed Medications" />
                  {isMobile ? (
                    <div className="space-y-3 mb-8">
                      {prescription.drugs?.length ? (
                        prescription.drugs.map((drug, i) => (
                          <div
                            key={i}
                            className="border border-[#b2e4df] rounded-xl p-3 bg-[#f0faf9]"
                          >
                            <div className="flex items-start gap-2 mb-2">
                              <Pill className="w-4 h-4 text-[#00a896] mt-0.5" />
                              <div className="flex-1">
                                <p className="font-semibold text-sm text-[#004d45]">
                                  {drug.medicine}
                                </p>
                                <p className="text-xs text-[#007a6e] mt-1">
                                  <span className="font-medium">Purpose:</span>{" "}
                                  {drug.purpose}
                                </p>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                  <div>
                                    <p className="text-xs text-gray-400">
                                      Dosage
                                    </p>
                                    <p className="text-sm text-[#004d45]">
                                      {drug.dosage} {drug.unit}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-400">
                                      Frequency
                                    </p>
                                    <p className="text-sm text-[#004d45]">
                                      {drug.frequency}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-gray-400 italic py-4">
                          No prescribed medications
                        </p>
                      )}
                    </div>
                  ) : (
                    <table className="w-full border-collapse text-[11px] md:text-[12px] mb-8 md:mb-12">
                      <thead>
                        <tr className="bg-[#e6f7f5] text-left text-[#007a6e]">
                          <th className="p-2">Medication Name</th>
                          <th className="p-2">Purpose</th>
                          <th className="p-2">Dosage</th>
                          <th className="p-2">Frequency</th>
                        </tr>
                      </thead>
                      <tbody>
                        {prescription.drugs?.length ? (
                          prescription.drugs.map((drug, i) => (
                            <tr
                              key={i}
                              className="border-b border-[#e6f7f5] hover:bg-[#f7fdfc] transition-colors"
                            >
                              <td className="p-2">{drug.medicine}</td>
                              <td className="p-2">{drug.purpose}</td>
                              <td className="p-2">
                                {drug.dosage} {drug.unit}
                              </td>
                              <td className="p-2">{drug.frequency}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={4}
                              className="p-3 text-center text-gray-400 italic"
                            >
                              No prescribed medications
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}

                  {/* PRESCRIBING PHYSICIAN */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-0 mb-10">
                    <div>
                      <p className="font-semibold text-xs md:text-sm text-[#00a896]">
                        Physician Name
                      </p>
                      <p className="text-xs md:text-sm text-[#004d45]">
                        Dr. {prescription.addedBy}
                      </p>
                      <div className="mt-4 md:mt-6">
                        <p className="font-semibold text-xs md:text-sm text-[#00a896]">
                          Prescription Date
                        </p>
                        <p className="text-xs md:text-sm text-[#004d45]">
                          {prescription.updatedAt}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 md:mt-0">
                      <p className="font-semibold text-xs md:text-sm text-[#00a896]">
                        Physician License / ID
                      </p>
                      <p className="text-xs md:text-sm text-[#004d45]">
                        {prescription.doctorId}
                      </p>
                      <div className="mt-6 md:mt-10 text-center">
                        <div className="border-t-2 border-[#00a896] w-full max-w-[200px] mx-auto"></div>
                        <p className="mt-2 font-semibold text-xs md:text-sm text-[#00a896]">
                          Physician Signature
                        </p>
                        <p className="text-xs md:text-sm text-[#004d45]">
                          Dr. {prescription.addedBy}
                        </p>
                        <p className="text-xs md:text-sm text-[#004d45]">
                          {prescription.field}
                        </p>
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}

          {/* FAMILY HISTORY */}
          <div className="px-4 md:px-10">
            <SectionHeader label="Family History" />
            <table className="w-full border-collapse text-[11px] md:text-[12px] mb-8 md:mb-12">
              <thead>
                <tr className="bg-[#e6f7f5] text-left text-[#007a6e]">
                  <th className="p-2">Relation</th>
                  <th className="p-2">Age</th>
                  <th className="p-2">Condition</th>
                  <th className="p-2">Healthy</th>
                  <th className="p-2">Alive</th>
                </tr>
              </thead>
              <tbody>
                {(patient as any).familyHistory?.length ? (
                  (patient as any).familyHistory.map((fh: any, i: number) => (
                    <tr
                      key={i}
                      className="border-b border-[#e6f7f5] hover:bg-[#f7fdfc]"
                    >
                      <td className="p-2">{fh.relation || "-"}</td>
                      <td className="p-2">{fh.age || "-"}</td>
                      <td className="p-2">{fh.healthProblems || "-"}</td>
                      <td className="p-2">{fh.goodHealth ? "Yes" : "No"}</td>
                      <td className="p-2">{fh.isAlive ? "Yes" : "No"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-3 text-center text-gray-400 italic"
                    >
                      No family history recorded
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* FOOTER */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-0 px-4 md:px-10 mt-10 md:mt-20 pb-10 md:pb-20">
            <div>
              <p className="font-semibold text-xs md:text-sm text-[#00a896]">
                Attending Physician
              </p>
              <p className="text-xs md:text-sm text-[#004d45]">
                Dr. {user?.firstName} {user?.lastName}
              </p>
              <div className="mt-4 md:mt-6">
                <p className="font-semibold text-xs md:text-sm text-[#00a896]">
                  Date Generated
                </p>
                <p className="text-xs md:text-sm text-[#004d45]">
                  {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="text-center mt-4 md:mt-0">
              <p className="font-semibold text-xs md:text-sm text-[#00a896]">
                Authorized Signature
              </p>
              <div className="border-t-2 border-[#00a896] w-full max-w-[200px] mx-auto mt-6 md:mt-10"></div>
              <p className="mt-2 text-xs md:text-sm text-[#004d45]">
                Dr. {user?.firstName} {user?.lastName}
              </p>
            </div>
          </div>

          {/* Bottom accent bar */}
          <div className="flex w-full h-1.5">
            <div className="w-1/2 bg-[#00a896]"></div>
            <div className="w-1/2 bg-[#ffd166]"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="bg-[#00a896] text-white font-bold px-2 md:px-3 py-1.5 mb-3 md:mb-4 text-xs md:text-sm rounded-sm tracking-wide uppercase">
      {label}
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | number }) {
  return (
    <div>
      <p className="font-semibold text-xs md:text-sm text-[#00a896]">{label}</p>
      <p className="text-xs md:text-sm break-words text-[#004d45]">
        {value || "-"}
      </p>
    </div>
  );
}
