import { AttSelectAuditiveType, AttSelectSpatialeType, AttSelectTextType, DetectionCiblesVisuType, FiltrageSemanticType, InhibitionDistractType, StrategieRemediationType } from "./definitions";

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

export const AttSelectSpatiale: AttSelectSpatialeType = {
    paradiPosner: {
        title: "Paradigme de Posner",
        description: "Orienter l'attention vers un indice spatial valide ou invalide"
    },
    fenAttention: {
        title: "Fenêtre attentionnelle",
        description: "Détecter une cible dans une zone restreinte de l'écran"
    },
    exploSystematic: {
        title: "Exploration systématique",
        description: "Balayer méthodiquement un espace pour trouver des cibles"
    },
    extinctionVisu: {
        title: "Extinction visuelle",
        description: "Détecter des cibles présentées unilatéralement ou bilatéralement"
    }
};

export const FiltrageSemantic: FiltrageSemanticType = {
    categoriRapide: {
        title: "Catégorisation rapide",
        description: "Répondre uniquement aux mots d'une catégorie cible"
    },
    decisionLexiSelect: {
        title: "Décision lexicale sélective",
        description: "Appuyer uniquement sur les mots vivants / non-vivants"
    },
    triSelectif: {
        title: "Tri sélectif",
        description: "Classer des cartes en ignorant une dimension non pertinente"
    },
    jugmntSemanticDistra: {
        title: "Jugement sémantique avec distracteurs",
        description: "Répondre à la cible sémantique malgré des distracteurs proches"
    }
};

export const StrategieRemediation: StrategieRemediationType = {
    reducProgDistract: {
        title: "Réduction progressive des distracteurs",
        description: "Commencer sans distracteur, augmenter graduellement"
    },
    saillanceCible: {
        title: "Saillance de la cible",
        description: "Rendre la cible très distincte au départ, puis la rapprocher des distracteurs"
    },
    verbaliRegle: {
        title: "Verbalisation de la règle",
        description: "Énoncer à voix haute le critère de sélection avant chaque essai"
    },
    entrainmtInhib: {
        title: "Entraînement à l'inhibition",
        description: "Pratiquer intensivement les tâches Stroop et Flanker"
    },
    feedBackImmediat: {
        title: "Feedback immédiat",
        description: "Corriger chaque erreur de sélection immédiatement"
    }
};