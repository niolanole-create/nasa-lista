// RLS testovi (spec sekcija 3). Pokretanje:
//   node --env-file=.env.local tests/rls.mjs
//
// Dokazuje:
//  - korisnik iz para B ne može da čita ni menja podatke para A,
//  - vidljivost partnera unutar istog para radi,
//  - ograničenje "max 2 člana po paru" važi.
//
// Koristi service_role SAMO za pripremu/čišćenje test-korisnika.

import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !ANON || !SERVICE) {
  console.error(
    "Nedostaju env promenljive. Pokreni sa: node --env-file=.env.local tests/rls.mjs",
  );
  process.exit(1);
}

const admin = createClient(URL, SERVICE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function userClient() {
  return createClient(URL, ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

let passed = 0;
let failed = 0;
function ok(name) {
  passed++;
  console.log(`  ✓ ${name}`);
}
function bad(name, detail) {
  failed++;
  console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
}
function expect(cond, name, detail) {
  if (cond) ok(name);
  else bad(name, detail);
}

async function makeUser(tag) {
  const email = `rls_${tag}_${Date.now()}@example.com`;
  const password = "TestLozinka123!";
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw new Error(`createUser(${tag}): ${error.message}`);
  const client = userClient();
  const { error: signInErr } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (signInErr) throw new Error(`signIn(${tag}): ${signInErr.message}`);
  return { id: data.user.id, email, client };
}

const cleanup = { userIds: [], coupleIds: [] };

async function run() {
  console.log("Priprema: pravim korisnike A, B, C…");
  const A = await makeUser("a");
  const B = await makeUser("b");
  const C = await makeUser("c");
  cleanup.userIds.push(A.id, B.id, C.id);

  // A pravi par; B se pridružuje (par sada ima 2 člana).
  const { data: coupleA, error: eCreate } = await A.client.rpc(
    "create_couple",
    {
      couple_name: "Par A",
    },
  );
  if (eCreate) throw new Error(`create_couple(A): ${eCreate.message}`);
  cleanup.coupleIds.push(coupleA.id);
  expect(!!coupleA.invite_code, "A napravio par i dobio invite_code");

  const { error: eJoin } = await B.client.rpc("join_couple", {
    code: coupleA.invite_code,
  });
  expect(!eJoin, "B se pridružio paru A preko koda", eJoin?.message);

  console.log("\nOgraničenje: max 2 člana po paru");
  const { error: eThird } = await C.client.rpc("join_couple", {
    code: coupleA.invite_code,
  });
  expect(
    !!eThird,
    "C NE može da se pridruži popunjenom paru",
    "očekivana greška, a prošlo je",
  );

  // C pravi svoj par → A/B i C su u različitim parovima.
  const { data: coupleC, error: eCreateC } = await C.client.rpc(
    "create_couple",
    {
      couple_name: "Par C",
    },
  );
  if (eCreateC) throw new Error(`create_couple(C): ${eCreateC.message}`);
  cleanup.coupleIds.push(coupleC.id);

  console.log("\nIzolacija parova (glavni kriterijum)");
  // C čita profile iz para A → ništa.
  const { data: tudjiProfili } = await C.client
    .from("profiles")
    .select("*")
    .in("id", [A.id, B.id]);
  expect(
    (tudjiProfili?.length ?? 0) === 0,
    "C NE vidi profile para A",
    `vratilo ${tudjiProfili?.length} redova`,
  );

  // C čita par A → ništa.
  const { data: tudjiPar } = await C.client
    .from("couples")
    .select("*")
    .eq("id", coupleA.id);
  expect(
    (tudjiPar?.length ?? 0) === 0,
    "C NE vidi par A u tabeli couples",
    `vratilo ${tudjiPar?.length} redova`,
  );

  // C pokušava da izmeni A-in profil → 0 izmenjenih redova.
  const { data: izmenjeni } = await C.client
    .from("profiles")
    .update({ display_name: "HAKOVANO" })
    .eq("id", A.id)
    .select();
  expect(
    (izmenjeni?.length ?? 0) === 0,
    "C NE može da izmeni A-in profil",
    `izmenio ${izmenjeni?.length} redova`,
  );

  // Potvrda preko admina da A-in profil NIJE promenjen.
  const { data: aProfilPosle } = await admin
    .from("profiles")
    .select("display_name")
    .eq("id", A.id)
    .single();
  expect(
    aProfilPosle?.display_name !== "HAKOVANO",
    "A-in profil je netaknut nakon pokušaja izmene",
  );

  console.log("\nVidljivost unutar para");
  // B vidi sebe i partnera A (isti par) → 2 profila.
  const { data: nasProfili } = await B.client
    .from("profiles")
    .select("id")
    .in("id", [A.id, B.id]);
  expect(
    (nasProfili?.length ?? 0) === 2,
    "B vidi oba profila u svom paru",
    `vratilo ${nasProfili?.length} redova`,
  );

  // B vidi svoj par.
  const { data: nasPar } = await B.client
    .from("couples")
    .select("id")
    .eq("id", coupleA.id);
  expect((nasPar?.length ?? 0) === 1, "B vidi svoj par");

  console.log("\nAktivnosti i odgovori (Faza 2)");
  // A pravi aktivnost u paru A (couple_id/created_by iz DB default-a).
  const { data: akt, error: eAkt } = await A.client
    .from("activities")
    .insert({ title: "Test ideja A" })
    .select()
    .single();
  expect(!eAkt && !!akt?.id, "A pravi aktivnost u svom paru", eAkt?.message);
  const aktId = akt?.id;

  // B (partner) vidi aktivnost; C (drugi par) ne vidi.
  const { data: bVidi } = await B.client
    .from("activities")
    .select("id")
    .eq("id", aktId);
  expect((bVidi?.length ?? 0) === 1, "B vidi aktivnost svog para");

  const { data: cVidi } = await C.client
    .from("activities")
    .select("id")
    .eq("id", aktId);
  expect((cVidi?.length ?? 0) === 0, "C NE vidi aktivnost tuđeg para");

  // Autor ne sme da glasa na svoj predlog.
  const { error: eAutorGlas } = await A.client
    .from("responses")
    .insert({ activity_id: aktId, response: "yes" });
  expect(!!eAutorGlas, "Autor NE može da glasa na svoj predlog", "prošlo je");

  // C (tuđi par) ne sme da odgovori na A-inu aktivnost.
  const { error: eTudjiGlas } = await C.client
    .from("responses")
    .insert({ activity_id: aktId, response: "yes" });
  expect(!!eTudjiGlas, "C NE može da odgovori na tuđu aktivnost", "prošlo je");

  // B odgovara „Hoću" → aktivnost prelazi u accepted (trigger).
  const { error: eBGlas } = await B.client
    .from("responses")
    .insert({ activity_id: aktId, response: "yes" });
  expect(!eBGlas, "B može da odgovori na predlog partnera", eBGlas?.message);

  const { data: aktPosle } = await admin
    .from("activities")
    .select("status")
    .eq("id", aktId)
    .single();
  expect(
    aktPosle?.status === "accepted",
    "Aktivnost prelazi u accepted kad partner kaže „Hoću”",
    `status je ${aktPosle?.status}`,
  );

  // C ne sme da menja tuđu aktivnost.
  const { data: cIzmena } = await C.client
    .from("activities")
    .update({ title: "HAKOVANO" })
    .eq("id", aktId)
    .select();
  expect((cIzmena?.length ?? 0) === 0, "C NE može da izmeni tuđu aktivnost");

  console.log("\nTermini (Faza 3)");
  const kada = "2027-06-15T18:00:00.000Z";
  const { data: predlog, error: ePred } = await A.client.rpc("propose_date", {
    p_activity_id: aktId,
    p_proposed_at: kada,
  });
  expect(!ePred && !!predlog?.id, "A predlaže termin", ePred?.message);

  const { error: eSam } = await A.client.rpc("accept_date", {
    p_proposal_id: predlog.id,
  });
  expect(!!eSam, "Predlagač NE može sam da potvrdi svoj termin", "prošlo je");

  const { error: eCpred } = await C.client.rpc("propose_date", {
    p_activity_id: aktId,
    p_proposed_at: kada,
  });
  expect(
    !!eCpred,
    "C NE može da predlaže termin na tuđoj aktivnosti",
    "prošlo je",
  );

  const { error: eAcc } = await B.client.rpc("accept_date", {
    p_proposal_id: predlog.id,
  });
  expect(!eAcc, "B (drugi partner) potvrđuje termin", eAcc?.message);

  const { data: aktSched } = await admin
    .from("activities")
    .select("status, scheduled_at")
    .eq("id", aktId)
    .single();
  expect(
    aktSched?.status === "scheduled" && !!aktSched?.scheduled_at,
    "Aktivnost je SCHEDULED tek posle druge, nezavisne potvrde",
    `status ${aktSched?.status}`,
  );

  const { error: eNoReason } = await A.client.rpc("cancel_schedule", {
    p_activity_id: aktId,
    p_reason: "",
  });
  expect(!!eNoReason, "Otkazivanje BEZ razloga nije dozvoljeno", "prošlo je");

  const { error: eCancel } = await A.client.rpc("cancel_schedule", {
    p_activity_id: aktId,
    p_reason: "Iskrsla obaveza",
  });
  expect(!eCancel, "Otkazivanje sa razlogom uspeva", eCancel?.message);

  const { data: aktBack } = await admin
    .from("activities")
    .select("status, scheduled_at")
    .eq("id", aktId)
    .single();
  expect(
    aktBack?.status === "accepted" && !aktBack?.scheduled_at,
    "Otkazan termin vraća aktivnost u ACCEPTED",
    `status ${aktBack?.status}`,
  );
}

async function cleanupAll() {
  console.log("\nČišćenje test-podataka…");
  for (const id of cleanup.userIds) {
    await admin.auth.admin.deleteUser(id).catch(() => {});
  }
  if (cleanup.coupleIds.length) {
    await admin.from("couples").delete().in("id", cleanup.coupleIds);
  }
}

try {
  await run();
} catch (e) {
  failed++;
  console.error("\nGreška u testu:", e.message);
} finally {
  await cleanupAll();
}

console.log(`\nRezultat: ${passed} prošlo, ${failed} palo.`);
process.exit(failed === 0 ? 0 : 1);
