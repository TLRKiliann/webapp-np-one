import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { seances } from "@/lib/db/schema";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const patientId = cookieStore.get("selectedPatientId")?.value;

    if (!patientId) {
      return NextResponse.json({ error: "Aucun patient sélectionné" }, { status: 400 });
    }

    const { fatigue, aDouleur, evaDouleur } = await req.json();

    if (!fatigue || aDouleur === undefined) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    const [seance] = await db.insert(seances).values({
      patientId,
      fatigue,
      aDouleur,
      evaDouleur: aDouleur ? evaDouleur : null,
    }).returning();

    return NextResponse.json({ seanceId: seance.id }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
