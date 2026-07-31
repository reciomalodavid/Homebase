(() => {
  "use strict";

  const FIX_VERSION = "1.8.2";
  window.HOMEBASE_VERSION = FIX_VERSION;

  const originalApplyPendingRoster = window.applyPendingRoster;
  const originalApplyRemotePayload = window.applyRemotePayload;

  function rosterDate(item) {
    return item?.rosterData?.sourceDate || item?.date || "";
  }

  function rosterUid(item) {
    if (typeof window.rosterUidOf === "function") return window.rosterUidOf(item);
    const r = item?.rosterData || {};
    const first = r.flights?.[0]?.number || r.ciUtc || r.startUtc || r.code || "activity";
    const last = r.flights?.at?.(-1)?.number || r.coUtc || r.endUtc || "";
    return `${r.sourceDate || item?.date || ""}|${r.kind || "ground"}|${first}|${last}`;
  }

  function isInPeriod(item, meta) {
    const date = rosterDate(item);
    return item?.source === "roster" && date >= meta.periodStart && date <= meta.periodEnd;
  }

  function hardReconcileRoster(items, meta) {
    if (!meta?.periodStart || !meta?.periodEnd) return items || [];

    const activeIds = new Set(Array.isArray(meta.activeRosterIds) ? meta.activeRosterIds : []);
    const activeUids = new Set(Array.isArray(meta.activeRosterUids) ? meta.activeRosterUids : []);
    const useIds = activeIds.size > 0;
    const stamp = Number(meta.updatedAt) || Date.now();

    const reconciled = (items || []).map(item => {
      if (!isInPeriod(item, meta)) return item;

      const active = useIds ? activeIds.has(item.id) : activeUids.has(rosterUid(item));
      if (active) {
        return item.deletedAt || item.rosterRemoved
          ? { ...item, deletedAt: null, rosterRemoved: false, updatedAt: Math.max(Number(item.updatedAt) || 0, stamp) }
          : item;
      }

      return item.deletedAt
        ? item
        : { ...item, deletedAt: stamp, rosterRemoved: true, updatedAt: Math.max(Number(item.updatedAt) || 0, stamp) };
    });

    // Si por cualquier motivo quedan dos duties activos el mismo día dentro del periodo,
    // conserva únicamente el que pertenece a la instantánea autoritativa más reciente.
    const activeByDay = new Map();
    for (const item of reconciled) {
      if (!isInPeriod(item, meta) || item.deletedAt) continue;
      const key = rosterDate(item);
      const previous = activeByDay.get(key);
      if (!previous) {
        activeByDay.set(key, item);
        continue;
      }

      const itemAuthoritative = useIds ? activeIds.has(item.id) : activeUids.has(rosterUid(item));
      const previousAuthoritative = useIds ? activeIds.has(previous.id) : activeUids.has(rosterUid(previous));
      if (itemAuthoritative && !previousAuthoritative) activeByDay.set(key, item);
    }

    return reconciled.map(item => {
      if (!isInPeriod(item, meta) || item.deletedAt) return item;
      const keeper = activeByDay.get(rosterDate(item));
      if (!keeper || keeper.id === item.id) return item;
      return { ...item, deletedAt: stamp, rosterRemoved: true, updatedAt: Math.max(Number(item.updatedAt) || 0, stamp) };
    });
  }

  window.reconcileRosterSnapshot = hardReconcileRoster;

  if (typeof originalApplyPendingRoster === "function") {
    window.applyPendingRoster = function applyPendingRosterSafe() {
      const plan = window.state?.pendingRosterImport;
      if (!plan) return;

      const activeRosterIds = plan.incoming.map(item => item.id);
      const activeRosterUids = plan.incoming.map(rosterUid);

      originalApplyPendingRoster();

      if (!window.state?.rosterMeta) return;
      window.state.rosterMeta = {
        ...window.state.rosterMeta,
        appVersion: FIX_VERSION,
        activeRosterIds,
        activeRosterUids,
        snapshotVersion: 2
      };
      window.state.items = hardReconcileRoster(window.state.items, window.state.rosterMeta);
      localStorage.setItem("homebase_roster_meta", JSON.stringify(window.state.rosterMeta));
      localStorage.setItem("homebase_v2_items", JSON.stringify(window.state.items));
      if (typeof window.render === "function") window.render();
      if (typeof window.writeCloud === "function") window.writeCloud();
    };
  }

  if (typeof originalApplyRemotePayload === "function") {
    window.applyRemotePayload = function applyRemotePayloadSafe(data) {
      originalApplyRemotePayload(data);
      if (!window.state?.rosterMeta) return;
      window.state.items = hardReconcileRoster(window.state.items, window.state.rosterMeta);
    };
  }

  // Migra la instantánea actual para que la próxima sincronización ya incluya IDs autoritativos.
  if (window.state?.rosterMeta && !Array.isArray(window.state.rosterMeta.activeRosterIds)) {
    const meta = window.state.rosterMeta;
    const ids = (window.state.items || [])
      .filter(item => isInPeriod(item, meta) && !item.deletedAt)
      .filter(item => !Array.isArray(meta.activeRosterUids) || meta.activeRosterUids.includes(rosterUid(item)))
      .map(item => item.id);
    meta.activeRosterIds = ids;
    meta.snapshotVersion = 2;
    meta.appVersion = FIX_VERSION;
    window.state.items = hardReconcileRoster(window.state.items, meta);
    localStorage.setItem("homebase_roster_meta", JSON.stringify(meta));
    localStorage.setItem("homebase_v2_items", JSON.stringify(window.state.items));
    if (typeof window.scheduleCloudSave === "function") window.scheduleCloudSave();
  }
})();
