"use client";



import Image from "next/image";

import { format } from "date-fns";

import { ru } from "date-fns/locale";

import {

  Star,

  Calendar,

  Bed,

  Check,

  X,

  MessageSquare,

  Trash2,

} from "lucide-react";

import { Card } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";

import {

  AlertDialog,

  AlertDialogAction,

  AlertDialogCancel,

  AlertDialogContent,

  AlertDialogDescription,

  AlertDialogFooter,

  AlertDialogHeader,

  AlertDialogTitle,

  AlertDialogTrigger,

} from "@/components/ui/alert-dialog";

import { reviewStatusColor, reviewStatusLabel } from "@/components/reviews/reviewsModerationOptions";

import type { ReviewModerationItem } from "@/types/api";
import { resolveAvatarUrl, shouldUnoptimizeAvatar } from "@/lib/auth";



type ReviewCardProps = {

  review: ReviewModerationItem;

  showHotelName?: boolean;

  showStatus?: boolean;

  hideModerationReason?: boolean;

  onReply?: () => void;

  onDeleteManagerComment?: (commentId: number) => void;

  managerCommentId?: number;

  onDelete?: () => void;

  actions?: React.ReactNode;

};



export function ReviewCard({

  review,

  showHotelName = false,

  showStatus = false,

  hideModerationReason = false,

  onReply,

  onDeleteManagerComment,

  managerCommentId,

  onDelete,

  actions,

}: ReviewCardProps) {

  const userName =

    review.userName ||

    [review.firstName, review.lastName].filter(Boolean).join(" ") ||

    "Пользователь";



  const managerResponse =

    review.managerResponse ||

    review.comments?.find((c) => c.roleId === 3 || c.roleId === 4)?.comment;



  const managerResponseAt = review.managerResponseAt;

  const managerAuthor =

    review.managerResponseAuthor ||

    review.comments?.find((c) => c.roleId === 3 || c.roleId === 4)?.userName;

  const avatarUrl = resolveAvatarUrl(review.userAvatar);



  return (

    <Card className="p-5 border-border/70 bg-card/60 hover:shadow-md hover:border-primary/30 transition-all">

      <div className="flex items-start gap-4">

        <div className="relative w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-2 border-border flex-shrink-0">

          {avatarUrl ? (

            <Image src={avatarUrl} alt={userName} fill className="object-cover" unoptimized={shouldUnoptimizeAvatar(avatarUrl)} />

          ) : (

            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-yellow-400 to-orange-500 text-white text-sm font-bold">

              {userName.split(" ").map((n) => n[0]).join("").slice(0, 2)}

            </div>

          )}

        </div>



        <div className="flex-1 min-w-0">

          <div className="flex items-start justify-between mb-3 gap-3">

            <div className="flex-1 min-w-0">

              <div className="flex items-start justify-between gap-2">

              <div className="flex items-center gap-3 mb-2 flex-wrap flex-1 min-w-0">

                <h3 className="font-bold text-lg">{userName}</h3>

                <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-yellow-500/10 border border-yellow-400/60">

                  <Star className="w-3.5 h-3.5 text-yellow-500 mr-1 fill-yellow-500" />

                  <span className="font-semibold text-yellow-500 text-sm">{review.rating}/10</span>

                </div>

                {showStatus && review.status && (

                  <Badge className={reviewStatusColor(review.status)}>

                    {reviewStatusLabel(review.status)}

                  </Badge>

                )}

                {review.moderationReason && !hideModerationReason && (

                  <Badge variant="outline" className="text-amber-600 border-amber-500/40">

                    {review.moderationReason}

                  </Badge>

                )}

              </div>

              {onDelete && (
                <AlertDialog>
                  <AlertDialogTrigger
                    type="button"
                    className="h-9 w-9 inline-flex items-center justify-center rounded-md border border-red-300/60 text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                    aria-label="Удалить отзыв"
                    title="Удалить отзыв (в течение 24 часов)"
                  >
                    <Trash2 className="w-4 h-4" />
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="font-playfair text-3xl font-semibold">Удалить отзыв?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Отзыв будет удален без возможности восстановления.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Отмена</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={onDelete}
                      >
                        Удалить
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              </div>

              {showHotelName && review.hotelName && (

                <p className="text-sm text-muted-foreground mb-1">{review.hotelName}</p>

              )}

              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-3">

                <div className="flex items-center gap-1.5">

                  <Calendar className="w-3.5 h-3.5" />

                  <span>{format(new Date(review.createdAt), "d MMMM yyyy", { locale: ru })}</span>

                </div>

                {review.roomName && (

                  <div className="flex items-center gap-1.5">

                    <Bed className="w-3.5 h-3.5" />

                    <span>{review.roomName}</span>

                  </div>

                )}

                {review.nightsStayed != null && review.nightsStayed > 0 && (

                  <div className="flex items-center gap-1.5">

                    <Calendar className="w-3.5 h-3.5" />

                    <span>

                      {review.nightsStayed}{" "}

                      {review.nightsStayed === 1 ? "сутки" : "суток"}

                    </span>

                  </div>

                )}

                {review.checkInDate && review.checkOutDate && (

                  <div className="flex items-center gap-1.5">

                    <span>

                      {format(new Date(review.checkInDate), "dd.MM.yyyy")} —{" "}

                      {format(new Date(review.checkOutDate), "dd.MM.yyyy")}

                    </span>

                  </div>

                )}

              </div>

            </div>

          </div>



          <div className="mb-2 flex flex-wrap gap-2">

            {(review.positiveTags || []).map((tag) => (

              <Badge

                key={`plus-${review.id}-${tag}`}

                className="bg-yellow-500/90 hover:bg-yellow-500 text-black border border-yellow-300"

              >

                <Check className="w-3.5 h-3.5 mr-1" />

                {tag}

              </Badge>

            ))}

            {(review.negativeTags || []).map((tag) => (

              <Badge

                key={`minus-${review.id}-${tag}`}

                className="bg-rose-600/90 hover:bg-rose-600 text-white border border-rose-400/40"

              >

                <X className="w-3.5 h-3.5 mr-1" />

                {tag}

              </Badge>

            ))}

          </div>



          {review.comment?.trim() && (

            <p className="text-foreground leading-relaxed text-base break-words whitespace-pre-wrap mb-3">

              {review.comment}

            </p>

          )}



          {managerResponse && (

            <div className="mt-4 ml-1 border-l-4 border-yellow-400/80 pl-4">

              <div className="relative rounded-lg bg-muted/40 border border-border/60 p-4">

                {onDeleteManagerComment && managerCommentId && (

                  <AlertDialog>

                    <AlertDialogTrigger
                      type="button"
                      className="absolute top-2 right-2 h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-muted/50"
                      aria-label="Удалить комментарий"
                    >
                      <Trash2 className="w-4 h-4" />
                    </AlertDialogTrigger>

                    <AlertDialogContent>

                      <AlertDialogHeader>

                        <AlertDialogTitle className="font-playfair text-3xl font-semibold">Удалить ответ?</AlertDialogTitle>

                        <AlertDialogDescription>

                          Комментарий менеджера будет удален без возможности восстановления.

                        </AlertDialogDescription>

                      </AlertDialogHeader>

                      <AlertDialogFooter>

                        <AlertDialogCancel>Отмена</AlertDialogCancel>

                        <AlertDialogAction

                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"

                          onClick={() => onDeleteManagerComment(managerCommentId)}

                        >

                          Удалить

                        </AlertDialogAction>

                      </AlertDialogFooter>

                    </AlertDialogContent>

                  </AlertDialog>

                )}

                <div className="text-sm font-semibold text-yellow-400 mb-2 pr-8">

                  {managerAuthor || ""}

                  {managerResponseAt && (

                    <span className="text-muted-foreground font-normal ml-2">

                      • {format(new Date(managerResponseAt), "d MMMM yyyy", { locale: ru })}

                    </span>

                  )}

                </div>

                <p className="text-sm text-foreground whitespace-pre-wrap">{managerResponse}</p>

              </div>

            </div>

          )}



          <div className="flex flex-wrap gap-2 mt-3">

            {onReply && !review.hasManagerReply && (

              <Button

                variant="outline"

                size="sm"

                onClick={onReply}

                className="text-primary border-primary/30 hover:bg-primary/10"

              >

                <MessageSquare className="w-4 h-4 mr-1.5" />

                Ответить

              </Button>

            )}

            {actions}

          </div>

        </div>

      </div>

    </Card>

  );

}


