import SimpleHanoiFexec from "@/app/ui/fexec/SimpleHanoiFexec";
import TrailMakingBFexec from "@/app/ui/fexec/TrailMakingBFexec";
import TriCartesFexec from "@/app/ui/fexec/TriCartesFexec";

export default async function Executives({ params }: { params: Promise<{ id: string }> }) {
    
    const { id } = await params;

    const tasks = {
        "1": {
            title: "Trail Making B",
            description: "Alterner chiffres et lettres (1-A-2-B...)"
        },
        "2": {
            title: "Tours de Hanoï simplifiée",
            description: "Déplacer des disques selon des règles"
        },
        "3": {
            title: "Tri de cartes (WCST adapté)",
            description: "Deviner la règle de tri qui change"
        }
    } as const;

    const task = tasks[id as keyof typeof tasks];

    if (!task) {
        return <div>Tâche non trouvée !</div>
    }

    return (
        <div>
            <h1 className="text-cyan-500">{task.title}</h1>

            <p>{task.description}</p>

            <div>
                {id === "1" ? ( 
                    <TrailMakingBFexec />
                ) : id === "2" ? (
                    <SimpleHanoiFexec />
                ) : (
                    <TriCartesFexec />
                )}

            </div>
        </div>
    );
}