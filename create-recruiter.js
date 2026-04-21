require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env.local");
  process.exit(1);
}

async function main() {
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const email = "carter.oswood@expresspros.com";
  const password = "demo1234";

  // Step 1: Try signing up
  console.log("1. Signing up " + email + "...");
  const { data: signUpData, error: signUpErr } = await sb.auth.signUp({
    email,
    password,
    options: { data: { role: "recruiter", name: "Carter Oswood", company: "Express Employment Professionals" } },
  });

  if (signUpErr) {
    console.log("   SIGNUP ERROR:", signUpErr.message);
  } else {
    console.log("   SIGNUP OK - user id:", signUpData.user?.id || "none");
    console.log("   Email confirmed?", signUpData.user?.email_confirmed_at ? "YES" : "NO");
    console.log("   Identities:", JSON.stringify(signUpData.user?.identities));
  }

  // Step 2: Try signing in
  console.log("\n2. Signing in...");
  const { data: signInData, error: signInErr } = await sb.auth.signInWithPassword({
    email,
    password,
  });

  if (signInErr) {
    console.log("   SIGNIN ERROR:", signInErr.message);
  } else {
    console.log("   SIGNIN OK - session:", signInData.session ? "YES" : "NO");
  }

  // Step 3: If signed in, update profile
  if (signInData?.session && signInData?.user) {
    console.log("\n3. Updating profile...");
    const { error: profileErr } = await sb.from("profiles")
      .update({
        name: "Carter Oswood",
        company: "Express Employment Professionals",
        title: "Staffing Manager",
        city: "Des Moines",
        state: "IA",
        role: "recruiter",
      })
      .eq("id", signInData.user.id);

    if (profileErr) {
      console.log("   PROFILE ERROR:", profileErr.message);
    } else {
      console.log("   PROFILE OK");
    }

    // Verify the profile
    const { data: profile, error: readErr } = await sb.from("profiles")
      .select("*")
      .eq("id", signInData.user.id)
      .single();

    if (readErr) {
      console.log("   READ ERROR:", readErr.message);
    } else {
      console.log("   PROFILE DATA:", JSON.stringify(profile, null, 2));
    }

    await sb.auth.signOut();
  }

  console.log("\nDone. Try logging in with: " + email + " / " + password);
}

main().catch(console.error);
