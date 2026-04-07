import MemoTravailVerbal from "@/app/ui/language-exo/repetitionExo/MemoTravailVerbale";
import RepetitionLexicale from "@/app/ui/language-exo/repetitionExo/RepetitionLexicale";
import RepetitionNonFluente from "@/app/ui/language-exo/repetitionExo/RepetitionNonFluente";
import RepetitionNonLexicale from "@/app/ui/language-exo/repetitionExo/RepetitionNonLexicale";

const tasks = {
    "1": {
        title: "Intégrité de la voie lexicale + phonologique",
        description: "Répéter des mots simples → complexes → pseudo-mots",
        component: <RepetitionLexicale />
    },
    "2": {
        title: "Mémoire de travail verbale (empan)",
        description: "Répéter des phrases courtes → longues",
        component: <MemoTravailVerbal />
    },
    "3": {
        title: "Boucle phonologique pure (sans appui lexical)",
        description: "Répéter des logatomes (non-mots) pour isoler la boucle phonologique",
        component: <RepetitionNonLexicale />
    },
    "4": {
        title: "Contourne le manque de fluence via l'hémisphère droit",
        description: "Répétition rythmée (avec métronome) pour les formes non-fluentes",
        component: <RepetitionNonFluente />
    },
}

export default async function RepetitionExoPage({params}: {params: Promise<{ id: string }>}) {
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