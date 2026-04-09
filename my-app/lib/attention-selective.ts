import { AttSelectAuditiveType, AttSelectTextType, DetectionCiblesVisuType, InhibitionDistractType } from "./definitions";

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

export const AttSelectAuditive: AttSelectAuditiveType = {
    cocktailParty: {
        title: "Cocktail party",
        description: "Suivre un message dans un flux de parole parasité"
    },
    dectectionMotCible: {
        title: "Détection de mot cible",
        description: "Appuyer quand un mot précis est entendu dans un texte oral"
    },
    discriAudiAvecB: {
        title: "Discrimination auditive avec bruit",
        description: "Identifier un son cible malgré un bruit de fond croissant"
    },
    ecouSelectDicho: {
        title: "Écoute sélective dichotique",
        description: "Suivre uniquement l'oreille droite ou gauche"
    }
};

export const AttSelectText: AttSelectTextType = {
    lectureSelect: {
        title: "Lecture sélective",
        description: "Relever uniquement les mots d'une catégorie dans un texte"
    },
    detectionErreurs: {
        title: "Détection d'erreurs",
        description: "Repérer les fautes d'orthographe ou incohérences dans un texte"
    },
    surlignageSelect: {
        title: "Surlignage sélectif",
        description: "Identifier et marquer les informations pertinentes"
    },
    lectureAvecDistract: {
        title: "Lecture avec distracteurs",
        description: "Lire un texte avec des mots non pertinents intercalés"
    }
};