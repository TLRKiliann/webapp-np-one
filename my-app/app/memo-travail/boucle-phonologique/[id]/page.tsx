import { getSelectedPatient } from "@/app/actions/patients";
import EcouteDichotic from "@/app/ui/memo-travail-exo/bouclephonologiqueExo/EcouteDichotique";
import EmpanEndroit from "@/app/ui/memo-travail-exo/bouclephonologiqueExo/EmpanEndroit";
import EmpanEnvers from "@/app/ui/memo-travail-exo/bouclephonologiqueExo/EmpanEnvers";
import EmpanMots from "@/app/ui/memo-travail-exo/bouclephonologiqueExo/EmpanMots";
import RappelSeriel from "@/app/ui/memo-travail-exo/bouclephonologiqueExo/RappelSeriel";
import { bouclephonologique } from "@/lib/memo-travail";

export default async function BouclePhonoExo({ params }: { params: Promise<{ id: string }> }) {

    const { id } = await params;
    const selectedPatient = await getSelectedPatient();
    const patientId = selectedPatient?.id ?? null;

    const tasks = {
        "1": {
            title: bouclephonologique.empanEndroit.title,
            description: bouclephonologique.empanEndroit.description,
            component: <EmpanEndroit patientId={patientId} />
        },
        "2": {
            title: bouclephonologique.empanEnvers.title,
            description: bouclephonologique.empanEnvers.description,
            component: <EmpanEnvers patientId={patientId} />
        },
        "3": {
            title: bouclephonologique.empanMots.title,
            description: bouclephonologique.empanMots.description,
            component: <EmpanMots patientId={patientId} />
        },
        "4": {
            title: bouclephonologique.rappelSeriel.title,
            description: bouclephonologique.rappelSeriel.description,
            component: <RappelSeriel patientId={patientId} />
        },
        "5": {
            title: bouclephonologique.ecouteDichotic.title,
            description: bouclephonologique.ecouteDichotic.description,
            component: <EcouteDichotic />
        }
    };

    const task = tasks[id as keyof typeof tasks];

    if (!task) {
        return <div>Tâche non trouvée !</div>
    };

    return (
        <div>
            <h1 className="text-2xl font-bold">{task.title}</h1>

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
