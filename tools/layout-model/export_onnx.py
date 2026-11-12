"""Turn a trained checkpoint into the file the 3D page runs in the browser.

    python export_onnx.py --ckpt ckpt/polygon/best.pth --out layout.onnx

Writes layout.onnx (full precision) and layout.int8.onnx (about 4x smaller, for the browser).
Input: "x", 1 x 3 x 512 x 1024, RGB 0..1. Outputs: "bon" (1 x 2 x 1024, ceiling and floor line in
radians from the horizon) and "cor" (1 x 1 x 1024, corner logits).
Upload layout.int8.onnx in the 3D page: Indstillinger -> Plantegningsmodel.
"""
import argparse, os
import numpy as np
import torch
from horizonnet.model import HorizonNet


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--ckpt', required=True); ap.add_argument('--out', default='layout.onnx'); ap.add_argument('--backbone')
    a = ap.parse_args()
    st = torch.load(a.ckpt, map_location='cpu')
    net = HorizonNet(a.backbone or st.get('backbone', 'resnet50'), use_rnn=True, pretrained=False)
    net.load_state_dict(st['state_dict']); net.eval()
    x = torch.rand(1, 3, 512, 1024)
    with torch.no_grad():
        ref = [t.numpy() for t in net(x)]
    torch.onnx.export(net, x, a.out, input_names=['x'], output_names=['bon', 'cor'], opset_version=17, do_constant_folding=True, dynamo=False)
    import onnxruntime as ort
    from onnxruntime.quantization import quantize_dynamic, QuantType
    q = a.out.replace('.onnx', '.int8.onnx')
    quantize_dynamic(a.out, q, weight_type=QuantType.QUInt8)
    for f in (a.out, q):
        out = ort.InferenceSession(f, providers=['CPUExecutionProvider']).run(None, {'x': x.numpy()})
        print('%s: %.1f MB, max difference to PyTorch: bon %.4f rad, cor %.3f' % (f, os.path.getsize(f) / 1e6, np.abs(out[0] - ref[0]).max(), np.abs(out[1] - ref[1]).max()))


if __name__ == '__main__':
    main()
