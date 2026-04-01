import SimpleHanoiFexec from "@/app/ui/fonctionsExecutives/SimpleHanoiFexec";
import TrailMakingBFexec from "@/app/ui/fonctionsExecutives/TrailMakingBFexec";
import TriCartesFexec from "@/app/ui/fonctionsExecutives/TriCartesFexec";

const tasks = {
    "1": {
        title: "Trail Making B",
        description: "Alterner chiffres et lettres (1-A-2-B...)",
        component: <TrailMakingBFexec />
    },
    "2": {
        title: "Tours de Hanoï simplifiée",
        description: "Déplacer des disques selon des règles",
        component: <SimpleHanoiFexec />
    },
    "3": {
        title: "Tri de cartes (WCST adapté)",
        description: "Deviner la règle de tri qui change",
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
        <div>
            <h1 className="text-3xl font-bold">{task.title}</h1>
            
            <p>{task.description}</p>

            <div className="w-full h-[80vh] border">
                {task.component}
            </div>
        </div>
    );
};