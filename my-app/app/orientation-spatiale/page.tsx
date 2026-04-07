import Link from "next/link";

export default function OrientationSpatialePage() {
    return (
        <div>
            <h1 className="text-2xl font-bold">Orientation spatiale</h1>

            <nav className="mt-8 ml-8">
                <ul className="list-disc">
                    <li className="text-xl hover:text-emerald-500 mb-2">
                        <Link href="/orientation-spatiale/orientation-corps">
                            Orientation sur le corps (espace corporel)
                        </Link>
                    </li>
                    <li className="text-xl hover:text-emerald-500 mb-2">
                        <Link href="/orientation-spatiale/peri-personnel">
                            Orientation dans l'espace péri-personnel                        
                        </Link>
                    </li>
                    <li className="text-xl hover:text-emerald-500 mb-2">
                        <Link href="/orientation-spatiale/extra-personnel">
                            Orientation dans l'espace extra-personnel (navigation)
                        </Link>
                    </li>
                    <li className="text-xl hover:text-emerald-500 mb-2">
                        <Link href="/orientation-spatiale/orientation-temporel-allopsychique">
                            Orientation temporelle et allopsychique
                        </Link>
                    </li>
                    <li className="text-xl hover:text-emerald-500 mb-2">
                        <Link href="/orientation-spatiale/rotation-transformation-mentale">
                            Rotation et transformation mentale
                        </Link>
                    </li>
                    <li className="text-xl hover:text-emerald-500 mb-2">
                        <Link href="/orientation-spatiale/strategie-compensation">
                            Stratégies de compensation
                        </Link>
                    </li>
                </ul>
            </nav>

        </div>
    );
};

//Orientation sur le corps (espace corporel) 

// Orientation dans l'espace péri-personnel

// Orientation dans l'espace extra-personnel (navigation)

// Orientation temporelle et allopsychique

// Rotation et transformation mentale

// Stratégies de compensation                   