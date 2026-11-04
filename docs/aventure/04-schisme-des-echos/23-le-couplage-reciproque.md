# Chapitre 23 — Le couplage réciproque

> *« Les Thermistes se sont trompés de sens. Ou plutôt : ils n'ont regardé qu'un sens. Ce que vous nous avez fait, nous vous l'avons fait aussi. Je ne sais pas si c'est une consolation. »*
> — Manifeste de Nyx IV, IX (ajouté sans signature)

## Fiche

| | |
| --- | --- |
| Ère | IV — Le Schisme des Échos |
| Lieu | **La Salle des Défauts**, une grotte de cristaux sous Haut-Pendant |
| Équipe | Toute l'équipe restante, et ceux qui sont partis au ch. 21 (présents dans la salle, côté Déliés). Nyx IV. Merlin IV (si `merlin_convaincu`) ou Tarn et Néréa IV. Le Chroniqueur IV (si `chroniqueur_rejoint`). |
| Durée visée | 5 nœuds, **aucun combat** |
| Question au Carnet | **Q23** — *Qui oriente qui ?* (réponse dans ce chapitre) |

## Ce que le joueur sait en arrivant

Les Déliés accusent le Ghom d'avoir orienté l'évolution de l'Archipel, et ils ont des mesures pour le prouver. Le héros a vu ses alliés refuser, partir, rester. Eva IV a compris que le hasard est réel, mais qu'il ne fait pas la liberté. Merlin IV (ou Tarn) a annoncé qu'il y avait, dans les cristaux de la Salle, quelque chose de « plus grave que tout le reste ».

## Synopsis

Les Déliés descendent le héros dans la Salle des Défauts pour lui montrer la preuve de leur révolte : la signature du Ghom, inscrite dans les défauts des cristaux à chaque grand tournant de l'Archipel. Mais en relisant les traces avec le héros, le savant voit ce que personne n'avait cherché : **la signature elle-même change**. Après chaque action, l'Influence suivante porte la marque de ce que le Ghom vient de toucher. Les abysses l'ont rendue plus lente, le verre plus cassante, les Lacunes plus froide. On ne peut pas agir sur un système sans être modifié par lui. Le Ghom a orienté l'Archipel ; l'Archipel a orienté le Ghom. Gorr pose une question. Le héros doit dire ce que le Ghom doit aux Échos. Nyx IV propose une alliance.

**Aucun quatrième mur :** tout se passe dans le monde, entre Échos, devant des cristaux. Le Ghom est une présence ; il ne parle pas. Personne ne s'adresse à qui que ce soit hors de la salle.

## Carte du chapitre

```
[1 Rencontre : La descente] → [2 Archive : Les défauts] → [3 Rencontre : L'autre sens]
                                                                 ↓
                         [5 Fin : L'alliance] ← [4 Rencontre : Ce qu'il doit]
```

## Scènes

### 1. La descente (Rencontre)

*Un puits de corde sous Haut-Pendant, puis une grotte. Les parois sont tapissées de cristaux, certains gros comme des maisons. Ils ne brillent pas d'eux-mêmes : on y descend des lampes, et la lumière en ressort changée, découpée, ralentie par des milliers de défauts internes. Les Déliés appellent ça « lire ».*

*Ceux qui sont partis au ch. 21 sont là, assis avec les Déliés. Ils saluent le héros d'un signe de tête. Personne ne se lève.*

**Nyx IV** — « C'est ici qu'on a compris. Je veux que tu voies ce qu'on a vu. Après, tu feras ce que tu veux. Comme nous. »

*(si `merlin_convaincu`)*
**Merlin IV** — « Merlin, quatrième du nom. Mon ancêtre a cru qu'on pouvait mesurer le monde sans le toucher. Ton passage l'a fait douter ; ma lignée a fait de ce doute une méthode. Tout ce que tu vas voir est mesuré trois fois. Je préviens : je déteste avoir tort, et je le dis quand c'est le cas. »

*(sinon)*
**Tarn** — « L'ordre de Merlin a mesuré tout ça il y a deux siècles. Ils ont classé les relevés et ne les ont jamais relus. Néréa et moi, on les a relus. »
**Néréa IV** *(si `nerea_retrouvee`, ou parmi les Déliés)* — « Les cristaux déposent comme un lac. Une contrainte, un défaut. Couche après couche. Je sais lire ça. »

*(si `chroniqueur_rejoint`)*
**Le Chroniqueur IV** — « C'est moi qui ai écrit la Chronique que tu as lue en sortant. Toutes les sources sont ici. Toutes. Je veux dire : toutes celles que j'ai utilisées. Il est possible qu'il y en ait d'autres. Il est même probable. Je… lis avec toi. »

*(si `premier_cristal = sauve`)*
*Le Premier Cristal, là où l'ère III l'a laissé, est apporté dans la Salle et posé au centre. **Merlin IV / Néréa IV** : « Celui-là a tout vu depuis l'Aube. C'est notre meilleur témoin. » (Sans lui, la lecture se fait sur les cristaux de la Salle, plus jeunes : la frise de l'Archive commence à l'ère I au lieu du prologue.)*

### 2. Les défauts (Archive)

*Coût : 1 Usure (une longue exposition à des cristaux instables, sous une lumière dure). [`archives.lues +1`, `usure +1`]*

**Principe physique :** un cristal garde dans sa structure les traces des contraintes qu'il a subies. Les Cristaux d'intrication gardent aussi des corrélations. Chaque fois qu'une Influence a agi à proximité (une chaleur rejetée, un temps propre ralenti, une poussée tectonique), les cristaux ont enregistré une **signature** : un motif de défauts, propre à cette Influence, à ce moment-là.

**Déroulé :** la Salle projette une **frise** des grandes actions du Ghom, de l'Aube à la Fêlure, une par ère. Pour chaque moment, deux faisceaux sortent du cristal :
- le faisceau **clair** montre ce que l'Influence a fait **à l'Archipel** (ce que les Déliés ont toujours lu) ;
- le faisceau **sombre** montre la **signature de l'Influence elle-même** : sa forme, sa chaleur, sa lenteur.

Les Déliés ne lisaient que le faisceau clair.

**Mécanique (énigme de lecture, sans échec) :** le héros place ses Échos devant les cristaux, comme on dispose des lampes. Chaque placement allume un moment de la frise. Pour lire le faisceau sombre, il faut **deux Échos sur la même case** devant le cristal : une Intrication, la seule façon d'avoir une lecture assez fine. Les moments disponibles dépendent des drapeaux :

| Moment | Toujours / selon | Faisceau clair (l'Archipel) | Faisceau sombre (le Ghom) |
| --- | --- | --- | --- |
| **L'Aube** (prologue) | si `premier_cristal = sauve` | Une première Réparation sur une zone qui s'effilochait. | Une signature brute, sans forme, presque tiède. « Comme une main qui n'a encore rien touché. » |
| **Les bords froids** (ère I) | toujours | Les Lacunes repoussées, le Tissu entretenu. | La Réparation suivante rejette sa chaleur **plus près** : la signature s'est resserrée, au contact des bords froids. |
| **La Collision** (ère I) | toujours | Les Fragments qui se touchent ; `fusion` ou `separation`. | Le Séisme d'après porte **deux motifs mêlés** : la roche de l'île, et celle du Fragment du Chaos. |
| **Les Marées** (ère II) | toujours | L'île sauvée (`ile_sauvee`). | La Distorsion d'après est **plus lente**, plus profonde : elle a la forme des abysses. « Elle a pris le pas de l'eau. » |
| **Les strates** (ère II) | si `archives.lues ≥ 2` avant ce chapitre | Les reconstitutions jouées avec Néréa II. | Chaque lecture a laissé une marque **dans les deux sens** : le Ghom a lu le passé, et le passé lu a refroidi sa signature. |
| **Les mines** (ère III) | si `cristaux.extraits ≥ 1` | Les Cristaux brisés, les Lacunes qui grandissent. | Le Séisme d'après est **cassant**, à facettes : la signature du verre. Plus d'Élan, moins de tenue. |
| **Le Cristal rendu** (ère III) | si `cristal_rendu` | Une Lacune recousue par un lien donné. | Une signature **plus dense**, comme si le Ghom tenait mieux là où l'on avait rendu. |
| **La Fêlure** (ère III) | toujours | Vitrelle qui se fend. | Une signature brouillée, inquiète. Merlin IV : « Je n'ai pas de mot scientifique pour ça. "Inquiète" n'en est pas un. Je le garde quand même. » |
| **Le Puits** (chaque fin d'ère) | toujours | Le héros déposé dans le Puits. | Chaque fois, la Distorsion suivante a une **lentille plus profonde**. Le Ghom a touché le temps le plus lent du Fragment ; le temps lent l'a marqué. |

*Chaque moment lu ajoute une ligne à l'écran des **Empreintes** (voir plus bas).*

**Répliques pendant la lecture :**
- **Merlin IV / Néréa IV**, au premier faisceau sombre — « Attendez. Ce motif-là. Ce n'est pas le même qu'avant. »
- **Merlin IV / Tarn** — « On a lu le faisceau clair pendant deux siècles. On cherchait ce que le Ghom avait fait. On n'a jamais cherché ce qui lui avait été fait. »
- **Le Chroniqueur IV** — « Je n'ai jamais… Aucune de mes sources ne… Non. Mes sources le disaient. Je ne les lisais que dans un sens. »
- **Lyra IV** *(si présente, à la lecture de la Réparation)* — « Ce que je répare ici, je le paie ailleurs. Lui aussi. Et là où il paie, ça le change. »

### 3. L'autre sens (Rencontre)

*La frise s'éteint. Dans le silence, Merlin IV (ou Tarn) parle lentement, pour une fois.*

**Merlin IV** — « Une interaction n'a pas de sens unique. Quand deux choses se touchent, chacune garde une trace de l'autre. Ce n'est pas une idée de Délié, c'est la base de toute mesure. Mon ancêtre l'a appris au prix de son orgueil : on ne mesure rien sans être perturbé en retour. »
**Merlin IV** — « Le Ghom a poussé l'Archipel. Les cristaux le montrent, on avait raison. Mais l'Archipel a poussé le Ghom. Chaque Fragment qu'il a touché, chaque eau, chaque cristal, chaque Écho. Ses Influences d'aujourd'hui ne sont pas celles de l'Aube. Elles sont faites de nous. »
**Merlin IV** — « On ne peut pas agir sur un système sans être modifié par lui. Même un Ghom. Surtout un Ghom : il agit plus que n'importe qui. »

*(sans Merlin IV)* **Tarn** — « Je disais que tout était écrit, et que c'était le Ghom qui écrivait. On a les deux mains sur la même plume. Je ne sais plus qui écrit. »

**Nyx IV**, *après un long silence* — « Donc on l'a taillé aussi. »
**Nyx IV** — « Ça ne change rien à ce qu'il nous a fait. » *(un temps)* « Ça change à qui on parle. »

#### Les deux écoles

*Un Délié âgé, Immobiliste, se lève.*
**Le Délié immobiliste** — « Un dieu immobile ne change pas. Si ça change, ce n'est pas un dieu. »
*Une jeune Déliée lui répond, Lumineuse.*
**La Déliée lumineuse** — « Pour ce qui va à la vitesse de la lumière, aucun temps ne passe. Il ne change pas pour lui. Il change pour nous. Ça ne contredit rien. »
**Merlin IV** — « Les deux ont une réponse. Les cristaux ne tranchent pas entre elles. Ils disent seulement que, vu d'ici, il a changé. Je ne sais pas ce qu'il est. Je sais ce qu'il a touché. »

#### La signature d'en face

*(Si au moins trois moments ont été lus.)* *Dans un coin de la Salle, un cristal plus sombre que les autres. Néréa IV ou Merlin IV y descend une lampe. La lumière en ressort à peine.*

**Merlin IV / Néréa IV** — « Celle-là, ce n'est pas la signature de ton Ghom. C'est celle d'en face. Le Ghom du Chaos. »
**Merlin IV / Néréa IV** — « Elle change aussi. Elle devient froide. De plus en plus froide, et de plus en plus rare. Il a laissé son Fragment s'éteindre, et le Fragment éteint l'a refroidi en retour. Il s'est fait Lacune lui-même, un peu. »
[`ghom_dechu.verite +1`]

#### Gorr

*Gorr s'est approché du grand cristal. Sa propre surface renvoie la lumière des lampes. Le reflet tombe sur la frise, et un motif s'y allume : les Séismes de l'ère III, à facettes, et sous eux un motif plus fin, régulier, que personne n'avait remarqué.*

**Merlin IV / Néréa IV** — « Ça… c'est le motif de croissance de Gorr. Il est dans la signature des Séismes, depuis les mines. »

*(si `gorr_question` est faux : sa première question)*
*La fissure lumineuse apparue au ch. 21 s'élargit sur son flanc. Gorr reste immobile très longtemps. Puis :*
**Gorr** — « Gorr… a changé le Ghom ? »
*Toute la salle se tourne vers lui. C'est la première fois qu'il demande quelque chose.*
[`gorr_question = vrai` (rattrapage), `carnet.Q16 = repondue` si elle était ouverte : *une question peut naître d'une pierre*. Gorr suit désormais l'Autonomie (README de l'ère).]
**Nyx IV**, *très bas* — « Il a demandé. La pierre a demandé. »

*(si `gorr_question` est vrai : sa deuxième question)*
**Gorr** — « Gorr a changé le Ghom. Le Ghom le sait ? »
**Merlin IV / Néréa IV** — « Personne ne sait ce que sait un Ghom. Personne ne sait s'il sait. »
**Gorr** — « Alors Gorr garde la question. Gorr a de la place. »
[`confiance.gorr +1`]

*Le Carnet s'ouvre.*

> **Q23** — *Qui oriente qui ?*

### 4. Ce qu'il doit (Rencontre)

*Tous regardent le héros. Pas lui : ce qui se tient derrière lui, la pression dans l'air que tout le monde sent depuis qu'il est entré, et qui a fait scintiller les cristaux pendant la lecture.*

**Nyx IV** — « Tu es le seul qui le touche de l'intérieur. Alors dis-le. Qu'est-ce qu'il nous doit ? »

Choix :
1. « Il vous doit ce qu'il est devenu. » [`confiance +2`, `confiance.nyx +1`, `carnet.Q23 = repondue`] → **Nyx IV** : « C'est beaucoup. C'est même tout. »
2. « Il vous doit autant que vous lui devez. » [`confiance +1`, `confiance.nyx +2`, `carnet.Q23 = repondue`] → **Merlin IV / Tarn** : « C'est la seule phrase de la journée que je signerais sans relire. » **Nyx IV** : « Je n'aime pas la deuxième moitié. Elle est vraie quand même. »
3. « Il ne doit rien. Il agit, c'est tout. » [`confiance −2`, `confiance.nyx −2` ; `carnet.Q23` reste ouverte] → **Nyx IV** : « Alors les cristaux mentent, ou tu ne sais pas lire. Je ne sais pas ce qui est pire. »
4. *Se taire, et laisser le Ghom se manifester.* [`confiance +1`, `confiance.nyx +1`, `carnet.Q23 = repondue`]
   *La pression qui accompagne le héros se retire de la Salle, lentement, pour la première fois depuis l'Aube. Sans elle, les cristaux s'assombrissent d'un cran : tout le monde voit qu'il les touchait. Les Déliés retiennent leur souffle. Puis la pression revient, plus douce, et les cristaux se rallument, pas tout à fait comme avant.*
   **Merlin IV / Néréa IV** — « Vous avez vu ? Ils ne se sont pas rallumés pareil. Il a touché, il a été touché. Ça vient de se refaire sous nos yeux. »

*(si `chroniqueur_rejoint`)* **Le Chroniqueur IV** *(il écrit déjà)* — « Correction à la Chronique de la Frange, troisième note. Le Couplé n'était pas la main du Ghom. Il était l'endroit où les deux se touchaient. Je… je dois tout reprendre. C'est la meilleure nouvelle de ma vie. »

### 5. L'alliance (Fin)

*On remonte. Sur la plateforme de Haut-Pendant, le vent. Au sud, au-dessus du Bord, une lueur froide : le Fragment du Chaos, plus près que jamais (si `fragments = separation`), ou la vieille soudure qui se fend (si `fusion`).*

**Nyx IV** — « Le Bord grandit. Le Ghom d'en face pousse. Il ne peut pas toucher le gris, pas plus que le tien, mais il peut l'élargir en éteignant ce qui l'entoure. Si le Bord avale la Frange, il n'y aura plus de bord du tout. Juste du gris. Et on n'y vivra pas longtemps. »
**Nyx IV** — « Alors je te propose quelque chose. Je n'aime pas ça. Je le propose quand même. »
**Nyx IV** — « Au Bord, on se bat ensemble. À trois conditions. Tu ne forces personne : pas d'Insistance, jamais. Ton Ghom ne touche aucun Délié, et aucun des tiens qui n'a pas demandé. Et toi, tu viens dans le gris avec moi, quand il le faudra. Tu y ramènes ton Ghom. Je veux voir ce que ça fait, de près, quand c'est moi qui choisis. »

**Condition de l'acceptation par Nyx IV :** elle tient parole si `confiance.nyx ≥ 0`, **et** (`rupture.respectee` **ou** `autonomie.insistances ≤ 1`), **et** aucun partant ni Délié n'a été dispersé au ch. 21. Sinon, quelle que soit la réponse du héros, elle conclut : « Non. Pas encore. Je ne peux pas. » [`alliance_nyx = faux`]

Choix :
1. « J'accepte. » [`alliance_nyx = vrai` si la condition est remplie]
2. « J'accepte, si ceux qui sont partis peuvent revenir quand ils le veulent. » [`alliance_nyx = vrai` si la condition est remplie, `confiance.nyx +1`] → **Nyx IV** : « Ils l'ont toujours pu. C'est toi qui ne le savais pas. »
3. « Non. » [`alliance_nyx = faux`] → **Nyx IV** : « D'accord. Au moins, tu as refusé toi-même. »

*(si `alliance_nyx`)* *Nyx IV tend la main. Elle s'arrête à un doigt, comme au ch. 20. Puis elle touche. C'est le premier contact de l'ère entre eux.*
**Nyx IV** — « Ça fait ça, alors. »

## Les Empreintes

À la fin du chapitre, l'écran des Influences affiche sous chacune son **Empreinte**, calculée d'après les drapeaux. Elles s'appliquent **à partir du ch. 24 et pour toute l'ère V**. On n'en garde qu'une par Influence (la première de la liste qui s'applique), sauf mention contraire.

| Influence | Empreinte | Condition | Effet |
| --- | --- | --- | --- |
| **Distorsion** | **du Puits** | toujours | Visuel : la lentille est plus profonde. Aucun effet de jeu. (Elle prouve que l'Empreinte existe même sans choix particulier.) |
| | **des abysses** | `archives.lues ≥ 3` ou `transformation.II = A` | Retarder un ennemi le retarde de 5 de plus ; avancer un allié l'avance de 5 de moins. |
| **Séisme** | **d'ancrage** | `cristal_rendu` ou `cristaux.donnes ≥ 1` | Le rocher surgi empêche les cases adjacentes de s'effilocher pendant 3 tours. |
| | **de verre** | `cristaux.extraits ≥ 2` (cumulable avec la précédente) | Le rocher surgi est un cristal : il se brise au premier coup reçu et rend 1 Élan. |
| | **de Gorr** | `gorr_question` | Visuel : le rocher pousse en facettes régulières. Aucun effet de jeu. |
| **Réparation** | **partagée** | `lacunes.habitees` est le plus grand des trois compteurs `lacunes.*` | Soigne aussi tout Écho, **de n'importe quel camp**, qui partage une case avec un allié. |
| | **serrée** | `lacunes.recousues` est le plus grand | +2 au soin ; la chaleur rejetée inflige 1 dégât aux cases adjacentes aux soignés (tous camps). |
| | **lâche** | `lacunes.elargies` est le plus grand | −2 au soin ; la chaleur part dans le Clair (aucun dégât) ; soigne aussi les Échos neutres. |

*À égalité entre les compteurs `lacunes.*`, l'ordre de priorité est : partagée, serrée, lâche.*

## Choix et conséquences

| Choix ou objectif | Drapeaux | Effet plus tard |
| --- | --- | --- |
| Archive lue | `archives.lues +1`, `usure +1` | Empreintes calculées. |
| Signature du Ghom du Chaos lue | `ghom_dechu.verite +1` | Ère V : le Ghom déchu est « froid » ; il a été changé par ce qu'il a éteint. |
| Gorr pose sa première question (rattrapage) | `gorr_question = vrai`, `carnet.Q16 = repondue` | Gorr gagne l'Autonomie ; sa dernière question (ch. 28) devient possible. |
| Gorr pose sa deuxième question | `confiance.gorr +1` | La question « Le Ghom le sait ? » nourrit le ch. 28. |
| Ce qu'il doit : 1, 2 ou 4 | `carnet.Q23 = repondue`, `confiance` et `confiance.nyx` en hausse | Condition de l'alliance ; extrait IX du manifeste. |
| Ce qu'il doit : 3 | `confiance −2`, `confiance.nyx −2` | `alliance_nyx` presque impossible. |
| Alliance acceptée (condition remplie) | `alliance_nyx = vrai` | Ch. 24 : les Déliés commencent en camp séparé mais non hostile ; la paix est plus facile. **Révoquée** si le héros Insiste ou touche un Délié par une Influence au ch. 24. |
| Alliance refusée ou impossible | `alliance_nyx = faux` | Ch. 24 : les Déliés sont hostiles au début. |

## Récompenses

- **Habit — Éclat-témoin.** *Un éclat de la Salle des Défauts, qui garde dans ses défauts un instant du Ghom et un instant de l'Archipel, inséparables.* Effet : affiche les Empreintes en combat ; une fois par combat, montre la prochaine Influence du Ghom du Chaos (case visée) un tour à l'avance.
- **Trait — Le premier contact** *(si `alliance_nyx`)*. *La main de Nyx IV, un doigt, puis la paume.* Effet : au ch. 24, l'Intrication entre le héros et Nyx IV est disponible même si elle n'est pas dans l'équipe.
- **Pas de nouvel Écho.**

## Graines pour la suite

- **Les Empreintes** valent pour l'ère V : le Ghom qui affronte ses Doubles est déjà un Ghom changé.
- **Le Ghom du Chaos est froid** : il s'est fait changer par ses propres Lacunes. Au ch. 27, cela éclaire sa question (le monde a-t-il besoin des Ghoms ?) : lui-même a été défait par l'absence de liens.
- **La question de Gorr** (« Le Ghom le sait ? ») n'a pas de réponse et n'en aura pas : elle prépare la dernière question du jeu.
- **Les deux écoles** restent dos à dos. Les cristaux ne tranchent pas.
- **La Chronique corrigée** du Chroniqueur IV : en ère V, il n'y a plus de Chronique, mais sa correction peut apparaître dans un écran de chapitre.

## Notes de mise en œuvre

- **Chapitre sans combat :** une scène de lecture (énigme de placement sans échec, deux Échos sur une case pour lire le faisceau sombre) ; peut utiliser le plateau avec des cristaux comme entités, sans timeline de combat.
- **La frise :** moments activés selon les drapeaux (tableau de l'Archive) ; au moins quatre moments sont toujours présents.
- **Empreintes :** nouvel écran sous les Influences ; calcul au chargement du ch. 24, puis à chaque chapitre de l'ère V. Les effets sont **propres à l'Aventure** et ne modifient pas les Influences des autres modes.
- **Le Ghom se manifeste (choix 4) :** effet de « pression » qui se retire (son grave qui s'éteint, cristaux qui baissent d'un cran), puis revient avec une teinte légèrement différente.
- **Pas de quatrième mur :** aucun texte de ce chapitre ne nomme le joueur, l'écran, ou la partie. Le Ghom n'a ni réplique ni pensée écrite.
- **Valeur de rattrapage** de `gorr_question` (posé au ch. 16 dans le registre, ici au ch. 23) : à documenter dans le registre.
- **Premier Cristal :** sa position (porté, gardé, conservé ailleurs) dépend de l'ère III ; ce chapitre suppose seulement qu'on peut l'apporter s'il a été sauvé.
