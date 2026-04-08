
import { getSelectedPatient } from "@/app/actions/patients";
import CubeDeShepard from "@/app/ui/orientation-spatiale-exo/rotaTransfoMentalExo/CubeDeShepard";
import DepilageDesSolides from "@/app/ui/orientation-spatiale-exo/rotaTransfoMentalExo/DepilageDesSolides";
import PerspectiveSpatiale from "@/app/ui/orientation-spatiale-exo/rotaTransfoMentalExo/PerspectiveSpatiale";
import RotationMentaleObjects from "@/app/ui/orientation-spatiale-exo/rotaTransfoMentalExo/RotationMentaleObjects";
import { RotaTransMental } from "@/lib/orientation-spatiale";

export default async function RotationTransMentaleExo({ params }: { params: Promise<{ id: string }> }) {

    const { id } = await params;
    const selectedPatient = await getSelectedPatient();
    const patientId = selectedPatient?.id ?? null;

    const tasks = {
        "1": {
            title: RotaTransMental.rotaMentalObj.title,
            description: RotaTransMental.rotaMentalObj.description,
            component: <RotationMentaleObjects patientId={patientId} />
        },
        "2": {
            title: RotaTransMental.perspecSpatiale.title,
            description: RotaTransMental.perspecSpatiale.description,
            component: <PerspectiveSpatiale patientId={patientId} />
        },
        "3": {
            title: RotaTransMental.cubeShepard.title,
            description: RotaTransMental.cubeShepard.description,
            component: <CubeDeShepard patientId={patientId} />
        },
        "4": {
            title: RotaTransMental.depilageSolides.title,
            description: RotaTransMental.depilageSolides.description,
            component: <DepilageDesSolides patientId={patientId} />
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