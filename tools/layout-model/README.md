# Plantegningsmodel til 3D-scanninger

En model, der ser på et 360-billede og finder rummets vægge, hjørner og loftshøjde, også bag møbler. Den bruger HorizonNets opbygning (MIT-licens, se `horizonnet/LICENSE`) og bliver trænet på Polygons egne data.

Vi bruger ikke de færdigtrænede modeller fra nettet, fordi de er trænet på datasæt, der kun må bruges til ikke-kommerciel forskning (Structured3D, Zillow ZInD).

## Sådan hænger det sammen

1. **I 3D-siden:**
   1. Under "Ret hjørner" sætter en redaktør hjørnerne præcist (lup, kanter, kendt mål) og trykker **Rummet passer**. Det gemmer `scene.layoutOk`.
   2. Rumhøjden skal være kendt, enten målt eller indtastet under "Rumhøjde". Ellers springes billedet over.
2. **Hent træningsdata:** `export_polyplan.py` henter alle bekræftede rum (billede + hjørner) fra Supabase.
3. **Lav syntetiske rum:** `synth.py` laver tusindvis af syntetiske rum, så modellen først lærer geometrien. Dem laver vi selv, så der er ingen licensbindinger.
4. **Træn:** `train.py` træner, først på de syntetiske rum og derefter på jeres egne.
5. **Gør modellen klar til browseren:** `export_onnx.py` laver en `.onnx`-fil (ca. 25–45 MB).
6. **Mål nøjagtigheden:** `evaluate.py` tjekker modellen mod rum med kendte mål, fx Floorfy-planer eller lasermål.
7. **Tag den i brug:** upload filen i 3D-siden under **Indstillinger → Plantegningsmodel**.
   - Derefter bruger "Ringe og plan automatisk" og knappen **Find rummet** modellen.
   - Modellen kører i brugerens browser (ONNX Runtime Web). Billederne sendes ikke andre steder hen.

## Kom i gang

Det kræver en maskine med NVIDIA-grafikkort, fx en lejet cloud-GPU (RunPod, Lambda, Google Colab Pro) eller en arbejdsstation. På en almindelig pc kan man kun tjekke, at koden kører.

```bash
cd tools/layout-model
python -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt

# 1. syntetiske rum (20.000 tager et par timer på 8 kerner; kør gerne flere --seed parallelt)
python synth.py --out data/synth --n 20000 --seed 1
python synth.py --out data/synth_valid --n 500 --seed 99

# 2. jeres egne bekræftede rum
export SUPABASE_URL=https://cyuyrpwtkljfiqwgasmn.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=...     # hemmelig: Supabase -> Project settings -> API
python export_polyplan.py --out data/polyplan

# 3. træn: først geometrien, så jeres huse
python train.py --train data/synth --valid data/synth_valid --out ckpt/synth --epochs 30
python train.py --train data/polyplan/train --valid data/polyplan/valid --init ckpt/synth/best.pth --out ckpt/polygon --epochs 60 --lr 1e-4

# 4. til browseren, og mål den
python export_onnx.py --ckpt ckpt/polygon/best.pth --out layout.onnx
python evaluate.py --model layout.int8.onnx --rooms reference.json
```

`reference.json` er en liste over rum med kendte mål:

```json
[{ "photo": "fotos/bad.jpg", "name": "Badeværelse", "dims": [2.08, 1.52], "camHeight": 1.5 }]
```

## Hvor mange rum skal der til?

- **Ca. 300 bekræftede rum:** modellen begynder at kende danske boliger.
- **1.000 eller flere:** den er solid.

Gamle Floorfy-sager kan bruges, hvis billederne ligger i 3D-siden. Hjørnerne skal så rettes og bekræftes én gang pr. rum. Det tager ca. 30 sekunder pr. rum med luppen.

Hold rum, der bruges til at måle nøjagtigheden, ude af træningen. `export_polyplan.py` deler efter sag, så samme hus aldrig ender i både træning og test.

## Licenser

- **HorizonNet-koden:** MIT. Den ligger i `horizonnet/` med den oprindelige licens og vores små rettelser, som er markeret.
- **ImageNet-start:** `train.py` starter som standard backbone-netværket (ResNet) fra torchvisions ImageNet-vægte. Det giver hurtigere træning med få data. ImageNet har selv forskningsvilkår.
  - Vil I være helt fri af det, så træn med `--no-imagenet`. Så skal der flere syntetiske rum og flere epoker til.
- **De syntetiske rum og jeres egne billeder:** jeres.

## Filer

| Fil | Hvad den gør |
|---|---|
| `synth.py` | Syntetiske 360-rum med hjørnemærker (firkantede og L-formede rum, døre, vinduer, møbler, lys) |
| `export_polyplan.py` | Bekræftede rum fra PolyPlan → træningsdata |
| `train.py` | Træning (L1 på væglinjer + BCE på hjørner, som HorizonNet) |
| `export_onnx.py` | Checkpoint → `layout.onnx` og `layout.int8.onnx`; tjekker at ONNX giver samme svar som PyTorch |
| `evaluate.py` | Måler mod kendte rumstørrelser, før og efter kalibrering med ét mål |
| `horizonnet/` | Modellen og datasætkoden fra HorizonNet (MIT) |

## Modellens ind- og output

Det skal 3D-siden kunne regne med:

- **Input:** `x`, 1 × 3 × 512 × 1024, RGB 0–1, equirektangulært. Kolonne 0 er bagud (yaw −180°).
- **Output `bon`:** 1 × 2 × 1024. Hvor loft og gulv møder væggen i hver kolonne, i radianer fra horisonten. Loftet er negativt, gulvet positivt.
- **Output `cor`:** 1 × 1 × 1024. Sandsynligheden for et hjørne i hver kolonne, som logit.
- **Efterbehandling:** `layoutFromModel` i 3D-siden laver output om til hjørner, vægge og rumhøjde.
