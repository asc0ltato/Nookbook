"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hotelName: string;
  rating: number;
  onRatingChange: (rating: number) => void;
  comment: string;
  onCommentChange: (comment: string) => void;
  positiveTags: string[];
  negativeTags: string[];
  onPositiveTagsChange: (tags: string[]) => void;
  onNegativeTagsChange: (tags: string[]) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

const positiveReviewTags = [
  "Чистота", "Комфорт", "Персонал", "Завтрак", "Расположение", "Wi-Fi",
  "Парковка", "Бассейн", "Спортзал", "Тишина", "Цена-качество", "Вид из окна"
];

const negativeReviewTags = [
  "Шум", "Грязно", "Плохой Wi-Fi", "Нет парковки", "Некомфортная кровать",
  "Сломанный душ", "Невежливый персонал", "Дорого", "Холодно", "Жарко"
];

export function ReviewDialog({
  open,
  onOpenChange,
  hotelName,
  rating,
  onRatingChange,
  comment,
  onCommentChange,
  positiveTags,
  negativeTags,
  onPositiveTagsChange,
  onNegativeTagsChange,
  onSubmit,
  isSubmitting,
}: ReviewDialogProps) {
  const togglePositiveTag = (value: string) => {
    onPositiveTagsChange(
      positiveTags.includes(value)
        ? positiveTags.filter((item) => item !== value)
        : [...positiveTags, value]
    );
  };

  const toggleNegativeTag = (value: string) => {
    onNegativeTagsChange(
      negativeTags.includes(value)
        ? negativeTags.filter((item) => item !== value)
        : [...negativeTags, value]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-playfair text-3xl font-semibold">Написать отзыв</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label>Отель</Label>
            <p className="text-lg font-semibold">{hotelName}</p>
          </div>
          <div>
            <Label>Оценка</Label>
            <div className="flex gap-2 mt-2 flex-wrap">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => onRatingChange(r)}
                  className={`px-3 py-2 rounded-lg border-2 transition-colors ${
                    rating === r
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:border-primary"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="reviewComment">Комментарий</Label>
            <Textarea
              id="reviewComment"
              value={comment}
              onChange={(e) => onCommentChange(e.target.value)}
              className="mt-1"
              rows={5}
              placeholder="Комментарий необязателен, но помогает другим гостям..."
            />
          </div>
          <div>
            <Label>Что понравилось</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {positiveReviewTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => togglePositiveTag(tag)}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                    positiveTags.includes(tag)
                      ? "bg-green-500 text-white border-green-500"
                      : "bg-background border-border hover:border-green-500"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Что не понравилось</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {negativeReviewTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleNegativeTag(tag)}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                    negativeTags.includes(tag)
                      ? "bg-red-500 text-white border-red-500"
                      : "bg-background border-border hover:border-red-500"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Отправка..." : "Отправить отзыв"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
