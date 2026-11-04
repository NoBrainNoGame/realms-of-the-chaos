# Chapitre 12 — Grande Marée

> **Journal de Néréa** — *Eva a calculé que nous pouvions tenir une île. Une. Elle l'a dit trois fois, comme si le chiffre allait changer à force de le dire. Il n'a pas changé.*

## Fiche

| | |
| --- | --- |
| Ère | II — Le Temps des Marées |
| Lieu | La Tour des Marées (Sauge), puis l'île choisie (Sauge, Lusse ou les Strates), enfin la Pierre Lente |
| Équipe | Le héros, Néréa II, Eva II, le Lacunaire stabilisé, Squalor II (si `squalor_rejoint`). Alliés temporaires selon les drapeaux (Squalor si `ile_sauvee = lusse`, deux Ombres si `nyx_epargnee`). **Le héros part** : retour au Puits. |
| Durée visée | 7 nœuds, 1 combat en vagues, 1 scène de transformation |
| Question au Carnet | Q12 — *Que peut-on laisser disparaître ?* (Q06 reposée) |

## Ce que le joueur sait en arrivant

- Le Ghom du Chaos fut un Ghom de l'Ordre qui a cessé d'entretenir son Fragment ; les premières Lacunes sont nées là. Néréa l'a écrit, ou pas encore.
- Eva annonce depuis le ch. 8 une Grande Marée, la Marée du siècle.
- L'équipe compte un Lacunaire qui dit « nous », et peut-être un Squale qui a promis de ne rien manger qui parle.

## Synopsis

La Grande Marée arrive. Eva a tout recalculé : trois îles comptent, Sauge, Lusse et les Strates, et l'équipe ne peut en tenir qu'une. Les habitants seront évacués en barque quoi qu'il arrive ; ce que l'on choisit, c'est ce qui restera : un village et l'apprentie d'Eva, une pouponnière de squales, ou quatre siècles d'annales. Une thermiste venue du nord, Tessa, observe et promet qu'un jour on saura figer les Marées. Après une dernière veillée où le Lacunaire demande pourquoi il y a quelque chose plutôt que le gris, l'équipe défend l'île choisie, vague après vague. À la dernière, le héros est englouti. Il en ressort changé : des branchies, ou des écailles de marée. Épuisé, il est reconduit à la Pierre Lente. Néréa sait qu'elle se sera dispersée bien avant qu'il ne se réveille. Elle l'accompagne quand même jusqu'au bord.

## Carte du chapitre

```
[1 Rencontre : Les calculs d'Eva] → [2 Rencontre : La thermiste] → [3 Veillée : La dernière nuit]
                                                                            ↓
[7 Fin : La Pierre Lente] ← [6 Scène : Ce qui reste] ← [5 Combat : Grande Marée] ← [4 Rencontre : Le choix]
```

## Scènes

### 1. Rencontre — Les calculs d'Eva

*Le sommet de la Tour des Marées, à Sauge. Des ardoises partout, couvertes de chiffres raturés. Ilse tient une corde graduée qui plonge dans l'eau. Eva n'a pas dormi.*

**Eva** — « La Marée arrive dans deux jours. Elle couvrira tout l'archipel, sauf les crêtes. Trois îles comptent : Sauge, Lusse, les Strates. Sans rien faire, j'ai cinq chances sur cent qu'il en reste une. Avec nous tous sur une seule, quatre-vingt-dix. Sur deux, trente pour chacune. Et sur trois… »
**Néréa** — « Ne le dis pas. »
**Eva** — « Je ne le dis pas. Mais je l'ai calculé. »

*Eva corrige le chant :*
*(Si `lacune_geante_habitee = faux`)* **Ilse** — « Le chant dit que les Marées montent du Trou. » — **Eva** : « Le chant a tort. Elles viennent du Clair, je les ai suivies depuis l'horizon. Le Trou ne fait que les accueillir. Mais elles arriveront plus fortes de ce côté, ça, c'est vrai. »
*(Si `lacune_geante_habitee = vrai`)* **Ilse** — « Et le Seuil ? » — **Eva** : « Le Seuil tiendra. Ceux qui y vivent à deux le maintiennent. Une vague de moins à ce côté-là. »

**Eva** *(au héros, plus bas)* — « Tu te souviens, sur Peut-Être ? Une archère moins utile qu'un caillou. Là, je suis moins utile qu'une Marée. Elle, au moins, sait où elle va. »

1. « Tu as fait ce qu'il fallait : tu as calculé. » [confiance.eva +1]
2. « Ce n'est pas toi qui choisis. C'est nous. » [confiance.eva +1 ; graine de Q22 : « Viser, c'est choisir. » Eva ne le comprend pas encore]
3. « Et si on tentait les trois ? » — **Eva** : « Alors on les perd toutes, avec de la conviction. » [—]

### 2. Rencontre — La thermiste

*Une barque à voile grise accoste. Une femme en manteau long, à la coupe que le héros reconnaît (celle de Merlin I, celle du Thermiste des reconstitutions), en descend avec des instruments de cuivre.*

**Tessa** — « Tessa, des Thermistes des îles sèches. Je suis venue mesurer la Grande Marée. Ne vous inquiétez pas, je ne gênerai personne. »
**Néréa** — « Vous êtes venue la regarder ? »
**Tessa** — « La mesurer. Ce n'est pas pareil : mes sondes la touchent. Je le sais, elles la font un peu « prendre » autour d'elles. Toute mesure dérange un peu ce qu'elle mesure. »
*(Graine de Q17, Merlin III : « Peut-on connaître le monde sans le changer ? »)*

**Tessa** — « Chez nous, au nord, on pense qu'une Marée, ça se fige. Il suffirait d'assez d'ordre, au bon endroit. Les Gardiens et les Soigneuses qui nous ont rejoints y croient aussi. Il nous manque encore l'énergie. » *(Elle regarde vers le sud, vers Lusse.)* « Vos récifs en contiennent beaucoup. »

1. « Les cristaux de Lusse sont vivants. » [confiance.squalor +1 si présent] — **Tessa** : « Vivants ? Ce sont des cristaux. » — **Squalor** *(s'il est là)* : « Dis ça aux poissons qui y vivaient. »
2. « Figer, c'est arrêter de vivre. » — **Tessa** : « Ou arrêter de mourir. Ça dépend où l'on se place. » [—]
3. « Comment feriez-vous ? » — **Tessa** : « Pas encore. Dans un siècle ou deux. Revenez voir. » *(Elle sourit sans savoir à qui elle parle.)* [—]

### 3. Veillée — La dernière nuit

*Le feu sur la plate-forme de la Tour. Tout le monde est là. Personne ne dort.*

*Si `nyx_epargnee` et `objet_de_nyx` (et le héros a dit au ch. 7 que l'objet lui avait été donné) : une silhouette d'Ombre s'approche au bord de la lumière, regarde l'objet, ne dit rien, et repart. Néréa : « Elles viendront demain. Elles ne le diront pas. »*

**La question du Lacunaire (Q06 reposée).**
**Le Lacunaire** — « Avant, nous étions dans le gris. Là où rien n'arrive. Ici, il y a du feu, des voix, Squalor qui ronfle… Pourquoi il y a tout ça, plutôt que le gris ? Pourquoi il y a quelque chose ? »
**Eva** *(vite, trop vite)* — « Parce que le rien est impossible. C'est logique : s'il n'y avait rien, il n'y aurait même pas de règle pour qu'il n'y ait rien. Donc il y a quelque chose. »

1. « Oui. Le rien est impossible. » [`carnet.Q06 = fausse` ; Eva, soulagée : « Voilà. Réglé. »]
2. « Personne ne sait. » [`carnet.Q06` reste `ouverte` ; confiance.lacunaire +1 ; **Néréa** : « Les Ondines non plus. Et nous lisons la vase depuis plus longtemps que tout le monde. »]
3. *Écrire la question dans le Carnet, sous celle de l'ère I, sans répondre.* [`carnet.Q06` reste `ouverte`]

**Eva** *(à 2 ou 3, après un temps)* — « … J'ai dit ça parce que ça sonnait juste. Ce n'est pas un calcul. C'est une phrase. »

**Les noms (arc F).** *Chaque Écho dont la Confiance est d'au moins +3 propose un nom au héros, à sa façon. Si `nom ≠ aucun`, ils l'appellent par son nom déformé et proposent un surnom, sans effet sur `nom`.*
- **Néréa** *(confiance.nerea ≥ 3)* — « **Marne.** C'est la vase la plus fine, celle qui garde tout. Vous portez une époque entière dans votre corps. » [`nom.propositions += nerea`]
- **Eva** *(confiance.eva ≥ 3)* — « **Écart.** La différence entre ce que je prévois et ce qui arrive. C'est toi, depuis le premier jour. C'est un compliment. Je crois. » [`nom.propositions += eva`]
- **Squalor** *(confiance.squalor ≥ 3, s'il est là)* — « **Reste.** Ce qu'on garde pour plus tard, quand on n'a plus faim. Ne fais pas cette tête. Chez nous, c'est ce qu'il y a de plus précieux. » [`nom.propositions += squalor`]
- **Le Lacunaire** *(confiance.lacunaire ≥ 3)* — « **Premier.** Le premier qui nous a… parlé. Pas touché. Parlé. » [`nom.propositions += lacunaire`]

1. *Accepter l'un des noms proposés.* [`nom = <lignée>` ; confiance de cette lignée +1]
2. « Gardez-les pour moi. Je les reprendrai plus tard. » [les propositions restent ; `nom` inchangé]
3. « Je n'en veux pas. Pas encore. » [`nom` inchangé ; aucune perte de Confiance]

*Paires de veillée (une au choix, faute de temps) :*
- **Néréa – Eva.** **Eva** : « Tu crois qu'on se souviendra de nous ? » — **Néréa** : « On se souviendra de quelque chose. Ce ne sera pas nous. Ce sera un chant. » — **Eva** : « Alors j'espère qu'il sera faux dans le bon sens. »
- **Squalor – le héros** *(si présent)*. **Squalor** : « Tu m'avais demandé pour quoi je dure. J'ai le ventre plein, depuis des jours. Et je ne sais toujours pas. Mais j'ai envie de savoir. C'est nouveau, ça. C'est pire que la faim. »
- **Le Lacunaire – Néréa.** **Le Lacunaire** : « Si demain nous nous défaisons, est-ce que nous aurons existé ? » — **Néréa** : « Tu as touché des choses, et elles t'ont touché. Ça reste. Même dispersé, ça reste quelque part. Simplement, ça ne s'appellera plus toi. »

### 4. Rencontre — Le choix

*À l'aube, sur la plate-forme. La ligne laiteuse de la Marée est déjà à l'horizon. Chacun plaide, sans insister.*

**Ilse** *(pour Sauge)* — « La Tour, c'est cinquante ans de mesures. Et c'est chez moi. Je ne veux pas partir. Je veux finir mes relevés. »
**Eva** — « Ilse… »
**Ilse** — « Tu l'aurais fait, toi. »

**Squalor** *(pour Lusse, s'il est là ; sinon, sa sœur, Mira, venue en barque)* — « La pouponnière. Six petits qui ne savent pas encore nager loin. Je ne vous demande rien. Enfin si. Je vous demande ça. »

**Néréa** *(pour les Strates)* — « Les annales. Tout ce que les Ondines ont lu depuis quatre siècles, les colonnes, les ardoises. Ce que nous avons appris au fond des Abysses. Si ça disparaît, il restera mon journal, et un chant faux. » *(un temps)* « Je ne vous demanderai pas de choisir les ardoises plutôt qu'une enfant. Je dis seulement ce qui disparaît. »

**Aubin** — « Moi, je reste à Sauge. Quoi que vous choisissiez. Je suis trop vieux pour aller vivre sur l'île de quelqu'un d'autre. »

**Le choix (★ du chapitre) :**

1. **Sauver Sauge.** [`ile_sauvee = sauge` ; confiance.eva +2 ; confiance.squalor −1 ; confiance.nerea +0]
2. **Sauver Lusse.** [`ile_sauvee = lusse` ; confiance.squalor +2 ; confiance.eva −1 ; si `squalor_rejoint = faux`, Squalor revient en allié temporaire]
3. **Sauver les Strates.** [`ile_sauvee = strates` ; confiance.nerea +2 ; confiance.eva −1]

*Dans tous les cas, les habitants sont évacués en barque vers l'île sauvée. Ce qui disparaît, c'est ce que l'on ne peut pas mettre dans une barque.*

## Combats

### Combat 5 — Grande Marée

- **Carte :** l'île choisie, entourée d'eau profonde. Le centre abrite **le Cœur** de l'île (entité neutre à préserver) :
  - `sauge` : la Tour des Marées (et Ilse, qui refuse d'en descendre) ;
  - `lusse` : le bassin de la pouponnière (six jeunes squales) ;
  - `strates` : la maison des annales.

```
WWWWWWWWWWW
WW~~...~~WW
W~..1.1..~W
W~.......~W
W..1.C.1..W
W~.......~W
W~..1.1..~W
WW~~...~~WW
WWWWWWWWWWW
```

  `C` = le Cœur (sol). Variantes : Sauge a des passerelles (`1`) en plus vers le nord ; Lusse a des arches de cristal (`2`) à la place des `1` et plus d'eau peu profonde ; les Strates ont un relief plus haut (`2`, `3`) autour du Cœur.

- **Calque de Superposition :** à chaque vague, l'anneau extérieur de terre (`~` et `.` en bordure) passe en Superposition (`sol 40 · eau 60`), puis l'anneau suivant. La Marée « monte » ainsi vers le Cœur. Fixer une case en sol la garde hors de l'eau pour la vague en cours.
- **Équipes :**
  - Alliés : le héros, Néréa II, Eva II, le Lacunaire stabilisé, Squalor II (si `squalor_rejoint`, ou en allié temporaire si `ile_sauvee = lusse`).
  - Alliés temporaires : **deux Ombres** à la vague 3 si `nyx_epargnee` (elles tiennent un flanc sans un mot, puis repartent).
  - Neutres : **le Cœur** (PV élevés) ; à Sauge, **Ilse** (à mettre à l'abri dans la Tour avant la vague 3).
  - Ennemis, par vague :
    1. 4 Lacunaires instables ;
    2. 2 Lacunaires dédoublés + le **Front de Marée** sur un côté ;
    3. 2 Lacunaires effilocheurs + 3 instables ;
    4. **le Lacunaire géant** (2×2 cases, chacune en Superposition corps / vide) + 2 instables.
  - **Ajustements selon les drapeaux :**
    - `lacune_geante_habitee = vrai` : le Seuil tient, la vague 2 est réduite de moitié ;
    - `lacune_geante_habitee = faux` : une vague supplémentaire (3 instables) arrive du côté du Trou entre les vagues 3 et 4 ;
    - Peut-Être (ch. 8) **recousue** : pas d'effilocheur à la vague 3 ; **élargie** : 2 instables de plus à la vague 3 ; **habitée** : une fois dans le combat, un allié tombé peut être relevé (il a été mis à l'abri sur Peut-Être) ;
    - ★ du ch. 7 raté : l'anneau extérieur commence la vague 1 déjà en Superposition.
- **Objectif principal :** tenir les vagues (4, ou 5) sans que le Cœur tombe.
- **Objectifs secondaires :**
  - ★ **Le choix** (fait au nœud 4) : c'est lui qui compte.
  - ★ **Personne derrière** *(Sauge seulement)* : Eva atteint Ilse et la ramène dans la Tour avant la vague 3. **Eva** : « Ilse, descends ! » — **Ilse** : « Encore une mesure ! » — **Eva** : « Ta mesure, c'est moi qui la finirai. »
  - ◆ **Pas d'Influence sur les siens :** aucune Distorsion ni aucun Séisme visant un allié ou sa case. [`confiance +1`]
  - ◆ **Une île entière :** à la fin, toutes les cases de terre de l'île sont fixées en sol.
- **Défaite :** le Cœur tombe, ou le héros se disperse. *(Si le Cœur tombe, l'île choisie est perdue aussi : `ile_sauvee = aucune`. Néréa : « Nous avons tout perdu en en gardant une. » L'histoire continue.)*
- **Événements scriptés :**
  - **Début :** **Néréa** — « Souvenez-vous : on ne gagne rien à frapper la Marée. On gagne à tenir la terre. » *(Si ★ du ch. 7 réussi : « Vous l'avez déjà fait une fois, sur les pilotis. »)*
  - **Vague 2 :** **Tessa** (de sa barque, au loin) — « Hauteur relevée : quatre brasses. Pardon. Je mesure. »
  - **Vague 3 (si `nyx_epargnee`) :** deux Ombres sortent de l'eau sur le flanc ouest et le tiennent. Elles ne parlent pas. Si `objet_de_nyx`, l'une touche l'objet du héros en passant.
  - **Vague 4 :** le Lacunaire géant. **Eva** — « Quatre cases, chacune à moitié là. Je déteste ce monstre. Il est fait pour me déplaire personnellement. »
  - **Le Lacunaire stabilisé face au géant :** **Le Lacunaire** — « Lui, il n'a jamais été touché par personne. Nous… nous savons ce que c'est. »
  - **Fin de la vague 4 (scripté) :** le Lacunaire géant s'effondre sur la case du héros. Une masse d'eau et de matière instable l'engloutit. Écran blanc, puis noir. (Voir nœud 7 : la transformation.)
- **Répliques de combat :**
  - **Squalor** — « Une Marée entière à mordre. Je n'ai jamais eu autant de choix. »
  - **Le Lacunaire** — « Nous tenons. Nous… tenons ! »
  - **Eva** (si le ◆ « île entière » réussit) — « Pas une case dans l'eau. Ilse, note. »

### 6. Scène — Ce qui reste

*Le lendemain. L'eau a monté de quatre brasses. Deux des trois îles ont disparu. Les barques sont amarrées à l'île sauvée, serrées les unes contre les autres.*

- **Si `ile_sauvee = sauge` :** la Tour tient, Ilse y recopie ses relevés. Lusse est sous l'eau : la pouponnière s'est dispersée dans le large ; les squales ont fui vers le sud. Les annales des Strates sont perdues ; seules restent celles que Néréa avait sur elle, et son journal. **Squalor** (s'il est là) : « Ils savent nager. Un peu. Ça suffira, ou pas. »
- **Si `ile_sauvee = lusse` :** les petits squales tournent dans le bassin, gras de Lacunaires. La Tour de Sauge est sous l'eau ; Ilse est partie vers le nord avec sa famille, chez les Thermistes. Les annales des Strates sont perdues. **Eva** : « Cinquante ans de mesures. Je les referai. Ou quelqu'un. »
- **Si `ile_sauvee = strates` :** les colonnes de vase sont sauves. Sauge et Lusse ont disparu. Ilse est partie vers le nord. Les squales ont fui vers le sud. **Néréa** : « J'ai gardé le passé et perdu deux présents. Je ne sais pas si c'était juste. Je sais que c'était un choix. »
- **Dans tous les cas où Sauge n'est pas sauvée :** Aubin est resté. On ne le retrouve pas. Néréa : « Il disait qu'il fallait laisser le passé couler. Il a été cohérent jusqu'au bout. » Le rocher de Brutus est sous l'eau. Il ne sera plus jamais tiède.

**Tessa** *(avant de repartir)* — « Ne soyez pas tristes. Rien ne disparaît vraiment. L'information n'est jamais détruite, c'est une loi. Tout est gardé quelque part. »

**Le Carnet** — *Le héros écrit : « Que peut-on laisser disparaître ? »* [`carnet.Q12 = ouverte`]

1. « Elle a raison. Rien ne disparaît. » [`carnet.Q12 = fausse` ; **Tessa** : « Vous voyez ? »]
2. « Ce qui est gardé, ce n'est pas ce que ça voulait dire. » [`carnet.Q12` reste `ouverte` ; confiance.nerea +1 ; **Néréa** : « L'encre reste dans l'eau. Pas la lettre. »]
3. *Ne rien répondre. Regarder l'eau.* [`carnet.Q12` reste `ouverte`]

**Tessa** *(à 2)* — « … C'est une distinction intéressante. Je la noterai. »

### 7. Fin — La Pierre Lente

*Le héros, ramené des flots par Néréa (ou par Squalor, ou par le Lacunaire), a passé un jour et une nuit sans connaissance. Quelque chose a changé en lui.*

**La transformation (`transformation.II`).** *Néréa explique ce qui s'est passé pendant l'engloutissement, et propose. Le joueur choisit.*

1. **Branchies (A).** **Néréa** — « Vous avez respiré l'eau un moment, et vous n'êtes pas mort. Les Ondines portent dans les plis du cou de minuscules algues qui échangent l'air avec l'eau ; nous les appelons les berceaux. J'en ai mis sur vous pendant que vous dormiez. Elles ont pris. Dans quelques jours, les plis s'ouvriront. » *(Une symbiose : le héros devient nageur.)* [`transformation.II = A`]
2. **Écailles de marée (B).** **Néréa** — « La Marée s'est déposée sur vous. Ce qui touche quelque chose de fixé finit par se fixer aussi : la matière instable a pris sur votre peau, en petites plaques nacrées, comme le calcaire sur un pilotis. Elles ne partiront pas. Elles sont dures. » *(Un dépôt minéral : le héros résiste mieux.)* [`transformation.II = B`]

*Si `transformation.I = B` et `transformation.II = B` :* « Du verre et de la nacre. Vous allez finir en récif, Dormeur. »
*Si `transformation.I = A` et `transformation.II = A` :* « Des yeux pour le noir, une gorge pour l'eau. Vous êtes fait pour les Abysses. Mes aïeules vous auraient adopté. »

**Le départ.** *Le Ghom se manifeste : l'eau autour du héros s'alourdit, le temps hésite, ses blessures semblent durer plus longtemps qu'elles ne devraient. Néréa regarde ses horloges.*

**Néréa** — « Votre Ghom vous rappelle à la Pierre Lente. Ou c'est votre corps qui n'en peut plus. Je ne sais pas faire la différence, et je crois que personne ne sait. »

1. « Je reviendrai. » — **Néréa** : « Je sais. Mais pas pour moi. » [confiance.nerea +1]
2. « Viens avec moi. » — **Néréa** : « Au fond ? Et qui écrirait le journal ? » [confiance.nerea +1]
3. « Pour moi, ce sera demain matin. » *(si choisi « Pour moi, c'était ce matin » au ch. 7, Néréa sourit : « Vous l'aviez déjà dit, la première nuit. »)* [confiance.nerea +1]

*Les adieux, en une ligne chacun :*
- **Eva** — « Je calculerai combien de temps tu dors. Je ne serai plus là pour vérifier. C'est le calcul le plus inutile de ma vie. Je vais le faire quand même. »
- **Squalor** *(s'il est là)* — « Tu as de la chance que je n'aie pas faim. » *(un temps)* « Je n'ai plus faim de toi depuis longtemps, en fait. C'est bizarre. »
- **Le Lacunaire** — « Nous… » *(il s'arrête)* « Non. **Je**. Je me souviendrai. Moi. Pas nous. » *(C'est son premier « je ».)* « Je ferai d'autres comme moi. Je leur apprendrai à se fixer. »

**Le journal (`journal_nerea`).** *Néréa tient son journal contre elle.*

1. **« Garde-le pour les Ondines. »** [`journal_nerea = garde` ; il sera recopié, et les copies dériveront]
2. **Accepter qu'elle le lui donne.** **Néréa** — « Prenez-le. Les copies mentent toujours un peu. Au moins, l'original aura dormi avec quelqu'un qui était là. » [`journal_nerea = porte`]

**L'Éclat de jumelle** *(si le héros l'a reçu au ch. 10 — arc H)* :
1. **Le garder.** [`cristaux.gardes +1`]
2. **Le porter**, incrusté dans la peau. [`cristaux.portes +1`]
3. **Le donner** à Néréa pour recoudre la Lacune de [Peut-Être / du Trou] avant de partir. [`cristaux.donnes +1`, `lacunes.recousues +1`]

**La clepsydre.** *Néréa détache la plus petite de ses deux horloges à eau et la lui tend.*
**Néréa** — « Emportez-la. Quand vous sortirez, comparez-la à n'importe quelle horloge du monde. Vous saurez combien de temps on vous a attendus. »

*Le héros descend dans la fosse. Néréa nage avec lui jusqu'à ce que la pression l'oblige à remonter. La dernière image : sa silhouette au-dessus, la lanterne de vase, qui devient un point, puis rien.*

> **Journal de Néréa** — *Dernière page de l'année 417. Il est descendu. J'ai remonté seule. Mes horloges disent que l'eau, autour de lui, coule déjà plus lentement que la mienne. Pour lui, quelques heures. Pour nous, je ne sais pas : assez pour que je devienne une couche. Une couche fine, j'espère, mais lisible. À celle qui me suivra : ne chante pas qu'il dort. Écris qu'il attend au fond d'un puits où le temps ralentit, et qu'il ne sait pas qu'il est vieux. Écris que nous l'avons aimé. Ça, au moins, c'est une trace.*

## Choix et conséquences

| Choix ou objectif | Drapeaux | Effet plus tard |
| --- | --- | --- |
| Q06 : accepter « le rien est impossible » | `carnet.Q06 = fausse` | Compte contre la fin secrète. |
| Noms proposés / accepté | `nom.propositions`, `nom` | Arc F : le nom apparaît, déformé, dans la Chronique de l'ère III. |
| `ile_sauvee = sauge` | `confiance.eva +2`, `confiance.squalor −1` | Ère III : **Eva III** (descendante de la lignée d'Ilse) peut rejoindre. La carte des Lacunes (copie d'Eva) reste à la Tour. Aubin vit. |
| `ile_sauvee = lusse` | `confiance.squalor +2`, `confiance.eva −1` | Ère III : **Squalor III** (issu de la pouponnière) peut rejoindre. Ilse part au nord : la lignée d'Eva y sert les Thermistes. |
| `ile_sauvee = strates` | `confiance.nerea +2`, `confiance.eva −1` | Ère III : les annales existent, le Chroniqueur peut y confronter ses textes (ch. 14, plus facile). Néréa IV (ère IV) hérite d'une bibliothèque. Eva III ou Squalor III : la lignée de plus forte Confiance. |
| Cœur tombé (`ile_sauvee = aucune`) | — | Ère III : ni Eva III ni Squalor III par défaut ; le Chroniqueur ne dispose que des cristaux. |
| ◆ Pas d'Influence sur les siens | `confiance +1` | — |
| Q12 : accepter la réponse de Tessa | `carnet.Q12 = fausse` | Compte contre la fin secrète. |
| Transformation | `transformation.II = A / B` | Corps du héros pour la suite. |
| Journal | `journal_nerea = porte / garde` | Ère III : le héros possède l'original (preuve pour le Chroniqueur), ou les Ondines en ont des copies divergentes. |
| Éclat de jumelle | `cristaux.*`, éventuellement `lacunes.recousues +1` | Arc H. |
| Si Lusse n'est pas sauvée | — | Les Thermistes reviennent récolter les cristaux du récif mort : premières extractions, graine de l'ère III. |

## Récompenses

- **Transformation — Branchies (A)** : des plis s'ouvrent sous la mâchoire, où vivent les berceaux des Ondines. *Effet : le héros devient nageur (il peut entrer en eau profonde et y agir).*
- **Transformation — Écailles de marée (B)** : des plaques nacrées, dures, sur les épaules et les avant-bras. *Effet : + Défense physique et + Défense énergétique ; les chutes en eau ne coûtent plus de PV.*
- **Objet — La clepsydre de Néréa** : une petite horloge à eau en verre de récif. *Effet narratif : à la sortie du Puits (ch. 13), elle permet au héros de mesurer le temps passé.*
- **Objet — Le journal de Néréa** *(si `journal_nerea = porte`)*.
- **Habit — Châle de Sauge, de Lusse ou des Strates** (selon `ile_sauvee`), offert par ceux qu'on a sauvés : un châle tissé de fibres de l'île. *Effet : +1 Défense énergétique ; à Sauge, brodé des chiffres d'Ilse ; à Lusse, frangé de dents de lait de squale ; aux Strates, teint de vase.*

## Graines pour la suite

- **Les Thermistes** (Tessa) veulent figer les Marées avec l'énergie des cristaux : c'est le projet de l'ordre de Merlin à l'ère III. Tessa mesure, et sait que mesurer dérange : graine de Q17.
- **Ilse** (si `sauge`) : ancêtre d'Eva III. Ou partie au nord (sinon) : la lignée d'Eva au service des Thermistes.
- **La pouponnière** (si `lusse`) : Squalor III.
- **Les annales** (si `strates`) : sources physiques du Chroniqueur (ch. 14).
- **Le Lacunaire** a dit « je » et veut « en faire d'autres » : une lignée de Lacunaires stabilisés (`confiance.lacunaire` se transmet). Ses héritiers peuvent habiter les Lacunes de l'ère IV.
- **La clepsydre** et **le journal** : objets de la sortie du Puits au ch. 13.
- **Les Ombres** venues aider (si `nyx_epargnee`) : une dette, côté Ombres, que Nyx IV pourra évoquer.
- **La question du héros au ch. 11** et l'adieu de Néréa (« je ne sais pas faire la différence ») gardent le mystère des Ghoms.

## Notes de mise en œuvre

- **Défense en vagues** : réutiliser la logique de l'Arcade (les Marées), avec une entité neutre à préserver (le Cœur) et des anneaux de cases qui passent en Superposition à chaque vague.
- **Trois variantes de carte** pour l'île choisie, sur la même base.
- **Ajustements de vagues** selon `lacune_geante_habitee`, le choix du cœur de Peut-Être (ch. 8) et le ★ du ch. 7.
- **Allié temporaire** (Squalor si `lusse` et non recruté ; deux Ombres si `nyx_epargnee`) : IA autonome, non contrôlables.
- **Engloutissement scripté** du héros à la fin de la vague 4, sans Dispersion.
- **Écran de transformation** : choix A/B, mise à jour du corps du héros (créateur de personnage).
- **Fin d'ère** : sauvegarde des drapeaux, puis transition vers l'ère III (la Chronique de l'ère III peut citer le journal de Néréa selon `journal_nerea`).
