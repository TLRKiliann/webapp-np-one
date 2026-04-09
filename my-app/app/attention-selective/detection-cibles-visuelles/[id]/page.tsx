import { DetectionCiblesVisu } from "@/lib/attention-selective";

export default async function DetectionCiblesVisuellesExo({params}: {params: Promise<{id: string}>}) {
    const { id } = await params;
    const selectedPatient = await getSelectedPatient();
    const patientId = selectedPatient?.id ?? null;

    const tasks = {
        "1": {
            title: DetectionCiblesVisu.barrageSimple.title,
            description: DetectionCiblesVisu.barrageSimple.description,
            component: <Truc patientId={patientId} />
        },
        "2": {
            title: DetectionCiblesVisu.barrageDouble.title,
            description: DetectionCiblesVisu.barrageDouble.description,
            component: <Truc patientId={patientId} />
        },
        "3": {
            title: DetectionCiblesVisu.rechVisuSimple.title,
            description: DetectionCiblesVisu.rechVisuSimple.description,
            component: <Truc patientId={patientId} />
        },
        "4": {
            title: DetectionCiblesVisu.rechVisuConjonct.title,
            description: DetectionCiblesVisu.rechVisuConjonct.description,
            component: <Truc patientId={patientId} />
        },
        "5": {
            title: DetectionCiblesVisu.oddOneOut.title,
            description: DetectionCiblesVisu.oddOneOut.description,
            component: <Truc patientId={patientId} />
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
