import sys, json, subprocess, tempfile, os
from playwright.sync_api import sync_playwright
path, outdir = sys.argv[1], sys.argv[2]
def info(f):
    t = subprocess.run(['pdfinfo', f], capture_output=True, text=True).stdout
    d = dict(l.split(':', 1) for l in t.splitlines() if ':' in l)
    return {'pages': int(d['Pages'].strip()), 'size': d['Page size'].strip()}
with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path='/usr/bin/google-chrome')
    pg = b.new_page(viewport={'width': 1400, 'height': 1000}, accept_downloads=True)
    errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route(lambda u: not u.startswith('file:'), lambda r: r.abort())
    pg.goto('file://' + path); pg.evaluate('localStorage.clear()'); pg.reload()
    r = {}
    pg.fill('#client', 'Warkop Pasundan')
    pg.fill('#address', 'Jl. Setia Budi Tengah No. 14\nKuningan, Jakarta Selatan 12910')
    pg.click('.chip:text-is("Bloom Package Plan")'); pg.click('.chip:text-is("Review Card")')
    pg.locator('#lines .line').nth(0).locator('input').nth(3).fill('300.000')
    pg.click('summary'); pg.fill('#bankAcc', '123 456 7890')
    pg.click('#editToggle')  # download must leave edit mode
    with pg.expect_download() as d:
        pg.click('#download')
    dl = d.value
    r['filename'] = dl.suggested_filename
    f1 = os.path.join(outdir, 'short.pdf'); dl.save_as(f1)
    r['short'] = info(f1)
    r['numberAfter'] = pg.input_value('#number')
    r['editingAfter'] = pg.evaluate("document.getElementById('invoice').classList.contains('editing')")
    for _ in range(30):
        pg.click('.chip:text-is("Hosting")')
    with pg.expect_download() as d:
        pg.click('#download')
    f2 = os.path.join(outdir, 'long.pdf'); d.value.save_as(f2)
    r['long'] = info(f2)
    r['errors'] = errs
    b.close()
subprocess.run(['pdftoppm','-r','72','-png','-f','1','-l','1',f1,os.path.join(outdir,'m')])
from PIL import Image
im = Image.open(os.path.join(outdir,'m-1.png')).convert('L')
w,h = im.size
left = next((x for x in range(w) if any(im.getpixel((x,y)) < 200 for y in range(0,h,2))), w)
r['leftMarginPx'] = left
print(json.dumps(r))
