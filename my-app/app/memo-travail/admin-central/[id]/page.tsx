import { AdminCentral } from "@/lib/memo-travail";
import DoubleTache from "@/app/ui/memo-travail-exo/admincentralExo/DoubleTache";
import EmpanLecture from "@/app/ui/memo-travail-exo/admincentralExo/EmpanLecture";
import MiseAJourMemo from "@/app/ui/memo-travail-exo/admincentralExo/MiseAJourMemo";
import Nback from "@/app/ui/memo-travail-exo/admincentralExo/Nback";
import TriAvecInterferences from "@/app/ui/memo-travail-exo/admincentralExo/TriAvecInterferences";
import { getSelectedPatient } from "@/app/actions/patients";

export default async function AdminCentralExo({ params }: { params: Promise<{ id: string }> }) {

    const { id } = await params;
    const selectedPatient = await getSelectedPatient();
    const patientId = selectedPatient?.id ?? null;

    const tasks = {
        "1": {
            title: AdminCentral.doubleTache.title,
            description: AdminCentral.doubleTache.description,
            component: <DoubleTache />
        },
        "2": {
            title: AdminCentral.nback.title,
            description: AdminCentral.nback.description,
            component: <Nback />
        },
        "3": {
            title: AdminCentral.majmemo.title,
            description: AdminCentral.majmemo.description,
            component: <MiseAJourMemo patientId={patientId} />
        },
        "4": {
            title: AdminCentral.empanlect.title,
            description: AdminCentral.empanlect.description,
            component: <EmpanLecture patientId={patientId} />
        },
        "5": {
            title: AdminCentral.triavecinter.title,
            description: AdminCentral.triavecinter.description,
            component: <TriAvecInterferences />
        }
    };

    const task = tasks[id as keyof typeof tasks];

    if (!task) {
        return <div>Tâche non trouvée !</div>
    };

    return (
        <div className="p-4">

            <h1 className="text-3xl font-bold">{task.title}</h1>

            <p className="mt-4 mb-6 ml-4">{task.description}</p>

            {!patientId && (
                <p className="mx-4 mb-4 text-sm text-amber-600 dark:text-amber-400">
                    Aucun patient sélectionné — le score ne sera pas enregistré.{" "}
                    <a href="/patient" className="underline hover:text-amber-700 dark:hover:text-amber-300">
                        Sélectionner un patient
                    </a>
                </p>
            )}

            <div className="w-auto h-[70vh] border mx-4">
                {task.component}
            </div>

        </div>
    );
};