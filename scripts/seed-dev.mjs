// Dev seed: pravi test-par (Nikola i Jelena) bez mejla. Idempotentno.
// Pokretanje:  node --env-file=.env.local scripts/seed-dev.mjs
//
// Kredencijali (samo za razvoj) koriste se na /dev/login.

import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !SERVICE) {
  console.error("Pokreni sa: node --env-file=.env.local scripts/seed-dev.mjs");
  process.exit(1);
}

const admin = createClient(URL, SERVICE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export const DEV_USERS = [
  { email: "marko@example.com", name: "Nikola", accent: "#B0335F" },
  { email: "ana@example.com", name: "Jelena", accent: "#0F6B6B" },
];
const DEV_PASSWORD = "Nikolamisesviđa";
const COUPLE_NAME = "Nikola i Jelena";
const INVITE_CODE = "ANAMARKO";

async function findUserByEmail(email) {
  // listUsers je paginiran; za dev je dovoljna prva strana.
  const { data } = await admin.auth.admin.listUsers({ perPage: 200 });
  return data.users.find((u) => u.email === email) ?? null;
}

async function ensureUser({ email }) {
  const existing = await findUserByEmail(email);
  if (existing) return existing.id;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: DEV_PASSWORD,
    email_confirm: true,
  });
  if (error) throw new Error(`createUser(${email}): ${error.message}`);
  return data.user.id;
}

async function main() {
  const ids = [];
  for (const u of DEV_USERS) ids.push(await ensureUser(u));

  // Postoji li već par (preko prvog profila)?
  const { data: p0 } = await admin
    .from("profiles")
    .select("couple_id")
    .eq("id", ids[0])
    .single();

  let coupleId = p0?.couple_id ?? null;

  if (!coupleId) {
    const { data: couple, error } = await admin
      .from("couples")
      .insert({
        name: COUPLE_NAME,
        invite_code: INVITE_CODE,
        created_by: ids[0],
      })
      .select()
      .single();
    if (error) throw new Error(`insert couple: ${error.message}`);
    coupleId = couple.id;
  }

  // Ažuriraj oba profila (ime, boja, par).
  for (let i = 0; i < DEV_USERS.length; i++) {
    const { error } = await admin
      .from("profiles")
      .update({
        display_name: DEV_USERS[i].name,
        accent_color: DEV_USERS[i].accent,
        couple_id: coupleId,
      })
      .eq("id", ids[i]);
    if (error)
      throw new Error(`update profile ${DEV_USERS[i].name}: ${error.message}`);
  }

  console.log("Dev par spreman:");
  for (const u of DEV_USERS) {
    console.log(`  ${u.name}: ${u.email} / ${DEV_PASSWORD}`);
  }
  console.log(`  couple_id: ${coupleId}`);
  console.log("\nUloguj se na http://localhost:3000/dev/login");
}

main().catch((e) => {
  console.error("Seed greška:", e.message);
  process.exit(1);
});
