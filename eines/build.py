#!/usr/bin/env python3
"""Pilot: empaqueta una presentació HTML (tema adria) en un sol fitxer autònom i fora de línia.
Ús: build.py FONT.html SORTIDA.html [--alumnes]   (--alumnes treu les diapos data-sol)"""
import base64, io, re, sys
from pathlib import Path
from fontTools.subset import Options, Subsetter
from fontTools.ttLib import TTFont

AQUI = Path(__file__).parent
KX = AQUI / "node_modules/katex/dist"  # npm install (dins eines/)
ESTIL = Path("/mnt/data/workspace/docencia/plantilles/estil")
NOTO = Path("/usr/share/fonts/truetype/noto")
b64 = lambda b: base64.b64encode(b).decode()

def noto(nom, text):
    f = TTFont(NOTO / f"NotoSans-{nom}.ttf")
    o = Options(); o.flavor = "woff"; o.layout_features = ["*"]
    s = Subsetter(o); s.populate(text=text); s.subset(f)
    buf = io.BytesIO(); f.flavor = "woff"; f.save(buf)
    return buf.getvalue()

def main():
    src, out = Path(sys.argv[1]), Path(sys.argv[2])
    html = src.read_text()
    if "--alumnes" in sys.argv:
        html = html.replace("<body ", '<body data-mode="lectura" ', 1)
        html = re.sub(r'<section class="slide[^"]*"[^>]*\bdata-sol\b.*?</section>\s*', "", html, flags=re.S)
    # caràcters del document + dels ginys (llatí bàsic i català)
    text = re.sub(r"<[^>]+>", "", html) + "".join(map(chr, range(32, 127))) + "àèéíïòóúüçÀÈÉÍÏÒÓÚÜÇ·‹›▶⏩↺–—’«»…"
    fonts = "".join(
        f'@font-face{{font-family:"Noto Sans";font-weight:{w};font-style:{s};src:url(data:font/woff;base64,{b64(noto(n, text))}) format("woff")}}'
        for n, w, s in [("Regular", 400, "normal"), ("Bold", 700, "normal"), ("Italic", 400, "italic"), ("BoldItalic", 700, "italic")])
    kcss = re.sub(r"url\(fonts/([^)]+?\.woff2)\)[^,;}]*(,url\([^)]+\)[^,;}]*)*",
                  lambda m: f'url(data:font/woff2;base64,{b64((KX / "fonts" / m.group(1)).read_bytes())}) format("woff2")',
                  (KX / "katex.min.css").read_text())
    js = "\n".join((p).read_text() for p in [KX / "katex.min.js", KX / "contrib/auto-render.min.js", AQUI / "deck.js"])
    inline = f"<style>{fonts}{kcss}{(AQUI / 'deck.css').read_text()}</style>\n<script>{js.replace('</script', '<\\/script')}</script>"
    html = html.replace("<!--@INLINE-->", inline)
    for nom in ["transparent", "blanc"]:
        html = html.replace(f"@logo:{nom}", "data:image/png;base64," + b64((ESTIL / f"logo_institut_{nom}.png").read_bytes()))
    out.write_text(html)
    print(f"✓ {out} ({out.stat().st_size // 1024} kB)")

main()
