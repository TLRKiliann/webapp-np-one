
import { getSelectedPatient } from "@/app/actions/patients";
import CalendrierInteractif from "@/app/ui/orientation-spatiale-exo/orientationTempoAlloExo/CalendrierInteractif";
import OrientTemporoSpatiale from "@/app/ui/orientation-spatiale-exo/orientationTempoAlloExo/OrientTemporoSpatiale";
import ReorderEvents from "@/app/ui/orientation-spatiale-exo/orientationTempoAlloExo/ReorderEvents";
import { OrientationTempAllo } from "@/lib/orientation-spatiale";

export default async function OrientationTemporelAlloExo({ params }: { params: Promise<{ id: string }> }) {

    const { id } = await params;
    const selectedPatient = await getSelectedPatient();
    const patientId = selectedPatient?.id ?? null;

    const tasks = {
        "1": {
            title: OrientationTempAllo.orientTempoSpatiale.title,
            description: OrientationTempAllo.orientTempoSpatiale.description,
            component: <OrientTemporoSpatiale patientId={patientId} />
        },
        "2": {
            title: OrientationTempAllo.reorderEvents.title,
            description: OrientationTempAllo.reorderEvents.description,
            component: <ReorderEvents patientId={patientId} />
        },
        "3": {
            title: OrientationTempAllo.calendarInteractif.title,
            description: OrientationTempAllo.calendarInteractif.description,
            component: <CalendrierInteractif patientId={patientId} />
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