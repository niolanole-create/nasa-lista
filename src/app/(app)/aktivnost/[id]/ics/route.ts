import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Izvoz zakazanog termina kao .ics fajl (spec sekcija 4.3).
const TRAJANJE_MS = 2 * 60 * 60 * 1000; // podrazumevano 2h

function icsDate(d: Date): string {
  return d
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

function esc(text: string): string {
  return text.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: a } = await supabase
    .from("activities")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!a || a.status !== "scheduled" || !a.scheduled_at) {
    return new Response("Termin nije zakazan.", { status: 404 });
  }

  const start = new Date(a.scheduled_at);
  const end = new Date(start.getTime() + TRAJANJE_MS);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Nasa lista//SR",
    "BEGIN:VEVENT",
    `UID:${a.id}@nasa-lista`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${esc(a.title)}`,
    a.description ? `DESCRIPTION:${esc(a.description)}` : null,
    a.location_name ? `LOCATION:${esc(a.location_name)}` : null,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  return new Response(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="nasa-lista-${a.id}.ics"`,
    },
  });
}
