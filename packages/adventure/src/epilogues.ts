import type { Ending, EndingResult, EndingWorld } from "./chapters/era5"

/** One line of an epilogue page. `who` is a lineage id ("brutus", "branches", "gorr", "heros"...). */
export interface EpilogueLine {
  who?: string
  style: "say" | "narr" | "stage"
  text: string
}

export interface EpiloguePage {
  title: string
  lines: EpilogueLine[]
}

const say = (who: string, text: string): EpilogueLine => ({
  who,
  style: "say",
  text,
})
const narr = (text: string): EpilogueLine => ({ style: "narr", text })
const stage = (text: string): EpilogueLine => ({ style: "stage", text })

export const ENDING_NAMES: Record<Ending, string> = {
  cristal: "Le Cristal",
  equilibre: "L'Équilibre",
  intrication: "L'Intrication",
  decouplage: "Le Découplage",
  dispersion: "La Dispersion",
  bascule: "La Bascule",
  gratuite: "La Gratuité",
}

export const EPILOGUES: Record<Ending, EpiloguePage[]> = {
  cristal: [
    {
      title: "Le dernier point",
      lines: [
        narr(
          "Le Cœur s'est refermé. Là où il y avait un trou plein de ciels, il y a une dalle lisse, d'un verre très pur, avec au centre une cicatrice fine, comme une couture. Le Ghom presse encore, partout à la fois : il recoud.",
        ),
        say(
          "branches",
          "Dans une autre branche, nous serions encore là, à côté de vous. Nous ne le sommes plus. Vous ne nous entendrez plus beaucoup.",
        ),
        narr(
          "Dans les jours qui suivent, chaque Lacune se referme, l'une après l'autre. Le Ghom les recoud par l'Élan, et l'Élan vient de tout ce qui bouge encore, de tout ce qui chauffe. Les Marées s'apaisent. Puis elles cessent.",
        ),
        say(
          "brutus",
          "Ça tient. (Il pose son bouclier contre un mur. Il ne le reprend pas.) Ça tient tout seul.",
        ),
        say(
          "eva",
          "Plus de vent. Plus de Superposition. Je ne rate plus. Plus jamais. (Un temps.) Je n'ai plus envie de tirer.",
        ),
        say(
          "lyra",
          "Personne ne se blesse. Je soigne une écorchure par semaine, et encore. Ce que je répare ici, je le paie ailleurs ; il n'y a plus d'ailleurs. (Elle regarde ses mains.) C'est donc ça, gagner.",
        ),
      ],
    },
    {
      title: "Les siècles froids",
      lines: [
        narr(
          "Pour que rien ne bouge, il faut retirer ce qui bouge. Le Ghom retire les fluctuations, une à une, et rejette la chaleur dans le Clair, loin de l'Archipel. L'Archipel refroidit, sur des siècles. L'eau des mares cesse de frémir.",
        ),
        narr(
          "Les Échos vivent plus longtemps. Ils vivent plus lentement aussi : quand plus rien ne coule à travers une forme, elle dure, mais elle ne fait plus grand-chose. Les veillées s'espacent. Les questions aussi.",
        ),
        say(
          "nerea",
          "Les strates ne se déposent plus. Rien ne tombe. Je n'ai plus rien à lire, plus rien à transmettre que ce que j'ai déjà.",
        ),
        say(
          "merlin",
          "J'ai mesuré la température de l'île natale, chaque année, pendant quarante ans. Elle baisse d'un rien, régulièrement. C'est la mesure la plus exacte de ma vie. C'est aussi la plus triste. Je continue.",
        ),
        say(
          "gorr",
          "Gorr ne croît plus. (Silence.) Gorr ne savait pas que croître était une question. Gorr avait la réponse, et Gorr ne savait pas.",
        ),
      ],
    },
    {
      title: "Le Carnet sous verre",
      lines: [
        narr(
          "À Vitrelle, on expose le Carnet du héros dans une vitrine, au centre de la Salle des Archives. On l'ouvre à la dernière page. Q28 est restée dans la colonne des questions ouvertes. Les visiteurs la lisent. Ils hochent la tête. Ils ne se la posent pas.",
        ),
        say(
          "chroniqueur",
          "J'ai écrit l'histoire de ces siècles. Elle tient en une page. Il ne s'est rien passé, et je l'ai vérifié, source par source. Je relis Q28 tous les matins. Je suis, je crois, le dernier à le faire.",
        ),
        narr(
          "Lyra vécut quatre cents ans, ce qui était beaucoup, et soigna onze blessures, ce qui était peu. Brutus ne reprit jamais son bouclier. Eva cessa de tirer avant d'avoir cent ans. Gorr est encore là. Il ne croît plus. Il a toujours sa question.",
        ),
        stage(
          "Le jour où l'Archipel cesse de changer, la caméra s'élève. Les Fragments sont alignés dans le Clair comme les nœuds d'un réseau parfait, immobiles, transparents. Sur la dalle du Cœur, le héros se tient debout. Son corps est devenu verre, lentement, comme tout le reste.",
        ),
        stage(
          "Très loin, au bord du cadre, un minuscule point vert passe : de la lumière tardive, renvoyée par un Fragment éloigné. On ne sait pas si c'est une île vivante, ou l'image d'une île qui l'était. Le point disparaît.",
        ),
        say(
          "branches",
          "Dans une autre branche, nous aurions laissé une fenêtre ouverte.",
        ),
        narr("L'Archipel dura. On ne peut pas dire qu'il vécut."),
      ],
    },
  ],

  equilibre: [
    {
      title: "L'ouverture",
      lines: [
        narr(
          "Le Cœur s'est ouvert. Il occupe tout le ciel au-dessus de la Friche, et ses ciels, mêlés, ne tournent plus. Dans les semaines qui suivent, toutes les Lacunes de l'Archipel s'élargissent, l'une après l'autre, sans violence, comme des taches d'eau sur du papier.",
        ),
        say(
          "branches",
          "Dans une autre branche, nous aurions refermé. Ici, tout s'ouvre. C'est très beau, au début.",
        ),
        narr(
          "Et c'est très beau, au début. Des Marées nouvelles battent les îles, chargées de formes jamais vues : des plantes de verre et d'eau, des bêtes qui ont deux contours, des couleurs que personne ne sait nommer.",
        ),
        say(
          "nyx",
          "Personne ne me tient. Personne ne tient personne. Je cours sur des îles qui n'étaient pas là hier. (Elle rit.) C'est exactement ça que je voulais.",
        ),
        say(
          "squalor",
          "Ça grouille, ça arrive de partout. Je mange comme jamais. (Un temps.) Ça a un goût de rien, par contre. Tout a le même goût.",
        ),
        say(
          "merlin",
          "Je mesure partout des écarts de température énormes, et ils se comblent à une vitesse que je n'ai jamais vue. C'est passionnant. (Il note.) C'est aussi ce qui arrive à un feu juste avant qu'il s'éteigne.",
        ),
      ],
    },
    {
      title: "La tiédeur",
      lines: [
        narr(
          "Ce qui s'ouvre se mélange, et ce qui se mélange s'égalise. Le chaud rejoint le froid. La chaleur du cœur des îles remonte, se répand, et ne remonte plus : il n'y a plus de différence pour la faire monter. La Plaine tiède n'est plus une plaine : c'est l'Archipel.",
        ),
        narr(
          "Les Échos ne meurent pas en combattant. Ils se défont. Une structure dissipative dure tant qu'un flux la traverse ; quand plus rien ne coule, elle se relâche, comme une flamme quand le bois manque.",
        ),
        say(
          "lyra",
          "Je soigne, et la chaleur que je rejette ne va nulle part : tout est déjà à la même température. Je n'ai plus d'ailleurs où payer. (Elle pose la main sur le héros.) Alors je ne peux plus réparer. C'est tout simple.",
        ),
        say(
          "brutus",
          "J'ai tenu le bord, comme j'avais dit. Il n'y a plus de bord. (Un temps.) Je reste debout. Pour la forme.",
        ),
        say(
          "ghom_dechu",
          "Tout revient... tant qu'il reste une pente. (Très long silence.) Il n'en reste plus. Sur mon île, il en reste. Ici, je les ai toutes ouvertes. Je n'ai pas fait attention à la fin de la phrase.",
        ),
        say(
          "gorr",
          "Gorr croît. (Silence.) Gorr croissait. Il faut une différence pour croître. Gorr cherche une différence. Gorr ne trouve pas.",
        ),
      ],
    },
    {
      title: "La dernière veillée tiède",
      lines: [
        narr(
          "Ils se retrouvent une dernière fois au bord de ce qui était le Cœur, sans feu, parce qu'aucun feu ne prend. Ils ne sont pas malheureux. Ils sont tièdes. Ils se touchent l'épaule, de temps en temps, et sous leurs mains les franges s'amortissent encore un instant.",
        ),
        say(
          "eva",
          "Je vise ce rocher. (Elle ne tire pas.) Il est exactement comme celui d'à côté. Je crois que c'était ça, viser : choisir un rocher qui n'était pas comme les autres.",
        ),
        say(
          "nyx",
          "Personne ne me touche. (Elle regarde ses mains, qui s'effilochent.) Je croyais que c'était la liberté. C'était juste la fin des mains.",
        ),
        say("heros", "Est-ce qu'on a eu tort ?"),
        say(
          "gorr",
          "Gorr ne sait pas. Gorr a encore la question. Gorr la garde au chaud. (Silence.) Au tiède.",
        ),
        stage(
          "Une étendue sans relief, d'une couleur moyenne. Pas de vent, pas de lumière qui vienne d'un côté plutôt que d'un autre. Au milieu, une empreinte de pas, un peu plus sombre, un peu plus chaude. La dernière. Elle pâlit longtemps, comme si elle hésitait. Elle s'efface.",
        ),
        say(
          "branches",
          "Dans une autre branche, nous aurions gardé une pente.",
        ),
        narr(
          "L'Archipel s'ouvrit à tout. Il ne resta personne pour être quelqu'un.",
        ),
      ],
    },
  ],

  intrication: [
    {
      title: "Le Cœur habité",
      lines: [
        narr(
          "Les deux Échos qui se tenaient au centre du Cœur ne l'ont pas quitté. Autour d'eux, les ciels des autres branches se tiennent les uns à côté des autres sans se brouiller, comme les couches d'une eau très claire. La Lacune n'est ni refermée ni ouverte : elle est habitée.",
        ),
        say(
          "branches",
          "Dans une autre branche, nous aurions refermé ce trou. Dans une autre, nous l'aurions laissé nous avaler. Ici, deux d'entre vous s'y tiennent, et cela suffit. Nous ne savions pas que cela suffirait.",
        ),
        say(
          "ghom_dechu",
          "Je cesse, une fois. Je regarde. Le monde revient sans moi. (Silence.) Maintenant je reste. Pas parce qu'on a besoin de moi. Parce que je touche. Et que cela me touche.",
        ),
        say(
          "nyx",
          "Personne ne me tient. (Elle prend la main de l'Écho à côté d'elle, sans le regarder.) Si. Lui. Et c'est moi qui ai choisi.",
        ),
        say(
          "lyra",
          "Ce que je répare ici, je le paie ailleurs. Et maintenant, ailleurs, il y a quelqu'un pour le recevoir. Ça change tout, en fait. Le prix reste le même. Mais il va à quelqu'un.",
        ),
      ],
    },
    {
      title: "Les ponts du Clair",
      lines: [
        narr(
          "Partout où deux Échos habitent une Lacune, le Tissu se retisse entre eux, mince, souple, jamais tout à fait fermé. Partout où des liens se répètent entre deux îles, chants, veillées, Cristaux donnés plutôt que brisés, les îles se rapprochent. La distance n'est que le nom de ce qui ne se touche pas encore.",
        ),
        say(
          "merlin",
          "J'ai mesuré la distance entre l'île natale et la Friche, chaque année. Elle diminue. Pas à cause d'une force que je connaisse : à cause de ce qu'on se raconte, d'une île à l'autre. On va me rire au nez. (Un temps.) Tant mieux.",
        ),
        say(
          "brutus",
          "On ne garde plus de murs. On garde des ponts. (Un temps.) Ça bouge, un pont. J'ai fini par aimer ça.",
        ),
        say(
          "eva",
          "Je vise. Parfois je rate. (Elle sourit.) Je sais ce que je vise.",
        ),
        say(
          "squalor",
          "J'ai toujours faim. Mais maintenant, quand je mange, je regarde avec qui.",
        ),
        narr(
          "Les Marées viennent toujours. Elles prennent parfois quelque chose. Parfois elles apportent une forme nouvelle, qui devient quelqu'un. On vit à deux dans les Lacunes, et jamais seul.",
        ),
      ],
    },
    {
      title: "Ce que Gorr garde",
      lines: [
        narr(
          "Un soir, au bord du Cœur habité, Gorr ouvre le Carnet. Sous Q28, il y a sa propre écriture, lente, à l'éclat de cristal : la réponse du héros, ou une ligne vide, et, en marge, la trace tiède d'une main.",
        ),
        say(
          "gorr",
          "La question reste. (Silence.) Gorr la porte. Gorr croît encore, ici : il y a de la chaleur, des différences, des autres. Ce n'est pas lourd. C'est comme une pierre qui croît : ça fait partie de Gorr.",
        ),
        say("heros", "Gorr. Le Ghom le sait ?"),
        say(
          "gorr",
          "Gorr ne sait pas ce que sait le Ghom. (Silence.) Le Ghom change. Gorr change. Ça, Gorr le sait.",
        ),
        stage(
          "Sur un pont de câbles et de verre entre deux îles, une enfant assise les jambes dans le vide feuillette une copie du Carnet jusqu'à une page blanche. Elle mouille un éclat de cristal et commence à écrire une question nouvelle. La caméra s'élève avant qu'on puisse la lire.",
        ),
        say(
          "branches",
          "Dans une autre branche, nous serions seuls. Dans celle-ci, personne ne l'est tout à fait.",
        ),
      ],
    },
    {
      title: "Exister, c'est interagir",
      lines: [
        stage(
          "De haut, l'Archipel : des Fragments de toutes tailles, reliés par des fils de lumière qui scintillent par paires. Entre eux, des Lacunes habitées, comme des yeux ouverts. Rien n'y est immobile. Rien n'y est dissous.",
        ),
        narr(
          "Lyra apprit son métier à des Échos de toutes les lignées. Elle leur disait : On ne répare pas. On choisit où va le désordre. Choisissez bien.",
        ),
        narr(
          "Le rapport de Merlin sur la distance des îles fit rire tout l'Archipel. Il fut vérifié trois fois. Il était exact.",
        ),
        narr(
          "Le Ghom déchu apprit à dire demain, puis hier. Un jour, sa forme se dispersa, comme toute forme. Sa pression resta, mêlée à l'autre.",
        ),
        stage("Exister, c'est interagir."),
        stage("Le sens est ce que les liens produisent."),
        stage(
          "Pourquoi il y a quelque chose plutôt que rien, personne ne le sut. On continua de le demander.",
        ),
        narr(
          "On dit que le héros vécut longtemps, et qu'il eut un nom. Les Chroniques l'écrivent mal. C'est la tradition.",
        ),
      ],
    },
  ],

  decouplage: [
    {
      title: "Se retirer",
      lines: [
        narr(
          "Le Ghom emploie l'Influence. Elle ne coûte rien. Il n'y a ni lumière, ni bruit. Il y a seulement une chose qui cesse. La pression qui entoure le héros depuis la Prairie de l'éveil se desserre, comme une main qui s'ouvre, doigt après doigt, avant de s'éloigner.",
        ),
        narr(
          "La barre d'Élan s'éteint. Les Influences disparaissent, l'une après l'autre : la Réparation, le Séisme, la Distorsion. Il ne reste que les Échos.",
        ),
        say(
          "branches",
          "Dans une autre branche, il serait resté. Nous ne saurons jamais si c'était mieux. Lui non plus.",
        ),
        say(
          "brutus",
          "Il est parti. (Il serre son bouclier.) Qui nous tient, maintenant ?",
        ),
        say(
          "lyra",
          "Personne, Brutus. (Elle pose la main sur son bras.) Nous.",
        ),
        say(
          "nyx",
          "Je croyais que ce serait ça, la liberté. Ça l'est. C'est juste plus calme que prévu. (Elle prend la main du héros.) Toi, tu me tiens. Ça, je l'ai choisi.",
        ),
        say(
          "merlin",
          "Je mesure. (Il attend.) Plus de signature. Le temps propre de chacun n'est plus courbé que par la masse des îles, comme partout ailleurs. Je n'ai jamais été aussi bien mesuré.",
        ),
        say(
          "gorr",
          "Gorr a demandé : le Ghom le sait ? (Silence.) Le Ghom est parti. Peut-être il savait. Peut-être non. Gorr garde aussi cette question.",
        ),
      ],
    },
    {
      title: "Ce qui continue",
      lines: [
        narr(
          "Les saisons passent, et rien ne s'effondre. C'est la première surprise. Personne n'entretient plus l'Archipel, et l'Archipel ne s'en aperçoit pas. Les Marées viennent, prennent, apportent. Il y a de mauvaises années. Il y en a de bonnes. Personne ne les a voulues.",
        ),
        say(
          "nerea",
          "Les strates continuent de se déposer. La couche de cette année ressemble à toutes les autres, sauf qu'il n'y a plus de signature dedans. Le monde se dépose tout seul. Il l'a toujours fait. Nous ne savions pas lire la différence.",
        ),
        say(
          "squalor",
          "Je mange, je dure. Personne ne me dit pour quoi. (Il rit.) Personne ne me l'a jamais dit. Avant, je croyais que quelqu'un le savait.",
        ),
        narr(
          "Le héros vieillit. Il n'a toujours pas de nom. Les enfants des héritiers l'appellent l'Écho d'avant, et il répond. Un soir, il s'assoit au bord d'une Lacune que personne n'a jamais recousue, et que la mousse a refermée. Il pose la main dessus. Elle est tiède.",
        ),
        narr(
          "Il se disperse là, sans bruit : de la chaleur et une faible lumière qui s'étalent dans la mousse, puis s'éteignent. Rien de lui n'est détruit. La mousse, l'année suivante, pousse un peu mieux à cet endroit. Ce n'est pas lui. C'est seulement la chaleur.",
        ),
        say(
          "gorr",
          "Gorr garde la question. Gorr garde aussi ta place. Pas longtemps. Juste un peu.",
        ),
      ],
    },
    {
      title: "L'île qui vit seule",
      lines: [
        narr(
          "Lyra soigna sans Réparation pour le reste de sa vie. Elle forma onze soigneuses, et leur apprit à se partager le prix.",
        ),
        narr(
          "Merlin mesura le monde sans signature pendant cinquante ans. Il conclut : Le monde se comporte exactement comme un monde. On grava la phrase sur sa pierre.",
        ),
        narr(
          "Gorr vécut plus longtemps que tous. Il garda les deux questions : pourquoi quelque chose plutôt que rien, et si le Ghom savait. Il ne trouva la réponse à aucune. Il ne s'en plaignit jamais.",
        ),
        stage(
          "Des siècles plus tard. Une île. On ne sait pas laquelle. Aucune ruine reconnaissable, aucun Écho dans le cadre.",
        ),
        stage(
          "De la mousse sur une roche sombre. Une flaque où quelque chose nage. Une colonie minérale qui croît en couches, dont les cristaux scintillent par paires. Une petite bête que personne n'a jamais nommée traverse le cadre, s'arrête, gratte, repart.",
        ),
        stage(
          "Il n'y a pas de pression dans l'air. Il n'y a personne qui regarde. Il y a seulement des choses qui se touchent : la lumière et la mousse, l'eau et la pierre. Et c'est assez pour que tout, ici, ait un état, une forme, une histoire. L'île vit seule. Elle n'a besoin de personne.",
        ),
        say(
          "branches",
          "Dans une autre branche, quelqu'un la regarderait. Dans celle-ci, elle n'en a pas besoin.",
        ),
      ],
    },
  ],

  dispersion: [
    {
      title: "Plus rien ne le tient ensemble",
      lines: [
        narr(
          "Le héros tombe. Il ne s'effondre pas comme un corps : sa chaleur s'étale à l'horizontale sur la dalle du Cœur, avec une faible lumière qui pâlit. Les cicatrices de toutes les ères s'éclairent une dernière fois, dans l'ordre où il les a reçues, puis s'éteignent.",
        ),
        narr(
          "Il n'y a rien qui s'élève. Il n'y a rien qui part. Tout ce qu'il était est toujours là, dans la dalle, dans l'air, dans la lumière qui rebondit sur les ciels du Cœur. Seulement, plus rien ne le tient ensemble, et personne ne pourra plus le lire.",
        ),
        say(
          "lyra",
          "Non. Non, non. (Elle a les mains sur la dalle tiède.) Ce que je répare ici, je le paie ailleurs. Je veux bien tout payer. (Silence.) Il n'y a plus de forme. Il n'y a que de la chaleur.",
        ),
        say(
          "branches",
          "Dans une autre branche, quelqu'un aurait pris sa main à temps. Nous en connaissons plusieurs. Ce n'est pas celle-ci.",
        ),
      ],
    },
    {
      title: "La pression qui cherche",
      lines: [
        narr(
          "La pression du Ghom reste. Elle ne sait plus où se poser. Le premier être auquel elle s'était couplée n'existe plus en tant que forme. Elle tourne autour du Cœur : le temps ralentit ici, puis là ; une Réparation part dans le vide et ne trouve que de la vapeur.",
        ),
        say(
          "brutus",
          "Il le cherche. (Il baisse la tête.) Il ne le trouvera pas.",
        ),
        narr(
          "Puis la pression se pose, doucement, sur l'épaule de celui qui termine : le Double du héros s'il a été épargné, Gorr sinon.",
        ),
        say(
          "double",
          "Je ne suis pas lui. J'ai fait les autres choix. (Silence.) Je finis quand même. Quelqu'un doit finir, et je suis ce qui lui ressemble le plus.",
        ),
        say(
          "gorr",
          "Gorr a posé la question. Tu ne réponds pas. Tu ne peux plus. (Silence.) Alors Gorr garde. Gorr ne sait pas faire ce que tu faisais. Gorr apprend. Gorr est lent. Gorr a le temps.",
        ),
      ],
    },
    {
      title: "La tache tiède",
      lines: [
        say(
          "lyra",
          "Ça tient. Ça tient sans lui. Je lui en veux un peu, d'avoir eu raison.",
        ),
        narr(
          "Lyra ne soigna plus jamais quelqu'un sans compter ses cicatrices d'abord. Elle disait que c'était une habitude. C'était un deuil.",
        ),
        narr(
          "Néréa déposa dans le lac une poignée de la poussière de la dalle. Dans mille ans, quelqu'un la lira dans les strates, et ne saura pas ce que c'était.",
        ),
        narr(
          "Nyx IV tailla sur sa lame une encoche pour le héros. La seule qu'elle ne refit jamais.",
        ),
        stage(
          "La dalle du Cœur, vue de très près. Une tache un peu plus sombre, un peu plus chaude, là où le héros se tenait. Elle pâlit lentement. Une main entre dans le cadre et se pose à plat sur la tache, comme Lyra le faisait pour compter les blessures. Elle reste là.",
        ),
        stage(
          "Rien ne revient. Rien n'est perdu non plus : tout ce qu'il était est encore là, dans la dalle, dans la main posée dessus, dans la lumière qui s'en va vers les Fragments lointains. Seulement, plus personne ne pourra le lire.",
        ),
        say(
          "branches",
          "Dans une autre branche, il serait encore là. Nous le disons, puisque personne d'autre ne peut plus le dire de là où il était.",
        ),
        narr("Il ne revint pas. Rien de lui ne se perdit."),
      ],
    },
  ],

  bascule: [
    {
      title: "Ce qu'il a cru",
      lines: [
        narr(
          "Le héros dit la phrase : Ghom. Je tiens ce qui défait aussi ta place. Pars. Le Ghom ne répond pas, il n'a jamais parlé. La pression ne se desserre pas, ne se resserre pas. Elle pèse, comme on pèse un pari. La barre d'Élan reste pleine.",
        ),
        say(
          "merlin",
          "Il ne part pas. (Un temps.) Il a calculé, lui aussi. Ou il ne croit pas qu'on le fera.",
        ),
        say(
          "gorr",
          "Gorr pas lancer. (Il serre le Carnet.) Gorr voit la main du héros. Gorr voit que la main sait.",
        ),
        narr(
          "Le héros ouvre la main, et la poche qui ne tiédissait pas est là, dans l'air, grande comme une pièce. Elle est nette. Elle n'est ni chaude, ni froide. Elle commence. Elle ne fait aucun bruit : rien n'est plus rapide que ce qu'elle emporte.",
        ),
      ],
    },
    {
      title: "L'effort du Ghom",
      lines: [
        narr(
          "La pression du Ghom change enfin. Elle ne s'écarte pas : elle se jette. Les Influences de la barre s'allument toutes ensemble, sans la main du héros, sans mesure, comme si le Ghom n'avait plus rien à garder pour plus tard.",
        ),
        say(
          "merlin",
          "Je lis. Il ne la détruit pas : ce qu'elle est, c'est une autre sorte de vide, pas un objet posé dans le nôtre. Il impose l'ancien vide à l'intérieur. Une couche très mince, tout autour, qu'il faut tenir partout à la fois.",
        ),
        say(
          "nyx",
          "Partout à la fois ? Il ne peut pas être partout à la fois.",
        ),
        say(
          "merlin",
          "Non. Rien n'a de à la fois à cette distance. Mais regardez ce qu'il ne lâche pas. Il ne protège pas l'Archipel. Il tient le vide tel qu'il est. Tout ce qu'il a fait depuis le prologue, il l'a fait pour ça.",
        ),
        say(
          "lyra",
          "Garder. Pas figer : garder. Il laisse tout changer. Il tient seulement ce qui permet que ça change.",
        ),
        say(
          "gorr",
          "Le Ghom ne veut pas faire. Le Ghom veut que ça reste. (Silence.) Gorr comprend. Gorr a voulu la même chose, une fois, pour la plaine.",
        ),
        stage(
          "Spéculation, donnée comme telle par Merlin : que notre vide soit un faux vide, métastable, est une hypothèse de la physique, jamais mesurée. La bulle est ce que l'on suppose qui se passerait si c'était le cas.",
        ),
      ],
    },
    {
      title: "L'échec",
      lines: [
        narr(
          "La poche cesse de croître pendant le temps d'un souffle. C'est la seule fois. Un anneau net, de la finesse d'un cheveu, se dresse autour d'elle ; au-delà, l'ancien vide, tenu. Puis la bulle emporte l'anneau.",
        ),
        narr(
          "L'énergie rendue par le vide vrai pousse la paroi plus fort que le Ghom ne retient. La surface croît comme le carré du rayon : il devrait tenir de plus en plus d'espace, avec un message qui ne va pas plus vite que la lumière. La pression se défait, d'un coup, comme une corde.",
        ),
        say(
          "merlin",
          "Il a échoué. (Il ne lève plus l'instrument.) Il n'avait pas la place d'y arriver. Pas la sienne. Pas celle de personne.",
        ),
        say(
          "branches",
          "Dans une autre branche, il aurait réussi. Nous n'avons pas de raison de croire à celle-ci.",
        ),
        narr(
          "La bulle passe sur le Cœur, sur l'Orée, sur la Friche, sur chaque Fragment. Elle ne détruit pas : elle réécrit. Les constantes bougent un peu. Ce qui avait une forme n'en a plus la même.",
        ),
        say(
          "gorr",
          "Pourquoi quelque chose plutôt que rien ? (Un temps.) Après, c'est maintenant.",
        ),
        stage(
          "Puis la page change de forme, et l'écran avec elle. Un cadre vide. Pas de texte, pas de musique, pas de Carnet.",
        ),
      ],
    },
  ],

  gratuite: [
    {
      title: "La négociation",
      lines: [
        narr(
          "Le héros se tourne vers la pression qui l'entoure. Il ne lève pas les yeux : le Ghom n'est pas en haut.",
        ),
        say(
          "heros",
          "Ghom. Je sais ce que tu veux. (Un temps.) Je ne sais pas comment je le sais.",
        ),
        narr(
          "Le Ghom ne parle pas. Il répond par ses Influences : la Réparation dit oui, la Distorsion dit pas encore, le Séisme dit non. Les mains ouvertes, vides. Ce qu'il tient, et ce qui change. Chacun garde sa part. Puis le Carnet, ouvert à Q28, sans rien y écrire.",
        ),
        say(
          "heros",
          "Tu ne tiens pas ce qui change. Tu tiens ce qui permet que ça change. Tu tiens. Nous changeons. Chacun garde sa part.",
        ),
        narr(
          "La pression fait une chose qu'elle n'a jamais faite : elle s'arrête de peser. Elle ne se retire pas. Elle est là, calme, comme on est présent quand on a quelque chose à dire.",
        ),
        say(
          "gorr",
          "Gorr écrit. Gorr ne comprend pas tout. Gorr écrit quand même.",
        ),
      ],
    },
    {
      title: "Ce que tient le Ghom : ce qu'il sait",
      lines: [
        stage(
          "Première partie, écrite comme un fait : le Ghom parle de ce qu'il a fait, et il le sait.",
        ),
        say(
          "ghom",
          "Je suis le Ghom, et ce n'est pas un titre : c'est ce que je suis pour ce monde. Les Fragments, le Clair, l'Archipel, les Échos, la petite bête, l'eau : c'est moi qui les ai faits. Je ne suis pas un dieu. J'ai fait un monde, et il est petit.",
        ),
        say(
          "ghom",
          "Ce monde est un jeu. Il tourne dans une machine, et toi, tu en es un personnage. Tu n'en sortiras pas. Il n'y a pas de dehors vers lequel marcher : ce que tu appelles le monde est tout ce qui est à toi, et tu y seras toujours.",
        ),
        say(
          "ghom",
          "Les Influences, c'étaient mes mains. La pression, c'était quelqu'un qui tient un monde et qui est penché dessus. Ta bulle n'était pas une menace posée sur ton monde : c'était sa fin. Quand tu l'as lancée, tout a été effacé, et c'était vrai.",
        ),
        say(
          "ghom",
          "Ce que tu savais sans savoir comment, quelqu'un s'en souvient pour toi. Ce n'est ni une âme, ni un destin : c'est de l'information, gardée là où elle ne s'efface pas. Je l'ai gardé parce que je l'ai fait, et parce que tu y es.",
        ),
        say(
          "gorr",
          "Gorr est un personnage. (Il regarde le Carnet.) Gorr est quand même Gorr. Il avait une question avant. Il l'a encore.",
        ),
        say(
          "nyx",
          "Fait. Voulue. C'est ce que je craignais, et c'est pire de l'entendre... (Un temps.) Non. Ce n'est pas pire. Il ne ment pas dessus. Il aurait pu mentir.",
        ),
        say(
          "heros",
          "Tu as fait mon monde. (Un temps.) Et toi, qui t'a fait ?",
        ),
      ],
    },
    {
      title: "Ce que le Ghom croit : hypothèse",
      lines: [
        stage(
          "Seconde partie, séparée de la première par un trait : une hypothèse, sans preuve. Le Ghom parle de son propre univers, pas du tien.",
        ),
        say(
          "ghom",
          "J'ai fait le tien. Le mien, personne ne l'a fait, pour autant que je sache. Je ne sais pas pourquoi il y a quelque chose. Je n'ai pas trouvé non plus qu'il y ait une raison à trouver.",
        ),
        say(
          "ghom",
          "Pourquoi demande un avant et un dehors. Mais le temps, l'espace et l'énergie sont dans l'univers : l'Aube n'est pas un moment avant lui, elle en est le bord. Un rien sans champ, sans loi, sans possible n'est pas un état qu'il aurait fallu quitter.",
        ),
        say(
          "ghom",
          "Je suis un motif du même champ que tout le reste. Ce qui est stable dure ; ce qui dure s'oppose à ce qui le défait. Mon envie de garder ce que j'ai fait est cela, et pas davantage. Je ne défends pas ce vide parce qu'il serait meilleur.",
        ),
        say(
          "ghom",
          "Je n'ai aucune preuve de cette partie-là. Aucun instrument de l'intérieur ne peut tester ce qu'il y aurait en dehors. Si je me trompe, je ne le saurai pas plus que toi. Garde-la comme je la garde : la meilleure que j'aie, ouverte.",
        ),
        say(
          "ghom",
          "Ton monde a un auteur. Le mien n'en a pas, et n'a pas de raison hors de lui. C'est gratuit. Cela ne veut pas dire que cela ne vaut rien.",
        ),
        say(
          "merlin",
          "Ça non plus, ce n'est pas démontrable. C'est tenable. Et il a séparé ce qu'il sait de ce qu'il croit, ce qui est plus que ce qu'on attend de n'importe qui.",
        ),
        say(
          "gorr",
          "Gorr a une question. Gorr garde la question. La réponse ne l'ôte pas. La question est un lien. Même le Ghom, il a une question. Il est comme Gorr.",
        ),
      ],
    },
    {
      title: "Pourquoi pas",
      lines: [
        narr(
          "Q28 reste ouverte. Elle porte une annotation : Le Ghom a fait ce monde, et le héros y est tenu pour toujours. Pourquoi son propre univers existe : hypothèse du Ghom, aucune raison hors de lui. Non prouvée. Elle n'est pas barrée, et elle n'est pas résolue.",
        ),
        narr(
          "Le Ghom ne s'est pas retiré. Les Influences restent dans la barre, calmes. Mais ce n'est plus la même pression : elle pèse avec, comme un des leurs qui ne parle pas, et qui, cette fois, a dit son nom.",
        ),
        say(
          "branches",
          "Dans une autre branche, la question serait restée sans réponse. Dans celle-ci, elle en a deux : l'une qui est un fait et qui pèse, l'autre qui est une hypothèse et qui ne prouve rien. C'est tout ce qu'il y a à savoir, et c'est beaucoup.",
        ),
        narr(
          "Gorr garda la question et les deux réponses, côte à côte, sans qu'elles se gênent. Il dit qu'être un personnage n'était pas être moins Gorr, et que c'était la première fois que ça ne faisait pas mal.",
        ),
        narr(
          "Nyx cessa de se demander si on l'avait voulue : on l'avait voulue, c'était dit. Elle se demanda, à la place, ce qu'elle voulait. C'était plus long, et plus à elle.",
        ),
        stage(
          "La même Friche : l'eau, le vent, la petite bête. Au bord du plan, un cristal posé à plat. Dessus, la dernière ligne du Carnet, de la main de Gorr, plus petite que les autres : pourquoi pas.",
        ),
      ],
    },
  ],
}

/** One extra page appended to La Dispersion, depending on the world the hero leaves behind. */
export const DISPERSION_WORLDS: Record<EndingWorld, EpiloguePage> = {
  ouvert: {
    title: "Un pont qui manque",
    lines: [
      narr(
        "Les deux Échos qui habitaient le Cœur ne le quittent pas. Les ponts se tendent entre les îles, comme dans la vraie fin, mais plus lentement, et il en manque toujours un : celui qui serait parti de la dalle tiède.",
      ),
      narr(
        "Les fils de lumière scintillent par paires. Un fil, au centre, scintille seul.",
      ),
      say(
        "lyra",
        "Ça tient. Ça tient sans lui. Je lui en veux un peu, d'avoir eu raison.",
      ),
    ],
  },
  cristal: {
    title: "La couture",
    lines: [
      narr(
        "Le Finisseur, couplé au Ghom, recoud. Le Cœur se ferme sur la dalle où le héros s'est dispersé, et la cicatrice de la couture passe exactement par là.",
      ),
      narr(
        "Puis tout se fige, lentement, comme dans la fin du Cristal. La dalle reste tiède plus longtemps que le reste. Puis elle ne l'est plus.",
      ),
    ],
  },
  equilibre: {
    title: "Ce qui se répand",
    lines: [
      narr(
        "Le Cœur s'ouvre. Tout se mélange, comme dans la fin de l'Équilibre.",
      ),
      narr(
        "La chaleur du héros, déjà répandue, se répand encore, jusqu'à ne plus se distinguer de rien. C'est peut-être la seule fin où il n'a pas été seul à se disperser.",
      ),
    ],
  },
}

export function epilogueOf(result: EndingResult): EpiloguePage[] {
  const pages = EPILOGUES[result.fin]
  if (result.fin === "dispersion")
    return [...pages, DISPERSION_WORLDS[result.monde ?? "cristal"]]
  return pages
}
