# Chapitre 17 — Le Maître du Verre

> « Je ne crois pas. Je mesure. »
> — *Merlin, troisième du nom, Maître du Verre. Devise inscrite au-dessus de la porte de l'Observatoire.*

## Fiche

| | |
| --- | --- |
| Ère | III — L'Âge du Verre |
| Lieu | Vitrelle : l'Observatoire, au sommet de la Tour du Registre ; la grande lunette ; la Salle du Registre |
| Équipe | Le héros, Lyra III, Eva III ou Squalor III, le Chroniqueur (si `chroniqueur_rejoint`), Gorr. |
| Durée visée | 5 nœuds, 1 combat, 1 Archive optionnelle |
| Question au Carnet | **Q17** — *Peut-on connaître le monde sans le changer ?* (Merlin) |

## Ce que le joueur sait en arrivant

- Le Collège extrait les Cristaux pour alimenter le Gel, qui a arrêté les Marées et immobilisé l'Archipel.
- Les archives jetées, les strates et les relevés laissent penser que les Lacunes grandissent là où l'on mine.
- Gorr a été libéré (et a posé sa question, selon `gorr_question`). Merlin III a entendu, par un tube acoustique, et a invité l'équipe à l'Observatoire « pour la mesurer de près ».

## Synopsis

Merlin III reçoit l'équipe sans gardes apparents, avec la courtoisie d'un savant qui a enfin quelque chose d'intéressant à étudier. Il ne ment pas : il montre lui-même la **carte des Lacunes**, et la superpose à la carte des mines. Elles coïncident exactement. Il le sait. Il le sait depuis vingt ans. C'est **le prix** du Gel, calculé au plus juste : sans le Gel, les Marées auraient tout pris. Son orgueil est ailleurs : il croit qu'on peut connaître le monde sans le toucher, que ses instruments ne font que **regarder**. Or ses instruments sont des paires de Cristaux, et chaque mesure en consomme une. Le Registre lui-même a creusé des Lacunes. Le duel qui suit est aussi une démonstration : chaque fois que Merlin mesure, il change ce qu'il mesure. Avec assez d'arguments, le combat devient une Intrication. Sinon, Merlin tombe, et ne comprend pas.

## Carte du chapitre

```
[1 Rencontre : l'Observatoire]  → la carte des Lacunes ; Q17 entre au Carnet
        │
        ├──► [2 Archive (optionnelle) : la lumière tardive]  → arc E
        │
[3 Veillée : la nuit mesurée]  → Merlin vient ; Q06 reposée
        │
[4 Combat (fin de chapitre) : le duel du Registre]  → `merlin_convaincu`
        │
[5 Rencontre : ce que pèse une mesure]  → `carte_des_lacunes` ; la cité tremble
```

## Scènes

### 1. L'Observatoire (Rencontre)

*Le sommet de la Tour. Une coupole de verre, le ciel net au-dessus, si net qu'on y voit des Fragments lointains, minuscules, comme des grains de sel. Partout, des instruments de cuivre et de verre : aiguilles, balances, lentilles. Au centre, une grande table lumineuse, et un homme mince, en robe grise, appuyé sur un long bâton de verre gradué : la Toise.*

**Merlin III** — « Entrez. Ne touchez à rien, pas par principe : par méthode. Tout ici est étalonné. » *Il regarde Gorr.* « Le Golem. J'ai lu sa fiche cent fois. Elle disait : "Ne demande rien." Elle avait tort. J'ai horreur qu'une fiche ait tort. C'est pour ça que je vous ai fait monter. »

*Il regarde le héros longuement, comme on lit un cadran.*

**Merlin III** — « Et l'anomalie. Deux siècles d'immobilité, un doigt de mouvement. J'ai écrit la note en marge de votre rapport, vous savez. C'était moi. » *Il tapote la Toise.* « Ce bâton a appartenu au premier de nous. Il vous a mesuré au bord du Puits, il y a huit siècles : "un battement sur cent, sur dix". C'est la mesure qui a fondé ma lignée. Vous êtes, en quelque sorte, notre premier instrument. »

1. « Pourquoi m'avoir fait monter, et pas arrêter ? » → **Merlin III** — « Arrêter, c'est le métier de Brutus. Le mien, c'est savoir. Je veux savoir ce que vous êtes. »
2. « Vous savez ce que font vos mines ? » → **Merlin III** — « Évidemment. Venez voir. » *(enchaîne sur la carte)*
3. « Vous avez figé le monde. » → **Merlin III** — « J'ai **refroidi** le monde. Mes prédécesseurs l'ont fait, plus exactement ; moi, je tiens les comptes. Figé est un mot de poète. Venez voir, et parlons en chiffres. »

**La carte des Lacunes.** *Merlin pose la main sur la table. Une carte de l'Archipel s'y allume : des îles, et des taches grises, des dizaines, mesurées au trait près. Puis il glisse une seconde plaque de verre par-dessus : la carte des mines. Les puits tombent exactement dans les taches. Exactement.*

*Si `ile_sauvee` = `sauge` : dans un coin de la carte, les plus vieux tracés sont d'une autre main, fine, appliquée, avec des chiffres en marge.* **Merlin III** — « Les premiers relevés ne sont pas de nous. Ils viennent de la Tour des Marées, sur laquelle cette tour est bâtie. Une archère, Ilse. Elle mesurait les Lacunes avant que quiconque sache ce que c'était. » *(Eva III, si elle est là : « Mon arrière-arrière… beaucoup d'arrière-grand-mère. Elle écrivait ses sept comme moi. »)*

**Merlin III** — « Voilà. Chaque Cristal brisé consomme une corrélation. Moins de corrélations, moins de Tissu. Là où l'on extrait, le monde s'amincit. Je le sais depuis vingt ans, mon prédécesseur le savait avant moi, et quelqu'un l'avait écrit dès l'an 40. On a jeté la page, je l'ai fait rechercher. » *Il sourit, sans joie.* « Ce n'est pas un secret. C'est un **budget**. »

*Si le joueur a extrait des Cristaux pendant l'ère, Merlin le sait :* « Vous aussi, d'ailleurs. {nombre} Cristaux depuis votre sortie, d'après mes relevés. La Basse-Ville, la Mine, la Fonderie. Vous voyez ces petites taches neuves ? Ce sont les vôtres. » *(Aucun reproche. Une constatation.)*
*Si `premier_cristal` = `perdu` :* « Et l'étalon de la Mine. Le plus beau Cristal de l'Archipel. Vous l'avez brisé pour arrêter ma mine. C'était un choix défendable. C'est exactement le choix que je fais tous les jours. »

**Lyra III** — « Un budget payé par qui ? »
**Merlin III** — « Par l'avenir, madame. Comme tous les budgets. Sans le Gel, il n'y aurait pas d'avenir du tout : les Marées emportaient une île par décennie. J'ai les chiffres. Voulez-vous les chiffres ? »

1. « Combien de temps reste-t-il ? » → **Merlin III** — « Trente et une saisons de Cristaux, au rythme actuel. Ensuite, nous chercherons autre chose. » *Le Chroniqueur, bas :* « "Nous chercherons autre chose" : formule employée dans quatorze rapports depuis l'an 200. Jamais suivie d'effet. »
2. « Et vos instruments ? Ils ne coûtent rien ? » → **Merlin III** — « Mes instruments **regardent**. Ils ne prennent rien. Un savant digne de ce nom n'intervient pas dans ce qu'il mesure : il se tient à l'extérieur, et il note. » *Il sourit.* « Tessa, notre fondatrice, a écrit que toute mesure dérange un peu ce qu'elle mesure. Je l'ai toujours trouvée trop modeste. Il suffit d'instruments assez fins. » *(Graine : c'est faux, et le combat le montrera. Tessa avait raison.)*
3. « Vous avez sauvé des gens. » → **Merlin III** — *Une seconde de surprise.* « Oui. On me le dit rarement. On me dit "Maître", on me dit "le Registre l'affirme". On ne me dit pas ça. » [confiance.merlin +1]

**Merlin III** — « Voici ma question, puisque vous collectionnez les questions, à ce qu'on dit. Peut-on connaître le monde sans le changer ? Moi, je réponds oui. Je le fais tous les jours. »

**Q17 entre au Carnet :** *Peut-on connaître le monde sans le changer ?* [`carnet.Q17` = `ouverte`]

### 2. La lumière tardive (Archive, optionnelle)

**Condition :** le fonds d'archives a survécu au ch. 14 (au moins quatre Cristaux d'archive intacts) : Merlin a besoin de ses vieilles plaques pour savoir où pointer la lunette. Sinon, l'option est grisée : « Les plaques de référence ont été valorisées. »

*La grande lunette. Merlin la pointe vers un Fragment très lointain, au bord du Clair, presque invisible.*

**Merlin III** — « Ce Fragment-là est si loin que sa lumière met des siècles à nous parvenir. Ce que nous voyons, c'est lui il y a longtemps : bien avant le Gel, bien avant les Marées. Les plus anciennes Lacunes de ma carte sont là-bas. Je n'ai jamais compris pourquoi. On n'y a jamais miné : il n'y avait personne pour miner. »

*Lire l'Archive coûte de l'Usure : il faut rester longtemps l'œil contre une lentille glacée, sous le froid de la coupole. [`archives.lues +1`, `usure +1`]*

*Ce que montre la lumière : un Fragment vivant, vert. Puis, en quelques images espacées de plusieurs années, sa lumière qui faiblit, ses bords qui se figent, des taches grises qui s'ouvrent, sans mine, sans extraction, sans rien. Comme si quelque chose qui l'entretenait avait cessé de le faire.*

**Merlin III** — « Personne ne l'a miné. Il s'est… éteint. Comme un feu qu'on ne nourrit plus. »

- Si `ghom_dechu.verite` ≥ 1, le héros reconnaît ce qu'il a vu dans les strates (ch. 11) : le Fragment abandonné. Option : « Quelqu'un a cessé de s'en occuper. » → **Merlin III** — « "Quelqu'un". Vous parlez comme les Immobilistes. Ou comme les Lumineux. » *Il hésite.* « Je n'ai pas de colonne pour "quelqu'un". Mais je n'ai pas non plus d'autre explication. »

[`ghom_dechu.verite +1`, sans dépasser 3]

### 3. La nuit mesurée (Veillée)

*Merlin a fait installer l'équipe dans une salle de l'Observatoire. Ni gardes, ni portes verrouillées : « Où iriez-vous ? Toute la cité est un instrument. » Il passe dans la nuit, une lampe à la main.*

**Sujets** (deux au choix) :

- **Merlin et le verre.** « On disait jadis que le verre coule, très lentement, et que les vieilles vitres sont plus épaisses en bas. C'est faux : il ne coule pas, à aucune échelle de temps qui nous concerne. Les vitriers posaient simplement le côté épais en bas. » *Il caresse une paroi.* « Le verre est un désordre figé. Les atomes y sont en vrac, comme dans un liquide, mais ils ne bougent plus. C'est pour ça que je l'aime. Tout le chaos d'un liquide, et toute la tranquillité d'une pierre. » *(Lyra, à mi-voix : « C'est la cité entière, ce qu'il décrit. »)*
- **Merlin et Gorr** (si `gorr_question`). **Merlin III** — « Que lui avez-vous fait ? » **Gorr** — « Chaud. » **Merlin III** — « Pardon ? » **Gorr** — « Eux, chaud. Gorr, plus seul. » *Merlin reste longtemps silencieux.* « Je l'ai mesuré pendant trente ans, et il ne m'a jamais rien dit. Je ne lui ai jamais rien demandé, c'est vrai. »
- **Merlin et le Chroniqueur** (si `chroniqueur_rejoint`). **Merlin III** — « Onzième du nom. Vous rédigiez bien. » **Le Chroniqueur** — « Je rédigeais faux, Maître. Avec beaucoup d'élégance. » **Merlin III** — « L'élégance n'est pas une faute. » **Le Chroniqueur** — « Elle aggrave les autres. »
- **Merlin et le Ghom.** **Merlin III** — « Mon ancêtre était un Lumineux. Les Immobilistes disent qu'un Ghom est un dieu figé hors du temps. Les Lumineux, qu'il va à la vitesse de la lumière. J'ai fait le calcul pour m'amuser : à cette vitesse, aucun temps propre ne passe. Les deux écoles décrivent peut-être la même chose. » *Il hausse les épaules.* « Je ne tranche pas. Je n'ai pas de mesure. C'est la seule question de cette cité où je n'ai pas de mesure, et c'est la seule où je dors bien. »

**Q06 reposée.** *Avant de partir, Merlin regarde le ciel net par la coupole.*

**Merlin III** — « Votre Carnet contient la plus vieille question du monde, je suppose. Pourquoi quelque chose plutôt que rien. » *Il sourit.* « J'ai la réponse. Le rien est instable. Il ne peut pas durer. Il a fallu que quelque chose soit. C'est aussi simple qu'une balance qui penche. »

1. « Vous avez mesuré le rien ? » → **Merlin III** — *Un long silence.* « … Non. J'ai mesuré le vide. Le vide n'est pas rien : il a de l'énergie, il fluctue. Le rien, je ne l'ai jamais eu sous la main. » *Il rit doucement.* « Vous avez raison. Je retire. Je n'ai pas de réponse. » [`carnet.Q06` reste `ouverte`] [confiance.merlin +1]
2. « C'est une belle réponse. » *(l'accepter)* → *Le héros l'écrit dans le Carnet, à côté de la question.* [`carnet.Q06` = `fausse`]
3. « Personne ne sait. » → **Merlin III** — « C'est une réponse de lâche. » *Un temps.* « Ou une réponse exacte. Je ne sais pas laquelle des deux, et cela m'agace profondément. » [`carnet.Q06` reste `ouverte`]

## Combats

### Combat — Le duel du Registre (fin de chapitre)

*Au matin, Merlin attend l'équipe dans la Salle du Registre, Brutus III à sa droite.*

**Merlin III** — « Je vous propose une expérience. Vous dites que je change ce que je mesure. Je dis que non. Battez-vous contre moi, et je vous mesurerai pendant le combat. Si mes relevés sont exacts et que je ne perturbe rien, vous rentrerez dans le Registre comme tout le monde. Si vous me prouvez le contraire… » *Il hausse les épaules.* « Alors j'aurai appris quelque chose. C'est rare, à mon âge. »

**Brutus III** — « Maître. Ils ont un golem. »
**Merlin III** — « Et vous avez un bouclier, capitaine. Personne ne mourra. C'est une expérience, pas une guerre. »

**Carte :** la Salle du Registre, sous la coupole. Une estrade centrale (`2`) où se tient Merlin, des gradins (`1`), des murs d'instruments (`#`). Six **sondes** de mesure, trois paires de Cristaux d'intrication, sur trépied. Le sol est de verre : on voit la ville en dessous.

```
###.....###
##..1.1..##
#..1...1..#
...1.2.1...
.....2.....
...1.2.1...
#..1...1..#
##.......##
###.....###
```

Surcouche (`M` Merlin III, `B` Brutus III, `G` Hallebardier, `S` Sonneur, `*` sonde, `H` héros, `L` Lyra III, `R` Gorr, `E` Eva III ou Squalor III, `C` le Chroniqueur) :

```
###.....###
##*.1.1.*##
#..1.G.1..#
..*1.B.1*..
.....M...G.
..*1.2.1*..
#..1.S.1..#
##.......##
###HLREC###
```

- Paires de sondes : (2,1) et (8,1) ; (2,3) et (8,3) ; (2,5) et (8,5).

**Équipes :**
- **Alliés :** le héros, Lyra III (à moitié de ses PV si Gorr a été vaincu au ch. 16), Eva III ou Squalor III, le Chroniqueur (s'il a rejoint), Gorr.
- **Ennemis :** **Merlin III** (boss, voir le README de l'ère : Givre, Gel, Relevé, Boule de feu, PV ×1,5), **Brutus III**, 2 Hallebardiers, 1 Sonneur.

**L'action Relevé (Merlin III) :**
- Portée 1 à 5, ligne de vue, un combattant. Temps 0,8. Recharge 2.
- La cible est **Relevée** pendant 2 tours : Merlin et la Garde connaissent ses prochains mouvements (+2 portée pour toutes leurs attaques contre elle).
- **Mais** une mesure consomme une paire de sondes : à chaque Relevé, **une paire de sondes se brise**, et deux petites Lacunes s'ouvrent dans la Salle. Merlin ne le remarque pas ; ou plutôt, il le note comme un « incident d'instrument ».
- Quand les trois paires sont brisées, Merlin ne peut plus utiliser Relevé.

**La Certitude de Merlin :**
- Une jauge visible au-dessus de Merlin : **Certitude 3**.
- Le héros dispose d'une action spéciale, **Argumenter** (temps 0,5, Merlin à 4 cases ou moins, une fois par tour du héros). Elle ouvre la liste des arguments **disponibles**. Un argument recevable fait baisser la Certitude de 1 ; chacun ne sert qu'une fois.

| Argument | Condition | Réplique du héros (choix) | Réponse de Merlin |
| --- | --- | --- | --- |
| **La mesure perturbe** | Merlin a utilisé Relevé au moins une fois **dans ce combat** | « Regardez vos sondes. Votre mesure vient d'ouvrir un trou. » | « Un incident d'instrument… » *Il regarde la Lacune, la sonde brisée, la Lacune encore.* « Non. Ce n'est pas un incident. Pour savoir où vous êtes, il a fallu que quelque chose vous touche. Et ce quelque chose, il a fallu le prendre quelque part. » |
| **Le Gel est né d'une panique** | Archive du Premier Gel lue (ch. 14) | « Votre Gel n'a pas été calculé. Il a été allumé dans la peur, en une nuit. » | « Mes registres disent "dans la sérénité". » *Un temps.* « Mes registres ont été écrits par des gens qui voulaient être sereins après coup. » |
| **Gorr** | `gorr_question` | « Votre outil a posé une question. Il n'a jamais été un instrument. Il était dans le système. » | **Gorr** — « Pourquoi ? » *Merlin baisse la Toise d'un pouce.* « Je n'ai pas de colonne pour ça. » |
| **Les deux rapports** | `chroniqueur_rejoint` | *Le Chroniqueur lève les deux versions de son rapport.* | « Le même rédacteur, la même anomalie, deux textes contraires. Et les deux sont soigneusement tenus. » *Il soupire.* « On ne lit pas le monde de l'extérieur. On le lit d'où l'on est. » |
| **Ceux qui demandent** | `questions_rouvertes` ≥ 3 | « Trois personnes se sont remises à poser des questions. Votre Registre l'avait prévu ? » | « … Non. Mes modèles ne prévoient pas les questions. Ils prévoient les réponses. » |
| **Le Premier Cristal** | `premier_cristal` = `sauve` | *Le héros lève le Cristal, qui pulse.* « Vous n'avez jamais pu le mesurer sans le briser. » | « Aucun jumeau connu… parce que je ne pouvais le connaître qu'en le détruisant. » |
| **Le Fragment éteint** | Archive de la lumière tardive lue (nœud 2) **ou** `ghom_dechu.verite` ≥ 2 | « Les premières Lacunes ne viennent pas de vous. Vous n'êtes pas la cause de tout. Vous en faites partie. » | *Pour la première fois, il a l'air soulagé.* « En faire partie. C'est… moins confortable qu'être dehors. Et plus léger. » |

- Le trait **Voix qui demande** (ch. 13) permet de jouer **deux** arguments dans le même tour, une fois par combat.

**Objectifs :**
- **Principal :** vaincre Merlin III (il **se rend** sous 25 % de PV ; Brutus l'emmène).
- **Objectif secondaire (annoncé sans ★) :** « Convaincre le Maître du Verre. » Certitude à 0 : **le combat devient une Intrication** (voir événements). [`merlin_convaincu` = vrai]
- **◆ Caché :** convaincre Merlin **sans** qu'aucune sonde ait été brisée par l'équipe (n'extraire aucune sonde soi-même). [confiance.merlin +1]
- **◆ Caché :** personne de la Garde ne se disperse. [confiance.brutus +1]
- **Défaite :** le héros se disperse.

**Événements scriptés :**
- **Premier tour de Merlin :** il utilise **toujours** Relevé sur le héros. *(La démonstration est garantie : l'argument « La mesure perturbe » devient disponible dès le premier tour.)*
  > **Merlin III** — « Relevé. Position, vitesse, intention probable. Je vous tiens. »
  > *Une sonde éclate. Une Lacune s'ouvre près du gradin.*
  > **Merlin III** — « Incident d'instrument. Continuons. »
- **Certitude à 2 :** **Merlin III** — « Intéressant. Gênant, mais intéressant. »
- **Certitude à 1 :** *Brutus III regarde Merlin, pour la première fois, comme on regarde quelqu'un qui pourrait se tromper.* **Brutus III** — « Maître ? »
- **Certitude à 0, l'Intrication :** *Merlin pose la Toise. Il traverse l'estrade, sans hâte, et vient se placer sur la case du héros. La Garde s'arrête. Il tend la main, paume ouverte, et la pose sur l'épaule du héros. Leur action combinée se déclenche d'elle-même : un Givre qui ne frappe personne, et qui fait pousser, en l'air, entre eux, une étoile de glace parfaite qui fond aussitôt.*
  > **Merlin III** — « Pour vous connaître, il a fallu vous toucher. Et en vous touchant, j'ai changé. Mes sondes ont changé. La salle a changé. » *Il regarde la Lacune la plus proche.* « On ne connaît pas le monde depuis l'extérieur. Il n'y a pas d'extérieur. On le connaît en en faisant partie. Je… je vais devoir réécrire le premier chapitre de tout. »
  > **Brutus III** — *Il abaisse son bouclier. Lentement.* « Si lui doute… alors moi aussi, j'ai le droit. »
  
  Le combat s'arrête : **personne n'a gagné**.
- **Si Merlin tombe sous 25 % de PV (non convaincu) :**
  > **Merlin III** — « Mes relevés étaient exacts. Exacts ! » *Il regarde les sondes brisées.* « … Tous exacts. Et pourtant. » *Brutus le relève et l'emmène, sans un mot.*

**Répliques de combat :**
- **Merlin III** (Gel) — « Restez immobiles. Vous êtes plus faciles à lire. »
- **Merlin III** (Boule de feu, s'il est sous 50 % de PV) — « Le feu. Je l'avais presque oublié. Il est toujours là, dessous. »
- **Brutus III** — « Personne ne touche au Maître. »
- **Lyra III** — « Il ne ment pas. C'est presque pire. »
- **Eva III** — « Il prévoit nos trajectoires. Je fais pareil. Sauf que moi, ça ne casse rien. » *Un temps.* « … À vérifier. »
- **Squalor III** — « Il mesure tout. Moi aussi, avant de mordre. Mais moi je sais que ma proie bouge quand je la regarde de trop près. »
- **Gorr** — « Lui… compte. Gorr, pas chiffre. »
- **Le Chroniqueur** — « Maître, sauf votre respect, vous êtes en train de devenir une source primaire. »

### Variante : `transformation.II` = `B` (Écailles de marée)

Les cases gelées par le Gel de Merlin ne ralentissent pas le héros. **Merlin III** — « Le froid ne vous prend pas. Où avez-vous appris ça ? » *Le héros peut répondre :* « Dans la mer. » *(Sans effet.)*

## 5. Ce que pèse une mesure (Rencontre)

### Si `merlin_convaincu`

*Merlin à la table lumineuse. Il refait un calcul, à la main, sur une feuille.*

**Merlin III** — « Trente et une saisons. Je les avais calculées sans compter mes propres mesures. Le Registre, à lui seul, a consommé sept Cristaux sur cent depuis l'an 1. Pour **savoir** combien il en restait. » *Il pose la plume.* « Avec mes mesures, il ne reste pas trente et une saisons. Il en reste… zéro. On les a déjà dépensées. On vit à crédit depuis dix ans. »

**Q17 répondue :** *On ne peut pas connaître le monde sans le changer. Mesurer, c'est interagir, donc perturber. On le connaît en en faisant partie.* [`carnet.Q17` = `repondue`]

*Il plie la carte des Lacunes, la vraie, avec la carte des mines par-dessus, et la tend au héros.*

**Merlin III** — « Prenez-la. Je préfère qu'elle soit dans les mains de quelqu'un qui bouge. » [`carte_des_lacunes` = vrai] [confiance.merlin +2]

*Si `confiance.merlin` ≥ 3, il ajoute :* « Et… si je peux me permettre. Vous n'avez pas de nom, je crois. J'en aurais un. » « **Constante.** Ce qui ne change pas quand tout le reste change. Je vous ai mesuré à trois époques : vous êtes la seule valeur qui revienne. » *(arc F : le héros répond « Je m'en souviendrai » [`nom.propositions` += `merlin`] ou « Non » ; le nom ne se prend qu'à la Nomination, ch. 28.)*

### Si Merlin n'est pas convaincu

*L'Observatoire est vide. Brutus a emmené Merlin. Sur la table, la carte des Lacunes.*

- **Si `chroniqueur_rejoint` :** **Le Chroniqueur** — « Je la copie. Ce n'est pas du vol, c'est de l'archivage. » [`carte_des_lacunes` = vrai]
- **Sinon :** *La carte est scellée sous une plaque de verre épais.* [`carte_des_lacunes` = faux]
- **Q17 :** si l'argument « La mesure perturbe » a été joué, [`carnet.Q17` = `repondue`] : *le héros a vu, lui, ce que Merlin n'a pas voulu voir.* Sinon, elle reste `ouverte`.

### Dans tous les cas

*Un bruit, très bas, monte de la ville. Pas un tintement : un craquement. Le sol de verre de la Salle du Registre, sous les pieds de l'équipe, se zèbre d'une ligne fine, blanche, qui court vers le nord, vers la Basse-Ville, vers les Mines.*

**Merlin III** (s'il est là) — « Ah. » *Il regarde la ligne.* « Ça, je l'avais prévu. Pas si tôt. »
**Gorr** — « Ça… croît. »
**Lyra III** — « Non, Gorr. Ça se fend. »

> **Extrait des archives — Registre, an 312, dernière entrée de la main du Maître.**
> {Si `merlin_convaincu` : « Erratum général. Toutes les mesures du Registre sont exactes. Toutes ont été faites de l'intérieur. Toutes ont coûté. Je n'ai jamais été à l'extérieur de rien. — M. »}
> {Sinon : « Incident d'instrument. Six sondes. Le reste est exact. — M. »}
> *(Si `chroniqueur_rejoint`, annoté sous l'erratum : « Première fois en trois siècles qu'un erratum est plus long que l'article. — C. »)*

## Choix et conséquences

| Choix ou objectif | Drapeaux | Effet plus tard |
| --- | --- | --- |
| Révélation de la carte | — | **Arc A révélé :** les Lacunes grandissent exactement là où l'on a miné. Le Carnet note une remarque (pas une question). |
| Archive de la lumière tardive | `archives.lues +1`, `usure +1`, `ghom_dechu.verite +1` | Argument ; arc E. |
| Q06 : accepter « le rien est instable » | `carnet.Q06` = `fausse` | Arc C (fin secrète compromise). |
| Q06 : garder ouverte | `carnet.Q06` = `ouverte` | — |
| Certitude à 0 | `merlin_convaincu` = vrai, `carte_des_lacunes` = vrai, `carnet.Q17` = `repondue` | Merlin III rejoint pour le ch. 18 ; la lignée de Merlin restera du côté du héros en ère IV (Confiance transmise). |
| Merlin vaincu | `merlin_convaincu` = faux | Merlin III ne paraît plus qu'à la fin du ch. 18, seul, au milieu des fissures. |
| Carte des Lacunes emportée | `carte_des_lacunes` | **Objet fil rouge** pour l'ère IV : elle montre où sont les Lacunes (refuges des révoltés de Nyx IV), et lesquelles le héros a lui-même ouvertes. |
| ◆ Garde épargnée | confiance.brutus +1 | Portes (ch. 18). |

## Récompenses

- **Si `merlin_convaincu` : Merlin III** combat aux côtés de l'équipe au ch. 18 (kit de Merlin de `content.ts`, titre lore : **Thermiste**, plus Gel ; sans Relevé : « Je ne mesure plus rien aujourd'hui. Je fais. »).
- **Objet : la carte des Lacunes** (si `carte_des_lacunes`). *Deux plaques de verre superposées : l'Archipel, ses taches grises, et les puits de mine qui tombent dedans. Certaines taches sont toutes petites, toutes neuves.* Effet : sur la carte du monde, les Lacunes ouvertes par l'équipe sont signalées.
- **Habit : Écharpe de thermiste.** *Une longue écharpe grise tissée de fils de cuivre, qui garde la chaleur du corps.* Effet : **+1 Défense énergétique** ; le Ralenti dû au froid (Givre, Gel) dure 1 tour de moins.

## Graines pour la suite

- **Arc A :** la cause des Lacunes de l'ère III est établie dans le monde : l'extraction **et** le Gel (le froid, l'immobilité). Les plus anciennes, elles, viennent d'ailleurs (arc E).
- **Arc E :** le Fragment éteint, vu par la lumière tardive, est la même histoire que les strates du ch. 11, vue d'un autre point de l'Archipel.
- **Brutus III** a abaissé son bouclier (si Merlin est convaincu) ou emmené son maître vaincu. Dans les deux cas, il va devoir choisir, au ch. 18, entre fermer les portes d'une cité qui se fend et les ouvrir.
- **La Toise** (le bâton de Merlin, objet fil rouge) : si Merlin est convaincu, il s'en sert désormais comme d'une canne, plus comme d'une règle. Au ch. 18 elle se brise dans la Fêlure ; la lignée en gardera les deux morceaux (**à reprendre en ère IV**).

## Notes de mise en œuvre

- **Certitude :** jauge d'ennemi spéciale, modifiée par des choix de dialogue en combat (action Argumenter). Les arguments indisponibles s'affichent grisés avec leur condition en clair (« Il vous manque une trace : la nuit du Premier Gel »).
- **Relevé :** action ennemie qui détruit une paire d'entités-sondes et y crée des Lacunes. L'IA de Merlin l'utilise au premier tour, puis dès que sa recharge le permet tant qu'il reste des sondes.
- **Fin par Intrication :** condition de fin « sans vainqueur » (comme le ch. 24) ; scène scriptée du déplacement de Merlin vers la case du héros, puis action combinée Merlin + héros forcée, sans cible.
- **Le sol de verre :** à la fin du chapitre, la fissure doit se voir sur le décor de la Salle, et rester sur la carte du monde jusqu'au ch. 18.
- **Pas de Dispersion** possible pour Merlin III ni Brutus III dans ce combat (reddition à 25 %).
