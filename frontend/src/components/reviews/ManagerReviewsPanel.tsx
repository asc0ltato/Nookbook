"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import { ru } from "date-fns/locale";
import { toast } from "sonner";
import { Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { reviewsApi } from "@/lib/api";
import type { ReviewModerationItem, ReviewModerationTabCounts } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DateRangePicker } from "@/components/home/DateRangePicker";
import { ModerationFilterSelect } from "@/components/reviews/ModerationFilterSelect";
import { SORT_OPTIONS, PERIOD_OPTIONS } from "@/components/reviews/reviewsModerationOptions";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface ManagerReviewsPanelProps {
  hotelId?: number;
  hotelOptions?: { id: number; name: string }[];
  onHotelChange?: (id: number) => void;
}

const REPLY_TABS = [
  { id: "all", label: "Все отзывы" },
  { id: "needs_reply", label: "Без ответа" },
  { id: "replied", label: "С ответом" },
] as const;

export function ManagerReviewsPanel({
  hotelId,
  hotelOptions = [],
  onHotelChange,
}: ManagerReviewsPanelProps) {
  const queryClient = useQueryClient();
  const defaultWeekStart = useMemo(() => subDays(new Date(), 7), []);
  const [tab, setTab] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("date_desc");
  const [period, setPeriod] = useState("7");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(defaultWeekStart);
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date());
  const [dateFromOpen, setDateFromOpen] = useState(false);
  const [dateToOpen, setDateToOpen] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<"checkin" | "checkout">("checkin");
  const [authorSearch, setAuthorSearch] = useState("");
  const [replyReviewId, setReplyReviewId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");

  const queryParams = useMemo(
    () => ({
      tab,
      hotelId,
      dateFrom: dateFrom ? format(dateFrom, "yyyy-MM-dd") : undefined,
      dateTo: dateTo ? format(dateTo, "yyyy-MM-dd") : undefined,
      sort,
      page,
      pageSize: 10,
      authorSearch: authorSearch.trim() || undefined,
    }),
    [tab, hotelId, dateFrom, dateTo, sort, page, authorSearch],
  );

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["reviews-moderation", "manager", queryParams],
    queryFn: () => reviewsApi.getManagerModeration(queryParams),
    enabled: !!hotelId,
  });

  const list = data?.data;
  const items: ReviewModerationItem[] = list?.items ?? [];
  const tabCounts = list?.tabCounts ?? { needsReply: 0, replied: 0 };
  const totalCount = list?.totalCount ?? 0;
  const pageSize = list?.pageSize ?? 10;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const replyMutation = useMutation({
    mutationFn: ({ reviewId, comment }: { reviewId: number; comment: string }) =>
      reviewsApi.addComment(reviewId, comment),
    onSuccess: () => {
      toast.success("Ответ опубликован");
      setReplyReviewId(null);
      setReplyText("");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["reviews-moderation"] });
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message || e?.message || "Не удалось отправить ответ");
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: number) => reviewsApi.deleteComment(commentId),
    onSuccess: () => {
      toast.success("Комментарий удален");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["reviews-moderation"] });
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message || e?.message || "Не удалось удалить комментарий");
    },
  });

  const applyPreset = (days: number) => {
    setPeriod(String(days));
    setDateFrom(subDays(new Date(), days));
    setDateTo(new Date());
    setPage(1);
  };

  const getManagerCommentId = (review: ReviewModerationItem) =>
    review.comments?.find((c) => c.roleId === 3 || c.roleId === 4)?.id;

  return (
    <div className="space-y-4">
      {hotelOptions.length > 1 && (
        <Select value={String(hotelId ?? "")} onValueChange={(v) => onHotelChange?.(Number(v))}>
          <SelectTrigger className="max-w-xs">
            <SelectValue placeholder="Отель">
              {hotelOptions.find((h) => String(h.id) === String(hotelId))?.name ?? "Отель"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {hotelOptions.map((h) => (
              <SelectItem key={h.id} value={String(h.id)}>{h.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <div className="flex gap-2 flex-wrap items-center">
        {REPLY_TABS.map((t) => {
          const count =
            t.id === "all"
              ? (tabCounts as ReviewModerationTabCounts).all ?? tabCounts.replied + tabCounts.needsReply
              : t.id === "needs_reply"
                ? tabCounts.needsReply
                : tabCounts.replied;
          return (
            <Button
              key={t.id}
              variant={tab === t.id ? "default" : "outline"}
              size="sm"
              onClick={() => { setTab(t.id); setPage(1); }}
            >
              {t.label}
              <Badge variant="secondary" className="ml-2">{count ?? 0}</Badge>
            </Button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <ModerationFilterSelect
          value={sort}
          options={SORT_OPTIONS}
          placeholder="Сначала новые"
          onValueChange={(v) => { setSort(v); setPage(1); }}
        />
        <ModerationFilterSelect
          value={period}
          options={PERIOD_OPTIONS}
          placeholder="За неделю"
          onValueChange={(v) => applyPreset(Number(v))}
        />

        <Popover open={dateFromOpen} onOpenChange={setDateFromOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-[220px] justify-start font-normal"
              onClick={() => {
                setDatePickerMode("checkin");
                setDateToOpen(false);
              }}
            >
              <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
              {dateFrom ? format(dateFrom, "dd.MM.yyyy", { locale: ru }) : "Дата с"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <DateRangePicker
              checkIn={dateFrom}
              checkOut={dateTo}
              onCheckInChange={(d) => { setDateFrom(d); setPage(1); }}
              onCheckOutChange={(d) => { setDateTo(d); setPage(1); }}
              mode={datePickerMode}
              dateConstraint="past-only"
              onModeChange={(mode) => {
                setDatePickerMode(mode);
                if (mode === "checkout") {
                  setDateFromOpen(false);
                  setDateToOpen(true);
                }
              }}
              onClose={() => setDateFromOpen(false)}
            />
          </PopoverContent>
        </Popover>

        <span className="text-muted-foreground text-sm">—</span>

        <Popover open={dateToOpen} onOpenChange={setDateToOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-[220px] justify-start font-normal"
              onClick={() => {
                setDatePickerMode("checkout");
                setDateFromOpen(false);
              }}
            >
              <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
              {dateTo ? format(dateTo, "dd.MM.yyyy", { locale: ru }) : "Дата по"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <DateRangePicker
              checkIn={dateFrom}
              checkOut={dateTo}
              onCheckInChange={(d) => { setDateFrom(d); setPage(1); }}
              onCheckOutChange={(d) => { setDateTo(d); setPage(1); }}
              mode={datePickerMode}
              dateConstraint="past-only"
              onModeChange={(mode) => {
                setDatePickerMode(mode);
                if (mode === "checkin") {
                  setDateToOpen(false);
                  setDateFromOpen(true);
                }
              }}
              onClose={() => setDateToOpen(false)}
            />
          </PopoverContent>
        </Popover>

        <Input
          className="max-w-xs"
          placeholder="Поиск по автору"
          value={authorSearch}
          onChange={(e) => { setAuthorSearch(e.target.value); setPage(1); }}
        />

      </div>

      {tab === "needs_reply" && (
        <p className="text-xs text-muted-foreground">
          Опубликованные отзывы без ответа менеджера за выбранный период.
        </p>
      )}

      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">Загрузка...</div>
      ) : items.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">
            {tab === "needs_reply"
              ? "Нет отзывов, ожидающих ответа"
              : tab === "replied"
                ? "Нет отзывов с ответом"
                : "Нет отзывов"}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((review) => {
            const managerCommentId = getManagerCommentId(review);
            return (
              <ReviewCard
                key={review.id}
                review={review}
                hideModerationReason
                onReply={
                  tab !== "replied" && !review.hasManagerReply
                    ? () => { setReplyReviewId(review.id); setReplyText(""); }
                    : undefined
                }
                managerCommentId={managerCommentId}
                onDeleteManagerComment={
                  managerCommentId
                    ? (id) => deleteCommentMutation.mutate(id)
                    : undefined
                }
              />
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <Pagination className="mt-2">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => { e.preventDefault(); if (page > 1) setPage((p) => p - 1); }}
                className={page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            <PaginationItem>
              <span className="px-4 text-sm text-muted-foreground">{page} / {totalPages}</span>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => { e.preventDefault(); if (page < totalPages) setPage((p) => p + 1); }}
                className={page >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <Dialog open={replyReviewId != null} onOpenChange={(o) => !o && setReplyReviewId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-playfair text-3xl font-semibold">Ответ менеджера</DialogTitle></DialogHeader>
          <Textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} rows={5} placeholder="Ваш ответ гостю..." />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyReviewId(null)}>Отмена</Button>
            <Button
              className="bg-amber-500 text-black hover:bg-amber-400"
              disabled={!replyText.trim() || replyMutation.isPending}
              onClick={() => replyReviewId && replyMutation.mutate({ reviewId: replyReviewId, comment: replyText.trim() })}
            >
              {replyMutation.isPending ? "Отправка..." : "Опубликовать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
