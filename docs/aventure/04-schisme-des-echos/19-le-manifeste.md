# Chapitre 19 — Le Manifeste

> *« Le Couplé dort encore au fond du Puits. Il en sortira. Quand il sortira, souvenez-vous qu'il n'est pas méchant. Il est pire : il est utile. »*
> — Chronique de la Frange

## Fiche

| | |
| --- | --- |
| Ère | IV — Le Schisme des Échos |
| Lieu | L'île natale, devenue **la Frange** : le Puits, puis **le Village vide** (l'ancien Village immobile) |
| Équipe | Le héros ; **Gorr** (au Puits) ; **Brutus IV** et **Lyra IV** (rejoignent pendant le combat) |
| Durée visée | 5 nœuds, 1 combat |
| Question au Carnet | **Q19** — *Est-ce que je choisis, ou est-ce qu'on choisit pour moi ?* (ouverte) |

## Ce que le joueur sait en arrivant

Le héros est entré dans le Puits à la fin de l'Âge du Verre, au milieu d'une cité qui se fendait. Pour lui, quelques heures ont passé. Il porte sa transformation de l'ère III (**Veines de cristal** ou **Mains de verre**), celles des ères précédentes, et un Carnet plein de questions. Il se souvient de Gorr, qui venait de rejoindre l'équipe (ou de Gorr, la pierre qui obéissait, si `gorr_question` est faux).

Le joueur ne sait pas encore :
- que trois ou quatre siècles ont passé ;
- que l'île où il ressort est son île natale ;
- que les Échos ont compris le rôle des Ghoms, et qu'il est devenu, dans leurs chants, le traître.

## Synopsis

Le héros sort du Puits sur une île qu'il ne reconnaît pas d'abord : son île natale, trouée de Lacunes, enjambée de câbles et de villages suspendus. Gorr l'attend sur la margelle depuis trois siècles. Sur les poteaux du chemin, des ardoises gravées : le manifeste de Nyx IV, adressé aux Ghoms. Au Village vide, les **Déliés** tendent une embuscade : ils veulent emmener le Couplé dans une Lacune, là où son Ghom ne pourra plus rien. Brutus IV, gardien d'un village sans habitants, et Lyra IV, soigneuse des deux camps, prennent sa défense. Mais l'un d'eux n'obéit plus vraiment. Le combat introduit l'Autonomie : l'objectif ★ est de ne donner **aucun ordre** à cet Écho. À la veillée, un vieux Délié capturé pose la question de l'ère : *est-ce que je choisis, ou est-ce qu'on choisit pour moi ?* Une flèche apporte l'invitation de Nyx IV.

## Carte du chapitre

```
[1 Scène : La margelle] → [2 Rencontre : Les ardoises] → [3 Combat : Les Guetteurs]
                                                              ↓
                              [5 Fin : La flèche d'Haut-Pendant] ← [4 Veillée : Le Village vide]
```

Pas d'embranchement de parcours. Les embranchements sont dans les répliques et dans la composition de l'équipe (selon la Confiance).

## Scènes

### 1. La margelle (Scène)

*Le Puits s'ouvre sur un ciel bas. Le héros remonte la paroi de roche dense ; la margelle est couverte d'un lichen gris-bleu qu'il n'a jamais vu. Le vent porte une odeur de pluie froide. Au bord du Puits, une masse de cristal couverte de mousse : on la prend pour un rocher. Elle bouge.*

**Gorr** *(si `gorr_question`)* — « Tu sors. Gorr attend. »
**Gorr** — « Gorr compte les pluies. Trois cents… non. Plus. Gorr ne sait plus compter si loin. »
**Gorr** — « Gorr a grandi. Tu n'as pas grandi. »

*(si `gorr_question` est faux)*
*Gorr se lève. Il ne dit rien. Il se place derrière le héros, à deux pas exactement, comme on le lui a appris dans les mines de Vitrelle. Il attend un ordre.*

*Le héros s'avance vers le bord de la margelle. En bas, la prairie de l'Aube : il la reconnaît à la forme des collines. Mais la prairie est trouée de taches grises, sans reflet, sans ombre, comme si on avait gratté l'image. Au-dessus des taches, des câbles, des passerelles, des maisons pendues.*

*(si `transformation.I = A`, Yeux d'Aube)* *Le héros voit au fond des taches grises ce que les autres ne voient pas : du mouvement, très lent. Des gens.*

Choix :
1. « Combien de temps ? » → **Gorr** : « Long. Les arbres sont morts et revenus. Deux fois. » *(si `gorr_question` est faux, Gorr reste muet ; le héros le lit dans les anneaux d'un tronc couché.)*
2. « Tu m'as attendu ? » [`confiance.gorr +1`] → **Gorr** : « Gorr attend. C'est ce que Gorr fait le mieux. Mieux que les pierres. Les pierres n'attendent rien. »
3. « Viens. » *(un ordre)* → Gorr suit. *(Aucun effet. Mais si `gorr_question` est faux, le journal note discrètement : « Gorr obéit. » Ce détail reviendra au ch. 20.)*

### 2. Les ardoises (Rencontre)

*Le chemin descend vers le Village vide. Tous les vingt pas, un poteau ; sur chaque poteau, une plaque d'ardoise gravée à la pointe. Le héros s'arrête devant la première.*

*Le texte affiché est l'extrait I du manifeste, puis l'extrait III (voir le README de l'ère). En bas de chaque plaque, une signature : un cercle ouvert, la marque des Ombres.*

*Plus loin, une ardoise plus récente, grattée par-dessus une autre. On y lit :*

> *« Quand le Couplé sortira, ne le touchez pas. Emmenez-le au gris. Là, son Ghom glissera sur lui comme sur nous. »*

**Gorr** *(si `gorr_question`)* — « Le Couplé. C'est toi. Gorr a entendu le mot. Gorr n'a pas aimé le mot. »

Choix :
1. Lire toutes les ardoises. *(On découvre les extraits II et IV ; `confiance.nyx +1` : quelqu'un a pris la peine de lire.)*
2. Arracher l'ardoise de l'embuscade et l'emporter. *(Elle sert de preuve à la veillée ; aucun effet de Confiance.)*
3. Passer sans lire. *(`confiance.nyx −1` ; Nyx IV le saura : « Tu n'as même pas lu. »)*

### 4. Le Village vide (Veillée)

*Les murs du Village immobile sont toujours debout. Les toits sont tombés. Les jardins, qu'on ne plantait plus à l'ère I, sont devenus une forêt. Au centre, un feu ; Brutus IV l'entretient. Il l'entretient chaque soir, pour personne, depuis vingt ans.*

*Le Délié capturé pendant le combat, Tarn, est assis contre un mur, les mains libres. Brutus IV n'attache personne : « Où irait-il ? Le gris est partout. »*

**Brutus IV** — « Ma lignée garde ce village. Le village est vide. Je le garde quand même. »
**Brutus IV** — « Ils sont partis là-dessous. Les arrière-petits-enfants de ceux qui ne voulaient rien changer. Ils vivent maintenant là où rien ne bouge. Ils disent que c'est l'inverse de ce que voulaient leurs ancêtres. Moi, je trouve que c'est pareil. »

**Lyra IV** — « Je soigne les deux côtés. Là-dessous, on ne guérit pas bien. Il n'y a pas assez de choses qui se passent pour qu'une plaie se referme. Ce que je répare ici, je le paie ailleurs, comme toutes les Lyra. Là-bas, je paie plus cher. »
**Lyra IV** — « Ils disent que tu es la main du Ghom. Je ne sais pas ce que tu es. Tu as des cicatrices. Les mains ne cicatrisent pas. »

**Tarn** — « J'ai été Thermiste. J'ai mesuré, avant de partir. Tu veux savoir ce que j'ai mesuré ? Que chaque fois que tu as fait un pas, quelque chose avait déjà décidé que tu le ferais. »
**Tarn** — « Tout est écrit d'avance, petit. Ton Ghom l'écrit. Nous, nous avons seulement choisi d'aller vivre dans la marge. Et encore. Peut-être que c'était écrit aussi. »

*Le héros ouvre son Carnet. Une page s'ajoute.*

> **Q19** — *Est-ce que je choisis, ou est-ce qu'on choisit pour moi ?*

Choix (sur Q19) :
1. « Alors rien de ce que je fais n'est à moi. » *(Accepter la réponse de Tarn.)* [`carnet.Q19 = fausse`] → **Tarn** : « Voilà. C'est reposant, tu verras. »
2. « Tu as mesuré qu'on m'a poussé. Tu n'as pas mesuré que tout est écrit. » [`carnet.Q19 = ouverte`, `confiance.merlin +1`] → **Tarn**, après un silence : « … Non. C'est vrai. Ça, je l'ai ajouté. »
3. « Je ne sais pas. » [`carnet.Q19 = ouverte`] → **Lyra IV** : « C'est la première chose vraie qu'on dit ici ce soir. »

*Écoutes de veillée (un seul choix par Écho, chacun donne `confiance.<lignée> +1`) :*
- **Écouter Brutus IV** sur son village. → **Brutus IV** : « Un mur, ça protège. Un mur autour de rien, ça protège rien. Je le sais. Je reste quand même. C'est peut-être ça, être un mur. » [`confiance.brutus +1`]
- **Écouter Lyra IV** sur les Déliés. → **Lyra IV** : « Il y a une petite, Sel. Née là-dessous. Elle a oublié le mot "chaud". Je le lui répète à chaque visite. » [`confiance.lyra +1`]
- **Rester près de Gorr** *(si `gorr_question`)*. → **Gorr** : « Gorr a vu partir les gens du village. Gorr n'a pas demandé pourquoi. Gorr demande maintenant : pourquoi ? » [`confiance.gorr +1`]

### 5. La flèche d'Haut-Pendant (Fin)

*À l'aube, une flèche se plante dans le linteau, à un doigt de la tête du héros. Pas un tremblement. Une ardoise mince y est liée.*

**Brutus IV** — « Une Archère. À trois cents pas, de nuit, dans le vent. Il n'en reste qu'une capable de ça. »

> *« Tu es sorti. Tu as couru. Tu t'es battu. Ceux qui t'entourent t'ont aidé, ou pas, selon ce qu'ils pensent de toi. Viens voir comment on vit sans toi. Seul, ou avec qui voudra te suivre. Personne ne te touchera. — N. »*

Choix :
1. « J'y vais. » [`confiance.nyx +1`]
2. « On y va ensemble. » *(Gorr, Brutus IV et Lyra IV suivent ; chacun avec son palier.)* [aucun effet]
3. « Je n'ai pas à répondre à des ardoises. » [`confiance.nyx −1`] → Le chapitre 20 commence quand même : **Lyra IV** : « Elle a dit "viens". Chez les Déliés, ça veut dire "on ne te fera pas venir". C'est une politesse. Accepte-la. »

## Combats

### Combat — Les Guetteurs

**Carte :** le Village vide, 9 × 9. Murs effondrés (hauteurs 1 et 2), une place centrale, et au sud-est une tache de Lacune de cinq cases, enjambée par un câble. Les Guetteurs veulent pousser ou attirer le héros dans la Lacune.

```
..12.1...
.1....2..
.2..~..1.
....~....
.1.....1.
..2...xx.
.....xxx.
1....x...
..1......
```

Légende : `.` sol, `1`-`2` hauteurs, `~` eau peu profonde (l'ancienne fontaine), **`x` case de Lacune** (extension de légende, voir README de l'ère).

**Équipes :**
- **Alliés :** le héros (centre-nord), Gorr (à côté du héros). Au tour 2 de la timeline, **Brutus IV** entre par l'ouest ; au tour 3, **Lyra IV** par le nord.
- **Déliés (ennemis) :**
  - 3 **Guetteurs** (kit de Nyx : Lame furtive, Bond ; vitesse élevée, PV bas) ;
  - 1 **Frondeur** (kit d'Eva sans Flèche empoisonnée : une fronde, portée 2-5) ;
  - **Tarn** (kit de Merlin réduit : Givre seul, PV bas). Il ne s'approche pas.
- Les Déliés **fuient sous 30 % de PV** (ils sautent dans la Lacune et disparaissent). Ils ne se dispersent jamais volontairement.

**L'Écho libre :** au début du combat, le jeu désigne **l'Écho libre** : l'allié qui a la Confiance effective la plus basse parmi Brutus IV et Lyra IV (à égalité : Brutus IV). Un liseré gris l'entoure, et l'objectif ★ s'affiche avec son nom dès son entrée en jeu.

**Objectif principal :** faire fuir ou vaincre les Déliés, **sans que le héros finisse un tour sur une case de Lacune**.

**Objectifs secondaires :**
- ★ **Laisser libre** : ne donner **aucun ordre** à l'Écho libre pendant tout le combat. Toutes ses décisions passent par « Laisser agir », ou par son IA s'il est Méfiant ou Rompu.
- ◆ Aucun Délié dispersé. [`confiance.nyx +1`]
- ◆ Ne pas utiliser d'Influence sur un allié.

**Conditions de défaite :** le héros se disperse ; ou le héros commence **deux** tours de suite sur une case de Lacune (les Guetteurs l'emmènent : écran de défaite « Le Couplé a été délié », on recommence le combat).

**Événements scriptés :**
- **Tour 1.** Les Guetteurs encerclent le héros et le poussent vers la Lacune avec Bond. Le premier qui atteint le héros dit sa réplique.
- **Tour 2.** Brutus IV entre. **Didacticiel de l'Autonomie** : une bulle montre son palier (Lié, Confiant, Réservé, Méfiant, Rompu), puis les commandes « Laisser agir » et, au premier refus, « Respecter » ou « Insister ».
- **Tour 3.** Lyra IV entre.
- **Premier ordre de la liste R** donné à un allié (le plus souvent R1, attaquer un Délié) : si l'allié refuse, pause et explication du refus ; sinon, aucun événement.
- **Si le héros entre dans une case de Lacune :** l'écran se désature, la jauge d'Élan grise : « *Ici, rien ne te tient.* » Puis la case redevient normale autour de lui : *le gris recule d'une demi-case, comme une eau qui s'écarte.* **Tarn**, à voix basse : « Tu as vu ? Il le ramène avec lui. » (C'est la première démonstration de l'exception du héros.)
- **Quand un Délié tombe sous 30 % de PV :** il fuit. S'il ne peut pas atteindre la Lacune (bloqué), il se rend : il pose son arme et sort de la carte.
- **Fin.** Tarn reste en arrière quand les autres fuient. Il s'assoit. « Je suis trop vieux pour le gris. »

**Répliques de combat :**
- **Guetteur** *(tour 1)* — « On ne te veut pas de mal. On veut juste que plus personne ne te tienne. »
- **Brutus IV** *(entrée)* — « Pas sur mon village. »
- **Lyra IV** *(entrée)* — « Arrêtez. Je vous ai soignés la semaine dernière. Tous. »
- **Brutus IV** *(refus R1)* — « Non. C'est le fils d'une femme que j'ai portée hors du gris. »
- **Lyra IV** *(refus R4-lyra)* — « Pas tant qu'il saigne. »
- **Brutus IV** *(Méfiant, agit seul)* — « Je fais à ma façon. »
- **Gorr** *(si `gorr_question` est faux, à chaque ordre)* — *(il exécute, sans un son ; le journal écrit : « Gorr obéit. »)*
- **Tarn** *(si l'on Insiste)* — « Voilà. Regarde-le faire. C'est ça, ton Ghom. »
- **Guetteur** *(en fuyant)* — « Garde-le, ton Ghom. Nous, on a le gris. »

## Choix et conséquences

| Choix ou objectif | Drapeaux | Effet plus tard |
| --- | --- | --- |
| ★ Laisser libre réussi | `confiance.<lignée de l'Écho libre> +2` | Ch. 21 : cet Écho reste, sauf Confiance effective ≤ −3. |
| ★ raté | `confiance.<lignée de l'Écho libre> −1` | Il est le premier tenté par Nyx IV au ch. 21. |
| Avoir Insisté au moins une fois | `autonomie.insistances +n` | Nyx IV le cite au ch. 20 ; condition de l'alliance au ch. 23. |
| ◆ Aucun Délié dispersé | `confiance.nyx +1` | Accueil plus doux à Haut-Pendant (ch. 20). |
| Un Délié dispersé | `confiance.nyx −1`, `confiance −1` | Les Déliés refusent de parler au héros sans arme dans les mains d'Eva IV. |
| Q19 : réponse de Tarn acceptée | `carnet.Q19 = fausse` | Fin secrète compromise. |
| Q19 gardée ouverte | `carnet.Q19 = ouverte` | — |
| Écoutes de veillée | `confiance.brutus/lyra/gorr +1` | Paliers du ch. 20. |
| Lire toutes les ardoises / passer sans lire | `confiance.nyx ±1` | Ouverture du dialogue de Nyx IV au ch. 20. |

## Récompenses

- **Habit — Capuche des Déliés.** *Tissée sans motif : rien sur elle ne dit à qui l'on appartient.* Effet : en ère IV, les Déliés neutres ne prennent jamais le héros pour première cible. (Trouvée sur un Guetteur en fuite, ou offerte par Tarn s'il n'a vu aucun Délié dispersé.)
- **Habit — Brassard du Gardien** *(si Brutus IV est Confiant ou mieux en fin de combat)*. *Un cuir épais, cousu de la marque d'un village que plus personne n'habite.* Effet : +1 défense physique quand le héros est adjacent à un allié.
- **Rejoignent :** Gorr, Brutus IV, Lyra IV.

## Graines pour la suite

- **Le héros ramène le Ghom avec lui.** La case de Lacune qui « recule » sous ses pieds annonce l'argument central des Déliés (ch. 20) et la clé du ch. 24 (habiter une Lacune à deux, dont le héros).
- **Gorr obéit** (si `gorr_question` est faux) : Nyx IV s'en servira. Rattrapage possible au ch. 23.
- **Sel**, la petite qui a oublié le mot « chaud » : on la rencontre au ch. 20 ; elle sert de mesure humaine de l'effilochage.
- **Tarn** et sa réponse tentante (Q19) : il reparaît au ch. 23, s'il faut un témoin de la Salle des Défauts (variante sans Merlin IV).
- **La flèche d'Eva IV** : sa précision à trois cents pas, de nuit, dans le vent, pose son personnage avant le ch. 22.

## Notes de mise en œuvre

- **Autonomie (nouveau système) :** calcul de la Confiance effective et du palier au début du combat ; commandes « Laisser agir », « Respecter », « Insister » ; contour pointillé sur la timeline pour les tours joués par l'IA ; journal « X refuse. » ; départs D1 et D2 (passage en équipe neutre, sortie en deux tours). Toutes les règles sont dans le README de l'ère.
- **Suivi des commandes :** l'objectif « Laisser libre » s'appuie sur le journal des commandes : aucun ordre issu du joueur pour l'Écho désigné. « Laisser agir » ne compte pas comme un ordre.
- **Cases de Lacune :** nouveau type de case (`x`), sans Influence possible, sans ordres, Usure si l'on y finit seul un tour complet, et l'exception du héros (sa case redevient normale tant qu'il l'occupe).
- **Fuite des Déliés :** seuil à 30 % de PV, cible prioritaire : la case de Lacune la plus proche ; reddition si bloqué.
- **Entrées en cours de combat :** Brutus IV au tour 2, Lyra IV au tour 3 (bords ouest et nord).
- **Défaite narrative :** deux tours de suite sur une Lacune pour le héros → écran spécifique, puis on recommence.
- **Didacticiel** au tour 2, à n'afficher qu'une fois par sauvegarde.
