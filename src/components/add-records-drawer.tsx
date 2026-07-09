"use client";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { AddRecords } from "./add-records";
import { AddConsultationRecords } from "./add-consultation-record";
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
type AddRecordsDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient;
};
export function AddRecordsDrawer({
  open,
  onOpenChange,
  patient,
}: AddRecordsDrawerProps) {
  const isMobile = useIsMobile();
  if (!isMobile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] sm:max-w-[1200px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Medical Record</DialogTitle>
            <DialogDescription>
              Create a medical record for your patient. Click save when you’re
              done.
            </DialogDescription>
          </DialogHeader>
          <AddConsultationRecords patient={patient} />
        </DialogContent>
      </Dialog>
    );
  }
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerTrigger asChild></DrawerTrigger>
      <DrawerContent className="h-[95vh] max-h-[95vh] flex flex-col">
        <DrawerHeader className="text-left flex-shrink-0 border-b border-gray-100 pb-4">
          <DrawerTitle className="text-xl">Add Medical Record</DrawerTitle>
          <DrawerDescription className="text-sm text-gray-500">
            Create a medical record for your patient. Click save when you're
            done.
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto px-4 py-4 overflow-x-visible">
          <AddConsultationRecords patient={patient} />
        </div>
        <DrawerFooter className="border-t border-gray-100 mt-0 flex-shrink-0 !bg-white">
          <DrawerClose asChild>
            <Button
              className="!bg-red-400 !text-white hover:!bg-red-500"
              variant="destructive"
            >
              Cancel
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
