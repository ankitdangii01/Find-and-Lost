const { createClient } = require('@supabase/supabase-js');
const SUPA_URL = 'https://jorpuavygpdnrhltqvoo.supabase.co';
const SUPA_KEY = 'sb_publishable_Hr-ewObJJpvCyQQa8BuIEw_YKnyjzvv';
const PASS = 'Demo@Public123';

const people = [
  { email: 'demo.rohan@sati.ac.in', full_name: 'Rohan Mehta', department: 'CSE', year: '3' },
  { email: 'demo.aisha@sati.ac.in', full_name: 'Aisha Khan', department: 'ECE', year: '2' },
  { email: 'demo.varun@sati.ac.in', full_name: 'Varun Patel', department: 'ME', year: '4' },
];

const items = [
  { owner: 0, type: 'lost', title: 'Black Samsung A54 Phone', desc: 'Lost my black Samsung in the library reading hall, 3rd floor. Has a cracked screen protector and a blue silicon case.', category: 'Phone', location: 'Library', daysAgo: 2 },
  { owner: 0, type: 'found', title: 'White ID Card - Student', desc: 'Found in the cafeteria near the east entrance. ID number ends in 4210.', category: 'ID Card', location: 'Cafeteria', daysAgo: 0 },
  { owner: 1, type: 'lost', title: 'Steel Lunch Box', desc: 'Tiffin box with a small dent, dropped near the playground benches.', category: 'Other', location: 'Playground', daysAgo: 1 },
  { owner: 1, type: 'found', title: 'Blue Metal Water Bottle', desc: 'Blue steel bottle with a cat sticker, found in the lecture hall after the 2nd slot.', category: 'Bottle', location: 'Lecture Hall', daysAgo: 0 },
  { owner: 2, type: 'lost', title: 'Black Leather Wallet', desc: 'Dark wallet with a silver clip, contains some cards. Lost near the parking area.', category: 'Wallet', location: 'Parking', daysAgo: 3 },
  { owner: 2, type: 'found', title: 'White Charger & Adapter', desc: 'Fast charger with a frayed cable, found in the computer lab room 204.', category: 'Charger', location: 'Computer Lab', daysAgo: 1 },
  { owner: 0, type: 'found', title: 'Wireless Earphones (Black)', desc: 'Black earbuds with a charging case, found in the auditorium during the fest.', category: 'Earphones', location: 'Auditorium', daysAgo: 2 },
  { owner: 1, type: 'lost', title: 'Engineering Mechanics Book', desc: 'Hardcover blue-cover Engineering Mechanics by R.S. Khurmi, has my name on the inside.', category: 'Book', location: 'Library', daysAgo: 5 },
  { owner: 2, type: 'found', title: 'Silver Keychain', desc: 'Keychain with 3 keys and a small red tag, found outside the main gate.', category: 'Keys', location: 'Main Gate', daysAgo: 3 },
  { owner: 1, type: 'found', title: 'Blue College ID Card', desc: 'Genuine student ID card found near the sports ground.', category: 'ID Card', location: 'Sports Ground', daysAgo: 1 },
];

async function ensureUser(clientCache, person) {
  if (clientCache[person.email]) return clientCache[person.email];
  const c = createClient(SUPA_URL, SUPA_KEY);
  const { data: su, error: upsErr } = await c.auth.signUp({
    email: person.email,
    password: PASS,
    options: { data: { full_name: person.full_name } },
  });
  let userId = su?.user?.id;
  if (upsErr || !userId) {
    const { data: si } = await c.auth.signInWithPassword({ email: person.email, password: PASS });
    userId = si.user?.id;
    if (si.user) {
      await c.from('profiles').update({
        full_name: person.full_name,
        department: person.department,
        year: person.year,
      }).eq('id', si.user.id);
    }
  }
  if (!userId) throw new Error('Could not provision ' + person.email);
  return { c, userId };
}

async function main() {
  const clients = {};
  for (const person of people) {
    const rec = await ensureUser(clients, person);
    clients[person.email] = rec;
  }
  console.log('provisioned users:', people.map((p) => p.email).join(', '));

  for (const p of people) {
    const { error: delErr } = await clients[p.email].c.from('items').delete().eq('user_id', clients[p.email].userId).like('description', '%[seed]%');
    if (delErr) console.log('delete err:', delErr.message);
  }

  let ok = 0;
  for (const it of items) {
    const person = people[it.owner];
    const rec = clients[person.email];
    const created = new Date();
    created.setDate(created.getDate() - it.daysAgo);
    const { error: insErr } = await rec.c.from('items').insert({
      user_id: rec.userId,
      type: it.type,
      title: it.title,
      description: '[seed] ' + it.desc,
      category: it.category,
      location: it.location,
      date_occurred: created.toISOString().split('T')[0],
      status: 'active',
    });
    if (insErr) {
      console.log('FAIL', it.title, insErr.message);
    } else {
      ok++;
      console.log('OK  ', it.title);
    }
  }
  console.log(`\nseeded ${ok}/${items.length}`);
}

main().catch((e) => { console.error(e); process.exit(1); });