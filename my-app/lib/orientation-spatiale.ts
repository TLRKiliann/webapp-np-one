import { 
    OrientationCorpoType, 
    OrientationExtraType, 
    OrientationPeriType, 
    OrientationTempAlloType, 
    RotaTransMentalType, 
    StrategieCompType 
} from "./definitions";

export const StrategieComp: StrategieCompType = {
    ancrageCorpo: {
        title: "Ancrage corporel",
        description: "Utiliser le corps comme référentiel stable (côté dominant)"
    },
    verbaTrajet: {
        title: "Verbalisation du trajet",
        description: "Décrire à voix haute les étapes d'un déplacement"
    },
    pointRepSail: {
        title: "Points de repère saillants",
        description: "Apprendre à identifier et mémoriser des repères visuels clés"
    },
    exploSytem: {
        title: "Exploration systématique",
        description: "Balayer l'espace de gauche à droite de façon méthodique"
    }
};

export const OrientationCorpo : OrientationCorpoType = {
    droiteGaucheSoi: {
        title: "Droite/gauche sur soi",
        description: "Désigner rapidement la main droite, l'oreille gauche..." 
    },
    droiteGaucheAutre: {
        title: "Droite/gauche sur autrui",
        description: "Désigner droite/gauche sur un personnage face à soi (inversion)" 
    },
    schemaCorp: {
        title: "Schéma corporel",
        description: "Pointer une partie du corps nommée sur une silhouette" 
    },
    imitationPosture: {
        title: "Imitation de postures",
        description: "Reproduire la position des membres d'un modèle (miroir vs. identique)"
    },
};

export const OrientationPeri: OrientationPeriType = {
    relationTopo: {
        title: "Relations topologiques",
        description: "Placer un objet selon une consigne (au-dessus, derrière, entre...)"
    },
    copyFigureOrient: {
        title: "Copie de figure orientée",
        description: "Reproduire une figure en respectant son orientation exacte"
    },
    bissectionLignes: {
        title: "Bissection de lignes",
        description: "Trouver le milieu d'une ligne (détecte l'héminégligence)"
    },
    barrageCibles: {
        title: "Barrage de cibles",
        description: "Rayer toutes les cibles sur une feuille (exploration systématique)"
    },
    reperageSurGrille: {
        title: "Repérage sur grille",
        description: "Localiser une case selon des coordonnées (ligne/colonne)"
    }
};

export const OrientationTempAllo: OrientationTempAlloType = {
    orientTempoSpatiale: {
        title: "Orientation temporo-spatiale",
        description: "Questions sur la date, le lieu, la saison (type MMS)"
    },
    reorderEvents: {
        title: "Remise en ordre d'événements",
        description: "Replacer des images d'une journée dans l'ordre chronologique"
    },
    calendarInteractif: {
        title: "Calendrier interactif",
        description: "Localiser une date sur un calendrier, calculer des intervalles"
    }
};                                        

export const OrientationExtra: OrientationExtraType = {
    planLieuFam: {
        title: "Plan d'un lieu familier",
        description: "Dessiner de mémoire le plan de son appartement, quartier"
    },
    lectureCarte: {
        title: "Lecture de carte",
        description: "Suivre un itinéraire sur une carte simplifiée"
    },
    apprenTrajVirtuel: {
        title: "Apprentissage d'un trajet virtuel",
        description: "Mémoriser et reproduire un chemin dans un environnement simulé"
    },
    orientPointRepere: {
        title: "Orientation par points de repère",
        description: "Identifier sa position à partir de repères visuels"
    },
    estimationDistance: {
        title: "Estimation de distances",
        description: "Juger quelle distance est la plus grande entre deux trajets"
    }
};

export const RotaTransMental: RotaTransMentalType = {
    rotaMentalObj: {
        title: "Rotation mentale d'objets",
        description: "Identifier un objet après rotation de 90°, 180°"
    },
    perspecSpatiale: {
        title: "Perspective spatiale",
        description: "Décrire une scène vue depuis un autre point de vue"
    },
    cubeShepard: {
        title: "Cube de Shepard",
        description: "Jugement d'identité de figures 3D orientées différemment"
    },
    depilageSolides: {
        title: "Dépliage de solides",
        description: "Reconnaître le patron d'un cube ou d'un solide"
    }
};