import AppariementPhrase from "@/app/ui/language-exo/comprehensionExo/AppariementPhrase";
import AppariementMot from "@/app/ui/language-exo/lectureExo/AppariementMot";
import LectureMotIrreg from "@/app/ui/language-exo/lectureExo/LectureMotIrreg";
import LectureMotReg from "@/app/ui/language-exo/lectureExo/LectureMotReg";
import LecturePseudoMot from "@/app/ui/language-exo/lectureExo/LecturePseudoMot";

const tasks = {
    "1": {
        title: "Lecture de mots réguliers",
        description: "Lire à voix haute des mots réguliers",
        component: <LectureMotReg />
    },
    "2": {
        title: "Lecture de mots irréguliers",
        description: " Lire à voix haute des mots irréguliers",
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
        component: <AppariementMot /> 
    },
    "5": {
        title: "Appariement phrase écrite-image",
        description: "Lire une phrase et choisir l'image",
        component: <AppariementPhrase /> 
    }
} as const;

export default async function LectureExo({params}: {params: Promise<{ id: string }>}) {

    const {id} = await params;
    const task = tasks[id as keyof typeof tasks];

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