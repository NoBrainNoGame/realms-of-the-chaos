# Chapitre 7 — La sortie du Puits

> **Journal de Néréa** — *Ma deuxième horloge avait onze jours de retard sur la première. J'étais en train de l'écrire quand l'eau de la Pierre Lente s'est ouverte, et que quelqu'un en est sorti en toussant.*

## Fiche

| | |
| --- | --- |
| Ère | II — Le Temps des Marées |
| Lieu | La Pierre Lente (le Puits), les pilotis de l'Est, Sauge |
| Équipe | Le héros seul au départ. **Néréa II rejoint** (nœud 1). |
| Durée visée | 5 nœuds, 1 combat (fuite), 1 veillée |
| Question au Carnet | Q07 — *Suis-je celui de la légende ?* |

## Ce que le joueur sait en arrivant

- À la fin du chapitre 6, les deux Fragments ont **fusionné** ou se sont **séparés** (`fragments`), et le héros, transformé (`transformation.I`), est entré dans le Puits.
- Pour le héros, quelques heures ont passé. Il s'attend à retrouver Lyra, Brutus et Néréa au bord du Puits.
- Il porte son Carnet, ses habits de l'ère I et, si `objet_de_nyx`, l'objet laissé par Nyx.

## Synopsis

Le héros émerge de la Pierre Lente dans un monde qu'il ne reconnaît pas : l'eau a tout recouvert, les collines sont devenues des îlots, on vit sur pilotis. Une ondine, Néréa II, l'attendait sans le savoir : elle mesurait, avec deux horloges à eau, le retard que prend le temps près de la Pierre Lente. Elle ne s'étonne pas longtemps. Elle lui montre le chant que l'on apprend aux enfants, où il est « le Dormeur », et où presque tout est faux. Une Marée arrive : ils doivent fuir vers Sauge à travers des pilotis à moitié incertains, sans combattre si possible, car chaque coup fait « prendre » la Marée. Le soir, à Sauge, le héros apprend que ses compagnons sont morts depuis quatre siècles, et le Carnet reçoit sa question : *Suis-je celui de la légende ?*

## Carte du chapitre

```
[1 Rencontre : La Pierre Lente] → [2 Rencontre : Le chant] → [3 Combat : Fuir la Marée]
                                                                    ↓
                                    [5 Fin : La première page] ← [4 Veillée : Sauge]
```

Pas d'embranchement. Le nœud 2 peut être écourté (choix 2.3), mais pas sauté : il introduit les Chroniques partiales.

## Scènes

### 1. Rencontre — La Pierre Lente

*Une fosse ronde, une eau lisse comme une vitre. Au fond, une masse noire qu'aucune lumière n'éclaire vraiment. Sur une plate-forme de bois, deux grandes horloges à eau, identiques, côte à côte : l'une a passé un an au bord de la fosse, l'autre à Sauge. Une femme aux cheveux noués d'algues note des chiffres sur une tablette d'ardoise. Le héros remonte à la surface et s'agrippe aux pilotis.*

*Ce qu'il voit : là où était la prairie de l'île natale, de l'eau à perte de vue. Quelques crêtes émergent. [Si `fusion`] Au loin, une ligne où la roche verte et la roche noire se mêlent. [Si `separation`] Au-dessus de l'horizon, une lueur fixe, pâle, dans le Clair.*

**Néréa** — « Ne bougez pas. Enfin, si : sortez de l'eau. Mais doucement. Vous venez de là-dessous ? »

1. « Où sont les autres ? » [confiance.nerea +0]
2. « Combien de temps ? » [confiance.nerea +1]
3. *Rester silencieux, regarder l'eau.* [—]

**Néréa** *(à 1)* — « Les autres… Je ne sais pas de qui vous parlez. Ici, il n'y a que moi et mes horloges. »
**Néréa** *(à 2)* — « Bonne question. La seule bonne, d'ailleurs. Pour vous ? Je ne sais pas. Pour nous… » *(elle regarde ses horloges)* « Mes deux horloges partent ensemble. Celle que j'ai laissée ici un an a onze jours de retard. Près du fond, ce serait bien pire. Vous étiez près du fond. »

**Néréa** — « Je m'appelle Néréa. Des Strates, si vous préférez : il y a eu beaucoup de Néréa. »

*Si `transformation.I = A` :* *(Elle remarque la lueur dans ses yeux.)* « Vos yeux luisent. Comme dans le chant. C'est… gênant, pour une scientifique. »
*Si `transformation.I = B` :* *(Elle effleure son bras du bout du trident.)* « Vous êtes en verre. Comme dans le chant. C'est… gênant, pour une scientifique. »

*Si `objet_de_nyx` :* *(Néréa aperçoit l'objet.)* « Ça, c'est une marque d'Ombre. Les Ombres ne donnent rien à personne. Vous l'avez volé, ou elles vous aimaient bien ? »

1. « Elle me l'a donné. » [confiance.nerea +0 ; Néréa le note dans son journal]
2. « Je ne sais plus. » [—]

**Le Ghom** *(manifestation)* — *L'eau de la fosse frissonne alors que rien ne souffle. Les deux horloges, une seconde, ne gouttent plus au même rythme.* Néréa le note sans commentaire.

> **Journal de Néréa** — *Il ne savait pas quel siècle nous étions. Je ne le lui ai pas dit tout de suite : on ne verse pas quatre cents ans d'eau froide sur quelqu'un qui tousse encore.*

### 2. Rencontre — Le chant

*Néréa ramasse son ardoise et lui montre, gravé sur la face interne de son étui, le chant que l'on apprend aux enfants de Sauge (la Chronique d'ouverture, voir le README de l'ère, variante selon `fragments`). Le joueur peut le lire en entier, ou laisser Néréa le résumer.*

**Néréa** — « On l'appelle le Dormeur. On dit qu'il est descendu sous la Pierre Lente, et qu'il reviendra quand l'eau sera haute. » *(un temps)* « L'eau est haute. Les légendes ont parfois de la chance. »

1. « Ce n'est pas comme ça que ça s'est passé. » [confiance.nerea +1]
2. « Lyra n'est pas montée au ciel. » [confiance.nerea +1 ; débloque la réplique « Lyra »]
3. « Je ne suis pas ce Dormeur. » [—]
4. « C'est un beau chant. » [—]

**Néréa** *(à 1)* — « Je m'en doutais. Un chant, c'est ce qui reste quand on a oublié les détails et gardé l'émotion. Pour les détails, il faut la vase. »
**Néréa** *(à 2, réplique « Lyra »)* — « Non. Personne ne monte au ciel. Ce qui monte, c'est la chaleur. Vous la connaissiez ? » *(le héros acquiesce)* « Alors vous êtes vieux. Très vieux. Et bien conservé. »
**Néréa** *(à 3)* — « Peut-être. Le chant dit aussi que vous avez *regardé* deux terres pour les unir. Si vous en êtes capable, regardez cette planche et réparez-la. » *(Rien ne se passe.)* « Voilà. Ni vous ni personne. »
**Néréa** *(à 4)* — « Oui. C'est ce qui le rend dangereux. »

*Le Carnet s'ouvre de lui-même sur une page vierge : c'est l'introduction des **Chroniques partiales** à l'interface. Une infobulle « dans le monde » (pas d'adresse au joueur) : « Chaque époque raconte la précédente à sa manière. »*

*Néréa lève la tête. L'horizon, côté Clair, devient laiteux.*

**Néréa** — « Marée. Petite, mais assez. Vous savez nager ? »
*(Si `transformation.I = B`)* « … Vous coulez, n'est-ce pas. Évidemment. »

### 4. Veillée — Sauge

*Le village sur pilotis, de nuit. Lanternes d'algues, filets, odeur de poisson séché. Au centre, un gros rocher sombre : « le rocher de Brutus ». Aubin, l'ancien des pilotis, tend une écuelle au héros sans rien demander. Des enfants l'observent à distance ; Ilse, douze ans, s'approche la première.*

**Ilse** — « C'est vrai que tu es le Dormeur ? »
**Aubin** — « Laisse-le manger. Les légendes, ça mange aussi. »
**Ilse** — « Touche le rocher. Il est tiède. C'est Brutus. »

1. *Toucher le rocher.* — Il est tiède, en effet. **Aubin** : « Il a pris le soleil toute la journée. Comme Brutus, sans doute. » [—]
2. « Brutus était un homme. Pas un rocher. » — **Ilse** : « Comment tu le sais ? » [ouvre la réplique suivante]
3. « Racontez-moi le village. » [confiance.nerea +1]

*Le moment-clé de la veillée : le héros demande ce que sont devenus ses compagnons.*

**Néréa** — « Lyra, Brutus, Néréa… Ce sont des noms de lignées. Il y a toujours une Néréa, parce qu'il y a toujours quelqu'un pour lire la vase. Les Soigneuses et les Gardiens sont partis vers les îles sèches du nord il y a deux générations. Les premiers… » *(elle cherche le mot juste)* « Les premiers se sont dispersés il y a quatre siècles. Comme on se disperse. Rien de ce qu'ils étaient n'a disparu, mais plus rien ne se tient ensemble pour s'appeler Lyra. »

1. « Quatre siècles. » *(silence)* [confiance.nerea +1]
2. « Pour moi, c'était ce matin. » [confiance.nerea +1 ; Néréa le note dans son journal]
3. « Alors je suis seul. » — **Néréa** : « Vous avez une écuelle et un toit. C'est déjà deux choses. » [—]

**Aubin** — « Écoute-moi, Dormeur. Ceux d'avant, laisse-les couler. Le passé, c'est comme une ancre : utile pour s'arrêter, pas pour avancer. »
*(Graine de la réponse tentante à Q11 ; rien n'est encore posé.)*

**Néréa** — « Et il y a autre chose. Les Marées montent plus souvent, et de façon moins prévisible. Les Archères de la Tour, qui les calculaient à l'heure près, se trompent depuis un mois. Eva est partie à Peut-Être, l'île indécise, pour comprendre. Elle n'est pas revenue. Elle est têtue : elle reviendra. Mais j'irais bien voir. »

**Le Carnet** — *Le héros écrit : « Suis-je celui de la légende ? »* [`carnet.Q07 = ouverte`]

### 5. Fin — La première page

> **Journal de Néréa** — *Je l'ai emmené à Sauge sans lui avoir rien demandé, ce qui ne me ressemble pas. Il n'a pas dit grand-chose. Il a demandé des nouvelles de gens morts depuis quatre siècles avec la voix qu'on prend pour des gens partis la veille. J'ai pensé : voilà ce que c'est, une strate qu'on retrouve en surface. Elle ne sait pas qu'elle est vieille. Demain, nous partons pour Peut-Être. Aubin dit que je suis folle. Aubin dit cela tous les jours, c'est une constante utile.*

## Combats

### Combat 3 — Fuir la Marée

- **Carte :** les pilotis de l'Est, entre la Pierre Lente (sud) et les premières passerelles de Sauge (nord). Des passerelles étroites (sol `.`), des plates-formes hautes (`1`), de l'eau profonde partout ailleurs (`W`, infranchissable pour le héros, sauf s'il a d'autres capacités). La sortie est le bord nord.

```
WWW.11.WW      ← bord nord : Sauge (sortie, ★)
W~.WW1~WW
W..WW1..W
W1WWWWW1W
W1..~..1W
WWWW~WW.W
W..1.WW.W
W.WW....W
W.WWWWW1W
W...22..W
WW~3#3~WW      ← la Pierre Lente (départ)
```

- **Calque de Superposition** (le Front de Marée arrive de l'est ; `?` = cases incertaines au départ, `sol 50 · eau 50`) :

```
.........
.........
......??.
.......?.
......???
.......?.
.........
......??.
.........
.........
.........
```

- **Équipes :**
  - Alliés : le héros, **Néréa II** (aquatique : elle nage en eau profonde, peut aller chercher le héros s'il tombe).
  - Ennemis : 4 **Lacunaires instables** (60 % frêle / 40 % dense) qui sortent du Front de Marée par deux, aux tours 2 et 5. Le **Front de Marée** (élément du décor) avance d'une colonne vers l'ouest tous les 2 tours de timeline.
- **Objectif principal :** survivre jusqu'au temps T = 12 tours de timeline (la Marée passe et se retire), **ou** atteindre le bord nord avec le héros.
- **Objectifs secondaires :**
  - ★ **Ne pas combattre :** atteindre le bord nord sans qu'aucun allié n'ait porté un coup au Front ou à un Lacunaire. Annoncé par Néréa : « Ne frappez rien. La Marée, c'est comme une eau trop froide : un choc, et elle prend. »
  - ◆ **Pas de Galet perdu :** traverser sans qu'aucune case incertaine ne se fixe en « eau » sous le héros.
- **Règle de la Marée qui « prend » :** chaque coup porté au Front ou à un Lacunaire ajoute 3 cases incertaines autour du point d'impact et fait avancer le Front d'une colonne immédiatement.
- **Défaite :** le héros se disperse. Une chute en eau profonde ne le disperse pas : il perd 25 % de ses PV et reste immobile jusqu'à ce que Néréa le rejoigne (une action de Néréa le ramène sur une passerelle adjacente).
- **Événements scriptés :**
  - **Tour 1 :** Néréa apprend l'action commune **Galet** au héros : « Lancez ça devant vous. Si la planche existe, elle tiendra. Sinon, autant le savoir de loin. » Infobulle : *le galet fixe la case sur laquelle il tombe*.
  - **Tour 2 :** premiers Lacunaires. Néréa : « Contournez. Ils sont lents tant qu'on ne les dérange pas. »
  - **Premier coup porté (si cela arrive) :** la Marée prend dans un craquement de glace. Néréa : « Voilà. Maintenant elle sait où nous sommes. Façon de parler : elle ne sait rien. Mais elle *prend*. »
  - **Le héros traverse une case incertaine sans galet :** tirage ; s'il tombe dans l'eau, Néréa : « Je vous avais dit de lancer le caillou ! »
  - **Si le héros n'utilise jamais Galet et ne fait que regarder une case** (la survole longuement, la sélectionne) : rien ne se passe. Néréa : « Vous pouvez la fixer des yeux jusqu'à demain. Elle ne vous doit rien. Il faut la *toucher*. » (Graine du ch. 8.)
- **Répliques de combat :**
  - **Néréa** (début) — « Vers le nord. Les planches hautes d'abord : la Marée monte moins vite que la peur. »
  - **Néréa** (si le héros traîne près de la Pierre Lente) — « Ne restez pas là. Vous avez déjà perdu assez de temps près de ce trou. »
  - **Néréa** (victoire par le bord) — « Sauge. Vous voyez ? On peut arriver quelque part sans rien casser. »
  - **Néréa** (victoire par le temps) — « Elle se retire. On a tenu. Mais on a laissé de la glace partout, regardez… »

## Choix et conséquences

| Choix ou objectif | Drapeaux | Effet plus tard |
| --- | --- | --- |
| Demander « Combien de temps ? » (nœud 1) | `confiance.nerea +1` | Néréa le tient pour un esprit curieux ; réplique de rappel au ch. 11. |
| Contester le chant (nœud 2, choix 1 ou 2) | `confiance.nerea +1` | Néréa lui montre plus tôt la vase au ch. 11 (dialogue d'introduction raccourci). |
| ★ Ne pas combattre | `confiance.nerea +1`, `confiance +1` | Habit « Ciré des pilotis » (voir Récompenses). Au ch. 12, Néréa rappelle : « Vous savez passer sans faire prendre la Marée. » |
| Combat livré (★ raté) | — | Le Front a laissé de la glace sur les pilotis de l'Est : au ch. 12, ces passerelles sont incertaines au départ. |
| Confier l'origine de l'objet de Nyx | (journal) | Au ch. 12, si `nyx_epargnee`, une Ombre vient voir le héros en silence avant la Marée (scène courte). |
| Veillée : « Pour moi, c'était ce matin. » | `confiance.nerea +1` | Réplique de Néréa dans la scène finale du ch. 12. |
| Carnet | `carnet.Q07 = ouverte` | Réponse tardive au ch. 14 (le Chroniqueur). |

## Récompenses

- **Néréa II** rejoint l'équipe.
- **Action commune « Galet »** (pour toute l'ère II et au-delà).
- **Habit — Ciré des pilotis** *(si ★)* : une veste de toile huilée, rapiécée par trois générations de pêcheurs. *Effet : le héros ne perd pas de PV quand il tombe en eau profonde (il perd seulement son tour).*
- **Habit — Écharpe d'algues** *(toujours, offerte par Aubin)* : une écharpe tressée d'algues sèches, qui sent le sel. *Effet : +1 Défense énergétique contre le froid (Givre, Lacunaires effilocheurs).*

## Graines pour la suite

- **Q07** trouvera sa réponse au ch. 14 : le Chroniqueur retrouvera ce chant parmi ses sources.
- **Le rocher de Brutus**, tiède au soleil : il réapparaît au ch. 12 (submergé ou non selon `ile_sauvee`).
- **Les Soigneuses et les Gardiens partis au nord** préparent Lyra III et Brutus III (ère III).
- **Aubin** et l'oubli : réponse tentante de Q11 (ch. 11).
- **Ilse** : apprentie d'Eva, graine de la lignée d'Eva III (ch. 12, `ile_sauvee = sauge`).
- **Les horloges à eau de Néréa** : première mesure, dans le monde, de la dilatation du temps près de la Pierre Lente. Elles reviennent au ch. 12 (retour au Puits).

## Notes de mise en œuvre

- **Action commune « Galet » :** portée 1 à 4, ligne de vue non requise (tir en cloche), aucun dégât, coût de temps 0,4. Elle fixe la case d'impact ou l'ennemi en Superposition. Elle sert à montrer que n'importe quel objet suffit à fixer un état.
- **Front de Marée :** un élément de décor qui avance (colonne par colonne) et convertit les cases recouvertes en cases incertaines (`sol 50 · eau 50`). Il « prend » sous les coups (règle ci-dessus). Les Lacunaires qui en sortent sont des ennemis normaux.
- **Condition de victoire double :** temps T **ou** case atteinte (bord nord) par un personnage désigné (le héros).
- **Suivi du ★ :** compter les actions offensives des alliés visant le Front ou un Lacunaire (le journal de combat existe déjà).
- **Chute en eau profonde :** pour les non-nageurs, remplacer la mort par « emporté » (perte de PV, tour perdu) dans ce chapitre, puis dans toute l'ère.
- **Le « regard » ne fixe rien :** survoler ou sélectionner une case incertaine ne déclenche jamais de tirage. Ajouter le déclencheur de réplique « case survolée longtemps sans interaction ».
- **Chronique partiale :** l'écran d'ouverture affiche la variante du chant selon `fragments`, avec les insertions selon `nyx_epargnee`, `lacune_geante_habitee`, `transformation.I`. Le texte est ensuite consultable dans le Carnet, onglet « Chroniques ».
