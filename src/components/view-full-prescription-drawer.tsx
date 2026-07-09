"use client";

import * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import type {
  Patient,
  MedicalRecord,
  Prescription,
} from "./view-consultation-records";
import { ViewFullPrescription } from "./view-full-prescription";

type FullPrescriptionDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient & MedicalRecord;
};

export function FullPrescriptionDrawer({
  open,
  onOpenChange,
  patient,
}: FullPrescriptionDrawerProps) {
  const isMobile = useIsMobile();

  if (!patient.prescription) return null;

  const prescription: Prescription = {
    ...patient.prescription,
    id: patient.prescription.id ?? patient.recordId,
    createdAt:
      patient.prescription.createdAt ??
      (patient.createdAt
        ? new Date(patient.createdAt).toLocaleString()
        : undefined),
    patientFirstName:
      patient.prescription.patientFirstName ?? patient.firstName,
    patientLastName: patient.prescription.patientLastName ?? patient.lastName,
    patientAddress:
      patient.prescription.patientAddress ??
      [patient.address1, patient.address2].filter(Boolean).join(", ") ??
      patient.address,
    patientAge: patient.prescription.patientAge ?? patient.age,
    patientGender: patient.prescription.patientGender ?? patient.gender,
  };

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Full Prescription Details</DrawerTitle>
          </DrawerHeader>
          <div className="p-4">
            <ViewFullPrescription
              open={open}
              onOpenChange={onOpenChange}
              patient={prescription}
            />
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[1200px] !w-[90vw]">
        <DialogHeader>
          <DialogTitle>Full Prescription Details</DialogTitle>
        </DialogHeader>
        <ViewFullPrescription
          open={open}
          onOpenChange={onOpenChange}
          patient={prescription}
        />
      </DialogContent>
    </Dialog>
  );
}
