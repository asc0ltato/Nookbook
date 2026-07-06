"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { COMPLAINT_TYPE_OPTIONS } from "@/components/reviews/reviewsModerationOptions";

type ReviewComplaintDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (complaintType: string, comment?: string) => Promise<void>;
  isSubmitting?: boolean;
};

export function ReviewComplaintDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
}: ReviewComplaintDialogProps) {
  const [step, setStep] = useState<"type" | "comment">("type");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [comment, setComment] = useState("");

  const reset = () => {
    setStep("type");
    setSelectedType(null);
    setComment("");
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleSubmit = async () => {
    if (!selectedType) return;
    await onSubmit(selectedType, comment.trim() || undefined);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-2 border-b border-border/60 relative">
          {step === "comment" && (
            <button
              type="button"
              className="absolute left-3 top-3 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60"
              onClick={() => setStep("type")}
              disabled={isSubmitting}
              aria-label="Назад"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <DialogTitle className={`font-playfair text-3xl font-semibold ${step === "comment" ? "pl-8" : undefined}`}>Жалоба</DialogTitle>
          <p className={`text-sm text-primary/80 pt-1 ${step === "comment" ? "pl-8" : ""}`}>
            {step === "type" ? "Что не так с этим отзывом?" : `Тип: ${COMPLAINT_TYPE_OPTIONS.find((o) => o.value === selectedType)?.label}`}
          </p>
        </DialogHeader>

        {step === "type" ? (
          <div className="max-h-[360px] overflow-y-auto px-4 py-3 space-y-3">
            {COMPLAINT_TYPE_OPTIONS.map((opt) => (
              <div key={opt.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`complaint-type-${opt.value}`}
                  checked={selectedType === opt.value}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedType(opt.value);
                      setStep("comment");
                    }
                  }}
                />
                <Label
                  htmlFor={`complaint-type-${opt.value}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {opt.label}
                </Label>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 space-y-3">
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="Опишите подробнее (необязательно)"
              className="text-foreground"
            />
          </div>
        )}

        <DialogFooter className="px-4 py-3 border-t border-border/60 gap-2">
          <Button variant="outline" onClick={() => handleClose(false)} disabled={isSubmitting}>
            Отмена
          </Button>
          {step === "comment" && (
            <Button onClick={handleSubmit} disabled={!selectedType || isSubmitting}>
              {isSubmitting ? "Отправка..." : "Отправить"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
