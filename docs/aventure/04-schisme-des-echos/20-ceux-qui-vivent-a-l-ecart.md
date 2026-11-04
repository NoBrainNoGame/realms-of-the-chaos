# Chapitre 20 — Ceux qui vivent à l'écart

> *« Dans les Lacunes, vos mains glissent. Il n'y a rien à quoi s'accrocher. C'est pour cela que nous y vivons. Ce n'est pas un refuge. C'est une réponse. »*
> — Manifeste de Nyx IV, V

## Fiche

| | |
| --- | --- |
| Ère | IV — Le Schisme des Échos |
| Lieu | **Haut-Pendant** (village suspendu), **les Nasses** (habitations au fond d'une Lacune), **le Lac muet**, **Corde-Basse** |
| Équipe | Le héros, Gorr, Brutus IV, Lyra IV. **Eva IV** rejoint (nœud 1). **Néréa IV** rejoint si l'objectif ★ est atteint. **Squalor IV** rejoint à la veillée si `squalor_rejoint`. |
| Durée visée | 7 nœuds, 1 combat, 1 Archive optionnelle |
| Question au Carnet | **Q20** — *Existe-t-on quand plus rien ne nous touche ?* (Nyx ; réponse au ch. 24) |

## Ce que le joueur sait en arrivant

Le héros est le « Couplé » des chants des Déliés. Il a vu le manifeste, combattu des Guetteurs qui voulaient l'emmener dans une Lacune, et découvert l'Autonomie : ses alliés peuvent refuser ses ordres. Il sait que les cases de Lacune échappent aux Influences, sauf celle où il se tient. Une Archère a planté une invitation de Nyx IV dans un linteau, à trois cents pas, de nuit.

## Synopsis

Eva IV mène le héros par les câbles jusqu'à Haut-Pendant, puis au fond, dans les Nasses : la vie des Déliés dans les Lacunes. Elle est libre, sans Ghom, et silencieuse ; on s'y défait lentement. Les enfants oublient des mots. Nyx IV reçoit le héros, et le dialogue change du tout au tout s'il porte l'objet que la première Nyx lui a laissé il y a des siècles. Nyx IV répond, sans le savoir, à la première question du Carnet : *que devient une chose quand plus rien ne la touche ?* Puis l'alerte : Néréa IV, la dernière lectrice du Lac muet, dérive au milieu d'un lac qui s'effiloche. Il faut l'atteindre en gardant les rives actives. À la veillée, Nyx IV pose sa question, et annonce qu'au Bord, demain, elle demandera aux Échos du héros de choisir.

## Carte du chapitre

```
[1 Rencontre : Les câbles] → [2 Rencontre : Nyx IV] → [3 Lacune : Les Nasses]
                                                            ↓
[7 Fin : L'appel du Bord] ← [6 Veillée : Corde-Basse] ← [4 Combat : Le Lac muet]
                                                            ↓ (si Néréa IV atteinte)
                                                     [5 Archive : La dernière strate] (optionnelle)
```

## Scènes

### 1. Les câbles (Rencontre)

*Un câble tressé, tendu d'un bord à l'autre d'une Lacune large comme un champ. En dessous, le gris : ni noir ni brouillard, une absence de détails. Une jeune femme attend au milieu du câble, debout, sans se tenir. Un arc dans le dos, un registre de cuir à la ceinture.*

**Eva IV** — « Le Couplé. Plus petit que dans les chants. Ils te donnent trois têtes, à Corde-Basse. »
**Eva IV** — « C'est moi, la flèche. Trois cents pas, de nuit, vent de travers à quatre nœuds. Je l'ai calculé à l'avance. Je calcule toujours à l'avance. »
**Eva IV** — « Le câble fait soixante-deux pas. Il oscille d'un demi-pas au milieu. Si tu tombes, je ne te rattrape pas : c'est une question d'angle, pas de cœur. »

*Le registre de cuir est celui de la lignée. Eva IV l'ouvre : des colonnes de trajectoires, des angles, des vents, sur des siècles. La première page est d'une écriture que le joueur peut reconnaître : celle d'Eva II, au Temps des Marées.*

Choix :
1. « Tu ne rates jamais ? » → **Eva IV** : « Jamais. Le monde est une équation. Les Déliés disent que ton Ghom l'écrit. Moi, je dis que ça ne change rien : je n'ai qu'à la résoudre. » *(prépare le ch. 22)*
2. « Pourquoi vis-tu avec eux ? » [`confiance.eva +1`] → **Eva IV** : « Parce que là-dessous, rien ne dévie mes flèches. Pas de Distorsion. Pas de sol qui bouge. Pour une Archère, c'est le paradis. Pour le reste… on s'habitue. »
3. Traverser le câble sans rien dire. *(Si le héros a `transformation.II = A`, Branchies, ou un corps lourd de cristal, une petite épreuve d'équilibre ; aucun effet de Confiance.)*

*Eva IV rejoint l'équipe, comme escorte. Elle est soumise à l'Autonomie avec `confiance.eva`.*

### 2. Nyx IV (Rencontre)

*Haut-Pendant : des maisons de bois léger accrochées à six câbles. Au centre, une plateforme où pendent les ardoises du manifeste, toutes, dans l'ordre. Nyx IV est assise au bord, les jambes dans le vide gris. Ses contours sont un peu flous, comme une image prise en bougeant.*

**Nyx IV** — « Salut, le Couplé. Salut, ton Ghom. Oui, je te parle à toi aussi. Tu ne réponds jamais. On a l'habitude. »
**Nyx IV** — « Tu as lu ? » *(si le héros a lu toutes les ardoises au ch. 19 : « Tu as lu. Tout. Ça m'étonne. »)* *(s'il est passé sans lire : « Tu n'as même pas lu. Évidemment. On n'écrit pas pour toi. »)*

*(si `autonomie.insistances ≥ 1`)*
**Nyx IV** — « Au Village vide, tu as forcé quelqu'un. Le Gardien, ou la Soigneuse. Tu sais comment on l'a su ? On l'a vu de loin. Il bougeait comme Gorr. »

*(si `gorr_question` est faux)*
**Nyx IV**, *en regardant Gorr* — « Lui, par contre, il ne refuse jamais rien. Hein ? Tu lui dis "frappe", il frappe. Tu lui dis "attends", il attend trois siècles. C'est ça que vous voulez de nous. »

#### Variante A : le héros porte l'objet de Nyx, la Lame à une encoche (`objet_de_nyx`)

> *L'objet est celui que Nyx I a laissé au chapitre 5 ; sa description exacte est fixée dans l'ère I. Le texte ci-dessous ne le nomme pas, pour rester compatible : l'interface affiche son nom et son icône.*

*Nyx IV se tait au milieu d'une phrase. Elle regarde la ceinture du héros. Elle tend la main, s'arrête à un doigt, ne touche pas.*

**Nyx IV** — « Où as-tu pris ça. »
**Nyx IV** — « Chez nous, on raconte que la première l'a perdu en fuyant. C'est dans la troisième chanson. "Elle laissa tomber, elle ne se retourna pas." »
**Nyx IV** — « Elle ne l'a pas perdu, hein. On ne perd pas ça. Elle te l'a laissé. À toi. Au Couplé. »
*Un silence long. Le vent fait osciller la plateforme.*
**Nyx IV** — « La première Nyx disait que personne ne la touchait. Que c'était ça, être libre. Et elle a laissé quelque chose à quelqu'un. Exprès. »
**Nyx IV** — « Je ne sais pas quoi faire de ça. »

Choix :
1. « Elle a choisi quelqu'un. » [`confiance.nyx +2`] → **Nyx IV** : « … Choisi. Ouais. On peut appeler ça comme ça. »
2. Le lui rendre. [`confiance.nyx +2`, l'objet passe à Nyx IV : `objet_de_nyx = nyx_iv`] → **Nyx IV** le prend sans un mot. Elle le garde serré toute l'ère ; au ch. 24, elle l'apporte dans la Lacune (voir ch. 24).
3. « Il est à moi, maintenant. » [`confiance.nyx −1`] → **Nyx IV** : « Bien sûr. Tout finit chez vous. »
4. « Elle l'a laissé pour qu'on se retrouve. » [`confiance.nyx +1`] → **Nyx IV**, *un demi-sourire* : « Tu crois aux chansons, toi aussi. C'est presque mignon. »

#### Variante B : Nyx I a été épargnée, sans objet (`nyx_epargnee` sans `objet_de_nyx`)

**Nyx IV** — « Tu as laissé partir la première. C'est la seule raison pour laquelle on te parle au lieu de te pousser dans le gris. Ne t'en vante pas : je n'ai pas encore décidé si c'était de la bonté ou du calcul. »

#### Variante C : Nyx I s'est dispersée (ni l'un ni l'autre)

**Nyx IV** — « La première de ma lignée s'est dispersée sur cette île. Par ta main, ou par celle de ton Ghom. Je ne sais pas faire la différence entre les deux. C'est exactement le problème. »
[`confiance.nyx −1`]

*Dans toutes les variantes :*

**Nyx IV** — « Viens voir en bas. Ensuite tu me diras si on a eu tort. »

### 3. Les Nasses (Lacune)

*On descend par une échelle de corde dans le gris. Le son s'amortit. Les couleurs pâlissent. Le héros sent la pression du Ghom glisser, puis revenir autour de lui, comme une eau qui s'écarte et se referme. Au fond : des huttes en forme de nasses, posées sur un sol sans relief ; des gens qui se parlent de très près, front contre front.*

**Mécanique (énigme de placement, pas de combat) :** les Nasses sont une petite carte de 5 × 5 entièrement en cases de Lacune. Six Déliés y vivent, chacun seul sur sa case, et perdent lentement des contours. Le héros a quatre déplacements. **Chaque fois qu'il amène deux Déliés sur la même case** (en se plaçant entre eux pour les guider), la case devient **habitée** : leurs contours redeviennent nets. Il y a trois paires possibles. [`lacunes.habitees +1` si les trois paires sont formées]

*Sel est assise seule près d'une hutte. Neuf ans. Elle regarde le héros sans peur.*

**Sel** — « Tu es… le… »
**Lyra IV** *(si présente)* — « Le Couplé. »
**Sel** — « Le Couplé. Lyra dit un mot chaque fois. J'oublie les mots qu'on ne me redit pas. »
**Sel** — « Tu as quoi, sur la peau ? »
*(si `transformation.III = A`, Veines de cristal)* « Ça brille dedans. » *(si `B`, Mains de verre)* « On voit à travers tes mains. »

#### Q01 : la réponse de Nyx IV

*Si `carnet.Q01` est encore `ouverte`, le Carnet s'ouvre de lui-même à cette page pendant que Nyx IV parle.*

**Nyx IV** — « Tu veux savoir ce qui arrive à une chose que plus rien ne touche ? Regarde Sel. Ou regarde-moi. »
**Nyx IV** — « Elle ne disparaît pas. Rien ne disparaît, les Thermistes l'ont assez répété. Elle est toujours là. Mais elle n'a plus d'état par rapport au reste. Ses contours, sa forme, sa place, tout ça n'est défini que par ce qui la touche. Quand plus rien ne la touche, plus rien ne les fixe. »
**Nyx IV** — « Alors elle sort du monde que les autres partagent. Elle est là, et elle n'est plus là pour personne. C'est ça, une Lacune. Pas un trou. Une chose qui n'est plus tenue. »

> **Q01** — *Que devient une chose quand plus rien ne la touche ?* → **réponse trouvée.** [`carnet.Q01 = repondue`]

#### Q06, reposée

**Sel** — « Pourquoi il y a des choses ? Au lieu de rien ? »
**Tarn** *(depuis une hutte)* — « Parce que le rien est impossible, petite. C'est démontré. »

Choix :
1. « C'est démontré ? » → **Tarn**, *après un temps* : « … Non. C'est une phrase que les Thermistes disaient aux enfants. » [`carnet.Q06` inchangé]
2. Laisser Tarn répondre, et le noter. [`carnet.Q06 = fausse`]
3. « Personne ne sait, Sel. » [`carnet.Q06` reste `ouverte`] → **Sel** : « Personne. D'accord. Je retiens ce mot-là. »

### 5. La dernière strate (Archive, optionnelle)

*Accessible seulement si Néréa IV a été atteinte. Elle plonge avec le héros au bord du Lac muet, là où l'eau bouge encore un peu, et lit la carotte de sédiments qu'elle y a prélevée. Coût : 1 Usure (le froid). [`archives.lues +1`, `usure +1`]*

**Néréa IV** — « Tout ce qui tombe finit par se déposer. Ici, couche après couche, depuis l'Aube. Regarde : les crues, les cendres, les années de Marées. »
**Néréa IV** — « Et là, plus rien. Pas une couche vide : pas de couche du tout. Quand plus rien ne bouge, plus rien ne tombe. Le lac a cessé d'écrire. »

*(si `cristaux.extraits ≥ 1`)* **Néréa IV** — « La dernière couche est pleine de poussière de cristal. Elle vient de Vitrelle. Des fours. Le lac s'est tu peu après qu'on a brisé les Cristaux. Les deux traces se touchent. » [`ghom_dechu.verite` inchangé ; c'est l'arc A]
*(si `cristal_rendu`)* **Néréa IV** — « Il y a une veine claire, juste avant le silence. Quelqu'un a rendu un Cristal au monde. Ça n'a pas suffi pour le lac. Ça a suffi pour qu'il reste un peu d'eau qui bouge, là où on est. »

**Néréa IV** — « Les Déliés lisent la signature du Ghom dans les cristaux. Moi, je lis le lac. Et le lac ne dit pas qui a poussé. Il dit seulement ce qui est tombé. »

### 6. Corde-Basse (Veillée)

*Un village sur une seule corde, maisons en enfilade. Un feu dans une vasque de pierre suspendue. On parle bas.*

*(si `squalor_rejoint`)* *Une tête grise sort de l'eau sous la corde, crocs en avant.*
**Squalor IV** — « Tu sens le Puits. C'est une odeur de vieux, de très vieux. Ma lignée raconte que la tienne nous a laissé manger, un jour. On n'oublie pas ça, chez les Squales. On n'oublie pas qui a eu faim avec nous. » *(Squalor IV rejoint l'équipe ; il chasse dans le Lac muet pour les Déliés, et il reste loyal à sa façon.)*

**Nyx IV** — « Tu as vu en bas. Ils sont libres. Personne ne les tient. Ils oublient le mot "chaud". »
**Nyx IV** — « Je me pose une question depuis que je suis petite. Je te la donne, tu as un carnet pour ça. »

> **Q20** — *Existe-t-on quand plus rien ne nous touche ?* (Nyx)

**Nyx IV** — « Ne réponds pas. Tu n'as pas la réponse. Moi non plus. »

*Écoutes de veillée (une par Écho, `confiance.<lignée> +1`) :*
- **Eva IV** : « Ma lignée ne rate jamais. J'ai peur du jour où je raterai. Pas pour la cible. Pour moi. Si je rate, c'est que le monde n'est pas une équation, et alors je ne sais plus ce que je suis. » [`confiance.eva +1`]
- **Néréa IV** *(si atteinte)* : « Je suis restée parce qu'il fallait quelqu'un pour lire la dernière couche. Maintenant elle est lue. Je ne sais pas ce qu'on fait, après la dernière couche. » [`confiance.nerea +1`]
- **Brutus IV** : « Les Déliés ont des murs, eux aussi. Des cordes. Ils disent qu'elles relient. Un mur aussi, ça relie : ceux qui sont du même côté. » [`confiance.brutus +1`]
- **Gorr** *(si `gorr_question`)* : « En bas, Gorr est léger. Personne ne pousse Gorr. Gorr aime. Gorr n'aime pas que les autres s'effacent. Gorr ne sait pas choisir entre les deux. » [`confiance.gorr +1`]
- **Nyx IV** *(une fois, si `confiance.nyx ≥ 0`)* : « Tu veux savoir pourquoi j'écris aux Ghoms, alors qu'ils ne lisent pas ? Parce que si je n'écris à personne, je finis comme Sel. » [`confiance.nyx +1`]

### 7. L'appel du Bord (Fin)

**Nyx IV** — « Demain, j'irai au Bord. J'y appellerai ceux qui te suivent. Les héritiers des lignées que ton Ghom a portées pendant des siècles. Je leur demanderai de choisir. »
**Nyx IV** — « Pas toi. Eux. Tu n'auras rien à dire. C'est le principe. »

Choix :
1. « Ils choisiront. » [`confiance +1`] → **Nyx IV** : « On verra si tu le penses encore demain. »
2. « Ils resteront avec moi. » [`confiance.nyx −1`] → **Nyx IV** : « Tu vois ? Tu parles déjà à leur place. »
3. « Et toi, qu'est-ce que tu choisis ? » [`confiance.nyx +1`] → **Nyx IV**, *après un silence* : « D'aller au Bord. C'est tout ce que je sais choisir, pour l'instant. »

## Combats

### Combat — Le Lac muet

**Carte :** le Lac de Néréa, 11 × 9. Une rive de terre au nord (le point d'arrivée), des eaux peu profondes, puis profondes vers le centre. Au milieu, un îlot d'une case où se tient **Néréa IV**. Le fond est une Lacune : le centre du lac est déjà en cases `x`, et la carte est découpée en **neuf zones** de 3 × 3 environ (bordures tracées au sol par des lignes de bouées).

```
..1....1...
.1..~~~..1.
..~~www~~..
.~wwxxxww~.
.~wwx1xww~.
.~wwxxxww~.
..~~www~~..
.1..~~~..1.
...........
```

Légende : `~` eau peu profonde, `w` eau profonde, `x` case de Lacune, `1` îlot (Néréa IV au centre), `.` rive.

**Règle de la carte : l'effilochage.**
- Chaque zone a une **jauge d'activité** de 2 tours de timeline.
- Une zone est **entretenue** si, pendant ce délai, un Écho (de n'importe quel camp, sauf les Lacunaires) y passe, y agit ou y est ciblé.
- Une zone non entretenue perd **une case** : la plus proche d'une case `x` existante devient `x`. Sa jauge repart.
- **Les Lacunaires effilocheurs ne comptent pas** comme activité, et chaque Lacunaire effilocheur qui finit son tour dans une zone **avance sa jauge d'un demi-tour**.

**Équipes :**
- **Alliés :** le héros, Gorr, Brutus IV, Lyra IV, Eva IV (au nord). Néréa IV (sur l'îlot), contrôlée par l'IA jusqu'à ce qu'on l'atteigne.
- **Ennemis :** des **Lacunaires**, matière en superposition, ni bons ni mauvais, qui affluent du centre :
  - 4 **Lacunaires effilocheurs** (nouveau : lents, PV moyens, attaque faible ; leur présence fait progresser l'effilochage) ;
  - 2 **Lacunaires instables** (déjà créés en ère II : deux états affichés avec leurs probabilités, fixés au premier contact) ;
  - au tour 5, 1 **Lacunaire dédoublé** qui sort du centre.

**Objectif principal :** survivre jusqu'au tour 8 de la timeline, **ou** disperser tous les Lacunaires.

**Objectifs secondaires :**
- ★ **Retrouver Néréa IV** : amener un allié sur la case de Néréa IV ou une case adjacente avant que l'îlot ne devienne `x` (au plus tard au tour 6 si sa zone n'est jamais entretenue). Elle rejoint aussitôt l'équipe.
- ◆ Garder au moins 6 zones sur 9 avec une case non `x` à la fin. [`lacunes.recousues +1`]
- ◆ Finir avec deux Échos sur une même case `x` pendant un tour complet, sans dommage. [`lacunes.habitees +1`]

**Conditions de défaite :** le héros se disperse ; ou la rive nord est entièrement `x` (plus de retraite).

**Événements scriptés :**
- **Début.** Néréa IV, sur l'îlot : « Ne venez pas en ligne droite. Le fond est vide. Suivez les zones qui bougent encore. »
- **Tour 2.** Si un allié est sur une case `x`, sans le héros : il joue seul (règle de l'ère). Bulle : « *Ici, aucun ordre ne porte.* »
- **Tour 3.** La zone de l'îlot perd une case. **Néréa IV** : « Ça vient. Je sens le froid monter par les pieds. »
- **Tour 5.** Le Lacunaire dédoublé apparaît au centre. **Eva IV**, devant ses deux états : « Deux positions. Soixante-quarante. Je ne tire pas sur un soixante-quarante. » *(c'est R4-eva : elle refuse tout tir de ce genre ; on peut Respecter, ou Insister.)*
- **Si le héros Insiste sur Eva IV pour tirer au hasard :** la flèche part ; quel que soit le résultat, Eva IV, ensuite : « Ne refais jamais ça. » [`confiance.eva −2` en plus de l'effet normal]
- **Néréa IV atteinte.** Elle rejoint. **Néréa IV** : « Tu es venu par les zones vivantes. Tu as compris le lac plus vite que moi. »
- **Néréa IV non atteinte au tour 6.** L'îlot devient `x`. Néréa IV ne se disperse pas : **Squalor IV** *(si `squalor_rejoint`)* ou un Délié plonge et l'emporte vers le fond. Elle reste chez les Déliés. [`nerea_retrouvee = faux`]

**Répliques de combat :**
- **Brutus IV** — « Le sol part. Tenez la rive. »
- **Lyra IV** *(en soignant sur une case qui s'effiloche)* — « Plus cher ici. Beaucoup plus cher. »
- **Gorr** *(si `gorr_question`)* — « Gorr marche partout. Partout où Gorr marche, ça tient. »
- **Eva IV** *(tir réussi)* — « Angle, vent, distance. Toujours. »
- **Néréa IV** *(fin)* — « Le lac a cessé d'écrire. Mais nous, on a fait des remous. Ça se dépose aussi, les remous. »

## Choix et conséquences

| Choix ou objectif | Drapeaux | Effet plus tard |
| --- | --- | --- |
| Variante A, rendre l'objet à Nyx IV | `confiance.nyx +2`, `objet_de_nyx = nyx_iv` | Ch. 24 : Nyx IV apporte l'objet dans la Lacune ; elle accepte de partager une case dès le premier tour de cessez-le-feu (au lieu de trois). |
| Variante A, « Elle a choisi quelqu'un » | `confiance.nyx +2` | Ch. 24 : réplique de fin d'arc de Nyx IV, plus douce. |
| Variante A, garder l'objet | `confiance.nyx −1` | Ch. 24 : le héros peut encore le rendre, au moment de l'Intrication. |
| Variante C | `confiance.nyx −1` | Ch. 21 : Nyx IV est plus dure dans son appel. |
| Les Nasses : trois paires formées | `lacunes.habitees +1` | Ch. 24 : les Déliés connaissent le geste. |
| Q01 répondue | `carnet.Q01 = repondue` | — |
| Q06 : réponse de Tarn notée | `carnet.Q06 = fausse` | Fin secrète compromise. |
| ★ Néréa IV retrouvée | `nerea_retrouvee = vrai` | Néréa IV dans l'équipe ; elle lit la Salle des Défauts au ch. 23. |
| ★ raté | `nerea_retrouvee = faux` | Néréa IV est chez les Déliés ; elle peut partir avec eux au ch. 21 sans combat. |
| ◆ 6 zones gardées | `lacunes.recousues +1` | — |
| ◆ Lacune habitée sans dommage | `lacunes.habitees +1` | — |
| Archive lue | `archives.lues +1`, `usure +1` | Les Empreintes du ch. 23 (Distorsion). |
| Fin : « Ils choisiront » | `confiance +1` | Ch. 21 : un départ peut se faire sans combat. |

## Récompenses

- **Habit — Fil de lisière.** *Un fil tressé, tendu autrefois entre deux bords de Lacune, que les Déliés nouent au poignet des nouveaux venus.* Effet : le héros ne subit pas l'Usure des cases de Lacune s'il finit son tour adjacent à un allié.
- **Habit — Registre d'Eva II** *(si `confiance.eva ≥ +2` en fin de chapitre ; Eva IV le confie pour la nuit)*. *Des colonnes d'angles et de vents sur quatre siècles, la première page d'une main que le héros connaît.* Effet : affiche, en combat, la probabilité exacte des tirs d'Eva IV sur les cibles en Superposition.
- **Rejoignent :** Eva IV ; Néréa IV (★) ; Squalor IV (si `squalor_rejoint`).

## Graines pour la suite

- **Q20** sera répondue par Nyx IV au ch. 24 : on a vu Sel ; on y verra Nyx IV elle-même.
- **L'objet de Nyx**, s'il a été rendu, fait partie de l'Intrication du ch. 24.
- **Eva IV refuse les tirs à moins de 100 %** : c'est son arc (ch. 22).
- **La dernière strate** relie le silence du lac aux mines de l'ère III (arc A) et prépare la Salle des Défauts (ch. 23).
- **Le Registre d'Eva II** : objet fil rouge possible pour l'ère V (les Doubles d'Eva).

## Notes de mise en œuvre

- **Effilochage par zones :** découpage de la carte en zones, jauge d'activité par zone, conversion de cases en `x` à la frontière existante ; les Lacunaires effilocheurs ne comptent pas et accélèrent la jauge.
- **Nasses :** petite énigme de placement sans combat (déplacements limités, cases à « apparier »). Peut réutiliser le moteur de combat avec des PNJ neutres immobiles.
- **Entités neutres :** Néréa IV pilotée par l'IA tant qu'elle n'est pas atteinte ; passage dans l'équipe du joueur en cours de combat. L'équipe peut dépasser quatre Échos pendant ce combat ; la limite s'applique à la sortie.
- **Objet de Nyx :** son nom et son icône viennent de l'ère I ; le texte ici ne le nomme pas.
- **Drapeau nouveau :** `nerea_retrouvee` (booléen). Valeur nouvelle : `objet_de_nyx = nyx_iv` (l'objet est passé à Nyx IV).
- **Le gris :** la désaturation progressive des cases de Lacune, et le son étouffé quand la caméra est au-dessus.
