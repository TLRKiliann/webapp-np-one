import { getSelectedPatient } from "@/app/actions/patients";
import DroiteGaucheAutrui from "@/app/ui/orientation-spatiale-exo/orientatonCorpoExo/DroiteGaucheSoi";
import DroiteGaucheSoi from "@/app/ui/orientation-spatiale-exo/orientatonCorpoExo/DroiteGaucheSoi";
import ImitationDePosture from "@/app/ui/orientation-spatiale-exo/orientatonCorpoExo/ImitationDePosture";
import SchemaCorporel from "@/app/ui/orientation-spatiale-exo/orientatonCorpoExo/SchemaCorporel";
import { OrientationCorpo } from "@/lib/orientation-spatiale";

export default async function OrientationCorpsExo({ params }: { params: Promise<{ id: string }> }) {

    const { id } = await params;
    const selectedPatient = await getSelectedPatient();
    const patientId = selectedPatient?.id ?? null;

    const tasks = {
        "1": {
            title: OrientationCorpo.droiteGaucheSoi.title,
            description: OrientationCorpo.droiteGaucheSoi.title,
            component: <DroiteGaucheSoi patientId={patientId} />
        },
        "2": {
            title: OrientationCorpo.droiteGaucheAutre.title,
            description: OrientationCorpo.droiteGaucheAutre.description,
            component: <DroiteGaucheAutrui patientId={patientId} />
        },
        "3": {
            title: OrientationCorpo.schemaCorp.title,
            description: OrientationCorpo.schemaCorp.description,
            component: <SchemaCorporel patientId={patientId} />
        },
        "4": {
            title: OrientationCorpo.imitationPosture.title,
            description: OrientationCorpo.imitationPosture.description,
            component: <ImitationDePosture patientId={patientId} />
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