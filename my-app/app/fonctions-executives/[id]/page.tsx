import { fonctionsExecutivesLib } from "@/lib/fonction-executives";
import SimpleHanoiFexec from "@/app/ui/fonctions-executives-exo/SimpleHanoiFexec";
import TrailMakingBFexec from "@/app/ui/fonctions-executives-exo/TrailMakingBFexec";
import TriCartesFexec from "@/app/ui/fonctions-executives-exo/TriCartesFexec";
import { getSelectedPatient } from "@/app/actions/patients";

export default async function Executives({ params }: { params: Promise<{ id: string }> }) {

    const { id } = await params;
    const selectedPatient = await getSelectedPatient();
    const patientId = selectedPatient?.id ?? null;

    const tasks = {
        "1": {
            title: fonctionsExecutivesLib.trailMakingB.title,
            description: fonctionsExecutivesLib.trailMakingB.description,
            component: <TrailMakingBFexec patientId={patientId} />
        },
        "2": {
            title: fonctionsExecutivesLib.hanoi.title,
            description: fonctionsExecutivesLib.hanoi.description,
            component: <SimpleHanoiFexec />
        },
        "3": {
            title: fonctionsExecutivesLib.tricartes.title,
            description: fonctionsExecutivesLib.tricartes.description,
            component: <TriCartesFexec />
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
