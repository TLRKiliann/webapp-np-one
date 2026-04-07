import Link from "next/link";

export default function OrientationCorpsPage() {
    return (
        <div>
            <h1 className="text-2xl font-bold">...</h1>

            <p></p>

            <nav className="mt-8 ml-8">
                <ul className="list-disc">
                    <li className="text-xl hover:text-emerald-500 mb-2">
                        <Link href="/orientation-spatiale/orientation-corps/1">
                            {OrientationCorpo..title}: {OrientationCorpo..description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-emerald-500 mb-2">
                        <Link href="/orientation-spatiale/orientation-corps/2">
                            {OrientationCorpo..title}: {OrientationCorpo..description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-emerald-500 mb-2">
                        <Link href="/orientation-spatiale/orientation-corps/3">
                            {OrientationCorpo..title}: {OrientationCorpo..description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-emerald-500 mb-2">
                        <Link href="/orientation-spatiale/orientation-corps/4">
                            {OrientationCorpo..title}: {OrientationCorpo..description}
                        </Link>
                    </li>
                </ul>
            </nav>
        </div>
    );
};