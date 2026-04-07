import { getPatients, getSelectedPatient } from "@/app/actions/patients";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import PatientForm from "./PatientForm";
import PatientSelectButton from "./PatientSelectButton";

export default async function PatientPage() {
    const session = await auth();
    if (!session) redirect("/login");

    const [patientList, selectedPatient] = await Promise.all([
        getPatients(),
        getSelectedPatient(),
    ]);

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold dark:text-white">
                        Patients
                    </h1>
                    {selectedPatient && (
                        <p className="text-sm text-emerald-600 dark:text-green-400 mt-1">
                            Patient actif : <strong>{selectedPatient.prenom} {selectedPatient.nom}</strong>
                        </p>
                    )}
                </div>
                <PatientForm />
            </div>

            {patientList.length === 0 ? (
                <div className="text-center py-16 text-slate-400 dark:text-slate-500">
                    Aucun patient enregistré. Créez-en un pour commencer.
                </div>
            ) : (
                <div className="overflow-hidden border border-slate-200 dark:border-slate-700 rounded-xl">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                            <tr>
                                <th className="text-left px-4 py-3">Nom</th>
                                <th className="text-left px-4 py-3">Prénom</th>
                                <th className="text-left px-4 py-3">Date de naissance</th>
                                <th className="text-left px-4 py-3">Type AVC</th>
                                <th className="text-left px-4 py-3">Zone atteinte</th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {patientList.map((patient) => {
                                const isActive = selectedPatient?.id === patient.id;
                                return (
                                    <tr
                                        key={patient.id}
                                        className={`transition-colors ${
                                            isActive
                                                ? "bg-green-50 dark:bg-indigo-900/30"
                                                : "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800"
                                        }`}
                                    >
                                        <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">
                                            {patient.nom}
                                        </td>
                                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                                            {patient.prenom}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                                            {patient.dateNaissance ?? "—"}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                                            {patient.typeAvc ?? "—"}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                                            {patient.zoneAtteinte ?? "—"}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {isActive ? (
                                                <span className="text-xs text-emerald-600 dark:text-green-400 font-semibold">
                                                    Actif
                                                </span>
                                            ) : (
                                                <PatientSelectButton patientId={patient.id} />
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
