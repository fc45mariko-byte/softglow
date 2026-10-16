"""Download every Magnific asset listed in assets_manifest.json into public/.

Usage: python3 scripts/fetch_assets.py [--force]

The signed CDN URLs expire at the timestamp in their `exp=` token
(1792368000 = 2026-10-18). After that, re-fetch fresh URLs with
`creations_get` on the creation ids in the manifest.
"""
import json
import pathlib
import sys
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"


def main() -> int:
    force = "--force" in sys.argv
    manifest = json.loads((ROOT / "assets_manifest.json").read_text())
    failed = []
    for asset in manifest["assets"]:
        dest = PUBLIC / asset["path"]
        if dest.exists() and dest.stat().st_size > 0 and not force:
            continue
        dest.parent.mkdir(parents=True, exist_ok=True)
        try:
            with urllib.request.urlopen(asset["url"], timeout=60) as r:
                dest.write_bytes(r.read())
            print("ok  ", asset["path"])
        except Exception as e:  # noqa: BLE001 - report and continue
            failed.append(asset["path"])
            print("FAIL", asset["path"], e)
    print(f"{len(manifest['assets']) - len(failed)}/{len(manifest['assets'])} assets present")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
