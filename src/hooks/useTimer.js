"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { loadTimerState, saveTimerState, subscribeToTimer } from "@/services/timerService";
import { createThrottle } from "@/utils/throttle";

function parseState(row) {
  let mama = row.mama_time_ms || 0;
  let papa = row.papa_time_ms || 0;

  if (row.active_parent && row.last_switch_at) {
    const elapsed = Date.now() - new Date(row.last_switch_at).getTime();
    if (row.active_parent === "mama") mama += elapsed;
    else papa += elapsed;
  }

  return {
    mamaTime: mama,
    papaTime: papa,
    activeParent: row.active_parent,
    lastSwitchAt: row.last_switch_at,
    version: row.version || 0,
  };
}

export function useTimer(supabase, familyId) {
  const [activeParent, setActiveParent] = useState(null);
  const [mamaTime, setMamaTime] = useState(0);
  const [papaTime, setPapaTime] = useState(0);
  const [lastSwitchAt, setLastSwitchAt] = useState(null);
  const [conflict, setConflict] = useState(false);

  const intervalRef = useRef(null);
  const lastTickRef = useRef(null);
  const versionRef = useRef(0);
  const throttle = useMemo(() => createThrottle(500), []);

  // Apply state from DB row
  const applyState = useCallback((row) => {
    const state = parseState(row);
    setMamaTime(state.mamaTime);
    setPapaTime(state.papaTime);
    setActiveParent(state.activeParent);
    setLastSwitchAt(state.lastSwitchAt);
    versionRef.current = state.version;
    setConflict(false);
  }, []);

  // Load initial state
  useEffect(() => {
    if (!familyId) return;
    loadTimerState(supabase, familyId).then((data) => {
      if (data) applyState(data);
    });
  }, [familyId, supabase, applyState]);

  // Real-time subscription
  useEffect(() => {
    if (!familyId) return;
    return subscribeToTimer(supabase, familyId, applyState);
  }, [familyId, supabase, applyState]);

  // Local tick
  const tick = useCallback(() => {
    const now = Date.now();
    const delta = now - lastTickRef.current;
    lastTickRef.current = now;

    if (activeParent === "mama") {
      setMamaTime((prev) => prev + delta);
    } else if (activeParent === "papa") {
      setPapaTime((prev) => prev + delta);
    }
  }, [activeParent]);

  useEffect(() => {
    if (activeParent) {
      lastTickRef.current = Date.now();
      intervalRef.current = setInterval(tick, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activeParent, tick]);

  // Get base time without current tick elapsed
  function getBaseTime() {
    let mama = mamaTime;
    let papa = papaTime;

    if (activeParent && lastSwitchAt) {
      const elapsed = Date.now() - new Date(lastSwitchAt).getTime();
      if (activeParent === "mama") mama -= elapsed;
      else papa -= elapsed;
    }

    return { mama: Math.max(0, mama), papa: Math.max(0, papa) };
  }

  async function save(newActive, newMama, newPapa) {
    const result = await saveTimerState(supabase, {
      familyId,
      activeParent: newActive,
      mamaTime: newMama,
      papaTime: newPapa,
      expectedVersion: versionRef.current,
    });

    if (result.conflict) {
      setConflict(true);
      const data = await loadTimerState(supabase, familyId);
      if (data) applyState(data);
      return;
    }

    versionRef.current = result.version;
    setConflict(false);
  }

  const handleSwitch = async (parent) => {
    if (!familyId) return;

    await throttle(async () => {
      const base = getBaseTime();
      let newMama = base.mama;
      let newPapa = base.papa;

      if (activeParent && lastSwitchAt) {
        const elapsed = Date.now() - new Date(lastSwitchAt).getTime();
        if (activeParent === "mama") newMama += elapsed;
        else newPapa += elapsed;
      }

      const newActive = activeParent === parent ? null : parent;

      setActiveParent(newActive);
      setMamaTime(newMama);
      setPapaTime(newPapa);
      setLastSwitchAt(newActive ? new Date().toISOString() : null);

      await save(newActive, newMama, newPapa);
    });
  };

  const handleReset = async () => {
    if (!familyId) return;

    await throttle(async () => {
      setActiveParent(null);
      setMamaTime(0);
      setPapaTime(0);
      setLastSwitchAt(null);
      await save(null, 0, 0);
    });
  };

  const dismissConflict = () => {
    setConflict(false);
    if (familyId) {
      loadTimerState(supabase, familyId).then((data) => {
        if (data) applyState(data);
      });
    }
  };

  return {
    activeParent,
    mamaTime,
    papaTime,
    conflict,
    handleSwitch,
    handleReset,
    dismissConflict,
  };
}
