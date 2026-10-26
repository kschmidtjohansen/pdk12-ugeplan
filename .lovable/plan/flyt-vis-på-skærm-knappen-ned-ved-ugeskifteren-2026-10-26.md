## Flyt "Vis på skærm"-knappen ned ved ugeskifteren

Skærm-knappen flyttes fra visningsknapperne øverst ned i "Ugens plan"-linjen, lige til højre for "Denne uge". Den vises stadig kun for brugere, der må publicere, og virker som før.

```text
Ugens plan · Uge 39        [‹ Uge 39 ›] [Denne uge] [Skærm]
```

### Teknisk
- `PlannerHeader.tsx`: fjern Monitor-knappen fra headeren; `PlannerWeekNav` får valgfri `onShowOnScreen` og viser knappen efter "Denne uge" når `canPublishTasks`.
- `PlannerPage.tsx`: send `handleShowOnScreen` til `PlannerWeekNav`.
- Tests køres; CHANGELOG opdateres. Ingen publicering.
