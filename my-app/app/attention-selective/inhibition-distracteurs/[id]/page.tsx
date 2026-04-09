import Truc from "@/app/ui/attention-selective-exo/Truc";
import { InhibitionDistract } from "@/lib/attention-selective";
import { getSelectedPatient } from "@/app/actions/patients";

export default async function InhibitionDistracteursExo({params}: {params: Promise<{id: string}>}) {
    const { id } = await params;
    const selectedPatient = await getSelectedPatient();
    const patientId = selectedPatient?.id ?? null;

    const tasks = {
        "1": {
            title: InhibitionDistract.stroopCouleurMot.title,
            description: InhibitionDistract.stroopCouleurMot.description,
            component: <Truc patientId={patientId} />
        },
        "2": {
            title: InhibitionDistract.stroopSpatial.title,
            description: InhibitionDistract.stroopSpatial.description,
            component: <Truc patientId={patientId} />
        },
        "3": {
            title: InhibitionDistract.flankerTask.title,
            description: InhibitionDistract.flankerTask.description,
            component: <Truc patientId={patientId} />
        },
        "4": {
            title: InhibitionDistract.simonTask.title,
            description: InhibitionDistract.simonTask.description,
            component: <Truc patientId={patientId} />
        },
        "5": {
            title: InhibitionDistract.negativePriming.title,
            description: InhibitionDistract.negativePriming.description,
            component: <Truc patientId={patientId} />
        }
    };

    const task = tasks[id as keyof typeof tasks];

    if (!task) {
        return <div>Tâche non trouvée !</div>
    };

    return (
        <div>

            <h1 className="text-2xl font-bold">{task.title}</h1>

            <p className="mt-4 mb-6 ml-4">{task.description}</p>

            {!patientId && (
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
