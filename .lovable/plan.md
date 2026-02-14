

## Ændringer

### 1. Database: Tilføj nye kolonner til `departments`

Opret en migration der tilføjer:
- `chat_enabled BOOLEAN DEFAULT true`
- `files_enabled BOOLEAN DEFAULT true`

### 2. DepartmentContext: Tilføj nye feature-flags

**Fil:** `src/context/DepartmentContext.tsx`

- Tilføj `chat_enabled` og `files_enabled` til `Department` interfacet
- Tilføj `isChatEnabled` og `isFilesEnabled` til context-typen (default `true`, demo altid `true`)
- Læs og map de nye felter i alle fetch-kald (ligesom `warehouse_enabled`)

### 3. FeatureToggleManagement: Tilføj to nye switches

**Fil:** `src/components/Admin/FeatureToggleManagement.tsx`

- Tilføj `chatEnabled` og `filesEnabled` state
- Tilføj to nye toggle-rækker med passende ikoner (`MessageSquare` for chat, `Files` for filer)
- Brug samme `handleToggle`-mønster som de eksisterende toggles

### 4. Translations: Tilføj labels

**Filer:** `src/translations/da/admin.ts` og `src/translations/en/admin.ts`

Tilføj oversættelser for:
- `admin.features.chatEnabled` / `admin.features.filesEnabled`

### 5. AssignmentDetailsDialog: Skjul chat og filer baseret på flags

**Fil:** `src/components/Dashboard/AssignmentDetailsDialog.tsx`

- Importer `useDepartment` og læs `isChatEnabled` / `isFilesEnabled`
- Når `isFilesEnabled === false`: Skjul filer-sektionen (header + panel)
- Når `isChatEnabled === false`: Skjul besked-sidebaren helt
- Når begge er slået fra: Dialogen viser kun opgavedetaljer i fuld bredde

### Filer der ændres

| Fil | Ændring |
|-----|---------|
| Migration (ny fil) | Tilføj `chat_enabled` og `files_enabled` kolonner |
| `src/context/DepartmentContext.tsx` | Nye flags i Department-type og context |
| `src/components/Admin/FeatureToggleManagement.tsx` | To nye toggle-rækker |
| `src/translations/da/admin.ts` | Danske labels |
| `src/translations/en/admin.ts` | Engelske labels |
| `src/components/Dashboard/AssignmentDetailsDialog.tsx` | Betinget visning af chat/filer |

