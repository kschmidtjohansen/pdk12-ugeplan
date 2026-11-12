"""Train the room-layout model (HorizonNet design) on Polygon's own data.

Data folders use HorizonNet's layout: <dir>/img/*.png (1024 x 512) and <dir>/label_cor/*.txt
(per corner: "x y_ceiling" and "x y_floor" lines). They are made by synth.py (synthetic rooms)
and export_polyplan.py (rooms confirmed in PolyPlan).

    # 1. learn the geometry on synthetic rooms
    python train.py --train data/synth --valid data/synth_valid --out ckpt/synth --epochs 30
    # 2. fine-tune on Polygon's own confirmed rooms
    python train.py --train data/polyplan/train --valid data/polyplan/valid --init ckpt/synth/best.pth --out ckpt/polygon --epochs 60 --lr 1e-4

Use a machine with an NVIDIA GPU (a rented cloud GPU is fine); on a CPU it is only good for checking that the code runs.
"""
import argparse, os, time, json
import numpy as np
import torch
import torch.nn.functional as F
from torch.utils.data import DataLoader

from horizonnet.model import HorizonNet
from horizonnet.dataset import PanoCorBonDataset


def build(backbone, pretrained):
    return HorizonNet(backbone, use_rnn=True, pretrained=pretrained)


def losses(net, x, y_bon, y_cor, dev):
    y_bon_, y_cor_ = net(x.to(dev))
    lb = F.l1_loss(y_bon_, y_bon.to(dev)); lc = F.binary_cross_entropy_with_logits(y_cor_, y_cor.to(dev))
    return lb, lc


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--train', required=True, nargs='+'); ap.add_argument('--valid', nargs='+')
    ap.add_argument('--out', required=True); ap.add_argument('--init')
    ap.add_argument('--backbone', default='resnet50'); ap.add_argument('--no-imagenet', action='store_true',
                    help='start the backbone from scratch instead of ImageNet weights')
    ap.add_argument('--epochs', type=int, default=30); ap.add_argument('--batch', type=int, default=4)
    ap.add_argument('--lr', type=float, default=3e-4); ap.add_argument('--workers', type=int, default=4)
    ap.add_argument('--max-iters', type=int, default=0, help='stop after this many steps (smoke test)')
    a = ap.parse_args()
    dev = 'cuda' if torch.cuda.is_available() else 'cpu'
    os.makedirs(a.out, exist_ok=True)
    tr = torch.utils.data.ConcatDataset([PanoCorBonDataset(d, flip=True, rotate=True, gamma=True, stretch=True) for d in a.train])
    va = torch.utils.data.ConcatDataset([PanoCorBonDataset(d) for d in a.valid]) if a.valid else None
    dl = DataLoader(tr, a.batch, shuffle=True, drop_last=True, num_workers=a.workers, pin_memory=dev == 'cuda')
    net = build(a.backbone, not a.no_imagenet and not a.init).to(dev)
    if a.init:
        net.load_state_dict(torch.load(a.init, map_location=dev)['state_dict'])
    opt = torch.optim.Adam(net.parameters(), lr=a.lr)
    sched = torch.optim.lr_scheduler.OneCycleLR(opt, max_lr=a.lr, total_steps=max(1, a.epochs * len(dl)), pct_start=0.1)
    best, step, log = float('inf'), 0, []
    for ep in range(a.epochs):
        net.train(); t0 = time.time(); tl = []
        for x, y_bon, y_cor in dl:
            lb, lc = losses(net, x, y_bon, y_cor, dev); loss = lb + lc
            opt.zero_grad(); loss.backward(); torch.nn.utils.clip_grad_norm_(net.parameters(), 3.0); opt.step(); sched.step()
            tl.append(loss.item()); step += 1
            if a.max_iters and step >= a.max_iters:
                break
        vl = None
        if va:
            net.eval(); s = []
            with torch.no_grad():
                for i in range(len(va)):
                    x, y_bon, y_cor = va[i]; lb, lc = losses(net, x[None], y_bon[None], y_cor[None], dev); s.append((lb + lc).item())
            vl = float(np.mean(s))
        row = dict(epoch=ep, train=float(np.mean(tl)), valid=vl, sec=round(time.time() - t0)); log.append(row); print(json.dumps(row), flush=True)
        state = dict(state_dict=net.state_dict(), backbone=a.backbone, epoch=ep, valid=vl)
        torch.save(state, os.path.join(a.out, 'last.pth'))
        if (vl if vl is not None else row['train']) < best:
            best = vl if vl is not None else row['train']; torch.save(state, os.path.join(a.out, 'best.pth'))
        if a.max_iters and step >= a.max_iters:
            break
    json.dump(log, open(os.path.join(a.out, 'log.json'), 'w'), indent=1)


if __name__ == '__main__':
    main()
