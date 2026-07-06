"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import {
  PhoneInput as IntlPhoneInput,
  ParsedCountry,
} from "react-international-phone";
import { cn } from "@/lib/utils";

interface PhoneInputProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onValidityChange?: (isValid: boolean) => void;
  defaultCountryIso?: string;
  className?: string;
  maxLength?: number;
}

const countryLengthMap: Record<string, number> = {
  by: 9,
  ru: 10,
  ua: 9,
  pl: 9,
  us: 10,
  ca: 10,
};

export function PhoneInput({
  id = "phone",
  label,
  value,
  onChange,
  onValidityChange,
  defaultCountryIso = "by",
  className,
  maxLength,
}: PhoneInputProps) {
  const [countryIso, setCountryIso] = React.useState(
    defaultCountryIso.toLowerCase()
  );
  const latestPhoneRef = React.useRef(value || "+375");
  const latestCountryRef = React.useRef<ParsedCountry | undefined>(undefined);

  React.useEffect(() => {
    latestPhoneRef.current = value || "+375";
  }, [value]);

  const validatePhone = React.useCallback(
    (phone: string, country?: ParsedCountry) => {
      if (!phone) {
        onValidityChange?.(true);
        return;
      }

      const normalized = phone.replace(/[^\d+]/g, "");

      if (!normalized.startsWith("+")) {
        onValidityChange?.(false);
        return;
      }

      const dialCode = country?.dialCode || "";
      const digits = normalized.replace(/\D/g, "");

      const nationalDigits = dialCode
        ? digits.slice(dialCode.length)
        : digits;

      const expected =
        countryLengthMap[
          (country?.iso2 || countryIso).toLowerCase()
        ];

      if (maxLength) {
        onValidityChange?.(
          nationalDigits.length === maxLength
        );
      } else if (expected) {
        onValidityChange?.(
          nationalDigits.length === expected
        );
      } else {
        onValidityChange?.(
          nationalDigits.length >= 6 &&
            nationalDigits.length <= 12
        );
      }
    },
    [countryIso, onValidityChange, maxLength]
  );

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label htmlFor={id}>{label}</Label>}

      <IntlPhoneInput
        defaultCountry={
          defaultCountryIso.toLowerCase() as any
        }
        value={value || "+375"}
        onChange={(phone, meta) => {
          latestPhoneRef.current = phone;
          latestCountryRef.current = meta.country;
          setCountryIso(
            (
              meta.country?.iso2 ||
              defaultCountryIso
            ).toLowerCase()
          );

          onChange(phone);
          validatePhone(phone, meta.country);
        }}
        forceDialCode
        disableDialCodePrefill={false}
        disableCountryGuess={false}
        inputProps={{
          id,
          name: id,
          onBlur: () => validatePhone(latestPhoneRef.current, latestCountryRef.current),
        }}
        countrySelectorStyleProps={{
          buttonClassName: cn(
            "!h-[48px]",
            "!bg-background",
            "!border",
            "!border-input",
            "!border-r-0",
            "!rounded-l-xl",
            "!px-4",
            "!flex",
            "!items-center",
            "!justify-center",
            "hover:!bg-accent",
            "transition-colors",
            "[&_.react-international-phone-country-selector-button__dropdown-arrow]:!text-muted-foreground"
          ),

         dropdownStyleProps: {
          className: cn(
            "!bg-popover",
            "!border",
            "!border-border",
            "!rounded-xl",
            "!text-popover-foreground",
            "!shadow-lg",

            "[&_.react-international-phone-country-selector-dropdown__list]:!bg-popover",
            "[&_.react-international-phone-country-selector-dropdown__list]:max-h-[280px]",
            "[&_.react-international-phone-country-selector-dropdown__list]:overflow-y-auto",

            "[&_.react-international-phone-country-selector-dropdown__list-item]:!bg-transparent",
            "[&_.react-international-phone-country-selector-dropdown__list-item]:!text-popover-foreground",
            "[&_.react-international-phone-country-selector-dropdown__list-item]:!transition-colors",

            "[&_.react-international-phone-country-selector-dropdown__list-item:hover]:!bg-accent",
            "[&_.react-international-phone-country-selector-dropdown__list-item:hover]:!text-accent-foreground",

            "[&_.react-international-phone-country-selector-dropdown__list-item--selected]:!bg-accent",
            "[&_.react-international-phone-country-selector-dropdown__list-item--selected]:!text-accent-foreground",
            "[&_.react-international-phone-country-selector-dropdown__list-item--selected_*]:!text-accent-foreground",

            "[&_.react-international-phone-country-selector-dropdown__list-item:focus]:!bg-accent",
            "[&_.react-international-phone-country-selector-dropdown__list-item:focus]:!outline-none"
          ),
        },
        }}
        inputClassName={cn(
          "!h-[48px]",
          "!w-full",
          "!bg-background",
          "!text-foreground",
          "!border",
          "!border-input",
          "!rounded-r-xl",
          "!px-4",
          "!text-sm",
          "placeholder:!text-muted-foreground",
          "focus:!outline-none",
          "focus:!border-[#FFD600]"
        )}
        className={cn(
          "w-full",
          "[&_.react-international-phone-input-container]:!flex",
          "[&_.react-international-phone-input-container]:!items-stretch",
          "[&_.react-international-phone-input-container]:!w-full"
        )}
      />
    </div>
  );
}
