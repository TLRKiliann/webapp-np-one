"use client";

import { selectPatient } from "@/app/actions/patients";

export default function PatientSelectButton({ patientId }: { patientId: string }) {
    return (
        <form action={() => selectPatient(patientId)}>
            <button
                type="submit"
                className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors duration-200"
            >
                Sélectionner
            </button>
        </form>
    );
}
