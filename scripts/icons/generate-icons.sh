#!/usr/bin/env bash
# Punkt 3: genererer alle PolyPlan-ikoner fra vektor (public/favicon.svg = master).
# Kræver rsvg-convert + ImageMagick. Kør: bash scripts/icons/generate-icons.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
P='M18 12H35A13 13 0 0 1 35 38H30V52H18ZM30 21H34.5A4 4 0 0 1 34.5 29H30Z'
NAVY='#003E5C'; CYAN='#00AEEF'
# Master / "any": rounded square
cat > public/favicon.svg <<SVG
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"><title>PolyPlan</title><rect width="64" height="64" rx="14" fill="$NAVY"/><path transform="translate(-1 0)" fill="$CYAN" fill-rule="evenodd" d="$P"/></svg>
SVG
T=$(mktemp -d)
# iPhone: full opaque square (iOS rounds corners itself)
echo "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' fill='$NAVY'/><path transform='translate(3.2 3.2) scale(0.9) translate(-1 0)' fill='$CYAN' fill-rule='evenodd' d='$P'/></svg>" > $T/apple.svg
# Maskable: full bleed, P scaled to stay inside the 80% safe zone
echo "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' fill='$NAVY'/><path transform='translate(12.8 12.8) scale(0.6) translate(-1 0)' fill='$CYAN' fill-rule='evenodd' d='$P'/></svg>" > $T/mask.svg
r(){ rsvg-convert -w $2 -h $2 "$1" -o "$3"; }
for s in 16 32 48; do r public/favicon.svg $s public/favicon-${s}x${s}.png; done
r public/favicon.svg 192 public/favicon.png
r public/favicon.svg 192 public/icon-192.png
r public/favicon.svg 512 public/icon-512.png
r $T/apple.svg 180 public/apple-touch-icon.png
magick public/apple-touch-icon.png -alpha off PNG24:public/apple-touch-icon.png
r $T/mask.svg 192 public/icon-maskable-192.png
r $T/mask.svg 512 public/icon-maskable-512.png
magick public/icon-maskable-192.png -alpha off PNG24:public/icon-maskable-192.png
magick public/icon-maskable-512.png -alpha off PNG24:public/icon-maskable-512.png
magick public/favicon-16x16.png public/favicon-32x32.png public/favicon-48x48.png public/favicon.ico
rm -rf $T
echo done
