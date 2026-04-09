import { getSelectedPatient } from "@/app/actions/patients";
import ApprentissageTrajectoireVirtuel from "@/app/ui/orientation-spatiale-exo/orientationExtraPersonnelExo/ApprentissageTrajectoireVirtuel";
import EstimationDistances from "@/app/ui/orientation-spatiale-exo/orientationExtraPersonnelExo/EstimationDistances";
import LectureDeCarte from "@/app/ui/orientation-spatiale-exo/orientationExtraPersonnelExo/LectureDeCarte";
import OrientationPointDeRepere from "@/app/ui/orientation-spatiale-exo/orientationExtraPersonnelExo/OrientationPointDeRepere";
import PlanLieuxFamiliers from "@/app/ui/orientation-spatiale-exo/orientationExtraPersonnelExo/PlanLieuxFamiliers";
import { OrientationExtra } from "@/lib/orientation-spatiale";

export default async function OrientationExtraPersonnelExo({ params }: { params: Promise<{ id: string }> }) {

    const { id } = await params;
    const selectedPatient = await getSelectedPatient();
    const patientId = selectedPatient?.id ?? null;

    const tasks = {
        "1": {
            title: OrientationExtra.planLieuFam.title,
            description: OrientationExtra.planLieuFam.description,
            component: <PlanLieuxFamiliers patientId={patientId} />
        },
        "2": {
            title: OrientationExtra.lectureCarte.title,
            description: OrientationExtra.lectureCarte.description,
            component: <LectureDeCarte patientId={patientId} />
        },
        "3": {
            title: OrientationExtra.apprenTrajVirtuel.title,
            description: OrientationExtra.apprenTrajVirtuel.description,
            component: <ApprentissageTrajectoireVirtuel patientId={patientId} />
        },
        "4": {
            title: OrientationExtra.orientPointRepere.title,
            description: OrientationExtra.orientPointRepere.description,
            component: <OrientationPointDeRepere patientId={patientId} />
        },
        "5": {
            title: OrientationExtra.estimationDistance.title,
            description: OrientationExtra.estimationDistance.description,
            component: <EstimationDistances patientId={patientId} />
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