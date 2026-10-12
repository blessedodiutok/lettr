// File: apps/web/src/components/InspectionPicker.tsx
// Date and time picker for scheduling property inspections

"use client";

import { Calendar, Clock } from "lucide-react";
import { useState } from "react";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";

interface TimeSlot {
  label: string;
  value: string; // HH:MM 24-hour
}

const TIME_SLOTS: TimeSlot[] = [
  { label: "9:00 AM", value: "09:00" },
  { label: "10:00 AM", value: "10:00" },
  { label: "11:00 AM", value: "11:00" },
  { label: "12:00 PM", value: "12:00" },
  { label: "2:00 PM", value: "14:00" },
  { label: "3:00 PM", value: "15:00" },
  { label: "4:00 PM", value: "16:00" },
  { label: "5:00 PM", value: "17:00" },
];

interface InspectionPickerProps {
  onConfirm: (dateTime: string) => void;
  isLoading?: boolean;
  minDate?: Date;
}

export function InspectionPicker({
  onConfirm,
  isLoading = false,
}: InspectionPickerProps) {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  // Build min date string (today by default)

  // Generate next 14 days as date options
  const dateOptions: { label: string; value: string }[] = [];
  for (let i = 1; i <= 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    // Skip Sundays
    if (d.getDay() === 0) continue;
    dateOptions.push({
      value: d.toISOString().split("T")[0],
      label: d.toLocaleDateString("en-NG", {
        weekday: "short",
        day: "numeric",
        month: "short",
      }),
    });
  }

  function handleConfirm() {
    if (!selectedDate || !selectedTime) return;
    onConfirm(`${selectedDate}T${selectedTime}:00`);
  }

  return (
    <div className="space-y-5">
      {/* Date selection */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Calendar size={15} className="text-brand-navy" aria-hidden="true" />
          <p className="text-sm font-semibold text-foreground">Choose a date</p>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {dateOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSelectedDate(opt.value)}
              className={cn(
                "py-2.5 px-2 rounded-lg text-center text-xs font-medium",
                "border-2 transition-all duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selectedDate === opt.value
                  ? "border-brand-navymary-50) text-(--color-primary-700)"
                  : "border-border bg-white text-foreground hover:border-(--color-primary-300)",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Time selection */}
      {selectedDate && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock size={15} className="text-brand-navy" aria-hidden="true" />
            <p className="text-sm font-semibold text-foreground">
              Choose a time
            </p>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {TIME_SLOTS.map((slot) => (
              <button
                key={slot.value}
                onClick={() => setSelectedTime(slot.value)}
                className={cn(
                  "py-2 px-1 rounded-(--radius-md) text-center text-xs font-medium",
                  "border-2 transition-all duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  selectedTime === slot.value
                    ? "border-brand-navy bg-(--color-primary-50) text-(--color-primary-700)"
                    : "border-border bg-white text-foreground hover:border-(--color-primary-300)",
                )}
              >
                {slot.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Confirm */}
      {selectedDate && selectedTime && (
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={handleConfirm}
          isLoading={isLoading}
        >
          Confirm inspection
        </Button>
      )}
    </div>
  );
}
