import EmpanCorsi from "@/app/ui/memo-travail-exo/calpinvisuospatialExo/EmpanCorsi";
import LabyrintheMemo from "@/app/ui/memo-travail-exo/calpinvisuospatialExo/LabyrintheMemo";
import MattrixPattern from "@/app/ui/memo-travail-exo/calpinvisuospatialExo/MattrixPattern";
import MemoPosition from "@/app/ui/memo-travail-exo/calpinvisuospatialExo/MemoPosition";
import RotationMentale from "@/app/ui/memo-travail-exo/calpinvisuospatialExo/RotationMentale";
import { calpinvisuospatial } from "@/lib/memo-travail";
import { getSelectedPatient } from "@/app/actions/patients";

export default async function CalpinVisuoSpatialExo({ params }: { params: Promise<{ id: string }> }) {

    const { id } = await params;
    const selectedPatient = await getSelectedPatient();
    const patientId = selectedPatient?.id ?? null;

    const tasks = {
        "1": {
            title: calpinvisuospatial.empanCorsi.title,
            description: calpinvisuospatial.empanCorsi.description,
            component: <EmpanCorsi patientId={patientId} />
        },
        "2": {
            title: calpinvisuospatial.memoPosition.title,
            description: calpinvisuospatial.memoPosition.description,
            component: <MemoPosition />
        },
        "3": {
            title: calpinvisuospatial.rotationMentale.title,
            description: calpinvisuospatial.rotationMentale.description,
            component: <RotationMentale />
        },
        "4": {
            title: calpinvisuospatial.labyrintheMemo.title,
            description: calpinvisuospatial.labyrintheMemo.description,
            component: <LabyrintheMemo />
        },
        "5": {
            title: calpinvisuospatial.matrixPattern.title,
            description: calpinvisuospatial.matrixPattern.description,
            component: <MattrixPattern />
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