import Link from "next/link";

export default function Home() {
  return (
    <>
      <div className="p-4">
        <h1 className="text-3xl font-bold">Title One</h1>
      </div>

      <ul className="list-disc ml-10 my-10">
        <li className="text-lg text-cyan-700 font-bold mb-4">
          <Link href="./fonctions-executives">Fonctions Executives</Link>
        </li>
        <li className="text-lg text-cyan-700 font-bold mb-4">
          <Link href="./memo-visio-space">Mémoire et Attention Visio Spaciale</Link>
        </li>
        <li className="text-lg text-cyan-700 font-bold mb-4">
          <Link href="./memo-verbale">Mémoire Verbale</Link>
        </li>
        <li className="text-lg text-cyan-700 font-bold mb-4">
          <Link href="./memo-travail">Mémoire de Travail</Link>
        </li>
        <li className="text-lg text-cyan-700 font-bold mb-4">
          <Link href="./attention-selective">Attention Selective</Link>
        </li>
        <li className="text-lg text-cyan-700 font-bold mb-4">
          <Link href="./vitesse-traitement">Vitesse de Traitement de l'Info</Link>
        </li>
      </ul>    
    </>
  );
}