import FluenceSemantic from "@/app/ui/language-exo/fluenceExo/FluenceSemantic";
import FluenceLitterale from "@/app/ui/language-exo/fluenceExo/FluenceLitterale";
import AssociationSemantic from "@/app/ui/language-exo/fluenceExo/AssociationSemantic";

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
        component: <AssociationSemantic />
    }
};

export default async function FluenceExo({params}: {params : Promise<{ id: string }>}) {
    
    const { id } = await params;
    const task = tasks[id as keyof typeof tasks];

    if (!task) {
        return <div>Tâche non trouvée !</div>
    };

    return (
        <div className="h-[90vh] p-4">
            <h1 className="text-2xl font-bold">{task.title}</h1>
            
            <p className="mt-4 mb-6 ml-4">{task.description}</p>

            <div className="w-auto h-[70vh] border mx-4">
                {task.component}
            </div>
        </div>
    );
};