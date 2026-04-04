import { AdminCentralType, BouclephonologiqueTypes, BufferEpisodiqueType, CalpinvisuospatialTypes } from "./definitions";

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

export const BufferEpisodique: BufferEpisodiqueType = {
  rappelScenes: {
    title: "Rappel de scènes",
    description: "Mémoriser une image complexe et rappeler les détails"
  },
  associationPaires: {
    title: "AssociationPaires paires",
    description: "Mémoriser des paires mot-image ou mot-mot"
  },
  recitCourt: {
    title: "Récit court",
    description: "Écouter une histoire courte et rappeler les éléments"
  }
};

export const AdminCentral: AdminCentralType = {
  doubleTache: {
    title: "Double tâche",
    description: "Réaliser deux tâches simultanées (ex. : compter + classer)"
  },
  nback: {
    title: "N-back",
    description: "Indiquer si le stimulus actuel est identique à celui de N étapes avant"
  },
  majmemo: {
    title: "Mise à jour en mömoire",
    description: "Mémoriser une liste qui se met à jour, ne garder que les X derniers"
  },
  empanlect: {
    title: "Empan de lecture",
    description: "Lire des phrases + mémoriser le dernier mot de chacune"
  },
  triavecinter: {
    title: "Tri avec interférence",
    description: "Classer des éléments avec des distracteurs (type Stroop)"
  },
};