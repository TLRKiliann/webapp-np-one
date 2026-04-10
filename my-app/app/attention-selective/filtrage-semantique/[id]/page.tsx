import { FiltrageSemantic } from "@/lib/attention-selective";
import { getSelectedPatient } from "@/app/actions/patients";
import CategoryRapide from "@/app/ui/attention-selective-exo/filtrage-semantique-exo/CategoryRapide";
import DecisionLexiSelect from "@/app/ui/attention-selective-exo/filtrage-semantique-exo/DecisionLexiSelect";
import TriSelectif from "@/app/ui/attention-selective-exo/filtrage-semantique-exo/TriSelectif";
import JugmntSemanticDistra from "@/app/ui/attention-selective-exo/filtrage-semantique-exo/JugmntSemanticDistra";

export default async function FiltrageSemantiqueExo({params}: {params: Promise<{id: string}>}) {
    const { id } = await params;
    const selectedPatient = await getSelectedPatient();
    const patientId = selectedPatient?.id ?? null;

    const tasks = {
        "1": {
            title: FiltrageSemantic.categoriRapide.title,
            description: FiltrageSemantic.categoriRapide.description,
            component: <CategoryRapide patientId={patientId} />
        },
        "2": {
            title: FiltrageSemantic.decisionLexiSelect.title,
            description: FiltrageSemantic.decisionLexiSelect.description,
            component: <DecisionLexiSelect patientId={patientId} />
        },
        "3": {
            title: FiltrageSemantic.triSelectif.title,
            description: FiltrageSemantic.triSelectif.description,
            component: <TriSelectif patientId={patientId} />
        },
        "4": {
            title: FiltrageSemantic.jugmntSemanticDistra.title,
            description: FiltrageSemantic.jugmntSemanticDistra.description,
            component: <JugmntSemanticDistra patientId={patientId} />
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