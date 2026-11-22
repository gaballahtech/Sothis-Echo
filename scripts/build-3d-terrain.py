#!/usr/bin/env python3
"""
Build a lightweight 3D terrain from AWS Terrain Tiles (terrarium) for the
study sites. Decodes the RGB-encoded elevation, crops to the site window, and
emits ~32 transparent height slices (PNG) + a manifest. The browser stacks the
slices with CSS 3D transforms (no WebGL/Three.js).

Usage:  python scripts/build-3d-terrain.py [site ...]
"""
import json
import math
import os
import subprocess
import sys
import time
import urllib.parse

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public', 'terrain')
TILE_URL = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'
ZOOM = 12
LEVELS = 32
FETCH_TIMEOUT = 40

SITES = {
    'sundarbans': {'bbox': (107.45, 16.45, 107.70, 16.65), 'coords': (16.55, 107.575)},
    'bigsur': {'bbox': (-121.58, 35.97, -121.46, 36.07), 'coords': (36.02, -121.52)},
}


def log(*a):
    print('[terrain]', *a, flush=True)


def calibration_bbox(coords):
    lat, lng = coords
    d_lat = 0.025
    d_lng = 0.025 / max(0.2, math.cos(math.radians(lat)))
    return (lng - d_lng, lat - d_lat, lng + d_lng, lat + d_lat)


def deg2num(lat, lng, z):
    n = 2.0 ** z
    x = (lng + 180.0) / 360.0 * n
    lat_rad = math.radians(lat)
    y = (1.0 - math.log(math.tan(lat_rad) + 1 / math.cos(lat_rad)) / math.pi) / 2.0 * n
    return x, y


def num2deg(x, y, z):
    n = 2.0 ** z
    lng = x / n * 360.0 - 180.0
    lat_rad = math.atan(math.sinh(math.pi * (1 - 2 * y / n)))
    return math.degrees(lat_rad), lng


def fetch_tile(z, x, y):
    url = TILE_URL.format(z=z, x=x, y=y)
    out = subprocess.run(['curl', '-sS', '-m', str(FETCH_TIMEOUT), url],
                         capture_output=True, timeout=FETCH_TIMEOUT + 10)
    if not out.stdout:
        return None
    import io
    return Image.open(io.BytesIO(out.stdout)).convert('RGB')


def decode_terrarium(img):
    arr = np.asarray(img).astype(np.float32)
    height = (arr[:, :, 0] * 256.0 + arr[:, :, 1] + arr[:, :, 2] / 256.0) - 32768.0
    return height


def build_site(site_id):
    site = SITES[site_id]
    bbox = site.get('window') or calibration_bbox(site['coords'])
    w, s, e, n = bbox
    x1, y1 = deg2num(n, w, ZOOM)  # top-left
    x2, y2 = deg2num(s, e, ZOOM)  # bottom-right
    tx1, tx2 = int(math.floor(x1)), int(math.floor(x2))
    ty1, ty2 = int(math.floor(y1)), int(math.floor(y2))
    tiles = {}
    for tx in range(tx1, tx2 + 1):
        for ty in range(ty1, ty2 + 1):
            img = fetch_tile(ZOOM, tx, ty)
            if img is not None:
                tiles[(tx, ty)] = img
    if not tiles:
        log(site_id, 'no tiles'); return
    # mosaic the tiles into one canvas
    W = (tx2 - tx1 + 1) * 256
    H = (ty2 - ty1 + 1) * 256
    mosaic = np.zeros((H, W), dtype=np.float32)
    for (tx, ty), img in tiles.items():
        ox = (tx - tx1) * 256
        oy = (ty - ty1) * 256
        mosaic[oy:oy+256, ox:ox+256] = decode_terrarium(img)
    # crop to the exact bbox within the mosaic
    px1 = (x1 - tx1) * 256
    px2 = (x2 - tx1) * 256
    py1 = (y1 - ty1) * 256
    py2 = (y2 - ty1) * 256
    px1, px2 = int(max(0, px1)), int(min(W, px2))
    py1, py2 = int(max(0, py1)), int(min(H, py2))
    window = mosaic[py1:py2, px1:px2]
    if window.size == 0:
        log(site_id, 'empty window'); return
    # normalize heights to 0..LEVELS-1
    lo, hi = float(np.nanmin(window)), float(np.nanmax(window))
    if hi - lo < 1:
        hi = lo + 1
    norm = np.clip((window - lo) / (hi - lo), 0, 1)
    # resize to output resolution
    out_w, out_h = 560, 370
    img = Image.fromarray((norm * 255).astype(np.uint8))
    img = img.resize((out_w, out_h), Image.BILINEAR)
    arr = np.asarray(img).astype(np.float32) / 255.0
    levels = (arr * (LEVELS - 1)).round().astype(int)
    out_dir = os.path.join(OUT, site_id)
    os.makedirs(out_dir, exist_ok=True)
    # emit one transparent PNG per level
    for level in range(LEVELS):
        rgba = np.zeros((out_h, out_w, 4), dtype=np.uint8)
        mask = levels == level
        # color by height (hypsometric: green low -> brown high)
        t = level / (LEVELS - 1)
        r = int(60 + t * 180)
        g = int(120 - t * 40)
        b = int(80 - t * 60)
        rgba[mask] = (r, g, b, 255)
        Image.fromarray(rgba, 'RGBA').save(os.path.join(out_dir, f'slice-{level:02d}.png'))
    manifest = {
        'site': site_id, 'levels': LEVELS, 'width': out_w, 'height': out_h,
        'bbox': [round(v, 4) for v in bbox], 'elevMin': round(lo, 1), 'elevMax': round(hi, 1),
    }
    with open(os.path.join(out_dir, 'manifest.json'), 'w') as f:
        json.dump(manifest, f)
    log(site_id, 'slices', LEVELS, 'elev', round(lo, 1), '-', round(hi, 1))


def main():
    os.makedirs(OUT, exist_ok=True)
    only = sys.argv[1:] or list(SITES)
    for site_id in only:
        build_site(site_id)


if __name__ == '__main__':
    main()