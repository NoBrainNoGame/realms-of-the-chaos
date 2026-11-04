# Chapitre 21 — La Rupture

> *« Ce qui se défait chez nous, au moins, ce n'est pas vous qui le défaites. »*
> — Manifeste de Nyx IV, VI

## Fiche

| | |
| --- | --- |
| Ère | IV — Le Schisme des Échos |
| Lieu | **Le Bord**, la Lacune immense au sud de l'île ; la lèvre de terre ferme qui la borde |
| Équipe | L'équipe du ch. 20. **Selon la Confiance, une partie rejoint Nyx IV** pendant le chapitre. |
| Durée visée | 4 nœuds, 1 combat |
| Question au Carnet | **Q21** — *A-t-on le droit de retenir ce qu'on a aidé à exister ?* (ouverte) |

## Ce que le joueur sait en arrivant

Le héros a vu la vie des Déliés : libre, sans Ghom, et lentement défaite. Il a entendu Nyx IV répondre à la première question du Carnet, et poser la sienne. Elle a annoncé qu'au Bord, elle appellerait les Échos qui le suivent, et qu'il n'aurait rien à dire. Le joueur connaît l'Autonomie, les paliers, les refus. Il sait, ou devine, que certains de ses alliés sont Méfiants.

## Synopsis

Au bord du Bord, Nyx IV appelle les héritiers. Chacun choisit, selon ce que le Ghom a été pour sa lignée. Ceux qui ont confiance restent ; ceux qui ne l'ont plus partent ; certains hésitent, et le héros a une phrase, une seule, pour chacun d'eux. Puis ceux qui partent marchent vers le gris, et les autres doivent décider s'ils les retiennent. Le combat oppose le héros à ses propres Échos : l'objectif ★ est de **perdre**, de les laisser passer. On peut les retenir de force : ils restent, mais rompus. Si personne ne part, Nyx IV vient tenter chacun en personne, et le combat devient une épreuve : ne retenir personne qui reste de lui-même. À la veillée, réduite ou intacte, Brutus IV, s'il est resté, offre au héros une réponse rassurante et fausse.

## Carte du chapitre

```
[1 Rencontre : L'appel] → [2 Rencontre : Ceux qui hésitent] → [3 Combat : La lèvre du Bord]
                                                                    ↓
                                                         [4 Veillée : Ceux qui restent] (Fin)
```

Le combat a **deux variantes** selon le résultat des nœuds 1-2 : **La Rupture** (au moins un départ) ou **L'épreuve** (aucun départ).

## Qui part : la règle

Au début du chapitre, on calcule pour chaque allié sa **Confiance effective** (README de l'ère) et on applique ce tableau :

| Écho | Part d'office si… | Hésite si… | Reste d'office si… |
| --- | --- | --- | --- |
| **Brutus IV**, **Lyra IV** | ≤ −2 | −1 ou 0 | ≥ +1 |
| **Eva IV**, **Néréa IV** (déjà liées aux Déliés) | ≤ −1 | 0 ou +1 | ≥ +2 |
| **Squalor IV** (loyal à sa façon) | ≤ −3 | −2 ou −1 | ≥ 0 |
| **Gorr**, si `gorr_question` | ≤ −2 | −1 ou 0 | ≥ +1 |
| **Gorr**, si `gorr_question` est faux | jamais | jamais | **toujours** |

**Modificateurs :**
- L'**Écho libre** du ch. 19, si l'objectif ★ y a été réussi : son seuil de départ d'office baisse d'un cran (il faut −3 au lieu de −2).
- `objet_de_nyx = nyx_iv` (rendu au ch. 20) : aucun effet sur les départs ; Nyx IV appelle plus doucement.
- `autonomie.insistances ≥ 3` : chaque Écho qui « hésite » part d'office.
- Néréa IV, si `nerea_retrouvee` est faux : elle est déjà chez les Déliés ; elle compte comme partie, sans combat.

## Scènes

### 1. L'appel (Rencontre)

*Le Bord. Une lèvre de terre ferme, une herbe rase, et au-delà, le gris, à perte de vue. Pas de brume, pas d'horizon : la vue s'arrête comme un mot qu'on ne finit pas. Des câbles partent de la lèvre et se perdent dedans. Les Déliés sont assis sur la lèvre, des dizaines. Nyx IV est debout, dos au vide.*

*(si `fragments = fusion`)* *Sous les pieds, la ligne de soudure de l'ère I : roche sombre d'un côté, terre claire de l'autre. Le Bord s'est ouvert le long de cette ligne.*
*(si `lacune_geante_habitee`)* *Loin dans le gris, une tache de couleur : l'Œil, la couronne de terre ferme où deux lignées ont vécu ensemble pendant des siècles.*

**Nyx IV** — « Je ne parle pas au Couplé. Il n'a rien à dire aujourd'hui. Je parle à ceux qui marchent avec lui. »
**Nyx IV** — « Vos lignées ont porté le même nom pendant des siècles. Chaque fois que l'Archipel a tourné, une Lyra, un Brutus, une Eva étaient là, à côté de lui. Les Thermistes ont mesuré pourquoi. Ce n'était pas le hasard. »
**Nyx IV** — « Je ne vous dis pas qu'il vous veut du mal. Je vous dis qu'on ne sait pas ce que vous seriez devenus sans lui. Et que là-dedans *(elle montre le gris)*, vous pourriez le découvrir. »
**Nyx IV** — « Venez, ou restez. Mais choisissez vous-mêmes. Pour une fois. »

*(Variante C du ch. 20, Nyx I dispersée)* **Nyx IV** ajoute : « Ma première s'est dispersée à côté de lui. Faites-en ce que vous voulez. »
*(si `objet_de_nyx = nyx_iv`)* *Elle tient la Lame à une encoche de la première Nyx serrée dans la main, et ne dit rien de plus dur.*

*Alors, un par un, les Échos se lèvent. L'ordre est fixe : ceux qui partent d'office, puis ceux qui restent d'office, puis ceux qui hésitent (nœud 2).*

**Répliques de départ (part d'office) :**
- **Brutus IV** — « Je garde ce qui est fragile. Eux sont fragiles. Toi, tu as un Ghom. »
- **Lyra IV** — « Je vais là où soigner coûte le plus cher. C'est là qu'on a besoin de moi. Ce n'est pas contre toi. »
- **Eva IV** — « Là-bas, rien ne dévie mes flèches. Ni le vent, ni le sol, ni ton Ghom. »
- **Néréa IV** — « La dernière couche du lac est lue. J'en veux une qui ne soit écrite par personne. »
- **Gorr** — « Gorr veut savoir ce que Gorr fait quand personne ne pousse Gorr. Gorr ne sait pas. C'est pour ça. »
- **Squalor IV** — « J'ai faim d'autre chose. Je sais pas quoi. Je vais renifler là-bas. »

**Répliques de maintien (reste d'office) :**
- **Brutus IV** — « Je reste. Personne ne me l'a ordonné. Note-le, Nyx. »
- **Lyra IV** — « Je reste. Je descendrai quand même soigner chez vous. Ça ne change rien à ça. »
- **Eva IV** — « Je reste. J'ai calculé. Non : je n'ai pas calculé. Je reste. »
- **Néréa IV** — « Je reste. Quelqu'un doit lire ce qu'il dépose, lui aussi. »
- **Gorr** *(si `gorr_question`)* — « Gorr reste. Gorr choisit. Gorr aime ce mot. »
- **Gorr** *(si `gorr_question` est faux)* — *(il ne bouge pas.)* **Nyx IV** : « Il ne partira pas. Il ne sait pas qu'il peut. C'est pire que tout le reste. »
- **Squalor IV** — « Je reste. Ici on mange mieux. Et sa lignée a laissé manger la mienne, un jour. Ça se rend. »

### 2. Ceux qui hésitent (Rencontre)

*Pour chaque Écho qui hésite, la caméra se rapproche. Il regarde le gris, puis le héros. Le héros a **une** réplique.*

Choix (pour chaque Écho qui hésite) :
1. « Reste. » *(retenir)* → l'Écho reste. [`confiance.<lignée> −1`] Il dit : « … D'accord. Puisque tu le demandes. » *(Son palier en combat baisse d'un cran ; il s'en souviendra.)*
2. « Va, si tu veux. » → l'Écho part, en paix. [`confiance.<lignée> +2`, `trahison.<lignée> = vrai`] Il dit : « Merci de ne pas avoir décidé pour moi. » *(Ces départs-là ne combattent pas : ils passent directement de l'autre côté.)*
3. *(Silence.)* → l'Écho décide seul : il **reste** si `confiance ≥ 0`, il **part** sinon. Pas d'effet de Confiance. [`trahison.<lignée> = vrai` s'il part]
4. « Qu'est-ce que tu veux, toi ? » [`confiance.<lignée> +1`] → l'Écho répond (réplique de lignée ci-dessous), puis décide comme pour le silence, avec la Confiance générale comptée **+2**.

**Réponses à « Qu'est-ce que tu veux, toi ? » :**
- **Brutus IV** — « Protéger quelque chose qui bouge encore. Je ne sais pas si c'est toi ou eux. »
- **Lyra IV** — « Savoir où dépenser ce que j'ai. Je n'ai pas assez pour les deux côtés. »
- **Eva IV** — « Une cible. Une vraie. Pas un angle qu'on m'a préparé. »
- **Néréa IV** — « Une couche que je n'aurai pas déjà lue. »
- **Gorr** — « Gorr veut une deuxième question. La première est vieille. »
- **Squalor IV** — « Bouffer. Et autre chose. L'autre chose, je sais pas. »

### 4. Ceux qui restent (Veillée, fin du chapitre)

*Le soir, sur la lèvre. De l'autre côté, dans le gris, de petites lueurs : les feux des Déliés, sans reflet. Le feu du héros paraît trop vif.*

**Si l'équipe est réduite :**
*La place vide de chacun de ceux qui sont partis reste marquée autour du feu : un sac, un registre, une écaille. Le héros peut s'asseoir à leur place.*

**Si un Écho a été retenu de force (voir le combat) :**
*Il est assis à l'écart, le dos au feu. Il ne répond pas. Il est **Rompu** pour le reste de l'ère.*

**Brutus IV** *(s'il est resté, et seulement s'il est resté)* — « Ne les pleure pas. Tu les as portés pendant des siècles. Ce que tu as fait naître t'appartient. Ils reviendront. »

*Le Carnet s'ouvre.*

> **Q21** — *A-t-on le droit de retenir ce qu'on a aidé à exister ?*

Choix (sur Q21) :
1. « Ce que j'ai fait naître m'appartient. » *(accepter la réponse de Brutus IV)* [`carnet.Q21 = fausse`] → **Brutus IV** : « Voilà. Un mur, ça garde ce qui est à soi. »
2. « Ils n'étaient pas à moi. Ils étaient avec moi. » [`carnet.Q21 = ouverte`, `confiance +1`] → **Brutus IV**, *longtemps après* : « … Avec. Oui. Un mur ne connaît pas ce mot. J'aimerais le connaître. »
3. « Je ne sais pas. » [`carnet.Q21 = ouverte`]

*Si Brutus IV est parti, personne n'offre la réponse tentante. Q21 s'inscrit seule, et reste ouverte.*

*Écoutes de veillée (`confiance.<lignée> +1` chacune) :*
- **Lyra IV** *(si restée)* : « J'ai soigné une Délié ce matin, avant l'appel. Elle m'a demandé si je partais. J'ai dit que je ne savais pas. Je ne savais pas. Je sais maintenant. Ça ne me rend pas plus sûre d'avoir raison. »
- **Eva IV** *(si restée)* : « Demain, ils me demanderont de tirer dans le gris. Il y a des choses là-dedans qui ne sont pas encore à un endroit. Je n'ai jamais tiré sur quelque chose qui n'est pas à un endroit. » *(annonce le ch. 22)*
- **Gorr** *(si `gorr_question`, resté)* : « Gorr a choisi. Gorr a eu peur, avant. Gorr ne savait pas que Gorr pouvait avoir peur. »
- **Gorr** *(si `gorr_question` est faux)* : *(il fixe le gris toute la nuit, sans bouger. Au matin, une petite fissure lumineuse court sur son flanc, qui n'y était pas. Elle prépare sa question du ch. 23.)*

## Combats

### Combat — La lèvre du Bord (variante « La Rupture », au moins un départ qui combat)

> Les Échos partis **en paix** (choix « Va ») ne combattent pas. Seuls combattent ceux qui partent d'office, ou en silence. S'ils sont tous partis en paix, on passe directement à la variante « L'épreuve ».

**Carte :** la lèvre du Bord, 9 × 9. Au nord, terre ferme et quelques rochers ; au centre, une bande de terre qui s'amincit ; au sud, deux rangées de cases de Lacune, puis le bord de la carte (le gris).

```
.1..2..1.
.........
..1...1..
....~....
.x.....x.
..x...x..
.xx.1.xx.
xxxxxxxxx
xxxxxxxxx
```

**Équipes :**
- **Le héros et ceux qui restent** (au nord).
- **Ceux qui partent** (équipe 2, au centre) : ils veulent atteindre la dernière rangée (ligne 9). Ils **n'attaquent que s'ils sont bloqués** (un adversaire sur leur chemin, adjacent).
- **Nyx IV et deux Guetteurs** (équipe 2, au sud, sur les cases de Lacune) : ils couvrent la retraite. Ils n'attaquent que ceux qui attaquent un partant.

**Objectif principal (narratif) :** le combat se termine quand tous les partants ont **franchi** la ligne 9, ou ont été **retenus** (ramenés sous 25 % de PV : ils s'agenouillent et cessent d'avancer). Il n'y a pas de défaite, sauf si le héros se disperse.

**Objectifs secondaires :**
- ★ **Laisser partir** : tous les partants franchissent la ligne 9.
- ◆ Aucune Influence sur un partant (et donc aucune case de Lacune « ramenée » par le héros sous leurs pieds). 
- ◆ Le héros se tient sur la ligne 7 au moment où le dernier partant passe : il accompagne sans retenir. [`confiance.nyx +1`]

**Événements scriptés :**
- **Tour 1.** Les partants avancent. Chacun dit une réplique en passant près du héros (« Ne me retiens pas. »).
- **Premier ordre donné à un allié qui vise un partant :** refus systématique (R1, même lignée ou non : « C'était l'un des nôtres hier. »). On peut Insister.
- **Si le héros entre dans une case de Lacune où se tient un partant :** la case redevient normale ; le Ghom peut agir sur le partant. **Nyx IV** : « Tu vois ? Tu le ramènes avec toi. Même ici. » Le partant s'arrête, se retourne, et attend : le joueur doit choisir de s'écarter (il repart) ou d'agir sur lui (Insister ou Influence : il est retenu, voir plus bas).
- **Un partant retenu** (sous 25 % de PV, ou par Influence/Insistance sur une case ramenée) : il s'agenouille. Il reste dans l'équipe du héros, mais `confiance.<lignée> = −5` (Rompu) et `trahison.<lignée>` reste faux. **Nyx IV** : « Garde-le. Tu l'as. C'est tout ce que tu auras. »
- **Un partant dispersé :** silence total. Les Déliés se lèvent tous. [`confiance −3`, `confiance.nyx −2`] **Nyx IV** : « … Voilà ce qu'on deviendrait, avec toi. »
- **Le dernier partant franchit la ligne :** il se retourne une fois. Le gris le prend sans bruit.

**Répliques de combat :**
- **Partant** (au contact, bloqué) — « Pousse-toi. S'il te plaît. »
- **Brutus IV** (resté, à qui l'on ordonne de bloquer) — « Je garde. Je ne retiens pas. Ce n'est pas pareil. »
- **Nyx IV** — « Personne ne les touche. C'est tout ce qu'ils demandent. »
- **Fin (★)** — **Nyx IV** : « Tu les as laissés partir. Je ne pensais pas que tu saurais. »

### Combat — La lèvre du Bord (variante « L'épreuve », aucun départ qui combat)

**Carte :** la même.

**Équipes :**
- **Le héros et toute l'équipe** (au nord).
- **Nyx IV et quatre Guetteurs** (au sud). Ils ne cherchent pas à blesser : chaque Guetteur tente de rejoindre un allié **désigné** et de finir son tour **adjacent** à lui. Nyx IV va vers le héros.

**Règle :** quand un Guetteur finit son tour adjacent à son allié désigné, une **proposition** s'affiche (« Viens. ») ; l'allié répond seul, selon son palier. Il refuse toujours (il est resté d'office) ; mais **si le joueur a Insisté ou utilisé une Influence sur lui pendant ce combat**, il hésite, puis part (équipe 2, sortie par le sud).

**Objectif principal :** tenir jusqu'au tour 6 de la timeline.

**Objectifs secondaires :**
- ★ **Ne retenir personne** : aucune Insistance, aucune Influence sur un allié, et utiliser au moins une fois « Laisser agir » pour **chaque** allié.
- ◆ Aucun Guetteur dispersé. [`confiance.nyx +1`]

**Fin :** **Nyx IV** — « Ils sont restés. Sans que tu les tiennes. Je ne pensais pas que c'était possible. Je ne sais pas encore si ça me plaît. »

## Choix et conséquences

| Choix ou objectif | Drapeaux | Effet plus tard |
| --- | --- | --- |
| Départ (d'office, silence ou « Va ») | `trahison.<lignée> = vrai` | L'Écho est chez les Déliés aux ch. 22-24 ; il peut revenir au ch. 24 (paix) ou en ère V. |
| « Va, si tu veux » | `confiance.<lignée> +2` | Au ch. 24, cet Écho accepte l'Intrication entre camps (Habiter) après un seul tour de cessez-le-feu, et revient dans l'équipe si la paix est faite. |
| « Reste » | `confiance.<lignée> −1` | Palier plus bas pour l'ère. |
| ★ Laisser partir (Rupture) / Ne retenir personne (Épreuve) | `rupture.respectee = vrai`, `confiance +2` | Condition de l'alliance au ch. 23 ; `alliance_nyx` plus facile. |
| Partant retenu de force | `confiance.<lignée> = −5` | Rompu jusqu'à la fin de l'ère ; part en plein combat au ch. 24 sur D1 ou D2. |
| Partant dispersé | `confiance −3`, `confiance.nyx −2` | `alliance_nyx` impossible ; Chronique de l'ère V très dure. |
| Q21 : réponse de Brutus IV acceptée | `carnet.Q21 = fausse` | Fin secrète compromise. |
| Q21 : « avec moi » | `carnet.Q21 = ouverte`, `confiance +1` | — |

## Récompenses

- **Habit — Le manteau laissé** *(si au moins un Écho est parti)*. *Ce qu'un compagnon a laissé au bord du gris en partant : un sac, une cape, une écaille, selon sa lignée.* Effet : +1 défense physique ; et l'Intrication avec cet Écho, s'il revient, compte comme Intrication « renforcée » (cf. Mains de verre).
- **Habit — Agrafe de ceux qui restent** *(si personne n'est parti)*. *Une agrafe de bois que Lyra IV taille pour chacun, sans motif particulier.* Effet : en ère IV, le premier refus de chaque allié par combat ne compte pas comme un refus de la liste R (il obéit), **sans** perte de Confiance.
- **Rejoignent :** personne. **Partent :** selon la règle.

## Graines pour la suite

- **Les partis** sont chez les Déliés : on les retrouve au ch. 22 (Eva, si elle est partie, en invitée), au ch. 23 (ils assistent à la Salle des Défauts) et au ch. 24 (dans le camp de Nyx).
- **Les retenus** sont Rompus : au ch. 24, ils peuvent partir en plein combat, ce qui ferme la paix si c'est mal géré.
- **La fissure lumineuse de Gorr** (si `gorr_question` est faux) : la première question arrive au ch. 23.
- **Q21** reste ouverte : l'ère V (le Ghom déchu, qui a lâché son Fragment) en est l'écho inversé.

## Notes de mise en œuvre

- **Calcul des départs** au chargement du chapitre, avec les modificateurs ; affichage d'une scène par Écho.
- **Équipes changeantes :** un Écho peut changer d'équipe entre deux nœuds (équipe 2 = Déliés), et en plein combat (retenu → équipe 1, Rompu ; parti → sortie).
- **IA « partant » :** cherche à atteindre une ligne d'arrivée, n'attaque que si bloqué. **IA « proposition »** (variante Épreuve) : finir adjacent à une cible désignée.
- **Fin narrative indépendante du vainqueur** (objectif de type « Perdre » du plan) : pas d'écran de défaite ; le bilan montre qui est parti, qui est resté, qui a été retenu.
- **Cases ramenées** : la case de Lacune occupée par le héros redevient normale ; si un partant y est, il redevient ciblable par les Influences.
- **Drapeau nouveau :** `rupture.respectee` (booléen). Le registre prévoit `trahison.<lignée>` comme booléen par lignée ; on garde ce type.
