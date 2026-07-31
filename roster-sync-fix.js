(() => {
  "use strict";

  const FIX_VERSION = "1.8.2";
  window.HOMEBASE_VERSION = FIX_VERSION;

  const originalApplyPendingRoster = applyPendingRoster;
  const originalApplyRemotePayload = applyRemotePayload;

  function rosterDate(item) {
    return item?.rosterData?.sourceDate || item?.date || "";
  }

  function rosterUid(item) {
    if (typeof rosterUidOf === "function") return rosterUidOf(item);
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

    return (items || []).map(item => {
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
  }

  reconcileRosterSnapshot = hardReconcileRoster;

  applyPendingRoster = function applyPendingRosterSafe() {
    const plan = state.pendingRosterImport;
    if (!plan) return;

    const activeRosterIds = plan.incoming.map(item => item.id);
    const activeRosterUids = plan.incoming.map(rosterUid);

    originalApplyPendingRoster();

    if (!state.rosterMeta) return;
    state.rosterMeta = {
      ...state.rosterMeta,
      appVersion: FIX_VERSION,
      activeRosterIds,
      activeRosterUids,
      snapshotVersion: 2
    };
    state.items = hardReconcileRoster(state.items, state.rosterMeta);
    localStorage.setItem("homebase_roster_meta", JSON.stringify(state.rosterMeta));
    localStorage.setItem("homebase_v2_items", JSON.stringify(state.items));
    render();
    writeCloud();
  };

  applyRemotePayload = function applyRemotePayloadSafe(data) {
    originalApplyRemotePayload(data);
    if (!state.rosterMeta) return;
    state.items = hardReconcileRoster(state.items, state.rosterMeta);
  };

  const applyButton = document.getElementById("applyRosterImport");
  if (applyButton) applyButton.onclick = applyPendingRoster;

  // Migra la instantánea actual para que la próxima sincronización ya incluya IDs autoritativos.
  if (state.rosterMeta && !Array.isArray(state.rosterMeta.activeRosterIds)) {
    const meta = state.rosterMeta;
    meta.activeRosterIds = (state.items || [])
      .filter(item => isInPeriod(item, meta) && !item.deletedAt)
      .filter(item => !Array.isArray(meta.activeRosterUids) || meta.activeRosterUids.includes(rosterUid(item)))
      .map(item => item.id);
    meta.snapshotVersion = 2;
    meta.appVersion = FIX_VERSION;
    state.items = hardReconcileRoster(state.items, meta);
    localStorage.setItem("homebase_roster_meta", JSON.stringify(meta));
    localStorage.setItem("homebase_v2_items", JSON.stringify(state.items));
    scheduleCloudSave();
    render();
  }
})();
