"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface UserSearchItem {
  id: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  Role?: string;
  isManager?: boolean;
  IsManager?: boolean;
}

interface UserSearchFieldProps {
  users: UserSearchItem[];
  value: number;
  onChange: (userId: number) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  filterRoles?: string[];
  className?: string;
}

function matchesQuery(user: UserSearchItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim().toLowerCase();
  const email = (user.email || "").toLowerCase();
  return fullName.includes(q) || email.includes(q);
}

function displayName(user: UserSearchItem): string {
  const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();
  if (name && user.email) return `${name} (${user.email})`;
  return name || user.email || `id ${user.id}`;
}

export function UserSearchField({
  users,
  value,
  onChange,
  label = "Пользователь *",
  placeholder = "Имя, фамилия или email",
  disabled = false,
  filterRoles,
  className,
}: UserSearchFieldProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const pool = useMemo(() => {
    const base = users.filter((u) => {
      const role = String(u.role ?? u.Role ?? "").toLowerCase();
      if (role === "manager" || role === "admin" || role === "guest") return false;
      if (u.isManager === true || u.IsManager === true) return false;
      return true;
    });
    if (!filterRoles?.length) return base;
    const allowed = new Set(filterRoles.map((r) => r.toLowerCase()));
    return base.filter((u) => allowed.has(String(u.role ?? u.Role ?? "").toLowerCase()));
  }, [users, filterRoles]);

  const selectedUser = useMemo(
    () => pool.find((u) => u.id === value) ?? users.find((u) => u.id === value),
    [pool, users, value],
  );

  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    return pool
      .filter((u) => u.id !== value && matchesQuery(u, query))
      .slice(0, 8);
  }, [pool, query, value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (user: UserSearchItem) => {
    onChange(user.id);
    setQuery("");
    setOpen(false);
  };

  const handleClear = () => {
    onChange(0);
    setQuery("");
  };

  return (
    <div className={cn("space-y-2", className)} ref={containerRef}>
      {label ? <Label>{label}</Label> : null}
      {selectedUser && value > 0 ? (
        <div className="flex items-center justify-between gap-2 rounded-md border border-input bg-muted/50 px-3 py-2 text-sm">
          <span className="truncate">{displayName(selectedUser)}</span>
          {!disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="text-muted-foreground hover:text-foreground shrink-0"
              aria-label="Сбросить"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <div className="relative">
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            disabled={disabled}
            className="text-foreground"
            autoComplete="off"
          />
          {open && query.trim() && suggestions.length > 0 && (
            <ul className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-md border border-border bg-popover text-popover-foreground shadow-md">
              {suggestions.map((user) => (
                <li key={user.id}>
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground truncate"
                    onClick={() => handleSelect(user)}
                  >
                    {displayName(user)}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {open && query.trim() && suggestions.length === 0 && (
            <p className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover px-3 py-2 text-sm text-muted-foreground shadow-md">
              Ничего не найдено
            </p>
          )}
        </div>
      )}
    </div>
  );
}

interface ManagerMultiSearchProps {
  users: UserSearchItem[];
  selectedIds: number[];
  onToggle: (userId: number) => void;
  assignedToAnyHotelIds?: Set<number>;
  minSelected?: number;
  label?: string;
  placeholder?: string;
}

export function ManagerMultiSearchField({
  users,
  selectedIds,
  onToggle,
  assignedToAnyHotelIds,
  minSelected = 1,
  label = "Менеджеры *",
  placeholder = "Имя, фамилия или email свободного менеджера",
}: ManagerMultiSearchProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const managers = useMemo(
    () => users.filter((u) => (u.role || "").toLowerCase() === "manager"),
    [users],
  );

  const selectedManagers = useMemo(
    () => managers.filter((m) => selectedIds.includes(m.id)),
    [managers, selectedIds],
  );

  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    return managers
      .filter((u) => {
        if (selectedIds.includes(u.id)) return false;
        if (assignedToAnyHotelIds?.has(u.id)) return false;
        return matchesQuery(u, query);
      })
      .slice(0, 8);
  }, [managers, query, selectedIds, assignedToAnyHotelIds]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="space-y-2" ref={containerRef}>
      <Label>{label}</Label>
      <p className="text-xs text-muted-foreground">
        Поиск только по менеджерам, не закрепленным за отелем. Закрепленные за этим отелем — в списке ниже.
      </p>
      {selectedManagers.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-foreground">Закрепленные за отелем</p>
          <ul className="space-y-1 rounded-md border border-border p-2">
            {selectedManagers.map((m) => {
              const canRemove = selectedIds.length > minSelected;
              return (
                <li
                  key={m.id}
                  className="flex items-center justify-between gap-2 text-sm px-1 py-1"
                >
                  <span className="truncate">{displayName(m)}</span>
                  <button
                    type="button"
                    onClick={() => canRemove && onToggle(m.id)}
                    disabled={!canRemove}
                    className="text-muted-foreground hover:text-foreground shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label={canRemove ? "Удалить" : "У отеля должен быть хотя бы один менеджер"}
                    title={canRemove ? "Удалить" : "У отеля должен быть хотя бы один менеджер"}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <div className="relative">
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="text-foreground"
          autoComplete="off"
        />
        {open && query.trim() && suggestions.length > 0 && (
          <ul className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-md border border-border bg-popover text-popover-foreground shadow-md">
            {suggestions.map((user) => (
              <li key={user.id}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground truncate"
                  onClick={() => {
                    onToggle(user.id);
                    setQuery("");
                    setOpen(false);
                  }}
                >
                  {displayName(user)}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export interface HotelSearchItem {
  id: number;
  name: string;
  city?: string;
}

interface HotelSearchFieldProps {
  hotels: HotelSearchItem[];
  value: number;
  onChange: (hotelId: number) => void;
  label?: string;
  placeholder?: string;
  allowEmpty?: boolean;
  className?: string;
}

function matchesHotelQuery(hotel: HotelSearchItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const name = (hotel.name || "").toLowerCase();
  const city = (hotel.city || "").toLowerCase();
  return name.includes(q) || city.includes(q);
}

export function HotelSearchField({
  hotels,
  value,
  onChange,
  label = "Отель",
  placeholder = "Название отеля",
  allowEmpty = true,
  className,
}: HotelSearchFieldProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedHotel = useMemo(
    () => hotels.find((h) => h.id === value),
    [hotels, value],
  );

  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    return hotels.filter((h) => h.id !== value && matchesHotelQuery(h, query)).slice(0, 8);
  }, [hotels, query, value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (selectedHotel) {
      setQuery(selectedHotel.name);
    } else if (!value && allowEmpty) {
      setQuery("");
    }
  }, [selectedHotel, value, allowEmpty]);

  return (
    <div className={cn("space-y-2", className)} ref={containerRef}>
      <Label>{label}</Label>
      <div className="relative">
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (!e.target.value.trim() && allowEmpty) {
              onChange(0);
            }
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="text-foreground h-9"
          autoComplete="off"
        />
        {open && query.trim() && suggestions.length > 0 && (
          <ul className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-md border border-border bg-popover text-popover-foreground shadow-md">
            {suggestions.map((hotel) => (
              <li key={hotel.id}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground truncate"
                  onClick={() => {
                    onChange(hotel.id);
                    setQuery(hotel.name);
                    setOpen(false);
                  }}
                >
                  {hotel.name}
                  {hotel.city ? ` — ${hotel.city}` : ""}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {allowEmpty && value > 0 && (
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-foreground"
          onClick={() => {
            onChange(0);
            setQuery("");
          }}
        >
          Сбросить выбор отеля
        </button>
      )}
    </div>
  );
}
