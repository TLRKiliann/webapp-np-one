import EcritureCompletMot from "@/app/ui/language-exo/ecritureExo/EcritureCompletMot";
import EcritureDictee from "@/app/ui/language-exo/ecritureExo/EcritureDictee";
import EcritureSpontanee from "@/app/ui/language-exo/ecritureExo/EcritureSpontanee";

const tasks = {
    "1": {
        title: "Dictée (dictée de mots réguliers - irréguliers - pseudo-mots)",
        description: "Écrire sous dictée",
        component: <EcritureDictee />
    },
    "2": {
        title: "Complètement de mots écrits",
        description: "Compléter un mot avec les lettres manquantes",
        component: <EcritureCompletMot />
    },
    "3": {
        title: "Écriture spontanée",
        description: "Décrire une image par écrit",
        component: <EcritureSpontanee />
    }
} as const;

export default async function EcritureExo({params}: {params: Promise<{ id: string }>}) {

    const {id} = await params;
    const task = tasks[id as keyof typeof tasks];

    return (
        <div>
            <h1 className="text-2xl font-bold">{task.title}</h1>
            
            <p className="mt-4 mb-6 ml-4">{task.description}</p>

            <div className="w-auto h-[70vh] border mx-4">
                {task.component}
            </div>

        </div>
    );
};