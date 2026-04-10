import { getSelectedPatient } from "@/app/actions/patients";
import AppariementPhrase from "@/app/ui/language-exo/lectureExo/AppariementPhrase";
import AppariementMot from "@/app/ui/language-exo/lectureExo/AppariementMot";
import LectureMotIrreg from "@/app/ui/language-exo/lectureExo/LectureMotIrreg";
import LectureMotReg from "@/app/ui/language-exo/lectureExo/LectureMotReg";
import LecturePseudoMot from "@/app/ui/language-exo/lectureExo/LecturePseudoMot";

export default async function LectureExo({params}: {params: Promise<{ id: string }>}) {

    const { id } = await params;
    const selectedPatient = await getSelectedPatient();
    const patientId = selectedPatient?.id ?? null;

    const tasks = {
        "1": {
            title: "Lecture de mots réguliers",
            description: "Lire à voix haute des mots réguliers",
            component: <LectureMotReg />
        },
        "2": {
            title: "Lecture de mots irréguliers",
            description: "Lire à voix haute des mots irréguliers",
            component: <LectureMotIrreg />
        },
        "3": {
            title: "Lecture de pseudo-mots",
            description: "Lire des pseudo-mots",
            component: <LecturePseudoMot />
        },
        "4": {
            title: "Appariement mot écrit-image",
            description: "Associer un mot écrit à son image",
            component: <AppariementMot patientId={patientId} />
        },
        "5": {
            title: "Appariement phrase écrite-image",
            description: "Lire une phrase et choisir l'image",
            component: <AppariementPhrase patientId={patientId} />
        }
    } as const;

    const task = tasks[id as keyof typeof tasks];

    if (!task) return <div>Tâche non trouvée !</div>;

    return (
        <div>

            <h1 className="text-2xl font-bold">{task.title}</h1>

            <p className="mt-4 mb-6 ml-4">{task.description}</p>

            {!patientId && (id === "4" || id === "5") && (
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