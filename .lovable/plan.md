# Opdatering af beredskabsdokumentet (version 2)

## Mål
Word- og PDF-dokumentet opdateres, så det viser de beredskabsmål, som jeres IT-ansvarlige har godkendt. De oprindelige forslag bliver stående som historik.

## Godkendte mål (står øverst i beredskabsafsnittet)
- Maksimalt datatab (RPO): 1 time
- Læseadgang efter et nedbrud (RTO): inden for 5 minutter
- Fuld skrive- og planlægningsadgang (RTO): inden for 2 timer
- Status: "Godkendt af IT-ansvarlig", dato 22. oktober 2026

## Tidligere forslag (afsnit nedenunder)
- Lille tabel med de oprindelige foreslåede mål og status "Forslag (oprindeligt)". Tabellen viser, at tallene er uændrede ved godkendelsen.

## Øvrige ændringer
- Fjerner bemærkningen om, at målene "skal godkendes af IT", alle steder hvor den står.
- Forside og sidefod får "Version 2 – 22. oktober 2026".
- Alt andet indhold (SWOT, risikotabeller, matrix, tidslinje) forbliver uændret.

## Levering
- Nye filer: `PolyPlan_SWOT_Risikoanalyse_Beredskab_v2.docx` og `..._v2.pdf`. Originalerne bliver ikke overskrevet.
- Hver PDF-side gennemses visuelt for layoutfejl, før filerne leveres.

## Teknisk
- Det oprindelige genereringsscript findes i /tmp eller i chat-historikken og genbruges. Hvis det mangler, redigeres den eksisterende .docx direkte (pakkes ud, XML rettes, pakkes igen), og PDF'en laves med LibreOffice.
- Den nye .docx valideres med docx-skillets validator.
