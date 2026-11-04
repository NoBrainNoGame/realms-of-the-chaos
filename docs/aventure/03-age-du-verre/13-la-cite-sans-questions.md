# Chapitre 13 — La Cité sans questions

> « 1.3. Au cours de la nuit du 16 au 17 du mois des Vitres, an 312, l'anomalie a ouvert les yeux. »
> — *Rapport n° 312-0417, Bureau du Classement.*

## Fiche

| | |
| --- | --- |
| Ère | III — L'Âge du Verre |
| Lieu | Vitrelle : la Salle du Puits, les rues de la Basse-Ville, l'arrière-salle de Lyra, la grille des Citernes |
| Équipe | Le héros (seul au départ). **Lyra III** rejoint (nœud 2). **Eva III** ou **Squalor III** rejoint pendant le combat final, selon `ile_sauvee` (voir le README de l'ère ; personne si `aucune`). |
| Durée visée | 7 à 9 nœuds, 1 combat |
| Question au Carnet | **Q13** — *Une vie sans questions est-elle une vie ?* |

## Ce que le joueur sait en arrivant

- Le héros est entré dans le Puits à la fin de la Grande Marée (ch. 12). Pour lui, quelques heures ont passé.
- Il porte ses transformations (`transformation.I`, `transformation.II`), ses habits, son Carnet. Il ne sait rien de ce qui s'est passé depuis.
- Le joueur vient de lire la Chronique d'ouverture : il sait, lui, qu'on l'appelle « l'anomalie », qu'on veut le « relever » et saisir le Carnet. Le héros, non.

## Synopsis

Le héros sort du Puits dans une salle de verre bourrée d'instruments, sous les yeux d'un releveur terrifié. Vitrelle est parfaite : propre, silencieuse, sans vent, ses habitants séparés par des parois transparentes. Personne n'y pose plus de questions, parce que toutes les réponses utiles sont affichées au Registre. Une soigneuse clandestine, **Lyra III**, le cache avant que la Garde ne le trouve. Pendant que l'alerte monte, le héros peut parler à quelques habitants et **rouvrir une question** chez eux, non pas en leur donnant une réponse, mais en leur en demandant une. Puis il faut fuir vers les Citernes, poursuivi par la Garde de verre et son capitaine, **Brutus III**. Le Carnet devient l'objet le plus recherché de la cité.

## Carte du chapitre

```
[1 Rencontre : la Salle du Puits]
        │
[2 Rencontre : la soigneuse sans permis]  → Lyra III rejoint
        │
[3 Veillée courte : l'arrière-salle]  → la règle des questions ; le compte à rebours de l'alerte
        │
[4 Rencontres libres : les habitants]  (jusqu'à 4 visites parmi 5 ; chaque visite fait monter l'alerte)
   ├─ 4a Odile, la verrière
   ├─ 4b Tobin, le releveur
   ├─ 4c Pia, l'écolière
   ├─ 4d Corin, le Fixé
   └─ 4e L'héritier de l'île sauvée (si `ile_sauvee` ≠ `aucune`) ou la passeuse Maud (sinon)
        │
[5 Rencontre : le Carnet]  → Q13 entre au Carnet
        │
[6 Combat (fin de chapitre) : la grille des Citernes]  → Eva III ou Squalor III rejoint en cours de combat
        │
[7 Fin : sous la ville]
```

## Scènes

### 1. La Salle du Puits (Rencontre)

*Noir. Puis une lumière qui redescend du bleu vers le blanc, comme si quelqu'un tournait lentement une molette : vu du fond, le monde d'en haut paraissait accéléré et bleui ; à mesure que le héros remonte, il reprend son rythme et sa couleur. Le héros est debout au fond d'une cuve de verre. Autour, des dizaines d'instruments : aiguilles, tubes gradués, lentilles braquées sur lui. Tout est propre. Sur une étiquette : « 0-PUITS-1 ». Un homme maigre en blouse grise, un registre à la main, le regarde comme on regarde une aiguille qui bouge alors qu'elle ne doit pas.*

> **Extrait des archives — Journal de garde de la Salle du Puits, an 312.**
> « Heure 3. Relevé thermique : en hausse. Heure 3 et quart : en hausse. Heure 3 et demie : le sujet est sorti de la cuve. Je note qu'il n'a rien dit. Je note que moi non plus. »

**Tobin** (le releveur, qu'on retrouvera au nœud 4b) — « Vous… Vous n'êtes pas censé… Le Registre dit que vous êtes immobile. »

1. « Où suis-je ? » → **Tobin** — « À Vitrelle. Salle du Puits. Niveau zéro. Tout est écrit sur la porte. » *Il désigne une plaque de règlement de trois pieds de haut.*
2. « Combien de temps ? » → **Tobin** — « Vous êtes inscrit depuis l'an 97. Nous sommes en 312. Je n'ai pas fait le calcul, ce n'est pas mon service. »
   - *Le héros sort de sa poche la clepsydre de Néréa. L'eau y est descendue d'un doigt à peine : quelques heures. Il la regarde, puis regarde Tobin.* **Tobin** — « Elle retarde, votre horloge. Toutes les horloges retardent, près de la Pierre… pardon, près du Puits. Ma grand-mère disait "la Pierre Lente". On n'a plus le droit. » *(Les deux mesures sont exactes : celle de la clepsydre est le temps propre du héros ; celle du calendrier, le temps de la cité.)*
3. *Ne rien dire, et toucher la paroi de la cuve.* → *Le verre est tiède là où il a posé la main, froid partout ailleurs.* **Tobin** note : « Le sujet… touche. »

*Quel que soit le choix, Tobin tire un cordon. Quelque part, très loin, un timbre de verre tinte trois fois. Il n'y a pas de sirène à Vitrelle : il y a ce tintement, net, qui se répète.*

- Si `objet_de_nyx` : *Dans une vitrine, à hauteur de main, une lame courte de verre noir, avec une encoche au dos : la lame de Nyx. L'étiquette dit : « Artefact non classé. Origine : le sujet. » Le héros peut le reprendre.* [`objet_de_nyx` reste vrai ; sinon il est perdu pour l'ère III et retrouvé par Nyx IV au ch. 20 : **à confirmer avec l'ère IV**]
- Si `transformation.I` = `B` : **Tobin** — « Vos bras… Ce sont des Cristaux ? Ne bougez pas, il faut que je vous inscrive aux gisements. »

### 2. La soigneuse sans permis (Rencontre)

*Une rue de la Basse-Ville. Des façades transparentes : on voit les gens dans leurs maisons, assis, chacun seul, chacun à sa table. Personne ne lève la tête. Le ciel est d'un bleu sans nuage, sans oiseau, sans rien. Pas un souffle d'air. Le héros trébuche, s'appuie contre une paroi. Une main aux bouts des doigts gris, comme brûlés par le froid (la marque des Soigneuses, depuis toujours), le tire dans un passage étroit, entre deux murs de verre dépoli, les seuls qu'on ne voit pas au travers.*

**Lyra III** — « Pas là. Ici, le dépoli. C'est le seul endroit où personne ne voit rien. » *Elle le regarde de haut en bas.* « Tu saignes. Non, tu ne saignes pas. Tu es froid comme une pierre de fond. Tu sors d'où ? »

1. « D'en bas. Du Puits. » → **Lyra III** — « Alors c'est toi, l'anomalie. Ils en parlent depuis que je suis petite. On disait que tu étais une statue. » [confiance.lyra +1]
2. « Qui es-tu ? » → **Lyra III** — « Quelqu'un qui soigne sans permis. Ça suffit comme présentation, à Vitrelle. »
3. « Pourquoi tu m'aides ? » → **Lyra III** — « Parce que la Garde va te figer, et que je n'aime pas qu'on fige les gens. »

*Elle pose deux doigts sur son poignet. Une chaleur passe : le Soin, à l'ancienne. Elle pâlit un peu.*

**Lyra III** — « Voilà. Ce que je répare ici, je le paie ailleurs : moi, ce soir, je dormirai mal. Au dispensaire, ils auraient brisé un Cristal. Ça ne leur coûte rien, à eux. Ça coûte à ceux qui ne sont pas encore nés. »

**Lyra III rejoint l'équipe.**

### 3. L'arrière-salle (Veillée courte)

*Une pièce sans fenêtre derrière une blanchisserie. Des bandes de lin, des bassines, une lampe à huile. Pas de Cristal : Lyra n'en veut pas chez elle.*

**Lyra III** explique, au choix du joueur (chaque sujet se déplie, aucun n'est obligatoire) :

- **Le Gel.** « Il y a trois siècles, les Marées emportaient des îles entières. Mes aïeules sont venues du sud avec les Gardiens, parce que les Thermistes du nord promettaient de les arrêter. Le Collège a refroidi les bords du monde. Plus de Marées. Plus de vent non plus, plus de pluie, plus d'oiseaux. Mais plus de Marées. Elles ont eu ce qu'elles voulaient. »
- **Le Registre.** « Tout ce qu'il est utile de savoir est affiché sur les murs de la Tour. Quand on a une question, on va lire la réponse. Avec le temps, on a arrêté d'y aller. On a arrêté d'avoir des questions. »
- **Les parois.** « On se voit tous. On ne se touche plus. Un soin officiel, c'est derrière une vitre, avec une pince. Moi, je touche. C'est pour ça que c'est interdit. »
- **Les Cristaux.** « On les casse, on récupère ce qu'il y avait dedans : de la chaleur, de l'ordre, du soin. Ma grand-mère disait que dedans, il y avait les liens des gens d'avant. Le Collège dit que c'est une superstition. » *Un temps.* « Le Collège dit aussi que les Lacunes n'ont rien à voir avec les mines. »

**Le compte à rebours.** Lyra pose sur la table un petit sablier de verre. « La Garde ratisse la Basse-Ville par carrés. Tu as le temps de voir trois, quatre personnes, pas plus. Si tu veux voir des gens. Moi, à ta place, je fuirais tout de suite. »

1. « Je veux les voir. Ceux qui ne demandent plus rien. » → [confiance.lyra +1] **Lyra III** — « Tu es bizarre. Bon. Je t'accompagne. »
2. « Fuyons tout de suite. » → On passe directement au nœud 5. ★ échoue (`questions_rouvertes` = 0).

### 4. Les habitants (Rencontres libres)

**Règle commune.** On rouvre une question **en posant une question**, jamais en donnant une réponse. Chaque habitant a une option qui rouvre (`questions_rouvertes +1`), une option qui referme (on lui donne une réponse, il remercie poliment et retourne à sa table), et une option neutre. Chaque visite fait couler le sablier : **à partir de la troisième visite**, le combat final compte un Hallebardier de plus par visite.

#### 4a. Odile, la verrière

*Un atelier ouvert sur la rue. Une femme souffle un carreau, le pose sur une pile de carreaux identiques, en souffle un autre.*

**Odile** — « Carreau réglementaire numéro quatre. Le Registre dit que le verre parfait n'a pas de bulle. Je n'en fais jamais. Trente et un ans sans une bulle. »

1. « Tu pourrais faire autre chose. » → **Odile** — « Pourquoi ? » *Elle se remet au travail.* (referme)
2. « Que fait la lumière, quand elle traverse une bulle ? » → *Odile s'arrête, la canne en l'air.* **Odile** — « Elle… se tord, je crois. Le Registre ne le dit pas. Il dit seulement qu'il n'en faut pas. » *Elle regarde son souffle refroidir dans la canne.* « Je pourrais en faire une. Une seule. Pour voir. » [`questions_rouvertes +1`]
3. « Bon travail. » → *Elle hoche la tête.* (neutre)

#### 4b. Tobin, le releveur

*Tobin, rentré chez lui en tremblant, recopie dans un cahier la valeur de la jauge du Gel affichée face à sa fenêtre. Toujours la même.*

**Tobin** — « Quatre degrés sous la marque. Toutes les heures. Depuis vingt ans. Je recopie. »

1. « Depuis quand l'aiguille ne bouge-t-elle plus ? » → **Tobin** — « Depuis toujours. » *Un silence.* « Enfin… je n'ai que mes vingt ans de cahiers. Les plus anciens sont aux Archives. » *Il fronce les sourcils, comme si quelque chose lui faisait mal.* « Pourquoi est-ce que je ne me suis jamais demandé ça ? » [`questions_rouvertes +1`] ; graine du ch. 14 : Tobin y apparaît, venu consulter les vieux relevés.
2. « Elle ne bougera jamais. Le Gel est parfait. » → **Tobin** — « Merci. C'est ce que dit le Registre. » (referme ; si le héros choisit cette option, elle est notée pour le bilan : « vous avez donné une réponse »)
3. « Je suis désolé de t'avoir fait peur. » → **Tobin** — « Vous n'êtes pas au règlement. Ce n'est pas votre faute. » (neutre) [confiance +1]

#### 4c. Pia, l'écolière

*Une fillette assise seule derrière une paroi d'école, récitant à mi-voix.*

**Pia** — « Pourquoi le ciel est-il net ? Parce que le Gel. Pourquoi la mer est-elle calme ? Parce que le Gel. Pourquoi… »

1. « Et toi, qu'est-ce que tu demanderais, si le Registre n'existait pas ? » → **Pia** — *Elle réfléchit longtemps.* « Ma grand-mère parlait d'une chose qui pousse les nuages. Le vent. C'est quoi, le vent ? » *Lyra, derrière le héros, détourne les yeux.* [`questions_rouvertes +1`] [confiance.lyra +1]
2. « Le vent, c'est de l'air qui bouge parce qu'il fait plus chaud ici que là-bas. » → *Pia note la réponse dans son cahier, très soigneusement, et ne demande rien d'autre.* (referme ; la réponse est juste, mais elle referme quand même : c'est le point de la scène)
3. « Tu récites bien. » → **Pia** — « Je sais. » (neutre)

#### 4d. Corin, le Fixé

*Un jeune homme qui porte la forme héritée du Lacunaire stabilisé. Selon `lacunaire.forme` : `ondine`, des doigts palmés et une peau qui garde l'humidité ; `aiguille`, un corps long et mince, des gestes d'une précision de flèche ; `squale`, des dents trop nombreuses quand il sourit, ce qu'il évite ; `miroir`, une peau où l'on se voit un peu, ce qui gêne tout le monde dans une cité de verre ; `recif`, des plaques calcaires aux épaules, rugueuses ; `brume`, des contours flous, comme une photographie qui a bougé. Il est assis dans une maison vide, parfaitement immobile.*

**Corin** — « Nous… je suis bien, ici. Rien ne change. Mes ancêtres hésitaient, ils changeaient de forme selon qui ils croisaient. Ici, plus rien ne nous croise. Je reste moi. »

1. « Ton ancêtre a-t-il choisi sa forme ? » → **Corin** — « On dit qu'il l'a prise de la première main qui l'a touché. » *Il regarde ses propres mains.* « Alors… si quelqu'un d'autre m'avait touché… je serais quelqu'un d'autre ? Est-ce que je pourrais encore l'être ? » [`questions_rouvertes +1`] ; si `carnet.Q10` = `repondue`, le héros peut ajouter : « En partie. » *Corin sourit pour la première fois.*
2. « Tu as raison, ne change pas. » → **Corin** — « Merci. Nous… je ne changerai pas. » (referme)
3. *Lui tendre la main.* → *Il la regarde longtemps, ne la prend pas.* **Corin** — « Pas encore. » (neutre ; mais Corin réapparaît au ch. 18 parmi les évacués, et prend cette fois la main.)

#### 4e. L'héritier de l'île, ou Maud la passeuse

- **Si `ile_sauvee` ≠ `aucune` :** *un héritier de l'île sauvée. `sauge` : un vieil homme bourru, arrière-arrière-petit-fils d'Aubin, qui tient un étal de poisson séché sans poisson ; `lusse` : une vieille squale aux dents usées, qui monte des Citernes vendre des algues ; `strates` : une ondine copiste qui recopie les annales pour le fonds de la Marée, sans les lire.* **L'héritier** — « Chez nous, on dit que le Dormeur de la Pierre Lente a choisi de sauver notre île. Le Collège dit que c'est une légende. » *Il regarde le héros.* « Vous lui ressemblez. »
  1. « Que ferais-tu, si c'était vrai ? » → **L'héritier** — « Je… lui demanderais pourquoi nous. Pourquoi pas les autres. » [`questions_rouvertes +1`] *Le héros n'a pas de réponse. C'est bien.*
  2. « C'était moi. » → **L'héritier** — « Alors merci. » *Il est content, et c'est tout.* (referme) [confiance +1]
- **Sinon :** *Maud, une vieille passeuse qui ne passe plus personne : les canaux sont gelés.* **Maud** — « Avant, je savais lire l'eau. Maintenant elle ne dit plus rien. »
  1. « Qu'est-ce qu'elle disait ? » → **Maud** — « D'où venait le courant. Où il allait. » *Elle se tait.* « Où est-ce qu'il est allé, le courant ? » [`questions_rouvertes +1`]
  2. « Le Gel l'a arrêté. » → **Maud** — « Oui. » (referme)

### 5. Le Carnet (Rencontre)

*De retour dans le passage dépoli. Le tintement de verre se rapproche, trois coups, trois coups.*

**Lyra III** — « Ils ne cherchent pas seulement toi. Ils cherchent ton cahier. On a affiché ton signalement au Registre : "un carnet de cuir contenant des questions". Je n'avais jamais vu le Collège avoir peur d'un cahier. »

*Le héros ouvre le Carnet. Les questions des ères précédentes y sont, de sa main. Il en écrit une nouvelle.*

- Selon `questions_rouvertes` :
  - **0 :** *Il écrit vite, sans regarder en arrière.* **Lyra III** — « Tu as bien fait de fuir. Je crois. »
  - **1 ou 2 :** **Lyra III** — « Tu as vu leur tête ? Comme quand on rallume une lampe dans une pièce où on dormait. Ça fait mal aux yeux. »
  - **3 et plus :** **Lyra III** — « Trois. Trois personnes qui vont rester éveillées cette nuit. » *Elle rit, doucement.* « Le Collège va devoir afficher des réponses en plus. »

**Q13 entre au Carnet :** *Une vie sans questions est-elle une vie ?* [`carnet.Q13` = `ouverte`]

**Lyra III** — « Ma grand-mère aurait dit que oui. Qu'on peut vivre très bien sans se demander rien. » *Un temps.* « Ma grand-mère est morte dans une maison de verre, assise à sa table. Personne ne l'a vue se disperser, alors que tout le monde la voyait. »

## Combats

### Combat — La grille des Citernes (fin de chapitre)

**Carte :** une place de la Basse-Ville, entre des façades de verre (murs `#`, infranchissables et opaques à la ligne de vue malgré leur transparence : c'est du verre trempé épais). Des marches (`1`) mènent à une terrasse centrale. À l'est, un canal immobile (`~`), plus profond au milieu (`w`, `W`) : c'est l'entrée des Citernes. La grille des Citernes est au sud-est. Des lampadaires à Cristal éclairent la place, **par paires**.

Terrain (`Board.fromAscii`) :

```
..#...1...#~~~
..#...1...#~ww
......1.....wW
##..#111#...wW
......1.....~w
..#...1...#.~~
..#...1...#...
..............
```

Surcouche (même grille ; `H` héros, `L` Lyra, `G` Hallebardier, `A` Arbalétrier, `S` Sonneur, `B` arrivée de Brutus III, `*` Cristal-lampadaire, `>` grille de sortie, `E` arrivée d'Eva III ou de Squalor III) :

```
.G#.*.....#..E
..#.......#...
H.....*.......
##..#...#.....
L..*......*...
..#.......#...
.G#...*...#A.>
B.....A....S.>
```

- Cinq lampadaires visibles. Paires : (4,0) et (10,4) ; (6,2) et (6,6) ; le jumeau de (3,4) est dans une façade hors carte (il s'éteint sans Lacune visible). Les implémenteurs peuvent ajuster, en gardant la règle : **au moins une paire relie le chemin des alliés au chemin des poursuivants**, pour qu'une extraction puisse bloquer l'un ou l'autre.
- Variante `transformation.II` = `A` (Branchies) ou Squalor III : la case `W` (13,2) compte aussi comme sortie.

**Équipes :**
- **Alliés :** le héros, Lyra III. Au temps 30 de la timeline : Eva III (saute d'une corniche dans le canal, case `E`) **ou** Squalor III (surgit de l'eau profonde `w`, case (12,1)).
- **Ennemis :** 2 Hallebardiers, 2 Arbalétriers, 1 Sonneur ; **+1 Hallebardier** par visite au-delà de la deuxième au nœud 4 (entrée par le nord-ouest). **Brutus III** entre au temps 20 par le coin sud-ouest.

**Objectifs :**
- **Principal :** amener **le héros et Lyra III** sur une case de sortie `>`.
- **★ Annoncé (déjà joué) :** « Rouvrir une question chez trois habitants avant de fuir » : affiché au bilan selon `questions_rouvertes`.
- **◆ Caché :** ne briser **aucun** Cristal-lampadaire. [confiance.lyra +1]
- **◆ Caché :** aucun garde ne se disperse (un garde qui passe sous 25 % de PV **se rend** ; un coup qui le fait passer d'au-dessus de 25 % à 0 PV le disperse : il faut doser ses coups). [confiance.brutus +2]
- **Défaite :** le héros ou Lyra III se disperse, ou le héros est **figé** (encerclé : trois ennemis adjacents à la fin d'un tour du héros, avec le Sonneur à portée).

**Événements scriptés :**
- **Temps 0 :** la Garde surgit. Brutus n'est pas encore là.
- **Temps 20 :** Brutus III entre par le sud-ouest. Il ne court pas, il marche. Bulle :
  > **Brutus III** — « Rends-toi. Personne ne te fera de mal. Personne ne fait de mal à personne, ici. C'est le principe. »
- **Temps 30 :** Eva III ou Squalor III arrive (voir ci-dessous).
- **Premier Cristal brisé par l'équipe :** bulle de Lyra III :
  > **Lyra III** — « Voilà. On a payé avec l'argent de quelqu'un d'autre. »
  
  *(Le joueur reçoit le gain normalement. Aucune autre pénalité que la Lacune.)*
- **Premier Cristal brisé par un Extracteur ou la Garde (s'il y en a) ou première Lacune formée :** tintement de verre. Les passants derrière les parois **lèvent la tête**, pour la première fois du chapitre.

**Si `ile_sauvee` = `aucune` :** personne n'arrive au temps 30. À la place, la grille des Citernes s'ouvre d'elle-même (Lyra III a soudoyé un releveur) : la case (13,6) devient une sortie un tour plus tôt. Le combat compte un Hallebardier de moins.

**Arrivée d'Eva III (si Eva III est l'Écho de l'ère) :**
> **Eva III** — *Une flèche se plante entre le héros et le Hallebardier le plus proche.* « Dix ans que je calcule la trajectoire de tout ce qui bouge dans cette cité. Rien ne bouge. Et puis toi. » *Deuxième flèche, dans l'épaule du Hallebardier.* « Ne me remercie pas. Je m'ennuyais. »

**Arrivée de Squalor III (si Squalor III est l'Écho de l'ère) :**
> **Squalor III** — *Une tête grise crève la glace du canal.* « Trois siècles que rien ne nage dans ces eaux. Je commençais à me manger les nageoires. » *Il regarde la Garde.* « Ceux-là, je ne les mange pas. Le verre, ça passe mal. »

**Répliques de combat :**
- **Lyra III** (début) — « Les Citernes. La grille, là-bas. Si on y est, ils ne nous suivront pas : ils détestent l'eau qui bouge. »
- **Lyra III** (soigne le héros) — « Je le paie. Avance. »
- **Brutus III** (un garde tombe) — « Relevez-le. On ne laisse personne par terre. »
- **Brutus III** (le héros atteint la sortie) — *Il ne tire pas, ne court pas.* « Tu es dehors. Dehors, c'est dangereux. Je te retrouverai avant que ça te tue. »
- **Sonneur** (lance le Diapason) — « Ralentissez. Tout le monde. Ralentissez. »

### 7. Sous la ville (Fin)

*Les Citernes. Une eau noire, parfaitement immobile, sous des voûtes de verre où filtre un jour bleuâtre. Pas une ride.*

- **Eva III** — « Statistiquement, je n'avais aucune raison de faire ça. J'adore. »
- **Squalor III** — « Ici, au moins, on peut parler. L'eau ne rapporte pas. »

**Lyra III** — « Demain, ils vont afficher ton signalement partout. Il faut quelqu'un qui sache ce qu'ils savent sur toi. Il y a un rédacteur, à la Tour du Registre. C'est lui qui a écrit sur toi. On dit qu'il ne dort jamais, et qu'il se corrige même en parlant. »

> **Extrait des archives — Ordre de service n° 312-0418.**
> « L'anomalie s'est soustraite à son relevé. Le carnet n'a pas été saisi. Trois habitants de la Basse-Ville ont été vus debout à leur fenêtre après le couvre-feu, ce qui ne s'était pas produit depuis l'an 201. Ils seront réévalués. »
> *(La phrase « trois habitants » varie selon `questions_rouvertes` : « aucun incident à signaler », « un habitant », « deux habitants », « trois habitants ».)*

## Choix et conséquences

| Choix ou objectif | Drapeaux | Effet plus tard |
| --- | --- | --- |
| Rouvrir une question chez un habitant (×1 à ×4) | `questions_rouvertes +1` | ≥ 3 : argument recevable contre Merlin III (ch. 17) ; ces habitants réapparaissent pendant l'évacuation (ch. 18) et aident à guider les autres (un groupe évacué de plus). |
| Donner une réponse à un habitant | — (noté au bilan) | Aucun malus. Le bilan montre en silhouette : « Vous avez répondu à leur place. » |
| Fuir sans visiter personne | `questions_rouvertes` = 0 | Moins de gardes au combat ; Lyra III un peu plus distante (pas de +1). |
| Reprendre l'objet de Nyx | `objet_de_nyx` reste vrai | Ère IV (ch. 20). |
| Ne briser aucun Cristal-lampadaire | confiance.lyra +1 | Lyra III propose un nom au héros au ch. 18 si `confiance.lyra` ≥ 3 (arc F). |
| Aucun garde dispersé | confiance.brutus +2 | Brutus III plus enclin à ouvrir les portes (ch. 18). |
| Cristaux brisés | `cristaux.extraits +n` | Lacunes sur la carte du monde (Basse-Ville). |

## Récompenses

- **Lyra III** rejoint ; **Eva III** ou **Squalor III** rejoint.
- **Habit : Manteau de dépoli.** *Un manteau gris coupé dans la toile qui sert à doubler les vitres opaques : on y voit mal au travers.* Effet : **+1 Vitesse** ; et en ère III, les ennemis ne peuvent pas cibler le héros à plus de 5 cases.
- **Trait (si `questions_rouvertes` ≥ 3) : Voix qui demande.** *Une façon de poser les questions qui donne envie d'y répondre.* Effet : une option de dialogue supplémentaire dans certaines rencontres de l'ère (ch. 14, 17).

## Graines pour la suite

- **Arc C :** Q13 ouverte ; réponse au ch. 18. Le Carnet est désormais « recherché » : la Garde le réclame dans chaque rencontre de l'ère.
- **Arc B :** Brutus III a vu le héros épargner (ou non) ses hommes. Sa Confiance décide des portes au ch. 18 et se transmet à Brutus IV.
- **Arc A :** chaque lampadaire brisé laisse un trou dans la Basse-Ville, visible au ch. 18 (les fissures partent de là).
- **Tobin** retourne aux vieux relevés (ch. 14, Salle des Archives) si sa question a été rouverte : il y trouve les relevés du Gel qui **bougeaient** au début.
- **Pia et le vent** : au ch. 18, quand la cité se fend et que l'air chaud remonte des fissures, Pia sent le vent pour la première fois.
- **Corin** : prend la main tendue au ch. 18.

## Notes de mise en œuvre

- **Rencontres libres avec compte à rebours :** un hub de 5 rencontres dont on n'en joue que 4 au plus ; le sablier est visible (4 grains). Chaque visite retire un grain.
- **Options « referme / rouvre / neutre » :** ne jamais les signaler à l'écran. Le bilan révèle après coup lesquelles ont rouvert une question.
- **Reddition des gardes :** même mécanique que la fuite (§ 9 du plan, « Épargner »). Un garde rendu reste sur sa case, à genoux, non ciblable, et bloque la case.
- **Extraction :** les lampadaires sont des Cristaux d'intrication standard (voir le README de l'ère). C'est le premier contact du joueur avec l'action « Extraire » : une infobulle neutre la présente, **sans avertissement moral** : « Briser le Cristal : gain immédiat. Son jumeau s'éteint. Une Lacune s'ouvre. »
- **Murs de verre :** visuellement transparents, mais bloquent la ligne de vue. L'infobulle d'une case de mur : « Verre trempé. On voit à travers. Rien ne passe. »
- **Vitrelle sans vent :** aucun mouvement de particules dans le décor de l'ère, sauf autour des Lacunes. Le contraste doit se voir.
- **Arrivée d'Eva/Squalor :** un allié qui entre en cours de combat à un temps donné (événement scripté).
