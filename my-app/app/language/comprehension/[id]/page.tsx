import AppariementPhrase from "@/app/ui/language-exo/comprehensionExo/AppariementPhrase";
import ComprehensionPropo from "@/app/ui/language-exo/comprehensionExo/ComprehensionPropo";
import DesignationIsole from "@/app/ui/language-exo/comprehensionExo/DesignationIsole";
import ExecutionOrdre from "@/app/ui/language-exo/comprehensionExo/ExecutionOrdre";

const tasks = {
    "1":{
        title: "Désignation → mot isolé",
        description: "Désigner l'image correspondant à un mot entendu parmi 4 distracteurs",
        component: <DesignationIsole />
    },
    "2": {
        title: "Questions oui/non → compréhension propositionnelle simple",
        description: "Exécuter des consignes orales de complexité croissante ('touche le crayon, puis le verre')",
        component: <ComprehensionPropo />
    },
    "3": {
        title:"Appariement phrase-image → compréhension",
        description: "Répondre par oui/non à des questions simples puis complexes",
        component: <AppariementPhrase />
    },
    "4": {
        title: "Exécution d'ordres → compréhension séquentielle/syntaxique complexe",
        description: "Associer une phrase entendue à l'image correspondante",
        component: <ExecutionOrdre />
    }
} as const;

export default async function ComprehensionExo({params}: {params: Promise<{ id: string }>}) {

    const { id } = await params;
    const task = tasks[id as keyof typeof tasks];

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