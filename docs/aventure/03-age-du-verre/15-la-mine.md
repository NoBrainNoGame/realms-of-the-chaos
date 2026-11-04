# Chapitre 15 — La Mine

> « Gisement n° 1. Rendement exceptionnel. Aucun jumeau connu. Pulse sans cause identifiée. Extraction programmée. »
> — *Inventaire des Mines du Collège, fiche 1.*

## Fiche

| | |
| --- | --- |
| Ère | III — L'Âge du Verre |
| Lieu | Les Mines du Collège, au flanc de Vitrelle : le monte-charge, les galeries, la galerie qui se tait, la Chambre du Diapason |
| Équipe | Le héros, Lyra III, Eva III ou Squalor III, le Chroniqueur (si `chroniqueur_rejoint`). **Gorr** apparaît (muet, hors équipe). **Brutus III** est présent, d'abord en adversaire, puis occupé ailleurs. |
| Durée visée | 6 nœuds, 1 combat, 1 Lacune |
| Question au Carnet | **Q15** — *Que perd-on quand un lien devient une ressource ?* |

## Ce que le joueur sait en arrivant

- Le Collège extrait les Cristaux d'intrication pour alimenter le Gel ; les archives montrent que les Lacunes ont progressé « depuis l'ouverture du puits de mine n° 3 », et les strates portent des cendres de cristal vingt ans après le Gel.
- Une fiche d'inventaire parle d'un « gisement n° 1 » qui « pulse sans cause ». Le joueur peut deviner que c'est le **Premier Cristal** de l'ère I (`premier_cristal` n'est pas encore posé).
- Selon `transformation.I` : Yeux d'Aube (on voit dans le noir des galeries) ou Peau de cristal (elle **pulse** quand on approche du gisement).

## Synopsis

Les Mines sont l'envers de Vitrelle : là où la cité est propre et immobile, la mine est sale, bruyante, et elle s'effondre lentement. On y envoie les habitants « réaffectés ». On y fait travailler **Gorr**, un organisme minéral énorme, qui croît le long des veines au rythme d'une vibration, **le Diapason**. Il ne parle pas, ne se retourne pas, n'a pas l'air de savoir qu'il existe. Au fond, dans la Chambre du Diapason, le Premier Cristal sert d'**étalon** : c'est sa pulsation, d'une régularité parfaite, qui donne le rythme à toute la mine. Pour arrêter la mine, il suffit de le briser. Pour le sauver, il faut le détacher, l'emporter, et laisser la mine continuer. Pendant ce temps, la mine s'effondre, et Brutus III tient une galerie à bout de bras pour que ses mineurs sortent.

## Carte du chapitre

```
[1 Rencontre : le monte-charge]
        │
[2 Rencontre : les réaffectés]  → première vue de Gorr (muet)
        │
[3 Lacune : la galerie qui se tait]  → recoudre / élargir / habiter
        │
[4 Veillée : sous les étais]
        │
[5 Combat (fin de chapitre) : la Chambre du Diapason]  → `premier_cristal`, `mine_arretee`
        │
[6 Fin : la poussière]  → Q15 entre au Carnet
```

## Scènes

### 1. Le monte-charge (Rencontre)

*Une cage de verre et de cuivre qui descend le long d'une paroi. À mesure qu'elle descend, le verre devient sale, rayé, puis disparaît : en bas, il n'y a que de la roche et des étais de bois. Il fait chaud. C'est la première chaleur de l'ère.*

> **Extrait des archives — Règlement des Mines, article 2.**
> « Les Mines sont un lieu de travail. Le bruit y est toléré. »
> *(Si `chroniqueur_rejoint`, annoté : « Toléré parce qu'on ne l'entend pas d'en haut. — C. »)*

**Le Chroniqueur** (s'il est là) — « Je n'étais jamais descendu. J'ai pourtant rédigé quarante-trois rapports sur les Mines. Ils étaient très bien écrits. »

**Lyra III** — « Il fait chaud. Ça sent quelque chose. Le sel, la sueur… On dirait une ville vivante. »

*Si `transformation.I` = `A` (Yeux d'Aube) : le héros voit, à travers les parois, des centaines de lueurs pâles qui battent par deux, comme des cœurs. Une seule bat seule, très loin en bas, plus fort que les autres.*
*Si `transformation.I` = `B` (Peau de cristal) : la peau des avant-bras du héros se met à pulser, lentement. Personne d'autre ne le remarque. Eva III, si elle est là : « Ton bras. Il bat à une fréquence de… zéro virgule huit. Exactement. Exactement, c'est rare. »*

### 2. Les réaffectés (Rencontre)

*Une galerie large. Des mineurs, en silence, détachent des Cristaux à la pince et les posent dans des caisses capitonnées. Plus loin, une forme immense avance dans la roche : un corps de cristal gris-vert, aux facettes émoussées, haut de trois hommes. Il ne creuse pas : il **pousse**. Le cristal de son corps croît dans les fissures, élargit la roche, et la roche cède. Derrière lui, deux Sonneurs frappent des diapasons de verre, en mesure. Chaque coup, la forme s'avance d'un pas.*

**Garance** (une mineuse, autrefois verrière à la Haute-Ville) — « Vous n'êtes pas réaffectés, vous. Ça se voit : vous regardez autour de vous. »

1. « Qu'est-ce que c'est ? » *(désigner la forme)* → **Garance** — « Le Golem. Gorr, disent les vieux. Il est là depuis avant le Gel. Avant les mines, même. Il croît, c'est tout ce qu'il fait. Le Collège a trouvé comment le faire croître dans la bonne direction. » *Elle montre les Sonneurs.* « Le Diapason. Il suit le rythme. »
2. « Pourquoi êtes-vous ici ? » → **Garance** — « J'ai soufflé un carreau avec une bulle. » *Elle hausse les épaules.* « Une seule. Pour voir. » *Si le héros a rouvert la question d'Odile au ch. 13 :* « Odile, à l'atelier d'à côté, m'a regardée faire. Elle a eu l'air… je ne sais pas. Contente ? »
3. « Où vont les Cristaux ? » → **Garance** — « En haut. Au Gel. On les casse là-haut, on ne les casse jamais ici. Ici, on les détache. On n'est pas des brutes. » *Un rire sans joie.*

**Gorr** ne se retourne pas. *Le héros peut s'approcher.*

1. *Toucher son flanc.* → *Le cristal est tiède, comme une pierre au soleil. Sous la main, une vibration très lente, qui n'est pas celle du Diapason : la sienne. Gorr ne s'arrête pas. Une facette, sous les doigts du héros, s'épaissit d'un cheveu.* [confiance.gorr +1]
2. *Se mettre devant lui.* → *Gorr avance. Il ne frappe pas, il pousse. Le héros doit s'écarter.* **Sonneur** — « Ne gênez pas le Golem, il ne sait pas qu'il vous écrase. »
3. *Le laisser.* → **Lyra III** — « Il est vivant, tu crois ? » **Le Chroniqueur** — « Mes fiches disent "outillage". » *Un temps.* « Mes fiches disaient aussi que vous étiez une statue. »

> **Extrait des archives — Fiche d'outillage n° 7, « Golem (dit Gorr) ».**
> « Formation cristalline autonome. Croissance : 4 doigts par jour sous Diapason, 1 doigt sans. Se répare seul en cas de fêlure. Ne mange pas. Ne dort pas. Ne demande rien. Rendement : excellent. »

*(Ce que la fiche décrit sans le dire : un être qui se maintient en puisant dans un flux d'énergie, la chaleur des profondeurs, et qui répare lui-même sa forme. Un vivant.)*

### 3. La galerie qui se tait (Lacune)

*Un embranchement où le bruit s'arrête net. Ni chaleur, ni courant d'air, ni écho. Au milieu de la galerie, une Lacune : un trou dans le monde, d'un gris qui n'est pas une couleur, aux bords qui s'effilochent. Une rangée de logements de cristaux vides la borde. On a tout extrait ici, puis on a muré.*

**Lyra III** — « C'est ça, une Lacune ? On dirait… une pièce où personne n'est jamais entré. »
**Eva III** — « Aucun écho. Le son ne revient pas. Je ne peux rien calculer là-dedans. Ça me déplaît fortement. »
**Squalor III** — « Ça sent rien. Rien du tout. Même le vide sent quelque chose, d'habitude. »

*Énigme de placement sur une petite carte (5 × 5, la Lacune au centre, rayon 1). Trois résolutions possibles :*

1. **Recoudre** (Ordre) : placer trois Échos sur trois bords différents de la Lacune et **agir** chacun deux tours de suite (n'importe quelle action, même un Soin à vide). Les interactions redonnent du Tissu : la Lacune se referme. [`lacunes.recousues +1`] Coût : chaque Écho subit 2 points de PV d'Usure pour le chapitre (froid).
   - **Lyra III** — « On la réchauffe. Comme un malade. Ça coûte, bien sûr. »
2. **Élargir** (Chaos) : briser un Cristal de la veine murée voisine. La Lacune s'étend, ronge le mur, et ouvre un raccourci vers la Chambre du Diapason (le combat commence avec l'équipe plus près de l'étalon). [`lacunes.elargies +1`, `cristaux.extraits +1`, Élan +2 au début du combat]
   - **Squalor III** — « Un trou de plus. Mais un trou qui mène quelque part. »
3. **Habiter à deux** (Intrication) : deux Échos sur la **même case** du bord, en Intrication (l'action combinée réussie depuis cette case). Tant qu'ils y restent, la Lacune ne grandit plus et laisse passer un chemin ténu. [`lacunes.habitees +1`] Ils doivent y rester deux tours : la Garde, plus loin, entend le silence se rompre, et le combat final commence avec un Arbalétrier de plus.
   - Si c'est le héros et Lyra III : **Lyra III** — « C'est étrange. Là, au bord, j'existe plus fort. Parce que tu es là. » [confiance.lyra +1]

*Si l'équipe passe sans rien faire, la Lacune reste. Aucun drapeau.*

### 4. Sous les étais (Veillée)

*Une galerie abandonnée, étayée de poutres. Une lampe à huile : Lyra n'en veut pas d'autre.*

**Sujets de veillée** (deux au choix) :

- **Lyra III et l'extraction.** « Quand je soigne, je prends de l'ordre en moi et je le donne. Je fatigue. C'est le prix, et je le vois. Eux, ils prennent l'ordre dans les Cristaux, c'est-à-dire dans les liens d'autrefois, et ils ne voient pas le prix. Il tombe sur les galeries qui se taisent. »
  1. « Tout soin coûte quelque chose. » → **Lyra III** — « Oui. Toujours. La seule question, c'est qui paie. » [confiance.lyra +1]
  2. « Et si les Cristaux étaient la seule solution ? » → **Lyra III** — « Alors il faudrait au moins savoir qu'on emprunte. Et à qui. »
- **Le Chroniqueur et Gorr.** « Une fiche d'outillage, sur un être qui se répare seul. Je l'ai relue trois fois. Dans mon métier, une chose qui se répare seule, c'est… une archive vivante. Si on la casse, rien n'en reste. Si on la laisse, elle dit ce qu'elle a traversé. »
- **Eva III et le rythme.** « Le Diapason bat à zéro virgule huit. Le gisement n° 1 aussi, d'après la fiche. Ce n'est pas un hasard : c'est lui qui donne la mesure. On a mis le cœur d'un monde dans une horloge. »
- **Squalor III et la faim.** « Le Golem ne mange pas. Il croît sur la chaleur, comme une flamme. Moi je mange. On n'est pas si différents : on dure parce que quelque chose passe à travers nous. » *Un temps.* « Lui, au moins, il ne se demande pas pourquoi. »

**Le Premier Cristal, avant le combat.** *Le héros sait désormais où est le gisement n° 1.*

**Lyra III** — « Si c'est ton Cristal, celui de ta légende… qu'est-ce qu'il y a dedans ? »

**Le Chroniqueur** (s'il est là, sinon Garance) — selon `premier_cristal.lieu` :
- `cairn` : « La fiche dit qu'on l'a trouvé en l'an 3 du Gel, quand les eaux ont baissé, en perçant une butte sur la Couture. Sous la vase, il y avait des pierres empilées. Quelqu'un l'avait mis à l'abri, il y a très longtemps. Le Collège a noté : "amas naturel". »
- `lacune` : « La fiche dit qu'on l'a trouvé en sondant sous la Couture, parce qu'il pulsait. Il était pris dans la roche comme un nœud dans un fil. Quand on l'a dégagé, la Couture a commencé à se défaire autour du puits. C'est la première Lacune de la Mine. Le Collège a noté : "incident d'extraction". »
- Dans les deux cas : « Premier gisement ouvert par le Collège. D'où le numéro un. On a creusé la mine autour de lui. » *(Si `premier_cristal.paire` = `heros+nyx` : « La fiche note deux corrélations dominantes, "d'origine inconnue, dont une sans lien avec cette île". »)*

1. « Les liens de ceux que j'ai connus. » → **Le Chroniqueur** (s'il est là) — « Pas leurs souvenirs. Je préfère le dire avant qu'on en fasse une légende de plus. Des corrélations : des états qui restent accordés, deux à deux, à l'intérieur du cristal. Il est son propre jumeau. C'est pour ça que le Collège ne lui trouve pas de paire. »
2. « Je ne sais pas. » → **Lyra III** — « Alors on ira voir. »

## Combats

### Combat — La Chambre du Diapason (fin de chapitre)

**Carte :** le fond de la mine. Au nord, sur une estrade (`2`), la Chambre du Diapason : un pylône de cuivre massif (`D`) qui vibre, et, enchâssé dans un socle à côté, **l'étalon : le Premier Cristal** (`P`). Le centre est un dédale de creux (`a`, `b`) et de piliers (`#`). Au sud, le monte-charge (sortie, cases `1` de la dernière ligne). Dans les coins sud, des galeries inondées (`~`, `w`). **Le relief bouge** au fil du combat (Séismes scriptés de la mine).

```
##1.....1##.
#1...22...1#
1...2..2...1
..a......a..
.aba.##.aba.
..a......a..
.....11.....
~~.........~
w~...11...~w
```

Surcouche (`H` héros, `L` Lyra III, `E` Eva III ou Squalor III, `C` le Chroniqueur, `P` le Premier Cristal, `D` le pylône du Diapason, `S` Sonneur, `G` Hallebardier, `X` Extracteur, `R` Gorr, `M` mineur, `B` Brutus III, `*` Cristal de veine) :

```
##1.....1##.
#1...PD...1#
X...S..S...1
...G....G..R
.aba.##.aba.
*.a......a.*
...*.11.*...
~~M......MB~
w~..EHLC..~w
```

- Paires de Cristaux de veine : (0,5) et (11,5) ; (3,6) et (8,6).
- Le Premier Cristal n'a pas de jumeau sur la carte : **il est son propre jumeau**. L'extraire n'ouvre pas une Lacune sur une autre case, mais une Lacune de **rayon 2** autour du socle, aussitôt.
- Variante « Élargir » (nœud 3) : l'équipe commence sur la ligne 5 au lieu de la ligne 8.

**Équipes :**
- **Alliés :** le héros, Lyra III, Eva III ou Squalor III, le Chroniqueur (s'il a rejoint).
- **Ennemis :** 2 Sonneurs, 2 Hallebardiers, 1 Extracteur (+1 Arbalétrier si la Lacune a été habitée). **Temps 40 :** un troisième Sonneur arrive par le monte-charge, porteur d'un **étalon de secours**.
- **Gorr :** force neutre, **non ciblable** dans ce chapitre (« trop dense pour être blessé par vos armes »). Il obéit au Diapason (voir événements).
- **Brutus III et 2 mineurs** (`M`) : neutres.

**Objectifs :**
- **Principal :** **faire taire le Diapason**. Deux façons :
  - **briser l'étalon** (action Extraire sur le Premier Cristal) : le Diapason se tait aussitôt, définitivement ; gain d'extraction **doublé** (Élan au maximum, **et** soin de 6 à toute l'équipe) ; [`premier_cristal` = `perdu`, `mine_arretee` = vrai, `cristaux.extraits +1`] ;
  - **détacher l'étalon** (action **Détacher** : temps 1, trois fois, par un ou plusieurs alliés adjacents au socle) : le Diapason se tait **jusqu'à ce qu'un Sonneur pose l'étalon de secours** sur le pylône (le troisième Sonneur, arrivé au temps 40, doit atteindre une case adjacente à `D` et y passer une action). Si on l'en empêche jusqu'à la fin, `mine_arretee` = vrai.
- **★ Annoncé : Sauver le Premier Cristal.** Le détacher et le **porter jusqu'au monte-charge** (cases `1` de la ligne 8). Le porteur est **Ralenti** tant qu'il le porte et ne peut pas utiliser Course ; il peut le passer à un allié adjacent (action, temps 0,5). [`premier_cristal` = `sauve`, `cristaux.gardes +1`]
  - L'infobulle du ★ dit seulement : « Plus important que l'objectif principal. »
- **◆ Caché :** aider les mineurs : un allié qui finit son tour adjacent à un mineur le fait suivre jusqu'au monte-charge. Les deux mineurs sortis. [confiance.brutus +2 ; confiance +1]
- **Fin du combat :** au **temps 75**, la Chambre s'effondre : le combat se termine quoi qu'il arrive. Un allié qui n'est pas sur la ligne 6 ou au-delà au temps 75 s'en sort quand même, mais subit l'Usure de l'effondrement (pour le héros : `usure +1`).
- **Défaite :** le héros se disperse.

**Le relief mouvant (Séismes de la mine) :**

| Temps | Changement |
| --- | --- |
| 15 | Les deux piliers centraux (5,4) et (6,4) s'effondrent en creux `b` : le passage direct vers le nord s'ouvre. |
| 30 | Les creux ouest (colonnes 1 à 3, lignes 3 à 5) remontent au niveau 0 ; les creux est se creusent d'un niveau (`a` → `b`, `b` → `c`). |
| 45 | La ligne 7 s'affaisse d'un niveau (`.` → `a`), sauf les galeries inondées. Le chemin du retour devient plus lent. |
| 60 | La ligne 2 se fend : (4,2) et (7,2) tombent à `a`. L'estrade se coupe en deux. |
| 75 | Effondrement final. |

Un combattant sur une case qui change de hauteur de 2 niveaux ou plus subit 4 dégâts physiques.

**Événements scriptés : Gorr et le Diapason.**
- Tant que le Diapason bat, Gorr avance d'une case par battement (toutes les 10 unités de temps) vers la cible que lui désignent les Sonneurs : la case occupée par l'allié le plus proche d'un Sonneur.
- Un battement sur deux, Gorr frappe : une case est **marquée** un battement à l'avance (lueur verte), puis Gorr y porte un **Écrasement** (dégâts physiques 9 en losange de rayon 1, alliés et ennemis compris), qui creuse la case d'un niveau.
- **Si le Diapason se tait :** Gorr s'arrête net. Il ne bouge plus jusqu'à la fin du combat. Il **tourne la tête**, pour la première fois, vers le héros.
- **Si tous les Sonneurs présents sont hors de combat :** Gorr s'arrête aussi, mais le Diapason continue de battre à vide (l'objectif principal n'est pas rempli pour autant).

**Événements scriptés : Brutus III.**
- **Temps 0 :** Brutus est au sud-est, près des mineurs. **Brutus III** — « Encore toi. Je n'ai pas le temps. La mine tombe. »
- **Temps 30** (après le deuxième Séisme) : il cale son bouclier sous une poutre au-dessus des mineurs et ne bouge plus. **Brutus III** — « Je tiens. Je tiens tant qu'ils ne sont pas sortis. » *Il ne combat plus jusqu'à la fin.*
- **Si un allié aide un mineur :** **Brutus III** — « … Merci. » *Puis, plus bas :* « Je n'ai jamais dit merci à un fugitif. Ce n'est pas au règlement. »
- **Si le héros brise l'étalon :** **Brutus III** — « Tu as cassé le cœur de la mine. Elle va se taire. Mes mineurs vont rentrer chez eux. » *Un temps.* « Et le Gel, qu'est-ce qu'il va manger, maintenant ? »

**Répliques de combat :**
- **Lyra III** (début) — « Le Cristal, là-haut. Il bat. Tu le sens ? »
- **Eva III** — « Le Golem frappe un battement sur deux. Fenêtre de dix. Je compte pour vous. »
- **Squalor III** (dans l'eau) — « Ces galeries noyées, c'est chez moi. Si quelqu'un doit sortir par le bas, il me suit. »
- **Le Chroniqueur** — « Je note que je suis dans une mine qui s'effondre. Je note que je continue de noter. Ça doit être un réflexe. »
- **Sonneur** — « Avance, Golem. Avance. Tu ne sais rien faire d'autre. »
- **Le héros touche le Premier Cristal** (première action Détacher, ou première action adjacente) : *Une pulsation passe dans ses mains. Pas des images : un accord, comme deux cordes qui vibrent ensemble. Si `transformation.I` = `B`, sa peau répond au même rythme.* **Lyra III** — « Tu trembles. » 

## 6. La poussière (Fin)

*Le monte-charge remonte dans la poussière. En bas, la Chambre s'effondre. Selon l'issue :*

**Si `premier_cristal` = `sauve` :** *Le Cristal est dans les bras du héros, enveloppé dans le manteau de Lyra. Il pulse lentement.*
- **Lyra III** — « Il est lourd ? »
- Choix : 1. « Non. » 2. « Oui. » *(Aucun effet. Les deux sont vrais.)*
- Si `mine_arretee` est faux : *au fond, le Diapason reprend, plus aigu, sur l'étalon de secours.* **Eva III** — « Zéro virgule quatre-vingt-trois. Faux. Il bat faux, maintenant. » **Le Chroniqueur** — « La mine continue. Mais elle continue moins bien. C'est déjà une information. »

**Si `premier_cristal` = `perdu` :** *Il n'y a plus de pulsation. À la place du socle, une Lacune de deux pas de large, grise, muette. La mine se tait, toute entière.*
- **Lyra III** — « On a arrêté la mine. » *Un temps.* « Avec ce qu'il y avait de plus précieux dedans. »
- Si `transformation.I` = `B` : *La peau du héros ne pulse plus. Elle reste froide pendant tout le reste de l'ère.*

**Dans tous les cas :** *Avant que la cage ne s'élève, le héros voit Gorr, immobile dans la poussière, au milieu des décombres. Il ne pousse plus. Il a l'air d'écouter quelque chose qui n'est plus là. Puis la paroi le cache.*

**Q15 entre au Carnet :** *Que perd-on quand un lien devient une ressource ?* [`carnet.Q15` = `ouverte`]
**Lyra III** — « Le Collège dirait : rien, on gagne de la chaleur. » *Elle regarde le Cristal, ou la Lacune.* « Moi, je ne sais pas encore. Je crois qu'on perd quelque chose qu'on ne sait pas mesurer, et que c'est pour ça qu'ils disent rien. »

> **Extrait des archives — Rapport d'incident, Mines, an 312.**
> « Effondrement partiel de la Chambre du Diapason. Pertes humaines : {0 si les deux mineurs sont sortis, sinon le nombre}. Pertes matérielles : l'étalon. {Si `perdu` : *détruit lors d'une extraction non autorisée*} {si `sauve` : *soustrait par l'anomalie*}. Le Golem ne répond plus au Diapason. Une équipe de Sonneurs est envoyée pour le reprendre en main. »
> *(Si `chroniqueur_rejoint`, annoté : « "Ne répond plus" : première fois qu'on emploie ce verbe pour lui. "Répondre" suppose qu'il y avait quelqu'un. — C. »)*

## Choix et conséquences

| Choix ou objectif | Drapeaux | Effet plus tard |
| --- | --- | --- |
| Toucher Gorr au nœud 2 | confiance.gorr +1 | Au ch. 16, Gorr hésite une fois avant de frapper le héros. |
| Lacune : recoudre / élargir / habiter | `lacunes.recousues` / `lacunes.elargies` (+ `cristaux.extraits +1`) / `lacunes.habitees +1` | Arc A, fins. |
| Briser l'étalon | `premier_cristal` = `perdu`, `mine_arretee` = vrai, `cristaux.extraits +1` | Plus d'étalon à rendre au ch. 18 ; la mine se tait (moins de Lacunes nouvelles sur la carte du monde) ; argument de Merlin III au ch. 17 (« Vous aussi, vous avez extrait »). |
| Sauver le Premier Cristal | `premier_cristal` = `sauve`, `cristaux.gardes +1` | Option « rendre le Premier Cristal » au ch. 18 ; argument contre Merlin III. |
| Sauver et empêcher le recalage | `premier_cristal` = `sauve`, `mine_arretee` = vrai | Les deux. Rare, voulu. |
| ◆ Mineurs sortis | confiance.brutus +2, confiance +1 | Portes ouvertes plus probables au ch. 18. |
| Q15 | `carnet.Q15` = `ouverte` | Réponse au ch. 18. |

## Récompenses

- **Habit : Casque de galerie.** *Un casque de cuir bouilli, cabossé, avec une encoche pour la lampe, pris à un étai.* Effet : **+2 Défense physique** ; immunité aux dégâts de changement de relief (Séismes scriptés, ennemis ou Influence).
- **Si `premier_cristal` = `sauve` : le Premier Cristal** (objet). *Gros comme deux poings, tiède, il bat à zéro virgule huit.* Gardé (`cristaux.gardes +1`) : tant qu'il est dans l'inventaire, l'**Intrication** entre le héros et l'Écho de plus haute Confiance coûte 1 de recharge en moins.
- **Si `premier_cristal` = `perdu` : Éclat d'étalon.** *Un éclat ramassé au bord de la Lacune, terne, qui ne pulse plus.* Effet : aucun. Description seule : « Il ne bat plus. On le garde quand même. »

## Graines pour la suite

- **Gorr** ne répond plus au Diapason de la mine. Le Collège va le « reprendre en main » avec des Sonneurs et des pylônes (ch. 16). Il a tourné la tête vers le héros.
- **Arc H :** le Premier Cristal sauvé est le candidat évident au « Cristal rendu » du ch. 18 ; c'est voulu : il faudra choisir entre le garder et le rendre.
- **Arc A :** si `mine_arretee`, la carte du monde montre une tache de Lacune qui **cesse de grandir** sous Vitrelle. Sinon, elle grandit d'un cran par chapitre jusqu'au ch. 18.
- **Brutus III** a tenu une poutre au lieu d'un mur. Première fissure dans « tout figer pour protéger » : il a protégé quelque chose qui bougeait.
- **Garance** (la mineuse à la bulle) réapparaît au ch. 18 parmi les évacués.

## Notes de mise en œuvre

- **Relief mouvant :** changements de hauteur scriptés au temps T (même système que le Séisme, appliqué à une liste de cases). Afficher un avertissement visuel (poussière qui tombe) 5 unités de temps avant.
- **Gorr, force neutre :** entité non ciblable, au comportement scripté (avance, marque, frappe) ; ses frappes touchent tout le monde. Son **arrêt** est un état visible : il cesse de luire au rythme du Diapason.
- **Le Premier Cristal :** entité-objet ; actions **Détacher** (trois fois) et **Porter / Passer** ; le porteur reçoit l'état Ralenti tant qu'il porte. L'extraction de l'étalon applique la règle « propre jumeau » (Lacune de rayon 2 immédiate).
- **Étalon de secours :** objet porté par le troisième Sonneur ; si le Sonneur est mis hors de combat, l'objet tombe sur sa case ; un autre ennemi peut le ramasser (IA : priorité haute).
- **Fin au temps 75 :** condition de fin indépendante du vainqueur ; le bilan liste ce qui a été accompli.
- **Pas de musique de victoire** si le Premier Cristal est brisé : un silence, puis le bruit de la mine qui s'arrête.
