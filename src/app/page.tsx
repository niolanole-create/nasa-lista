export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        {/*
          Potpis brenda: kada oboje prihvate, traka je gradijent obe boje.
          Ovde stoji kao najava tog vizuelnog elementa (spec sekcija 6).
        */}
        <span
          className="mx-auto mb-6 block h-1.5 w-24 rounded-full"
          style={{
            background:
              "linear-gradient(90deg, var(--accent-a), var(--accent-b))",
          }}
        />
        <h1 className="font-display text-4xl font-semibold tracking-tight">
          Naša lista
        </h1>
        <p className="mt-3 text-muted">
          Zajednička lista ideja i planova za dvoje.
        </p>
        <p className="mt-8 font-mono text-sm text-muted">
          Faza 0 — postavka je spremna.
        </p>
      </div>
    </main>
  );
}
