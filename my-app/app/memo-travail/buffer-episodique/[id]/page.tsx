import { BufferEpisodique } from "@/lib/memo-travail";
import AssociationPairesExo from "@/app/ui/memo-travail-exo/bufferepisodiqueExo/AssociationPaires";
import RappelDesScenes from "@/app/ui/memo-travail-exo/bufferepisodiqueExo/RappelDesScenes";
import RecitCourt from "@/app/ui/memo-travail-exo/bufferepisodiqueExo/RecitCourt";

const tasks = {
    "1": {
        title: BufferEpisodique.associationPaires.title,
        description: BufferEpisodique.associationPaires.description,
        component: <AssociationPairesExo />
    },
    "2": {
        title: BufferEpisodique.rappelScenes.title,
        description: BufferEpisodique.rappelScenes.description,
        component: <RappelDesScenes />
    },
    "3": {
        title: BufferEpisodique.recitCourt.title,
        description: BufferEpisodique.recitCourt.description,
        component: <RecitCourt />
    }
};

export default async function BufferEpisodiqueExo({params}: {params: Promise<{id : string}>}) {
    
    const {id} = await params;
    const task = tasks[id as keyof typeof tasks];
    
    if (!task) {
        return <div>Tâche non trouvée !</div>
    }

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