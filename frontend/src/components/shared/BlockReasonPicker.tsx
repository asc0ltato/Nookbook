"use client";



import { Label } from "@/components/ui/label";

import { Textarea } from "@/components/ui/textarea";

import { Checkbox } from "@/components/ui/checkbox";



interface BlockReasonPickerProps {

  reasons: string[];

  selectedReason: string;

  onSelectReason: (reason: string) => void;

  customReason: string;

  onCustomReasonChange: (value: string) => void;

  label?: string;

}



export function BlockReasonPicker({

  reasons,

  selectedReason,

  onSelectReason,

  customReason,

  onCustomReasonChange,

  label = "Причина блокировки *",

}: BlockReasonPickerProps) {

  return (

    <div className="space-y-4">

      <div className="space-y-2">

        <Label>{label}</Label>

        <div className="space-y-3">

          {reasons.map((reason) => (

            <div key={reason} className="flex items-center space-x-2">

              <Checkbox

                id={`block-reason-${reason}`}

                checked={selectedReason === reason}

                onCheckedChange={(checked) => {

                  if (checked) {

                    onSelectReason(reason);

                    if (reason !== "Другое") onCustomReasonChange("");

                  }

                }}

              />

              <Label

                htmlFor={`block-reason-${reason}`}

                className="text-sm font-normal cursor-pointer"

              >

                {reason}

              </Label>

            </div>

          ))}

        </div>

      </div>

      {selectedReason === "Другое" && (

        <div className="space-y-2">

          <Label htmlFor="block-custom-reason">Укажите причину *</Label>

          <Textarea

            id="block-custom-reason"

            value={customReason}

            onChange={(e) => onCustomReasonChange(e.target.value)}

            rows={3}

            placeholder="Опишите причину блокировки..."

            className="resize-none text-foreground"

          />

        </div>

      )}

    </div>

  );

}



export function resolveBlockReason(

  selectedReason: string,

  customReason: string,

): string {

  return selectedReason === "Другое" ? customReason.trim() : selectedReason;

}

