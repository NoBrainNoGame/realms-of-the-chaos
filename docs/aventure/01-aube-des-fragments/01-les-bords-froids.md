# Chapitre 1 — Les bords froids

> **Lyra** — « Ici, il ne se passe plus rien. Alors je m'arrange pour qu'il se passe quelque chose. »

## Fiche

| | |
| --- | --- |
| Ère | I — L'Aube des Fragments |
| Lieu | Les bords froids, frange orientale de l'île natale ; la Borne de Demeure |
| Équipe | Le héros ; **Lyra I rejoint** (dès le combat) |
| Durée visée | 5 nœuds, 1 combat |
| Question au Carnet | Q01 — *Que devient une chose quand plus rien ne la touche ?* |

## Ce que le joueur sait en arrivant

Le héros s'est éveillé dans une prairie, sans nom ni souvenir. Il a appris qu'un lieu où rien ne se passe pâlit puis s'effiloche, qu'une chose venue du bord s'est fixée en galet quand il l'a touchée, et qu'une présence (le Ghom) s'est posée sur lui et sur la prairie au lever du jour. Il porte un Carnet d'écorce où est écrit : *Pourquoi suis-je là ?*

## Synopsis

En suivant la lisière vers l'est, le héros trouve une pierre gravée qui promet que, passé ce point, « rien ne bouge, et c'est bien ». Au-delà, sur les bords froids, une femme agenouillée entretient un petit feu, gratte la terre et y jette des graines, alors que l'herbe autour d'elle est grise et que le bord s'en va en fils dans le Clair. C'est Lyra. Elle « entretient » trois endroits pour qu'ils restent vivants, et des Lacunaires remontent vers eux, attirés par la chaleur. Le héros l'aide à tenir les trois zones, découvre ce que le Ghom peut faire (pousser la terre, tordre le temps) et ce que cela coûte. Le soir, à la veillée, Lyra raconte pourquoi elle a quitté Demeure, et la question du chapitre entre dans le Carnet. Le lendemain, elle part vers le nord, là où le bord avance le plus vite, et le héros la suit.

## Carte du chapitre

```
[1 Rencontre : La Borne] → [2 Rencontre : La femme au feu] → [3 Combat : Tenir les bords]
→ [4 Veillée : Le feu de Lyra] → [5 Fin : Le départ vers le nord]
```

Aucun embranchement. Le nœud 1 est facultatif dans sa lecture (on peut passer devant la Borne sans la lire), mais il est toujours sur le chemin.

## Scènes

### 1. La Borne (Rencontre)

*Une pierre levée au bord du chemin, là où l'herbe verte devient grise. Le texte complet est la **Chronique d'ouverture** de l'ère (voir [`README.md`](README.md)).*

1. *Lire la Borne.* → Chronique d'ouverture, puis la narration du héros. [borne_lue = vrai (local au chapitre)]
2. *Passer sans lire.* → **Narration** — *« Une pierre avec des mots. Je n'ai pas le temps : là-bas, il y a de la fumée. »*

### 2. La femme au feu (Rencontre)

*Les bords froids. L'herbe est grise et raide, couverte d'une rosée qui ne sèche pas. Pas un insecte. Au loin, le sol se défait : ses derniers mètres sont flous, comme vus à travers une vitre sale, et derrière il n'y a que le Clair. Au milieu de ce silence, un petit feu, très vivant. Une femme y est agenouillée. Elle remue la terre avec un bâton, souffle sur une poignée de graines, les jette, puis se lève pour aller verser l'eau d'une gourde dans une rigole qu'elle a creusée. Elle ne s'arrête jamais longtemps au même endroit.*

**Lyra** — « Ne reste pas planté là. Ici, on ne reste pas planté. »

*Elle ne se retourne même pas.*

**Lyra** — « Si tu veux être utile, va piétiner les semis, là-bas. Piétiner doucement. Il faut que la terre sente quelque chose. »

**Choix du héros :**

1. « Tu as besoin d'aide ? » [confiance.lyra +1]
   **Lyra** — « Tout le monde a besoin d'aide, aux bords. Les bords plus que tout le monde. »
2. « Qu'est-ce que tu fais ? »
   **Lyra** — « Je fais en sorte qu'il se passe quelque chose. Du feu, de l'eau qui coule, des graines qui germent, des pieds qui marchent. Tant que ça bouge, ça tient. Quand plus rien ne bouge… » *Elle désigne le bord flou.* « Ça. »
3. *(si la Borne a été lue)* « C'est toi, "L." ? » [confiance.lyra +1]
   *Lyra s'arrête, pour la première fois. Elle rit, un rire bref.*
   **Lyra** — « On l'a encore pas effacée, alors. Tant mieux. Oui. J'ai mesuré, j'ai écrit. Ils ont dit que j'avais abîmé la pierre. J'ai dit que la pierre avait tort. »

*Quel que soit le choix :*

**Lyra** — « Tu viens d'où, toi ? »

1. « D'une prairie. Au sud. Je me suis réveillé ce matin. »
2. « Je ne sais pas. »

**Lyra** — « Ce matin. » *Elle le regarde enfin, de haut en bas, comme on évalue une plaie.* « Tu n'as pas froid, au moins. C'est déjà ça. Bon. Tu as des jambes, j'ai trois endroits à garder vivants et je n'ai que deux jambes. Fais le compte. »

*Un craquement sec, du côté du bord. Une forme se détache des fils du sol : une flaque, puis un caillou, puis une touffe d'herbe gelée, puis rien de précis. Elle glisse vers le feu.*

**Lyra** — « Et voilà les visiteurs. »

1. « Qu'est-ce que c'est ? »
   **Lyra** — « Des Lacunaires. Ce qui sort du bord quand il se défait. Ils ne sont pas méchants, ils sont froids. Ils viennent vers nous comme les papillons de nuit vers la lampe. Sauf que la lampe, c'est nous, et qu'ils nous prennent notre chaleur. »
2. *(si `lacunaire_approche`)* « J'en ai touché un, ce matin. Il est devenu un galet. »
   **Lyra** — « Il s'est décidé, oui. C'est ce qu'ils font quand on les touche assez fort. Ils deviennent une seule chose, et c'est rarement une chose vivante. » *Un temps.* « Tu l'as laissé venir près de toi d'abord ? » *Le héros acquiesce.* « Hm. Tu es soit très doux, soit très bête. On verra. »

### 4. Le feu de Lyra (Veillée)

*Le soir. Le feu, le seul point chaud à des centaines de pas. Lyra raccommode un pan de sa cape avec une aiguille d'os. Le héros a son Carnet sur les genoux. Derrière eux, le bord est un peu moins flou qu'à midi : ce qui a été tenu a tenu.*

**Lyra** — « Trois endroits sur trois. » *(ou « deux sur trois », « un sur trois », selon `zones_bords_froids`)* « Demain, il faudra recommencer. Après-demain aussi. C'est ça, entretenir : ce n'est jamais fini. »

*Le héros peut ouvrir des sujets dans l'ordre qu'il veut. Chaque sujet écouté jusqu'au bout compte comme une **écoute** (voir Notes).*

**Sujet A — Demeure.**

**Lyra** — « Je viens de Demeure. Un village, à l'ouest, derrière la colline aux pierres. Des gens bien. Des gens qui ont décidé que tout ce qui change se perd, et que donc il ne faut rien changer. Ils ne plantent plus : planter, c'est changer la terre. Ils ne bâtissent plus. Ils ne réparent même plus : réparer, c'est changer, disent-ils. »

**Lyra** — « Ils ont raison, c'est ça le pire. Réparer, c'est changer. C'est pour ça que je répare. »

1. « Tu leur manques ? » [confiance.lyra +1]
   **Lyra** — « Je manque à mon frère, peut-être. Il garde les murs. Il garde tout, d'ailleurs. Il me garderait aussi, si je le laissais faire. »
2. « Ils ont peut-être raison de tout garder. »
   **Lyra** — « Peut-être. Va leur dire. Tu les trouveras assis. »

> Note : le « frère » de Lyra est Brutus I. Ce n'est pas dit ici ; Brutus le confirmera au chapitre 3. Dans l'Archipel, les noms se transmettent par lignée et par fonction, pas par le sang : Lyra et Brutus sont nés dans la même maison, de lignées différentes.

**Sujet B — Le Ghom.** *(seulement si le Ghom a utilisé au moins une Influence pendant le combat)*

**Lyra** — « Le rocher qui est sorti de terre, tout à l'heure. Et ce Lacunaire qui s'est mis à bouger comme dans de la mélasse. C'était ton… ce qui t'accompagne ? »

1. « Je ne sais pas ce que c'est. »
   **Lyra** — « À Demeure, on l'appelle le Ghom. On dit qu'il ne bouge pas, qu'il est au-delà du temps, et que c'est pour ça qu'il faut lui ressembler. » *Elle tisonne le feu.* « Moi, je dis qu'un rocher vient de sortir de terre, et que ça a coûté quelque chose à quelqu'un. Rien ne sort de terre gratuitement. »
2. « Il m'a touché. Ce matin. »
   **Lyra** — « Touché. » *Elle pèse le mot.* « Alors il n'est pas si immobile que ça. Ne le dis pas trop fort à Demeure. »

**Sujet C — Les bords.**

**Lyra** — « Le bord avance d'un pas chaque printemps. J'ai planté des piquets, il y a quatre ans. Le premier est dans le Clair, maintenant. Le deuxième est à moitié flou. Il penche, et on ne sait pas vers quoi. »

**Lyra** — « Là où rien ne passe, rien ne chauffe, rien ne pousse, rien ne frotte contre rien… le sol a l'air d'oublier qu'il est là. Pas d'un coup. Il devient… moins sûr. Et puis il n'y a plus de sol. »

*Le héros sort le Galet tiède de sa poche, ou montre le bord. Il ouvre le Carnet.*

**Choix du héros** (la question s'écrit dans tous les cas) :

1. « Que devient une chose quand plus rien ne la touche ? » [carnet.Q01 = ouverte]
2. « Où va le sol, quand il s'en va ? » [carnet.Q01 = ouverte]
   *Le héros écrit, puis corrige, sous le regard de Lyra : « Que devient une chose quand plus rien ne la touche ? »*

**Lyra** — « Je ne sais pas. » *Un temps.* « Je déteste dire ça. Mais je ne sais pas. Je sais seulement que ça avance d'un pas par printemps, et que je n'ai que deux jambes. »

> Note d'écriture : Lyra ne donne **aucune** réponse, même fausse. La réponse arrive au chapitre 20, par Nyx IV. Q01 est une question tardive, pas une question ouverte : pas de réponse tentante ici.

*Sujet facultatif :* **Sujet D — La cape.** *(toujours disponible à la fin)*

**Lyra** — « Tiens. » *Elle lui tend la cape qu'elle raccommodait.* « Je la gardais pour quelqu'un qui aurait froid aux bords. Tu as l'air de quelqu'un qui va avoir froid aux bords. »

1. « Merci. » [confiance.lyra +1]
2. « Garde-la, c'est toi qui as froid. »
   **Lyra** — « J'ai froid depuis quatre ans. Une cape de plus ne changera rien. Prends-la, et ne discute pas avec une soigneuse. » *(le héros reçoit la cape quand même, sans gain de Confiance : Lyra apprécie, mais elle n'aime pas qu'on lui dise ce qu'elle ressent)*

### 5. Le départ vers le nord (Fin)

*L'aube. Lyra a déjà éteint le feu et enterré les braises « pour que la terre ait chaud encore un peu ». Elle regarde vers le nord, où le bord fait une avancée plus nette, une sorte de baie de gris dans le vert.*

**Lyra** — « Là-haut, ça avance plus vite. Il y a un endroit où le bord est entré presque jusqu'aux arbres. Je vais essayer quelque chose. Quelque chose de bête et de fatigant. »

1. « Je viens avec toi. » [confiance.lyra +1]
2. « Quel genre de chose ? »
   **Lyra** — « Le genre de chose qu'on ne fait qu'une fois par an, parce que ça coûte trop cher. Viens, tu verras. »

**Narration** — *Je ne sais pas pourquoi je suis là. Mais aujourd'hui, je sais où je vais : derrière elle.*

## Combats

### Tenir les bords

- **Carte :** la frange orientale de l'île, 9 colonnes sur 9. À l'est, les colonnes 7 et 8 sont grises (frange) : on peut y marcher, mais c'est par là qu'arrivent les Lacunaires et c'est là que la carte rétrécit. Trois zones à garder actives.

```
.........
..1......
.121..~..
..1..~~..
.........
...a.....
.......~.
.1....~~.
.........
```

  - **Zone 1 — le Feu :** cases (1,1) à (3,3), autour du foyer de Lyra (le foyer est en (2,2), sur la butte).
  - **Zone 2 — la Rigole :** cases (5,2) à (7,4), autour de l'eau que Lyra fait couler.
  - **Zone 3 — les Semis :** cases (5,6) à (7,8).
  - **Départs :** le héros en (3,4), Lyra en (2,3).
  - **Frange :** colonnes 7 et 8. Pour chaque point manquant à `zones_prologue` (3 moins sa valeur), une case de la colonne 8 est **déjà du Clair** au début du combat (à partir du nord).

- **Équipes :**
  - **Alliés :** le héros ; **Lyra I** (preset Lyra : Soin, **Champ** (ex-Égide), Accélération, Coup de pied).
  - **Le Ghom :** Influences disponibles pour la première fois : **Séisme** (4 Élan) et **Distorsion** (3 Élan). La **Réparation** reste grisée (elle sera débloquée au chapitre 2). Élan de départ : 3.
  - **Ennemis :** des **Lacunaires instables** (nouvel ennemi), en trois vagues : 2 au tour 1, 2 au tour 4, 3 au tour 7 (tours de la Frange). Ils sortent de la colonne 8.
  - **La Frange** reste dans la timeline (comme au prologue).

- **Le Lacunaire instable (nouvel ennemi) :**
  - Stats basses : santé 4, vitesse 5, attaque physique 1, défense physique 2, attaque énergétique 4, défense énergétique 2, chance 6. Marcheur et nageur à la fois (il n'a pas de forme fixe).
  - **Toucher froid** (corps à corps) : 4 dégâts énergétiques et **Ralenti** 1 tour. Animation : le givre court sur la cible.
  - **Comportement :** il se dirige vers la **case la plus active** (celle où l'on a agi le plus récemment), pas forcément vers le héros. Il cherche la chaleur.
  - **Aspect :** il change de forme à chacun de ses tours (flaque, caillou, herbe gelée, éclat).
  - **Fixation :** à 0 PV, il ne se disperse pas, il **se fixe** (animation du prologue). La case reçoit un rocher (+1 hauteur) ou une flaque (eau peu profonde), au hasard, ce qui modifie le terrain en cours de combat.

- **Objectif principal :** tenir jusqu'à la fin du tour 10 de la Frange, ou fixer tous les Lacunaires.
- **Défaite :** le héros et Lyra à 0 PV, ou les trois zones effilochées.
- **Objectifs secondaires :**
  - ★ **Garder les trois zones actives.** Une zone est active si un Écho y a agi (action, pas seulement déplacement) depuis le dernier tour de la Frange. Une zone qui reste inactive pendant **un** tour de la Frange devient silencieuse ; pendant **deux**, elle est perdue. **Chaque zone perdue rétrécit la carte pour tout le chapitre** : la colonne de frange la plus à l'ouest encore solide devient du Clair sur toute sa hauteur, et le chapitre 2 commence avec ce bord en moins. [zones_bords_froids = zones jamais perdues]
  - ◆ **Ne pas pousser la terre sous Lyra** : ne jamais utiliser le Séisme sur une case adjacente à Lyra. (Sans effet visible ici ; prépare l'introduction de la Confiance au ch. 3.) [si raté : confiance.lyra -1, confiance -1]
  - ◆ **Le feu ne s'éteint pas** : aucun Lacunaire n'atteint la case du foyer (2,2). [si réussi : Lyra a une réplique de plus en veillée, sans effet chiffré]

- **Événements scriptés :**
  - **Début :** tutoriel des zones à trois (rappel du prologue, une ligne).
  - **Premier Lacunaire adjacent à un allié :** tutoriel des Influences. La jauge d'Élan, pleine à 3, devient utilisable. Info-bulle : *Séisme : pousser la matière du Fragment. Distorsion : avancer le temps d'un allié, retarder celui d'un ennemi. Toute Influence se paie en Élan.*
  - **Premier Séisme :** un rocher surgit. Lyra s'arrête une fraction de seconde (réplique).
  - **Première Distorsion :** une lentille d'air courbe la lumière autour de la cible (nouvelle animation, § 14 du plan).
  - **Tour 7 :** trois Lacunaires d'un coup, dont un qui vise directement les Semis (la zone la plus éloignée de Lyra).
  - **Tour 10 :** la lumière tourne au doré. Les Lacunaires restants ralentissent, puis repartent vers le bord : la chaleur du jour a monté, ils trouvent ce qu'ils cherchaient dans le sol tiède. Fin du combat.

- **Répliques de combat :**
  - Début — **Lyra** : « Le feu, la rigole, les semis. Il faut qu'il s'y passe quelque chose. Tout le temps. »
  - Une zone devient silencieuse — **Lyra** : « Les semis ! Ils se taisent ! » / « La rigole gèle ! Va remuer l'eau ! »
  - Une zone est perdue — **Lyra** : « Trop tard. Celle-là, le bord l'a. »
  - Premier Séisme — **Lyra** : « … Un rocher ? D'où ? » *(puis, plus bas)* « Quelqu'un vient de payer cher pour un rocher. »
  - Première Distorsion — **Lyra** : « L'air s'est courbé, tu as vu ? Comme au-dessus d'un feu. »
  - Un Lacunaire se fixe — **Lyra** : « Un caillou de plus. » *(ou, si c'est une flaque)* « Tiens, de l'eau. Au moins, ça, ça coule. »
  - Lyra soigne le héros pour la première fois — **Lyra** : « Ce que je répare ici, je le paie ailleurs. Ne prends pas l'habitude. »
  - Fin — **Lyra** : « Ils repartent. Le soleil a chauffé le sol, ils ont trouvé plus chaud que nous. Ce n'est pas une victoire, c'est le matin. »

## Choix et conséquences

| Choix ou objectif | Drapeaux | Effet plus tard |
| --- | --- | --- |
| Lire la Borne | (local) | Débloque le choix « C'est toi, "L." ? » et la reprise de la Borne au ch. 3. |
| « Tu as besoin d'aide ? », « C'est toi, "L." ? », « Tu leur manques ? », « Merci », « Je viens avec toi » | `confiance.lyra` +1 chacun (plafond +5) | La Confiance de Lyra conditionne sa réplique au bord du Puits (ch. 6) et la promesse du nom (`nom.promesse`). |
| Écouter les sujets A, B, C jusqu'au bout | `confiance` +1 si les trois sont écoutés | Confiance générale (cachée jusqu'au ch. 3). |
| ★ Zones gardées actives | `zones_bords_froids` (0 à 3) | Au ch. 2, la Lacune à réparer est plus petite si la valeur est haute ; à 0, Lyra doit dépenser plus (voir ch. 2). |
| ◆ Séisme près de Lyra | `confiance.lyra` -1, `confiance` -1 | Lyra le mentionne au ch. 3, quand Brutus parle du Ghom : « Il a déjà secoué le sol sous mes pieds. Je n'ai pas aimé. » |
| La question du Carnet | `carnet.Q01 = ouverte` | Réponse au ch. 20 (Nyx IV). |

## Récompenses

- **Lyra I rejoint l'équipe.**
- **Habit : Cape du premier matin** — *Une cape de laine écrue, recousue dix fois, que Lyra gardait pour quelqu'un qui aurait froid aux bords.* Effet : le Ralenti infligé par le froid (Toucher froid, et tout effet de froid) dure 1 tour de moins.
- **Influences débloquées :** Séisme et Distorsion.
- **Objet : les piquets de Lyra** (narratif) — Lyra donne au héros l'un de ses piquets de mesure, gradué au couteau. Sans effet. *« Le bord était là il y a quatre ans. »* Il sert de repère visuel dans l'inventaire et réapparaîtra (planté, à moitié flou) si l'on repasse aux bords froids en ère IV.

## Graines pour la suite

- **Lyra et Brutus**, nés dans la même maison de Demeure : révélé au ch. 3.
- **La ligne « L. » de la Borne** : reprise au ch. 3 (Brutus) et au ch. 6 (la Borne est relue en pensée par le héros au bord du Puits).
- **Les Lacunaires cherchent la chaleur et l'activité** : la règle de comportement prépare la fuite (ch. 3) et l'idée qu'ils ne sont pas des monstres. En ère II, le Lacunaire stabilisé cherchera, lui, des interactions **stables**.
- **« Ça a coûté quelque chose à quelqu'un »** : Lyra pose l'idée que les Influences se paient. Le ch. 2 l'étend à la Réparation (chaleur rejetée).
- **« Il n'est pas si immobile que ça »** : première friction avec les Immobilistes de Demeure. Les Lumineux apparaîtront avec Merlin I (ch. 5).
- **Les piquets de Lyra** : premier exemple de **mesure** dans l'Aventure. Merlin I fera la même chose, en mieux, et en plus orgueilleux.

## Notes de mise en œuvre

- **Activité des zones :** même système que le prologue, mais l'activité exige une **action** (pas un simple passage). Les zones s'affichent par un halo léger ; une zone silencieuse perd son halo et son ambiance sonore.
- **Rétrécissement persistant :** une zone perdue transforme une colonne de la carte en Clair (cases retirées du plateau) pour le reste du chapitre ; le drapeau `zones_bords_froids` est lu au chapitre 2 pour construire sa carte.
- **Comportement « vers la chaleur » :** l'IA des Lacunaires choisit pour cible la case de zone dont l'activité est la plus récente, puis l'Écho le plus proche de cette case.
- **Fixation qui modifie le terrain :** à 0 PV, le Lacunaire pose un rocher (+1) ou de l'eau peu profonde sur sa case. Le moteur doit permettre de modifier une case en cours de combat (le Séisme le fait déjà).
- **Fin au temps T :** condition de fin « fin du tour 10 de la Frange ».
- **Tutoriel des Influences :** déclenché par événement (premier Lacunaire adjacent à un allié). Réparation affichée mais verrouillée, avec l'info-bulle : *« Pas encore. »*
- **Veillée :** première veillée du jeu. Interface : feu au centre, sujets à ouvrir, Carnet accessible. Un sujet « écouté jusqu'au bout » = toutes ses répliques passées sans quitter le sujet.
- **Champ** : l'action Égide de Lyra est affichée sous son nom du lore, **Champ** (§ 14), avec l'animation de champ de force cristallin.
