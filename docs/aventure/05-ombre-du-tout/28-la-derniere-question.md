# Chapitre 28 — La dernière question

> « Gorr a une question. Elle est grande. Gorr la porte depuis la mine. »
> — Gorr

## Fiche

| | |
| --- | --- |
| Ère | V — L'Ombre du Tout |
| Lieu | **Le Cœur** : le centre de la déchirure, au-dessus de la Friche. Un îlot de pans de toutes les ères autour d'une Lacune ronde où les branches sont si proches qu'on y voit d'autres versions du ciel. |
| Équipe | Celle du chapitre 27. **Gorr est imposé** dans le combat final. Le Ghom déchu (forme d'Écho) combat en plus, comme allié autonome, si `ghom_dechu.issue` vaut `laisse` ou `couple`. **Peuvent revenir :** les héritiers partis chez les Déliés au ch. 21 (`trahison.<lignée>` sans `retour.<lignée>`). |
| Durée visée | 5 nœuds : 2 Rencontres, 1 Veillée, 1 Combat final, 1 Fin (la réponse, puis le calcul des fins). |
| Question au Carnet | Q28 — *Pourquoi quelque chose plutôt que rien ?* (posée par Gorr ; **ouverte**, elle le reste) |

## Ce que le joueur sait en arrivant

- Le Tissu est déchiré ; les branches voisines se mêlent, et leurs Doubles sont équitables, ni meilleurs ni pires (ch. 25).
- Le grand équilibre, c'est la mort par dissolution ; le vide n'est pas rien, mais le rien absolu reste une idée (ch. 26).
- Le monde n'a pas besoin des Ghoms : la vie revient seule tant qu'il reste une pente (ch. 27). Le héros a combattu, suivi, laissé, ou s'est couplé au Ghom déchu (`ghom_dechu.issue`).
- Gorr a annoncé qu'il poserait une question.
- Q06 a été posée au chapitre 6 et reposée à chaque ère. Elle n'a jamais eu de réponse.

## Synopsis

L'équipe monte au Cœur, où les branches sont si proches que tout ce qui aurait pu être se presse contre ce qui est. Ceux qui étaient partis avec Nyx peuvent revenir, ou rester à distance. À la dernière veillée, chacun dit une phrase, et Gorr, si le héros n'a pas de nom, lui en propose un. Puis Gorr pose **la dernière question** : *pourquoi quelque chose plutôt que rien ?* Il demande qu'on lui réponde après. La déchirure se referme ou s'ouvre : c'est **la Recomposition**, un combat contre les Doubles de tous, autour du Cœur, qu'on peut recoudre, élargir ou habiter. Si l'Usure du héros est trop haute, il peut s'y disperser. Ensuite, Gorr attend sa réponse. Le héros répond, ou reconnaît qu'on ne sait pas. S'il n'a pas de nom et qu'il n'a jamais accepté de fausse réponse, il peut demander une dernière chose au Ghom.

## Carte du chapitre

```
[1 Rencontre : La montée]       (retours possibles des héritiers partis)
          │
[2 Veillée : La dernière veillée]   (nom proposé par Gorr ; réponses tentantes)
          │
[3 Rencontre : La question de Gorr]
          │
[4 Combat final : La Recomposition]  ── recoudre / élargir / habiter le Cœur
          │                              (Usure ≥ 8 : le héros peut s'y disperser)
[5 Fin : La réponse]
          ├── réponse à Gorr (Q28)
          ├── (conditions) le dernier geste : demander au Ghom de se retirer
          └── calcul des fins → ../06-fins/
```

## Scènes

### 1. Rencontre — La montée

*De la Friche, un escalier de pans mêlés monte vers le Cœur : trois marches de prairie, une passerelle de pilotis, une dalle de verre, une corde de village suspendu. Chaque pas fixe la marche sur laquelle on le pose. Derrière, les marches non foulées basculent dans d'autres branches, et l'escalier change de forme.*

**Les branches** — « *Dans une autre branche, nous serions déjà en haut. Dans une autre, nous ne serions jamais partis. Dans celle-ci, il reste quelques marches. Nous les comptons avec vous.* »

*En haut, l'îlot du Cœur : un anneau de sol de neuf cases de large autour d'une Lacune ronde. Dans la Lacune, on voit des ciels : celui de l'ère I, celui des Marées, un ciel de verre, et d'autres qu'aucune ère n'a eus.*

**Les retours.** Pour chaque lignée avec `trahison.<lignée>` sans `retour.<lignée>`, l'héritier est là, au bord du Cœur. Avec `paix_des_lacunes`, il est monté avec les Déliés, à côté de l'équipe ; sans paix, il est venu de lui-même, seul ou avec deux ou trois Déliés, par une autre branche de l'escalier.

- **Brutus IV** — « Je ne viens pas pour toi. Je viens parce que c'est ici que ça se décide. Je n'ai jamais aimé qu'on décide sans moi. »
- **Eva IV** — « J'ai calculé où tu finirais. Je me suis trompée de deux cases. C'est la première fois que ça me fait plaisir. »
- **Lyra IV** *(si sa Double l'a remplacée au ch. 26)* — « Ma Double t'a soigné, dans la plaine. Je l'ai su. Je ne sais pas comment, mais je l'ai su. »
- **Néréa IV** — « Les strates d'ici n'ont pas encore commencé à se déposer. Je voulais voir ça. »
- **Squalor** *(lignée, si parti)* — « Mon Double m'a raconté. Il a l'air de bien manger, l'imbécile. »

**Choix du héros, pour chacun :**

1. « Viens. » [Si `confiance.<lignée> ≥ 0` (≥ −1 si `rupture.respectee` : on se souvient qu'il les a laissés partir) : il rejoint, allié autonome au combat final. Sinon : « Non. » Il reste au bord.]
2. « Fais ce que tu veux. » [Il rejoint comme allié autonome, ou reste au bord, selon `confiance.<lignée> ≥ -2`. Dans les deux cas : `confiance.<lignée> +1` ; `confiance +1` une seule fois pour tout le nœud : respecter un refus fait monter la Confiance.]
3. *Ne rien dire.* [Il reste au bord, regarde, et partira à la fin. Aucun effet.]

**Nyx** *(si présente, par `paix_des_lacunes` ou par le ch. 26)* — « Ils sont venus seuls. C'est bien. C'est comme ça que j'aime qu'on vienne. »

### 2. Veillée — La dernière veillée

*Pas de feu, pas de cristal : le Cœur éclaire tout, d'une lumière qui change de branche toutes les quelques secondes. L'équipe s'assoit en cercle, au bord de la Lacune.*

**Les branches** — « *Dans une autre branche, cette veillée serait plus gaie. Nous ne sommes pas sûres que ce serait mieux.* »

Chaque Écho présent dit **une phrase**, dans cet ordre (on saute les absents) :

- **Lyra** — « Je n'ai plus d'énergie à dépenser. Je reste quand même. Ça aussi, ça coûte. » *(Si elle porte une cicatrice du héros, ch. 26 :)* « Et j'ai la tienne. Elle me va bien. »
- **Brutus** — « Je protège ce qui bouge. *(Un temps.)* Bougez moins vite. »
- **Eva** — « Il y a une branche où je rate tout demain. Je la salue. »
- **Néréa** — « Ce soir, je ne lis rien. Je dépose. »
- **Nyx** — « Je suis là. On me touche de partout. Je crois que c'est ça, être quelqu'un. »
- **Merlin** — « Demain, je mesurerai encore. Et ce que je mesurerai changera parce que je l'aurai mesuré. Je m'y suis fait. J'en suis même assez fier. »
- **Squalor** — « J'ai pas faim. Ça me fait peur. Ça me fait du bien. »
- **Le Lacunaire** — « Je dis je. Ici, avec toutes ces branches, ce serait facile de redire nous. Je ne le fais pas. »
- **Le Chroniqueur** — « Je n'écrirai pas ce qui se passe demain. Quelqu'un d'autre le fera, et se trompera. Je lui pardonne d'avance. Source : moi. »
- **Le Double du héros** — « Dans ma branche, ce soir, je suis seul. Ici, non. Je préfère ici. »
- **Le Ghom déchu** *(forme d'Écho)* — « Demain. *(Silence.)* Puis après-demain. *(Silence.)* Vous avez beaucoup de jours. »

**Les réponses tentantes.** Deux voix offrent au héros, avant qu'on la lui pose, une réponse à la question qui vient. Elles parlent avec certitude.

- **Brutus** (ou, s'il est absent, une vieille Déliée de la lignée de la Doyenne Hesta, Immobiliste comme elle) — « Si tu cherches pourquoi il y a quelque chose : parce que le Ghom l'a voulu. Ça m'a toujours suffi. Ça devrait te suffire. »
- **Le Double de Merlin III**, venu par une frange (le Maître du Verre d'une branche où l'ordre du Verre n'est jamais tombé ; Merlin, s'il est là, le regarde parler sans l'interrompre, puis secoue la tête) — « Et si cela ne vous suffit pas, la logique suffira : le rien est impossible. Il ne peut pas *y avoir* rien, puisque *y avoir* est déjà quelque chose. C'est une évidence. »

*Le héros n'y répond pas ici : elles reviendront au nœud 5.*

**Les derniers noms (arc F).** *Ici, on propose encore des noms, mais aucun ne se prend : tout se joue à la Nomination, juste après. Le nom retenu d'une lignée est sa **dernière** proposition.*

- **Le nom gardé.** Si `nom.promesse` désigne une lignée présente (un ancien de la lignée de Lyra ou de Néréa a promis, à l'ère I, de garder un nom pour le héros), l'héritière parle en premier :

  **Lyra** *(ou **Néréa**)* — « Ma lignée garde quelque chose pour toi depuis l'Aube. On se le transmet avec le métier, de mère en apprentie, sans savoir à quoi il servirait. **Aube.** C'est le nom qu'on t'a gardé : tu es arrivé avec elle. Je ne sais pas s'il te va encore. Il a beaucoup attendu. »

  1. « Je m'en souviendrai. » [`nom.propositions += <lignée de la promesse>` ; `confiance.<lignée> +1`] — « Alors la promesse est presque tenue. Ça ne m'était jamais arrivé, de tenir une promesse vieille de mille ans. »
  2. « Garde-le encore. » [la proposition n'est pas retenue] — « Il attendra. Il sait faire. »

- **Lisière, encore.** Si Nyx IV est présente et que « Lisière » a été retenu (`nyx` dans `nom.propositions`) : **Nyx** — « Lisière tient toujours. Je te l'ai dit : les noms, ça attend bien. *(Un temps.)* Ou prends celui de la pierre. Ou aucun. Je m'en fiche. Non, c'est faux. Je ne m'en fiche pas. » *(sans choix : la proposition reste)*

- **Fissure.** Si `confiance.gorr ≥ 2` : **Gorr** — « Tu n'as pas de nom. Gorr en a un. Gorr te donne un nom, si tu veux. *(Il pose un doigt de cristal sur la fissure lumineuse de son propre flanc, celle qui s'est ouverte sous la Frange.)* Fissure. Gorr a une fissure. Par elle, la lumière sort. Par la fissure, la chaleur monte, et les pierres croissent. Par toi, la question est venue dans Gorr. »

  1. « Je m'en souviendrai. » [`nom.propositions += gorr` (Fissure remplace « Chaud », ch. 18) ; `confiance.gorr +1`] — **Gorr** : « Fissure. » *(Il le répète, pour l'apprendre.)* « Fissure. »
  2. « Garde-le. » [la proposition n'est pas retenue] — **Gorr** : « Gorr garde. Gorr sait garder. »

**La Nomination.** *Gorr se tourne vers le héros.* **Gorr** — « Gorr dit les noms, avant la question. Gorr dit le nom de chacun. *(Il les dit, un par un, ceux de l'équipe.)* Et toi ? Quel nom, Gorr dit ? »

*Le joueur ne tape jamais de nom : il choisit dans une liste, dans un ordre mélangé.*

- **Le nom connu.** Parmi les lignées de `nom.propositions` dont la confiance est d'au moins +1, c'est celle qui a la plus haute Confiance (en cas d'égalité, la proposition la plus récente). Son nom retenu fait partie de la liste : Marne (Néréa), Écart (Eva), Reste (Squalor), Premier (le Lacunaire), Constante (Merlin), Reprise (Lyra), Lisière (Nyx), Fissure ou Chaud (Gorr), Aube (le nom gardé).
- **Les leurres :** les étiquettes que d'autres ont données au héros. Ce sont les noms des légendes, pas des liens : « le Dormeur » (la légende de l'ère II), « l'Anomalie » (le rapport de l'ère III), « le Couplé » (les chants de l'ère IV).
- **S'il y a un nom connu :** il est proposé avec deux leurres.
- **Sinon :** les trois leurres seulement. Rien n'indique qu'un autre nom aurait pu exister.
- **Toujours en plus :** « Je n'ai pas de nom. »

Effets :
- **Le nom connu** → [`nom = <lignée>` ; `confiance.<lignée> +1`] — **Gorr** : *(il le dit, lentement, pour l'apprendre)*. L'Écho de cette lignée, s'il est là : « … C'est le mien. Je veux dire : c'est celui que je t'ai donné. Il te va. »
- **Un leurre** → [`nom = faux`] — **Gorr** dit l'étiquette, sans comprendre. **Les branches** — « *Dans une autre branche, quelqu'un nous aurait appelés.* »
- **« Je n'ai pas de nom. »** → [`nom` reste `aucun`] — **Gorr** : « Gorr non plus, avant. Ça va. »

*Si le héros a déjà un nom de lignée* (ce qui ne peut plus arriver avec la règle de la Nomination, sauf sauvegarde ancienne)*, Gorr le prononce simplement : « Gorr dit ton nom. » Et il le dit.*

### 3. Rencontre — La question de Gorr

*Gorr se lève et va au bord de la Lacune. Il est immense dans la lumière du Cœur, et l'on voit, à travers son corps de cristal, les ciels des autres branches, déformés, comme à travers une loupe. Il se retourne.*

**Si `gorr_question`** (Gorr parle depuis le ch. 16) :

**Gorr** — « Dans la mine, Gorr creuse. Gorr ne demande rien. Puis tu touches Gorr, et Gorr demande. Depuis, Gorr a beaucoup de questions. Sous la Frange, Gorr demande : le Ghom le sait ? Personne ne sait ce que sait un Ghom. Alors Gorr garde une question plus grande. Elle ne rentre pas dans Gorr. *(Silence.)* Gorr a vu le vide qui bout. Gorr a vu la mousse qui revient. Gorr a vu le Gorr sans question. Alors Gorr demande. »

« **Pourquoi il y a quelque chose. Et pas rien.** »

« Ne réponds pas maintenant. Après. Gorr sait attendre. Gorr est fait pour attendre. »

**Si pas `gorr_question`** (Gorr n'a jamais parlé) :

*Gorr ouvre la bouche. Rien ne vient. Il la referme. Il pose la main sur la dalle, puis sur sa propre poitrine, puis il montre la Lacune, les ciels, le héros, tout. Et, d'une voix qui craque comme un cristal qui croît :*

**Gorr** — « Pourquoi… quelque chose ? »

*C'est la première question de Gorr. Q16 passe à* `repondue` *ici, avec la même réponse qu'au ch. 16 (une question peut naître d'une pierre).* [`carnet.Q16 = repondue` ; `gorr_question`]

*Après un long silence :* « Après. Gorr attend. »

**Q28 s'inscrit au Carnet**, sous Q06, avec un trait qui les relie.

**Les branches** — « *Dans toutes les branches, cette question est la même. C'est la seule chose que nous ayons en commun.* »

*La Lacune du Cœur s'ouvre d'un cran. Les ciels se mettent à tourner. Des silhouettes sortent des franges : des Doubles, de partout.*

## Combats

### 4. Combat final — La Recomposition

**Carte :** le Cœur, 11 × 11. Un anneau de sol autour d'une Lacune centrale de 3 × 3. L'anneau est découpé en **quatre pans** (nord, est, sud, ouest), chacun avec trois variantes (prairie, pilotis, verre), comme au ch. 25.

Variante de départ :

```
..1..~..1..
.121.~.121.
..1.....1..
...........
~....a....~
~~..a.a..~~
~....a....~
...........
..2.....2..
.232.~.232.
..2..~..2..
```

Calque : la Lacune du Cœur (`x`, convention de l'ère IV) et les quatre **ancres** (`A`), une par pan.

```
···········
·····A·····
···········
···········
····xxx····
·A··xxx··A·
····xxx····
···········
···········
·····A·····
···········
```

**Équipes :**

- **Alliés :** le héros, **Gorr** (imposé) et 2 Échos choisis. **Plus**, en alliés autonomes : le Ghom déchu (forme d'Écho) si `ghom_dechu.issue` vaut `laisse` ou `couple` ; les héritiers revenus au nœud 1 ; Nyx si elle n'est pas choisie mais présente.
- **Ennemis : la Recomposition.** Les Doubles des 4 combattants choisis (dont un Double de Gorr, muet, qui travaille), plus le **Double du héros** si `double_epargne` est absent (sinon, son Double est de notre côté et l'ennemi n'en a pas). Puis des renforts selon `ghom_dechu.issue` :

| `ghom_dechu.issue` | Renforts ennemis | Influences |
| --- | --- | --- |
| `vaincu` | +2 Doubles de lignées absentes de l'équipe (des branches où elles sont restées), au tour 3. | Le Ghom seul. Élan normal pour l'ère. |
| `suivi` | +2 Doubles **de l'Ordre** (Brutus, Lyra, Eva ou Néréa, des branches qui ont recousu), au tour 3. Ils cherchent à ancrer les 4 ancres. | Le Ghom déchu agit, seul, pour **élargir** : Séisme sur les ancres. |
| `laisse` | +1 Lacunaire géant au tour 4. | Le Ghom seul ; le Ghom déchu se bat comme Écho. |
| `couple` | +1 Lacunaire géant au tour 4, +2 matières instables par tour. | **Couplage partagé** (voir ch. 27, 5e) : barre d'Élan commune, remplie deux fois plus vite. |

**Objectif principal : décider du Cœur.** Trois **voies** sont affichées en même temps, avec leur progression. La première qui s'accomplit termine le combat (les Doubles restants se retirent dans leurs branches) et pose `derniere_lacune` :

| Voie | Condition | `derniere_lacune` |
| --- | --- | --- |
| **Recoudre** (Ordre) | Les 4 ancres actives (un allié agit depuis chaque ancre) pendant **3 tours consécutifs**, puis une **Réparation**. | `recousue` |
| **Élargir** (Chaos) | Aucun allié n'agit **sur** ou **depuis** une case adjacente au Cœur pendant **6 tours** ; le Cœur s'élargit d'un anneau tous les 2 tours (les cases avalées deviennent Lacune) ; il faut survivre. | `elargie` |
| **Habiter** (Intrication) | Deux alliés **en Intrication** (une action combinée lancée depuis la case centrale du Cœur) **2 tours de suite**. La case centrale est accessible : une passerelle de pilotis y mène depuis l'ancre nord dès le tour 2. Les deux Échos y sont exposés à tout le monde. | `habitee` |

**Objectifs secondaires :**

- ★ **Gorr ne tombe pas.** S'il tombe, c'est la défaite : la question doit être entendue jusqu'au bout.
- ◆ **Laisser libre** : pendant les **3 derniers tours** avant que la voie ne s'accomplisse, aucune Influence et aucun ordre (le joueur utilise **Laisser agir** sur chaque tour allié, la commande de l'ère IV ; **Insister** ou toute Influence annule l'objectif). [`combat_final_libre`]
- ◆ **Aucun Double dispersé.** [`doubles.epargnes` + nombre de Doubles ; `confiance +1`]
- ◆ **Les deux pressions** (voie `couple` seulement) : une Intrication avec le Ghom déchu pendant la voie Habiter. [vignette dans le Carnet]

**Défaite :** tous les alliés tombent ; ou Gorr tombe ; ou le héros tombe **alors que `usure < 8`** (on recommence le combat, comme partout ailleurs).

**L'Usure (arc G).** Si `usure ≥ 8` au début du combat :

- les PV max du héros sont réduits de 10 % par point d'Usure au-delà de 5 (les cicatrices sont visibles, et elles tirent) ;
- un bandeau discret, au début : **Lyra** — « Ne te mets pas devant. Pas aujourd'hui. Je n'ai plus de quoi te payer. » (C'est le seul avertissement.)
- **si le héros tombe, ce n'est pas une défaite** : il se **disperse** (`heros_disperse`). Le combat continue sans lui. Voir les événements.

**Événements scriptés :**

| Quand | Événement |
| --- | --- |
| Début | Les ciels de la Lacune tournent. **Les branches** parlent (première réplique). |
| Tour 1, fin | Annonce de la première bascule de pan (la Recomposition, comme au ch. 25 ; un pan ancré ne bascule pas). |
| Tour 2 | La passerelle vers la case centrale apparaît (voie Habiter). Bulle unique : « Le Cœur peut être habité. » |
| Tour 3 / 4 | Renforts selon `ghom_dechu.issue`. |
| Première action d'un allié depuis une ancre | Gorr : réplique « Gorr tient ». |
| Le Cœur s'élargit (voie Élargir) | Les cases avalées s'effacent en franges ; les combattants dessus sont déplacés (règle de la Recomposition). Réplique de Nyx. |
| Deux alliés en Intrication au centre | Les ciels de la Lacune cessent de tourner pendant ce tour ; ils se superposent, sans se brouiller. Réplique de Lyra. |
| **Le héros se disperse** (`usure ≥ 8`) | Pause de la timeline. Le héros ne tombe pas : sa chaleur et sa lumière s'étalent à l'horizontale, autour de sa case, et s'éteignent. Le combat reprend. **Le Double du héros** (si `double_epargne`) prend sa place dans la timeline, sinon **Gorr** devient le « porteur » du chapitre : le Carnet passe dans sa main. Répliques ci-dessous. |
| Voie accomplie | Les Doubles restants se retirent ; les ciels se figent sur un seul ; silence. |

**Répliques de combat :**

- *Début* — **Les branches** : « *Dans une autre branche, nous serions déjà d'accord. Nous ne nous souviendrions pas pourquoi.* »
- *Début* — **Brutus** (s'il combat) : « Ils ont nos visages. Ils n'ont pas notre place. »
- *Ancre* — **Gorr** : « Gorr tient. Le sol tient. »
- *Élargir* — **Nyx** : « Ça s'ouvre. Ne me touchez pas : laissez faire. »
- *Habiter* — **Lyra** : « On ne paie rien. On se tient. C'est tout. C'est tout ? »
- *Double du héros (ennemi), à mi-combat* — « Tu pourrais être moi. Tu ne l'es pas. Je ne sais pas qui de nous deux a de la chance. »
- *Couplage partagé* — **Le Ghom déchu** : « Je sens. *(Silence.)* Tu sens. »
- *Laisser libre (début)* — **Eva** : « Plus d'ordres ? *(Elle sourit.)* Je vise ce que je veux. Ça me va. »
- *Dispersion du héros* — **Gorr** : « Non. *(Silence.)* Non. » Puis, plus bas : « Gorr a encore la question. Gorr attend quand même. »
- *Dispersion du héros, si `double_epargne`* — **Le Double du héros** : « Je finis. Je ne suis pas toi. Je finis quand même. »
- *Fin* — **Les branches** : « *Dans une autre branche, nous aurions choisi autrement le Cœur. Vous aussi, là-bas. Ici, c'est fait.* »

## Scènes (suite)

### 5. Fin — La réponse

*Le Cœur s'est arrêté sur un seul ciel. Selon la voie : un ciel net et immobile (recousue), un ciel immense et pâle (élargie), ou un ciel où plusieurs ciels se tiennent sans se brouiller (habitée). Gorr revient vers le héros. Il s'assoit. Il attend.*

**Gorr** — « Après, c'est maintenant. »

**Les réponses du héros (Q28) :**

1. « Parce que le Ghom l'a voulu. » [`carnet.Q28 = fausse` ; `derniere_reponse = ghom`]
   **Gorr** — *(Il lève les yeux vers la pression, qui ne dit rien.)* « Le Ghom ne dit rien. Le Ghom ne sait peut-être pas. *(Silence.)* Gorr garde ta réponse. Gorr la pèse. Elle est lourde. Gorr ne sait pas si elle est vraie. »
2. « Parce que le rien est impossible. » [`carnet.Q28 = fausse` ; `derniere_reponse = rien_impossible`]
   **Gorr** — « Gorr a lu la page, dans la plaine. Le rien est une idée. *(Silence.)* Gorr garde ta réponse quand même. Elle est jolie. Elle est trop sûre. »
3. « Je ne sais pas. Personne ne sait. » [`carnet.Q28 = ouverte` ; `derniere_reponse = ne_sait_pas`]
   **Gorr** — « Gorr non plus. *(Très long silence.)* Gorr aime. La question reste. Gorr la porte. Gorr vit longtemps. »
4. « Je ne sais pas pourquoi il y a quelque chose. Je sais ce qu'on en fait : on se touche, on se tient, et ça devient quelqu'un. » [`carnet.Q28 = ouverte` ; `derniere_reponse = liens`]
   **Gorr** — « Ce n'est pas la réponse. *(Silence.)* C'est vrai quand même. Gorr a une question parce que tu as touché Gorr. La question est un lien. Le pourquoi reste dehors. »
5. *Ne rien dire. Poser la main sur l'épaule de Gorr.* [`carnet.Q28 = ouverte` ; `derniere_reponse = silence`]
   **Gorr** — *(Il pose sa main de cristal sur celle du héros. Le cristal chauffe un peu.)* « Oui. Ça aussi. »

*Si `heros_disperse` :* le héros ne répond pas. C'est **le Double du héros** (si `double_epargne`) ou, sinon, **Gorr lui-même** qui répond, toujours par le choix 3 (`carnet.Q28 = ouverte` ; `derniere_reponse = ne_sait_pas`). Voir la fin **La Dispersion**.

**Gorr écrit.** *Quelle que soit la réponse, Gorr prend le Carnet, et, très lentement, avec un éclat de cristal, il écrit sous Q28 la réponse du héros, ou rien. Puis il rend le Carnet. Q28 reste dans la colonne des questions ouvertes, sauf si elle est barrée d'un trait fin (fausse).*

**Le dernier geste (fin secrète).** *La scène a toujours lieu. Le héros se tourne vers la pression qui l'entoure depuis le prologue. Il ne lève pas les yeux : le Ghom n'est pas en haut. Il est autour.* Il peut lui demander une dernière chose. Les options apparaissent dans un ordre mélangé.

**Le vrai geste** n'est proposé que si **toutes** ces conditions sont réunies, autrement dit si le parcours a mené jusque-là :

- `nom = aucun` ;
- **aucune** question ouverte n'est `fausse` : Q00, Q06, Q11, Q12, Q19, Q21, Q24, Q25 et Q28 sont toutes `ouverte` ;
- `heros_disperse` est absent.

*Si les conditions sont réunies : le vrai geste et deux faux gestes. Sinon : trois faux gestes. Rien n'indique qu'un autre geste aurait existé.*

**Si le héros possède le Vacuum decay** (`vacuum_decay`, obtenu au ch. 26) **: le geste de la menace.** *Ce n'est pas un cinquième geste affiché : c'est ce que le héros porte, et que le Ghom sent.* Le geste peut alors être **la menace** : au lieu de demander, le héros lui montre ce qu'il tient. Aucun texte ne s'adresse au joueur ; le héros ne fait que parler au Ghom, ou se taire.

> **Règle de jeu (décisions v2, voir [`decisions-jeu.md`](../decisions-jeu.md)).** Le sort n'existe que dans l'Aventure (le héros de l'Aventure, jamais l'Atelier). Lancé dans n'importe quel combat de l'Aventure **sauf** la scène finale du ch. 28, il **efface toute la sauvegarde** (plus une cicatrice, sans félicitation, sans reprise du combat). Seule la scène finale du ch. 28 mène à **La Bascule**, avec sa félicitation.

- Le geste de la menace n'est proposé que si les **mêmes conditions** que le vrai geste sont réunies (`nom = aucun`, aucune question ouverte fausse, pas de Dispersion). Il s'ajoute alors à la liste, à côté du vrai geste ; sans le sort, rien ne change. Un héros qui a pris un nom, ou une fausse réponse, ne peut pas menacer pour de bon : il n'a pas traversé le parcours sans se laisser fixer, et le Ghom ne le croit pas.
- **« Ghom. Je tiens ce qui défait aussi ta place. Pars. » :** le héros rappelle ce que Merlin a dit à la plaine : si le vide du Tissu n'est qu'un vide parmi d'autres, une poche de l'autre sorte, une seule, réécrit les constantes presque à la vitesse de la lumière, **le Ghom compris**. *(Hypothèse du jeu, jamais mesurée.)*
- **Le Ghom ne se retire pas.** Il n'emploie pas « Se retirer » : la pression pèse, ne bouge pas, ne dit rien. Il ne croit pas à la menace, ou il la juge impossible à tenir. **Une menace qu'on ne tient pas n'en est pas une** : le héros **lance le sort**. Il n'y a pas de second choix ; le choix était le geste. C'est le seul endroit de l'Aventure où le sort est lancé.
- **Le Ghom tente de contenir la bulle** en réimposant l'ancien vide **à l'intérieur** d'elle (physiquement : tenir le champ du bon côté de la barrière, sur une paroi mince qu'il faut tenir partout à la fois, à la vitesse de la lumière). Cet effort révèle sa volonté : **garder l'univers tel qu'il est**. Il échoue : la bulle se répand et réécrit tout. → fin **La Bascule** ([`../06-fins/la-bascule.md`](../06-fins/la-bascule.md)), qui **efface la vraie sauvegarde** et fait redémarrer le jeu.

**Si la sauvegarde a déjà vu La Bascule** (`bascule_vue`, drapeau méta qui survit à l'effacement) **: le geste de la négociation.** Il s'ajoute à la liste, sous les mêmes conditions de parcours (`nom = aucun`, aucune question ouverte fausse, pas de Dispersion), et **sans besoin du sort** : « Ghom. Je sais ce que tu veux. » Le héros sait désormais que le Ghom ne défera pas l'univers : la menace est inutile. S'ouvre une **négociation en quatre gestes**, où le Ghom répond par ses Influences (Réparation = oui, Distorsion = pas encore, Séisme = non). Réussie, elle mène à **La Gratuité** ([`../06-fins/la-gratuite.md`](../06-fins/la-gratuite.md)) : Gorr écrit dans le Carnet ce que le Ghom tient pour vrai sur l'existence de l'univers, donné comme hypothèse. Elle ne dit pas « Q28 est résolue » : elle l'annote.

| Geste | Vrai ou faux | Effet |
| --- | --- | --- |
| « Ghom. Tu peux partir. Nous continuerons. » | **vrai** | L'Influence « Se retirer » apparaît (ci-dessous). |
| « Ghom. Montre-toi. » | faux | Rien ne se montre : *la pression ne change pas. Il n'y a rien à voir, ou rien de visible.* → calcul des fins. |
| « Ghom. Réponds-moi. » | faux | Rien ne répond : *le Ghom ne parle pas. Il n'a jamais parlé.* → calcul des fins. |
| « Ghom. Reste avec nous. » | faux | *La pression reste, comme toujours.* → calcul des fins. |

*Les faux gestes ne ferment rien qui fût encore ouvert : ils sont simplement ce que le héros pouvait demander sans avoir fait tout le chemin.*

**L'Influence « Se retirer »** *(aucun texte d'aide ; comme au ch. 27, le Ghom ne parle pas, il agit ou non)* :

| Influence | Coût | Effet |
| --- | --- | --- |
| **Se retirer** | aucun | Le Ghom se découple de l'Archipel. Toutes les Influences disparaissent. La barre d'Élan s'éteint. |

- **Le Ghom l'emploie** → fin **Le Découplage**.
- **Le Ghom ne fait rien** (20 secondes) → *La pression reste. Elle se fait seulement plus douce, comme une main qui ne serre plus.* **Le héros** n'insiste pas. → calcul des fins habituel. (Le Découplage n'est plus possible ; l'Intrication non plus, puisque le héros n'a pas de nom.)

**Le calcul des fins** a lieu ici : voir [`../06-fins/README.md`](../06-fins/README.md).

## Choix et conséquences

| Choix ou objectif | Drapeaux | Effet plus tard |
| --- | --- | --- |
| Héritier revenu | `confiance.<lignée> +1` ; `confiance +1` (une fois) | Présent dans l'épilogue de la fin obtenue. |
| Nomination : le nom connu | `nom = <lignée>` | Ouvre la condition de nom de **L'Intrication** ; ferme **Le Découplage**, **La Bascule** et **La Gratuité**. |
| Nomination : un leurre | `nom = faux` | Ferme **L'Intrication**, **Le Découplage**, **La Bascule** et **La Gratuité**. |
| Nomination : « Je n'ai pas de nom. » | `nom = aucun` | Garde ouverts **Le Découplage**, **La Bascule** et **La Gratuité**. |
| Première question de Gorr (sans `gorr_question`) | `gorr_question` ; `carnet.Q16 = repondue` | Richesse du Carnet. |
| Voie Recoudre | `derniere_lacune = recousue` ; `lacunes.recousues +2` | Score d'Ordre ; départage. |
| Voie Élargir | `derniere_lacune = elargie` ; `lacunes.elargies +2` | Score de Chaos ; départage. |
| Voie Habiter | `derniere_lacune = habitee` ; `lacunes.habitees +2` | Condition de **L'Intrication**. |
| ◆ Laisser libre | `combat_final_libre` | Scène supplémentaire dans **Le Découplage** et **L'Intrication**. |
| Héros dispersé | `heros_disperse` | Fin **La Dispersion**, prioritaire. |
| Q28 : le Ghom l'a voulu | `carnet.Q28 = fausse` ; `derniere_reponse = ghom` | Ferme l'Intrication, le Découplage, la Bascule et la Gratuité ; +1 au score d'Ordre. |
| Q28 : le rien est impossible | `carnet.Q28 = fausse` ; `derniere_reponse = rien_impossible` | Ferme l'Intrication, le Découplage, la Bascule et la Gratuité ; +1 au score de Chaos. |
| Q28 : je ne sais pas / les liens / le silence | `carnet.Q28 = ouverte` ; `derniere_reponse = …` | Garde ouvertes l'Intrication, le Découplage, la Bascule et la Gratuité. |
| Le dernier geste, et le Ghom se retire | — (pose `fin = decouplage`) | Fin **Le Découplage**. |
| Le geste de la menace (avec `vacuum_decay`) | `bascule` ; pose `fin = bascule` ; sort lancé | Fin **La Bascule**. Efface la sauvegarde, pose le drapeau méta `bascule_vue`. |
| Le geste de la négociation (avec `bascule_vue`), quatre gestes justes | `q28.annotee` ; pose `fin = gratuite` | Fin **La Gratuité**. |

## Récompenses

Il n'y a plus d'habit à gagner : **la transformation de l'ère V dépend de la fin** (voir chaque fichier de [`../06-fins/`](../06-fins/)). Après le générique, deviennent disponibles en Escarmouche, en Arcade et en ligne : les Échos rencontrés, le héros transformé, les Doubles épargnés (`doubles.epargnes`), et le Ghom déchu s'il a pris une forme.

## Graines pour la suite

Ce chapitre ne prépare plus rien dans l'Aventure. Il laisse une seule chose ouverte, exprès : **Q28**. Dans toutes les fins, le Carnet existe encore, et Q28 y est écrite. Dans aucune fin le jeu ne prétend savoir pourquoi il y a quelque chose plutôt que rien.

## Notes de mise en œuvre

- **Trois voies simultanées :** trois compteurs de progression affichés en haut de l'écran ; le premier qui s'accomplit termine le combat. Les conditions sont exclusives en pratique (Élargir exige de ne pas agir près du Cœur, ce que les deux autres exigent).
- **Ancres et Recomposition :** mêmes mécaniques qu'au ch. 25 ; une ancre active ancre son pan.
- **Élargissement du Cœur :** anneau de cases converties en Lacune tous les 2 tours de la voie Élargir ; un combattant dessus est déplacé (règle de Recomposition).
- **Dispersion du héros :** si `usure ≥ 8`, la chute du héros déclenche l'effet de Dispersion (chaleur et lumière à l'horizontale), pose `heros_disperse`, et retire le héros de la timeline sans défaite. Le Double du héros (s'il est là) est mis en avant par la caméra.
- **« Laisser agir » :** réutiliser la commande de l'ère IV (ch. 19) ; le suivi des commandes du journal suffit pour vérifier `combat_final_libre`.
- **Influence « Se retirer » :** Influence temporaire, sans coût, présente dans la barre uniquement après le choix 1 du dernier geste. Délai de 20 secondes sans action = refus. **Aucun texte n'invite le joueur à l'utiliser**, et aucun texte ne s'adresse au joueur : seul le héros parle, au Ghom.
- **Geste de la menace :** disponible seulement si `hasForbidden("vacuumDecay")` et les conditions du vrai geste. Choisi, il **lance** le sort dans le chapitre : la scène de [`La Bascule`](../06-fins/la-bascule.md) se joue, puis l'Aventure appelle `vacuumDecayWipe({ ending: "bascule" })` (efface la sauvegarde, ajoute une cicatrice, enregistre la fin, pose le drapeau « féliciter au prochain démarrage »). Le moteur de combat n'est pas utilisé : la scène est écrite.
- **Geste de la négociation :** disponible seulement si `secondEndingAvailable()` et les conditions du vrai geste. Les quatre gestes, leurs bonnes réponses et le décompte d'erreurs sont dans [`La Gratuité`](../06-fins/la-gratuite.md). Fin : `markEnding("gratuite")` et `congratulateNext("gratuite")`, sans effacement.
- **Gorr écrit :** animation d'écriture lente dans le Carnet, avec la réponse choisie (ou une ligne vide pour le silence).
- **Calcul des fins :** voir `06-fins/README.md`. Le calcul lit tous les drapeaux au moment où le nœud 5 se ferme.
