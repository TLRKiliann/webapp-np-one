
import AncrageCorporelle from "@/app/ui/orientation-spatiale-exo/strategieCompExo/AncrageCorporelle";
import ExplorationSystemtique from "@/app/ui/orientation-spatiale-exo/strategieCompExo/ExplorationSystemtique";
import PointsRepereSaillants from "@/app/ui/orientation-spatiale-exo/strategieCompExo/PointsRepereSaillants";
import VerbalisationTrajet from "@/app/ui/orientation-spatiale-exo/strategieCompExo/VerbalisationTrajet";
import { StrategieComp } from "@/lib/orientation-spatiale";
import { getSelectedPatient } from "@/app/actions/patients";

export default async function StratCompensationExo({ params }: { params: Promise<{ id: string }> }) {

    const { id } = await params;
    const selectedPatient = await getSelectedPatient();
    const patientId = selectedPatient?.id ?? null;

    const tasks = {
        "1": {
            title: StrategieComp.ancrageCorpo.title,
            description: StrategieComp.ancrageCorpo.description,
            component: <AncrageCorporelle patientId={patientId} />
        },
        "2": {
            title: StrategieComp.verbaTrajet.title,
            description: StrategieComp.verbaTrajet.description,
            component: <VerbalisationTrajet patientId={patientId} />
        },
        "3": {
            title: StrategieComp.pointRepSail.title,
            description: StrategieComp.pointRepSail.description,
            component: <PointsRepereSaillants patientId={patientId} />
        },
        "4": {
            title: StrategieComp.exploSytem.title,
            description: StrategieComp.exploSytem.description,
            component: <ExplorationSystemtique patientId={patientId} />
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