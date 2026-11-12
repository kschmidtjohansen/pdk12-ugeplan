"""Training data from PolyPlan: every room an editor has confirmed with "Rummet passer" in "Ret hjørner".

For each confirmed 360 photo it writes the photo (1024 x 512) and the corner labels in the format
train.py reads. Rooms are split into train/valid by tour, so one house never ends up in both.

    export SUPABASE_URL=https://cyuyrpwtkljfiqwgasmn.supabase.co
    export SUPABASE_SERVICE_ROLE_KEY=...      # from Supabase -> Project settings -> API (keep it secret)
    python export_polyplan.py --out data/polyplan

Ceiling corners need the room height: the measured one (scene.roomHeight), else the tour's, else
the photo is skipped (the model would otherwise learn a guessed ceiling line).
"""
import argparse, io, json, math, os, random, sys
import urllib.request, urllib.parse
from PIL import Image

W, H = 1024, 512


def api(url, key, path, raw=False):
    req = urllib.request.Request(url.rstrip('/') + path, headers={'apikey': key, 'Authorization': 'Bearer ' + key})
    with urllib.request.urlopen(req, timeout=120) as r:
        return r.read() if raw else json.loads(r.read())


def rows(url, key, table, select='*'):
    out, step = [], 1000
    while True:
        part = api(url, key, '/rest/v1/%s?select=%s&offset=%d&limit=%d' % (table, select, len(out), step))
        out += part
        if len(part) < step:
            return out


def labels(sc, tour):
    """Corner labels (x, y_ceiling, y_floor in 1024 x 512 pixels), or None when the room can't be labelled."""
    ol = sc.get('outline') or []
    if len(ol) < 3:
        return None
    cam = float(sc.get('camHeight') or tour.get('camHeight') or 0)
    room = float(sc.get('roomHeight') or tour.get('roomHeight') or 0)
    if not cam or not room or room <= cam + 0.2:
        return None
    hc, cors = room - cam, []
    for yaw, pitch in ol:
        if pitch >= -0.5:
            return None
        d = cam / math.tan(math.radians(-pitch))
        x = (yaw / 360 + 0.5) % 1 * W - 0.5
        yc = (0.5 - math.atan2(hc, d) / math.pi) * H - 0.5
        yf = (0.5 + math.atan2(cam, d) / math.pi) * H - 0.5
        cors.append((x, yc, yf))
    return sorted(cors)


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--out', required=True); ap.add_argument('--valid', type=float, default=0.1); ap.add_argument('--seed', type=int, default=0)
    a = ap.parse_args()
    url, key = os.environ.get('SUPABASE_URL'), os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
    if not url or not key:
        sys.exit('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
    tours = {t['id']: t['doc'] for t in rows(url, key, 'p360_tours', 'id,doc')}
    scenes = rows(url, key, 'p360_scenes', 'tour_id,id,doc')
    ok = [s for s in scenes if (s['doc'] or {}).get('layoutOk') and s['doc'].get('kind') != 'model' and s['doc'].get('asset')]
    ids = sorted({s['tour_id'] for s in ok}); random.Random(a.seed).shuffle(ids)
    valid = set(ids[:max(1, int(len(ids) * a.valid))]) if len(ids) > 1 else set()
    n = {'train': 0, 'valid': 0, 'skipped': 0}
    for s in ok:
        sc, tour = s['doc'], tours.get(s['tour_id'], {})
        cors = labels(sc, tour)
        if not cors:
            n['skipped'] += 1; continue
        part = 'valid' if s['tour_id'] in valid else 'train'
        for d in ('img', 'label_cor'):
            os.makedirs(os.path.join(a.out, part, d), exist_ok=True)
        name = '%s_%s' % (s['tour_id'], s['id'])
        data = api(url, key, '/storage/v1/object/p360/' + urllib.parse.quote(sc['asset']), raw=True)
        Image.open(io.BytesIO(data)).convert('RGB').resize((W, H), Image.LANCZOS).save(os.path.join(a.out, part, 'img', name + '.png'))
        with open(os.path.join(a.out, part, 'label_cor', name + '.txt'), 'w') as f:
            for x, yc, yf in cors:
                f.write('%.2f %.2f\n%.2f %.2f\n' % (x, yc, x, yf))
        n[part] += 1
    print(json.dumps(n))


if __name__ == '__main__':
    main()
