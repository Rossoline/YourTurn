"use client";

import { useState, useEffect, useCallback } from "react";
import CalendarMonth from "@/components/CalendarMonth";
import DayEvents from "@/components/DayEvents";
import { getEventsForMonth, getEventsForDate } from "@/services/calendarService";
import { useToast } from "@/components/Toast";

export default function CalendarView({ supabase, familyId, userId, participants }) {
  const toast = useToast();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState(null);
  const [monthEvents, setMonthEvents] = useState([]);
  const [dayEvents, setDayEvents] = useState([]);

  const loadMonth = useCallback(async () => {
    if (!familyId) return;
    try {
      const data = await getEventsForMonth(supabase, familyId, year, month);
      setMonthEvents(data);
    } catch (err) {
      console.error("Failed to load month events:", err);
      toast?.("Не вдалося завантажити події", "error");
    }
  }, [supabase, familyId, year, month]);

  useEffect(() => {
    loadMonth();
  }, [loadMonth]);

  const loadDay = useCallback(async () => {
    if (!familyId || !selectedDate) return;
    try {
      const data = await getEventsForDate(supabase, familyId, selectedDate);
      setDayEvents(data);
    } catch (err) {
      console.error("Failed to load day events:", err);
      toast?.("Не вдалося завантажити події дня", "error");
    }
  }, [supabase, familyId, selectedDate]);

  useEffect(() => {
    loadDay();
  }, [loadDay]);

  const handlePrevMonth = () => {
    if (month === 1) {
      setYear(year - 1);
      setMonth(12);
    } else {
      setMonth(month - 1);
    }
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setYear(year + 1);
      setMonth(1);
    } else {
      setMonth(month + 1);
    }
    setSelectedDate(null);
  };

  const handleUpdate = () => {
    loadMonth();
    loadDay();
  };

  return (
    <div className="flex flex-col flex-1 overflow-y-auto px-4 py-4 gap-5">
      <CalendarMonth
        year={year}
        month={month}
        events={monthEvents}
        participants={participants}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
      />

      {selectedDate && (
        <DayEvents
          date={selectedDate}
          events={dayEvents}
          participants={participants}
          familyId={familyId}
          userId={userId}
          supabase={supabase}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}
