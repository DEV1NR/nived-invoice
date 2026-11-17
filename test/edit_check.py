import sys, json
from playwright.sync_api import sync_playwright
with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path='/usr/bin/google-chrome')
    pg = b.new_page(viewport={'width': 1400, 'height': 1000})
    errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route(lambda u: not u.startswith('file:'), lambda r: r.abort())
    pg.goto('file://' + sys.argv[1])
    r = {}
    pg.click('.chip:text-is("Custom")')
    pg.click('#editToggle')
    def edit(sel, text):
        el = pg.locator(sel).first
        el.click(); pg.keyboard.press('Control+A'); pg.keyboard.type(text)
    edit('#pClient', 'PT Kopi Senja')
    r['formClient'] = pg.input_value('#client')
    edit('#pLines tr >> nth=0 >> [data-f=desc]', 'Website build')
    edit('#pLines tr >> nth=0 >> [data-f=qty]', '2')
    edit('#pLines tr >> nth=0 >> [data-f=price]', '2000000')
    edit('#pNo', 'NVD-2026-123')
    pg.click('#pClient')
    r['priceCell'] = pg.locator('#pLines tr >> nth=0 >> [data-f=price]').text_content()
    r['amountCell'] = pg.locator('#pLines tr >> nth=0 >> .amt').text_content()
    r['total'] = pg.text_content('#pTotal')
    r['formPrice'] = pg.locator('#lines .line').nth(0).locator('input').nth(3).input_value()
    r['formDesc'] = pg.locator('#lines .line').nth(0).locator('input').nth(0).input_value()
    r['numberForm'] = pg.input_value('#number')
    edit('#pIssue', '20.12.2026'); pg.click('#pClient')
    r['formIssue'] = pg.input_value('#issue')
    edit('#pIssue', 'nonsense'); pg.click('#pClient')
    r['badDateReverted'] = pg.text_content('#pIssue')
    pg.click('#paperAdd')
    r['linesAfterAdd'] = pg.locator('#pLines tr').count()
    pg.locator('#pLines tr >> nth=1 >> .row-rm').click()
    r['linesAfterRemove'] = pg.locator('#pLines tr').count()
    pg.click('#editToggle')
    r['editableWhenDone'] = pg.locator('#invoice [contenteditable]').count()
    r['errors'] = errs
    b.close()
print(json.dumps(r))
