import { getSelectedPatient } from "@/app/actions/patients";
import BarrageDesCibles from "@/app/ui/orientation-spatiale-exo/orientationPeriPersonnelExo/BarrageDesCibles";
import BissectionDesLignes from "@/app/ui/orientation-spatiale-exo/orientationPeriPersonnelExo/BissectionDesLignes";
import CopieDesFigureOriente from "@/app/ui/orientation-spatiale-exo/orientationPeriPersonnelExo/CopieDesFiguresOriente";
import RelationsTopologiques from "@/app/ui/orientation-spatiale-exo/orientationPeriPersonnelExo/RelationsTopologiques";
import ReperageSurGrille from "@/app/ui/orientation-spatiale-exo/orientationPeriPersonnelExo/ReperageSurGrille";
import { OrientationPeri } from "@/lib/orientation-spatiale";

export default async function OrientationPeriPersonnelExo({ params }: { params: Promise<{ id: string }> }) {

    const { id } = await params;
    const selectedPatient = await getSelectedPatient();
    const patientId = selectedPatient?.id ?? null;

    const tasks = {
        "1": {
            title: OrientationPeri.relationTopo.title,
            description: OrientationPeri.relationTopo.description,
            component: <RelationsTopologiques patientId={patientId} />
        },
        "2": {
            title: OrientationPeri.copyFigureOrient.title,
            description: OrientationPeri.copyFigureOrient.description,
            component: <CopieDesFigureOriente patientId={patientId} />
        },
        "3": {
            title: OrientationPeri.bissectionLignes.title,
            description: OrientationPeri.bissectionLignes.description,
            component: <BissectionDesLignes patientId={patientId} />
        },
        "4": {
            title: OrientationPeri.barrageCibles.title,
            description: OrientationPeri.barrageCibles.description,
            component: <BarrageDesCibles patientId={patientId} />
        },
        "5": {
            title: OrientationPeri.reperageSurGrille.title,
            description: OrientationPeri.reperageSurGrille.description,
            component: <ReperageSurGrille patientId={patientId} />
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