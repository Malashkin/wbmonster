"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface InstructionModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: React.ReactNode; // Позволяет передавать JSX-контент
}

export default function InstructionModal({
  isOpen,
  onClose,
  content,
}: InstructionModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Инструкция</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">{content}</div>
        <Button variant="outline" className="mt-4" onClick={onClose}>
          Закрыть
        </Button>
      </DialogContent>
    </Dialog>
  );
}
