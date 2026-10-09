const store = new Map();

function split(total, count) {
  const arr = [];
  let rest = Math.floor(total * 100);
  for (let i = 0; i < count; i++) {
    if (i === count - 1) { arr.push(rest / 100); break; }
    const remain = count - i;
    const max = Math.floor(rest / remain * 2);
    const min = 1;
    const money = Math.random() * (max - min + 1) + min;
    const v = Math.floor(money);
    arr.push(v / 100);
    rest -= v;
  }
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.url === '/api/create' && req.method === 'POST') {
    const { total, count } = req.body;
    const id = Math.random().toString(36).slice(2, 10);
    const amounts = split(total, count);
    store.set(id, { total, count, amounts, grabbed: 0, records: [] });
    return res.json({ id });
  }

  if (req.url === '/api/grab' && req.method === 'POST') {
    const { id, name } = req.body;
    const rp = store.get(id);
    if (!rp) return res.status(404).json({ error: '红包不存在' });
    if (rp.grabbed >= rp.count) return res.status(400).json({ error: '红包已被抢光' });
    if (rp.records.find(r => r.name === name)) return res.status(400).json({ error: '你已经抢过这个红包了' });
    const amount = rp.amounts[rp.grabbed];
    rp.grabbed++;
    rp.records.push({ name, amount });
    return res.json({ amount });
  }

  if (req.url.startsWith('/api/status')) {
    const id = new URL(req.url, 'http://x').searchParams.get('id');
    const rp = store.get(id);
    if (!rp) return res.status(404).json({ error: '红包不存在' });
    const best = rp.records.length ? rp.records.reduce((a, b) => b.amount > a.amount ? b : a).name : '';
    return res.json({ count: rp.count, records: rp.records, best });
  }

  return res.status(404).json({ error: 'Not Found' });
};
