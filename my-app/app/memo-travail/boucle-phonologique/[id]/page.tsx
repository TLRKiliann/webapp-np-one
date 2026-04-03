
import EcouteDichotic from "@/app/ui/memo-travail-exo/bouclephonologiqueExo/EcouteDichotique";
import EmpanEndroit from "@/app/ui/memo-travail-exo/bouclephonologiqueExo/EmpanEndroit";
import EmpanEnvers from "@/app/ui/memo-travail-exo/bouclephonologiqueExo/EmpanEnvers";
import EmpanMots from "@/app/ui/memo-travail-exo/bouclephonologiqueExo/EmpanMots";
import RappelSeriel from "@/app/ui/memo-travail-exo/bouclephonologiqueExo/RappelSeriel";
import { bouclephonologique } from "@/lib/memo-travail";

const tasks = {
    "1": {
        title: bouclephonologique.empanEndroit.title,
        description: bouclephonologique.empanEndroit.description,
        component: <EmpanEndroit />
    },
    "2": {
        title: bouclephonologique.empanEnvers.title,
        description: bouclephonologique.empanEnvers.description,
        component: <EmpanEnvers />
    },
    "3": {
        title: bouclephonologique.empanMots.title,
        description: bouclephonologique.empanMots.description,
        component: <EmpanMots />
    },
    "4": {
        title: bouclephonologique.rappelSeriel.title,
        description: bouclephonologique.rappelSeriel.description,
        component: <RappelSeriel />
    },
    "5": {
        title: bouclephonologique.ecouteDichotic.title,
        description: bouclephonologique.ecouteDichotic.description,
        component: <EcouteDichotic />
    }
};

export default async function BouclePhonoExo({ params }: { params: Promise<{ id: string }> }) {

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