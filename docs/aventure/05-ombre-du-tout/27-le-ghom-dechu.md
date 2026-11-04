# Chapitre 27 — Le Ghom déchu

> « Je cesse. Je regarde. Longtemps, rien. Puis une mousse. »
> — Le Ghom déchu, s'il prend une forme

## Fiche

| | |
| --- | --- |
| Ère | V — L'Ombre du Tout |
| Lieu | **La Friche** : le cœur de **la Dérive**, le Fragment que le Ghom du Chaos a cessé d'entretenir, autrefois (l'Archive de la Dérive au ch. 6, les strates du ch. 11), arraché par la déchirure et monté au milieu d'elle. Roche sombre de l'ère I, couverte de mousses, de croûtes, de colonies minérales. Au-dessus, très proche, le Cœur de la déchirure. |
| Équipe | Celle du chapitre 26. **Si Gorr n'est pas dans l'équipe** (`trahison.gorr` sans retour), on le retrouve ici et il rejoint. **Retrouvés ici :** Merlin IV (si pas `merlin_convaincu`) et Squalor IV (si pas `squalor_rejoint`), qui étaient dans le camp du Ghom du Chaos au ch. 24. **Peut rejoindre :** le Ghom déchu, sous une forme d'Écho (`ghom_dechu.echo`). |
| Durée visée | 7 nœuds : 3 Rencontres, 1 Archive (optionnelle), 1 Lacune, 1 nœud à trois voies (Combat, Scène ou Combat partagé), 1 Fin. |
| Question au Carnet | Q27 — *Le monde a-t-il besoin de nous ?* (même ère) |
| Réponses au Carnet | Q27 (ce chapitre) ; **Q18** (*Le monde a-t-il besoin de nous pour avoir un sens ?*, posée au ch. 18). |

## Ce que le joueur sait en arrivant

- Depuis l'ère II (ch. 11), il sait que **le Ghom du Chaos a été un Ghom de l'Ordre**, et qu'il a cessé d'entretenir son Fragment, la Dérive : les premières Lacunes sont nées là. Les strates lui ont même montré, en vase, la vie revenue seule, « plus sombre et plus libre ». Ce qu'elles ne disaient pas, c'est **pourquoi** il avait cessé. `ghom_dechu.verite` mesure ce qu'il en a appris (0 à 3).
- Au chapitre 23, dans la Salle des Défauts, il a lu que la signature du Ghom du Chaos est devenue **froide** : les Lacunes qu'il a laissé naître l'ont refroidi en retour. Gorr a demandé : « Le Ghom le sait ? »
- Au chapitre 23, il a appris que **toute influence est réciproque** : le Ghom a été changé par l'Archipel autant qu'il l'a changé (`carnet.Q23`).
- Au chapitre 24, le Ghom du Chaos était au Bord, en face, sans visage : il éteignait les terres autour du gris, pour voir si le monde se passerait de lui.
- Au bout de la Plaine tiède (ch. 26), l'équipe a vu de la mousse sur une roche morte.

## Synopsis

La Friche est le cœur de la Dérive, l'île que le Ghom déchu a abandonnée il y a très longtemps, montée au milieu de la déchirure. Les strates de l'ère II l'avaient montrée en vase ; on la voit enfin debout, couverte de vie. Personne ne l'a semée. La chaleur du cœur de l'île et la lumière des Fragments lointains ont suffi : des croûtes, puis des mousses, puis des pierres qui croissent comme Gorr, et le Tissu s'y est retissé tout seul, interaction après interaction. Au centre, le Ghom déchu attend. Il ne veut rien détruire : il voulait savoir si le monde avait besoin des Ghoms, et il a la réponse. Le héros peut le **combattre** (lui retirer la Friche en la recousant), le **suivre** (tout laisser aller), le **laisser** vivre là sous une forme d'Écho, ou **se coupler avec lui** : deux Ghoms liés au même monde, sans maître. Ce dernier choix n'est pas une réplique du héros : c'est un acte du Ghom.

## Carte du chapitre

```
[1 Rencontre : Ce qui a poussé]        (+ Gorr retrouvé, s'il était absent)
          │
[2 Archive (optionnelle) : Les couches de la Friche]
          │
[3 Lacune : Traverser sans écraser]
          │
[4 Rencontre : La présence]
          ├── attaquer ─────────────────────────────► [5a Combat : La Friche disputée]   → vaincu
          └── attendre → le Ghom déchu prend forme
                    │
              [5 Rencontre : Celui qui a cessé]
                    ├── « Pour réparer. »  ──────────► [5a Combat : La Friche disputée]  → vaincu
                    ├── « Laissons tout aller. » ────► [5b Scène : L'ouverture]          → suivi
                    ├── « Reste ici. » ──────────────► [5c Scène : Le jardinier]         → laisse
                    └── « Parce qu'on est liés. » ───► [5d Influence : Se coupler]
                                                         ├── le Ghom se couple ─► [5e Combat : Les deux pressions] → couple
                                                         └── le Ghom ne fait rien ─► [5c Scène : Le jardinier] → laisse
          │
[6 Fin : Au-dessus, le Cœur]
```

## Scènes

### 1. Rencontre — Ce qui a poussé

*La roche sombre de la Dérive, celle que le héros a foulée au chapitre 5, il y a des siècles pour le monde et quelques semaines pour lui. Elle est méconnaissable : tapissée de croûtes orange et grises, de mousses épaisses, de petites flaques où quelque chose nage. Entre les pierres poussent des formes de cristal, des colonies minérales qui croissent en couches, comme Gorr. Rien n'a été planté. Il n'y a pas un champ, pas un mur. Mais il y a des sentiers : des passages tracés par de petites bêtes que personne ne connaît.*

**Les branches** — « *Dans une autre branche, il n'aurait jamais cessé. L'île serait restée un jardin bien tenu. Nous ne saurions pas que ceci était possible.* »

**Néréa** *(ou le Lacunaire)* — « Ma lignée a lu cette roche dans les strates, à l'ère des Marées. Les couches s'arrêtaient net, comme une phrase coupée. Puis elles reprenaient. Je ne savais pas qu'elles reprenaient comme ça. »

**Merlin** *(ou le Chroniqueur)* — « Ma lignée est née ici. Le premier Merlin mesurait ces roches avec son bâton gradué, et il disait que la vie de la Dérive était têtue. Elle n'est pas têtue : elle est ordinaire. Pas de Ghom, pas de jardinier, et pourtant. Il reste de la chaleur dans le cœur de l'île, qui remonte par les fissures. Il reste la lumière des Fragments lointains, qui tombe dessus. Une différence de température, une pente : c'est tout ce qu'il faut à une forme pour se mettre à durer. *(Il s'agenouille, touche une croûte.)* Je n'ai jamais été aussi content d'avoir eu tort de croire quelque chose. »

**Brutus** — « Personne ne garde cette île. *(Un temps.)* Elle se garde. »

**Eva** — « J'avais parié qu'on trouverait des ruines. Je perds. J'aime perdre comme ça. »

**Squalor** *(si présent)* — « Ça grouille. Je mange rien. Pas aujourd'hui. Ça vient juste de commencer, ici. »

**Nyx** *(si présente)* — « Ma lignée vient d'ici. La première Nyx disait que leur Ghom les laissait tranquilles, qu'il ne mettait pas les mains partout. *(Elle regarde la mousse.)* Il ne les mettait nulle part. Il était parti. On appelait ça la liberté. C'était ça aussi, peut-être. »

**Ceux du troisième camp.** Au ch. 24, quelques Échos ont choisi le froid du Ghom du Chaos. La déchirure les a emportés avec la Dérive.

- **Merlin IV** *(si pas `merlin_convaincu`)* — *Assis sur une pierre, un carnet sur les genoux, couvert de chiffres.* « Merlin, quatrième du nom. Je suis venu mesurer un Ghom de près. Je l'ai mesuré : il est froid, et de moins en moins. Je ne comprends pas pourquoi, et j'ai horreur de ne pas comprendre. *(Il se lève.)* Je viens avec vous. Pas par loyauté : pour la suite des mesures. » [il rejoint l'équipe pour le reste de l'ère, sauf voie *vaincu*, où il reste à la Friche]
- **Squalor IV** *(si pas `squalor_rejoint`)* — *Il remonte d'une flaque, une petite bête entre les dents, qu'il relâche.* « Le froid nourrit, je disais. Ici, il nourrit plus. Ça repousse trop vite, il y a trop à manger, je mange presque plus. » [il rejoint si `confiance.squalor ≥ 0` ; sinon il reste, et ne se bat pas]

**Gorr retrouvé** *(si Gorr n'était pas dans l'équipe)* — *Au milieu d'une colonie minérale, une grande forme immobile, à moitié enracinée : Gorr. De petites pierres croissent sur ses épaules.*

- *(Si `gorr_question`)* — **Gorr** : « Gorr est venu ici. Ici, les pierres croissent sans maître. Gorr écoute pousser. *(Il se dégage, lentement.)* Gorr vient. Gorr a encore une question. »
- *(Si pas `gorr_question`)* — *Gorr ne dit rien. Il n'a jamais rien dit. Il se dégage, les petites pierres tombent de ses épaules, et il se place derrière le héros, comme autrefois dans la mine. Il rejoint l'équipe, muet.*

**Gorr** *(s'il était déjà là)* — *(Il s'accroupit près d'une colonie, longtemps.)* « Ils ne parlent pas. Gorr non plus, avant. Peut-être après. »

**Q27 s'inscrit au Carnet.**

**Choix du héros :**

1. « Qui a fait ça ? » [Merlin, ou le Chroniqueur : « Personne. C'est-à-dire : tout. La roche, la chaleur, la lumière, et le temps. »]
2. « Le monde n'a pas eu besoin de lui. » [aucun drapeau à ce stade ; Lyra : « Pas pour ça, en tout cas. »]
3. *Toucher la mousse.* [aucun effet ; elle est tiède, et légèrement humide.]

### 2. Archive (optionnelle) — Les couches de la Friche

*Les colonies minérales croissent en couches, une par saison chaude, comme les strates des abysses. Chaque couche garde dans ses défauts la trace de ce qui l'entourait quand elle s'est formée. Gorr (ou, à défaut, Néréa) sait les lire : ce sont les mêmes couches que celles de son propre corps.*

**Gorr** — « Gorr lit. Les couches de Gorr sont pareilles. Une couche, une saison. Gorr en a beaucoup. Celles-là en ont plus. »

**Coût :** `usure +1` (une exposition longue aux cristaux instables) ; `archives.lues +1`.

**Reconstitution jouable : « Ne pas réécrire »**. Une suite de quatre tableaux, à remettre dans l'ordre des couches. Chaque tableau est une petite carte jouée deux tours, avec le héros et Gorr (ou Néréa) :

| Couche | Ce qu'elle garde | Ce que le joueur fait |
| --- | --- | --- |
| 1 (la plus profonde) | Le Fragment abandonné : froid, immobile, des Lacunes partout. Les Échos de l'époque se sont dispersés. | Survivre deux tours sans rien pouvoir réparer. Une Réparation tentée **brise** la reconstitution : les traces disent qu'il n'y en a pas eu. |
| 2 | La chaleur du cœur remonte par une fissure ; une croûte minérale s'y forme. | Placer un Écho sur la fissure et agir : la croûte s'étend. |
| 3 | Les premières mousses, là où la lumière tardive tombe ; les Lacunes du bord rétrécissent d'elles-mêmes. | Ne rien faire sur les cases de Lacune : elles se referment seules. Agir dessus **brise** la reconstitution. |
| 4 (la plus récente) | Les colonies minérales, les petites bêtes, les sentiers. Au centre, une présence froide, immobile, qui ne fait rien. Couche après couche, un peu moins froide : ce qui pousse autour d'elle la réchauffe. | Atteindre le centre sans écraser une colonie. |

**Réussite :** `ghom_dechu.verite +1` (au maximum 3). Le choix « Parce qu'on est liés » (nœud 5) devient possible si `ghom_dechu.verite` atteint 2 ou plus.

**Gorr** *(à la fin)* — « Personne n'aide. Tout pousse. La présence regarde. Longtemps. Elle est froide. Les pierres la réchauffent. *(Silence.)* Les pierres changent la présence. Gorr connaît. »

**Échec (réécriture) :** la reconstitution se brise ; le coût en Usure est payé ; aucun gain. **Néréa** : « Tu as voulu aider le passé. Le passé ne prend pas d'aide. »

### 3. Lacune — Traverser sans écraser

*Pour atteindre le centre, il faut traverser un champ de colonies minérales et de mousses, au bord d'une petite Lacune qui se referme lentement d'elle-même. Les sentiers des bêtes serpentent entre les colonies.*

C'est une **énigme de placement** : amener toute l'équipe de combat (4 Échos) au centre en 6 tours, sur une carte où 12 cases portent une colonie (entité neutre, 1 PV). Toute action de zone ou tout déplacement forcé qui touche une colonie la détruit.

- **Réussite sans colonie détruite :** `confiance +1`. **Gorr** : « Merci. Pour eux. »
- **Colonies détruites (1 à 3) :** aucune pénalité, mais **Les branches** : « *Dans une autre branche, nous aurions regardé où nous mettions les pieds.* »
- **Plus de 3 colonies détruites :** le Ghom déchu le ressent ; au nœud 4, la présence est d'emblée hostile (le choix « Attendre » coûte `confiance -1`, car les Échos ont peur).

**La petite Lacune** : la laisser se refermer seule (ne rien y faire pendant les 6 tours) n'ajoute **aucun compteur** : ni recousue, ni élargie, ni habitée. C'est la seule Lacune de l'aventure qui guérit sans personne, et le jeu le note dans le Carnet, sous Q27 : *Une Lacune s'est refermée seule.*

### 4. Rencontre — La présence

*Au centre de la Friche, une dépression ronde, très ancienne : là où l'ancien village de l'Ordre se dressait, avant qu'il cesse. Il n'en reste rien. Sur les bords, des colonies. Au milieu, rien de visible. Et pourtant tout le monde la sent : une pression qui n'est pas celle du Ghom. Plus lente. Plus large. **Froide**, comme au Bord, mais moins : un froid de fin d'hiver. Le temps s'épaissit autour de l'équipe, comme si l'air devenait de l'eau : une Distorsion, douce, sans hostilité. Le sol frémit sous les pieds, une fois.*

*Puis la pression du Ghom répond : elle se dresse autour du héros, et les deux pressions se touchent. Pour la première fois, les Échos sentent deux Ghoms couplés au même endroit, comme au Bord, mais sans bataille.*

**Les branches** — « *Dans une autre branche, nous aurions frappé les premiers. Nous ne saurions pas s'il aurait frappé.* »

**Brutus** — « Derrière moi. Tous. »

**Lyra** — « Il ne nous fait pas de mal, Brutus. Il… nous ralentit. Comme on retient quelqu'un par la manche. »

**Choix du héros :**

1. « Brutus, avec moi. On le chasse de cette île. » [`ghom_dechu.issue = vaincu` ; → nœud 5a] *(Q27 et Q18 s'inscrivent malgré tout ; leur réponse viendra après le combat.)*
2. *Poser ses armes et attendre.* [→ le Ghom déchu prend forme ; nœud 5]
3. « Ghom… qu'est-ce que tu sens ? » [→ nœud 5 ; la pression du Ghom se fait plus douce, presque curieuse. `confiance +1` si `carnet.Q23 = repondue` : les Échos voient que le héros ne traite plus le Ghom en maître.]

*Si plus de 3 colonies ont été détruites au nœud 3, le choix 2 coûte `confiance -1`.*

**La prise de forme** (choix 2 ou 3) — *Au milieu de la dépression, la matière de la Friche bouge. De la roche sombre, de la mousse, un filet d'eau, quelques éclats d'une colonie, qui se rassemblent lentement. Rien ne les y pousse de l'extérieur : c'est la façon qu'ont les Ghoms d'agir, en se couplant à de la matière. Celle-ci, pour la première fois, se tient debout. Elle a deux bras, deux jambes, et pas vraiment de visage : une surface humide où la lumière du Cœur se reflète. Elle respire. Elle regarde ses mains.*

`ghom_dechu.echo` est posé.

### 5. Rencontre — Celui qui a cessé

**Voix du Ghom déchu** : il parle **lentement**, **au présent**, en phrases courtes, avec de longs silences. Il découvre le temps. Il ne tutoie ni ne vouvoie : il parle à tous.

**Le Ghom déchu** — « Ici… une chose arrive. *(Silence.)* Puis une autre. *(Il ouvre et ferme la main.)* C'est cela, le temps. Vous vivez dedans. »

**Merlin** *(ou le Chroniqueur)* — « Pardonnez la question. Depuis des siècles, nos écoles se disputent sur votre nature. Les Immobilistes disent que vous êtes hors du temps. Les Lumineux, que vous êtes un mouvement à la vitesse de la lumière. Lequel des deux ? »

**Le Ghom déchu** — « Je ne sais pas. *(Silence.)* Dans ce corps, le temps passe. Avant… je ne sais pas s'il passe. »

**Merlin** — « À la vitesse de la lumière, aucun temps propre ne s'écoule. Ce qui va le plus vite possible est, de son propre point de vue, parfaitement immobile. Les deux écoles décrivent peut-être la même chose. Ou rien du tout. »

**Le Ghom déchu** — « Peut-être. *(Silence.)* Je ne sais pas ce que je suis. Vous non plus, vous ne savez pas ce que vous êtes. Nous avons cela. »

**Gorr** *(si `gorr_question`)* — « Gorr a demandé, sous la Frange : le Ghom le sait ? Gorr demande à toi. Tu sais que tu changes ? »

**Le Ghom déchu** — *(Très long silence. Il regarde ses mains de mousse.)* « Je suis froid. Mes Lacunes me refroidissent, longtemps. *(Silence.)* Maintenant, la mousse me réchauffe. Un peu. Chaque saison. *(Silence.)* Je le sais maintenant. Avant… je ne sais pas si je sais. »

*(Sans Merlin ni le Chroniqueur, c'est **Eva** qui pose la question, en une phrase : « Immobile, ou très rapide ? » et la réplique de Merlin est supprimée. Le Ghom déchu répond pareil.)*

**Le récit** *(le cœur de la scène ; ces répliques sont dites dans tous les cas)* :

**Le Ghom déchu** — « Je suis de l'Ordre. J'entretiens. J'entretiens longtemps. Chaque pierre à sa place, chaque Écho à son rythme. *(Silence.)* Puis je me demande : si je cesse ? *(Silence.)* Je cesse. *(Long silence.)* Le Tissu s'effiloche. Les miens se dispersent. Je regarde. Je ne fais rien. C'est la chose la plus difficile que je fais. *(Long silence.)* Mon Élan reste plein. Longtemps. Je ne m'en sers pas. *(Silence.)* Les Échos de la Dérive disent : le nôtre ne nous touche pas. Ils ont raison. *(Long silence.)* Longtemps, rien. *(Très long silence.)* Puis la chaleur du cœur de l'île remonte. La lumière des autres îles tombe. Une croûte. Une mousse. Une pierre qui croît. Des bêtes que je ne connais pas. Le Tissu revient, un fil après l'autre, partout où une chose en touche une autre. Je n'ai rien fait. *(Long silence.)* Le monde n'a pas besoin de nous. *(Silence.)* Je crois : c'est triste. *(Silence.)* Ce n'est pas triste. »

**Lyra** — « Pourquoi ? »

**Le Ghom déchu** — « Parce que rien de ce qui pousse ici ne me doit rien. *(Il regarde une colonie, à ses pieds.)* C'est libre. Et moi aussi. »

**Gorr** *(s'il est présent)* — « Gorr n'a pas de maître non plus, maintenant. Gorr croît quand même. »

**Q27 répondue.** [`carnet.Q27 = repondue`] **Réponse inscrite :** *Non. La vie revient seule, tant qu'il reste un déséquilibre d'énergie. Ce n'est pas triste : c'est une liberté.*

**Q18 répondue** (si posée au ch. 18). [`carnet.Q18 = repondue`] **Lyra**, ou **Néréa** : « Il n'a pas eu besoin de nous pour exister. Mais regarde-le : il a fallu qu'il touche une mousse pour savoir ce qu'il pensait. Le sens, c'est ce qui se passe entre. » **Réponse inscrite :** *Le monde n'a pas besoin de nous pour exister. Le sens, lui, naît des liens : entre nous, et avec lui.*

**La question du Ghom déchu.** *Il se tourne vers le héros, et vers la pression qui l'entoure.*

**Le Ghom déchu** — « Alors… pourquoi ton Ghom reste ? »

**Choix du héros :**

1. « Pour réparer. Ce que tu as laissé tomber, on le relève. » [→ **Le Ghom déchu** : « Tu veux faire ce que je fais. Avant. » *(Silence.)* « Non. Pas ici. » La pression devient dure. → nœud 5a ; `ghom_dechu.issue = vaincu`]
2. « Tu as raison. Laissons tout aller. Tout reviendra. » [→ **Le Ghom déchu** : « Tout revient… tant qu'il reste une pente. » *(Le héros ne relève pas.)* → nœud 5b ; `ghom_dechu.issue = suivi`]
3. « Reste ici, avec ce qui a poussé. Tu n'as besoin de personne, et personne de toi. » [→ nœud 5c ; `ghom_dechu.issue = laisse`]
4. « Pas parce qu'on est nécessaires. Parce qu'on est liés. Il est lié à nous, comme tu l'es à ces mousses. » [**Disponible si** `ghom_dechu.verite ≥ 2` **et** `carnet.Q23 = repondue`. → nœud 5d]

*Si le choix 4 n'est pas disponible, il apparaît grisé, sans texte, en silhouette (comme les objectifs ratés du bilan).*

### 5b. Scène — L'ouverture *(suivi)*

*Le héros et le Ghom déchu montent au bord de la dépression. Au-dessus, le Cœur de la déchirure. Le Ghom déchu lève la main, et la pression qui retenait le bord de la Lacune se relâche. Le vide s'agrandit d'un coup, d'une rangée de cases. Puis d'une autre.*

**Le Ghom déchu** — « On ouvre. Ce qui doit revenir revient. »

**Lyra** — « Et s'il ne reste plus de pente pour revenir ? »

**Le Ghom déchu** — *(Long silence.)* « Je ne sais pas. Ici, il en reste. »

**Brutus** *(s'il n'a pas de `trahison.brutus`)* — « Je ne suis pas d'accord. Je viens quand même. Quelqu'un doit tenir le bord quand vous aurez fini. »

**Nyx** — « Enfin. Ça, je comprends. *(Un temps.)* Je crois. »

[`lacunes.elargies +1` ; `confiance.lyra -1` ; `confiance.nyx +1` ; `confiance.brutus -1`] Le Ghom déchu **ne rejoint pas** l'équipe comme Écho : il reste couplé à la Friche, et sa forme se défait lentement (« Je n'en ai plus besoin. »). `ghom_dechu.echo` reste posé (il a pris une forme) mais il n'est pas jouable dans l'Aventure.

### 5c. Scène — Le jardinier *(laisse)*

*Le Ghom déchu s'assoit au bord de la dépression, à côté d'une colonie. Il la regarde croître : on ne voit rien, mais il regarde quand même.*

**Le Ghom déchu** — « Je reste. Je ne fais rien. Je regarde. *(Silence.)* C'est différent, maintenant. Avant, je regarde pour savoir. Maintenant, je regarde parce que c'est là. »

**Gorr** — « Gorr comprend. »

**Néréa** — « Tout ce qui tombe finit par se déposer. Toi aussi, on dirait. »

*(Si on arrive ici par le refus du couplage, nœud 5d :)* **Le Ghom déchu** — « Ton Ghom ne vient pas. *(Silence.)* C'est bien. Il choisit. Moi aussi, je choisis. »

[`ghom_dechu.issue = laisse` ; `confiance +1`] Le Ghom déchu rejoint l'équipe comme **Écho** pour le chapitre 28, s'il le souhaite : il le souhaite si `confiance ≥ 0`. Sinon, il reste.

### 5d. Influence — Se coupler

*Le Ghom déchu tend sa main de pierre et de mousse. Il ne la tend pas au héros : il la tend à la pression qui l'entoure, au Ghom.*

**Le Ghom déchu** — « Alors… viens. Pas pour me tenir. Pour être deux. »

**Les branches** — « *Dans une autre branche, aucun des deux n'aurait bougé. Nous ne saurions pas ce que cela fait, deux pressions qui se rejoignent.* »

*Ici, **le héros ne choisit plus rien**. Le jeu passe la main au Ghom : la barre d'Élan clignote, et une **Influence unique**, disponible seulement à ce moment, apparaît dans la barre des Influences :*

| Influence | Coût | Effet |
| --- | --- | --- |
| **Se coupler** | **tout l'Élan** (6) | Le Ghom se couple au Ghom déchu. Tout couplage est réciproque : ce que l'un touche, l'autre le sent. |

- **Le Ghom l'emploie** (le joueur lance l'Influence sur la forme du Ghom déchu) : *Les deux pressions se rejoignent. Pendant un instant, toute l'équipe sent le temps s'épaissir et s'alléger à la fois. Le sol de la Friche frémit, et chaque colonie, sur toute l'île, scintille une fois, par paires.* [`couplage_ghom_dechu` ; `ghom_dechu.issue = couple` ; → nœud 5e]
- **Le Ghom ne fait rien** (le joueur passe, ou attend 20 secondes sans agir) : → nœud 5c (*laisse*). Aucun reproche, aucune pénalité.

*Aucun texte n'invite le joueur. La barre d'Élan et l'Influence suffisent. Le Ghom ne parle jamais : il se manifeste, ou non.*

## Combats

### 5a. Combat — La Friche disputée *(vaincu)*

**Carte :** la dépression centrale de la Friche, 9 × 9. Bords hauts, fond creux, une fissure chaude au milieu.

```
2221.1222
21.....12
1..a.a..1
...aba...
.a.bcb.a.
...aba...
1..a.a..1
21.....12
2221.1222
```

Calque : colonies (`C`, entités neutres de 1 PV) et zones d'ancrage (`1`, `2`, `3`).

```
C···1···C
·········
··C···C··
·········
2···C···3
·········
··C···C··
·········
C·······C
```

**Équipes :**

- **Alliés :** le héros + 3 Échos.
- **Ennemis : les gardiens de la Friche.** Des formes de vie revenues seules, qui défendent leur île comme on défend un terrier, pas un maître :
  - **2 colonies mobiles** (nouveau kit à créer) : lentes, très solides, action « Croûte » (se protège et protège les adjacents) ;
  - **3 essaims de mousse** (nouveau kit) : rapides, fragiles, action « Envahir » (ralentit une cible) ;
  - **Merlin IV** et **Squalor IV**, s'ils sont à la Friche et n'ont pas encore rejoint (le choix 1 du nœud 4 ne leur a pas laissé le temps) : ils combattent du côté de la Friche, et se retirent sous 25 %. Ce sont des Échos du troisième camp, pas des Déliés : la règle R1 de l'Autonomie ne s'applique pas, mais un allié de la même lignée peut refuser de les frapper ;
  - **Le Ghom déchu**, sans forme (ou sa forme se défait au début du combat) : il agit par **Influences**, sur sa propre timeline : **Distorsion** sur un allié du héros toutes les 3 actions, **Séisme** sur une zone d'ancrage toutes les 4 actions.

**Objectif principal :** **recoudre la Friche** : garder actives les trois zones d'ancrage (un allié y agit au moins une fois par tour) pendant **4 tours consécutifs**, puis lancer une **Réparation**. Le Ghom déchu n'a plus rien de lâche à quoi se tenir : il se découple de la Friche.

**Objectifs secondaires :**

- ◆ **Ne pas détruire de colonie** (les 9 colonies immobiles du calque). [`confiance +1`]
- ◆ **Ne disperser aucun gardien** (ils fuient sous 25 %). [`confiance.gorr +1`]

**Défaite :** le héros tombe, ou tous les alliés tombent.

**Événements scriptés :**

| Quand | Événement |
| --- | --- |
| Début | Le temps s'épaissit sur toute la carte (la Vitesse de tous les alliés −1 pendant 1 tour). |
| Première zone ancrée | Le Ghom déchu répond par un Séisme dessus. |
| 2 tours d'ancrage | Les gardiens reculent vers leurs colonies. |
| Réparation finale | Lumière et vapeur au-dessus de toute la carte : l'ordre créé ici se paie en chaleur rejetée, qui monte vers le Cœur. La pression du Ghom déchu s'éloigne, lentement, jusqu'à disparaître. |

**Répliques de combat :**

- *Début* — **Brutus** : « Tenez les points. Rien ne passe. »
- *Gardiens* — **Lyra** : « Ils ne nous attaquent pas. Ils se protègent. Ce n'est pas pareil. »
- *Deux tours d'ancrage* — **Gorr** : « Les pierres d'ici ont peur. Gorr reconnaît. »
- *Fin* — **Les branches** : « *Dans une autre branche, nous l'aurions laissé là. L'île aurait continué sans personne. Ici, elle continuera avec nous.* »

**Après le combat.** *La forme du Ghom déchu, s'il en avait une, s'est effondrée en roche et en mousse. Sa pression n'est plus qu'un souffle au loin, découplé de la Friche, quelque part dans le Clair. Avant de partir, il dit (une ligne qui flotte, sans corps) :* « Le monde n'a pas besoin de nous. Tu l'apprends aussi. Lentement. » [`carnet.Q27 = repondue` ; `carnet.Q18 = repondue` **seulement** si l'Archive du nœud 2 a été lue : le héros a vu les couches, il comprend.]

[`ghom_dechu.issue = vaincu` ; `lacunes.recousues +1` ; si le combat a commencé sans dialogue (choix 1 du nœud 4) : `confiance -1`.]

### 5e. Combat — Les deux pressions *(couple)*

**Carte :** la même dépression (voir 5a), mais le Cœur s'est rapproché : des fragments de matière instable tombent de la déchirure, au-dessus de la Friche.

**Équipes :**

- **Alliés :** le héros + 3 Échos, plus **le Ghom déchu sous sa forme d'Écho** (allié autonome ; kit nouveau, voir les notes).
- **Ennemis :** la matière instable, en pluie : 2 Lacunaires instables apparaissent à chaque tour sur des cases au hasard (annoncées un tour avant par une ombre), et un **Lacunaire géant** au tour 5.
- **Neutres :** les 9 colonies du calque.

**Le couplage partagé (règle du combat) :**

- Les deux Ghoms partagent **une seule barre d'Élan**, qui se remplit **deux fois plus vite** que dans le reste de l'ère (deux couplages, deux fois plus d'interactions).
- Le joueur dispose de ses trois Influences. Le Ghom déchu en use aussi, **seul**, sur sa propre timeline, en puisant dans la même barre : surtout la Distorsion sur les Lacunaires, et des Réparations quand une colonie est menacée.
- Chaque fois que le joueur lance une Influence, l'Influence suivante du Ghom déchu lui **répond** : une Distorsion appelle une Réparation, un Séisme appelle une Distorsion. Ce que l'un touche, l'autre le sent.

**Objectif principal :** **préserver la Friche** : tenir 7 tours sans qu'aucune colonie ne soit détruite par la matière instable (les alliés peuvent s'interposer).

**Objectifs secondaires :**

- ★ **Aucune colonie détruite.** C'est l'objectif principal, rappelé : si une colonie tombe, le combat continue, mais le couplage vacille (barre d'Élan vidée d'un coup) et l'objectif principal devient « tenir 7 tours ».
- ◆ **Une Intrication avec le Ghom déchu** : un allié lance une action combinée depuis la case de la forme du Ghom déchu. [`lacunes.habitees +1` supplémentaire : la Friche est habitée à deux, par un Écho et un Ghom.]

**Défaite :** le héros tombe, ou tous les alliés tombent.

**Événements scriptés :**

| Quand | Événement |
| --- | --- |
| Début | Chaque colonie scintille une fois, par paires. |
| Première Influence du joueur | Réponse du Ghom déchu, et sa réplique. |
| Tour 5 | Le Lacunaire géant tombe du Cœur. |
| Fin du tour 7 | La pluie cesse. Au-dessus, le Cœur s'est stabilisé un instant, et l'on y voit, pour la première fois, des branches très proches. |

**Répliques de combat :**

- *Première Influence du joueur* — **Le Ghom déchu** : « Je sens. *(Silence.)* Tu sens aussi. »
- *Colonie protégée* — **Gorr** : « Merci. Pour eux. »
- *Tour 5* — **Eva** : « Gros. Lent. Prévisible. Enfin quelque chose de prévisible. »
- *Fin* — **Le Ghom déchu** : « Deux, c'est… plus lourd. *(Silence.)* Et plus léger. »

[`ghom_dechu.issue = couple` ; `couplage_ghom_dechu` ; `lacunes.habitees +1` ; `confiance +1`.]

## Scènes (suite)

### 6. Fin — Au-dessus, le Cœur

*Le soir, si c'est un soir. La lumière du Cœur descend sur la Friche. Les colonies scintillent. L'équipe s'assoit au bord de la dépression.*

**Selon `ghom_dechu.issue` :**

- **vaincu** — *La pression du Ghom est seule, et un peu plus lourde qu'avant. La Friche est calme, recousue, nette.* **Brutus** : « C'est fait. » **Lyra** : « Oui. Je ne sais pas ce qui est fait. »
- **suivi** — *Le Cœur s'est élargi. Il occupe la moitié du ciel.* **Nyx** : « On y monte demain. Après, il n'y aura plus de demain qui ressemble à demain. »
- **laisse** — *Le Ghom déchu, sous sa forme, est assis avec eux. Il ne dit rien. Il touche la mousse, de temps en temps, comme pour vérifier.* **Le Ghom déchu** : « Demain. *(Silence.)* J'aime ce mot. »
- **couple** — *Les deux pressions sont là, mêlées, et l'on ne sait plus laquelle est laquelle. Personne ne s'en inquiète.* **Le Ghom déchu** : « Demain, nous montons. Ensemble. *(Silence.)* Qui tient qui… nous le voyons là-haut. »

**Gorr**, en dernier, quelle que soit la voie — *(Il regarde le Cœur, longtemps.)* « Gorr a une question. Gorr la porte depuis la mine. Demain, Gorr la pose. »

*(Si pas `gorr_question` : Gorr ne dit rien. Il regarde le Cœur. Pour la première fois, il lève la main vers lui.)*

**Les branches** — « *Dans une autre branche, il aurait posé sa question plus tôt. Dans une autre, jamais. Dans celle-ci, nous l'écouterons comme vous.* »

## Choix et conséquences

| Choix ou objectif | Drapeaux | Effet plus tard |
| --- | --- | --- |
| Archive réussie | `usure +1` ; `archives.lues +1` ; `ghom_dechu.verite +1` (max 3) | Peut ouvrir le choix du couplage. |
| Traverser sans écraser | `confiance +1` | — |
| Q27 entendue (toutes voies) | `carnet.Q27 = repondue` | Richesse du Carnet. |
| Q18 entendue | `carnet.Q18 = repondue` (voie *vaincu* : seulement avec l'Archive) | Richesse du Carnet. |
| Combattre (*vaincu*) | `ghom_dechu.issue = vaincu` ; `lacunes.recousues +1` | Score d'Ordre (+3) : fin **Le Cristal**. Ferme **L'Intrication**. |
| Suivre (*suivi*) | `ghom_dechu.issue = suivi` ; `lacunes.elargies +1` | Score de Chaos (+3) : fin **L'Équilibre**. Ferme **L'Intrication**. |
| Laisser (*laisse*) | `ghom_dechu.issue = laisse` ; `ghom_dechu.echo` ; `confiance +1` | Neutre pour les scores. Le Ghom déchu peut combattre au ch. 28. Ferme **L'Intrication**. |
| Se coupler (*couple*) | `couplage_ghom_dechu` ; `ghom_dechu.issue = couple` ; `ghom_dechu.echo` ; `lacunes.habitees +1` ; `confiance +1` | **Condition de la vraie fin.** Le Ghom déchu combat au ch. 28. |
| ◆ Intrication avec le Ghom déchu | `lacunes.habitees +1` | Score d'Intrication. |

## Récompenses

- **Habit : Mousse de la Friche** — *une mousse qui a poussé sur l'épaule du héros pendant la veillée, et qu'il n'a pas eu le cœur d'arracher.* Effet : régénère 1 PV au début de chaque tour où le héros n'a pas bougé.
- **Écho :** le Ghom déchu, sous sa forme d'Écho (voies *laisse*, avec `confiance ≥ 0`, et *couple*). Il devient jouable après le générique.
- **Carnet :** Q27, et la réponse de Q18.

## Graines pour la suite

- **Le Découplage** naît ici : le héros a vu un Ghom cesser, et un monde continuer sans lui. Il peut, au chapitre 28, demander au Ghom de faire de même, mais autrement : non pas cesser d'entretenir, **se retirer**.
- **L'Intrication** naît ici aussi : deux Ghoms couplés au même monde, sans maître. Au chapitre 28, les deux pressions agissent ensemble.
- La réplique « tant qu'il reste une pente » (voie *suivi*) annonce la fin **L'Équilibre** ; et Gorr, qui a vu des pierres croître sans maître, en garde la trace pour sa question du chapitre 28.

## Notes de mise en œuvre

- **Nouveaux kits :** *colonie mobile* (tank lent, action de protection de zone), *essaim de mousse* (rapide, fragile, ralentissement), *forme du Ghom déchu* (soutien lent : une action « Lenteur », qui applique `slowed` à une cible ; une action « Repousse », qui soigne une cible de peu et la protège ; Vitesse basse, Chance haute). Les trois passent par l'équilibrage (`presetPower`) comme les kits existants.
- **Ghom adverse par Influences seules :** réutiliser la logique du duel en ligne (deux Ghoms couplés au même Fragment), avec une IA simple qui choisit des cibles de Distorsion et de Séisme.
- **Couplage partagé (5e) :** une barre d'Élan commune, deux consommateurs ; l'IA du Ghom déchu choisit sa réponse selon la dernière Influence du joueur (table de réponse).
- **Influence « Se coupler » :** une Influence temporaire, présente dans la barre uniquement au nœud 5d ; elle cible la forme du Ghom déchu. Le délai de 20 secondes sans action vaut refus. **Aucune bulle d'aide** : c'est volontaire.
- **Choix grisé en silhouette :** même rendu que les objectifs ratés du bilan. **Colonies :** entités neutres de 1 PV ; les dégâts de zone alliés les touchent (comme les ennemis).
- **Voix du Ghom déchu :** affichage lettre à lettre plus lent que les autres Échos, avec des pauses explicites aux silences ; pas de portrait animé, seulement la surface humide qui reflète la lumière.
