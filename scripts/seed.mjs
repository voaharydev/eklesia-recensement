import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnvLocal() {
  try {
    const raw = readFileSync(resolve(root, ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // .env.local optional if vars already exported
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const PLACEHOLDER_KEYS = new Set([
  "your-service-role-key",
  "your_service_role_key",
]);

if (!url || !key) {
  console.error(
    "Variables manquantes : NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans .env.local",
  );
  process.exit(1);
}

if (PLACEHOLDER_KEYS.has(key) || key.length < 20) {
  console.error(
    "SUPABASE_SERVICE_ROLE_KEY est invalide ou encore le placeholder d'exemple.",
  );
  console.error(
    "Récupérez la clé « service_role » : Supabase Dashboard → Settings → API → service_role (secret),",
  );
  console.error(
    "ou exécutez : supabase projects api-keys --project-ref <ref>",
  );
  console.error(
    "Alternative sans clé API : supabase db query -f supabase/seed.sql --linked",
  );
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const households = [
  {
    id: "a0000001-0001-4001-8001-000000000001",
    name: "Famille Rakoto",
    main_address: "12 rue de l'Église, Antananarivo 101",
  },
  {
    id: "a0000001-0001-4001-8001-000000000002",
    name: "Famille Rasoa",
    main_address: "45 avenue de la Mission, Toamasina 501",
  },
  {
    id: "a0000001-0001-4001-8001-000000000003",
    name: "Famille Andria",
    main_address: "8 lotissement Ankadifotsy, Antananarivo 102",
  },
];

const persons = [
  {
    id: "b0000001-0001-4001-8001-000000000001",
    household_id: "a0000001-0001-4001-8001-000000000001",
    first_name: "Faniry",
    last_name: "Rakoto",
    email: "faniry.rakoto@eklesia.test",
    phone: "+261 32 11 222 33",
    preferred_language: "fr",
    is_visible_in_directory: true,
    is_baptized: true,
    baptized_since: "2010-04-12",
    is_mpiandry: true,
    mpiandry_since: "2018-09-01",
    is_mpandray: false,
    mpandray_since: null,
    is_sefala: false,
    sefala_since: null,
    is_mpamaky_teny: false,
    is_child: false,
    age: 38,
    branches: [{ branch_code: "sekoly_alahady", role: "Chorale" }],
    church_assignments: "Chorale, comité d'accueil",
  },
  {
    id: "b0000001-0001-4001-8001-000000000002",
    household_id: "a0000001-0001-4001-8001-000000000001",
    first_name: "Hery",
    last_name: "Rakoto",
    email: null,
    phone: "+261 32 11 222 34",
    preferred_language: "mg",
    is_visible_in_directory: true,
    is_baptized: true,
    baptized_since: "2015-06-20",
    is_mpiandry: false,
    mpiandry_since: null,
    is_mpandray: false,
    mpandray_since: null,
    is_mpamaky_teny: true,
    is_child: true,
    age: 9,
    branches: [],
    church_assignments: "Catéchisme enfants",
  },
  {
    id: "b0000001-0001-4001-8001-000000000003",
    household_id: "a0000001-0001-4001-8001-000000000002",
    first_name: "Jean",
    last_name: "Rasoa",
    email: "jean.rasoa@eklesia.test",
    phone: "+261 34 22 333 44",
    preferred_language: "fr",
    is_visible_in_directory: true,
    is_baptized: true,
    baptized_since: "1998-03-15",
    is_mpiandry: false,
    mpiandry_since: null,
    is_mpandray: true,
    mpandray_since: "2020-01-10",
    is_sefala: false,
    sefala_since: null,
    is_mpamaky_teny: true,
    is_child: false,
    age: 48,
    branches: [{ branch_code: "aff", role: "Président de filiale" }],
    church_assignments: "Président de filiale, enseignement",
  },
  {
    id: "b0000001-0001-4001-8001-000000000004",
    household_id: "a0000001-0001-4001-8001-000000000002",
    first_name: "Claire",
    last_name: "Rasoa",
    email: "claire.rasoa@eklesia.test",
    phone: null,
    preferred_language: "fr",
    is_visible_in_directory: false,
    is_baptized: true,
    baptized_since: "2001-11-08",
    is_mpiandry: true,
    mpiandry_since: "2016-05-22",
    is_mpandray: false,
    mpandray_since: null,
    is_sefala: false,
    sefala_since: null,
    is_mpamaky_teny: false,
    is_child: false,
    age: 44,
    branches: [{ branch_code: "sampati", role: null }],
    church_assignments: "Diaconie, visites aux malades",
  },
  {
    id: "b0000001-0001-4001-8001-000000000005",
    household_id: "a0000001-0001-4001-8001-000000000002",
    first_name: "Paul",
    last_name: "Rasoa",
    email: null,
    phone: null,
    preferred_language: "fr",
    is_visible_in_directory: true,
    is_baptized: false,
    baptized_since: null,
    is_mpiandry: false,
    mpiandry_since: null,
    is_mpandray: false,
    mpandray_since: null,
    is_sefala: false,
    sefala_since: null,
    is_mpamaky_teny: false,
    is_child: true,
    age: 6,
    branches: [],
    church_assignments: null,
  },
  {
    id: "b0000001-0001-4001-8001-000000000006",
    household_id: "a0000001-0001-4001-8001-000000000003",
    first_name: "Marie",
    last_name: "Andria",
    email: "marie.andria@eklesia.test",
    phone: "+261 33 44 555 66",
    preferred_language: "fr",
    is_visible_in_directory: true,
    is_baptized: true,
    baptized_since: "2005-07-30",
    is_mpiandry: true,
    mpiandry_since: "2014-02-14",
    is_mpandray: true,
    mpandray_since: "2019-08-25",
    is_sefala: false,
    sefala_since: null,
    is_mpamaky_teny: false,
    is_child: false,
    age: 39,
    branches: [{ branch_code: "vaomiera_fananana", role: "Louange" }],
    church_assignments: "Secrétariat paroissial, louange",
  },
];

const householdIds = households.map((h) => h.id);

async function seed() {
  const { error: deletePersonsError } = await supabase
    .from("persons")
    .delete()
    .in("household_id", householdIds);

  if (deletePersonsError) {
    throw new Error(deletePersonsError.message);
  }

  const { error: deleteHouseholdsError } = await supabase
    .from("households")
    .delete()
    .in("id", householdIds);

  if (deleteHouseholdsError) {
    throw new Error(deleteHouseholdsError.message);
  }

  const { error: householdsError } = await supabase
    .from("households")
    .insert(households);

  if (householdsError) {
    throw new Error(householdsError.message);
  }

  const { error: personsError } = await supabase.from("persons").insert(persons);

  if (personsError) {
    throw new Error(personsError.message);
  }

  console.log("Données de test insérées :");
  console.log("  - 3 foyers");
  console.log("  - 6 personnes");
  console.log("");
  console.log("Courriels pour tester la recherche :");
  console.log("  faniry.rakoto@eklesia.test  → Famille Rakoto (2 membres)");
  console.log("  jean.rasoa@eklesia.test     → Famille Rasoa (3 membres)");
  console.log("  marie.andria@eklesia.test   → Famille Andria (1 membre)");
}

seed().catch((err) => {
  console.error("Échec du seed :", err.message);
  process.exit(1);
});
