# Chapitre 24 — La Paix des Lacunes

> *« J'ai rayé le paragraphe VII. Je l'ai laissé lisible. On doit voir ce qu'on a cru. »*
> — Manifeste de Nyx IV, X (n'existe que si la paix est faite)

## Fiche

| | |
| --- | --- |
| Ère | IV — Le Schisme des Échos (fin d'ère) |
| Lieu | **Le Bord**. Au centre : **l'Œil** (si `lacune_geante_habitee`), sinon **la Langue**, une avancée de terre ferme qui s'enfonce dans le gris. |
| Équipe | Le héros et ceux qui sont restés (au plus quatre). **Le Lacunaire IV** rejoint avant la bataille si `confiance.lacunaire ≥ +2`. Les partis du ch. 21 sont dans le camp de Nyx IV ; ils peuvent revenir à la fin. |
| Durée visée | 4 nœuds, 1 grande bataille à trois camps |
| Question au Carnet | **Q24** — *Peut-on être libres ensemble ?* (ouverte) |

## Ce que le joueur sait en arrivant

Le héros sait que le Ghom a orienté l'Archipel, et que l'Archipel a orienté le Ghom. Il a vu les Empreintes. Il a peut-être touché la main de Nyx IV, et accepté ses trois conditions : ne forcer personne, ne toucher aucun Délié par une Influence, venir dans le gris avec elle. Il sait que le Ghom du Chaos élargit le Bord en éteignant ce qui l'entoure, et que si le Bord avale la Frange, il n'y aura plus de bord du tout.

## Synopsis

Les trois camps se retrouvent au bord du Bord : l'équipe du héros et son Ghom, les Déliés de Nyx IV, et ce qui reste au Ghom du Chaos (des Lacunaires qu'il laisse affluer, et des Échos qui ont choisi son froid). Le Ghom du Chaos ne peut pas toucher le gris, mais il éteint les terres autour, et le Bord grandit à chaque tour. Chacun se bat pour sa liberté : les uns contre la main des Ghoms, les autres pour la terre ferme, le dernier pour voir si le monde se passe de lui. L'objectif ★ n'est pas de gagner, mais d'**arrêter le combat sans vainqueur** : deux Échos de camps opposés qui habitent ensemble une case de Lacune, une Intrication entre ennemis. Qu'il y ait paix ou non, le Tissu, usé par des siècles de Cristaux brisés et de Lacunes, finit par se déchirer au centre du Bord. Par la déchirure, on aperçoit d'autres branches du monde. Le héros y reçoit sa transformation : **Peau d'ombre** s'il reste dans le gris, **Cicatrices de lumière** s'il se place entre la déchirure et les siens.

## Carte du chapitre

```
[1 Rencontre : La veille du Bord] → [2 Combat : La Paix des Lacunes]
                                              ↓
                  [4 Fin : La déchirure] ← [3 Rencontre : Ce qui reste]
```

## Scènes

### 1. La veille du Bord (Rencontre)

*La nuit, sur la lèvre. Les feux de l'équipe d'un côté, les lueurs sans reflet des Déliés de l'autre, dans le gris. Au loin, à l'est, une lumière froide grossit : le Fragment du Chaos (`separation`), ou la roche sombre de la vieille soudure qui se soulève (`fusion`). L'air y est plus froid de minute en minute.*

*(si `confiance.lacunaire ≥ +2`)*
**Le Lacunaire IV** *(sa forme est celle de `lacunaire.forme`)* — « Je suis né du gris. Je… nous… Non. Je. Les Déliés m'ont fixé, en me parlant tous les jours. Ton Ghom a fixé ma lignée, il y a longtemps. Je ne sais pas à qui je dois ma forme. Aux deux. Je viens avec toi demain. » *(Il rejoint l'équipe pour ce chapitre.)*

*Nyx IV vient seule jusqu'au feu du héros. Elle tient une ardoise : le paragraphe VII du manifeste.*

**Nyx IV** — « Demain, mes gens se battront pour ça. Je l'ai écrit il y a dix ans. Je le leur lis chaque veille. »
**Nyx IV** *(elle lit)* — « "La liberté, c'est l'absence de liens. Personne ne me touche. Donc je suis libre." »
**Nyx IV** — « Ça marche, tu sais. Ça tient debout. Jusqu'au moment où tu oublies le mot "chaud". »

*Le Carnet s'ouvre.*

> **Q24** — *Peut-on être libres ensemble ?*

Choix :
1. « Ton paragraphe a raison. Être libre, c'est n'être tenu par rien. » *(accepter la réponse tentante)* [`carnet.Q24 = fausse`] → **Nyx IV** : « Bon. Alors on est d'accord. Je ne sais pas pourquoi ça ne me soulage pas. »
2. « Personne ne te touche. Est-ce que tu touches encore quelqu'un ? » [`carnet.Q24 = ouverte`, `confiance.nyx +1`] → **Nyx IV**, *après un long silence* : « Pose pas des questions comme ça la veille d'une bataille. »
3. « Je ne sais pas. » [`carnet.Q24 = ouverte`] → **Nyx IV** : « Moi non plus. C'est nouveau. »

*Écoutes de veillée (`confiance.<lignée> +1`, une par Écho) :*
- **Brutus IV** *(si resté)* : « Demain, je ne garde pas un mur. Je garde un bord. Ça bouge, un bord. J'ai mis quatre siècles de lignée à aimer ça. »
- **Lyra IV** *(si restée)* : « Je soignerai qui tombera près de moi. Quel que soit son camp. Ne me le demande pas, ne me l'interdis pas. »
- **Eva IV** *(si restée, ou prêtée)* : « Je sais sur quoi je tirerai demain. Pas où ça arrivera. Ça me suffit. »
- **Néréa IV** *(si présente)* : « Demain, il se déposera quelque chose de très lourd. Je veux être là pour le lire après. »
- **Gorr** *(si `gorr_question`)* : « Gorr a une question pour demain. Gorr la garde. Pas encore. »
- **Squalor IV** *(si resté)* : « Le froid d'en face, je le sens d'ici. Ça sent la faim sans fin. J'aime pas. »

### 3. Ce qui reste (Rencontre)

*Selon l'issue du combat.*

#### Si la paix est faite (`paix_des_lacunes`)

*Le silence tombe sur le Bord, d'un coup. Les armes baissées. Deux Échos de camps opposés se tiennent sur la même case grise, et autour d'eux, le gris a pris une couleur : une couleur faible, mais une couleur.*

**Nyx IV** — « Regarde. Personne ne nous tient. Ni ton Ghom, ni l'autre. Et on se tient quand même. »
**Nyx IV** — « Tu sais ce que j'ai compris, au fond, avec Sel ? On existe, quand plus rien ne nous touche. On ne disparaît pas. Mais on n'est plus quelqu'un pour quelqu'un. Et ça, c'est la seule façon d'être quelqu'un que je connaisse. On n'a d'état que dans ce qu'on touche. »
**Nyx IV** — « Alors je choisis ce que je touche. C'est ça, ma liberté. Pas l'absence de liens. Le choix des liens. »

> **Q20** — *Existe-t-on quand plus rien ne nous touche ?* → **réponse trouvée.** On existe, mais on n'est plus quelqu'un pour quelqu'un : on n'a d'état que dans ses relations. [`carnet.Q20 = repondue`]

*(si `objet_de_nyx = nyx_iv`)* *Nyx IV ouvre la main. La Lame à une encoche de la première Nyx est posée sur la case habitée, entre les deux Échos.* **Nyx IV** — « La première l'a laissé à quelqu'un. Moi, je le laisse ici. Entre. »

**Les retours :** chaque Écho parti au ch. 21 choisit seul.
- Il **revient** dans l'équipe si `confiance.<lignée> ≥ +1`, ou s'il était parti en paix (« Va, si tu veux »). [`retour.<lignée> = vrai`]
- Sinon, il reste chez les Déliés, **allié** désormais (il sera là en ère V, aux côtés de Nyx IV).
- Réplique de retour type — **Lyra IV** : « Je reviens. Je n'ai pas eu tort de partir. Je n'ai pas tort de revenir. »

#### Si la paix n'est pas faite

*Le combat ne s'arrête pas : c'est la déchirure qui l'arrête (nœud 4). Juste avant, Nyx IV se retrouve seule sur une case grise, loin des siens.*

**Nyx IV** — « Personne ne me touche. Donc je suis libre. » *(Elle rit, sans joie.)* « J'existe. Je suis là. Je ne suis plus là pour personne. Voilà la réponse, Couplé. Je l'ai trouvée toute seule. C'était exactement la chose à ne pas faire. »

> **Q20** → **réponse trouvée**, version amère. [`carnet.Q20 = repondue`]

#### Le nom (arc F)

*Seulement si `confiance.nyx ≥ +3` et `nom = aucun`.*

**Nyx IV** — « Tu n'as toujours pas de nom. Les chants disent "le Couplé". C'est un nom de chose. »
**Nyx IV** — « Je t'appellerais **Lisière**. Tu vis au bord. Ni dans le gris, ni dans la terre ferme. Là où ça touche. »
[`nom.propositions += nyx`]

Choix :
1. « Lisière. » [`nom = nyx`, `confiance.nyx +1`] → **Nyx IV** : « Bon. Je l'écrirai mal dans la prochaine Chronique. C'est la tradition. »
2. « Garde-le pour plus tard. » [`nom` inchangé] → **Nyx IV** : « Il sera là. Les noms, ça attend bien. »
3. « Je n'en veux pas. » [`nom` inchangé] → **Nyx IV** : « Tant mieux. Moi non plus, je n'en voulais pas, du mien. »

*Si le héros a déjà un nom :* **Nyx IV** — « Tu as un nom. Je ne le dis pas : je le dirais mal. » *(aucun effet)*

### 4. La déchirure (Fin)

*Le centre du Bord se tend. Le gris, qui n'avait ni profondeur ni horizon, prend une profondeur, puis plusieurs. Le sol tremble sans Séisme. Merlin IV (où qu'il soit) crie qu'on s'éloigne ; personne ne l'écoute, il n'y a nulle part où s'éloigner.*

*Le Tissu se déchire. Ce n'est pas un bruit : c'est un silence qui s'ouvre. Pendant quelques secondes, à travers la déchirure, on voit le Bord lui-même, mais **autrement** : d'autres Échos à d'autres places. Un Brutus qui n'est jamais parti, ou qui n'est jamais revenu. Une Nyx qui s'est dispersée à l'Aube. Une Eva qui n'a jamais tiré au hasard. Et le héros, avec un autre visage, un autre corps, qui regarde de l'autre côté.*

**Merlin IV / Néréa IV** — « Ce sont… nous. Ailleurs. Les branches dont parlaient mes confrères. Le gris était trop pauvre pour les tenir séparées. »

*L'énergie qui tenait les corrélations du Tissu se libère d'un coup : une lumière blanche, brûlante, qui part de la déchirure. Le héros a un instant pour choisir.*

Choix (transformation de l'ère IV) :
1. **Rester dans le gris** — *Le héros s'enfonce dans la Lacune, au plus près de la déchirure, là où la lumière ne trouve rien à quoi se heurter.* (si `alliance_nyx` ou `paix_des_lacunes` : *Nyx IV tient sa main ; ils habitent la case à deux.* [`lacunes.habitees +1`]) [`transformation.IV = A`] → **Peau d'ombre**.
2. **Se placer entre la déchirure et les siens** — *Le héros se tient sur la dernière case ferme, face à la lumière, les autres derrière lui. Elle le brûle, et s'arrête sur lui.* [`transformation.IV = B`] → **Cicatrices de lumière**.

*La lumière s'éteint. Le Bord n'a plus de fond. Des fragments de terre de toutes les époques dérivent dans la déchirure : un pilotis des Marées, une tour de verre, une prairie de l'Aube. Le chapitre s'arrête là. (La suite appartient à l'ère V.)*

## Combats

### Combat — La Paix des Lacunes

**Carte :** le Bord, 11 × 11. Au nord, la lèvre de terre ferme (équipe du héros). Au sud-ouest, le gris (cases `x`), où se tiennent les Déliés. À l'est, la roche sombre (`fusion`) ou la proue du Fragment du Chaos (`separation`), d'où vient le troisième camp. Au centre, **l'Œil** (si `lacune_geante_habitee`, un petit îlot de terre ferme en croix, entouré de gris) ou **la Langue** (une avancée de terre ferme venue du nord).

```
.1..2...1..
...........
..1.....2..
....xxx....
...xx.xx..3
xx.x...x.33
xxxxx.xx.3.
xxxxxxxx...
xxxxxxx..2.
xxxxxx...3.
xxxxx....33
```

Légende : `x` cases de Lacune, `.` sol, `1`-`3` hauteurs (la roche sombre à l'est). Au centre (lignes 4 à 7), les cases de sol entourées de gris forment l'Œil. Sans l'Œil, remplacer ces cases par `x` et ouvrir un couloir `.` depuis le nord jusqu'au centre (la Langue).

**Règle de la carte : le Bord grandit.**
- **Tous les 2 tours de timeline**, le Ghom du Chaos éteint **deux cases** de sol adjacentes au gris : elles deviennent `x`. Il choisit les cases qui coupent le plus l'équipe du héros de la lèvre nord. (Une bulle les annonce un tour à l'avance si le héros porte l'Éclat-témoin.)
- Le Séisme d'**ancrage** (Empreinte) empêche ces extinctions sur les cases adjacentes au rocher surgi pendant 3 tours.
- Les Influences des deux Ghoms ne portent pas sur les cases `x` (sauf celle où se tient le héros, pour le Ghom du héros seulement).

**Équipes :**
- **Camp 1 — le héros** (nord) : le héros et au plus quatre Échos (dont le Lacunaire IV s'il a rejoint).
- **Camp 2 — les Déliés** (sud-ouest, dans le gris) : **Nyx IV**, les Échos partis au ch. 21 (avec leur kit habituel), et 2 à 4 **Guetteurs** (selon le nombre de partis, pour un total de 5).
- **Camp 3 — le Ghom du Chaos** (est) :
  - 1 **Lacunaire géant**, 2 **Lacunaires effilocheurs**, 2 **Lacunaires instables** ;
  - **Squalor IV** si `squalor_rejoint` est faux (« Le froid nourrit. C'est tout ce que j'ai trouvé. ») ;
  - **Merlin IV** si `merlin_convaincu` est faux (il est venu mesurer un Ghom de près) ;
  - le **Ghom du Chaos** lui-même : aucune forme, aucune voix. Il agit par l'extinction des cases (ci-dessus) et par une Distorsion tous les 3 tours (sur un Écho du camp 1 ou 2 hors du gris).

**Hostilités au début :**

| | Camp 1 (héros) | Camp 2 (Déliés) | Camp 3 (Chaos) |
| --- | --- | --- | --- |
| **Avec `alliance_nyx`** | — | neutres l'un envers l'autre ; attaquer un Délié **révoque l'alliance** | hostiles à tous |
| **Sans alliance** | — | hostiles | hostiles à tous |

**Objectif principal :** **survivre jusqu'à la déchirure** (tour 10 de la timeline), ou jusqu'à la paix (★). Il n'y a pas de vainqueur prévu.

**Objectifs secondaires :**
- ★ **Arrêter le combat sans vainqueur** : réaliser une **Intrication entre camps**, c'est-à-dire l'action **Habiter** (ci-dessous) par un Écho du camp 1 et un Écho du camp 2 sur une même case `x`. Les camps 1 et 2 cessent aussitôt le combat. [`paix_des_lacunes = vrai`]
- ◆ **La paix à trois** : après la paix, faire entrer le camp 3 dans l'Intrication : soit Squalor IV ou Merlin IV (s'ils sont là) partagent une case habitée, soit le Lacunaire géant est amené (poussé, attiré) sur une case habitée, où il se **fixe** dans une forme stable et cesse d'attaquer. Le Ghom du Chaos cesse alors d'éteindre des cases. [`lacunes.habitees +1`, `ghom_dechu.verite +1`]
- ◆ Aucun Délié dispersé. [`confiance.nyx +1`]
- ◆ Aucune Insistance de tout le combat. [`confiance +1`]

**Conditions de défaite :** le héros se disperse ; ou toutes les cases de la lèvre nord deviennent `x` avant le tour 10 (l'équipe est coupée de la terre ferme).

**L'action Habiter (Intrication entre camps) :**
- **Condition :** deux Échos de camps différents sur la même case `x` ; l'Écho du camp 2 doit **accepter** de partager la case.
- **L'acceptation d'un Délié :** il accepte après un **cessez-le-feu** : un nombre de tours de timeline consécutifs pendant lesquels le camp 1 n'a infligé **aucun dégât** à un Délié.

| Situation | Tours de cessez-le-feu requis |
| --- | --- |
| `alliance_nyx` (non révoquée) | 0 : dès le début |
| `objet_de_nyx = nyx_iv` | 1 |
| Écho parti en paix au ch. 21 (« Va, si tu veux ») | 1 |
| Eva IV prêtée, `carnet.Q22 = repondue` | 1 |
| Cas général | 3 |

- **Effet :** aucun dégât ; la case devient **habitée** (elle reprend un peu de couleur, n'use plus personne) ; les deux Échos ont l'Intrication de leur paire (`comboAction`) disponible jusqu'à la fin du combat. Avec l'Empreinte **Réparation partagée**, une Réparation soigne aussi l'Écho du camp 2 sur cette case.
- **Le héros n'est pas obligatoire**, mais s'il participe, la case habitée reste une case où le Ghom du héros peut agir (exception du héros) : Nyx IV le sait, et accepte quand même si `alliance_nyx`. Sans alliance, elle refuse de partager la case **du héros** : il faut qu'un autre Écho du camp 1 habite avec elle.

**L'Autonomie dans cette bataille :**
- Les Échos **Rompus** (retenus de force au ch. 21) partent sur D1 ou D2 ; ils rejoignent alors le camp 2 en plein combat.
- **Insister** une seule fois **révoque** `alliance_nyx` : les Déliés deviennent hostiles, et le cessez-le-feu requis repasse à 3 tours.
- Toute Influence qui touche un Délié révoque aussi l'alliance.

**Événements scriptés :**
- **Début.** Le froid monte de l'est. **Nyx IV** : « Il arrive. Il ne nous voit pas, il nous éteint. »
- **Tour 2.** Première extinction. **Brutus IV / Gorr** : « Le sol part derrière nous. »
- **Tour 3** *(sans alliance)*. Nyx IV attaque le héros, puis s'arrête à un pas : « Je ne sais même plus contre qui je me bats. »
- **Tour 4.** Le Lacunaire géant entre dans le gris, côté Déliés. **Nyx IV** : « Il va sur Sel ! » *(Sel est sur une case `x` à l'ouest si `confiance.nyx ≥ 0`, figurante neutre. Si le géant finit son tour adjacent à elle, elle est emportée hors de la carte : aucune Dispersion à l'écran, mais `confiance.nyx −2` et `sel_emportee = vrai`.)* C'est le moment naturel pour que les camps 1 et 2 se rapprochent.
- **Tour 6.** Si Merlin IV est dans le camp 3, il cesse d'attaquer pour mesurer : « Je mesure. Je ne prends pas part. » *(un temps)* « … Non. Mesurer, c'est déjà prendre part. Mon ancêtre l'avait compris. Pas moi. » Il devient neutre ; il peut être amené dans une case habitée (◆ paix à trois).
- **Paix (★).** Arrêt du combat entre camps 1 et 2 ; musique coupée. Le camp 3 continue, à moins que la paix à trois ne suive. Les Déliés et l'équipe peuvent alors se battre côte à côte contre le camp 3 jusqu'à la déchirure.
- **Paix à trois (◆).** Le froid recule. Le Ghom du Chaos cesse d'éteindre. Pendant un tour entier, rien ne se passe sur le Bord ; même les Lacunaires s'arrêtent. Puis la déchirure commence, plus tôt (fin du tour en cours).
- **Tour 10.** La déchirure, dans tous les cas. Fin du combat, passage aux nœuds 3 et 4.

**Répliques de combat :**
- **Nyx IV** *(sans alliance, au contact)* — « Personne ne me touche ! »
- **Nyx IV** *(avec alliance, en voyant le héros entrer dans le gris)* — « Tu le ramènes avec toi. Bon. Je l'ai demandé. »
- **Guetteur** *(cessez-le-feu atteint)* — « Ils ne nous frappent plus. Depuis trois battements. »
- **Lyra IV** *(soignant un Délié)* — « Ne me remercie pas. Je paie ailleurs. »
- **Eva IV** *(tir au hasard sur un Lacunaire)* — « Je ne sais pas où. Je sais sur quoi. »
- **Gorr** *(si `gorr_question`, en entrant dans le gris)* — « Gorr est léger ici. Gorr reste quand même avec toi. »
- **Squalor IV** *(camp 3, invité dans une case habitée)* — « … C'est pas de la faim, ça. C'est quoi ? »
- **Partant revenu au combat** *(camp 2, au moment de Habiter avec un ancien allié)* — « Je ne suis pas revenu. Je suis à côté. Ça suffit. »
- **Brutus IV** *(fin, paix faite)* — « Pas de vainqueur. Je ne savais pas qu'on pouvait finir comme ça. »

## Choix et conséquences

| Choix ou objectif | Drapeaux | Effet plus tard |
| --- | --- | --- |
| Q24 : paragraphe VII accepté | `carnet.Q24 = fausse` | Fin secrète compromise. |
| ★ Paix | `paix_des_lacunes = vrai`, `confiance +2`, `lacunes.habitees +1` | Ère V : les Déliés sont alliés ; Nyx IV peut être dans l'équipe ; condition forte de la vraie fin (Intrication). Manifeste, extrait X. |
| ◆ Paix à trois | `lacunes.habitees +1`, `ghom_dechu.verite +1` | Ch. 27 : le Ghom déchu a déjà « senti » une Intrication ; le couplage avec lui est plus accessible. |
| Pas de paix | `paix_des_lacunes = faux` | Ère V : les Déliés et l'équipe sont séparés par la déchirure ; Nyx IV y est seule. |
| Alliance révoquée en combat | `alliance_nyx = faux` | — |
| Retour d'un parti | `retour.<lignée> = vrai` | Il est dans l'équipe en ère V. |
| Q20 répondue (dans les deux versions) | `carnet.Q20 = repondue` | — |
| Nom « Lisière » accepté | `nom = nyx`, `nom.propositions += nyx` | Les Chroniques et les écrans de l'ère V le déforment. |
| Rester dans le gris | `transformation.IV = A` | Peau d'ombre. |
| Se placer devant les siens | `transformation.IV = B` | Cicatrices de lumière. |
| Sel emportée par le Lacunaire géant | `confiance.nyx −2`, `sel_emportee = vrai` | Ère V : un Double de Sel, adulte, dans une branche voisine. |

## Récompenses

- **Transformation (ère IV) :**
  - **A — Peau d'ombre.** *Une peau d'un gris mat, sans reflet, faite au plus près de la déchirure, là où la lumière ne trouvait rien à toucher. Elle renvoie si peu de lumière qu'on la devine plus qu'on ne la voit.* Effet : **furtivité** : le héros ne peut pas être ciblé par une action à distance de plus de 3 cases ; l'effet tombe dès qu'il attaque, jusqu'à son tour suivant.
  - **B — Cicatrices de lumière.** *Des traînées claires sur la peau, là où la lumière de la déchirure s'est arrêtée sur lui au lieu de passer. Elles restent tièdes.* Effet : **protection des alliés** : les alliés adjacents au héros subissent 20 % de dégâts en moins.
- **Habit — Ceinture de trêve** *(si `paix_des_lacunes`)*. *Un fil de lisière tressé avec une corde de l'équipe ; Nyx IV en a fait deux, et en porte un.* Effet : la première fois par combat qu'un Écho ennemi tombe sous 25 % de PV, il peut se rendre au lieu de fuir (si le moteur le permet pour ce type d'ennemi).
- **Habit — L'ardoise rayée** *(si la paix est faite et que `carnet.Q24` est ouverte)*. *Le paragraphe VII, barré mais lisible, que Nyx IV donne au héros.* Effet : aucun en combat ; s'affiche dans le Carnet à côté de Q24.
- **Rejoignent :** le Lacunaire IV (si `confiance.lacunaire ≥ +2`) ; les partis qui reviennent (`retour.<lignée>`) ; avec la paix, Nyx IV peut suivre en ère V.

## Graines pour la suite

- **La déchirure** ouvre l'ère V : le Tissu déchiré, les branches visibles, les Doubles. On a déjà vu, à travers elle, un Brutus, une Nyx, une Eva, un héros d'autres branches.
- **Le Ghom du Chaos est froid**, il a été changé par ses Lacunes (ch. 23) ; s'il y a eu paix à trois, il a « vu » une Intrication de près. Le ch. 27 peut s'en souvenir.
- **Nyx IV et son manifeste** : avec la paix, l'extrait VII est rayé et l'extrait X ajouté. Sans paix, Nyx IV est seule dans une branche.
- **Sel**, sauvée ou emportée : une Sel adulte peut apparaître comme Double en ère V.
- **Q19, Q21, Q24** restent ouvertes si le joueur n'a pas accepté les réponses tentantes : elles comptent pour le Découplage (fin secrète).
- **Gorr garde une question** « pour plus tard » : c'est la dernière du jeu.

## Notes de mise en œuvre

- **Trois camps** (le moteur le permet) avec une **matrice d'hostilité** modifiable en cours de combat (neutre → hostile à la révocation de l'alliance ; hostile → paix entre camps 1 et 2).
- **Action « Habiter »** : nouvelle action contextuelle disponible quand deux Échos de camps différents partagent une case `x` et que l'Écho du camp 2 accepte ; compteur de cessez-le-feu par camp (tours consécutifs sans dégâts infligés).
- **Extinction des cases** par le Ghom du Chaos : deux cases de sol adjacentes au gris tous les 2 tours, avec une heuristique (couper le camp 1 de la lèvre nord).
- **Fixation d'un Lacunaire** sur une case habitée : il passe en état stable et devient neutre.
- **Fin forcée au tour 10** (la déchirure), ou plus tôt après la paix à trois. Écran de bilan spécial : pas de vainqueur.
- **Visuel de la déchirure :** des vues du même Bord avec d'autres Échos (générés via `generateCharacter`, ou les modèles des Doubles de l'ère V). C'est une **lecture** par recohérence, pas un voyage : rien ne traverse.
- **Transformation :** choix au nœud 4, appliqué au corps du héros (créateur de personnage).
- **Drapeaux nouveaux :** `retour.<lignée>` (booléen). Le registre prévoit déjà `paix_des_lacunes`, `alliance_nyx`, `transformation.IV`.
