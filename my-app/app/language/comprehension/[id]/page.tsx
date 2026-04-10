import { getSelectedPatient } from "@/app/actions/patients";
import AppariementPhrase from "@/app/ui/language-exo/comprehensionExo/AppariementPhrase";
import ComprehensionPropo from "@/app/ui/language-exo/comprehensionExo/ComprehensionPropo";
import DesignationIsole from "@/app/ui/language-exo/comprehensionExo/DesignationIsole";
import ExecutionOrdre from "@/app/ui/language-exo/comprehensionExo/ExecutionOrdre";

export default async function ComprehensionExo({params}: {params: Promise<{ id: string }>}) {

    const { id } = await params;
    const selectedPatient = await getSelectedPatient();
    const patientId = selectedPatient?.id ?? null;

    const tasks = {
        "1":{
            title: "Désignation → mot isolé",
            description: "Désigner l'image correspondant à un mot entendu parmi 4 distracteurs",
            component: <DesignationIsole />
        },
        "2": {
            title: "Questions oui/non → compréhension propositionnelle simple",
            description: "Répondre par oui/non à des affirmations simples puis complexes",
            component: <ComprehensionPropo patientId={patientId} />
        },
        "3": {
            title:"Appariement phrase-image → compréhension",
            description: "Associer une phrase entendue à l'image correspondante parmi 4 propositions",
            component: <AppariementPhrase patientId={patientId} />
        },
        "4": {
            title: "Exécution d'ordres → compréhension séquentielle/syntaxique complexe",
            description: "Toucher les objets dans l'ordre indiqué par des consignes de complexité croissante",
            component: <ExecutionOrdre patientId={patientId} />
        }
    } as const;

    const task = tasks[id as keyof typeof tasks];

    return (
        <div>
            <h1 className="text-2xl font-bold">{task.title}</h1>

            <p className="mt-4 mb-6 ml-4">{task.description}</p>

            {!patientId && (id === "2" || id === "3" || id === "4") && (
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