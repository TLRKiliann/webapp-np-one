import { AttSelectAuditive } from "@/lib/attention-selective";
import { getSelectedPatient } from "@/app/actions/patients";
import CocktailParty from "@/app/ui/attention-selective-exo/auditive-exo/CocktailParty";
import DetectionMotCible from "@/app/ui/attention-selective-exo/auditive-exo/DetectionMotCible";
import DiscriAuditAvecBruit from "@/app/ui/attention-selective-exo/auditive-exo/DiscriAuditAvecBruit";
import EcouteSelectiveDicho from "@/app/ui/attention-selective-exo/auditive-exo/EcouteSelectiveDicho";

export default async function AuditiveExo({params}: {params: Promise<{id: string}>}) {
    const { id } = await params;
    const selectedPatient = await getSelectedPatient();
    const patientId = selectedPatient?.id ?? null;

    const tasks = {
        "1": {
            title: AttSelectAuditive.cocktailParty.title,
            description: AttSelectAuditive.cocktailParty.description,
            component: <CocktailParty patientId={patientId} />
        },
        "2": {
            title: AttSelectAuditive.dectectionMotCible.title,
            description: AttSelectAuditive.dectectionMotCible.description,
            component: <DetectionMotCible patientId={patientId} />
        },
        "3": {
            title: AttSelectAuditive.discriAudiAvecB.title,
            description: AttSelectAuditive.discriAudiAvecB.description,
            component: <DiscriAuditAvecBruit patientId={patientId} />
        },
        "4": {
            title: AttSelectAuditive.ecouSelectDicho.title,
            description: AttSelectAuditive.ecouSelectDicho.description,
            component: <EcouteSelectiveDicho patientId={patientId} />
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
