import DodajForm from "@/components/DodajForm";

export default function Dodaj() {
  return (
    <main className="mx-auto w-full max-w-md flex-1 px-5 py-6">
      <h1 className="font-display text-2xl font-semibold tracking-tight">
        Nova ideja
      </h1>
      <p className="mt-1 text-sm text-muted">
        Kad je dodaš, partner dobija da odgovori. Tvoje „da” se podrazumeva.
      </p>
      <DodajForm />
    </main>
  );
}
