# Chapitre 16 — Le Golem

> « Ne mange pas. Ne dort pas. Ne demande rien. »
> — *Fiche d'outillage n° 7, « Golem (dit Gorr) ». Le troisième membre de phrase est barré, d'une encre plus récente.*

## Fiche

| | |
| --- | --- |
| Ère | III — L'Âge du Verre |
| Lieu | Vitrelle : les ateliers de la Fonderie, au pied de la Tour du Registre |
| Équipe | Le héros, Lyra III, Eva III ou Squalor III, le Chroniqueur (si `chroniqueur_rejoint`). **Gorr** rejoint à la fin, quoi qu'il arrive. |
| Durée visée | 5 nœuds, 1 combat |
| Question au Carnet | **Q16** — *Une question peut-elle naître d'une pierre ?* (Gorr) |

## Ce que le joueur sait en arrivant

- Gorr est un organisme minéral, plus vieux que le Gel. Il croît en puisant dans la chaleur des profondeurs, se répare seul, et le Collège le fait travailler en lui imposant un rythme : le Diapason.
- À la fin du ch. 15, il a cessé de répondre au Diapason de la mine et a tourné la tête vers le héros. Le Collège a envoyé des Sonneurs « le reprendre en main ».
- Selon `premier_cristal`, le héros porte le Premier Cristal ou un éclat qui ne bat plus.

## Synopsis

Le Collège a traîné Gorr jusqu'à la Fonderie pour le **réaccorder**. Le Chroniqueur (ou Garance, s'il n'a pas rejoint) apprend au héros ce que prévoit l'ordre de service : si le réaccord échoue, le Golem sera « valorisé », c'est-à-dire extrait. Son corps de cristal vaut quarante gisements. L'équipe arrive alors que les pylônes du Diapason poussent Gorr contre elle. Le vaincre est possible. Mais si l'on tient, si l'on fait taire les pylônes et si un Écho de chair partage sa case, une Intrication passe entre eux : un être qui n'a jamais rien demandé sent, pour la première fois, quelque chose qui n'est pas lui. Et il pose une question.

## Carte du chapitre

```
[1 Rencontre : l'ordre de service]
        │
[2 Rencontre : est-ce quelqu'un ?]
        │
[3 Veillée courte : qui ira vers lui ?]
        │
[4 Combat (fin de chapitre) : la Fonderie]  → `gorr_question`
        │
[5 Rencontre : la première phrase]  → Gorr rejoint ; Q16
```

## Scènes

### 1. L'ordre de service (Rencontre)

> **Extrait des archives — Ordre de service n° 312-0423.**
> « Le Golem (fiche d'outillage n° 7) sera conduit à la Fonderie pour réaccord sous deux pylônes. En cas d'échec du réaccord, il sera procédé à sa valorisation. Rendement estimé : quarante gisements, soit l'entretien du Gel pendant une saison. »
> *(Si `chroniqueur_rejoint`, annoté : « Valorisation : extraction. On va casser un être qui se répare seul pour chauffer… non. Pour refroidir. Pour refroidir une saison. — C. »)*

- **Si `chroniqueur_rejoint` :** *Le Chroniqueur a volé l'ordre de service au Registre. Il le lit deux fois, à voix haute, la seconde en remplaçant chaque euphémisme par le mot exact.*
- **Sinon :** *C'est Garance, la mineuse, qui l'apporte, pliée en huit dans sa botte.* **Garance** — « Ils l'ont emmené à la Fonderie. Il ne bougeait plus. Ils l'ont tiré avec des chaînes, il ne s'est pas défendu. Il n'a jamais su se défendre. Il n'a jamais su qu'on pouvait. »

**Lyra III** — « Quarante gisements. Ils le mesurent en gisements. »

1. « On y va. » → [confiance.gorr +1]
2. « Pourquoi le Collège a-t-il besoin de lui à ce point ? » → **Le Chroniqueur** / **Garance** — « Parce que les Cristaux s'épuisent. Il en reste de moins en moins, et de plus en plus profond. Le Gel a faim. » *Squalor III, s'il est là :* « Ah. Je connais ce genre de faim. Celle qui mange ce qui la nourrit. »

### 2. Est-ce quelqu'un ? (Rencontre)

*En chemin, sur une passerelle de verre au-dessus de la Fonderie. En bas, la lueur rouge des fours. Au milieu, Gorr, enchaîné entre deux pylônes de cuivre qui vibrent.*

**Eva III** — « Question technique. Si on le libère, et qu'il ne sait faire que pousser, il va pousser où ? »
**Squalor III** — « Question technique. Est-ce que ça se mange ? Non. Bon. Alors c'est pas une proie. Alors c'est quoi ? »

**Lyra III** — « Il se répare seul. Il grandit. Il prend de la chaleur et il en fait de la forme. C'est exactement ce que je fais quand je soigne, sauf que moi, je me demande pourquoi. »

**Le Chroniqueur** (s'il est là) — « La question n'est pas de savoir s'il est vivant. Selon toute définition qui ne triche pas, il l'est : il se maintient, il croît, il se répare. La question est de savoir s'il est **quelqu'un**. Et je n'ai aucune source là-dessus. Personne ne lui a jamais rien demandé. »

1. « Il n'a pas besoin d'être quelqu'un pour qu'on ne le casse pas. » → **Lyra III** — « … Oui. Oui, c'est vrai. » [confiance.lyra +1, confiance.gorr +1]
2. « C'est une pierre. Une pierre qui pousse. » → **Lyra III** — « Peut-être. On verra bien ce que fait la pierre. » *(Aucune pénalité. Le chapitre se charge de répondre.)*
3. « On ne le saura que si on entre en relation avec lui. » → **Le Chroniqueur** — « C'est la seule méthode que je connaisse qui ne soit pas une légende. » [confiance.chroniqueur +1]

### 3. Qui ira vers lui ? (Veillée courte)

*Sous la passerelle, dans un recoin chaud. Personne ne dort.*

**Lyra III** — « Dans les Mines, quand on habitait la Lacune à deux, c'était comme… on existait plus fort l'un par l'autre. Si quelqu'un se met tout contre lui, sur sa case, et qu'ils agissent ensemble… il sentira peut-être autre chose que le Diapason. »

**Eva III** — « Se mettre sur la case d'un golem de trois mètres qui frappe un battement sur deux. Probabilité de survie : je préfère ne pas la dire à voix haute. »

*Le joueur peut désigner l'Écho qui « ira vers lui » (pas d'obligation en combat : c'est une indication, et un gain de Confiance si c'est bien lui qui réussit l'Intrication) :*

1. Le héros lui-même. → **Lyra III** — « Évidemment. »
2. Lyra III. → **Lyra III** — « Je le soignerai. Le Diapason l'a fendu partout. Un soin, c'est une forme d'Intrication, après tout : il faut toucher. » [confiance.lyra +1 si c'est elle qui réussit]
3. Eva III ou Squalor III. → **Eva III** — « Bon. Au moins je saurai enfin quelque chose que je n'ai pas calculé. » / **Squalor III** — « Je vais lui mordre l'épaule pour lui dire bonjour. Non. Je plaisante. Peut-être. »
4. Le Chroniqueur. → **Le Chroniqueur** — « Moi ? Je… Bien. Quelqu'un devra noter ce qu'il dit. Autant être sur place. »

## Combats

### Combat — La Fonderie (fin de chapitre)

**Carte :** un grand atelier rectangulaire. Deux pylônes de cuivre (`P`) aux coins nord, chacun posé sur un Cristal d'intrication qui l'alimente. Gorr au centre, chaînes brisées. Des creux de coulée (`a`). Des fours le long des murs (`#`) rayonnent de la chaleur. Une paire de Cristaux de réserve aux bords est et ouest.

```
##1.....1##
#.........#
1..a...a..1
...........
..a.....a..
...........
1..a...a..1
#.........#
##..111..##
```

Surcouche (`H` héros, `L` Lyra III, `E` Eva III ou Squalor III, `C` le Chroniqueur, `R` Gorr, `P` pylône sur son Cristal, `S` Sonneur, `X` Extracteur, `*` Cristal de réserve) :

```
##1.....1##
#P.......P#
1S.a...a.S1
.....R.....
..a.....a..
*.........*
1..a...a..1
#..X.C.X..#
##..HLE..##
```

- Les deux Cristaux des pylônes sont **jumeaux** l'un de l'autre : extraire l'un éteint l'autre, et fait taire **les deux** pylônes d'un coup (Lacune aux deux coins nord).
- Paire de réserve : (0,5) et (10,5).

**Équipes :**
- **Alliés :** le héros, Lyra III, Eva III ou Squalor III, le Chroniqueur (s'il a rejoint).
- **Ennemis :**
  - **Gorr** (boss) : Gorr de `content.ts`, **PV ×2**. Actions : Écrasement, Secousse, Coup de pied, et **Poussée de croissance** (portée 1 à 2, une case libre : du cristal y jaillit et devient un obstacle de hauteur 2 ; temps 1, recharge 2). Tant qu'au moins un pylône vibre, il est **Surexcité** en permanence.
  - 2 Sonneurs, 2 Extracteurs.

**Objectifs :**
- **Principal (affiché) :** « Vaincre le Golem. »
- **★ Annoncé : Ne pas le vaincre.** « Tenir jusqu'à ce qu'il se passe quelque chose. » (L'infobulle n'en dit pas plus.)
- **Comment le ★ se résout :**
  1. **Faire taire les pylônes.** Pour chacun : soit **Désaccorder** (deux actions d'un allié adjacent, temps 1 chacune), soit **Extraire** son Cristal (une action, et les deux pylônes se taisent d'un coup ; `cristaux.extraits +1`).
  2. Quand les deux pylônes sont muets, Gorr est **Ébranlé** : il perd Surexcité, devient Ralenti, et **sa case peut accueillir un allié** (exception à la règle des camps).
  3. **L'Intrication :** un allié **de chair** sur la case de Gorr exécute son **action combinée** avec Gorr comme partenaire. Si l'allié est Lyra III, son Soin combiné peut **cibler Gorr** (exception scriptée) : elle répare les fêlures du Diapason.
  4. Gorr doit avoir **plus de 25 % de PV** au moment de l'Intrication.
  - Alors : scène de la première question (voir événements). [`gorr_question` = vrai] Le combat se termine à la fin du tour en cours ; les Sonneurs et Extracteurs restants **fuient**.
- **◆ Caché :** n'extraire **aucun** Cristal (ni pylônes ni réserve). [confiance.gorr +1, confiance.lyra +1]
- **◆ Caché :** l'Écho désigné au nœud 3 est celui qui réussit l'Intrication. [confiance.<sa lignée> +1]
- **Si Gorr tombe sous 10 % de PV :** il **se fend** et s'immobilise (« Gorr est vaincu » : il ne se disperse pas, il entre en sommeil pour se réparer). Les **Extracteurs** se précipitent pour l'extraire. Le combat continue : il faut les empêcher d'atteindre une case adjacente à Gorr et d'y agir. [`gorr_question` = faux]
- **Défaite :** le héros se disperse ; ou un Extracteur **extrait Gorr** (Gorr se disperse : défaite, on recommence le combat).

**Événements scriptés :**
- **Temps 0 :** les Sonneurs frappent. Gorr se tourne vers l'équipe.
  > **Sonneur** — « Réaccord, premier temps. Golem : avance. »
- **La première fois que Gorr devrait frapper le héros**, si `confiance.gorr` ≥ 1 (le héros l'a touché au ch. 15) : *Gorr lève le bras… et le garde levé un battement entier. Puis il frappe la case d'à côté.* **Lyra III** — « Il t'a reconnu. Il t'a reconnu, je te dis. »
- **Premier pylône muet :** *Une note de moins dans l'air. Gorr titube.* **Eva III** — « Fréquence instable. Il ne sait plus sur quoi battre. »
- **Deux pylônes muets (Gorr Ébranlé) :** *Les facettes de Gorr cessent de luire en rythme. Elles luisent… n'importe comment. Comme une respiration qu'on cherche.*
- **Si un Extracteur atteint un Cristal de réserve et l'extrait :** soin pour les ennemis, **y compris Gorr** (il absorbe la chaleur dégagée). **Le Chroniqueur** — « Ils le nourrissent avec des liens morts. »

**La première question (Intrication réussie) :**

*Tout s'arrête. Les Sonneurs baissent leurs diapasons sans savoir pourquoi. L'Écho qui partage la case de Gorr sent, sous sa main, la vibration lente du cristal ; et Gorr sent, contre lui, autre chose : une chaleur qui bat vite, irrégulière, qui ne vient pas des fours. Un autre rythme. Pas un ordre. Un autre.*

*Pour la première fois, une voix sort du cristal : grave, sans souffle, comme un frottement de pierres.*

**Gorr** — « … Chaud. »

*Un temps. La lueur de ses facettes cherche, trouve, se cale à moitié sur le pouls de l'Écho qui le touche.*

**Gorr** — « Gorr croît. »

*Un temps encore. Il regarde ses propres mains, énormes, pleines de roche.*

**Gorr** — « … Pourquoi ? »

*Le silence de la Fonderie. Même les fours ont l'air d'écouter.*

*(si `premier_cristal.lieu = cairn` et que le héros est sur la case de Gorr)* *Les facettes de Gorr se tournent vers le héros, très lentement, comme on se tourne vers un bruit ancien.* **Gorr** — « Gorr a porté des pierres. Pour toi. Avant. » *(Il ne sait pas dire quand. Il ne sait pas encore ce qu'est « avant ». C'est lui, la silhouette du cairn, au ch. 6.)* [`confiance.gorr +1`]

**Répliques de combat :**
- **Lyra III** (soigne Gorr pendant l'Intrication) — « Ne bouge pas. Je répare. Ça va me coûter, à moi. Pas à toi. »
- **Eva III** (pendant l'Intrication) — « Je ne calcule plus rien. Je… c'est la première fois que ça me fait plaisir. »
- **Squalor III** (pendant l'Intrication) — « T'es froid. T'as faim de quelque chose, toi aussi. Pas de viande. D'autre chose. »
- **Le Chroniqueur** (pendant l'Intrication) — « Je note. Je… non. Je ne note pas. J'écoute. »
- **Le héros** (pendant l'Intrication, s'il est sur la case) — *ne dit rien ; sa main sur le cristal.*
- **Sonneur** (Gorr Ébranlé) — « Il ne répond plus. Il ne répond plus ! Extracteurs ! »

## 5. La première phrase (Rencontre)

### Si `gorr_question`

*Gorr ne bouge pas. Il attend, sans savoir qu'il attend. L'équipe autour de lui.*

**Lyra III** — « Pourquoi tu croîs ? » *Elle rit, doucement, les larmes aux yeux.* « Je ne sais pas. Personne ne sait pourquoi il croît. Mais tu viens de te le demander. C'est déjà… beaucoup. »

*Le héros ouvre le Carnet.* **Q16 entre au Carnet :** *Une question peut-elle naître d'une pierre ?*

*Choix du héros :*
1. « Oui. Elle vient d'en naître une. » [`carnet.Q16` = `repondue`] [confiance.gorr +1]
2. « Ce n'est pas une pierre. » → **Le Chroniqueur** — « C'en est une, au sens où il est minéral. Et c'est quelqu'un. Les deux. Je crois que c'est tout l'intérêt. » [`carnet.Q16` = `repondue`]
3. *Montrer le Carnet à Gorr.* → *Gorr regarde la page, les signes qu'il ne sait pas lire. Il pose un doigt de cristal, très doucement, à côté de la question. Le papier ne se déchire pas.* **Gorr** — « Gorr… aussi. » [`carnet.Q16` = `repondue`] [confiance.gorr +2]

**Gorr rejoint l'équipe.**

**Gorr** — « Gorr suit. » *Un temps.* « Toi, chaud. Gorr suit chaud. »

*Si `premier_cristal` = `sauve` : Gorr s'arrête devant le héros, se penche vers le Cristal qu'il porte. Les deux battent, un instant, au même rythme.* **Gorr** — « Lui… croît pas. Lui, garde. » *(Le Chroniqueur, s'il est là, note : « Il fait la différence entre croître et garder. J'ai des collègues qui ne la font pas. »)*

### Si Gorr a été vaincu

*Gorr est fendu, immobile, éteint. Les Extracteurs ont fui. Lyra III s'agenouille près de lui.*

**Lyra III** — « Il se répare seul, d'après leur fiche. Mais pas vite. Pas assez vite pour la Garde. » *Elle pose les mains sur la fêlure la plus large.* « Je vais l'aider. Ça va me coûter. »

*Veillée de réparation : Lyra III commencera le ch. 17 avec **la moitié de ses PV**. Au matin, Gorr se relève, lentement. Il ne dit rien. Il suit l'équipe, sans qu'on sache pourquoi.*

**Gorr rejoint l'équipe, muet.** `carnet.Q16` reste absente du Carnet. [confiance.gorr −1] **Sa question viendra plus tard (ère IV).**

> **Extrait des archives — Rapport de réaccord, Fonderie, an 312.**
> « Réaccord : échec. Valorisation : échec. Le Golem a quitté la Fonderie de lui-même, en compagnie de l'anomalie. {Si `gorr_question` : *Un Sonneur affirme l'avoir entendu parler. Le Sonneur sera réévalué.*} {Sinon : *Le Golem n'a émis aucun son.*} »
> *(Si `chroniqueur_rejoint` et `gorr_question`, annoté : « Le Sonneur dit vrai. J'étais là. Il a dit "pourquoi". J'ai attendu toute ma vie d'entendre quelqu'un le dire à Vitrelle. Je ne pensais pas que ce serait une montagne de quartz. — C. »)*

*Juste avant de quitter la Fonderie, un tube acoustique de cuivre, au mur, grésille. Une voix d'homme, précise, calme, amusée :*

**Merlin III** (hors champ) — « Intéressant. Il a parlé. Je n'ai pas de colonne pour ça dans mes registres. » *Un temps.* « Montez donc à l'Observatoire, tous. Je préférerais vous mesurer de près. »

## Choix et conséquences

| Choix ou objectif | Drapeaux | Effet plus tard |
| --- | --- | --- |
| ★ Intrication réussie | `gorr_question` = vrai, `carnet.Q16` = `repondue` | Gorr parle (voix de la bible). Argument décisif contre Merlin III au ch. 17. Gorr porte sa question en ères IV et V ; la dernière du jeu (ch. 28) naît de celle-ci. |
| Gorr vaincu | `gorr_question` = faux, confiance.gorr −1 | Gorr muet jusqu'à l'ère IV ; Lyra III affaiblie au ch. 17. **Les rédacteurs de l'ère IV doivent prévoir sa première question.** |
| Pylônes désaccordés sans extraction | — | ◆ si aucun autre Cristal brisé. |
| Pylônes extraits | `cristaux.extraits +1` | Lacunes aux coins de la Fonderie : visibles au ch. 18 (la Fêlure passe par là). |
| Écho désigné = Écho qui réussit | confiance.<lignée> +1 | — |
| Montrer le Carnet à Gorr | confiance.gorr +2 | Au ch. 18, Gorr propose de rendre au monde **une part de lui-même** (option `cristal_rendu` = `gorr`). |

## Récompenses

- **Gorr** rejoint (kit de `content.ts`, titre lore : **Golem minéral**).
- **Habit : Bracelet de quartz** (si `gorr_question`). *Gorr pose la main sur le poignet du héros ; quand il la retire, un anneau de cristal gris-vert y a poussé, sans serrer.* Effet : **+1 Défense physique** ; l'Intrication avec Gorr coûte 1 de recharge en moins.
- **Habit : Tablier de Fonderie** (toujours). *Un tablier de cuir roussi, abandonné près des fours.* Effet : **+1 Défense énergétique** ; résistance au Ralenti des Sonneurs (dure 1 tour de moins).

## Graines pour la suite

- **Gorr** : il vit très longtemps. Il ne descendra pas dans le Puits. **Il attendra le héros à travers les siècles** (ch. 18), et sa parole s'affinera d'ère en ère (bible). Sa première question (« Pourquoi ? ») est l'ancêtre de la dernière (Q28).
- **Merlin III** a entendu. Il invite l'équipe à l'Observatoire (ch. 17) : il veut **mesurer**, pas arrêter.
- **Anthropocentrisme :** le Chroniqueur a écrit, en marge, que « quelqu'un » n'est pas réservé à la chair. Le ch. 17 utilisera Gorr comme argument contre l'idée qu'on peut observer le monde de l'extérieur : Gorr n'a jamais été un instrument, il était déjà dans le système.
- **Arc B :** les Influences du Ghom utilisées sur Gorr pendant ce combat (Distorsion pour le ralentir, Séisme sous lui) sont des Influences sur un futur Écho de l'équipe : elles comptent **déjà** pour `confiance.gorr` (−1 par Influence offensive sur lui). Le joueur ne le sait pas.

## Notes de mise en œuvre

- **Partage de case avec un ennemi :** exception scriptée, activée par l'état Ébranlé. Une infobulle sur la case de Gorr : « Il ne frappe plus en rythme. Quelqu'un pourrait s'approcher. »
- **Action combinée avec un ennemi :** le moteur doit permettre une Intrication dont le partenaire est un ennemi (catalogue « Intriquer » du plan, § 9). Pour Lyra, autoriser le Soin combiné à cibler Gorr.
- **Seuils de PV de Gorr :** 25 % (au-dessus : l'Intrication compte) et 10 % (sommeil). Afficher la barre de PV de Gorr avec une graduation discrète à 25 %.
- **Extraire Gorr :** les Extracteurs le peuvent quand il est en sommeil (il est alors traité comme un Cristal géant). C'est la seule défaite non liée au héros de l'ère.
- **Voix de Gorr :** première ligne de dialogue vocale ou affichée avec un rendu différent (police plus grave, lettres légèrement espacées). Ses répliques n'ont **pas d'article au début**, sont **au présent**, et très courtes (bible).
- **Pas de musique pendant la première question.** Les fours seuls.
