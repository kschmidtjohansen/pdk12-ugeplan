## Plan: Translate StatusTimeline labels

Replace the hardcoded `da`/`en` label maps in `src/components/Dashboard/StatusTimeline.tsx` with the existing translation keys under `changeLog.operations.*` and the section title under `changeLog.title`-style keys, so the timeline follows the current app language.

### Changes

**`src/components/Dashboard/StatusTimeline.tsx`**
- Replace `useTranslation` usage to grab `t` (in addition to `currentLanguage`, still needed for `date-fns` locale).
- Remove the inline `getLabel(op, lang)` function and the hardcoded `da`/`en` maps.
- Map operation → translation key:
  - `CREATE`/`CREATED` → `t('changeLog.operations.CREATE')`
  - `UPDATE`/`UPDATED` → `t('changeLog.operations.UPDATE')`
  - `PUBLISH`/`PUBLISHED` → `t('changeLog.operations.PUBLISH')`
  - `DELETE`/`DELETED` → `t('changeLog.operations.DELETE')`
  - `COMPLETE`/`COMPLETED` → new key `changeLog.operations.COMPLETE` (no existing equivalent)
- Replace the inline `'Historik' / 'History'` header with a new translation key `changeLog.history`.

**`src/translations/da/changeLog.ts`**
- Add `operations.COMPLETE: 'Færdiggjort'`
- Add `history: 'Historik'`

**`src/translations/en/changeLog.ts`**
- Add `operations.COMPLETE: 'Completed'`
- Add `history: 'History'`

### Out of scope
- No behavior changes (dot colors, query, ordering, skeleton untouched).
- Other components using hardcoded strings are not modified.
