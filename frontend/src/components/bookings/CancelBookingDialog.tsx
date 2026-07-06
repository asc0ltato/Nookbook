"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Booking } from "@/types/api";

interface CancelBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking | null;
  cancelCode: string;
  onCancelCodeChange: (code: string) => void;
  onConfirm: () => void;
  isSubmitting?: boolean;
}

export function CancelBookingDialog({
  open,
  onOpenChange,
  booking,
  cancelCode,
  onCancelCodeChange,
  onConfirm,
  isSubmitting,
}: CancelBookingDialogProps) {
  if (!booking) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-playfair text-3xl font-semibold">Отмена бронирования</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="cancelCode">Код бронирования</Label>
            <Input
              id="cancelCode"
              value={cancelCode}
              onChange={(e) => onCancelCodeChange(e.target.value)}
              placeholder="Введите код бронирования для подтверждения"
              className="mt-1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={cancelCode !== booking.bookingCode || isSubmitting}
          >
            {isSubmitting ? "Отмена..." : "Подтвердить отмену"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
