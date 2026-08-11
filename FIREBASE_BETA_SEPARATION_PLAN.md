# Homebase — Firebase Beta Separation Plan

Date: 2026-08-11
Status: PREPARATION ONLY — no production runtime or Firebase production changes in this branch.

## Verified current state

- Repository: `reciomalodavid/Homebase`.
- Production/default branch: `main`.
- Production HEAD at audit start: `49067306c99843b432b8e85d6deebbdb5355079d` (`Beta 2.3.94 update checker`).
- GitHub Pages publishes the repository and production remains on `main`.
- Current Beta is served from `/beta/` and its loader is `beta/app-2.3.html`.
- Current Beta loader derives its runtime from root `index.html`, isolates LocalStorage with prefix `homebase_beta2__`, and rewrites family documents to `BETA_<syncCode>`.
- Current Beta and Production still use the same Firebase project/config at runtime.
- Beta currently loads Firebase Auth compat and the device authorization/pairing modules.
- Existing secure-rules template `firestore.rules.secure-beta` is a hybrid same-project template and must NOT be deployed as part of the new-project migration without adaptation.

## Non-negotiable safety constraints

1. Production Firebase is the source of truth for Production and must not be modified during Beta separation.
2. `main` production runtime must not be changed during the preparation/migration phase.
3. No current Firestore documents are deleted from the existing Firebase project.
4. No LocalStorage keys, family sync codes, profile IDs, backup formats or production document paths are changed destructively.
5. Existing Beta data must be inventoried and backed up before cutover.
6. New Beta Firebase is populated by COPY, never MOVE.
7. A rollback must be possible by reverting the Beta configuration and redeploying the previous Beta build.
8. No service-account JSON, tokens or private credentials may be committed.

## Target architecture

- Production web: current `main` / root runtime → current Firebase Production project.
- Beta web: `/beta/` runtime → NEW Firebase Beta project.
- Firebase Beta has independent:
  - Auth configuration;
  - Firestore database;
  - Firestore rules;
  - indexes;
  - device invites;
  - family sync documents;
  - Beta backup snapshots.
- GitHub stores versioned Firebase infrastructure files for Beta.
- Firebase Beta deployment is automated through GitHub Actions using short-lived identity (OIDC/WIF preferred), not stored service-account keys.
- Production deployment remains outside this workflow and requires explicit approval.

## Data inventory to copy to the new Beta project

Confirmed Beta Firestore domains to preserve/copy:

1. `homebaseSyncs/BETA_<familyCode>`
   - items
   - rosterMeta
   - profiles
   - profilesUpdatedAt
   - profilePhotos
   - expiries / expiry metadata if present in current Beta runtime
   - authorizedUids / security metadata currently used by Beta security
2. `homebaseBackups/BETA_<familyCode>/snapshots/...` and `chunks/...` if Beta backups exist and are intended to be retained.
3. Active `homebaseDeviceInvites` do not need migration; they are temporary and should be regenerated after cutover.

No production `<familyCode>` documents are copied or altered during this phase unless explicitly required for a read-only backup/inventory operation.

## Migration phases

### Phase 0 — preparation
- Create this isolated Git branch.
- Record verified architecture and rollback plan.
- Do not change production runtime.

### Phase 1 — create Firebase Beta
Manual one-time action may be required in Firebase Console:
- create a new Firebase project for Homebase Beta;
- provide only its Project ID.

Do not configure anything else manually unless requested after the repo-side setup is prepared.

### Phase 2 — repository-side Beta infrastructure
After the new Project ID is known:
- add versioned Beta Firebase rules/index/config files;
- add Beta Firebase web client config in a Beta-only module/config path;
- modify only Beta loader/runtime to initialize/use the Beta Firebase app;
- preserve Production `index.html` Firebase initialization untouched;
- add validation checks that fail if Beta accidentally points at Production;
- prepare GitHub Actions for Beta Firebase infrastructure deployment.

### Phase 3 — backup and copy
Before cutover:
- create/verify current Beta backup;
- inventory source Beta documents;
- copy required Beta documents to new Firebase Beta;
- verify counts/critical fields after copy;
- do not delete source data.

### Phase 4 — controlled Beta cutover
- deploy Beta runtime pointing to new Firebase Beta;
- verify Auth;
- verify existing Beta family data appears;
- verify bidirectional sync on existing devices;
- verify backup/history;
- verify device authorization/pairing;
- verify roster/calendar/profile/expiry critical flows.

### Phase 5 — rollback rehearsal
Rollback path:
1. revert Beta Firebase-config commit or select previous known-good Beta build;
2. redeploy Beta;
3. confirm old shared-project Beta data is still present because source was never deleted;
4. document result.

### Phase 6 — close migration
Only after successful validation:
- mark new Beta Firebase as canonical Beta backend;
- keep legacy `BETA_*` source documents untouched until an explicit later cleanup decision;
- update CURRENT_STATUS / HANDOFF / DECISION_LOG.

## Rules strategy for the NEW Beta Firebase project

Because the new project is Beta-only, the rules should no longer need the hybrid Production temporary-access branch.

Target:
- authenticated Firebase user required;
- `homebaseSyncs/BETA_*` accessible only to authorized device UIDs;
- no collection listing;
- pairing via short-lived invite documents;
- backups inherit family membership authorization;
- deny everything else.

Rules must be validated before deployment and must not contain time-based expiry as the permanent access model.

## Rollback guarantees

The separation is considered safe only if all are true:
- source Firebase Beta documents remain unchanged;
- old Beta runtime commit is known;
- new Beta Firebase data copy is verified;
- rollback instructions are documented;
- production Firebase and production runtime were not changed.

## Completion checklist

- [ ] New Firebase Beta project created.
- [ ] New Project ID recorded.
- [ ] Beta Firebase web app/config created.
- [ ] Firestore enabled in Beta.
- [ ] Anonymous Auth enabled in Beta if the current security model still requires it.
- [ ] Rules versioned.
- [ ] Indexes/config versioned.
- [ ] Beta deploy workflow configured securely.
- [ ] Source Beta backup verified.
- [ ] Source Beta data inventoried.
- [ ] Data copied to new Beta.
- [ ] Beta runtime points only to new Beta Firebase.
- [ ] Production runtime still points only to current Production Firebase.
- [ ] Existing Beta device sync tested.
- [ ] New-device pairing tested.
- [ ] Backup/restore path tested as applicable.
- [ ] Rollback rehearsal passed.
- [ ] Documentation updated.
