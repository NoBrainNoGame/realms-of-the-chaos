# Chapitre 18 — La Fêlure

> « Ce qui ne bouge pas ne plie pas. Ce qui ne plie pas casse. »
> — *Note de la main du Maître du Verre, trouvée sur la table de l'Observatoire, sans date.*

## Fiche

| | |
| --- | --- |
| Ère | III — L'Âge du Verre |
| Lieu | Vitrelle : la Haute-Ville, la place du Registre, les Portes, le Pont de l'Est ; enfin la Salle du Puits |
| Équipe | Le héros, Lyra III, Eva III ou Squalor III, le Chroniqueur (si `chroniqueur_rejoint`), Gorr ; **Merlin III** si `merlin_convaincu`. **Tous restent** à la fin : le héros descend seul dans le Puits. |
| Durée visée | 6 nœuds, 1 combat |
| Question au Carnet | **Q18** — *Le monde a-t-il besoin de nous pour avoir un sens ?* |

## Ce que le joueur sait en arrivant

- Les Lacunes grandissent exactement là où l'on mine (ch. 17). Le Gel vit à crédit : selon Merlin, il ne reste plus de saisons de Cristaux.
- Une fissure blanche vient de traverser le sol de la Salle du Registre et court vers la ville.
- Questions ouvertes de l'ère qui trouvent ici leur réponse : **Q03** (ch. 3), **Q13** (ch. 13), **Q15** (ch. 15).

## Synopsis

Vitrelle se fend. Ce n'est pas une attaque, ni une Marée : c'est la cité elle-même. Sous elle, le Tissu a été aminci par trois siècles de mines ; autour d'elle, le Gel s'essouffle ; et le verre, qui ne plie pas, ne peut que casser. Les fissures suivent exactement les veines qu'on a vidées et les lampadaires qu'on a brisés. Il faut évacuer des habitants qui ne savent plus bouger d'eux-mêmes, convaincre Brutus III d'ouvrir des portes qu'il garde fermées depuis toujours, et, au cœur de la Fêlure, **rendre un Cristal au monde** : en sacrifier un des siens pour que le Tissu se renoue un peu. La cité ne sera pas sauvée. Elle sera **ouverte**. Puis la Fêlure descend jusqu'au Puits, et le héros y retourne, seul. Gorr, qui vit plus longtemps que les cités, dit qu'il attendra.

## Carte du chapitre

```
[1 Rencontre : la ville qui craque]  → Q03 et Q13 trouvent leur réponse
        │
[2 Rencontre : les Portes]  → `brutus_portes_ouvertes` (ou pas encore)
        │
[3 Veillée courte : ce qu'on peut rendre]  → le Cristal du lien ; un nom, peut-être
        │
[4 Combat (fin de chapitre) : l'évacuation]  → `vitrelle_evacues`, `cristal_rendu`, transformation
        │
[5 Rencontre : le premier vent]  → Q15 répondue ; Q18 entre au Carnet
        │
[6 Fin : le Puits]  → retour au Puits ; Chronique interrompue ou annotée
```

## Scènes

### 1. La ville qui craque (Rencontre)

*La Haute-Ville. Les tours de verre chantent : un son aigu, continu, comme un doigt mouillé sur le bord d'un verre. Des lignes blanches courent sur les façades. Derrière les parois, les habitants sont toujours assis à leur table. Ils regardent les fissures. Ils ne bougent pas.*

> **Extrait des archives — Avis à la population, affiché à 6 heures.**
> « Des fissures sont constatées. Elles sont mesurées. Restez chez vous. Le Registre vous informera. »
> *(Si `chroniqueur_rejoint`, une main a ajouté en dessous, à la craie : « Le Registre ne vous informera pas. Sortez. — C. »)*

**Merlin III** (s'il est là) — « Le verre ne se déforme pas, il n'a aucune souplesse. Quand le sol bouge sous lui, il ne peut pas suivre : il casse. Et le sol bouge, parce que dessous, le Tissu est troué partout où nous avons miné. Tant que le Gel tenait tout immobile, la tension s'accumulait sans rien dire. Le Gel faiblit. Elle parle. »

**Le Chroniqueur** (s'il est là) — « Regardez le tracé. Il passe par la Basse-Ville, par la Mine, par la Fonderie. Il relie nos Lacunes comme un enfant relie des points. »

*Si l'équipe a brisé des lampadaires au ch. 13 : une fissure part exactement de l'endroit où ils étaient. Personne ne le fait remarquer. Le joueur le voit.*

**Lyra III** — « Ils ne bougent pas. Ils attendent qu'on leur dise. Personne ne leur a rien dit depuis trois cents ans, à part "restez". »

*Le héros regarde une maison où une femme est assise, immobile, pendant que la paroi se fend au-dessus de sa tête.*

**Q03 trouve sa réponse.** *Si tout est fixé, sommes-nous encore vivants ?* Non. Un vivant est une forme traversée par un flux ; figée, elle ne vit plus, elle dure. [`carnet.Q03` = `repondue`]
**Q13 trouve sa réponse.** *Une vie sans questions est-elle une vie ?* La cité sans questions ne vivait plus. Elle tenait, c'est tout. [`carnet.Q13` = `repondue`]

*Choix du héros, en frappant à la paroi :*
1. « Sortez ! » → *La femme le regarde. Elle ne comprend pas le mot.*
2. « Vous voulez sortir ? » → *La femme le regarde. Puis, lentement, elle se lève.* [confiance +1]
   - **Lyra III** — « Tu vois. Une question. Pas un ordre. »

### 2. Les Portes (Rencontre)

*Les Portes de Vitrelle : deux battants de verre trempé, hauts comme quatre hommes, fermés depuis le Gel. Devant, Brutus III et une ligne de Hallebardiers.*

**Brutus III** — « Personne ne sort. Dehors, il fait froid, il y a le Clair, il y a des Lacunes. Ici, il y a des murs. »

*Il ne regarde pas l'équipe. Il regarde la fissure qui monte le long des battants.*

**Brutus III** — « Mes ancêtres gardaient un village où rien ne changeait. Demeure, ça s'appelait. Puis ils sont venus au nord, avec les Thermistes, pour arrêter les Marées. On me l'a raconté quand j'étais petit. Ils disaient que c'était pour protéger. J'ai fait pareil. J'ai tout figé, pour qu'ils soient en sécurité. » *Un temps.* « Et c'est ce qui les tue. »

*Conditions :*
- **Si `merlin_convaincu`** : **Merlin III** — « Capitaine. Ouvrez. Ce n'est pas un ordre : je n'ai plus d'ordres. C'est une mesure. » → Brutus ouvre. [`brutus_portes_ouvertes` = vrai]
- **Sinon, si `confiance.brutus` ≥ 3** (mineurs sauvés, gardes épargnés…) : le héros a une option :
  1. « Tu as tenu une poutre pour tes mineurs. Pas un mur. » → **Brutus III** — *Il ferme les yeux.* « … Une poutre, ça plie. Un mur, ça casse. » *Il pose la main à plat sur le battant.* « Ouvrez. » [`brutus_portes_ouvertes` = vrai]
- **Sinon :**
  1. « Ouvre, Brutus. » → **Brutus III** — « Non. » *Il lève son bouclier. Les Portes resteront fermées au début du combat.*
  2. « Qu'est-ce que tu protèges, exactement ? » → **Brutus III** — *Long silence.* « Je ne sais plus. » *Les Portes restent fermées, mais Brutus III pourra être convaincu en combat (voir plus bas).* [confiance.brutus +1]

### 3. Ce qu'on peut rendre (Veillée courte)

*Un abri sous un porche, pendant qu'une tour s'effondre lentement au loin, presque en silence. L'équipe se compte.*

**Le Cristal du lien.** *Lyra III ouvre la main du héros. Dans sa paume, il y a un petit Cristal, clair, qui n'y était pas hier. Il bat doucement, par paires.*

**Lyra III** — « Les vieux disaient que les liens forts laissent des cristaux. Que c'est comme ça qu'ils se forment, au fond des mines : des gens qui ont tenu ensemble, il y a très longtemps. Je ne les croyais pas. » *Elle regarde le Cristal.* « Celui-là, il est à nous. »

*(Le Cristal du lien relie le héros à l'Écho de l'équipe avec qui il a réussi le plus d'Intrications pendant l'ère, Lyra III par défaut. Le texte s'adapte.)*

**Ce que l'on peut rendre au monde, au cœur de la Fêlure :**
- **Le Premier Cristal** (si `premier_cristal` = `sauve`). **Le Chroniqueur** — « La plus vieille archive vivante de l'Archipel. Si on la rend, personne ne pourra plus la lire. Mais tout ce qu'elle reliait reliera de nouveau quelque chose. »
- **Le Cristal du lien.** **Lyra III** — « Ce serait… rendre ce qu'on a tissé. Le lien ne disparaîtra pas. On ne l'aura plus dans la main, c'est tout. »
- **Une part de Gorr** (si `confiance.gorr` ≥ 3, ou si le héros a montré le Carnet à Gorr au ch. 16). **Gorr** — « Gorr croît. Gorr donne… un peu. Gorr repousse. » *Lyra III* — « Tu ne repousseras pas tout, Gorr. Rien ne repousse tout. » **Gorr** — « … Un peu, Gorr repousse. »

*Le joueur ne choisit pas ici : le choix se fait en combat, au cœur de la Fêlure.*

**Arc F — un nom, peut-être.** *Si `nom` = `aucun` :*
- **Si `confiance.lyra` ≥ 3 :** **Lyra III** — « Tu n'as pas de nom. Dans ma famille, on donne aux enfants le nom de ce qu'on a réussi à réparer. J'en ai un pour toi. » *(Le nom proposé par la lignée de Lyra dit sa vision du héros : quelqu'un qui recoud. À fixer par la rédaction de l'arc F.)* [`nom.propositions` += `lyra`]
- **Si `gorr_question` et `confiance.gorr` ≥ 3 :** **Gorr** — *Il pose un doigt de cristal sur la poitrine du héros.* « Chaud. » *Un temps.* « Toi : Chaud. » *Tout le monde comprend que c'est un nom.* [`nom.propositions` += `gorr`]
- Choix du héros, pour chaque proposition :
  1. Accepter. [`nom` = `<lignée>`]
  2. « Pas encore. » [`nom` reste `aucun` ; la proposition est gardée]

## Combats

### Combat — L'évacuation (fin de chapitre)

**Carte :** la place du Registre, au cœur de la Haute-Ville. Au centre, **le cœur de la Fêlure** (`O`), un cratère gris où la ville s'ouvre. Autour, un anneau de creux (`a`) qui s'effondre. Au nord, **les Portes** (`>` de la ligne 0). À l'est, **le Pont de l'Est** (`>` de la ligne 4), qui sera coupé. Quatre lampadaires à Cristal. Six **groupes d'habitants** (`h`), entités neutres.

```
####.....####
#...........#
..1...a...1..
..1..aaa..1..
.....aba.....
..1..aaa..1..
..1...a...1..
#...........#
####.....####
```

Surcouche (`B` Brutus III, `G` Hallebardier, `>` sortie, `h` groupe d'habitants, `O` cœur de la Fêlure, `*` Cristal-lampadaire, `M` Merlin III (si convaincu), `H` héros, `L` Lyra III, `R` Gorr, `E` Eva III ou Squalor III, `C` le Chroniqueur) :

```
####>>B>>####
#.G.......G.#
h.1.*.a.*.1..
h.1..aaa..1..
h.*..aOa..*.>
h.1..aaa..1..
..1...a...1.h
#...M.h.....#
####HLREC####
```

- Paires de lampadaires : (4,2) et (10,4) ; (8,2) et (2,4).
- Les Portes (cases `>` de la ligne 0) sont **infranchissables** tant qu'elles sont fermées.

**Équipes :**
- **Alliés :** le héros, Lyra III, Eva III ou Squalor III, le Chroniqueur (s'il a rejoint), Gorr, Merlin III (s'il est convaincu).
- **Neutres :** 6 groupes d'habitants. Un groupe **ne bouge pas seul** : il suit (2 cases par tour, vers la sortie ouverte la plus proche) tant qu'un allié a fini son tour à côté de lui. **Exception :** pour chaque habitant chez qui le héros a rouvert une question (`questions_rouvertes`), un groupe est **autonome** (il bouge seul) : Odile, Tobin, Pia, Corin ou l'héritier en font partie et guident les autres. Garance aussi, si elle a été rencontrée au ch. 15.
- **Brutus III et 2 Hallebardiers :**
  - si `brutus_portes_ouvertes` : ils sont **alliés neutres** ; ils guident eux-mêmes un groupe chacun (deux groupes autonomes de plus).
  - sinon : ils **tiennent les Portes** (ennemis, mais ils ne quittent pas la ligne 0 et la ligne 1).
- **Pas d'autres ennemis.** L'adversaire du chapitre, c'est la Fêlure.

**Objectifs :**
- **Principal :** évacuer **au moins 3 groupes** d'habitants (un groupe qui atteint une sortie ouverte quitte la carte). [`vitrelle_evacues` = nombre de groupes sortis]
- **★ Annoncé : Rendre un Cristal au monde.** Un allié porteur d'un Cristal (le Premier Cristal, le Cristal du lien, ou une part de Gorr détachée par lui) atteint une case **adjacente au cœur** `O` et exécute **Rendre** (temps 1). [`cristal_rendu` = `premier` / `lien` / `gorr`, `cristaux.donnes +1`]
- **◆ Caché :** les 6 groupes évacués. [confiance +2]
- **◆ Caché :** aucun lampadaire brisé par l'équipe. [confiance.lyra +1]
- **Fin :** au **temps 90**, la place s'effondre dans la Fêlure et le combat se termine (bilan).
- **Défaite :** le héros se disperse (la Fêlure n'achève personne : une case qui devient Lacune fait **glisser** le combattant et lui coûte de l'Usure, mais ne le tue pas).

**La Fêlure qui grandit :**

| Temps | Ce qui s'ouvre (cases qui deviennent Lacune) |
| --- | --- |
| 0 | Le cœur `O` (6,4). |
| 15 | Vers l'est : (7,4), (8,4). |
| 30 | Vers le nord : (6,3), (6,2), (6,1). |
| 45 | Vers l'ouest : (5,4), (4,4), (3,4). |
| 60 | **Le Pont de l'Est est coupé :** (9,4), (10,4), (11,4), (12,4). Seules les Portes restent comme sortie. |
| 75 | L'anneau `a` entier, et (6,5), (6,6), (6,7). La place est coupée en quatre. |
| 90 | Effondrement final. |

- **Extraction ici :** au ch. 18, une Lacune d'extraction grandit jusqu'au **rayon 2**, et chaque lampadaire brisé **avance la Fêlure** : l'étape suivante du tableau se produit immédiatement. Le gain (Élan ou soin) reste disponible. La tentation est maximale : les habitants sont lents et blessés.

**Rendre le Cristal :**
- Quand **Rendre** est exécuté, le Cristal se dissout dans le cœur de la Fêlure. **La Fêlure cesse de grandir** pour le reste du combat, et la dernière étape ouverte **se referme** (le Tissu se renoue un peu : `lacunes.recousues +1`).
- **Le choix de la transformation se fait à ce moment**, selon la manière :
  - **Seul, contre soi** : le porteur est le héros, seul sur sa case. *Il serre le Cristal contre sa poitrine en le donnant ; la poussière de cristal qui jaillit de la Fêlure entre dans ses veines.* → **Veines de cristal** (A).
  - **À deux mains, avec un autre** : le héros et un autre Écho sont **sur la même case** et exécutent Rendre en **Intrication** (action combinée). *Ils tendent le Cristal ensemble ; le verre qui se forme sur leurs paumes ne casse pas.* → **Mains de verre** (B).
  - Si c'est **un autre Écho** qui rend le Cristal sans le héros, ou si **aucun Cristal n'est rendu** : → **Veines de cristal** (A) par défaut (à la fin, en traversant la Fêlure, la poussière de cristal entre dans les veines du héros).

**Convaincre Brutus en combat** (si les Portes sont fermées) :
- Un allié adjacent à Brutus III peut **Parler** (temps 0,5). Effet selon la situation :
  - si au moins un groupe d'habitants est **adjacent aux Portes** et que `confiance.brutus` ≥ 1 : Brutus ouvre. [`brutus_portes_ouvertes` = vrai]
  - sinon : **Brutus III** — « Pas encore. Personne n'est encore là. » (On peut réessayer.)
- Si Brutus tombe sous 30 % de PV, il **se retire** sans ouvrir. Les Hallebardiers ouvrent alors d'eux-mêmes, deux tours plus tard. [`brutus_portes_ouvertes` reste faux]

**Événements scriptés :**
- **Temps 0 :** **Lyra III** — « On ne sauve pas la ville. On sauve les gens. La ville, elle, on la laisse partir. »
- **Gorr, action spéciale « Pont de cristal »** (ce chapitre seulement) : Gorr cible une case de Lacune adjacente ; il y fait croître son propre cristal, et la case redevient franchissable jusqu'à la fin du combat. Chaque pont coûte à Gorr **3 PV max** (Usure : ça ne repousse pas). **Gorr** — « Gorr croît. Là. »
- **Premier groupe évacué :** *Dehors, au-delà des Portes ou du Pont, un groupe d'habitants s'arrête, se retourne, et regarde la ville comme on regarde un paysage. Pour la première fois.*
- **Si un groupe autonome mené par Pia sort :** **Pia** — « Ça pousse ! Quelque chose me pousse les cheveux ! » *(Voir nœud 5.)*
- **Si Corin est dans un groupe guidé par le héros :** *Corin prend la main du héros pour avancer. Cette fois, il la prend.*
- **Si `lacunaire.forme` = `recif` et que Gorr passe à côté de Corin :** *Gorr s'arrête, touche du bout du doigt les plaques calcaires de l'épaule de Corin.* **Gorr** — « Lui… pierre aussi ? » **Corin** — « Nous… je ne sais pas. Un peu. » **Gorr** — « Un peu, c'est bien. » *(Gorr reconnaît un être qui, comme lui, fait de la roche avec ce qui le traverse. C'est la première fois qu'il rencontre quelqu'un qui lui ressemble.)* [confiance.gorr +1]
- **Temps 60 (Pont coupé) :** **Eva III** — « Pont coupé. Tout le monde par le nord. Probabilités… non. Courez. » / **Squalor III** — « Le pont tombe. Si quelqu'un sait nager, c'est le moment. Moi je sais. »

**Répliques de combat :**
- **Merlin III** (Gel sur une fissure pour la ralentir) — « Le froid une dernière fois. Pour retenir, pas pour figer. La nuance a l'air mince. Elle ne l'est pas. »
- **Le Chroniqueur** — « Je n'écris plus. Je porte des gens. J'ai écrit qu'on ne pouvait pas faire les deux. C'était faux aussi. »
- **Brutus III** (Portes ouvertes) — « Sortez. Doucement. Personne ne pousse. » *Puis, plus bas :* « Personne ne reste. »
- **Gorr** (Pont de cristal) — « Passe. Gorr tient. »
- **Lyra III** (soigne un habitant) — « Je paie. Avance. »

## 5. Le premier vent (Rencontre)

*Après l'effondrement de la place. L'équipe, hors des murs, ou sur ce qu'il en reste. Les habitants évacués sont assis dans l'herbe rase, au bord du Fragment. Il y a de l'air qui bouge. L'air chaud de la ville fendue monte par les fissures, l'air froid du Gel descend : pour la première fois depuis trois siècles, il y a une différence de température, et donc un courant.*

**Pia** (si elle a été évacuée) — « C'est ça ? C'est ça, le vent ? »
- Choix du héros :
  1. « Oui. » → *Elle rit.*
  2. « Qu'est-ce que tu en penses ? » → **Pia** — « Que ça pousse. Que ça pousse tout. Que rien ne reste pareil. » *Elle a l'air ravie.* [confiance +1]

**Q15 trouve sa réponse.** *Que perd-on quand un lien devient une ressource ?* Le lien lui-même. On l'a brûlé pour durer, et le Tissu s'est effiloché là où l'on minait, jusqu'à ce que la ville tombe dedans. [`carnet.Q15` = `repondue`]

**Lyra III** — « Le Collège disait qu'on ne perdait rien. On perdait ce qui tenait la ville. On ne le voyait pas, parce que ça ne se mesure pas en chaleur. »

*Selon `cristal_rendu` :*
- **`premier`** : **Le Chroniqueur** — « La plus vieille archive de l'Archipel est dans le sol, maintenant. Personne ne la lira plus. » *Un temps.* « Elle fait mieux que d'être lue. Elle tient quelque chose. »
- **`lien`** : **Lyra III** — *Elle regarde sa main vide, puis celle du héros.* « Je le sens encore. Ce n'était pas le Cristal, le lien. Le Cristal, c'était sa trace. »
- **`gorr`** : *Gorr a une entaille claire au flanc, là où il s'est donné.* **Gorr** — « Gorr moins. » *Un temps.* « Gorr pas moins. Gorr… ailleurs aussi. »
- **`aucun`** : **Lyra III** — « On n'a rien rendu. On a pris jusqu'au bout. » *Elle ne reproche rien. Elle constate, comme Merlin.*

**Q18.** *La ville fendue, derrière eux, au soleil. Elle est belle, même cassée. Surtout cassée.*

**Le Chroniqueur** (s'il est là) — « Si Vitrelle tombe, et que personne ne l'écrit… est-ce que ça aura voulu dire quelque chose ? »
*(Sinon, c'est **Merlin III** s'il est là : « Si personne ne mesure cette chute, aura-t-elle eu lieu ? » Il se reprend aussitôt : « Si, bien sûr. La pierre n'a pas besoin de moi pour tomber. C'est autre chose que je demande. » ; sinon **Lyra III**.)*

**Q18 entre au Carnet :** *Le monde a-t-il besoin de nous pour avoir un sens ?* [`carnet.Q18` = `ouverte`]

**Brutus III** (s'il a ouvert les portes) — *Il s'assoit dans l'herbe, retire son casque de verre.* « Le vent. Il fait froid, il fait chaud, ça change tout le temps. C'est… inconfortable. » *Un temps.* « Il va falloir protéger autre chose. Quelque chose qui bouge. Je ne sais pas comment on fait. » [graine de Brutus IV]

## 6. Le Puits (Fin)

*La Fêlure a continué de descendre. Sous la place effondrée, à travers les étages de verre brisé, on voit la Salle du Puits, et, plus bas, la lueur rouge et immobile de l'amas dense : la Pierre Lente, comme disaient les ondines. La cuve de verre du héros a éclaté. Le Puits, lui, est toujours là : rien de ce qui arrive aux villes ne l'atteint.*

*Le héros sent une pression dans l'air, lente, comme un temps qui s'épaissit. Le Ghom. Personne ne le dit. Tout le monde le sent.*

**Lyra III** — « Tu y retournes. » *Ce n'est pas une question.* « Tu reviendras dans combien ? »
1. « Je ne sais pas. » → **Lyra III** — « Alors je ne t'attendrai pas. Je soignerai des gens. C'est mieux que d'attendre. » *Elle sourit.* « Mais je raconterai à mes enfants qu'il faut garder une lampe à huile, au cas où. »
2. « Longtemps. » → **Lyra III** — « Alors ce ne sera pas moi. Ce sera une autre, avec mon nom. Sois gentil avec elle. Elle sera sûrement aussi têtue. »

*Les adieux, un par un (une ligne chacun) :*
- **Eva III** — « Probabilité de te revoir : nulle. Je parie quand même. »
- **Squalor III** — « Je garde l'eau pour toi. Elle bougera, maintenant. »
- **Le Chroniqueur** — « Je vais tout écrire. Deux fois. Une version pour ceux qui veulent croire, une pour ceux qui veulent vérifier. Et je les relierai ensemble, pour qu'on ne puisse pas lire l'une sans voir l'autre. »
- **Merlin III** (s'il est convaincu) — « Je vais baisser le Gel. Lentement, une saison à la fois. Pas l'éteindre : on retomberait dans les Marées. Trouver le bord, entre les deux. Je n'ai pas de mesure pour ça. Je vais devoir essayer. » *Il lui tend la Toise ; elle est fendue en deux depuis la Fêlure. Il en garde une moitié.* « L'autre moitié est pour le prochain qui me ressemble. Dites-lui de s'en servir comme d'une canne, pas comme d'une règle. »
- **Brutus III** — « Je protège ceux-là, maintenant. Dehors. » *Il hésite.* « Ça bouge tout le temps, dehors. »

**Gorr** reste le dernier. Il ne dit rien un long moment.

**Gorr** — « Toi, dormir. »
**Gorr** — « Gorr, pas dormir. Gorr croît. »
*Un temps.*
**Gorr** — « Gorr attend. »

1. « Ce sera très long, Gorr. » → **Gorr** — « Long. » *Il regarde le ciel, qui commence à se couvrir : les premiers nuages depuis trois siècles.* « Gorr… aime long. »
2. « Tu te souviendras de moi ? » → **Gorr** — *Il pose la main sur le Bracelet de quartz, s'il est là.* « Gorr garde. Dans Gorr. » *(Pas un souvenir : une forme. Le cristal garde la trace de ce qu'il a traversé.)*
3. *Poser la main sur son flanc, sans rien dire.* → *Le cristal est tiède. Sous la main, la vibration lente. Et une autre, plus rapide, qui n'était pas là au ch. 15 : un rythme qu'il a appris de quelqu'un.* [confiance.gorr +1]

*Le héros descend dans la Fêlure. Les sons d'en haut montent dans les aigus et s'accélèrent ; la lumière du ciel bleuit. Là-haut, de plus en plus vite, les nuages passent, les saisons passent, la ville fendue se couvre de mousse. Le dernier plan, vu d'en bas : une silhouette de cristal gris-vert, au bord du gouffre, qui ne bouge pas, et qui pourtant **grandit à vue d'œil** : vue du fond du Puits, sa croissance lente est devenue rapide. Gorr croît. Gorr attend.*

**Transformation de l'ère III** (selon la manière de rendre, voir le combat) :
- **A — Veines de cristal.** *Sous la peau des bras et du cou, de fines veines claires luisent quand le héros fait un effort.* Effet : **+1 Élan** maximum pour le Ghom (et +1 Élan au début de chaque combat). [`transformation.III` = `A`]
- **B — Mains de verre.** *Les paumes et les doigts du héros sont devenus d'un verre souple, tiède, qui ne casse pas.* Effet : **Intrication renforcée** : les actions combinées du héros coûtent 1 de recharge en moins, et leurs effets sont augmentés de 20 %. [`transformation.III` = `B`]

> **Extrait des archives — Rapport n° 312-0441, Bureau du Classement.**
>
> **Si `chroniqueur_rejoint` :**
> « Objet : Vitrelle. Classement demandé : **ville ouverte**. 1. Constat : la cité s'est fendue le 3 du mois des Vents (mois créé ce jour, faute de nom pour ce qui souffle). {`vitrelle_evacues`} groupes d'habitants sont sortis. Ils ne savent pas encore où aller. Ils posent des questions. 2. L'anomalie 0-PUITS-1 est redescendue dans le Puits. Elle n'est plus classée. Elle n'a jamais été une anomalie : c'est notre registre qui en était une. 3. Mesures recommandées : aucune. Regarder ce qui pousse. — Le Chroniqueur (11e), sans bureau. »
>
> **Sinon :**
> « Objet : fissures. Les fissures sont mesurées. Les habitants sont priés de rester chez eux. Le Registre les informera dès que la cause aura été classée. Le Bureau rappelle que les questions ne sont pas interdites, mais que la sécurité publique exige que »
> *(Le texte s'arrête au milieu de la ligne. La page suivante est blanche.)*

## Choix et conséquences

| Choix ou objectif | Drapeaux | Effet plus tard |
| --- | --- | --- |
| Constat de la ville figée | `carnet.Q03` = `repondue`, `carnet.Q13` = `repondue` | Arc C. |
| Portes ouvertes (avant ou pendant le combat) | `brutus_portes_ouvertes` = vrai | Brutus IV hérite d'une lignée qui « protège ce qui bouge » : plus haute Confiance de départ en ère IV ; il est moins enclin à « retenir » au ch. 21 (Q21). |
| Portes jamais ouvertes par Brutus | `brutus_portes_ouvertes` = faux | Brutus IV hérite du doute sans la réponse ; sa réplique tentante de Q21 (« Ce que tu as fait naître t'appartient ») vient de là. |
| Groupes évacués | `vitrelle_evacues` = 0 à 6 | En ère IV, les descendants des évacués peuplent un village au bord du Fragment, « les Venteux » ; plus ils sont nombreux, plus le village compte. |
| Rendre le Premier Cristal | `cristal_rendu` = `premier`, `cristaux.donnes +1`, `lacunes.recousues +1`, `cristaux.gardes −1` | Le Premier Cristal disparaît des objets fils rouges ; il « tient » le sol où était Vitrelle (en ère IV, ce lieu n'a pas de Lacune). |
| Rendre le Cristal du lien | `cristal_rendu` = `lien`, `cristaux.donnes +1`, `lacunes.recousues +1` | L'Intrication du héros avec cet Écho (ou son héritier) reste renforcée en ère IV, sans objet. |
| Rendre une part de Gorr | `cristal_rendu` = `gorr`, `cristaux.donnes +1`, `lacunes.recousues +1` | Gorr porte la cicatrice en ères IV et V (PV max −10 % définitifs) ; il en parlera : « Gorr, ailleurs aussi. » |
| Ne rien rendre | `cristal_rendu` = `aucun` | Transformation A d'office ; pèse vers la fin de l'Équilibre. |
| Lampadaires brisés | `cristaux.extraits +n` | Carte du monde : la région de Vitrelle passe au gris si le total d'ère dépasse 3. |
| Nom accepté | `nom` = `lyra` / `gorr` / `merlin` | Arc F : le nom apparaît, déformé, dans la Chronique de l'ère IV. |
| Transformation | `transformation.III` = `A` / `B` | Corps du héros. |
| Q15, Q18 | `carnet.Q15` = `repondue`, `carnet.Q18` = `ouverte` | Q18 trouve sa réponse au ch. 27. |

## Récompenses

- **Transformation :** Veines de cristal (A) ou Mains de verre (B).
- **Habit : Col des Vents.** *Une bande de toile cousue à la hâte par les évacués, du premier tissu qu'ils ont trouvé : elle claque au vent.* Effet : **+1 Chance**. Ne s'obtient que si `vitrelle_evacues` ≥ 3.
- **Habit : Éclat de Vitrelle** (toujours). *Un éclat de façade, poli par le frottement, porté en pendentif. Il renvoie la lumière par moments, sans qu'on sache d'où.* Effet : aucun en combat. Description : « On voit à travers. Tout passe. »
- **Si `merlin_convaincu` : la demi-Toise** reste à la lignée de Merlin (pas au héros) : à reprendre en ère IV.

## Graines pour la suite

- **Gorr attend.** Il ne dort pas pendant les siècles du Puits : en ère IV, il est **le même**, plus grand, plus lent, avec une parole un peu plus longue (bible). Il porte le Bracelet de quartz en miroir sur son propre poignet (si le héros l'a reçu), la cicatrice du don (si `cristal_rendu` = `gorr`), et **la question** (`gorr_question`), ou pas encore.
- **Carte du monde :** la carte des Lacunes (si `carte_des_lacunes`) est l'objet fil rouge de l'ère IV : elle montre où se cachent les révoltés. Les régions passées au gris aux seuils de `cristaux.extraits` y sont des **Lacunes habitées**.
- **Le Gel :** si `merlin_convaincu`, il est abaissé saison par saison : en ère IV, le climat est revenu, les Marées sont faibles. Sinon, il s'éteint d'un coup faute de Cristaux : quelques Marées tardives ont frappé, et l'ère IV en porte les traces (îles érodées).
- **Le Chroniqueur :** si `chroniqueur_rejoint`, sa lignée écrit « deux fois » ; en ère IV, on peut trouver ses doubles chroniques (à coordonner avec le manifeste de Nyx IV).
- **Brutus :** « protéger quelque chose qui bouge » est la question que Brutus IV portera.
- **Arc B :** l'ère se termine sans que le Ghom ait parlé ; mais l'équipe a senti sa pression au moment du Puits. Si le Ghom a utilisé ses Influences sur ses propres Échos pendant l'ère (Distorsion, Séisme sous eux), la Confiance générale l'a enregistré : en ère IV, ça comptera.

## Notes de mise en œuvre

- **Évacuation :** entités neutres « groupe d'habitants », suiveuses (si un allié est adjacent en fin de tour) ou autonomes (selon `questions_rouvertes`, Garance, Brutus). Elles se déplacent après le tour de l'allié qui les guide, de 2 cases, vers la sortie ouverte la plus proche. Elles ont des PV (8) et subissent l'Usure des Lacunes ; un groupe à 0 PV ne se disperse pas : il **s'arrête** et ne peut plus être évacué (on ne montre pas la mort de civils ; le bilan dit « restés en ville »).
- **Fêlure :** liste de cases qui deviennent Lacune à des temps donnés ; l'action **Rendre** arrête la liste et referme la dernière étape. Une extraction fait avancer la liste d'une étape.
- **Rendre en Intrication :** l'action Rendre doit pouvoir être exécutée comme action combinée (deux Échos sur la même case). C'est la condition de la transformation B : l'interface doit le rendre lisible (« Rendre ensemble ») sans le désigner comme la « bonne » option.
- **Pont de cristal (Gorr) :** action propre au chapitre ; transforme une case de Lacune en sol franchissable ; coût en PV max de Gorr (Usure).
- **Portes :** cases de sortie verrouillées ; ouvertes par drapeau ou par l'action Parler.
- **Fin au temps 90 :** fin indépendante du vainqueur ; le bilan affiche les groupes sortis, le Cristal rendu, et, en silhouette, les objectifs cachés.
- **La descente au Puits :** cinématique, en écho à celle du ch. 6 ; le décalage vers le bleu de la lumière d'en haut et l'accélération du monde au-dessus (nuages, saisons, croissance de Gorr) doivent se voir : c'est la dilatation du temps vue de l'intérieur. **Aucun texte** pendant la descente.
