import { StrategieRemediation } from "@/lib/attention-selective";
import Link from "next/link";

export default function StrategieRemediationPage() {
    return (
        <div>

            <h1 className="text-2xl font-bold">Stratégies de remédiation</h1>

            <nav className="mt-8 ml-8">
                <ul className="list-disc">
                    <li className="text-xl hover:text-teal-500 dark:hover:text-indigo-400 mb-2">
                        <Link href="/attention-selective/strategie-remediation/1">
                            {StrategieRemediation.reducProgDistract.title} {StrategieRemediation.reducProgDistract.description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-teal-500 dark:hover:text-indigo-400 mb-2">
                        <Link href="/attention-selective/strategie-remediation/2">
                            {StrategieRemediation.saillanceCible.title} {StrategieRemediation.saillanceCible.description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-teal-500 dark:hover:text-indigo-400 mb-2">
                        <Link href="/attention-selective/strategie-remediation/3">
                            {StrategieRemediation.verbaliRegle.title} {StrategieRemediation.verbaliRegle.description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-teal-500 dark:hover:text-indigo-400 mb-2">
                        <Link href="/attention-selective/strategie-remediation/4">
                            {StrategieRemediation.entrainmtInhib.title} {StrategieRemediation.entrainmtInhib.description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-teal-500 dark:hover:text-indigo-400 mb-2">
                        <Link href="/attention-selective/strategie-remediation/5">
                            {StrategieRemediation.feedBackImmediat.title} {StrategieRemediation.feedBackImmediat.description}
                        </Link>
                    </li>
                </ul>
            </nav>

        </div>
    );
};