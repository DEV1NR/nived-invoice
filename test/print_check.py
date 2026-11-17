import sys, json, subprocess, tempfile, os
from playwright.sync_api import sync_playwright
path = sys.argv[1]
with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path='/usr/bin/google-chrome')
    pg = b.new_page(viewport={'width': 1400, 'height': 1000})
    errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route(lambda u: not u.startswith('file:'), lambda r: r.abort())
    pg.goto('file://' + path)
    pg.fill('#issue', '2027-01-02')
    num = pg.input_value('#number')
    for _ in range(25):
        pg.click('.chip:text-is("Hosting")')
    pg.emulate_media(media='print')
    fd, pdf = tempfile.mkstemp(suffix='.pdf'); os.close(fd)
    pg.pdf(path=pdf, prefer_css_page_size=True, print_background=True)
    b.close()
text = subprocess.run(['pdftotext', '-layout', pdf, '-'], capture_output=True, text=True).stdout
pages = int([l for l in subprocess.run(['pdfinfo', pdf], capture_output=True, text=True).stdout.splitlines() if l.startswith('Pages')][0].split()[1])
os.remove(pdf)
print(json.dumps({'errors': errs, 'numberAfterYearChange': num, 'pdfText': text, 'pages': pages}))
