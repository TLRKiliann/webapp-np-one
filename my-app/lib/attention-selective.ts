import { DetectionCiblesVisuType, InhibitionDistractType } from "./definitions";

export const DetectionCiblesVisu: DetectionCiblesVisuType = {
    barrageSimple: {
        title: "Barrage simple",
        description: "Rayer une seule cible parmi des distracteurs (lettre, chiffre, symbole)"
    },
    barrageDouble: {
        title: "Barrage double",
        description: "Rayer deux cibles simultanément parmi des distracteurs"
    },
    rechVisuSimple: {
        title: "Recherche visuelle simple",
        description: "Trouver une cible définie par un seul attribut (couleur OU forme)"
    },
    rechVisuConjonct: {
        title: "Recherche visuelle conjonctive",
        description: "Trouver une cible définie par deux attributs (couleur ET forme)"
    },
    oddOneOut: {
        title: "Odd-one-out",
        description: "Identifier l'intrus dans un ensemble de stimuli similaires"
    }
};

export const InhibitionDistract: InhibitionDistractType = {
    stroopCouleurMot: {
        title: "Stroop couleur-mot",
        description: "Nommer la couleur de l'encre en ignorant le mot écrit"
    },
    stroopSpatial: {
        title: "Stroop spatial",
        description: "Indiquer la position d'une flèche en ignorant sa direction"
    },
    flankerTask: {
        title: "Flanker task",
        description: "Répondre à une cible centrale en ignorant les flanqueurs"
    },
    simonTask: {
        title: "Simon task",
        description: "Répondre selon la couleur en ignorant la position spatiale"
    },
    negativePriming: {
        title: "Negative priming",
        description: "Répondre à une cible qui était distracteur à l'essai précédent"
    }
};