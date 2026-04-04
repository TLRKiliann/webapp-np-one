import { BouclephonologiqueTypes, CalpinvisuospatialTypes } from "./definitions";

export const bouclephonologique: BouclephonologiqueTypes = {
  empanEndroit: {
    title: "Empan de chiffres endroit",
    description: "Répéter une séquence de chiffres de longueur croissante"
  },
  empanEnvers: {
    title: "Empan de chiffres envers",
    description: "Répéter en ordre inverse (charge l'administrateur central)"
  },
  empanMots: {
    title: "Empan de mots",
    description: "Répéter des listes de mots de longueur croissante"
  },
  rappelSeriel: {
    title: "Rappel sériel de lettres",
    description: "Mémoriser et restituer des séquences de lettres"
  },
  ecouteDichotic: {
    title: "Écoute dichotique",
    description: "Mémoriser deux flux verbaux simultanés"
  },
};

export const calpinvisuospatial: CalpinvisuospatialTypes = {
  empanCorsi: {
    title: "Empan de Corsi",
    description: "Reproduire une séquence de cases touchées sur une grille"
  },
  memoPosition: {
    title: "Mémorisation de positions",
    description: "Retenir l'emplacement d'objets sur une grille"
  },
  rotationMentale: {
    title: "Rotation mentale",
    description: "Manipuler mentalement des formes géométriques"
  },
  labyrintheMemo: {
    title: "Labyrinthe de mémoire",
    description: "Mémoriser un chemin puis le reproduire"
  },
  matrixPattern: {
    title: "Matrix pattern",
    description: "Mémoriser des motifs dans une grille n×n"
  },
};


  // ---
  // 3. Administrateur central (attention + manipulation)

  // ┌────────────────────┬────────────────────────────────────────────────────┐
  // │      Exercice      │                    Description                     │
  // ├────────────────────┼────────────────────────────────────────────────────┤
  // │ Double tâche       │ Réaliser deux tâches simultanées (ex. : compter +  │
  // │                    │ classer)                                           │
  // ├────────────────────┼────────────────────────────────────────────────────┤
  // │ N-back             │ Indiquer si le stimulus actuel est identique à     │
  // │                    │ celui de N étapes avant                            │
  // ├────────────────────┼────────────────────────────────────────────────────┤
  // │ Mise à jour en     │ Mémoriser une liste qui se met à jour, ne garder   │
  // │ mémoire            │ que les X derniers                                 │
  // ├────────────────────┼────────────────────────────────────────────────────┤
  // │ Empan de lecture   │ Lire des phrases + mémoriser le dernier mot de     │
  // │                    │ chacune                                            │
  // ├────────────────────┼────────────────────────────────────────────────────┤
  // │ Tri avec           │ Classer des éléments avec des distracteurs (type   │
  // │ interférence       │ Stroop)                                            │
  // └────────────────────┴────────────────────────────────────────────────────┘

  // ---
  // 4. Buffer épisodique (intégration multimodale)

  // ┌───────────────────┬─────────────────────────────────────────────────────┐
  // │     Exercice      │                     Description                     │
  // ├───────────────────┼─────────────────────────────────────────────────────┤
  // │ Rappel de scènes  │ Mémoriser une image complexe et rappeler les        │
  // │                   │ détails                                             │
  // ├───────────────────┼─────────────────────────────────────────────────────┤
  // │ Association       │ Mémoriser des paires mot-image ou mot-mot           │
  // │ paires            │                                                     │
  // ├───────────────────┼─────────────────────────────────────────────────────┤
  // │ Récit court       │ Écouter une histoire courte et rappeler les         │
  // │                   │ éléments                                            │
  // └───────────────────┴─────────────────────────────────────────────────────┘

  // ---
  // Principes communs de remédiation MDT

  // - Progression par niveaux : augmenter l'empan ou la complexité graduellement
  // - Feedback immédiat : correction après chaque essai
  // - Répétition espacée : réintroduire les items à intervalles croissants
  // - Double modalité : combiner visuel + auditif pour renforcer l'encodage
  // - Charge attentionnelle contrôlée : isoler une composante avant de les
  // combiner