import { RegistrationWizard } from "@/components/registration/registration-wizard";

type HomeProps = {
  searchParams?: { email?: string | string[] };
};

export default function Home({ searchParams }: HomeProps) {
  const rawEmail = searchParams?.email;
  const initialEmail =
    typeof rawEmail === "string"
      ? decodeURIComponent(rawEmail).trim()
      : "";
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12 font-[family-name:var(--font-geist-sans)]">
      <main className="mx-auto max-w-3xl">
        <header className="mb-10 text-center sm:text-left">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Recensement
          </h1>
          <p className="mt-2 text-gray-600">
            Commencez par saisir votre courriel : si votre foyer est déjà
            enregistré, vos informations seront préremplies. Sinon, complétez
            l&apos;inscription en trois étapes (membres adultes et enfants du
            foyer).
          </p>
        </header>

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <RegistrationWizard initialEmail={initialEmail} />
        </section>
      </main>
    </div>
  );
}
