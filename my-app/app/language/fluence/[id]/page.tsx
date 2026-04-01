import FluenceSemantic from "@/app/ui/fluenceExo/FluenceSemantic";
import FluenceLitterale from "@/app/ui/fluenceExo/FluenceLitterale";
import AssociationSemantic from "@/app/ui/fluenceExo/AssociationSemantic";

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
        <div>
            <h1 className="text-3xl font-bold">{task.title}</h1>
            <p>{task.description}</p>
            <div>{task.component}</div>
        </div>
    );
};