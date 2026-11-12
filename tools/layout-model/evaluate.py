"""How close does the model get to known room sizes?

    python evaluate.py --model layout.int8.onnx --rooms reference.json

reference.json: [{"photo": "path.jpg", "name": "Badeværelse", "dims": [2.08, 1.52], "camHeight": 1.5}, ...]
dims are the true wall lengths (e.g. from a laser or Floorfy). Prints each room's measured size, and
the error after calibrating the whole set with one known wall (the first room's first dim), the way
"Kendt mål" does in the app. The post-processing here mirrors layoutFromModel in the 3D page.
"""
import argparse, json, math
import numpy as np
from PIL import Image
import onnxruntime as ort

W, H = 1024, 512


def layout(bon, cor, cam_h, r=0.05, min_p=0.05):
    pc = 1 / (1 + np.exp(-cor)); ceil, floor = -bon[0], bon[1]
    ok = (ceil > 0.03) & (floor > 0.03); hc = float(np.median((cam_h / np.tan(floor[ok])) * np.tan(ceil[ok]))) if ok.any() else 1.0
    rr = max(3, round(W * r / 2)); peaks = []
    for x in range(W):
        v = pc[x]
        if v < min_p: continue
        if all(pc[(x + d) % W] <= v for d in range(-rr, rr + 1) if d) and not (peaks and x - peaks[-1] < rr): peaks.append(x)
    if len(peaks) < 3: return None
    yaw = lambda x: ((x + 0.5) / W - 0.5) * 2 * math.pi
    def pt(x):
        d = hc / math.tan(max(0.02, ceil[x])); return np.array([d * math.sin(yaw(x)), d * math.cos(yaw(x))])
    lines = []
    for i, a in enumerate(peaks):
        b = peaks[(i + 1) % len(peaks)]; span = (b - a) % W or W
        P = np.array([pt((a + t) % W) for t in range(math.ceil(span * 0.12), int(span * 0.88) + 1)])
        if len(P) < 4: lines.append(None); continue
        m = P.mean(0); c = np.cov((P - m).T); ang = 0.5 * math.atan2(2 * c[0, 1], c[0, 0] - c[1, 1]); lines.append((m, ang))
    angs = [l[1] for l in lines if l]; base = math.atan2(np.mean(np.sin(4 * np.array(angs))), np.mean(np.cos(4 * np.array(angs)))) / 4
    lines = [(l[0], base + round((l[1] - base) / (math.pi / 2)) * math.pi / 2) if l else None for l in lines]
    out = []
    for i in range(len(peaks)):
        l1, l2 = lines[i - 1], lines[i]; q = pt(peaks[i])
        if l1 and l2:
            u1, u2 = np.array([math.cos(l1[1]), math.sin(l1[1])]), np.array([math.cos(l2[1]), math.sin(l2[1])]); den = u1[0] * u2[1] - u1[1] * u2[0]
            if abs(den) > 0.2: t = ((l2[0][0] - l1[0][0]) * u2[1] - (l2[0][1] - l1[0][1]) * u2[0]) / den; q = l1[0] + u1 * t
        out.append(q)
    return np.array(out), cam_h + hc


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--model', required=True); ap.add_argument('--rooms', required=True)
    a = ap.parse_args(); s = ort.InferenceSession(a.model, providers=['CPUExecutionProvider']); res = []
    for r in json.load(open(a.rooms)):
        img = np.asarray(Image.open(r['photo']).convert('RGB').resize((W, H), Image.LANCZOS), np.float32) / 255
        bon, cor = s.run(None, {'x': img.transpose(2, 0, 1)[None]})
        lo = layout(bon[0], cor[0, 0], r.get('camHeight', 1.5))
        if lo is None: print(r['name'], 'no room found'); continue
        pts, rh = lo; d = [float(np.linalg.norm(pts[(i + 1) % len(pts)] - pts[i])) for i in range(len(pts))]
        size = sorted([max(d[0::2]), max(d[1::2])], reverse=True) if len(d) == 4 else sorted(d, reverse=True)[:2]
        res.append((r, size)); print('%-16s model %s m, true %s m, room height %.2f m' % (r['name'], ' x '.join('%.2f' % v for v in size), ' x '.join('%.2f' % v for v in sorted(r['dims'], reverse=True)), rh))
    if res:
        k = sorted(res[0][0]['dims'], reverse=True)[0] / res[0][1][0]; errs = []
        for r, size in res:
            for m, t in zip(size, sorted(r['dims'], reverse=True)): errs.append(abs(m * k - t))
        print('after calibrating with one wall (x%.3f): mean error %.1f cm, worst %.1f cm' % (k, 100 * np.mean(errs), 100 * max(errs)))


if __name__ == '__main__':
    main()
