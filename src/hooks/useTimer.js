"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { loadTimerState, saveTimerState, subscribeToTimer } from "@/services/timerService";
import { createThrottle } from "@/utils/throttle";

export function useTimer(supabase, familyId) {
  const [activeParticipantId, setActiveParticipantId] = useState(null);
  const [times, setTimes] = useState({}); // { participantId: ms }
  const [lastSwitchAt, setLastSwitchAt] = useState(null);
  const [conflict, setConflict] = useState(false);

  const intervalRef = useRef(null);
  const lastTickRef = useRef(null);
  const versionRef = useRef(0);
  const throttle = useMemo(() => createThrottle(500), []);

  const reload = useCallback(async () => {
    if (!familyId) return;
    const data = await loadTimerState(supabase, familyId);
    setTimes(data.times);
    setActiveParticipantId(data.activeParticipantId);
    setLastSwitchAt(data.lastSwitchAt);
    versionRef.current = data.version;
    setConflict(false);
  }, [familyId, supabase]);

  // Load initial state
  useEffect(() => {
    reload();
  }, [reload]);

  // Real-time subscription — reload on any change
  useEffect(() => {
    if (!familyId) return;
    return subscribeToTimer(supabase, familyId, reload);
  }, [familyId, supabase, reload]);

  // Local tick
  const tick = useCallback(() => {
    if (!activeParticipantId) return;

    const now = Date.now();
    const delta = now - lastTickRef.current;
    lastTickRef.current = now;

    setTimes((prev) => ({
      ...prev,
      [activeParticipantId]: (prev[activeParticipantId] || 0) + delta,
    }));
  }, [activeParticipantId]);

  useEffect(() => {
    if (activeParticipantId) {
      lastTickRef.current = Date.now();
      intervalRef.current = setInterval(tick, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activeParticipantId, tick]);

  // Get base times without current tick elapsed
  function getBaseTimes() {
    const base = { ...times };

    if (activeParticipantId && lastSwitchAt) {
      const elapsed = Date.now() - new Date(lastSwitchAt).getTime();
      base[activeParticipantId] = (base[activeParticipantId] || 0) - elapsed;
      if (base[activeParticipantId] < 0) base[activeParticipantId] = 0;
    }

    return base;
  }

  async function save(newActiveId, newTimes, previousId = null) {
    const result = await saveTimerState(supabase, {
      familyId,
      activeParticipantId: newActiveId,
      previousParticipantId: previousId,
      times: newTimes,
      expectedVersion: versionRef.current,
    });

    if (result.conflict) {
      setConflict(true);
      await reload();
      return;
    }

    versionRef.current = result.version;
    setConflict(false);
  }

  const handleSwitch = async (participantId) => {
    if (!familyId) return;

    await throttle(async () => {
      const base = getBaseTimes();

      // Add elapsed from currently active participant
      if (activeParticipantId && lastSwitchAt) {
        const elapsed = Date.now() - new Date(lastSwitchAt).getTime();
        base[activeParticipantId] = (base[activeParticipantId] || 0) + elapsed;
      }

      const newActiveId = activeParticipantId === participantId ? null : participantId;
      const previousId = activeParticipantId;

      setActiveParticipantId(newActiveId);
      setTimes(base);
      setLastSwitchAt(newActiveId ? new Date().toISOString() : null);

      await save(newActiveId, base, previousId);
    });
  };

  const handleReset = async () => {
    if (!familyId) return;

    await throttle(async () => {
      const previousId = activeParticipantId;
      setActiveParticipantId(null);
      setTimes({});
      setLastSwitchAt(null);
      await save(null, {}, previousId);
    });
  };

  const dismissConflict = () => {
    setConflict(false);
    reload();
  };

  const getTime = (participantId) => times[participantId] || 0;

  const totalTime = Object.values(times).reduce((s, t) => s + t, 0);

  return {
    activeParticipantId,
    lastSwitchAt,
    times,
    totalTime,
    conflict,
    getTime,
    handleSwitch,
    handleReset,
    dismissConflict,
  };
}
