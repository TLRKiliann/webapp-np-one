"use client";

import { useState } from "react";
import { createPatient } from "@/app/actions/patients";

export default function PatientForm() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        await createPatient(formData);
        setLoading(false);
        setOpen(false);
    }

    const inputClass =
        "w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm";
    const labelClass = "block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300";

    return (
        <div>
            <button
                onClick={() => setOpen(!open)}
                className="px-5 py-2 bg-green-600 hover:bg-green-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition-colors duration-200"
            >
                {open ? "Annuler" : "+ Nouveau patient"}
            </button>

            {open && (
                <form
                    action={handleSubmit}
                    className="mt-4 p-5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 max-w-lg"
                >
                    <h2 className="text-base font-semibold mb-4 text-slate-800 dark:text-white">
                        Nouveau patient
                    </h2>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Nom *</label>
                            <input type="text" name="nom" required className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Prénom *</label>
                            <input type="text" name="prenom" required className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Date de naissance</label>
                            <input type="date" name="dateNaissance" className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Type d'AVC</label>
                            <input type="text" name="typeAvc" className={inputClass} placeholder="ex: ischémique" />
                        </div>
                        <div className="col-span-2">
                            <label className={labelClass}>Zone atteinte</label>
                            <input type="text" name="zoneAtteinte" className={inputClass} placeholder="ex: lobe frontal gauche" />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-5 px-6 py-2 bg-green-600 hover:bg-green-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition-colors duration-200 disabled:opacity-50"
                    >
                        {loading ? "Enregistrement..." : "Enregistrer"}
                    </button>
                </form>
            )}
        </div>
    );
}
