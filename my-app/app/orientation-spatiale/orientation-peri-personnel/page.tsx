export default function OrientationPeriPersonnelPage() {
    return (
        <div>
            <h1 className="text-2xl font-bold">...</h1>

            <p></p>

            <nav className="mt-8 ml-8">
                <ul className="list-disc">
                    <li className="text-xl hover:text-emerald-500 mb-2">
                        <Link href="/orientation-spatiale/orientation-peri-personnel/1">
                            {OrientationPeri.ancrageCorpo.title}: {OrientationPeri.ancrageCorpo.description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-emerald-500 mb-2">
                        <Link href="/orientation-spatiale/orientation-peri-personnel/2">
                            {OrientationPeri.verbaTrajet.title}: {OrientationPeri.verbaTrajet.description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-emerald-500 mb-2">
                        <Link href="/orientation-spatiale/orientation-peri-personnel/3">
                            {OrientationPeri.pointRepSail.title}: {OrientationPeri.pointRepSail.description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-emerald-500 mb-2">
                        <Link href="/orientation-spatiale/orientation-peri-personnel/4">
                            {OrientationPeri.exploSytem.title}: {OrientationPeri.exploSytem.description}
                        </Link>
                    </li>
                </ul>
            </nav>
        </div>
    );
};