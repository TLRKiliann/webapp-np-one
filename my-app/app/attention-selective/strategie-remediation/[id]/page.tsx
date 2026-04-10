import { StrategieRemediation } from "@/lib/attention-selective";
import { getSelectedPatient } from "@/app/actions/patients";
import ReductionProgDistracteurs from "@/app/ui/attention-selective-exo/strategie-remediation-exo/ReductionProgDistracteurs";
import SaillanceCible from "@/app/ui/attention-selective-exo/strategie-remediation-exo/SaillanceCible";
import VerbalisationRegles from "@/app/ui/attention-selective-exo/strategie-remediation-exo/VerbalisationRegles";
import EntrainmtInhibiteurs from "@/app/ui/attention-selective-exo/strategie-remediation-exo/EntrainmtInhibiteurs";
import FeedBackImmediat from "@/app/ui/attention-selective-exo/strategie-remediation-exo/FeedBackImmediat";

export default async function StrategieRemediationExo({params}: {params: Promise<{id: string}>}) {
    const { id } = await params;
    const selectedPatient = await getSelectedPatient();
    const patientId = selectedPatient?.id ?? null;

    const tasks = {
        "1": {
            title: StrategieRemediation.reducProgDistract.title,
            description: StrategieRemediation.reducProgDistract.description,
            component: <ReductionProgDistracteurs patientId={patientId} />
        },
        "2": {
            title: StrategieRemediation.saillanceCible.title,
            description: StrategieRemediation.saillanceCible.description,
            component: <SaillanceCible patientId={patientId} />
        },
        "3": {
            title: StrategieRemediation.verbaliRegle.title,
            description: StrategieRemediation.verbaliRegle.description,
            component: <VerbalisationRegles patientId={patientId} />
        },
        "4": {
            title: StrategieRemediation.entrainmtInhib.title,
            description: StrategieRemediation.entrainmtInhib.description,
            component: <EntrainmtInhibiteurs patientId={patientId} />
        },
        "5": {
            title: StrategieRemediation.feedBackImmediat.title,
            description: StrategieRemediation.feedBackImmediat.description,
            component: <FeedBackImmediat patientId={patientId} />
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
