import EmpanCorsi from "@/app/ui/memo-travail-exo/calpinvisuospatialExo/EmpanCorsi";
import LabyrintheMemo from "@/app/ui/memo-travail-exo/calpinvisuospatialExo/LabyrintheMemo";
import MattrixPattern from "@/app/ui/memo-travail-exo/calpinvisuospatialExo/MattrixPattern";
import MemoPosition from "@/app/ui/memo-travail-exo/calpinvisuospatialExo/MemoPosition";
import RotationMentale from "@/app/ui/memo-travail-exo/calpinvisuospatialExo/RotationMentale";
import { calpinvisuospatial } from "@/lib/memo-travail";

const tasks = {
    "1": {
        title: calpinvisuospatial.empanCorsi.title,
        description: calpinvisuospatial.empanCorsi.description,
        component: <EmpanCorsi />
    },
    "2": {
        title: calpinvisuospatial.memoPosition.title,
        description: calpinvisuospatial.memoPosition.description,
        component: <MemoPosition />
    },
    "3": {
        title: calpinvisuospatial.rotationMentale.title,
        description: calpinvisuospatial.rotationMentale.description,
        component: <RotationMentale />
    },
    "4": {
        title: calpinvisuospatial.labyrintheMemo.title,
        description: calpinvisuospatial.labyrintheMemo.description,
        component: <LabyrintheMemo />
    },
    "5": {
        title: calpinvisuospatial.matrixPattern.title,
        description: calpinvisuospatial.matrixPattern.description,
        component: <MattrixPattern />
    }
};

export default async function CalpinVisuoSpatialExo({ params }: { params: Promise<{ id: string }> }) {

    const { id } = await params;
    const task = tasks[id as keyof typeof tasks];

    if (!task) {
        return <div>Tâche non trouvée !</div>
    };

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