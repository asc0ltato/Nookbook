export type ModerationSelectOption = {
  value: string;
  label: string;
};

export const SORT_OPTIONS: ModerationSelectOption[] = [
  { value: "date_desc", label: "Сначала новые" },
  { value: "date_asc", label: "Сначала старые" },
  { value: "rating_desc", label: "Сначала с высоким рейтингом" },
  { value: "rating_asc", label: "Сначала с низким рейтингом" },
];

export const COMPLAINT_TYPE_LABELS: Record<string, string> = {
  spam: "Спам",
  offensivecontent: "Оскорбительный контент",
  falseinformation: "Ложная информация",
  profanity: "Нецензурная лексика",
  advertisement: "Реклама",
  offtopic: "Не по теме",
  conflictofinterest: "Конфликт интересов",
  duplicatesubmission: "Дубликат",
  personaldatadisclosure: "Персональные данные",
  violencethreats: "Угрозы насилия",
  discrimination: "Дискриминация",
  fakereview: "Фейковый отзыв",
  threats: "Угрозы",
  other: "Другое",
  offensive: "Оскорбления",
  fake: "Недостоверный отзыв",
};

export function complaintTypeLabel(type: string): string {
  const key = type?.trim().toLowerCase().replace(/\s+/g, "");
  return COMPLAINT_TYPE_LABELS[key] ?? type;
}

export const COMPLAINT_TYPE_OPTIONS: ModerationSelectOption[] = [
  { value: "Spam", label: "Спам" },
  { value: "OffensiveContent", label: "Оскорбительный контент" },
  { value: "FalseInformation", label: "Ложная информация" },
  { value: "Profanity", label: "Нецензурная лексика" },
  { value: "Advertisement", label: "Реклама" },
  { value: "OffTopic", label: "Не по теме" },
  { value: "ConflictOfInterest", label: "Конфликт интересов" },
  { value: "DuplicateSubmission", label: "Дубликат" },
  { value: "PersonalDataDisclosure", label: "Персональные данные" },
  { value: "ViolenceThreats", label: "Угрозы насилия" },
  { value: "Discrimination", label: "Дискриминация" },
  { value: "FakeReview", label: "Фейковый отзыв" },
  { value: "Threats", label: "Угрозы" },
  { value: "Other", label: "Другое" },
];

export const PERIOD_OPTIONS: ModerationSelectOption[] = [
  { value: "7", label: "За неделю" },
  { value: "30", label: "За месяц" },
];

export function complaintStatusLabel(status: string): string {
  const s = status?.toLowerCase();
  if (s === "pending") return "Новая";
  if (s === "resolved" || s === "approved") return "Рассмотрена";
  if (s === "rejected") return "Отклонена";
  return status;
}

export function getModerationOptionLabel(
  options: ModerationSelectOption[],
  value: string,
  placeholder = "",
): string {
  return options.find((o) => o.value === value)?.label ?? placeholder;
}

export function reviewStatusLabel(status: string): string {
  const s = status?.toLowerCase();
  if (s === "approved") return "Опубликован";
  if (s === "pending") return "На модерации";
  if (s === "underreview" || s === "hidden") return "Скрыт";
  if (s === "rejected") return "Отклонен";
  return status;
}

export function reviewStatusColor(status: string): string {
  const s = status?.toLowerCase();
  if (s === "approved") return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
  if (s === "pending") return "bg-amber-500/20 text-amber-400 border-amber-500/40";
  if (s === "underreview" || s === "hidden") return "bg-red-500/20 text-red-400 border-red-500/40";
  if (s === "rejected") return "bg-orange-500/20 text-orange-400 border-orange-500/40";
  return "bg-muted text-muted-foreground";
}
