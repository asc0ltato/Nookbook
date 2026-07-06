"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import { ru } from "date-fns/locale";
import { toast } from "sonner";
import { Calendar, CheckCircle, XCircle } from "lucide-react";
import { reviewsApi } from "@/lib/api";
import type { ReviewModerationItem } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DateRangePicker } from "@/components/home/DateRangePicker";
import { ModerationFilterSelect } from "@/components/reviews/ModerationFilterSelect";
import { SORT_OPTIONS, PERIOD_OPTIONS } from "@/components/reviews/reviewsModerationOptions";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const ADMIN_TABS = [
  { id: "all", label: "Все" },
  { id: "pending", label: "Ожидающие" },
  { id: "approved", label: "Одобренные" },
  { id: "rejected", label: "Отклоненные" },
  { id: "hidden", label: "Скрытые" },
] as const;

export function ReviewsModerationPanel() {
  const queryClient = useQueryClient();
  const defaultWeekStart = useMemo(() => subDays(new Date(), 7), []);
  const [tab, setTab] = useState<string>("pending");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("date_desc");
  const [period, setPeriod] = useState("7");
  const [authorSearch, setAuthorSearch] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(defaultWeekStart);
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date());
  const [dateFromOpen, setDateFromOpen] = useState(false);
  const [dateToOpen, setDateToOpen] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<"checkin" | "checkout">("checkin");

  const queryParams = useMemo(
    () => ({
      tab,
      authorSearch: authorSearch.trim() || undefined,
      sort,
      page,
      pageSize: 10,
      dateFrom: dateFrom ? format(dateFrom, "yyyy-MM-dd") : undefined,
      dateTo: dateTo ? format(dateTo, "yyyy-MM-dd") : undefined,
    }),
    [tab, authorSearch, sort, page, dateFrom, dateTo],
  );

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["reviews-moderation", "admin", queryParams],
    queryFn: () => reviewsApi.getAdminModeration(queryParams),
  });

  const list = data?.data;
  const items: ReviewModerationItem[] = list?.items ?? [];
  const counts = list?.tabCounts;
  const totalCount = list?.totalCount ?? 0;
  const pageSize = list?.pageSize ?? 10;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const tabCount = (id: string) => {
    if (!counts) return 0;
    switch (id) {
      case "all": return counts.all ?? 0;
      case "pending": return counts.pending ?? 0;
      case "approved": return counts.approved ?? 0;
      case "rejected": return counts.rejected ?? 0;
      case "hidden": return counts.hidden ?? 0;
      default: return 0;
    }
  };

  const approveMutation = useMutation({
    mutationFn: (id: number) => reviewsApi.approve(id),
    onSuccess: () => {
      toast.success("Отзыв опубликован");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["reviews-moderation"] });
    },
    onError: (e: any) => toast.error(e?.message || "Ошибка"),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) => reviewsApi.reject(id),
    onSuccess: () => {
      toast.success("Отзыв отклонен");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["reviews-moderation"] });
    },
    onError: (e: any) => toast.error(e?.message || "Ошибка"),
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: number) => reviewsApi.deleteComment(commentId),
    onSuccess: () => {
      toast.success("Ответ менеджера удален");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["reviews-moderation"] });
    },
    onError: (e: any) => toast.error(e?.message || "Ошибка"),
  });

  const applyPreset = (days: number) => {
    setPeriod(String(days));
    setDateFrom(subDays(new Date(), days));
    setDateTo(new Date());
    setPage(1);
  };

  const getManagerCommentId = (review: ReviewModerationItem) =>
    review.comments?.find((c) => c.roleId === 3 || c.roleId === 4)?.id;

  const showModerationActions = tab === "pending";

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Отзывы</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Модерация и просмотр отзывов по статусу.
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {ADMIN_TABS.map((t) => (
          <Button
            key={t.id}
            variant={tab === t.id ? "default" : "outline"}
            size="sm"
            onClick={() => { setTab(t.id); setPage(1); }}
          >
            {t.label}
            <Badge variant="secondary" className="ml-2">{tabCount(t.id)}</Badge>
          </Button>
        ))}
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
              onClick={() => { setDatePickerMode("checkin"); setDateToOpen(false); }}
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
                if (mode === "checkout") { setDateFromOpen(false); setDateToOpen(true); }
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
              onClick={() => { setDatePickerMode("checkout"); setDateFromOpen(false); }}
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
                if (mode === "checkin") { setDateToOpen(false); setDateFromOpen(true); }
              }}
              onClose={() => setDateToOpen(false)}
            />
          </PopoverContent>
        </Popover>

        <Input
          className="max-w-xs"
          placeholder="Поиск по имени или фамилии автора"
          value={authorSearch}
          onChange={(e) => { setAuthorSearch(e.target.value); setPage(1); }}
        />
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">Загрузка...</div>
      ) : items.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Нет отзывов в этой категории</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((review) => {
            const managerCommentId = getManagerCommentId(review);
            return (
              <ReviewCard
                key={review.id}
                review={review}
                showHotelName
                showStatus
                hideModerationReason
                managerCommentId={managerCommentId}
                onDeleteManagerComment={
                  managerCommentId
                    ? (id) => deleteCommentMutation.mutate(id)
                    : undefined
                }
                actions={
                  showModerationActions ? (
                    <>
                      <Button
                        size="sm"
                        className="bg-green-500 hover:bg-green-600"
                        onClick={() => approveMutation.mutate(review.id)}
                        disabled={approveMutation.isPending}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Одобрить
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => rejectMutation.mutate(review.id)}
                        disabled={rejectMutation.isPending}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Отклонить
                      </Button>
                    </>
                  ) : undefined
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
    </div>
  );
}
