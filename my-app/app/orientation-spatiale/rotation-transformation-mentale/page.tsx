import Link from "next/link";

export default function RotationTransMentalePage() {
    return (
        <div>
            <h1 className="text-2xl font-bold">...</h1>

            <p></p>

            <nav className="mt-8 ml-8">
                <ul className="list-disc">
                    <li className="text-xl hover:text-emerald-500 mb-2">
                        <Link href="/orientation-spatiale/rotation-transformation-mentale/1">
                            {RotaTransMental..title}: {RotaTransMental..description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-emerald-500 mb-2">
                        <Link href="/orientation-spatiale/rotation-transformation-mentale/2">
                            {RotaTransMental..title}: {RotaTransMental..description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-emerald-500 mb-2">
                        <Link href="/orientation-spatiale/rotation-transformation-mentale/3">
                            {RotaTransMental..title}: {RotaTransMental..description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-emerald-500 mb-2">
                        <Link href="/orientation-spatiale/rotation-transformation-mentale/4">
                            {RotaTransMental..title}: {RotaTransMental..description}
                        </Link>
                    </li>
                </ul>
            </nav>
        </div>
    );
};