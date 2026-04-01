const tasks = {
    "1": {
        title: "Exercice 1",
        description: "Nommer un objet affiché (image → mot)",
    },
    "2": {
        title: "Exercice 2",
        description: "Nommer à partir d'une description (définition → mot)",

    },
    "3": {
        title: "Exercice 3",
        description: "Compléter une phrase à trou avec l'image comme indice ('on coupe le pain avec un ...')",

    },
    "4": {
        title: "Exercice 4",
        description: "Dénomination avec amorçage phonologique (première syllabe donnée en indice)",

    }
} as const;

export default async function DenominationExo({params}: {params: Promise<{ id: string }>}) {

    const { id } = await params;

    const task = tasks[id as keyof typeof tasks];

    return (
        <div className="p-4">
            <h1 className="text-3xl font-bold">{task.title}</h1>
            
            <p className="mt-4 mb-6 ml-4">{task.description}</p>

            <div className="w-auto h-[70vh] border mx-4">
                ...
            </div>

        </div>
    );
};