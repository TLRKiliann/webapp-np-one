"use server";

import { db } from "@/lib/db";
import { patients } from "@/lib/db/schema";
import { auth } from "@/auth";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function getPatients() {
    const session = await auth();
    if (!session?.user?.id) return [];

    return db
        .select()
        .from(patients)
        .where(eq(patients.createdBy, session.user.id));
}

export async function createPatient(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const nom = formData.get("nom") as string;
    const prenom = formData.get("prenom") as string;
    const dateNaissance = formData.get("dateNaissance") as string | null;
    const typeAvc = formData.get("typeAvc") as string | null;
    const zoneAtteinte = formData.get("zoneAtteinte") as string | null;

    await db.insert(patients).values({
        nom: nom.trim(),
        prenom: prenom.trim(),
        dateNaissance: dateNaissance || null,
        typeAvc: typeAvc || null,
        zoneAtteinte: zoneAtteinte || null,
        createdBy: session.user.id,
    });

    redirect("/patient");
}

export async function selectPatient(patientId: string) {
    const cookieStore = await cookies();
    cookieStore.set("selectedPatientId", patientId, {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 8, // 8 heures
    });
    redirect("/");
}

export async function getSelectedPatient() {
    const cookieStore = await cookies();
    const id = cookieStore.get("selectedPatientId")?.value;
    if (!id) return null;

    const [patient] = await db
        .select()
        .from(patients)
        .where(eq(patients.id, id));

    return patient ?? null;
}
