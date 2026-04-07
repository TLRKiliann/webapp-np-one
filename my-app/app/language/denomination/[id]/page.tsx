import DenoAmorcage from "@/app/ui/language-exo/denominationExo/DenoAmorcage";
import DenoComplement from "@/app/ui/language-exo/denominationExo/DenoComplement";
import DenoConfroVisu from "@/app/ui/language-exo/denominationExo/DenoConfroVisu";
import DenoSurDefinition from "@/app/ui/language-exo/denominationExo/DenoSurDefinition";

const tasks = {
    "1": {
        title: "Dénomination sur confrontation visuelle",
        description: "Nommer un objet affiché (image → mot)",
        component: <DenoConfroVisu />
    },
    "2": {
        title: "Dénomination sur définition",
        description: "Nommer à partir d'une description (définition → mot)",
        component: <DenoSurDefinition />

    },
    "3": {
        title: "Complètement de phrase",
        description: "Compléter une phrase à trou avec l'image comme indice ('on coupe le pain avec un ...')",
        component: <DenoComplement />

    },
    "4": {
        title: "Dénomination avec amorçage",
        description: "Dénomination avec amorçage phonologique (première syllabe donnée en indice)",
        component: <DenoAmorcage />

    }
} as const;

export default async function DenominationExo({params}: {params: Promise<{ id: string }>}) {

    const { id } = await params;

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