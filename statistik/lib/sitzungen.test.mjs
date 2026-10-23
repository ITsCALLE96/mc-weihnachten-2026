import { test } from 'node:test';
import assert from 'node:assert/strict';
import { baueSitzungen, tageAusSitzungen } from './sitzungen.mjs';
import { ausBerlin, isoBerlin } from './zeit.mjs';

const t = (d, h, m = 0) => ausBerlin(d, h, m, 0);
const A = 'a'; const B = 'b';

test('einfache Sitzung', () => {
  const s = baueSitzungen([
    { zeit: t('2026-12-06', 18), typ: 'join', uuid: A },
    { zeit: t('2026-12-06', 19), typ: 'quit', uuid: A },
  ], { laeuft: true });
  assert.deepEqual(s, [{ uuid: A, start: t('2026-12-06', 18), ende: t('2026-12-06', 19) }]);
});

test('Absturz: Join ohne Quit, dann Serverstart → Ende beim letzten bekannten Ereignis', () => {
  const s = baueSitzungen([
    { zeit: t('2026-12-06', 18), typ: 'join', uuid: A },
    { zeit: t('2026-12-06', 18, 40), typ: 'tod', uuid: A },
    { zeit: t('2026-12-06', 19), typ: 'start', uuid: null },
  ], { laeuft: true });
  assert.equal(s.length, 1);
  assert.equal(s[0].ende, t('2026-12-06', 18, 40));
});

test('Serverstopp beendet offene Sitzungen', () => {
  const s = baueSitzungen([
    { zeit: t('2026-12-06', 18), typ: 'join', uuid: A },
    { zeit: t('2026-12-06', 18, 30), typ: 'join', uuid: B },
    { zeit: t('2026-12-06', 19), typ: 'stopp', uuid: null },
  ], { laeuft: false });
  assert.deepEqual(s.map((x) => x.ende), [t('2026-12-06', 19), t('2026-12-06', 19)]);
});

test('Logende: läuft → offen, sonst Ende beim letzten Ereignis', () => {
  const ev = [{ zeit: t('2026-12-06', 18), typ: 'join', uuid: A }, { zeit: t('2026-12-06', 18, 50), typ: 'tod', uuid: A }];
  assert.equal(baueSitzungen(ev, { laeuft: true })[0].ende, null);
  assert.equal(baueSitzungen(ev, { laeuft: false })[0].ende, t('2026-12-06', 18, 50));
});

test('Quit ohne Join wird ignoriert', () => {
  assert.deepEqual(baueSitzungen([{ zeit: 5, typ: 'quit', uuid: A }]), []);
});

test('Tage: Sitzung über Mitternacht wird geteilt', () => {
  const tage = tageAusSitzungen(
    [{ uuid: A, start: t('2026-12-06', 23, 10), ende: t('2026-12-07', 0, 40) }],
    { jetzt: t('2026-12-07', 12) },
  );
  assert.deepEqual(tage, [
    { datum: '2026-12-06', min: { [A]: 50 } },
    { datum: '2026-12-07', min: { [A]: 40 } },
  ]);
});

test('Tage: Lücken werden mit leeren Tagen gefüllt, offene Sitzung zählt bis jetzt', () => {
  const tage = tageAusSitzungen(
    [{ uuid: A, start: t('2026-12-06', 20), ende: t('2026-12-06', 21) }, { uuid: B, start: t('2026-12-08', 20), ende: null }],
    { jetzt: t('2026-12-08', 22) },
  );
  assert.deepEqual(tage.map((x) => x.datum), ['2026-12-06', '2026-12-07', '2026-12-08']);
  assert.deepEqual(tage[1].min, {});
  assert.equal(tage[2].min[B], 120);
  assert.equal(isoBerlin(t('2026-12-08', 22)).slice(11, 13), '22');
});
