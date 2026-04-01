"use client";

import Link from "next/link";
import { ChangeEvent, useState } from "react";

export default function Home() {

  const [optionFatigue, setOptionFatigue] = useState<string | undefined>(undefined);
  const [optionDlr, setOptionDlr] = useState<string | undefined>(undefined);
  const [douleurState, setDouleurState] = useState<string | undefined>(undefined);

  const handleFatigue = (e: ChangeEvent<HTMLInputElement>): void => {
    setOptionFatigue(e.target.value);
  };

  const handleDouleur = (e: ChangeEvent<HTMLInputElement>): void => {
    setOptionDlr(e.target.value);
  };

  const handleEvaDlr = (e: ChangeEvent<HTMLInputElement>): void => {
    setDouleurState(e.target.value);
  }

  console.log(optionFatigue);

  return (
    <div className="p-4">

      <div className="border border-red-500">
        <h1 className="text-3xl font-bold">Accueil</h1>
      </div>

      <div className="p-4 border border-orange-500">

        <div className="border border-green-500 mt-4 mb-6">
          <h2 className="text-2xl font-bold">Intro</h2>
        </div>

        <div className="bg-slate-100/50 rounded-lg mx-4 p-4">
          Bienvenue sur la page d'accueil de Neuro-Psy-Med.
          <br />
          Aucune données personnelles ne sera transmises à une organisation tierse ou à toute autre
          personne hors du service de soins dans lequel vous vous trouvez.
          <br />
          Merci de vous prêtez à cette entraînement.
        </div>


        <div className="border border-green-500 mt-10 mb-6">
          <h2 className="text-2xl font-bold">Quelques questions</h2>
        </div>


        <div className="bg-slate-100/50 rounded-lg m-4 p-4">
          <p>1) Quel degré de fatigue ressentez-vous aujourd'hui ?</p>

          <div className="w-100 flex flex-row items-center justify-evenly bg-white dark:bg-slate-800 border border-slate-200 rounded-lg mt-4 mb-8 py-4">

            <label htmlFor="fatigue1">
              <input 
                type="radio" 
                id="fatigue1" 
                name="fatigue1" 
                value="un_peu"
                checked={optionFatigue === "un_peu"} 
                onChange={handleFatigue} 
                className="mr-2"
              />
              Peu
            </label>

            <label htmlFor="fatigue2">
              <input 
                type="radio" 
                id="fatigue2" 
                name="fatigue2"
                value="moyennement"
                checked={optionFatigue === "moyennement"} 
                onChange={handleFatigue}
                className="mr-2"
              />
              Moyennement
            </label>

            <label htmlFor="fatigue3">
              <input 
                type="radio" 
                id="fatigue3" 
                name="fatigue3"
                value="pas_du_tout" 
                checked={optionFatigue === "pas_du_tout"} 
                onChange={handleFatigue}
                className="mr-2"
              />
              Pas du tout
            </label>

          </div>


          <p>2) Avez-vous des douleurs actuellement ?</p>

          <div className="w-50 flex flex-row items-center justify-evenly bg-white dark:bg-slate-800 border border-slate-200 rounded-lg mt-4 mb-8 py-4">

            <label htmlFor="dlroui">
              <input 
                type="radio" 
                id="dlroui" 
                name="dlroui" 
                value="oui"
                checked={optionDlr === "oui"}
                onChange={handleDouleur}
                className="mr-2"
              />
              Oui
            </label>

            <label htmlFor="dlrnon">
              <input 
                type="radio" 
                id="dlrnon" 
                name="dlrnon" 
                value="non"
                checked={optionDlr === "non"}
                onChange={handleDouleur}
                className="mr-2"
              />
              Non
            </label>

          </div>

          <p>3) Si oui, pouvez-vous l'évaluer entre 1 et 10 sur l'échelle de la douleur ?</p>

          <div className="flex flex-row items-center justify-around bg-white dark:bg-slate-800 border border-slate-200 rounded-lg mx-40 mt-4 mb-8 py-4">

            <label htmlFor="dlr1">
              <input type="radio" id="dlr1" name="dlr1" 
                value="dlr1" checked={douleurState === "dlr1"} onChange={handleEvaDlr} 
                className="mr-2"/>
              1
            </label>

            <label htmlFor="dlr2">
              <input type="radio" id="dlr2" name="dlr2" 
                value="dlr2" checked={douleurState === "dlr2"} onChange={handleEvaDlr} 
                className="mr-2"/>
              2
            </label>

            <label htmlFor="dlr3">
              <input type="radio" id="dlr3" name="dlr3" 
                value="dlr3" checked={douleurState === "dlr3"} onChange={handleEvaDlr} 
                className="mr-2"/>
              3
            </label>

            <label htmlFor="dlr4">
              <input type="radio" id="dlr4" name="dlr4" 
                value="dlr4" checked={douleurState === "dlr4"} onChange={handleEvaDlr} 
                className="mr-2"/>
              4
            </label>

            <label htmlFor="dlr5">
              <input type="radio" id="dlr5" name="dlr5" 
                value="dlr5" checked={douleurState === "dlr5"} onChange={handleEvaDlr} 
                className="mr-2"/>
              5
            </label>

            <label htmlFor="dlr6">
              <input type="radio" id="dlr6" name="dlr6" 
                value="dlr6" checked={douleurState === "dlr6"} onChange={handleEvaDlr} 
                className="mr-2"/>
              6
            </label>

            <label htmlFor="dlr7">
              <input type="radio" id="dlr7" name="dlr7" 
                value="dlr7" checked={douleurState === "dlr7"} onChange={handleEvaDlr} 
                className="mr-2"/>
              7
            </label>

            <label htmlFor="dlr8">
              <input type="radio" id="dlr8" name="dlr8" 
                value="dlr8" checked={douleurState === "dlr8"} onChange={handleEvaDlr} 
                className="mr-2"/>
              8
            </label>

            <label htmlFor="dlr9">
              <input type="radio" id="dlr9" name="dlr9" 
                value="dlr9" checked={douleurState === "dlr9"} onChange={handleEvaDlr} 
                className="mr-2"/>
              9
            </label>

            <label htmlFor="dlr10">
              <input type="radio" id="dlr10" name="dlr10" 
                value="dlr10" checked={douleurState === "dlr10"} onChange={handleEvaDlr} 
                className="mr-2"/>
              10
            </label>

          </div>

          <p>Vous sentez-vous stressé ?</p>

          <p className="text-justify">
            Si oui, faîtes un exercice de mindfullness axé sur la respiration pendant une minute ou deux. Puis quand vous vous sentez prêt, 
            commencez l'entraînement.
          </p>

          <p>4) Quel niveau de difficulté choisissez-vous (avec Dashboard)</p>
        </div>

        <nav className="flex justify-center py-8 border border-blue-500">
          <ul className="disc-none">
            <li>
              <Link 
                href="/fonctions-executives"
                className="text-base font-bold text-white bg-blue-500 hover:bg-blue-600 active:bg-blue-400 rounded-lg px-6 py-4"
              >
                  Commencer l'entraînement
              </Link>
            </li>
          </ul>
        </nav>

      </div>

    </div>
  );
}