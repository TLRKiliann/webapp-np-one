import { AttSelectText } from "@/lib/attention-selective";
import { getSelectedPatient } from "@/app/actions/patients";
import LectureSelective from "@/app/ui/attention-selective-exo/texte-exo/LectureSelective";
import DetectionErreurs from "@/app/ui/attention-selective-exo/texte-exo/DetectionErreurs";
import SurlignageSelectif from "@/app/ui/attention-selective-exo/texte-exo/SurlignageSelectif";
import LectureAvecDistract from "@/app/ui/attention-selective-exo/texte-exo/LectureAvecDistract";

export default async function AttSelectTextExo({params}: {params: Promise<{id: string}>}) {
    const { id } = await params;
    const selectedPatient = await getSelectedPatient();
    const patientId = selectedPatient?.id ?? null;

    const tasks = {
        "1": {
            title: AttSelectText.lectureSelect.title,
            description: AttSelectText.lectureSelect.description,
            component: <LectureSelective patientId={patientId} />
        },
        "2": {
            title: AttSelectText.detectionErreurs.title,
            description: AttSelectText.detectionErreurs.description,
            component: <DetectionErreurs patientId={patientId} />
        },
        "3": {
            title: AttSelectText.surlignageSelect.title,
            description: AttSelectText.surlignageSelect.description,
            component: <SurlignageSelectif patientId={patientId} />
        },
        "4": {
            title: AttSelectText.lectureAvecDistract.title,
            description: AttSelectText.lectureAvecDistract.description,
            component: <LectureAvecDistract patientId={patientId} />
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