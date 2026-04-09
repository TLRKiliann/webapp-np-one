import { getSelectedPatient } from "@/app/actions/patients";
import FluenceSemantic from "@/app/ui/language-exo/fluenceExo/FluenceSemantic";
import FluenceLitterale from "@/app/ui/language-exo/fluenceExo/FluenceLitterale";
import AssociationSemantic from "@/app/ui/language-exo/fluenceExo/AssociationSemantic";

export default async function FluenceExo({params}: {params : Promise<{ id: string }>}) {

    const { id } = await params;
    const selectedPatient = await getSelectedPatient();
    const patientId = selectedPatient?.id ?? null;

    const tasks = {
        "1": {
            title: "Fluence sémantique",
            description: "Citer le maximum de mots d'une catégorie en 60s (animaux, fruits, meubles...)",
            component: <FluenceSemantic />
        },
        "2": {
            title: "Fluence littérale",
            description: "Citer le maximum de mots commençant par une lettre (P, R, F...)",
            component: <FluenceLitterale />
        },
        "3": {
            title: "Associations sémantiques",
            description: "Compléter des séries sémantiques interrompues (chien, chat, ...)",
            component: <AssociationSemantic patientId={patientId} />
        }
    };

    const task = tasks[id as keyof typeof tasks];

    if (!task) {
        return <div>Tâche non trouvée !</div>
    };

    return (
        <div className="h-[90vh]">
            <h1 className="text-2xl font-bold">{task.title}</h1>

            <p className="mt-4 mb-6 ml-4">{task.description}</p>

            {!patientId && id === "3" && (
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
