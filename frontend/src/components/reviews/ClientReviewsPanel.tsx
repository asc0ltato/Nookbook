"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, subDays } from "date-fns";
import { ru } from "date-fns/locale";
import { Calendar } from "lucide-react";
import { reviewsApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { Review } from "@/types/api";
import { Card } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DateRangePicker } from "@/components/home/DateRangePicker";
import { ModerationFilterSelect } from "@/components/reviews/ModerationFilterSelect";
import { SORT_OPTIONS, PERIOD_OPTIONS } from "@/components/reviews/reviewsModerationOptions";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import type { ReviewModerationItem } from "@/types/api";

const PUBLISH_TABS = [
  { id: "all", label: "Все" },
  { id: "published", label: "Опубликованные" },
  { id: "unpublished", label: "Неопубликованные" },
] as const;

function toModerationItem(review: Review): ReviewModerationItem {
  const managerComment = review.comments?.find((c) => c.roleId === 3 || c.roleId === 4);
  return {
    ...review,
    hotelName: review.hotelName ?? "",
    hasManagerReply: !!managerComment || !!review.managerResponse,
    managerResponse: managerComment?.comment ?? review.managerResponse,
    managerResponseAt: managerComment?.createdAt ?? review.managerResponseAt,
    managerResponseAuthor: managerComment
      ? [managerComment.firstName, managerComment.lastName].filter(Boolean).join(" ") || managerComment.userName
      : review.managerResponseAuthor,
    comments: review.comments ?? [],
  };
}

function isPublished(status?: string) {
  return (status ?? "").toLowerCase() === "approved";
}

function canDeleteWithin24Hours(createdAt: string) {
  const created = new Date(createdAt).getTime();
  if (!Number.isFinite(created)) return false;
  return Date.now() - created <= 24 * 60 * 60 * 1000;
}

export function ClientReviewsPanel() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id == null ? 0 : typeof user.id === "string" ? parseInt(user.id, 10) : Number(user.id);
  const defaultWeekStart = useMemo(() => subDays(new Date(), 7), []);
  const [tab, setTab] = useState<string>("all");
  const [sort, setSort] = useState("date_desc");
  const [period, setPeriod] = useState("7");
  const [hotelSearch, setHotelSearch] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(defaultWeekStart);
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date());
  const [dateFromOpen, setDateFromOpen] = useState(false);
  const [dateToOpen, setDateToOpen] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<"checkin" | "checkout">("checkin");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["my-reviews", userId],
    queryFn: () => reviewsApi.getByUser(userId),
    enabled: userId > 0,
  });

  const deleteReviewMutation = useMutation({
    mutationFn: (reviewId: number) => reviewsApi.delete(reviewId),
    onSuccess: () => {
      toast.success("Отзыв удален");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["my-reviews"] });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.message || "Ошибка при удалении отзыва";
      toast.error(msg);
    },
  });

  const raw: Review[] = Array.isArray(data?.data) ? data.data : [];

  const applyPreset = (days: number) => {
    setPeriod(String(days));
    setDateFrom(subDays(new Date(), days));
    setDateTo(new Date());
  };

  const tabCounts = useMemo(() => {
    const published = raw.filter((r) => isPublished(r.status)).length;
    return {
      all: raw.length,
      published,
      unpublished: raw.length - published,
    };
  }, [raw]);

  const items = useMemo(() => {
    let list = raw.map(toModerationItem);
    if (tab === "published") {
      list = list.filter((r) => isPublished(r.status));
    } else if (tab === "unpublished") {
      list = list.filter((r) => !isPublished(r.status));
    }
    if (hotelSearch.trim()) {
      const q = hotelSearch.trim().toLowerCase();
      list = list.filter((r) => (r.hotelName ?? "").toLowerCase().includes(q));
    }
    if (dateFrom) {
      const from = dateFrom.setHours(0, 0, 0, 0);
      list = list.filter((r) => new Date(r.createdAt).getTime() >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      list = list.filter((r) => new Date(r.createdAt).getTime() <= to.getTime());
    }
    return sort === "date_asc"
      ? [...list].sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))
      : sort === "rating_desc"
        ? [...list].sort((a, b) => b.rating - a.rating || +new Date(b.createdAt) - +new Date(a.createdAt))
        : sort === "rating_asc"
          ? [...list].sort((a, b) => a.rating - b.rating || +new Date(b.createdAt) - +new Date(a.createdAt))
          : [...list].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [raw, tab, hotelSearch, dateFrom, dateTo, sort]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {PUBLISH_TABS.map((t) => (
          <Button
            key={t.id}
            variant={tab === t.id ? "default" : "outline"}
            size="sm"
            onClick={() => setTab(t.id)}
          >
            {t.label}
            <Badge variant="secondary" className="ml-2">
              {tabCounts[t.id as keyof typeof tabCounts] ?? 0}
            </Badge>
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <ModerationFilterSelect value={sort} options={SORT_OPTIONS} placeholder="Сначала новые" onValueChange={setSort} />
        <ModerationFilterSelect value={period} options={PERIOD_OPTIONS} placeholder="За неделю" onValueChange={(v) => applyPreset(Number(v))} />

        <Popover open={dateFromOpen} onOpenChange={setDateFromOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[220px] justify-start font-normal" onClick={() => { setDatePickerMode("checkin"); setDateToOpen(false); }}>
              <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
              {dateFrom ? format(dateFrom, "dd.MM.yyyy", { locale: ru }) : "Дата с"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <DateRangePicker
              checkIn={dateFrom}
              checkOut={dateTo}
              onCheckInChange={setDateFrom}
              onCheckOutChange={setDateTo}
              mode={datePickerMode}
              dateConstraint="past-only"
              onModeChange={(mode) => { setDatePickerMode(mode); if (mode === "checkout") { setDateFromOpen(false); setDateToOpen(true); } }}
              onClose={() => setDateFromOpen(false)}
            />
          </PopoverContent>
        </Popover>

        <span className="text-muted-foreground text-sm">—</span>

        <Popover open={dateToOpen} onOpenChange={setDateToOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[220px] justify-start font-normal" onClick={() => { setDatePickerMode("checkout"); setDateFromOpen(false); }}>
              <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
              {dateTo ? format(dateTo, "dd.MM.yyyy", { locale: ru }) : "Дата по"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <DateRangePicker
              checkIn={dateFrom}
              checkOut={dateTo}
              onCheckInChange={setDateFrom}
              onCheckOutChange={setDateTo}
              mode={datePickerMode}
              dateConstraint="past-only"
              onModeChange={(mode) => { setDatePickerMode(mode); if (mode === "checkin") { setDateToOpen(false); setDateFromOpen(true); } }}
              onClose={() => setDateToOpen(false)}
            />
          </PopoverContent>
        </Popover>

        <Input
          className="max-w-xs"
          placeholder="Поиск по отелю"
          value={hotelSearch}
          onChange={(e) => setHotelSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">Загрузка...</div>
      ) : items.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">У вас пока нет отзывов</Card>
      ) : (
        <div className="space-y-4">
          {items.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              showHotelName
              hideModerationReason
              onDelete={
                canDeleteWithin24Hours(review.createdAt)
                  ? () => deleteReviewMutation.mutate(review.id)
                  : undefined
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
