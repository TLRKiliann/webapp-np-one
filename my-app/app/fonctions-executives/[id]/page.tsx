import { fonctionsExecutivesLib } from "@/lib/fonction-executives";
import SimpleHanoiFexec from "@/app/ui/fonctions-executives-exo/SimpleHanoiFexec";
import TrailMakingBFexec from "@/app/ui/fonctions-executives-exo/TrailMakingBFexec";
import TriCartesFexec from "@/app/ui/fonctions-executives-exo/TriCartesFexec";

const tasks = {
    "1": {
        title: fonctionsExecutivesLib.trailMakingB.title,
        description: fonctionsExecutivesLib.trailMakingB.description,
        component: <TrailMakingBFexec />
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

export default async function Executives({ params }: { params: Promise<{ id: string }> }) {

    const { id } = await params;
    const task = tasks[id as keyof typeof tasks];

    if (!task) {
        return <div>Tâche non trouvée !</div>
    };

    return (
        <div className="p-4">

            <h1 className="text-3xl font-bold">{task.title}</h1>
            
            <p className="mt-4 mb-6 ml-4">{task.description}</p>

            <div className="w-auto h-[70vh] border mx-4">
                {task.component}
            </div>

        </div>
    );
};