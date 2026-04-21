// ============================================================
// Setup script: Creates branch login accounts and links them
// Run AFTER cleanup-dummy-data.sql and migration 003
// ============================================================

require("dotenv").config({ path: ".env.local" });

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env.local");
  process.exit(1);
}

const BRANCHES = [
  {
    slug: "des-moines",
    name: "Des Moines",
    email: "desmoines@expresspros.internal",
    password: "express-dsm-2026",
    displayName: "Des Moines Branch",
  },
  {
    slug: "cedar-rapids-iowa-city",
    name: "Cedar Rapids / Iowa City",
    email: "cedarrapids@expresspros.internal",
    password: "express-cr-2026",
    displayName: "Cedar Rapids / Iowa City Branch",
  },
];

// Also create the admin account
const ADMIN = {
  email: "carter.oswood@expresspros.com",
  password: "demo1234",
  name: "Carter Oswood",
};

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function setup() {
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  console.log("\n=== Setting up branches ===\n");

  // First, get branch IDs from the database
  // (branches were created by migration 003)
  for (const branch of BRANCHES) {
    console.log(`--- ${branch.name} ---`);

    // 1. Sign up branch account
    const { data: authData, error: authErr } = await sb.auth.signUp({
      email: branch.email,
      password: branch.password,
      options: {
        data: {
          role: "recruiter",
          name: branch.displayName,
          company: "Express Employment Professionals",
        },
      },
    });

    if (authErr) {
      console.log("  SIGNUP: " + authErr.message);
      // Try to sign in if already exists
      const { data: signInData, error: signInErr } =
        await sb.auth.signInWithPassword({
          email: branch.email,
          password: branch.password,
        });
      if (signInErr) {
        console.log("  SIGNIN: " + signInErr.message);
        console.log("  SKIPPING this branch\n");
        continue;
      }

      // Link to branch
      if (signInData.user) {
        const { data: branchRow } = await sb
          .from("branches")
          .select("id")
          .eq("slug", branch.slug)
          .single();

        if (branchRow) {
          await sb
            .from("profiles")
            .update({ branch_id: branchRow.id })
            .eq("id", signInData.user.id);
          console.log("  LINKED to branch: " + branch.slug);
        }
      }
      await sb.auth.signOut();
      await sleep(300);
      continue;
    }

    const uid = authData.user?.id;
    if (!uid) {
      console.log("  No user ID returned, skipping\n");
      continue;
    }

    // 2. Sign in to get session
    const { data: sessData, error: sessErr } =
      await sb.auth.signInWithPassword({
        email: branch.email,
        password: branch.password,
      });

    if (sessErr || !sessData?.session) {
      console.log("  SIGNIN failed: " + (sessErr?.message || "no session"));
      continue;
    }

    // 3. Get branch ID
    const { data: branchRow } = await sb
      .from("branches")
      .select("id")
      .eq("slug", branch.slug)
      .single();

    if (!branchRow) {
      console.log("  Branch not found in DB: " + branch.slug);
      console.log("  Did you run migration 003?");
      await sb.auth.signOut();
      continue;
    }

    // 4. Update profile with branch_id
    const { error: profileErr } = await sb
      .from("profiles")
      .update({
        name: branch.displayName,
        company: "Express Employment Professionals",
        branch_id: branchRow.id,
        role: "recruiter",
      })
      .eq("id", uid);

    if (profileErr) {
      console.log("  PROFILE ERROR: " + profileErr.message);
    } else {
      console.log("  + Created: " + branch.email);
      console.log("  + Branch ID: " + branchRow.id);
      console.log("  + Password: " + branch.password);
    }

    await sb.auth.signOut();
    await sleep(300);
  }

  // Create admin account
  console.log("\n--- Admin account ---");
  {
    const { data: authData, error: authErr } = await sb.auth.signUp({
      email: ADMIN.email,
      password: ADMIN.password,
      options: {
        data: {
          role: "recruiter",
          name: ADMIN.name,
          company: "Express Employment Professionals",
        },
      },
    });

    if (authErr) {
      console.log("  " + ADMIN.email + ": " + authErr.message);
    } else if (authData.user) {
      const { data: sessData } = await sb.auth.signInWithPassword({
        email: ADMIN.email,
        password: ADMIN.password,
      });

      if (sessData?.session) {
        // Link admin to Des Moines branch by default
        const { data: dsmBranch } = await sb
          .from("branches")
          .select("id")
          .eq("slug", "des-moines")
          .single();

        if (dsmBranch) {
          await sb
            .from("profiles")
            .update({
              name: ADMIN.name,
              company: "Express Employment Professionals",
              title: "Staffing Manager",
              city: "Des Moines",
              state: "IA",
              role: "recruiter",
              branch_id: dsmBranch.id,
            })
            .eq("id", authData.user.id);

          console.log("  + " + ADMIN.name + " (linked to Des Moines)");
        }
        await sb.auth.signOut();
      }
    }
  }

  console.log("\n=== Done ===");
  console.log("\nBranch logins:");
  for (const b of BRANCHES) {
    console.log(`  ${b.name}: ${b.email} / ${b.password}`);
  }
  console.log(`  Admin: ${ADMIN.email} / ${ADMIN.password}`);
  console.log("");
}

setup().catch(console.error);
