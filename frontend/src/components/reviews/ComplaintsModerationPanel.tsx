"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import { ru } from "date-fns/locale";
import { toast } from "sonner";
import { Star, CheckCircle, XCircle, Calendar } from "lucide-react";
import Image from "next/image";
import { reviewsApi } from "@/lib/api";
import type { ReviewModerationItem } from "@/types/api";
import { resolveAvatarUrl, shouldUnoptimizeAvatar } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DateRangePicker } from "@/components/home/DateRangePicker";
import { ModerationFilterSelect } from "@/components/reviews/ModerationFilterSelect";
import { SORT_OPTIONS, PERIOD_OPTIONS } from "@/components/reviews/reviewsModerationOptions";
import {
  complaintTypeLabel,
  complaintStatusLabel,
  reviewStatusColor,
  reviewStatusLabel,
} from "@/components/reviews/reviewsModerationOptions";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const COMPLAINT_TABS = [
  { id: "all", label: "Все" },
  { id: "pending", label: "Ожидающие" },
  { id: "resolved", label: "Разрешенные" },
  { id: "rejected", label: "Отклоненные" },
] as const;

export function ComplaintsModerationPanel() {
  const queryClient = useQueryClient();
  const defaultWeekStart = useMemo(() => subDays(new Date(), 7), []);
  const [tab, setTab] = useState<string>("pending");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("date_desc");
  const [period, setPeriod] = useState("7");
  const [authorSearch, setAuthorSearch] = useState("");
  const [hotelSearch, setHotelSearch] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(defaultWeekStart);
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date());
  const [dateFromOpen, setDateFromOpen] = useState(false);
  const [dateToOpen, setDateToOpen] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<"checkin" | "checkout">("checkin");
  const applyPreset = (days: number) => {
    setPeriod(String(days));
    setDateFrom(subDays(new Date(), days));
    setDateTo(new Date());
    setPage(1);
  };

  const queryParams = useMemo(
    () => ({
      tab,
      page,
      pageSize: 10,
      sort,
      authorSearch: authorSearch.trim() || undefined,
      hotelSearch: hotelSearch.trim() || undefined,
      dateFrom: dateFrom ? format(dateFrom, "yyyy-MM-dd") : undefined,
      dateTo: dateTo ? format(dateTo, "yyyy-MM-dd") : undefined,
    }),
    [tab, page, sort, authorSearch, hotelSearch, dateFrom, dateTo],
  );

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["complaints-moderation", "admin", queryParams],
    queryFn: () => reviewsApi.getAdminComplaintsModeration(queryParams),
  });

  const items: ReviewModerationItem[] = data?.data?.items ?? [];
  const totalCount = data?.data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / 10));
  const counts = data?.data?.tabCounts;

  const tabCount = (id: string) => {
    if (!counts) return 0;
    switch (id) {
      case "all": return counts.all ?? 0;
      case "pending": return counts.pending ?? counts.complaints ?? 0;
      case "resolved": return counts.approved ?? 0;
      case "rejected": return counts.rejected ?? 0;
      default: return 0;
    }
  };

  const resolveMutation = useMutation({
    mutationFn: ({ complaintId, approve }: { complaintId: number; approve: boolean }) =>
      reviewsApi.resolveComplaint(complaintId, approve),
    onSuccess: (_data, vars) => {
      toast.success(vars.approve ? "Жалоба одобрена" : "Жалоба отклонена");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["reviews-moderation"] });
    },
    onError: (e: any) => toast.error(e?.message || "Ошибка"),
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Жалобы на отзывы</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Отзыв появляется после 3 жалоб. Жалобы сгруппированы под отзывом — каждую можно одобрить или отклонить отдельно.
          Отзыв остается в списке, пока не рассмотрены все жалобы. При одобрении хотя бы одной жалобы отзыв скрывается.
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {COMPLAINT_TABS.map((t) => (
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
          placeholder="Поиск по автору отзыва"
          value={authorSearch}
          onChange={(e) => { setAuthorSearch(e.target.value); setPage(1); }}
        />
        <Input
          className="max-w-xs"
          placeholder="Поиск по названию отеля"
          value={hotelSearch}
          onChange={(e) => { setHotelSearch(e.target.value); setPage(1); }}
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
            const complaints = [...(review.complaints ?? [])].sort((a, b) => {
              const aPending = a.status?.toLowerCase() === "pending" ? 0 : 1;
              const bPending = b.status?.toLowerCase() === "pending" ? 0 : 1;
              if (aPending !== bPending) return aPending - bPending;
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
            const pendingCount = complaints.filter((c) => c.status?.toLowerCase() === "pending").length;
            const userName =
              review.userName ||
              [review.firstName, review.lastName].filter(Boolean).join(" ");
            const userInitials =
              userName
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase() || "U";
            const userAvatarUrl = resolveAvatarUrl(review.userAvatar);

            return (
              <Card key={review.id} className="p-5 border-border/70">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 flex items-start gap-3">
                    <div className="relative w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-2 border-border flex-shrink-0">
                      {userAvatarUrl ? (
                        <Image
                          src={userAvatarUrl}
                          alt={userName || "Гость"}
                          fill
                          className="object-cover"
                          unoptimized={shouldUnoptimizeAvatar(userAvatarUrl)}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-primary/60 text-white text-xs font-bold">
                          {userInitials}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                    <p className="font-bold text-lg">{userName || "Гость"}</p>
                    {review.hotelName && (
                      <p className="text-sm text-muted-foreground">{review.hotelName}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="font-medium">{review.rating}/10</span>
                      <Badge className={reviewStatusColor(review.status)}>
                        {reviewStatusLabel(review.status)}
                      </Badge>
                      <Badge variant="secondary">
                        Жалоб: {complaints.length}
                        {pendingCount > 0 ? ` · ожидают ${pendingCount}` : ""}
                      </Badge>
                    </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground shrink-0">
                    {format(new Date(review.createdAt), "d MMMM yyyy", { locale: ru })}
                  </p>
                </div>

                <p className="text-sm text-foreground mt-3 whitespace-pre-wrap border-l-2 border-amber-500/40 pl-3">
                  {review.comment}
                </p>

                <div className="mt-4 rounded-lg border border-border/80 bg-muted/20 p-3">
                  <p className="text-sm font-semibold text-foreground mb-3">
                    Жалобы на отзыв ({complaints.length})
                  </p>
                  <ul className="space-y-2">
                    {complaints.map((c) => (
                      <li key={c.id} className="rounded-lg bg-muted/40 px-4 py-3 text-sm">
                        <div className="flex flex-wrap justify-between gap-2 mb-1">
                          <span className="font-medium text-foreground">{c.userName}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(c.createdAt), "dd.MM.yyyy HH:mm", { locale: ru })}
                          </span>
                        </div>
                        <p className="text-foreground">
                          <span className="text-muted-foreground">Причина: </span>
                          {complaintTypeLabel(c.complaintType)}
                        </p>
                        {c.comment && (
                          <p className="text-muted-foreground mt-1">{c.comment}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {complaintStatusLabel(c.status)}
                          </Badge>
                          {c.status?.toLowerCase() === "pending" && (
                            <>
                              <Button
                                size="sm"
                                className="h-7 gap-1 bg-green-600 hover:bg-green-700"
                                disabled={resolveMutation.isPending}
                                onClick={() => resolveMutation.mutate({ complaintId: c.id, approve: true })}
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                Одобрить жалобу
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 gap-1"
                                disabled={resolveMutation.isPending}
                                onClick={() => resolveMutation.mutate({ complaintId: c.id, approve: false })}
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                Отклонить жалобу
                              </Button>
                            </>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
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
