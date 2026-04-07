export default function OrientationExtraPersonnelPage() {
    return (
        <div>
            <h1 className="text-2xl font-bold">...</h1>

            <p></p>

            <nav className="mt-8 ml-8">
                <ul className="list-disc">
                    <li className="text-xl hover:text-emerald-500 mb-2">
                        <Link href="/orientation-spatiale/orientation-extra-personnel/1">
                            {OrientationExtra.ancrageCorpo.title}: {OrientationExtra.ancrageCorpo.description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-emerald-500 mb-2">
                        <Link href="/orientation-spatiale/orientation-extra-personnel/2">
                            {OrientationExtra.verbaTrajet.title}: {OrientationExtra.verbaTrajet.description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-emerald-500 mb-2">
                        <Link href="/orientation-spatiale/orientation-extra-personnel/3">
                            {OrientationExtra.pointRepSail.title}: {OrientationExtra.pointRepSail.description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-emerald-500 mb-2">
                        <Link href="/orientation-spatiale/orientation-extra-personnel/4">
                            {OrientationExtra.exploSytem.title}: {OrientationExtra.exploSytem.description}
                        </Link>
                    </li>
                </ul>
            </nav>
        </div>
    );
};