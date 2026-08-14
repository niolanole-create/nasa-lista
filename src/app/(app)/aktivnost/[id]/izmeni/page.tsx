import { notFound } from "next/navigation";
import { getCoupleContext } from "@/lib/couple";
import type { Activity } from "@/lib/database.types";
import IzmeniForm from "@/components/IzmeniForm";

export default async function Izmeni({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await getCoupleContext();

  const { data } = await supabase
    .from("activities")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();
  const activity = data as Activity;

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-5 py-6">
      <h1 className="font-display text-2xl font-semibold tracking-tight">
        Izmeni ideju
      </h1>
      <IzmeniForm activity={activity} />
    </main>
  );
}
