"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { User, Check, X, MessageSquare, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import type { Review, ReviewComment } from "@/types/api";
import { useState } from "react";

interface ReviewsSectionProps {
  reviews: Review[];
  hotelId: number;
  isAuthenticated: boolean;
  userRole?: string;
  userId?: number;
  onAddComment: (reviewId: number, comment: string) => Promise<void>;
  onDeleteReview?: (reviewId: number) => void;
  onDeleteComment?: (commentId: number) => void;
  onSubmitComplaint?: (reviewId: number, reason: string, type: string) => void;
}

export function ReviewsSection({
  reviews,
  hotelId,
  isAuthenticated,
  userRole,
  userId,
  onAddComment,
  onDeleteReview,
  onDeleteComment,
  onSubmitComplaint,
}: ReviewsSectionProps) {
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [replyReviewId, setReplyReviewId] = useState<number>(0);
  const [replyText, setReplyText] = useState("");

  const canDeleteReview = (review: Review) => {
    if (userRole === "Admin") return true;
    if (review.userId !== userId) return false;
    const createdAt = new Date(review.createdAt).getTime();
    if (!Number.isFinite(createdAt)) return false;
    return Date.now() - createdAt <= 24 * 60 * 60 * 1000;
  };

  const canDeleteComment = (comment: ReviewComment) => {
    if (userRole === "Admin") return true;
    if (userRole !== "Manager") return false;
    if (comment.userId !== userId) return false;
    const createdAt = new Date(comment.createdAt).getTime();
    if (!Number.isFinite(createdAt)) return false;
    return Date.now() - createdAt <= 24 * 60 * 60 * 1000;
  };

  if (reviews.length === 0) {
    return (
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Отзывы</h2>
        <p className="text-muted-foreground">Пока нет отзывов</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">Отзывы ({reviews.length})</h2>
      <div className="space-y-6">
        {reviews.map((review) => (
          <div key={review.id} className="border-b last:border-0 pb-6 last:pb-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{review.userName || "Гость"}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(review.createdAt), "d MMM yyyy", { locale: ru })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-500 text-white">{review.rating}</Badge>
                {canDeleteReview(review) && onDeleteReview && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => onDeleteReview(review.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {review.positiveTags && review.positiveTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {review.positiveTags.map((tag) => (
                  <span key={tag} className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded">
                    <Check className="w-3 h-3 inline mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {review.negativeTags && review.negativeTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {review.negativeTags.map((tag) => (
                  <span key={tag} className="text-sm text-red-600 bg-red-50 px-2 py-1 rounded">
                    <X className="w-3 h-3 inline mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <p className="text-muted-foreground mb-4">{review.comment}</p>

            {review.comments && review.comments.length > 0 && (
              <div className="ml-8 space-y-3">
                {review.comments.map((comment: ReviewComment) => (
                  <div key={comment.id} className="bg-muted p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold">{comment.userName || "Менеджер"}</span>
                      {canDeleteComment(comment) && onDeleteComment && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive"
                          onClick={() => onDeleteComment(comment.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{comment.comment}</p>
                  </div>
                ))}
              </div>
            )}

            {userRole === "Manager" && (
              <div className="mt-4">
                {(!review.comments || review.comments.length === 0) ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setReplyReviewId(review.id);
                      setReplyText("");
                      setReplyDialogOpen(true);
                    }}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Ответить
                  </Button>
                ) : (
                  <p className="text-xs text-muted-foreground">На этот отзыв уже есть ответ менеджера.</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-playfair text-3xl font-semibold">Ответ на отзыв</DialogTitle>
          </DialogHeader>
          <textarea
            className="w-full p-2 border rounded-md text-sm"
            rows={4}
            placeholder="Введите ответ менеджера..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyDialogOpen(false)}>
              Отмена
            </Button>
            <Button
              onClick={async () => {
                if (!replyText.trim() || !replyReviewId) return;
                await onAddComment(replyReviewId, replyText.trim());
                setReplyDialogOpen(false);
                setReplyText("");
                setReplyReviewId(0);
              }}
            >
              Отправить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
