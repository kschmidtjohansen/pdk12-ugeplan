

## Løsning: Optimer mobilvisning af AssignmentDetailsDialog

Baseret på billedet kan jeg identificere flere problemer med mobilversionen af dialogen:

---

### Identificerede problemer

1. **Filer-sektionens knapper er afskåret** - "Download som PDF" og andre knapper er skåret af på højre side fordi de ligger vandret
2. **Knapper for mærkater overskygger layoutet** - Knapperne i Files-headeren har ikke plads på smalle skærme
3. **Header layout er for bredt** - Lokation + badge + rediger-knap fylder for meget på én linje
4. **Beskeder-sektionen har ikke nok højde på mobil** - Dialogen bruger et 2-kolonne layout der ikke fungerer godt på mobil
5. **Padding er for stor på mobil** - `px-8` (32px) er for meget på smalle skærme

---

### Løsning

**1. Reducer padding på mobil**

Brug responsive padding: `px-4 sm:px-8` i stedet for `px-8`

**2. Header layout - stak elementer vertikalt på mobil**

```tsx
<DialogTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-lg pr-14">
  <div className="flex items-center gap-2">
    <MapPin className="h-5 w-5 text-primary shrink-0" />
    <span className="break-words">{assignment.location}</span>
  </div>
  <div className="flex items-center gap-2">
    <Badge variant={...}>...</Badge>
    {onEdit && <Button ...>Rediger</Button>}
  </div>
</DialogTitle>
```

**3. Filer-header - stak knapper under på mobil**

```tsx
<div className="border-t bg-muted/20">
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-8 py-4 gap-3">
    {/* Toggle button */}
    <button ...>
      <Files className="h-4 w-4 text-primary shrink-0" />
      ...
    </button>
    
    {/* Action buttons - wrap på mobil */}
    <div className="flex flex-wrap items-center gap-2">
      {imageCount > 0 && (
        <Button className="text-sm">
          <FileImage className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">{t('planner.files.downloadAsPdf')}</span>
          <span className="sm:hidden">PDF</span>
        </Button>
      )}
      ...
    </div>
  </div>
</div>
```

**4. Beskeder-header - kortere knaptekst på mobil**

```tsx
<Button ...>
  <Download className="h-4 w-4 mr-1" />
  <span className="hidden sm:inline">{t('planner.messages.exportMessages')}</span>
  <span className="sm:hidden">{t('common.export')}</span>
</Button>
```

**5. Juster minHeight for mobil**

```tsx
<div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden" 
     style={{ minHeight: window.innerWidth < 768 ? '400px' : '500px' }}>
```

Eller brug CSS:
```tsx
className="... min-h-[400px] lg:min-h-[500px]"
```

---

### Filer der ændres

| Fil | Ændring |
|-----|---------|
| `src/components/Dashboard/AssignmentDetailsDialog.tsx` | Tilføj responsive classes og mobil-optimeret layout |

---

### Detaljerede ændringer

**Header (linje 111-140):**
- Reducer padding: `px-4 sm:px-8`
- Stak header-elementer på mobil: `flex-col sm:flex-row`
- Tilføj `shrink-0` til ikoner og `break-words` til tekst

**Filer-sektion (linje 249-312):**
- Reducer padding: `px-4 sm:px-8`
- Stak layout: `flex-col sm:flex-row sm:items-center sm:justify-between`
- Kortere knaptekst på mobil (vis kun ikon + kort tekst)
- Tilføj `gap-3` for at skabe luft mellem elementer

**Beskeder-header (linje 317-345):**
- Reducer padding: `px-3 sm:px-5`
- Kortere eksportknap-tekst på mobil

**Main content container (linje 143):**
- Brug CSS-baseret minHeight i stedet for inline style
- `className="min-h-[400px] lg:min-h-[500px]"`

**ScrollArea indhold (linje 147):**
- Reducer padding: `p-4 sm:p-8`

---

### Visuelt resultat

**Før (mobil):**
```
┌─────────────────────────────────┐
│ Abelonelundvej 20...  [Aftalt] X │  <- Afskåret
├─────────────────────────────────┤
│ 📁 Filer (4)  [Download som PDF | [D... <- Afskåret
├─────────────────────────────────┤
│ 💬 Beskeder        [Eksporter]   │
```

**Efter (mobil):**
```
┌─────────────────────────────────┐
│ Abelonelundvej 20,            X │
│ 5500 Middelfart                 │
│ [Aftalt]                        │
├─────────────────────────────────┤
│ 📁 Filer (📷 4)              [▼] │
│ [PDF] [Download alle]           │  <- Knapper på ny linje
├─────────────────────────────────┤
│ 💬 Beskeder        [⬇ Eksport]  │  <- Kort tekst
```

