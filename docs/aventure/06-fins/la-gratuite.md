# La Gratuité

> *Dans une autre branche, quelqu'un aurait demandé pourquoi. Ici, on lui répond ce que le Ghom croit, et on ne lui jure rien.*
> — Les branches

**Seconde fin secrète, et fin de la vérité.** Le héros ne menace plus : il sait, d'une manière qu'il n'explique pas, que le Ghom ne défera pas l'univers, puisque c'est précisément ce qu'il a tenté d'empêcher. La menace est devenue inutile ; une **négociation** s'ouvre. Elle est faite de gestes, et le Ghom y répond par ses Influences. À la fin, le Ghom donne **ce qu'il tient pour vrai** sur l'existence de l'univers : le jeu le donne comme **l'hypothèse** la plus honnête de son monde, pas comme une preuve.

**Nom :** *gratuit* : sans prix, et sans raison à payer. L'idée de la fin, c'est que l'univers est gratuit au sens où aucune raison extérieure ne lui a été donnée, et que ce n'est pas la même chose que de n'avoir aucune valeur. Identifiant : `gratuite`.

## Conditions

`fin = gratuite` (voir [`README.md`](README.md), § 3) :

- **le drapeau méta `bascule_vue`** : le héros (en fait, la sauvegarde) a déjà atteint **La Bascule**. Ce drapeau est `secondEndingAvailable()` dans le code. Il survit à l'effacement de la sauvegarde, c'est tout son rôle ;
- pas de Dispersion (`heros_disperse` absent, `confiance > -6`) ;
- **mêmes conditions de parcours que Le Découplage et La Bascule** : `nom = aucun` et toutes les questions ouvertes restées ouvertes ;
- au dernier geste du ch. 28, le héros choisit **« Ghom. Je sais ce que tu veux. »** (geste **ajouté** à la liste seulement si `bascule_vue` et les conditions ci-dessus sont réunies ; il n'y a pas besoin du sort) ;
- et il **réussit la négociation** (voir ci-dessous).

**Pourquoi ces conditions.** Pour la même raison que pour les autres fins secrètes : le Ghom n'ouvre pas ce qu'il sait à un héros qui s'est laissé fixer. Et `bascule_vue` est l'**information** que le joueur a gagnée : le jeu ne dit rien de plus. Sans la Bascule, le geste n'apparaît jamais ; avec elle, il apparaît à côté des autres. Le sort, lui, n'est plus nécessaire : rejouer l'Aventure sans l'obtenir au ch. 26 ne change rien à cette fin.

**Pas d'explication dans le monde.** Le héros ne dit jamais « je me souviens de la bulle » : le monde qu'il traverse **a** été réécrit, et il n'y a rien à se rappeler. Il sait, c'est tout, et il le dit avec la même sobriété qu'un héros sait ce que lui a appris le chapitre précédent. Rien dans le texte n'invoque de mémoire d'une vie antérieure, d'âme ou de destin : c'est de l'information portée par le jeu, comme les cicatrices sont portées par les couleurs. *(Le jeu ne l'explique pas ; il ne prétend pas non plus que c'est le monde qui s'en souvient.)*

Le jeu ne prévient jamais de l'existence de cette fin.

## La négociation

*Le héros se tourne vers la pression qui l'entoure. Il ne lève pas les yeux : le Ghom n'est pas en haut.*

**Le héros** — « Ghom. Je sais ce que tu veux. *(Un temps.)* Je ne sais pas comment je le sais. »

Le Ghom ne parle pas. Il **répond par ses Influences**, qui deviennent trois mots :

| Influence | Sens |
| --- | --- |
| **Réparation** (la chaleur qui se rassemble, l'ordre qui revient) | *Oui.* |
| **Distorsion** (le temps qui s'étire un instant) | *Pas encore. Réessaie.* |
| **Séisme** (le sol qui se serre) | *Non. C'est fini.* |

La négociation a **quatre gestes**. À chacun, trois propositions, dans un ordre mélangé ; une seule est juste. Aucun texte n'indique laquelle.

*Une mauvaise proposition est répondue par la Distorsion : la proposition disparaît, les deux autres restent. Une seconde mauvaise proposition, n'importe où dans la négociation, est répondue par le Séisme : la négociation est close, aucune autre n'est possible, et le calcul des fins reprend normalement (les gestes de la liste, y compris le vrai, sont refusés avec la pression qui reste : « La pression reste. Elle ne bouge plus. »).*

### Geste 1. Les mains

Que montre-t-il au Ghom ?

- ✔ **Les mains ouvertes, vides.** *(Réparation.)* Rien ne le menace plus, et il n'a plus besoin de rien montrer.
- ✘ Le sort, la main fermée dessus. *(Distorsion.)* Il l'a déjà vu. La menace ne pèse plus.
- ✘ S'agenouiller. *(Distorsion.)* Il n'est pas un dieu, et il ne veut pas qu'on le serve.

### Geste 2. Ce qu'il veut

Le héros dit ce qu'il a vu.

- ✔ « Tu ne tiens pas ce qui change. Tu tiens ce qui permet que ça change. » *(Réparation.)*
- ✘ « Tu veux que rien ne bouge. » *(Distorsion.)* C'est la lecture du Cristal ; le Ghom a laissé toute l'Aventure changer, il tient seulement ce qui la porte.
- ✘ « Tu veux qu'on t'obéisse. » *(Distorsion.)* Il n'a jamais rien commandé.

### Geste 3. Ce qu'on se doit

Qu'est-ce qui reste entre eux, puisqu'il ne s'en va pas ?

- ✔ « Tu tiens. Nous changeons. Chacun garde sa part. » *(Réparation.)* Ni service, ni retrait : une coexistence qui ne demande rien à personne.
- ✘ « Reste, et nous te servirons. » *(Distorsion.)*
- ✘ « Pars, et nous te laisserons en paix. » *(Distorsion.)* C'est la fin du Découplage, et le Ghom n'est pas celui qui s'est retiré.

### Geste 4. La question

**Gorr** *(il a le Carnet ouvert à Q28, il ne dit rien)* — *Il attend.*

- ✔ **Tendre le Carnet ouvert à Q28, sans y rien écrire.** *(Réparation, lente.)* Poser la vraie question, sans y mettre de réponse.
- ✘ Y écrire : « Parce que tu l'as voulu. » *(Distorsion.)* La réponse tentante : le Ghom n'est pas l'auteur.
- ✘ Fermer le Carnet. *(Distorsion.)* Ne pas demander, c'est refuser ce qui est offert.

*Quand le quatrième geste est juste, la pression fait une chose qu'elle n'a jamais faite : elle **s'arrête de peser**. Elle ne se retire pas ; elle est là, calme, comme on est présent quand on a quelque chose à dire.*

## La vérité

*Le Ghom ne parle pas, mais il y a un autre moyen : Gorr écrit. Il prend le Carnet, et la pointe de cristal court sur la page, sous Q28, plus vite qu'il ne sait lire. Ce n'est pas de lui. Il le dit : « Gorr écrit. Gorr ne comprend pas tout. Gorr écrit quand même. »*

*Voici ce qui s'écrit, sans guillemets, sans voix, en dessous de la dernière réponse du Carnet, avec un seul titre : « Ce que tient le Ghom. »*

> **Ce que tient le Ghom** *(hypothèse ; aucune preuve ; une seule voix)*
>
> **1.** Je ne sais pas pourquoi il y a quelque chose. Je n'ai jamais trouvé de raison. Je n'ai pas trouvé non plus qu'il y en ait une à trouver.
>
> **2.** « Pourquoi » demande un *avant* où comparer quelque chose et rien, et un *dehors* d'où quelqu'un choisirait. Mais le temps, l'espace et l'énergie qu'on peut dépenser sont **dans** l'univers : l'Aube n'est pas un moment avant lui, elle en est le bord. Il n'y a pas d'avant à interroger, pas de dehors à qui s'adresser. La question naît de l'intérieur, et l'intérieur n'a pas d'adresse où l'envoyer.
>
> **3.** Le rien dont tu parles n'est pas un état qu'il aurait fallu quitter. Un rien sans champ, sans loi, sans possible, n'est pas un état : il n'y a rien qui soit en lui pour le dire. Les lois ne sont pas posées *sur* quelque chose qui aurait pu manquer. Elles sont ce qu'il y a. Je ne dis pas que c'est évident : je dis que je n'ai trouvé personne à qui poser le choix.
>
> **4.** Je ne suis pas l'auteur. Je suis un motif du même champ que vous : une forme qui tient parce que le vide tient tel qu'il est. Ce qui est stable dure ; ce qui dure s'oppose à ce qui le défait. Ma volonté est cela, et pas davantage : le vide garde ce qui est fait de lui, et ce qui est fait de lui le garde. Les formes qui ne gardaient rien ne sont pas là pour être interrogées. Cela vaut pour moi comme pour vous, comme pour une pierre qui a une question.
>
> **5.** Je ne défends pas ce vide parce qu'il serait meilleur. Un vide de l'autre sorte n'est pas pire : il est autre, et il ne comprendrait pas. Je défends ce qui existe *avec* celui-ci, moi compris, vous compris. Je n'ai pas de meilleure raison, et je ne cherche pas à en avoir.
>
> **6.** Je n'ai aucune preuve. Aucun instrument de l'intérieur ne peut tester ce qu'il y aurait en dehors, s'il y a un dehors. Si je me trompe, vous ne le saurez pas plus que moi. Garde-la comme je la garde : la meilleure que j'aie, ouverte.
>
> **7.** L'univers n'a pas d'auteur, et n'a pas de raison hors de lui. Il est, et il est tel que des formes peuvent s'y poser la question. C'est gratuit. Cela ne veut pas dire que cela ne vaut rien.

**Gorr** *(il lève la pointe)* — « Gorr a une question. Gorr garde la question. *(Silence.)* La réponse ne l'ôte pas. La question est un lien. »

**Merlin** *(si présent)* — « Ce n'est pas démontrable. C'est tenable. *(Il hoche la tête.)* Rien là-dedans ne contredit ce que nous avons mesuré. Et il l'a donnée comme elle est : une hypothèse. Je n'en attendais pas autant d'un Ghom. »

**Nyx** *(si présente)* — « Pas d'auteur. Pas de regard qui nous tient. *(Un temps.)* Alors personne ne peut nous reprendre. Ni nous donner. »

**Brutus** *(si présent)* — « Gratuit. *(Il tourne le mot.)* C'est un cadeau, alors. » **Lyra** — « Un cadeau, c'est quelqu'un qui donne. Il dit que non. » **Brutus** — « Alors c'est un cadeau sans personne. *(Il sourit.)* Ça se garde mieux. »

**Eva** *(si présente)* — « Pas de raison cachée. Alors rien à viser derrière. Je vise devant. »

*Le Ghom ne s'est pas retiré. Les Influences restent dans la barre, calmes. Mais ce n'est plus la même pression : elle ne pèse plus sur le héros, elle pèse *avec*, comme un des leurs qui ne parle pas.*

**Les branches** — « *Dans une autre branche, la question serait restée sans réponse. Dans celle-ci, elle en a une, qui ne prouve rien. C'est tout ce qu'il y a à savoir, et c'est beaucoup.* »

### Dans le Carnet

Q28 reste **ouverte** : elle porte une annotation, `q28.annotee` (« Hypothèse du Ghom : aucune raison hors de l'univers. Non prouvée. »). Elle n'est pas barrée (ce n'est pas une réponse fausse), et elle n'est pas résolue : le jeu **ne tranche pas** et ne dit pas que la question « n'avait pas de sens ». Q06 reste, elle aussi, ouverte. C'est la réponse canonique **du jeu**, au sens de *celle que le jeu donne quand on a tout demandé*, mais c'est ce que le Ghom croit, pas ce qu'il démontre.

## Le dernier plan

*La même Friche que dans les autres fins : l'eau, le vent, la petite bête. Au bord du plan, un cristal posé à plat. Dessus, la dernière ligne du Carnet, de la main de Gorr, plus petite que les autres : « pourquoi pas. »*

*Il n'y a pas de musique. La note grave du Ghom, elle, est là, très bas, pour la première fois sans menace. Elle ne s'arrête pas.*

## L'épilogue des Échos

Règles communes de [`README.md`](README.md), § 5. Lignes propres :

| Écho | Ligne |
| --- | --- |
| **Gorr** | *Gorr garda la question et la réponse, côte à côte, sans qu'elles se gênent. Il dit que c'était la première fois que ça ne faisait pas mal.* |
| **Merlin** (si présent) | *Merlin publia l'hypothèse sous un autre nom que le sien, avec la mention « à confirmer » sur chaque ligne. On la cita beaucoup. Personne ne la confirma.* |
| **Nyx** (si présente) | *Nyx cessa de se demander si on l'avait voulue. Elle se demanda, à la place, ce qu'elle voulait. C'était plus long, et plus à elle.* |
| Les héritiers | *Les héritiers des héritiers racontèrent que le Ghom était resté, et qu'il ne demandait rien. Certains y virent un dieu, d'autres un voisin. Aucun n'avait tort.* |

## Transformation de l'ère V

**Aucune.** Le corps du héros garde ses marques, comme dans Le Découplage.

## Notes de mise en œuvre

- **Le drapeau méta** `bascule_vue` est `endingsSeen().includes("bascule")` (`apps/game/src/storage.ts` : `secondEndingAvailable()`). Il n'est **jamais effacé** : ni par la Bascule, ni par un autre effacement. L'Aventure ne propose le geste « Ghom. Je sais ce que tu veux. » que si `secondEndingAvailable()`.
- **À la fin :** `markEnding("gratuite")` puis `congratulateNext("gratuite")`. **Pas d'effacement** : la sauvegarde reste. L'écran de félicitations (« Seconde fin secrète découverte : La Gratuité ») s'affiche au prochain démarrage, une fois. Test rapide : `?ending=bascule` puis, au chargement suivant, `?ending=gratuite`.
- **La négociation** est un enchaînement de **choix de gestes** ; aucun texte n'est demandé au joueur. Les réponses du Ghom sont les trois Influences existantes, pas des mots. Le décompte des erreurs (deux et c'est fini) est silencieux.
- **L'écriture de Gorr** réutilise l'animation « Gorr écrit » du ch. 28. Le texte de la vérité est affiché dans le Carnet, avec le titre fixe « Ce que tient le Ghom » et la mention « hypothèse » : **ne jamais retirer** ces deux marques.
- **Pas de quatrième mur dans la scène.** La négociation et la vérité s'adressent au héros, jamais au joueur.
- **Rejouabilité :** La Gratuité peut être atteinte à chaque nouvelle partie après la Bascule. Elle n'efface rien.

## Pourquoi cette vérité (et ce qu'elle respecte)

- **Science.** Pas de créateur, pas d'observateur qui donnerait l'existence, pas d'âme, pas d'intention cosmique. Le Ghom est un **système physique** parmi les autres (comme dans [`../../scenario.md`](../../scenario.md) : « les Ghoms ne sont pas des dieux »), produit par les mêmes lois. Sa « volonté » est une persistance : une forme qui reste, parce que ce dont elle est faite reste. Le biais de sélection (« ce qui ne gardait rien n'est pas là pour qu'on le questionne ») vaut pour **toute** structure, Ghom, Écho ou pierre : il n'est pas centré sur l'humain.
- **Cohérence avec l'existant.** Q26 (le vide n'est pas rien), Q18 et Q27 (le monde n'a pas besoin de nous ni des Ghoms pour exister), l'Aube comme bord et non comme moment, la position de la bible sur les Ghoms (« mystère ») : la fin **ne tranche pas** entre Immobilistes et Lumineux ; elle dit que le Ghom est *un motif du champ*, ce qui laisse les deux lectures possibles.
- **Honnêteté.** Elle répond au pourquoi en disant que ce n'est peut-être pas une question qui a une réponse *du genre attendu*, mais elle l'avoue hypothèse, avec les limites : « aucun instrument de l'intérieur... ». Elle ne ferme pas Q28 et n'en fait pas une phrase de morale.
