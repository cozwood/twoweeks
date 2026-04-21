require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env.local");
  process.exit(1);
}

const SEEKERS = [
  { email: "mike.jensen@demo.test", name: "Mike Jensen", phone: "515-482-3019", city: "Des Moines", title: "Forklift Operator", category: "Skilled Trades", exp: "5-10 yrs", arrangement: "on-site", availability: "2 weeks", salMin: 40000, salMax: 50000, certs: ["Forklift", "OSHA 10"], skills: ["Heavy Lifting", "Inventory", "Forklift"], reasons: ["Underpaid", "Bad mgmt"] },
  { email: "sarah.kowalski@demo.test", name: "Sarah Kowalski", phone: "319-551-7284", city: "Cedar Rapids", title: "CNA", category: "Healthcare", exp: "2-5 yrs", arrangement: "on-site", availability: "immediately", salMin: 30000, salMax: 40000, certs: ["CNA", "CPR/First Aid"], skills: ["Patient Care", "Data Entry"], reasons: ["No growth", "Hours"] },
  { email: "derek.hall@demo.test", name: "Derek Hall", phone: "515-309-4451", city: "Ankeny", title: "Welder", category: "Skilled Trades", exp: "10-15 yrs", arrangement: "on-site", availability: "1 month", salMin: 50000, salMax: 60000, certs: ["OSHA 10"], skills: ["Welding", "Heavy Lifting"], reasons: ["Commute"] },
  { email: "ashley.nguyen@demo.test", name: "Ashley Nguyen", phone: "319-442-8830", city: "Iowa City", title: "Admin Assistant", category: "Operations", exp: "2-5 yrs", arrangement: "hybrid", availability: "2 weeks", salMin: 30000, salMax: 40000, certs: [], skills: ["Excel", "Data Entry", "Customer Service"], reasons: ["Bad culture", "Underpaid"] },
  { email: "brandon.carter@demo.test", name: "Brandon Carter", phone: "563-200-6617", city: "Davenport", title: "CDL Driver", category: "Skilled Trades", exp: "5-10 yrs", arrangement: "on-site", availability: "immediately", salMin: 50000, salMax: 60000, certs: ["CDL"], skills: ["Driving", "Heavy Lifting"], reasons: ["Underpaid"] },
  { email: "tina.martinez@demo.test", name: "Tina Martinez", phone: "515-773-1142", city: "Des Moines", title: "Cashier", category: "Sales & Marketing", exp: "0-2 yrs", arrangement: "flexible", availability: "immediately", salMin: 20000, salMax: 30000, certs: ["ServSafe"], skills: ["Customer Service", "Cash Handling"], reasons: ["Hours", "Bad mgmt"] },
  { email: "jason.burke@demo.test", name: "Jason Burke", phone: "319-880-5593", city: "Waterloo", title: "Electrician", category: "Skilled Trades", exp: "10-15 yrs", arrangement: "on-site", availability: "flexible", salMin: 60000, salMax: 70000, certs: ["OSHA 10"], skills: ["Welding", "Heavy Lifting", "Forklift"], reasons: ["No growth"] },
  { email: "rachel.simmons@demo.test", name: "Rachel Simmons", phone: "515-615-9948", city: "Ames", title: "Bookkeeper", category: "Finance", exp: "5-10 yrs", arrangement: "remote", availability: "2 weeks", salMin: 40000, salMax: 50000, certs: [], skills: ["Excel", "Data Entry", "Inventory"], reasons: ["Bad culture"] },
  { email: "kevin.price@demo.test", name: "Kevin Price", phone: "712-334-2206", city: "Sioux City", title: "Machine Operator", category: "Skilled Trades", exp: "2-5 yrs", arrangement: "on-site", availability: "immediately", salMin: 30000, salMax: 40000, certs: ["Forklift", "OSHA 10"], skills: ["Heavy Lifting", "Forklift", "Inventory"], reasons: ["Underpaid", "Commute"] },
  { email: "lisa.thomas@demo.test", name: "Lisa Thomas", phone: "515-901-4478", city: "Des Moines", title: "Server", category: "Sales & Marketing", exp: "0-2 yrs", arrangement: "flexible", availability: "immediately", salMin: 20000, salMax: 30000, certs: ["ServSafe", "CPR/First Aid"], skills: ["Customer Service", "Cash Handling"], reasons: ["Hours", "Underpaid"] },
  { email: "matt.olson@demo.test", name: "Matt Olson", phone: "515-227-3365", city: "Ankeny", title: "HVAC Tech", category: "Skilled Trades", exp: "15+ yrs", arrangement: "on-site", availability: "1 month", salMin: 70000, salMax: 80000, certs: ["OSHA 10"], skills: ["Welding", "Heavy Lifting"], reasons: ["Bad mgmt"] },
  { email: "amanda.reeves@demo.test", name: "Amanda Reeves", phone: "319-664-8812", city: "Cedar Rapids", title: "Retail Associate", category: "Sales & Marketing", exp: "2-5 yrs", arrangement: "on-site", availability: "2 weeks", salMin: 20000, salMax: 30000, certs: [], skills: ["Customer Service", "Cash Handling", "Inventory"], reasons: ["No growth", "Bad culture"] },
];

const EMPLOYERS = [
  { email: "hiring@acmemfg.demo.test", name: "Dave Krueger", company: "Acme Manufacturing", jobTitle: "Plant Manager", city: "Des Moines" },
  { email: "hr@hawkeyehealth.demo.test", name: "Karen Whitfield", company: "Hawkeye Health Systems", jobTitle: "HR Director", city: "Cedar Rapids" },
  { email: "jobs@prairielogistics.demo.test", name: "Tom Richards", company: "Prairie Logistics", jobTitle: "Operations Lead", city: "Davenport" },
  { email: "recruit@iowafresh.demo.test", name: "Jenny Park", company: "Iowa Fresh Foods", jobTitle: "Hiring Manager", city: "Ankeny" },
];

const PASSWORD = "demo1234";

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function seed() {
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const seekerIds = [];
  const employerIds = [];

  console.log("\n--- Creating seekers ---");
  for (const s of SEEKERS) {
    // Sign up
    const { data: authData, error: authErr } = await sb.auth.signUp({
      email: s.email,
      password: PASSWORD,
      options: { data: { role: "seeker", name: s.name } },
    });
    if (authErr) { console.log("  SKIP " + s.email + ": " + authErr.message); continue; }
    const uid = authData.user && authData.user.id;
    if (!uid) { console.log("  SKIP " + s.email + ": no uid"); continue; }

    // Sign in to get auth token
    const { data: sessData } = await sb.auth.signInWithPassword({ email: s.email, password: PASSWORD });
    if (!sessData || !sessData.session) { console.log("  SKIP " + s.email + ": no session"); continue; }

    // Update profile
    await sb.from("profiles").update({ name: s.name, phone: s.phone, city: s.city, state: "IA" }).eq("id", uid);

    // Create seeker card
    const { error: cardErr } = await sb.from("seeker_cards").insert({
      profile_id: uid, headline: s.title, job_title: s.title, category: s.category,
      years_experience: s.exp, arrangement: s.arrangement, availability: s.availability,
      salary_min: s.salMin, salary_max: s.salMax, city: s.city, state: "IA",
      certifications: s.certs, skills: s.skills, reasons: s.reasons, is_active: true,
    });

    if (cardErr) { console.log("  " + s.name + " - card error: " + cardErr.message); }
    else { console.log("  + " + s.name + " (" + s.title + ", " + s.city + ")"); }

    seekerIds.push(uid);
    await sb.auth.signOut();
    await sleep(300);
  }

  console.log("\n--- Creating employers ---");
  for (const e of EMPLOYERS) {
    const { data: authData, error: authErr } = await sb.auth.signUp({
      email: e.email,
      password: PASSWORD,
      options: { data: { role: "employer", name: e.name, company: e.company, city: e.city } },
    });
    if (authErr) { console.log("  SKIP " + e.email + ": " + authErr.message); continue; }
    const uid = authData.user && authData.user.id;
    if (!uid) { console.log("  SKIP " + e.email + ": no uid"); continue; }

    const { data: sessData } = await sb.auth.signInWithPassword({ email: e.email, password: PASSWORD });
    if (!sessData || !sessData.session) { console.log("  SKIP " + e.email + ": no session"); continue; }

    await sb.from("profiles").update({ name: e.name, company: e.company, title: e.jobTitle, city: e.city, state: "IA" }).eq("id", uid);
    console.log("  + " + e.name + " @ " + e.company);

    employerIds.push(uid);
    await sb.auth.signOut();
    await sleep(300);
  }

  // Create recruiter (Express Employment staff account)
  console.log("\n--- Creating recruiter ---");
  {
    const recEmail = "carter.oswood@expresspros.com";
    const { data: authData, error: authErr } = await sb.auth.signUp({
      email: recEmail,
      password: PASSWORD,
      options: { data: { role: "recruiter", name: "Carter Oswood", company: "Express Employment Professionals" } },
    });
    if (authErr) { console.log("  SKIP " + recEmail + ": " + authErr.message); }
    else {
      const uid = authData.user && authData.user.id;
      if (uid) {
        const { data: sessData } = await sb.auth.signInWithPassword({ email: recEmail, password: PASSWORD });
        if (sessData && sessData.session) {
          await sb.from("profiles").update({ name: "Carter Oswood", company: "Express Employment Professionals", title: "Staffing Manager", city: "Des Moines", state: "IA" }).eq("id", uid);
          console.log("  + Carter Oswood @ Express Employment Professionals");
          await sb.auth.signOut();
        }
      }
    }
    await sleep(300);
  }

  // Create intros: employer shows interest in seekers
  if (employerIds.length >= 4 && seekerIds.length >= 10) {
    console.log("\n--- Creating intros ---");
    const introMap = [
      [0, [0, 2, 8]],   // Acme → Mike, Derek, Kevin
      [1, [1, 3]],       // Hawkeye → Sarah, Ashley
      [2, [4, 0]],       // Prairie → Brandon, Mike
      [3, [5, 9]],       // Iowa Fresh → Tina, Lisa
    ];

    for (const [empIdx, seekerIdxs] of introMap) {
      const { data: sessData } = await sb.auth.signInWithPassword({ email: EMPLOYERS[empIdx].email, password: PASSWORD });
      if (!sessData || !sessData.session) continue;

      for (const sIdx of seekerIdxs) {
        const { error: introErr } = await sb.from("intros").insert({
          employer_id: employerIds[empIdx],
          seeker_id: seekerIds[sIdx],
          status: "pending",
        });
        if (introErr) { console.log("  intro error: " + introErr.message); }
        else { console.log("  + " + EMPLOYERS[empIdx].company + " -> " + SEEKERS[sIdx].name); }
      }
      await sb.auth.signOut();
      await sleep(200);
    }
  }

  console.log("\n=== Done! " + seekerIds.length + " seekers, " + employerIds.length + " employers ===");
  console.log("All passwords: " + PASSWORD + "\n");
}

seed().catch(console.error);
