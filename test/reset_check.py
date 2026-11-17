import sys, json
from playwright.sync_api import sync_playwright
with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path='/usr/bin/google-chrome')
    pg = b.new_page(viewport={'width': 1400, 'height': 1000})
    errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route(lambda u: not u.startswith('file:'), lambda r: r.abort())
    pg.goto('file://' + sys.argv[1])
    pg.evaluate("localStorage.clear()"); pg.reload()
    def inv():
        return {'client': pg.input_value('#client'), 'lines': pg.locator('#lines .line').count(),
                'notes': pg.input_value('#notes'), 'total': pg.text_content('#pTotal')}
    pg.fill('#client', 'PT Kopi Senja'); pg.fill('#notes', 'Thanks')
    pg.click('.chip:text-is("Hosting")'); pg.click('.chip:text-is("Design")')
    r = {}
    pg.click('#newInvoice'); r['afterNew'] = inv()
    pg.click('#undoBtn'); r['afterUndoNew'] = inv()
    pg.click('summary')
    pg.fill('#bankName', 'Mandiri'); pg.fill('#bankHolder', 'Nived'); pg.fill('#prefix', 'NIV')
    hp = pg.locator('#presetSettings .preset-set').nth(0).locator('input').nth(1); hp.fill('999.000'); hp.blur()
    def st():
        return {'bank': pg.input_value('#bankName'), 'holder': pg.input_value('#bankHolder'),
                'hostingPrice': pg.locator('#presetSettings .preset-set').nth(0).locator('input').nth(1).input_value(),
                'prefix': pg.input_value('#prefix'),
                'storedBank': pg.evaluate("JSON.parse(localStorage.getItem('nived-invoice-v1')).settings.bankName")}
    pg.click('#resetSettings'); r['afterReset'] = st()
    r['linesKeptOnReset'] = pg.locator('#lines .line').count()
    pg.click('#undoBtn'); r['afterUndoReset'] = st()
    r['errors'] = errs
    b.close()
print(json.dumps(r))
