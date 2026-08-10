import { notFound } from "next/navigation";
import DevLoginButtons from "@/components/DevLoginButtons";

// Dev-only brzi login (bez mejla). U produkciji ne postoji.
export default function DevLogin() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="flex flex-1 items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-warning">
          Dev prijava
        </p>
        <h1 className="mt-2 font-display text-2xl font-semibold">
          Uloguj se kao…
        </h1>
        <p className="mt-2 text-sm text-muted">
          Prvo pokreni <code className="font-mono">npm run seed:dev</code>.
        </p>
        <DevLoginButtons />
      </div>
    </main>
  );
}
