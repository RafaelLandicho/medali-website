"use client";

/**
 * MockDataSeeder.jsx
 *
 * Drop this file anywhere in your project (e.g. src/components/MockDataSeeder.jsx).
 * Import and render it on any route (or wrap it behind an admin-only check).
 *
 * Usage:
 *   import { MockDataSeeder } from "@/components/MockDataSeeder";
 *   // then in JSX:
 *   <MockDataSeeder />
 *
 * It reads from your existing firebaseConfig and pushes 100 patients
 * (each with 1-3 consultation records, some with prescriptions) to:
 *   - /patients/{id}
 *   - /patients/{id}/records/{recordId}
 *   - /patients/{id}/records/{recordId}/prescription  (optional)
 *   - /logs/{logId}
 */

import * as React from "react";
import { db } from "@/firebaseConfig";
import { ref, push, set, get } from "firebase/database";

// ─── Seed data pools ──────────────────────────────────────────────────────────

const MALE_FIRST = [
  "Juan",
  "Carlo",
  "Miguel",
  "Jose",
  "Ramon",
  "Eduardo",
  "Roberto",
  "Antonio",
  "Fernando",
  "Ricardo",
  "Manuel",
  "Francisco",
  "Andres",
  "Rodrigo",
  "Ernesto",
  "Alejandro",
  "Danilo",
  "Renato",
  "Alfredo",
  "Bernardo",
  "Cesar",
  "Diego",
  "Emilio",
  "Felix",
  "Gabriel",
  "Hector",
  "Ignacio",
  "Joselito",
  "Kevin",
  "Leonardo",
  "Rafael",
  "Augusto",
  "Benjamin",
  "Carlos",
  "Domingo",
  "Esteban",
  "Felipe",
  "Gerardo",
  "Hugo",
  "Ismael",
  "Joaquin",
  "Lorenzo",
  "Martin",
  "Nicolas",
  "Oscar",
  "Pedro",
  "Quintin",
  "Rogelio",
  "Salvador",
  "Tomas",
];
const FEMALE_FIRST = [
  "Maria",
  "Ana",
  "Rosa",
  "Luz",
  "Carmen",
  "Gloria",
  "Elena",
  "Isabel",
  "Teresa",
  "Cecilia",
  "Lourdes",
  "Maricel",
  "Rowena",
  "Cristina",
  "Aileen",
  "Kathleen",
  "Jennifer",
  "Marites",
  "Rosario",
  "Florinda",
  "Natividad",
  "Paz",
  "Salvacion",
  "Dalisay",
  "Hazel",
  "Jasmine",
  "Kristine",
  "Lovely",
  "Michelle",
  "Noreen",
  "Olivia",
  "Patricia",
  "Queenie",
  "Ruth",
  "Soledad",
  "Trinidad",
  "Ursula",
  "Valentina",
  "Wendy",
  "Xenia",
  "Yolanda",
  "Zenaida",
  "Adelina",
  "Belinda",
  "Corazon",
  "Dolores",
  "Esperanza",
  "Filomena",
  "Graciela",
  "Herminia",
];
const LAST_NAMES = [
  "Santos",
  "Reyes",
  "Cruz",
  "Garcia",
  "Mendoza",
  "Torres",
  "Flores",
  "Bautista",
  "Aquino",
  "Ramos",
  "Villanueva",
  "Castillo",
  "Gonzales",
  "Manalo",
  "De Leon",
  "Dela Cruz",
  "Pascual",
  "Magno",
  "Ocampo",
  "Rivera",
  "Soriano",
  "Hernandez",
  "Buenaventura",
  "Samson",
  "Guevara",
  "Lim",
  "Tan",
  "Sy",
  "Uy",
  "Palma",
  "Aguilar",
  "Balagtas",
  "Cabrera",
  "Dizon",
  "Espiritu",
  "Fernandez",
  "Gutierrez",
  "Herrera",
  "Ignacio",
  "Jacinto",
  "Kalaw",
  "Lazaro",
  "Mercado",
  "Navarro",
  "Ortiz",
  "Pineda",
  "Quisumbing",
  "Roxas",
  "Salazar",
  "Tolentino",
];
const CITIES = [
  "Caloocan",
  "Quezon City",
  "Manila",
  "Pasig",
  "Taguig",
  "Makati",
  "Las Piñas",
  "Parañaque",
  "Muntinlupa",
  "Marikina",
  "Valenzuela",
  "Antipolo",
  "Bacoor",
  "Imus",
  "Dasmariñas",
  "General Trias",
  "Biñan",
  "Santa Rosa",
  "Cabuyao",
  "Calamba",
  "San Pedro",
  "Laguna",
  "Batangas City",
  "Lipa",
  "Tanauan",
  "Sto. Tomas",
  "Malvar",
  "San Pablo",
  "Lucena",
  "Tayabas",
  "Sariaya",
  "Candelaria",
];
const PROVINCES = [
  "Metro Manila",
  "Metro Manila",
  "Metro Manila",
  "Metro Manila",
  "Metro Manila",
  "Cavite",
  "Cavite",
  "Cavite",
  "Cavite",
  "Laguna",
  "Laguna",
  "Laguna",
  "Laguna",
  "Laguna",
  "Rizal",
  "Rizal",
  "Rizal",
  "Bulacan",
  "Bulacan",
  "Pampanga",
  "Pampanga",
  "Batangas",
  "Batangas",
  "Batangas",
  "Batangas",
  "Quezon",
  "Quezon",
  "Quezon",
  "Quezon",
];
const STREETS = [
  "123 Rizal Ave",
  "456 Mabini St",
  "789 Bonifacio Blvd",
  "321 Aguinaldo Rd",
  "654 Quezon St",
  "987 Marcos Hwy",
  "147 Del Pilar St",
  "258 Luna Ave",
  "369 Burgos St",
  "741 Jacinto Ave",
  "852 Osmena Blvd",
  "963 Roxas Blvd",
  "111 Evangelista St",
  "222 Kalayaan Ave",
  "333 Tandang Sora Ave",
  "444 Commonwealth Ave",
  "555 Mindanao Ave",
  "666 Visayas Ave",
  "777 Aurora Blvd",
  "888 Katipunan Ave",
  "999 C5 Road",
  "101 Gil Puyat Ave",
  "202 Buendia Ave",
  "303 Ayala Ave",
  "404 BGC Ave",
  "505 Chino Roces Ave",
  "606 P. Ocampo St",
  "707 Vito Cruz St",
  "808 Taft Ave",
  "909 Pedro Gil St",
];

const DIAGNOSES = [
  { d: "Hypertension", s: "moderate" },
  { d: "Diabetes Mellitus Type 2", s: "moderate" },
  { d: "Upper Respiratory Tract Infection", s: "mild" },
  { d: "Community-Acquired Pneumonia", s: "severe" },
  { d: "Gastroenteritis", s: "mild" },
  { d: "Urinary Tract Infection", s: "mild" },
  { d: "Dengue Fever", s: "severe" },
  { d: "Typhoid Fever", s: "moderate" },
  { d: "Bronchial Asthma", s: "moderate" },
  { d: "Pulmonary Tuberculosis", s: "critical" },
  { d: "Acute Pharyngitis", s: "mild" },
  { d: "Hypertensive Heart Disease", s: "severe" },
  { d: "Chronic Kidney Disease Stage 3", s: "severe" },
  { d: "Peptic Ulcer Disease", s: "moderate" },
  { d: "Iron Deficiency Anemia", s: "mild" },
  { d: "Osteoarthritis", s: "mild" },
  { d: "Hyperthyroidism", s: "moderate" },
  { d: "Migraine", s: "mild" },
  { d: "Acute Appendicitis", s: "severe" },
  { d: "Chronic Obstructive Pulmonary Disease", s: "moderate" },
  { d: "Depression", s: "moderate" },
  { d: "Anxiety Disorder", s: "mild" },
  { d: "Insomnia", s: "mild" },
  { d: "Bipolar Disorder", s: "severe" },
  { d: "Schizophrenia", s: "critical" },
  { d: "Post-Traumatic Stress Disorder", s: "moderate" },
  { d: "Obsessive-Compulsive Disorder", s: "moderate" },
  { d: "Panic Disorder", s: "moderate" },
  { d: "Attention Deficit Hyperactivity Disorder", s: "mild" },
  { d: "Autism Spectrum Disorder", s: "moderate" },
];

const SYMPTOMS_POOL = [
  "fever, cough, body malaise",
  "headache, nausea, dizziness",
  "shortness of breath, chest tightness",
  "abdominal pain, vomiting, diarrhea",
  "dysuria, frequent urination, flank pain",
  "joint pain, swelling, morning stiffness",
  "productive cough, night sweats, weight loss",
  "palpitations, tremors, heat intolerance",
  "high-grade fever, rash, retro-orbital pain",
  "cough with whitish sputum, runny nose, sore throat",
  "epigastric pain, bloating, heartburn",
  "fatigue, pallor, easy fatigability",
  "polyuria, polydipsia, polyphagia",
  "elevated blood pressure, occipital headache",
  "wheezing, dyspnea on exertion",
  "persistent sadness, loss of interest, sleep disturbances",
  "excessive worry, restlessness, muscle tension",
  "difficulty falling asleep, early morning awakening",
  "mood swings, racing thoughts, impulsivity",
  "hallucinations, delusions, disorganized speech",
  "flashbacks, hypervigilance, avoidance",
  "repetitive behaviors, intrusive thoughts",
  "sudden intense fear, palpitations, shortness of breath",
  "inattention, hyperactivity, impulsivity",
  "social communication deficits, repetitive behaviors",
];

const DRUGS_POOL = [
  {
    medicine: "Amlodipine",
    unit: "Tablet",
    dosage: "5mg",
    purpose: "Hypertension",
    frequency: "1x daily",
  },
  {
    medicine: "Losartan",
    unit: "Tablet",
    dosage: "50mg",
    purpose: "Hypertension",
    frequency: "1x daily",
  },
  {
    medicine: "Metformin",
    unit: "Tablet",
    dosage: "500mg",
    purpose: "Diabetes control",
    frequency: "2x daily",
  },
  {
    medicine: "Atorvastatin",
    unit: "Tablet",
    dosage: "20mg",
    purpose: "Dyslipidemia",
    frequency: "1x daily at bedtime",
  },
  {
    medicine: "Paracetamol",
    unit: "Tablet",
    dosage: "500mg",
    purpose: "Fever / Pain relief",
    frequency: "Every 4-6 hours PRN",
  },
  {
    medicine: "Amoxicillin",
    unit: "Capsule",
    dosage: "500mg",
    purpose: "Bacterial infection",
    frequency: "3x daily",
  },
  {
    medicine: "Azithromycin",
    unit: "Tablet",
    dosage: "500mg",
    purpose: "Respiratory infection",
    frequency: "1x daily for 5 days",
  },
  {
    medicine: "Ciprofloxacin",
    unit: "Tablet",
    dosage: "500mg",
    purpose: "Urinary tract infection",
    frequency: "2x daily",
  },
  {
    medicine: "Metronidazole",
    unit: "Tablet",
    dosage: "500mg",
    purpose: "GI infection",
    frequency: "3x daily",
  },
  {
    medicine: "Salbutamol",
    unit: "Inhaler",
    dosage: "100mcg",
    purpose: "Bronchospasm relief",
    frequency: "Every 6 hours PRN",
  },
  {
    medicine: "Isoniazid",
    unit: "Tablet",
    dosage: "300mg",
    purpose: "TB treatment",
    frequency: "1x daily",
  },
  {
    medicine: "Rifampicin",
    unit: "Capsule",
    dosage: "600mg",
    purpose: "TB treatment",
    frequency: "1x daily",
  },
  {
    medicine: "Omeprazole",
    unit: "Capsule",
    dosage: "20mg",
    purpose: "Acid reduction",
    frequency: "1x daily before meals",
  },
  {
    medicine: "Furosemide",
    unit: "Tablet",
    dosage: "40mg",
    purpose: "Diuresis",
    frequency: "1x daily AM",
  },
  {
    medicine: "Ferrous Sulfate",
    unit: "Tablet",
    dosage: "325mg",
    purpose: "Iron supplementation",
    frequency: "1x daily",
  },
  {
    medicine: "Cetirizine",
    unit: "Tablet",
    dosage: "10mg",
    purpose: "Antihistamine",
    frequency: "1x daily at bedtime",
  },
  {
    medicine: "Ibuprofen",
    unit: "Tablet",
    dosage: "400mg",
    purpose: "Pain / Inflammation",
    frequency: "Every 8 hours PRN",
  },
  {
    medicine: "Carvedilol",
    unit: "Tablet",
    dosage: "12.5mg",
    purpose: "Heart failure / Hypertension",
    frequency: "2x daily",
  },
  {
    medicine: "Insulin Glargine",
    unit: "IU",
    dosage: "10 units",
    purpose: "Glycemic control",
    frequency: "1x daily at bedtime",
  },
  {
    medicine: "Propranolol",
    unit: "Tablet",
    dosage: "40mg",
    purpose: "Tachycardia / Hypertension",
    frequency: "2x daily",
  },
  {
    medicine: "Doxycycline",
    unit: "Capsule",
    dosage: "100mg",
    purpose: "Bacterial infection",
    frequency: "2x daily",
  },
  {
    medicine: "Cefuroxime",
    unit: "Tablet",
    dosage: "500mg",
    purpose: "Respiratory infection",
    frequency: "2x daily",
  },
  {
    medicine: "Prednisone",
    unit: "Tablet",
    dosage: "20mg",
    purpose: "Anti-inflammatory",
    frequency: "1x daily",
  },
  {
    medicine: "Sertraline",
    unit: "Tablet",
    dosage: "50mg",
    purpose: "Depression / Anxiety",
    frequency: "1x daily",
  },
  {
    medicine: "Escitalopram",
    unit: "Tablet",
    dosage: "10mg",
    purpose: "Anxiety / Depression",
    frequency: "1x daily",
  },
  {
    medicine: "Quetiapine",
    unit: "Tablet",
    dosage: "25mg",
    purpose: "Mood stabilization",
    frequency: "At bedtime",
  },
  {
    medicine: "Olanzapine",
    unit: "Tablet",
    dosage: "5mg",
    purpose: "Antipsychotic",
    frequency: "1x daily",
  },
  {
    medicine: "Risperidone",
    unit: "Tablet",
    dosage: "2mg",
    purpose: "Antipsychotic",
    frequency: "2x daily",
  },
  {
    medicine: "Clonazepam",
    unit: "Tablet",
    dosage: "0.5mg",
    purpose: "Anxiety / Seizures",
    frequency: "As needed",
  },
  {
    medicine: "Zolpidem",
    unit: "Tablet",
    dosage: "10mg",
    purpose: "Insomnia",
    frequency: "At bedtime PRN",
  },
];

// ── New doctor account — all seeded data will be owned by this user ──────────
const REAL_DOCTOR = {
  uid: "uCnKTn5Yuof3nm8BxruiHS7zCnD3",
  name: "Doctor Bees",
  displayName: "Dr. Bees",
  field: "Psychiatry",
  medicalId: "123567789",
  email: "dbees@gmail.com",
};

// Secondary doctors used only for prescription "addedBy" display variety
const DOCTORS = [
  {
    name: REAL_DOCTOR.displayName,
    field: REAL_DOCTOR.field,
    id: REAL_DOCTOR.medicalId,
  },
  { name: "Dr. Maria Santos", field: "Internal Medicine", id: "MD-9001" },
  {
    name: REAL_DOCTOR.displayName,
    field: REAL_DOCTOR.field,
    id: REAL_DOCTOR.medicalId,
  },
  { name: "Dr. Juan Reyes", field: "Cardiology", id: "MD-9003" },
  {
    name: REAL_DOCTOR.displayName,
    field: REAL_DOCTOR.field,
    id: REAL_DOCTOR.medicalId,
  },
  { name: "Dr. Ana Cruz", field: "Pediatrics", id: "MD-9004" },
];

const EXAMINATIONS = [
  "BP 130/80 mmHg, RR 18 cpm, HR 82 bpm, Temp 37.2°C. Chest: clear breath sounds bilaterally. Heart: regular rate and rhythm.",
  "BP 150/90 mmHg, Temp 38.5°C. Lungs: crackles on right lower lobe. Abdomen: soft, non-tender.",
  "BP 120/70 mmHg, Temp 36.8°C. Throat: hyperemic tonsils. Lungs: clear. Abdomen: non-tender.",
  "BP 140/85 mmHg, HR 90 bpm. Abdomen: tenderness at McBurney's point. Bowel sounds: decreased.",
  "BP 110/70 mmHg, Temp 38.2°C. Skin: petechiae noted on trunk and extremities.",
  "BP 125/78 mmHg, HR 76 bpm. Mental status: anxious, restless. Speech: pressured.",
  "BP 145/88 mmHg, HR 92 bpm. Mental status: depressed mood, flat affect. Speech: slow, monotone.",
  "BP 118/72 mmHg, HR 68 bpm. Mental status: euthymic, cooperative. Speech: normal rate and tone.",
  "BP 155/95 mmHg, HR 88 bpm. Mental status: irritable, labile. Speech: rapid, tangential.",
  "BP 130/82 mmHg, HR 70 bpm. Mental status: guarded, suspicious. Speech: normal.",
];

const RECOMMENDATIONS = [
  "Adequate rest, increase oral fluid intake, avoid strenuous activities for 1 week. Follow-up in 7 days.",
  "Low-sodium diet, daily BP monitoring at home. Lifestyle modification advised. Follow-up in 2 weeks.",
  "Strict diabetic diet, regular exercise 30 min/day. Monitor blood sugar daily. Return if symptomatic.",
  "Complete medication course. Avoid smoking and alcohol. Follow-up CBC and chest X-ray after 2 weeks.",
  "Bed rest, increased fluid intake 2-3L/day, soft diet. Seek emergency care if bleeding signs appear.",
  "Continue medication as prescribed. Schedule psychotherapy sessions weekly. Follow-up in 4 weeks.",
  "Maintain regular sleep schedule. Avoid caffeine and alcohol. Consider mindfulness exercises. Follow-up in 2 weeks.",
  "Medication adherence is crucial. Family support recommended. Follow-up in 1 month.",
  "Reduce stressors, practice relaxation techniques. Regular exercise and balanced diet. Follow-up in 3 weeks.",
  "Structured daily routine. Avoid triggers. Continue with cognitive behavioral therapy. Follow-up in 4 weeks.",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const bool = (prob = 0.3) => Math.random() < prob;

/** Returns a timestamp for a random date within the given year, spread month by month */
function dateInYear(yearOffset = 0, monthIndex = null) {
  const now = new Date();
  const year = now.getFullYear() - yearOffset;
  const month = monthIndex !== null ? monthIndex : rand(0, 11);
  const day = rand(1, 28);
  return new Date(year, month, day, rand(7, 17), rand(0, 59)).getTime();
}

/** Format date for display (birthdate style) */
function fmtBirthdate(ts) {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "long",
    day: "2-digit",
    year: "numeric",
  });
}

// ─── Mock data generator ──────────────────────────────────────────────────────

function generatePatients(count = 100) {
  const patients = [];
  for (let i = 0; i < count; i++) {
    // Gender: random with slight male majority (52% male)
    const gender = Math.random() < 0.52 ? "MALE" : "FEMALE";
    const firstName = gender === "MALE" ? pick(MALE_FIRST) : pick(FEMALE_FIRST);
    const lastName = pick(LAST_NAMES);

    // Age: wider range (10–79)
    const age = rand(10, 79);

    // Height constant per gender
    const heightCm = gender === "MALE" ? 175 : 162;

    // Weight range based on gender
    const weightKg = gender === "MALE" ? rand(55, 95) : rand(45, 85);

    const city = pick(CITIES);
    const province = pick(PROVINCES);
    const street = pick(STREETS);
    const phone = `09${rand(10, 99)}${rand(1000000, 9999999)}`;
    const doctor = pick(DOCTORS);

    // Birthdate based on age
    const birthYear = new Date().getFullYear() - age;
    const birthdateTs = new Date(birthYear, rand(0, 11), rand(1, 28)).getTime();

    // Health flags – some patients have flags
    const drugAllergy = bool(0.2);
    const foodAllergy = bool(0.15);
    const isTBPositive = bool(0.1);
    const medicalCare = bool(0.4);
    const hasClinician = bool(0.1);
    const diet = bool(0.15);

    // Family history
    const relations = [
      "Father",
      "Mother",
      "Sibling",
      "Grandfather",
      "Grandmother",
      "Uncle",
      "Aunt",
      "Cousin",
      "Child",
      "Spouse",
    ];
    const famHistCount = rand(1, 3);
    const familyHistory = Array.from({ length: famHistCount }, () => ({
      relation: pick(relations),
      age: String(rand(45, 85)),
      healthProblems: pick([
        "Hypertension",
        "Diabetes",
        "Heart disease",
        "Cancer",
        "Stroke",
        "Asthma",
        "Kidney disease",
        "Depression",
        "Anxiety",
        "Dementia",
        "Parkinson's",
        "COPD",
        "Arthritis",
        "Thyroid disorder",
      ]),
      goodHealth: bool(0.5),
      isAlive: bool(0.7),
    }));

    // Records — 1 to 3 per patient, spread across different months
    const recordCount = rand(1, 3);
    const monthsUsed = new Set();
    while (monthsUsed.size < recordCount) monthsUsed.add(rand(0, 11));
    const months = [...monthsUsed].sort((a, b) => a - b);

    const records = months.map((monthIdx) => {
      const createdAt = dateInYear(0, monthIdx);
      const diag1 = pick(DIAGNOSES);
      const diag2 = bool(0.4) ? pick(DIAGNOSES) : null;
      const diagnosis = [
        {
          diagnosis: diag1.d,
          severity: diag1.s,
          notes: bool(0.5) ? "Ongoing management" : "",
        },
        ...(diag2
          ? [{ diagnosis: diag2.d, severity: diag2.s, notes: "" }]
          : []),
      ];

      const hasPrescription = bool(0.6); // 60% chance of prescription

      // Pick 1-3 drugs
      const drugCount = rand(1, 3);
      const selectedDrugs = [];
      const usedIdx = new Set();
      while (selectedDrugs.length < drugCount) {
        const idx = rand(0, DRUGS_POOL.length - 1);
        if (!usedIdx.has(idx)) {
          usedIdx.add(idx);
          selectedDrugs.push({ ...DRUGS_POOL[idx] });
        }
      }

      const doc = pick(DOCTORS);
      const prescription = hasPrescription
        ? {
            patientFirstName: firstName,
            patientLastName: lastName,
            patientAddress: `${street}, ${city}`,
            patientAge: age,
            patientGender: gender,
            diagnosis,
            examination: pick(EXAMINATIONS),
            recommendation: pick(RECOMMENDATIONS),
            drugs: selectedDrugs,
            addedBy: doc.name,
            field: doc.field,
            doctorId: doc.id,
            createdBy: REAL_DOCTOR.uid,
            updatedAt: new Date(createdAt).toLocaleString(),
          }
        : null;

      return {
        diagnosis,
        symptoms: pick(SYMPTOMS_POOL),
        bloodPressure: `${rand(100, 160)}/${rand(60, 100)}`,
        heartRate: String(rand(60, 110)),
        respiratoryRate: String(rand(14, 22)),
        temperature: (rand(365, 392) / 10).toFixed(1),
        oxygenSaturation: String(rand(94, 100)),
        weight: String(weightKg),
        height: String(heightCm),
        medicalCare,
        drugAllergy,
        foodAllergy,
        isTBPositive,
        hasClinician,
        diet,
        familyHistory,
        addedBy: REAL_DOCTOR.displayName,
        approvedBy: REAL_DOCTOR.name,
        createdBy: REAL_DOCTOR.uid,
        createdAt,
        prescription,
      };
    });

    patients.push({
      firstName,
      lastName,
      gender,
      age,
      birthdate: fmtBirthdate(birthdateTs),
      address: `${street}, ${city}, ${province}`,
      address1: street,
      address2: "",
      city,
      province,
      telephone: phone,
      addedBy: REAL_DOCTOR.displayName,
      createdBy: REAL_DOCTOR.uid,
      medicalCare,
      drugAllergy,
      foodAllergy,
      isTBPositive,
      hasClinician,
      diet,
      familyHistory,
      records,
      height: heightCm,
      weight: weightKg,
    });
  }
  return patients;
}

// ─── Seeder component ─────────────────────────────────────────────────────────

export function MockDataSeeder() {
  const [status, setStatus] = React.useState("idle");
  const [progress, setProgress] = React.useState({ current: 0, total: 0 });
  const [log, setLog] = React.useState([]);
  const [summary, setSummary] = React.useState(null);

  const appendLog = (msg) => setLog((prev) => [...prev, msg]);

  const handleSeed = async () => {
    if (status === "running") return;
    setStatus("running");
    setLog([]);
    setSummary(null);
    setProgress({ current: 0, total: 0 });

    try {
      // Count existing records globally for recordNumber sequencing
      const allPatientsSnap = await get(ref(db, "patients"));
      let totalExistingRecords = 0;
      if (allPatientsSnap.exists()) {
        allPatientsSnap.forEach((snap) => {
          const recs = snap.child("records").val();
          if (recs) totalExistingRecords += Object.keys(recs).length;
        });
      }

      const mockPatients = generatePatients(100);
      setProgress({ current: 0, total: mockPatients.length });
      appendLog(
        `Generated ${mockPatients.length} mock patients. Starting push…`,
      );

      let patientsAdded = 0;
      let recordsAdded = 0;
      let prescriptionsAdded = 0;
      let recordNumberCounter = totalExistingRecords;

      for (let i = 0; i < mockPatients.length; i++) {
        const p = mockPatients[i];
        const { records: patientRecords, ...patientData } = p;

        // Push patient
        const patientRef = push(ref(db, "patients"));
        const patientId = patientRef.key;
        await set(patientRef, {
          ...patientData,
          id: patientId,
        });
        patientsAdded++;

        // Push records for this patient
        for (const record of patientRecords) {
          const { prescription: prescData, ...recordData } = record;
          recordNumberCounter++;

          const recordRef = push(ref(db, `patients/${patientId}/records`));
          const recordId = recordRef.key;

          await set(recordRef, {
            ...recordData,
            recordId,
            recordNumber: recordNumberCounter,
            patientId,
          });
          recordsAdded++;

          // Push prescription if present
          if (prescData) {
            await set(
              ref(db, `patients/${patientId}/records/${recordId}/prescription`),
              prescData,
            );
            prescriptionsAdded++;
          }
        }

        // Log every 10 patients
        if ((i + 1) % 10 === 0) {
          appendLog(`✓ Pushed ${i + 1} / ${mockPatients.length} patients…`);
        }

        setProgress({ current: i + 1, total: mockPatients.length });
      }

      // Write a single seeder log entry
      const logsRef = push(ref(db, "logs"));
      await set(logsRef, {
        medicalRecordLog: `Mock data seeded by ${REAL_DOCTOR.displayName}: ${patientsAdded} patients, ${recordsAdded} records, ${prescriptionsAdded} prescriptions.`,
        logTime: new Date().toLocaleString(),
      });

      setSummary({ patientsAdded, recordsAdded, prescriptionsAdded });
      appendLog(
        `🎉 Done! ${patientsAdded} patients, ${recordsAdded} records, ${prescriptionsAdded} prescriptions added.`,
      );
      setStatus("done");
    } catch (err) {
      console.error(err);
      appendLog(`❌ Error: ${err.message}`);
      setStatus("error");
    }
  };

  const pct = progress.total
    ? Math.round((progress.current / progress.total) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center p-6">
      <div className="w-full max-w-xl bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-[#1a1a2e] px-6 py-5">
          <h1 className="text-xl font-bold text-white">Database Seeder</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Push 100 mock patients with records to Firebase
          </p>
          <p className="text-xs text-[#00a896] mt-1 font-mono">
            Owner: {REAL_DOCTOR.displayName} · {REAL_DOCTOR.email} · Psychiatry
          </p>
        </div>

        <div className="p-6 space-y-5">
          {/* Info grid */}
          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            {[
              { label: "Patients", value: "100" },
              { label: "Records", value: "100–300" },
              { label: "Prescriptions", value: "~60%" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-lg bg-[#00a896]/10 border border-[#00a896]/20 py-3"
              >
                <p className="text-xl font-bold text-[#00a896]">{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* What gets generated */}
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-1.5 text-xs text-gray-600">
            <p className="font-semibold text-gray-700 mb-2">
              What gets seeded:
            </p>
            {[
              "✓ ~52% male & ~48% female patients (Filipino names)",
              "✓ Ages 10–79 (broader range)",
              "✓ Height is constant per gender: male 175 cm, female 162 cm",
              "✓ Weight is gender‑specific (male 55–95 kg, female 45–85 kg)",
              "✓ Dates spread across all 12 months of the current year",
              "✓ 1–3 consultation records per patient (different months)",
              "✓ 30+ different diagnoses (including psychiatric conditions)",
              "✓ 30+ different drugs (including psychiatric medications)",
              "✓ 60% of records include a prescription",
              "✓ Vital signs, symptoms, family history per record",
              "✓ Health flags (TB, drug/food allergies) on some patients",
              `✓ All records owned by: ${REAL_DOCTOR.displayName} (Psychiatry)`,
            ].map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>

          {/* Progress bar */}
          {status === "running" && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Pushing data…</span>
                <span>
                  {progress.current} / {progress.total} patients
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-[#00a896] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}

          {/* Summary card */}
          {summary && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 grid grid-cols-3 gap-2 text-center text-sm">
              {[
                { label: "Patients added", value: summary.patientsAdded },
                { label: "Records added", value: summary.recordsAdded },
                { label: "Prescriptions", value: summary.prescriptionsAdded },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-2xl font-bold text-green-700">{s.value}</p>
                  <p className="text-xs text-green-600 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Seed button */}
          <button
            onClick={handleSeed}
            disabled={status === "running"}
            className="w-full py-3 rounded-xl font-semibold text-white text-base transition-all
              disabled:opacity-50 disabled:cursor-not-allowed
              bg-[#00a896] hover:bg-[#028090] shadow-sm"
          >
            {status === "running"
              ? `Seeding… ${pct}%`
              : status === "done"
                ? "✓ Seed Complete — Run Again?"
                : status === "error"
                  ? "Retry Seed"
                  : "🚀 Seed Database (100 Patients)"}
          </button>

          {status === "done" && (
            <p className="text-center text-xs text-gray-400">
              You can run the seeder multiple times — it always appends new
              data.
            </p>
          )}

          {/* Log output */}
          {log.length > 0 && (
            <div className="rounded-xl bg-[#1a1a2e] p-4 max-h-48 overflow-y-auto space-y-1">
              {log.map((line, i) => (
                <p key={i} className="text-xs font-mono text-gray-300">
                  {line}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MockDataSeeder;
