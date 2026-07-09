"use client";

/**
 * MockDataSeeder.jsx
 *
 * Drop anywhere in your project and render it on an admin-only route.
 *
 * Usage:
 *   import { MockDataSeeder } from "@/components/MockDataSeeder";
 *   <MockDataSeeder />
 *
 * Pushes 100 patients (each with 1–3 records, ~60% with prescriptions) to:
 *   /patients/{id}
 *   /patients/{id}/records/{recordId}
 *   /patients/{id}/records/{recordId}/prescription  (optional)
 *   /logs/{logId}
 *
 * All data is owned by Dr. Lance Riddick (uid: 5JKyAa2q7ifqpTXv41jCSCAz8M22).
 */

import * as React from "react";
import { db } from "@/firebaseConfig";
import { ref, push, set, get } from "firebase/database";

// ─── The doctor who owns all seeded data ─────────────────────────────────────

const DOCTOR = {
  uid: "5JKyAa2q7ifqpTXv41jCSCAz8M22",
  firstName: "Lance",
  lastName: "Riddick",
  displayName: "Dr. Lance Riddick",
  username: "LanceRiddick",
  field: "Internal Medicine",
  medicalId: "754239655",
  email: "lr@gmail.com",
  linkId: "",
};

// ─── Seed data pools ──────────────────────────────────────────────────────────

const MALE_FIRST = [
  "Arturo",
  "Bernardo",
  "Clemente",
  "Dominic",
  "Efren",
  "Florencio",
  "Gregorio",
  "Herminio",
  "Ignacio",
  "Jacinto",
  "Kristoffer",
  "Leandro",
  "Marcelo",
  "Nestor",
  "Oswaldo",
  "Patricio",
  "Quirino",
  "Ruperto",
  "Silverio",
  "Teodoro",
  "Ulysses",
  "Valeriano",
  "Wilfredo",
  "Ximeno",
  "Ysmael",
  "Zacarias",
  "Amado",
  "Bienvenido",
  "Conrado",
  "Diosdado",
];
const FEMALE_FIRST = [
  "Adoracion",
  "Benita",
  "Caridad",
  "Divina",
  "Eulalia",
  "Fortunata",
  "Gertrudes",
  "Herminia",
  "Imelda",
  "Jovita",
  "Katrina",
  "Leonora",
  "Mildred",
  "Nilda",
  "Ofelia",
  "Purificacion",
  "Quirina",
  "Resurreccion",
  "Saturnina",
  "Teresita",
  "Urduja",
  "Visitacion",
  "Wilma",
  "Xandra",
  "Ysabel",
  "Zosima",
  "Almira",
  "Belinda",
  "Celestina",
  "Dolores",
];
const LAST_NAMES = [
  "Abaya",
  "Baluyot",
  "Cariño",
  "Delos Reyes",
  "Espiritu",
  "Fajardo",
  "Galvez",
  "Halili",
  "Ilagan",
  "Javier",
  "Katindig",
  "Lacuesta",
  "Mallari",
  "Natividad",
  "Obillos",
  "Pagatpatan",
  "Quiambao",
  "Regalado",
  "Silvestre",
  "Tiongco",
  "Umali",
  "Vargas",
  "Wenceslao",
  "Xavier",
  "Yumol",
  "Zablan",
  "Almazan",
  "Buenaobra",
  "Cayabyab",
  "Dimaculangan",
];
const CITIES = [
  "Baguio",
  "Dagupan",
  "San Fernando",
  "Angeles",
  "Olongapo",
  "Cabanatuan",
  "Malolos",
  "Meycauayan",
  "San Jose del Monte",
  "Naga",
  "Legazpi",
  "Sorsogon",
  "Iriga",
  "Tabaco",
  "Masbate",
  "Roxas City",
  "Iloilo City",
  "Bacolod",
  "Dumaguete",
  "Tacloban",
  "Ormoc",
  "Calbayog",
  "Butuan",
  "Cagayan de Oro",
  "Iligan",
  "Zamboanga City",
  "General Santos",
  "Davao City",
  "Koronadal",
  "Cotabato",
];
const PROVINCES = [
  "Benguet",
  "Pangasinan",
  "Pampanga",
  "Pampanga",
  "Zambales",
  "Nueva Ecija",
  "Bulacan",
  "Bulacan",
  "Bulacan",
  "Camarines Sur",
  "Albay",
  "Sorsogon",
  "Camarines Sur",
  "Albay",
  "Masbate",
  "Capiz",
  "Iloilo",
  "Negros Occidental",
  "Negros Oriental",
  "Leyte",
  "Leyte",
  "Samar",
  "Agusan del Norte",
  "Misamis Oriental",
  "Lanao del Norte",
  "Zamboanga del Sur",
  "South Cotabato",
  "Davao del Sur",
  "South Cotabato",
  "Maguindanao",
];
const STREETS = [
  "12 Magsaysay Ave",
  "34 Session Rd",
  "56 Abanao St",
  "78 Harrison Rd",
  "90 Kennon Rd",
  "11 Gov. Pack Rd",
  "22 Legarda Rd",
  "33 Naguilian Rd",
  "44 Marcos Hwy",
  "55 Military Cut-off",
  "66 Leonard Wood Rd",
  "77 Bokawkan Rd",
  "88 Assumption Rd",
  "99 Outlook Drive",
  "100 South Drive",
  "200 Upper Session",
  "300 Mines View Rd",
  "400 Dominican Hill Rd",
  "500 Camp Allen Rd",
  "600 Loakan Rd",
];

// Internal Medicine diagnoses + general
const DIAGNOSES = [
  { d: "Hypertensive Urgency", s: "severe" },
  { d: "Hypertensive Emergency", s: "critical" },
  { d: "Type 2 Diabetes Mellitus — Uncontrolled", s: "severe" },
  { d: "Type 2 Diabetes Mellitus — Controlled", s: "moderate" },
  { d: "Diabetic Ketoacidosis", s: "critical" },
  { d: "Chronic Kidney Disease Stage 3", s: "moderate" },
  { d: "Chronic Kidney Disease Stage 4", s: "severe" },
  { d: "Congestive Heart Failure", s: "severe" },
  { d: "Coronary Artery Disease", s: "severe" },
  { d: "Atrial Fibrillation", s: "moderate" },
  { d: "Deep Vein Thrombosis", s: "moderate" },
  { d: "Pulmonary Embolism", s: "critical" },
  { d: "Community-Acquired Pneumonia", s: "moderate" },
  { d: "Pulmonary Tuberculosis", s: "severe" },
  { d: "Chronic Obstructive Pulmonary Disease", s: "moderate" },
  { d: "Bronchial Asthma — Acute Exacerbation", s: "moderate" },
  { d: "Peptic Ulcer Disease", s: "moderate" },
  { d: "Liver Cirrhosis — Child-Pugh B", s: "severe" },
  { d: "Hepatitis B", s: "moderate" },
  { d: "Hyperlipidemia", s: "mild" },
  { d: "Gout — Acute Attack", s: "moderate" },
  { d: "Rheumatoid Arthritis", s: "moderate" },
  { d: "Systemic Lupus Erythematosus", s: "severe" },
  { d: "Iron Deficiency Anemia", s: "mild" },
  { d: "Hypothyroidism", s: "mild" },
  { d: "Hyperthyroidism", s: "moderate" },
  { d: "Upper Respiratory Tract Infection", s: "mild" },
  { d: "Urinary Tract Infection", s: "mild" },
  { d: "Gastroenteritis", s: "mild" },
  { d: "Dengue Fever", s: "severe" },
];

const SYMPTOMS_POOL = [
  "severe headache, blurred vision, chest tightness, elevated BP",
  "polyuria, polydipsia, polyphagia, unexplained weight loss",
  "progressive leg swelling, orthopnea, paroxysmal nocturnal dyspnea",
  "productive cough, fever, chills, pleuritic chest pain",
  "hemoptysis, night sweats, weight loss, chronic cough",
  "nausea, vomiting, abdominal pain, decreased urine output",
  "palpitations, dizziness, irregular heartbeat, fatigue",
  "sudden onset unilateral leg swelling, warmth, redness",
  "epigastric pain, hematemesis, melena, dizziness",
  "jaundice, abdominal distension, easy bruising, fatigue",
  "joint pain, swelling, morning stiffness lasting >1 hour",
  "butterfly rash, joint pain, photosensitivity, oral ulcers",
  "fatigue, pallor, exertional dyspnea, easy fatigability",
  "weight gain, cold intolerance, constipation, dry skin",
  "heat intolerance, palpitations, weight loss, tremors",
  "wheeze, chest tightness, shortness of breath, dry cough",
  "fever, cough, colds, sore throat, body malaise",
  "dysuria, frequency, urgency, suprapubic pain",
  "abdominal pain, vomiting, loose watery stools, fever",
  "high fever, retro-orbital pain, myalgia, petechiae",
];

const DRUGS_POOL = [
  {
    medicine: "Amlodipine",
    unit: "Tablet",
    dosage: "10mg",
    purpose: "Hypertension",
    frequency: "1x daily",
  },
  {
    medicine: "Losartan",
    unit: "Tablet",
    dosage: "100mg",
    purpose: "Hypertension / CKD",
    frequency: "1x daily",
  },
  {
    medicine: "Carvedilol",
    unit: "Tablet",
    dosage: "25mg",
    purpose: "Heart failure / Hypertension",
    frequency: "2x daily with meals",
  },
  {
    medicine: "Furosemide",
    unit: "Tablet",
    dosage: "40mg",
    purpose: "Diuresis / Edema",
    frequency: "1x daily in the morning",
  },
  {
    medicine: "Spironolactone",
    unit: "Tablet",
    dosage: "25mg",
    purpose: "Heart failure / Aldosteronism",
    frequency: "1x daily",
  },
  {
    medicine: "Metformin",
    unit: "Tablet",
    dosage: "1000mg",
    purpose: "Diabetes control",
    frequency: "2x daily with meals",
  },
  {
    medicine: "Glimepiride",
    unit: "Tablet",
    dosage: "2mg",
    purpose: "Diabetes control",
    frequency: "1x daily before breakfast",
  },
  {
    medicine: "Insulin Glargine",
    unit: "IU",
    dosage: "20 units",
    purpose: "Basal glycemic control",
    frequency: "1x daily at bedtime",
  },
  {
    medicine: "Insulin Aspart",
    unit: "IU",
    dosage: "6 units",
    purpose: "Mealtime glycemic control",
    frequency: "3x daily before meals",
  },
  {
    medicine: "Atorvastatin",
    unit: "Tablet",
    dosage: "40mg",
    purpose: "Dyslipidemia / CVD risk",
    frequency: "1x daily at bedtime",
  },
  {
    medicine: "Ezetimibe",
    unit: "Tablet",
    dosage: "10mg",
    purpose: "Adjunct lipid lowering",
    frequency: "1x daily",
  },
  {
    medicine: "Aspirin",
    unit: "Tablet",
    dosage: "80mg",
    purpose: "Antiplatelet / CVD prevention",
    frequency: "1x daily after breakfast",
  },
  {
    medicine: "Clopidogrel",
    unit: "Tablet",
    dosage: "75mg",
    purpose: "Antiplatelet",
    frequency: "1x daily",
  },
  {
    medicine: "Warfarin",
    unit: "Tablet",
    dosage: "5mg",
    purpose: "Anticoagulation",
    frequency: "1x daily, adjust per INR",
  },
  {
    medicine: "Rivaroxaban",
    unit: "Tablet",
    dosage: "20mg",
    purpose: "Anticoagulation (AF / DVT)",
    frequency: "1x daily with evening meal",
  },
  {
    medicine: "Allopurinol",
    unit: "Tablet",
    dosage: "300mg",
    purpose: "Gout prevention",
    frequency: "1x daily",
  },
  {
    medicine: "Colchicine",
    unit: "Tablet",
    dosage: "0.6mg",
    purpose: "Acute gout attack",
    frequency: "2x daily for 5 days",
  },
  {
    medicine: "Prednisone",
    unit: "Tablet",
    dosage: "30mg",
    purpose: "Anti-inflammatory / Immunosuppression",
    frequency: "1x daily, taper",
  },
  {
    medicine: "Hydroxychloroquine",
    unit: "Tablet",
    dosage: "200mg",
    purpose: "SLE / Rheumatoid arthritis",
    frequency: "2x daily with meals",
  },
  {
    medicine: "Methotrexate",
    unit: "Tablet",
    dosage: "7.5mg",
    purpose: "Rheumatoid arthritis / SLE",
    frequency: "1x weekly",
  },
  {
    medicine: "Omeprazole",
    unit: "Capsule",
    dosage: "40mg",
    purpose: "Acid suppression / PUD",
    frequency: "1x daily before breakfast",
  },
  {
    medicine: "Ferrous Sulfate",
    unit: "Tablet",
    dosage: "325mg",
    purpose: "Iron deficiency anemia",
    frequency: "1x daily between meals",
  },
  {
    medicine: "Levothyroxine",
    unit: "Tablet",
    dosage: "100mcg",
    purpose: "Hypothyroidism",
    frequency: "1x daily on empty stomach",
  },
  {
    medicine: "Propylthiouracil",
    unit: "Tablet",
    dosage: "100mg",
    purpose: "Hyperthyroidism",
    frequency: "3x daily",
  },
  {
    medicine: "Amoxicillin",
    unit: "Capsule",
    dosage: "500mg",
    purpose: "Bacterial infection",
    frequency: "3x daily for 7 days",
  },
  {
    medicine: "Azithromycin",
    unit: "Tablet",
    dosage: "500mg",
    purpose: "Atypical pneumonia",
    frequency: "1x daily for 5 days",
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
    frequency: "1x daily on empty stomach",
  },
  {
    medicine: "Paracetamol",
    unit: "Tablet",
    dosage: "500mg",
    purpose: "Fever / Pain relief",
    frequency: "Every 4–6 hours PRN",
  },
  {
    medicine: "Salbutamol",
    unit: "Inhaler",
    dosage: "100mcg",
    purpose: "Acute bronchospasm relief",
    frequency: "2 puffs every 4–6 hours PRN",
  },
];

const EXAMINATIONS = [
  "BP 175/110 mmHg, HR 94 bpm, RR 20 cpm, Temp 36.8°C. JVD present. S3 gallop noted. Bibasal crackles. Pitting edema 2+ bilateral.",
  "BP 162/98 mmHg, HR 88 bpm, Temp 37.0°C. FBS 14.2 mmol/L. No acute distress. Abdomen soft. Peripheral pulses intact.",
  "BP 130/82 mmHg, HR 78 bpm, SpO2 94% RA. Lungs: dullness on percussion right lower lobe. Bronchial breath sounds noted.",
  "BP 118/76 mmHg, HR 72 bpm, Temp 36.6°C. Alert and cooperative. Thyroid: mild diffuse enlargement. No palpable lymph nodes.",
  "BP 148/92 mmHg, HR 96 bpm (irregular). ECG: irregularly irregular rhythm, absent P waves. No acute ST changes.",
  "BP 124/80 mmHg, HR 70 bpm. Right leg: warm, erythematous, tender calf. Homans sign positive. Pitting edema unilateral.",
  "BP 138/86 mmHg, Temp 37.4°C. Abdomen: epigastric tenderness, no guarding. Bowel sounds normoactive. No organomegaly.",
  "BP 112/70 mmHg, HR 102 bpm, Temp 38.8°C. Conjunctival pallor. Petechiae bilateral lower extremities. Tourniquet test positive.",
  "BP 144/90 mmHg, HR 80 bpm. Joints: MCPs, PIPs swollen bilaterally. Grip strength reduced. Rheumatoid nodules noted.",
  "BP 128/78 mmHg, HR 74 bpm, Temp 36.9°C. Malar rash present. Oral ulcers 2. Mild synovitis bilateral wrists and knees.",
];

const RECOMMENDATIONS = [
  "Low-sodium (< 2g/day) diet. Daily weight monitoring. Fluid restriction 1.5 L/day. Follow-up in 1 week with BMP and chest X-ray.",
  "Strict diabetic diet. Daily blood glucose monitoring fasting and 2-hr post-prandial. HbA1c in 3 months. Podiatry referral.",
  "Complete antibiotic course. High-protein diet. Deep breathing exercises. Repeat chest X-ray after 4 weeks.",
  "Regular aerobic exercise 30 min/day. Low-purine diet. Hydration 2–3 L/day. Uric acid level in 1 month.",
  "INR monitoring weekly until therapeutic. Avoid NSAIDs and aspirin. Report any unusual bleeding. Follow-up in 2 weeks.",
  "Elevate affected limb. Compression stockings. Ambulate early. DVT ultrasound in 3 months. Anticoagulation for 3–6 months.",
  "DOTS therapy — directly observed treatment. Monthly LFTs. Sputum AFB in 2 months. Notify contacts for screening.",
  "Thyroid function test in 6–8 weeks. Take medication 30 min before breakfast, separate from calcium by 4 hours.",
  "Avoid triggers: NSAIDs, shellfish, alcohol. Colchicine for acute attacks. Long-term allopurinol after acute phase resolves.",
  "Sun protection SPF 50+. Avoid sulfa drugs. Hydroxychloroquine eye exam annually. Lupus nephritis panel in 1 month.",
];

const FAMILY_HEALTH_PROBLEMS = [
  "Hypertension",
  "Diabetes",
  "Heart attack",
  "Stroke",
  "Chronic kidney disease",
  "Hyperlipidemia",
  "Gout",
  "Rheumatoid arthritis",
  "Lupus",
  "Thyroid disease",
  "Tuberculosis",
  "Liver disease",
  "COPD",
  "Atrial fibrillation",
  "Anemia",
];
const RELATIONS = [
  "Father",
  "Mother",
  "Sibling",
  "Grandfather",
  "Grandmother",
  "Uncle",
  "Aunt",
  "Cousin",
];
const NOTES_LIST = [
  "Ongoing management",
  "First episode",
  "Improving",
  "Worsening",
  "Stable",
  "Controlled",
  "Under monitoring",
  "",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const bool = (prob = 0.3) => Math.random() < prob;

function randPastTs(startMs) {
  const now = Date.now();
  return Math.floor(startMs + Math.random() * (now - startMs));
}

const START_OF_YEAR = new Date(new Date().getFullYear(), 0, 1).getTime();

function fmtBirthdate(ts) {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "long",
    day: "2-digit",
    year: "numeric",
  });
}

// ─── Mock data builder ────────────────────────────────────────────────────────

function generatePatients(count = 100) {
  const patients = [];

  for (let i = 0; i < count; i++) {
    // Internal Medicine — roughly equal gender split, slight male bias (55%)
    const gender = Math.random() < 0.55 ? "MALE" : "FEMALE";
    const firstName = gender === "MALE" ? pick(MALE_FIRST) : pick(FEMALE_FIRST);
    const lastName = pick(LAST_NAMES);
    // Internal Medicine patients tend to be older (35–80)
    const age = rand(35, 80);
    const city = pick(CITIES);
    const province = pick(PROVINCES);
    const street = pick(STREETS);
    const phone = `09${rand(10, 99)}${rand(1000000, 9999999)}`;

    const birthYear = new Date().getFullYear() - age;
    const birthdateTs = new Date(birthYear, rand(0, 11), rand(1, 28)).getTime();

    const heightCm = gender === "MALE" ? rand(158, 178) : rand(148, 168);
    const weightKg = gender === "MALE" ? rand(58, 100) : rand(48, 90);

    // Internal Medicine patients have higher flag rates
    const drugAllergy = bool(0.25);
    const foodAllergy = bool(0.15);
    const isTBPositive = bool(0.12);
    const medicalCare = bool(0.65); // most IM patients are under chronic care
    const hasClinician = bool(0.08);
    const diet = bool(0.5); // most have dietary restrictions

    const famHistCount = rand(1, 4);
    const familyHistory = Array.from({ length: famHistCount }, () => ({
      relation: pick(RELATIONS),
      age: String(rand(45, 85)),
      healthProblems: pick(FAMILY_HEALTH_PROBLEMS),
      goodHealth: bool(0.4),
      isAlive: bool(0.65),
    }));

    const patientCreatedAt = randPastTs(START_OF_YEAR);

    // 1–3 records per patient
    const recordCount = rand(1, 3);
    const recordDates = Array.from({ length: recordCount }, () =>
      randPastTs(patientCreatedAt),
    ).sort((a, b) => a - b);

    const records = recordDates.map((createdAt) => {
      const numDiag = rand(1, 3);
      const diagPool = [...DIAGNOSES]
        .sort(() => Math.random() - 0.5)
        .slice(0, numDiag);
      const diagnosis = diagPool.map((d) => ({
        diagnosis: d.d,
        severity: d.s,
        notes: pick(NOTES_LIST),
      }));

      const hasPrescription = bool(0.65); // IM patients almost always have meds

      const numDrugs = rand(2, 4); // IM patients tend to have more drugs
      const selectedDrugs = [...DRUGS_POOL]
        .sort(() => Math.random() - 0.5)
        .slice(0, numDrugs)
        .map((d) => ({ ...d }));

      const updatedAt = createdAt;

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
            addedBy: `${DOCTOR.firstName} ${DOCTOR.lastName}`,
            field: DOCTOR.field,
            doctorId: DOCTOR.medicalId,
            createdBy: DOCTOR.uid,
            approvedBy: `${DOCTOR.firstName} ${DOCTOR.lastName}`,
            updatedAt: new Date(createdAt).toLocaleString(),
          }
        : null;

      return {
        diagnosis,
        symptoms: pick(SYMPTOMS_POOL),
        bloodPressure: `${rand(105, 185)}/${rand(65, 115)}`,
        heartRate: String(rand(55, 115)),
        respiratoryRate: String(rand(14, 24)),
        temperature: (rand(364, 395) / 10).toFixed(1),
        oxygenSaturation: String(rand(90, 100)),
        weight: String(weightKg),
        height: String(heightCm),

        medicalCare,
        drugAllergy,
        foodAllergy,
        isTBPositive,
        hasClinician,
        diet,
        familyHistory,

        linkId: null,
        addedBy: DOCTOR.username,
        approvedBy: `${DOCTOR.firstName} ${DOCTOR.lastName}`,
        createdBy: DOCTOR.uid,
        createdAt,
        updatedAt,

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

      medicalCare,
      drugAllergy,
      foodAllergy,
      isTBPositive,
      hasClinician,
      diet,
      familyHistory,

      height: heightCm,
      weight: weightKg,

      addedBy: DOCTOR.username,
      approvedBy: `${DOCTOR.firstName} ${DOCTOR.lastName}`,
      createdBy: DOCTOR.uid,
      createdAt: patientCreatedAt,
      updatedAt: patientCreatedAt,

      records,
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
      appendLog(`Generated ${mockPatients.length} patients. Starting push…`);

      let patientsAdded = 0;
      let recordsAdded = 0;
      let prescriptionsAdded = 0;
      let recordNumberCounter = totalExistingRecords;

      for (let i = 0; i < mockPatients.length; i++) {
        const { records: patientRecords, ...patientData } = mockPatients[i];

        const patientRef = push(ref(db, "patients"));
        const patientId = patientRef.key;
        await set(patientRef, { ...patientData, id: patientId });
        patientsAdded++;

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

          if (prescData) {
            await set(
              ref(db, `patients/${patientId}/records/${recordId}/prescription`),
              prescData,
            );
            prescriptionsAdded++;
          }
        }

        if ((i + 1) % 10 === 0) {
          appendLog(`✓ ${i + 1} / ${mockPatients.length} patients pushed…`);
        }
        setProgress({ current: i + 1, total: mockPatients.length });
      }

      const logsRef = push(ref(db, "logs"));
      await set(logsRef, {
        medicalRecordLog: `Mock data seeded by ${DOCTOR.displayName} (${DOCTOR.email}): ${patientsAdded} patients, ${recordsAdded} records, ${prescriptionsAdded} prescriptions.`,
        logTime: new Date().toLocaleString(),
      });

      setSummary({ patientsAdded, recordsAdded, prescriptionsAdded });
      appendLog(
        `🎉 Done! ${patientsAdded} patients, ${recordsAdded} records, ${prescriptionsAdded} prescriptions.`,
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
        <div className="bg-[#1a1a2e] px-6 py-5">
          <h1 className="text-xl font-bold text-white">Database Seeder</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Push 100 mock patients with records to Firebase
          </p>
          <p className="text-xs text-[#00a896] mt-1 font-mono">
            Owner: {DOCTOR.displayName} · {DOCTOR.email} · {DOCTOR.field}
          </p>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            {[
              { label: "Patients", value: "100" },
              { label: "Records", value: "100–300" },
              { label: "Prescriptions", value: "~65%" },
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

          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-1.5 text-xs text-gray-600">
            <p className="font-semibold text-gray-700 mb-2">
              What gets seeded:
            </p>
            {[
              "✓ ~55% male / 45% female (Internal Medicine bias)",
              "✓ Ages 35–80 (chronic disease patient range)",
              "✓ Filipino names — Visayas / Mindanao / Cordillera cities",
              "✓ Height & weight consistent per gender",
              "✓ Dates spread across this year — never exceed today",
              "✓ 1–3 consultation records per patient (sequential dates)",
              "✓ 30 diagnoses (Internal Medicine focused — HTN, DM, CKD, CHF, etc.)",
              "✓ 30 drugs (IM focused — antihypertensives, antidiabetics, anticoagulants, etc.)",
              "✓ ~65% of records include a full prescription",
              "✓ 2–4 drugs per prescription (IM patients typically on multiple meds)",
              "✓ Vital signs, symptoms, family history per record",
              "✓ Higher medicalCare (65%) and diet (50%) flag rates for chronic patients",
              `✓ All data owned by: ${DOCTOR.displayName} (${DOCTOR.field})`,
              "✓ addedBy = username · approvedBy = full name · createdBy = UID",
              "✓ linkId: null on all records (no linked secretary)",
              "✓ recordNumber continues from existing DB records",
            ].map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>

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
              Safe to run multiple times — always appends, never overwrites.
            </p>
          )}

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
