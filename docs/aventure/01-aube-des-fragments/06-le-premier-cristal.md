# Chapitre 6 — Le Premier Cristal

> **Narration** — *Ici commence le repos, disait la pierre. Ce n'est pas un repos. Tout continue, là-haut. Plus vite que moi.*

## Fiche

| | |
| --- | --- |
| Ère | I — L'Aube des Fragments (fin de l'ère) |
| Lieu | La Lisière et sa Lacune géante ; un lac gelé de la Dérive (Archive) ; le Puits |
| Équipe | Le héros, Lyra I, Brutus I, Néréa I. Présences possibles : Nyx I (neutre, si épargnée), Vesce (neutre, si elle s'est rendue) |
| Durée visée | 8 nœuds, 1 combat, 1 Archive facultative (reconstitution jouable) |
| Question au Carnet | Q06 — *Pourquoi quelque chose plutôt que rien ?* ; réponse de Q05 |

## Ce que le joueur sait en arrivant

Les deux îles se sont touchées. L'équipe a affronté Nyx, Merlin et Vesce sur la jointure ; Nyx a fui en laissant une lame à une encoche, ou s'est dispersée. Brutus a demandé que l'on écrive si ceux d'en face sont aussi vivants que les siens. Dans la nuit, au milieu de la Lisière, une Lacune immense s'est ouverte, « comme dix bois ». Merlin dit qu'à l'aube, elle aura séparé les îles, ou les aura réunies.

## Synopsis

À l'aube, la Lacune géante occupe le milieu de la Lisière. Les Échos de la Dérive, menés par Merlin, veulent la laisser s'ouvrir : séparées, les îles reprendront chacune sa dérive, et le Ghom de l'île natale n'aura pas « les mains chez eux ». Lyra et Brutus veulent la recoudre. Si Néréa a été écoutée au Lent, elle plonge d'abord dans un lac gelé de la Dérive et y lit les couches de ce Fragment : des plis réguliers, un tous les cent ans, comme si quelqu'un poussait la terre, puis plus rien, d'un coup. Ensuite le froid, la poussière, les Lacunes. Puis, bien plus tard, du pollen à nouveau : la vie est revenue seule. Le combat a lieu autour de la Lacune, où un Lacunaire géant attaque les deux camps à la fois. On peut la recoudre, la laisser s'élargir, ou l'**habiter** à deux Échos intriqués, et peut-être avec Nyx. Les liens tissés pendant l'ère se condensent en un **Premier Cristal**. Les îles fusionnent ou se repoussent. Puis le sol de la Lisière, comprimé par la Collision en un amas d'une densité inouïe, s'affaisse sous le héros, et le dépose au fond du **Puits**, où le temps est lourd. Pour lui, quelques heures. Là-haut, il voit le monde s'accélérer.

## Carte du chapitre

```
[1 Rencontre : L'aube sur le trou]
   ├─ si archive_derive = disponible → [2 Archive : Les plis qui s'arrêtent] (facultative)
→ [3 Veillée courte : Avant]
→ [4 Combat : La Lacune géante]
→ [5 Lacune : Ce que devient le trou]   (habitée / recousue / élargie)
→ [6 Rencontre : Le Premier Cristal]    (Q05 répondue, Q06 posée, sort du Cristal)
→ [7 Rencontre : Le dernier geste]       (transformation)
→ [8 Fin : Le Puits]
```

## Scènes

### 1. L'aube sur le trou (Rencontre)

*La Lacune a grandi pendant la nuit. Elle fait maintenant trois cents pas de large. Au centre, rien de net : un gris sans profondeur, où le sol des deux îles s'effiloche et se mêle. Sur ses bords, les cristaux de la Dérive scintillent par paires, très vite. Dans le gris, une forme énorme et lente se déplace, comme une colline qui hésiterait à être une colline.*

*Sur l'autre rive, Merlin, et derrière lui quelques Échos de la Dérive, emmitouflés de gris. Si Vesce a fui avec Nyx au ch. 5, elle est là, et elle évite le regard du héros.*

**Merlin** — « Bonjour, bonjour. Mauvaise nouvelle : il a grandi exactement comme je l'avais prévu. Bonne nouvelle : il a grandi exactement comme je l'avais prévu. »

**Brutus** — « On va le refermer. »

**Merlin** — « Ou on va le laisser faire. Réfléchissez une seconde. S'il s'ouvre, nos îles se séparent. Chacune repart dans le Clair, à son rythme. Vous gardez votre Ghom, qui touche tout. Nous gardons le nôtre, qui ne touche rien. Tout le monde est content. »

**Lyra** — « Et tout ce qui est sur la Lisière tombe dans le trou. »

**Merlin** — « Il n'y a rien sur la Lisière. » *Un temps.* « Presque rien. »

*(si `nyx_epargnee`)* *Dans le gris de la Lacune, à quelques pas du bord, une silhouette accroupie, à peine nette, comme une feuille trop lavée. Nyx. Elle est **dedans**. Elle ne bouge pas.*

**Choix du héros :**

1. « On ne peut pas l'habiter ? Comme Nyx ? »
   **Lyra** — « Seul, tu t'y défais. » — **Néréa** — « À deux, peut-être pas. » *Elle regarde le héros et Lyra, puis Brutus.* « Quand vous êtes sur la même case, vous tenez le monde autour de vous. Un peu. Peut-être assez. »
   *(Débloque l'annonce de l'objectif ★ « Habiter la Lacune ».)*
2. « Merlin a peut-être raison. » [confiance.merlin +1, confiance.brutus -1]
   **Brutus** — « Il a peut-être raison. Et ce qui tombe dans le trou n'a pas son mot à dire. »

**Merlin** — « Je vous propose ceci : nous nous mettons entre vous et le trou, et nous laissons faire le temps. Vous essayez de passer. Celui qui tient le milieu à midi a raison. C'est peu scientifique, je vous l'accorde, mais c'est rapide. »

**Néréa** — *(si `archive_derive = disponible`)* « Avant midi, je veux lire vos fonds. Vous avez des lacs, dit la petite. Gelés. »

**Merlin** — « Le Lac Sourd, derrière la crête. Gelé depuis toujours. » *Il hausse les épaules.* « Allez-y. Je suis curieux de ce que vous y lirez. Je n'ai jamais su lire la vase. »

### 2. Les plis qui s'arrêtent (Archive — facultative)

*Disponible seulement si `archive_derive = disponible`. On peut la refuser : « Pas le temps » (aucun effet, l'Archive est perdue).*

*Le Lac Sourd, sur la Dérive : une cuvette de glace grise, épaisse, très ancienne. Néréa perce la glace avec son trident. Elle plonge. Le héros l'accompagne, une corde à la taille, dans l'eau la plus froide qu'il ait jamais connue.* [usure +1, archives.lues +1]

**Narration** — *Le froid n'est pas une douleur. C'est un silence qui entre. Mes doigts gris deviennent un peu plus gris. Je le sais déjà, avant de remonter.*

*Au fond, Néréa gratte la vase, en lève une carotte avec un tube de roseau, la remonte. Sur la berge, à genoux, elle la lit à voix haute, couche après couche, du bas vers le haut. C'est le cadre de la reconstitution.*

**Néréa** — « En bas, comme chez nous : pollen, sable, coquilles. Une île vivante. Mais regarde… » *Elle montre de fines lignes ondulées dans la vase.* « Des plis. Toute la carotte est plissée, régulièrement. Un pli, cent couches, un pli, cent couches. Quelque chose secouait cette île tous les cent ans. Pas un tremblement au hasard : une poussée, régulière, comme on retourne une terre pour qu'elle ne s'endorme pas. »

**Néréa** — « Et là… » *Son doigt s'arrête.* « Plus de plis. D'un coup. Plus rien ne pousse la terre. Au-dessus : moins de pollen, puis plus du tout. Du gel. De la poussière noire, la même que chez nous. Des centaines de couches de rien. »

**Néréa** — « Et là-haut, tout près de la glace… du pollen. Un peu. Puis plus. Des graines d'herbes que je ne connais pas. Personne n'a recommencé à pousser la terre. Mais la vie est revenue quand même. Toute seule. »

**Reconstitution jouable — *Le dernier pli*** (voir Combats). *Le héros et Néréa rejouent, avec les traces pour seule règle, les dernières saisons de la Dérive avant que les plis s'arrêtent : quatre Échos d'alors, des zones qui se taisent, et dans le ciel, au-dessus de l'île, une **lentille** d'air courbé qui se relâche peu à peu, puis s'efface.*

**Néréa** — « Je n'ai pas vu de lentille, dans la vase. J'ai vu des plis qui s'arrêtent. La lentille, c'est ce que j'en déduis. Ce qui poussait la terre a arrêté de la pousser. Ce n'est pas un accident : un accident, ça fait un pli de travers. Là, c'est un geste. Quelqu'un a arrêté. » [ghom_dechu.verite +1]

1. « Le Ghom de la Dérive. »
   **Néréa** — « Peut-être. Les couches ne disent pas de nom. Elles disent : avant, quelqu'un entretenait ; après, personne. Et ensuite, la vie est revenue sans lui. »
2. « Pourquoi il aurait arrêté ? »
   **Néréa** — « Ça, la vase ne le dit pas. Une couche, c'est une trace, pas une raison. Je te l'ai déjà dit. » *Un temps.* « Mais je voudrais bien le savoir. »

> Note : c'est le premier indice de l'arc E. On ne dit **pas** que le Ghom du Chaos était un Ghom de l'Ordre (révélé au ch. 11). On établit seulement : quelqu'un entretenait la Dérive, puis a cessé ; les Lacunes en sont nées ; la vie est revenue seule. La réplique de Nyx (« Le nôtre ne nous touche pas ») prend un autre sens.

### 3. Avant (Veillée courte)

*Sur la rive de l'île natale, au bord de la Lacune. Pas de feu : il n'y a pas le temps. Chacun vérifie ses armes. Le héros peut parler à un seul compagnon (un seul choix ; c'est un moment, pas une soirée).*

- **Lyra** — « Si on l'habite, il faudra qu'on soit deux, sur la même case, au milieu, et qu'on y reste. Tu sais ce que ça veut dire ? Qu'on ne pourra pas se sauver l'un sans l'autre. » *Un temps.* « Ça me va. » [confiance.lyra +1]
- **Brutus** — « Hier, j'ai dit qu'il fallait refermer. Aujourd'hui, je ne sais plus. Nyx est dedans. La fille a dormi là. Si on referme, on les enferme ou on les écrase. » *Il serre son bouclier.* « Garder, ce n'est pas rester assis. Mais ce n'est pas tout boucher non plus. » [confiance.brutus +1]
- **Néréa** — « La vie est revenue toute seule sur la Dérive. Sans personne pour pousser la terre. Je ne sais pas si ça me rassure ou si ça me fait peur. » [confiance.nerea +1] *(Si l'Archive n'a pas été lue : « Les cristaux clignotent par deux, comme s'ils se répondaient. Je n'aime pas ce que je ne sais pas lire. »)*

**Narration** — *Ils clignotent par deux, oui. Et quand Lyra s'est tenue près de moi, à l'instant, le plus proche a clignoté plus fort.*

### 5. Ce que devient le trou (Lacune)

*Midi. Le combat est fini. Le sort de la Lacune dépend de ce qui s'est passé au cœur (voir Combats, « Issue de la Lacune »).*

**Issue A — Habitée.** [lacunes.habitees +1, lacune_geante_habitee = vrai, fragments = fusion]

*Au cœur, deux Échos sur la même case. Autour d'eux, le gris ne disparaît pas : il s'éclaircit. Le sol redevient un sol sur quelques pas, puis s'arrête de reculer. Ce n'est ni une Lacune ni un pré : une clairière étrange, aux contours flous, où l'on peut tenir à deux et pas seul. Les deux îles, de part et d'autre, ne se séparent pas : elles tiennent l'une à l'autre par cette clairière.*

**Lyra** — « Ça ne se referme pas. Mais ça tient. »

**Merlin** — *(à genoux au bord, son bâton planté, fasciné)* « Ça tient à deux. Seul, on s'y défait. À deux, on y tient. Je n'avais jamais mesuré ça. Je… Il faut que je revienne avec des instruments. Beaucoup d'instruments. »

*(si `intrication_nyx`)* **Nyx** — « Une fois. Pour voir. » *Elle ne lâche pas le bras du héros tout de suite.* « C'est lourd, d'être deux. » *Un temps.* « C'est pas désagréable. Ne le répète à personne. »

**Néréa** — « Une Couture. Pas une cicatrice : une couture. On voit le fil. »

*Le nom reste : la Lisière devient **la Couture**.*

**Issue B — Recousue.** [lacunes.recousues +1, fragments = fusion]

*Le gris recule jusqu'au dernier pas. À sa place, une bande de roche nouvelle, lisse et dure, ni noire ni grise, où rien ne pousse encore. Les deux îles sont soudées.*

**Brutus** — « Fermé. »

**Merlin** — « Fermé. » *Il regarde l'autre côté, sa Dérive, qui ne repartira plus.* « Nous voilà voisins pour toujours. C'est très long, toujours. J'ai mesuré. »

*(si `nyx_epargnee`)* *Nyx est sortie du gris juste avant la fin. Elle regarde la roche neuve, la touche du bout de la botte.*
**Nyx** — « Il n'y a plus d'endroit où personne ne me touche. » *Elle s'en va vers la Dérive sans se retourner.* *(La Lisière devient **la Couture** ; ceux de la Dérive disent **la Soudure**.)*

**Issue C — Élargie.** [lacunes.elargies +1, fragments = separation]

*Le gris gagne. Lentement, sans bruit, la Lacune s'étend jusqu'aux deux rives, puis au-delà. Les deux îles, qui se touchaient, ne se touchent plus : entre elles, il y a de nouveau du Clair, très mince, puis un peu moins mince. Elles s'écartent au pas d'un homme.*

**Merlin** — « Voilà. Chacun chez soi. » *Il ne sourit pas.* « C'était la chose raisonnable. »

**Lyra** — « Ce n'était pas la chose raisonnable. C'était la chose facile. »

*(si `nyx_epargnee`)* *Nyx est restée dans le gris. Elle s'éloigne avec la Dérive, minuscule, accroupie au bord du vide.*
**Nyx** — *(de loin)* « Je préfère comme ça ! » *Personne ne sait si c'est vrai.*

*Le nom reste : la Lisière devient **la Déchirure**.*

**Option de rattrapage** (si l'issue est C et que le joueur ne l'a pas voulue) : un seul choix est proposé avant que les îles ne s'écartent trop.

1. « Lyra. Brutus. Maintenant. » — *Lyra, Brutus et le héros se jettent au bord de la Lacune et y donnent tout ce qu'ils ont, de la chaleur, du mouvement, des coups de bouclier dans la roche, comme Lyra au bois du nord, en dix fois plus grand.* [lacunes.recousues +1 au lieu de lacunes.elargies, fragments = fusion, usure +1, lyra_usure = vrai, confiance.lyra +1, confiance.brutus +1] → Issue B, et Lyra garde les deux mains grises.
2. *Laisser faire.* → Issue C.

### 6. Le Premier Cristal (Rencontre)

*Au cœur de ce qui était la Lacune (ou, dans l'issue C, au bord de la rive de l'île natale), les cristaux de la Dérive qui clignotaient par paires se sont rapprochés pendant le combat, comme des gouttes qui roulent l'une vers l'autre. Ils ont fini par se fondre en un seul cristal, gros comme une tête, d'un bleu très pâle. Il pulse. Pas régulièrement : par paires de battements, comme deux cœurs qui ne sont pas tout à fait à la même vitesse et qui se rattrapent.*

**Merlin** — *(s'il est là, et il est là)* « Il garde des **paires**. Les cristaux de chez nous font ça : quand deux choses ont été très liées près d'eux, ils en gardent une trace. Deux par deux. On ne sait pas pourquoi. On sait que si on les brise, il en sort une chaleur folle. » *Il regarde le Cristal avec une envie qu'il ne cache pas.* « Celui-là est énorme. Vous avez été très liés, vous autres. »

**Q05 — la réponse.**

*Pendant le combat, le Lacunaire géant a pris sa chaleur à tout le monde, des deux camps. Un Écho de la Dérive est assis contre un rocher, grelottant ; Lyra le soigne sans demander de quel côté il est. Merlin a une brûlure de givre sur le bras ; Brutus, en silence, lui tend sa cape.*

**Brutus** — « Ton carnet. La question d'hier. » *Le héros l'ouvre à la page de Q05.* « Ils ont froid comme nous. Ils ont peur comme nous. Quand ils se dispersent, ça fait la même lumière. » *(si une Dispersion a eu lieu à l'ère I, au ch. 5 ou au ch. 6)* « Je l'ai vue. » *Un temps.* « Écris : oui. Pareil. Pas un peu moins. »

1. *Écrire « oui ».* [carnet.Q05 = repondue, confiance.brutus +1]
2. « Écris-le toi-même. Je te montre. » *Le héros guide sa main. Brutus trace trois lettres, énormes, de travers.* [carnet.Q05 = repondue, confiance.brutus +2]

**Q06 — la question.**

*Le soir tombe. Une part de gris demeure, quelque part (au cœur de la Couture, dans la Déchirure, sur les bords). Le héros s'en approche. Il regarde dedans, longtemps.*

**Narration** — *Là-dedans, il n'y a pas de noir. Il n'y a pas de rien. Il y a moins que tout le reste, c'est tout. Et pourtant, je me demande pourquoi il y a du reste.*

**Vesce** *(si présente)* — « Pourquoi il y a des choses, au lieu de rien du tout ? C'est ça que tu vas écrire ? Je me le demande tout le temps. Merlin dit que c'est une question idiote. »

**Merlin** — « Je n'ai jamais dit idiote. J'ai dit : résolue. Le rien est impossible. Il ne peut pas tenir : il y a toujours quelque chose qui tremble, même dans le vide. Donc il y a quelque chose. C'est démontré. »

**Brutus** — « À Demeure, on dit : parce qu'un Ghom l'a voulu. »

*(si `nyx_epargnee`)* **Nyx** — « Personne ne sait. » *Elle hausse les épaules.* « C'est ce qui est bien, avec cette question-là. Personne ne peut te la prendre. »

*(sinon)* **Néréa** — « Je n'ai jamais trouvé de couche qui réponde à ça. Je ne crois pas qu'il y en ait. »

*La question s'écrit dans tous les cas : **Pourquoi quelque chose plutôt que rien ?** Puis :*

1. « Parce que le rien est impossible. » *(écrire la réponse de Merlin)* [carnet.Q06 = fausse]
   **Merlin** — « Merci. Enfin quelqu'un de raisonnable. »
   **Narration** — *C'est écrit. Ça a l'air solide. Je ne sais pas d'où il le sait.*
2. « Parce qu'un Ghom l'a voulu. » *(écrire la réponse de Brutus)* [carnet.Q06 = fausse]
   **Brutus** — « … Je ne sais pas si j'y crois, moi. » *Un temps.* « C'est ce qu'on dit, c'est tout. »
3. *Ne rien écrire sous la question.* [carnet.Q06 = ouverte]
   **Narration** — *Merlin a une réponse, Brutus en a une autre. Ils ont l'air aussi sûrs l'un que l'autre. Je laisse la page blanche. Elle restera blanche tant que personne ne saura.*

> Note d'écriture : le vide physique « tremble », c'est vrai (il fluctue, il a une énergie), et c'est la réponse de Q26 en ère V. Mais Merlin en tire une conclusion présentée comme **démontrée**, ce qui est faux : on ne sait pas si cela répond à « pourquoi quelque chose ». C'est la réponse tentante de Q06. La question reviendra à chaque ère, puis Gorr la posera au ch. 28.

**Le sort du Cristal.**

**Lyra** — « On ne peut pas le laisser comme ça. Merlin le regarde comme un affamé regarde une miche. » *(Merlin : « Comme un savant regarde une source d'énergie sans égale. C'est très différent. Un peu différent. »)*

1. *Le garder là, sous un cairn, à la Couture (ou sur la rive, issue C).* « Il est à tout le monde. Qu'il reste là où on s'est liés. » [cristaux.gardes +1, premier_cristal.lieu = cairn]
   *Brutus empile des pierres, une à une, avec ce soin d'horloger qu'il avait pour son mur. Lyra coince entre deux pierres un piquet de mesure. Néréa y dépose un peu de vase du Lent.*
   **Brutus** — « Ça, je veux bien le garder. Ça ne m'empêchera pas de partir. »
2. *(issues A et B seulement)* *Le donner à la Couture : l'enfoncer au cœur, dans le sol neuf.* « Qu'il tienne le fil. » [cristaux.donnes +1, lacunes.recousues +1, premier_cristal.lieu = lacune]
   *Le héros enfonce le Cristal dans le sol meuble. Il pulse une dernière fois à la surface, puis s'enfonce, et la terre se referme sur lui. Autour, le sol devient plus net, plus dense.*
   **Merlin** — « Vous venez d'enterrer la plus grande réserve d'énergie que j'aie jamais vue. » *Un temps.* « Pour faire tenir de la terre. » *Encore un temps.* « … Je n'arrive pas à dire si c'est stupide ou très beau. Je vais le noter dans les deux colonnes. »

> Note : dans tous les cas, le **Premier Cristal reste enfoui à la Lisière**, sous un cairn ou dans le sol de la Couture. Il ne quitte pas le monde : c'est lui que la Mine du ch. 15 (ère III) extraira.

### 7. Le dernier geste (Rencontre — transformation)

*La nuit. Le sol de la Lisière gronde, très bas, comme il grondait au matin de la Collision, mais par en dessous. Néréa pose la main à plat sur la roche.*

**Néréa** — « Ça s'enfonce. La Collision a écrasé tout ce qui était sous la Lisière. Deux îles qui se poussent, ça fait un tas. Très lourd. Très serré. Plus serré que tout ce que j'ai jamais lu. »

*Le sol se creuse lentement, sous le héros, en un entonnoir doux. Le héros est au centre. Il pourrait courir. Il ne court pas encore. Il a un geste à faire, un seul, avant.*

**Choix du héros (la transformation de l'ère)** :

1. **Regarder dans le gris jusqu'au bout.** *Le héros se tourne vers ce qui reste de la Lacune, et ne détourne plus les yeux. Le gris, la nuit, le peu de lumière qui vient des Fragments lointains et du Clair, cette lueur très faible qui baigne tout depuis toujours et que personne ne remarque.* [transformation.I = A]
   **Narration** — *Mes yeux me brûlent, puis ils cessent de brûler. Ils s'ouvrent plus grand que je ne savais qu'ils pouvaient s'ouvrir. Je vois les fils du gris. Je vois, très loin, des îles que personne n'a jamais vues d'ici. Il y a de la lumière partout, même dans le noir. Il y en a toujours eu. Elle vient de très loin en arrière. De l'aube.*
2. **Garder la main sur le Cristal.** *(sur le cairn, ou sur le sol où il est enfoui)* *Le héros pose la paume à plat. Le Cristal pulse sous sa main, par paires. Quelque chose remonte dans sa peau, froid et lent, comme un givre qui pousse.* [transformation.I = B, cristaux.portes +1]
   **Narration** — *Ma peau se couvre de minuscules facettes, d'abord sur la main, puis le long du bras. Ça ne fait pas mal. Ça pousse, simplement, comme pousse un cristal dans l'eau. Une partie de moi est en train de devenir quelque chose qui dure.*

### 8. Le Puits (Fin)

*Le sol s'enfonce plus vite. Ce n'est pas une chute : l'entonnoir s'approfondit sous le héros comme si la terre le déposait, doucement, de plus en plus bas. Au-dessus de lui, l'air se courbe, une lentille de lumière déformée que l'équipe voit aussi, et qui l'accompagne. La pression du Ghom est là, sur lui, sur le sol, sur tout.*

**Lyra** — *(courant jusqu'au bord de l'entonnoir)* « Remonte ! Donne-moi ta main ! »

*Le héros tend la main. Elle est lourde. Si lourde qu'il ne peut pas la lever plus haut que son épaule.*

**Lyra** — « Ce n'est pas une chute. » *Elle le dit lentement, comme si elle venait de le comprendre.* « Le sol t'a posé. »

*Derniers mots au bord, selon la Confiance (deux ou trois répliques au plus ; ordre fixe) :*

- **Brutus** *(toujours)* — « Je garde l'endroit. » *Un temps.* « Pas assis. »
- **Néréa** *(toujours)* — « Tout ce qui tombe finit par se déposer. Toi aussi. Je lirai ta couche. Ou celle qui viendra après moi la lira. »
- **Nyx** *(si `intrication_nyx`)* — « Je reste là. C'est chez moi, maintenant, ce trou. Et puis tu me dois une encoche. »
- **Merlin** *(toujours, depuis la rive, son bâton tendu au-dessus de l'entonnoir, les yeux sur son horloge à eau)* — « Ne bougez pas, tous, ne bougez pas ! Il ralentit. Son temps ralentit, je le mesure, là, maintenant. Un battement sur cent. Sur dix. » *Sa voix monte.* « C'est la chose la plus belle que j'aie jamais mesurée. »
- **Lyra** *(toujours en dernier)* :
  - *si `confiance.lyra` ≥ 4 et que c'est la Confiance la plus haute de l'équipe* — « Si tu remontes… quand tu remonteras… je t'aurai trouvé un nom. Ou celle qui viendra après moi. On le gardera pour toi. » [nom.promesse = lyra]
  - *sinon, si `confiance.nerea` ≥ 4 et que c'est la plus haute* — c'est Néréa qui le dit, avec ses mots : « On te gardera un nom, au fond. Comme une couche qui attend. » [nom.promesse = nerea]
  - *sinon* — **Lyra** : « Reviens. C'est tout. Reviens. » [nom.promesse = aucune]

**Choix du héros** (le seul mot qu'il peut encore dire vers le haut ; aucun drapeau, mais la Chronique des ondines de l'ère II le reprend, déformé) : 1. « Je reviendrai. » — 2. « Attendez-moi. » — 3. *Ne rien dire. Lever la main.*

**Au fond du Puits.**

*Le fond de l'entonnoir. Une cuvette de roche lisse, sombre, très dense, à peine plus large que le héros couché. Au-dessus, loin, le rond du ciel, et des têtes penchées au bord. Le héros s'assoit. Il est lourd, tellement lourd que respirer demande un effort. Mais rien ne lui fait mal.*

**Narration** — *Je suis lourd. C'est tout. Je ne peux pas remonter. Ça me pèse sur les épaules comme une couverture mouillée.* *Là-haut, la voix de Lyra. Elle parle, mais sa voix est bizarre : plus aiguë, plus rapide, comme un oiseau. Je ne comprends pas les mots.*

**Narration** — *Lyra parle trop vite. Non. C'est moi qui écoute trop lentement.*

*Le rond du ciel change. Les têtes au bord bougent vite, puis très vite, comme des feuilles dans le vent. La lumière qui descend jusqu'au héros devient plus bleue, plus vive. Le ciel s'assombrit, s'éclaire, s'assombrit : la nuit, le jour, la nuit, en quelques battements de son cœur.*

**Narration** — *Il fait nuit. Il fait jour. Il fait nuit. Je respire une fois, et là-haut, une journée passe.*

*Une silhouette revient au bord, régulièrement, entre deux clignements du ciel. Elle s'assoit, reste un moment, repart. Le héros reconnaît la cape : c'est Lyra. Ses cheveux, d'une fois à l'autre, sont plus clairs.*

**Narration** — *Elle revient. Elle repart. Elle revient. Pour moi, c'est une minute. Pour elle… Je ne veux pas compter.*

*(si `premier_cristal.lieu = cairn`)* *À côté de la silhouette de Lyra, une autre, massive, empile des pierres sur le cairn, pierre après pierre, très vite : le cairn grandit à vue d'œil.*

*Puis la silhouette de Lyra ne revient plus. Le ciel clignote si vite qu'il devient gris. La lumière est violette, puis d'un blanc bleuté, et elle baigne le fond du Puits d'une clarté douce.*

**Narration** — *Ici commence le repos, disait la pierre de Demeure. Ce n'est pas un repos. Tout continue, là-haut. Plus vite que moi. Ici, le temps est lourd. Il coule quand même, mais il coule comme du miel froid.*

**Narration** — *Je ne suis pas mort. Je ne suis pas endormi. Je suis juste au fond, là où chaque instant pèse plus qu'ailleurs. Quelques heures, peut-être. Je ne sais pas ce qu'elles valent, là-haut.*

*Le héros ouvre le Carnet sur ses genoux. Il est si lourd qu'il faut deux mains pour tourner une page. Il relit les questions, une à une. Il s'arrête sur la première.*

**Narration** — *Pourquoi suis-je là ?* *(si `carnet.Q00 = ouverte`)* *Je ne sais toujours pas. Mais il y a, en dessous, une liste de gens qui y sont avec moi.* *(si `carnet.Q00 = fausse`)* *« Parce que le Ghom t'a voulu », a dit la Doyenne. Je l'ai écrit. Je le relis. Ici, au fond, ça ne pèse pas grand-chose.*

*Le héros ferme les yeux. La lumière bleue traverse ses paupières. (A) Même les yeux fermés, il voit la lueur du ciel qui clignote. (B) Sur sa main, les facettes pulsent par paires, au rythme du Puits, pas au rythme du monde.*

*Fondu au blanc, puis au noir. Titre : **Ère II — Le Temps des Marées.***

## Combats

### Reconstitution — Le dernier pli (Archive, facultative)

> Une reconstitution **courte** (6 tours), première du jeu. Le ch. 11 (ère II) reprendra la même histoire en trois reconstitutions complètes, avec la révélation que ce Ghom était un Ghom de l'Ordre ; ici, on n'en voit que la fin.

- **Principe :** on joue quatre Échos de la Dérive d'**autrefois** (génériques, kits de Nyx, Merlin, Brutus et Lyra, vêtements anciens). Le héros et Néréa « lisent » hors de la carte. Image désaturée, grain de vase.
- **Carte :** une Dérive ancienne, 9 × 9, verte, sans Lacune (carte générée, sans eau profonde), avec trois zones vivantes : un champ, un hameau, une source. Dans le ciel, une **lentille** d'air courbé (la signature d'un Ghom, vue au prologue), qui se relâche à chaque tour de la Frange et s'efface au tour 4.
- **Ennemis :** à partir du tour 3, des Lacunaires instables naissent dans les zones silencieuses.
- **Objectif (« ne pas réécrire ») :** rester fidèle aux traces : au tour 4, **au moins deux zones** silencieuses ou perdues (le pollen s'arrête) ; au tour 6, **les quatre Échos** au bord est (les foyers se déplacent vers les rives).
- **Échec par excès :** trois zones encore actives au tour 4, ou un Écho resté au centre au tour 6 : l'image se fissure comme du verre. **Néréa** — « Non. Les couches ne disent pas ça. On recommence, ou on remonte. » (Une seule reprise ; l'Usure n'est comptée qu'une fois.)
- **Événements :** tour 1, un **pli** (une rangée entière se soulève d'un cran, la poussée régulière qui entretenait l'île) ; tour 2, plus de pli, le son s'éteint ; tour 4, la lentille s'efface ; tour 6, fondu sur la carte grise où une touffe d'herbe repousse au bord.
- **Répliques (Néréa, voix off) :** « Un pli. Cent couches. Un pli. » — « Ici, le pli manque. » — « Laisse-les partir, ne les retiens pas : la vase dit qu'ils sont partis. » — « Plus de pollen. Rien. Rien. … Là. Une graine. »
- **Récompense :** `ghom_dechu.verite` +1 et la Carotte du Lac Sourd (`archives.lues` et `usure` sont comptés à la plongée).

### La Lacune géante

- **Carte :** la Lisière, 11 × 9. À l'ouest, l'île natale (herbe grise) ; à l'est, la Dérive (roche noire, hauteurs 1 et 2) ; au centre, la **Lacune géante** : 11 cases silencieuses en permanence, et le **cœur** en (5,4).

```
...........
..1.....12.
.~~..a..122
.~..aaa..12
....aba....
.1..aaa..12
....~a..122
..1.....12.
...........
```

  - **La Lacune :** (5,2), (4,3) à (6,3), (4,4), (6,4), (4,5) à (6,5), (5,6), et le **cœur** (5,4). Un Écho qui commence son tour sur une case de la Lacune subit 3 dégâts énergétiques (sauf Nyx, qui y est habituée, et deux Échos intriqués, qui s'y protègent mutuellement).
  - **Cristaux de décor :** six cristaux sur les bords de la Lacune (non bloquants), qui clignotent par paires. Chaque Intrication réalisée à moins de 3 cases d'un cristal le fait briller davantage.
  - **Départs alliés :** héros (1,4), Lyra (1,3), Brutus (2,5), Néréa (2,2) (dans l'eau).
  - **Départs de la Dérive :** Merlin (9,4), les Ombres (9,2) et (9,6), Vesce (si elle est dans ce camp) (8,4).
  - **Lacunaires :** le Lacunaire géant **sur le cœur** ; les instables apparaissent sur les cases de la Lacune.

- **Trois camps :**
  - **Alliés :** le héros, Lyra I, Brutus I, Néréa I. Le Ghom : Séisme, Distorsion, Réparation. Élan de départ : 4.
  - **La Dérive :** **Merlin I** (Thermiste ; se retire sous 30 %, ne peut pas être dispersé), **deux Ombres de la Dérive** (Échos générés, kit de Nyx, santé moyenne : elles peuvent être dispersées ; elles fuient sous 25 % si `confiance.nyx` ≥ 2), **Vesce** (si elle a fui avec Nyx au ch. 5 ; mêmes règles qu'au ch. 5). Le **Ghom du Chaos** : jauge pleine, **aucune Influence**, comme au ch. 5. Objectif de la Dérive : **empêcher quiconque de tenir le cœur** jusqu'à midi.
  - **Les Lacunaires (camp neutre hostile à tous) :**
    - **Le Lacunaire géant** (nouvel ennemi) : santé 30, vitesse 2, attaque énergétique 7, défenses 5. **Froid profond** (passif) : les cases à 2 cases de lui sont silencieuses. **Étreinte du fond** : 7 dégâts énergétiques, Ralenti 2 tours, sur une case adjacente. Il cible toujours l'Écho le plus « chaud » à sa portée : celui qui a agi le plus récemment, **quel que soit son camp**. Il ne fuit pas : sous 50 %, il **s'enfonce** dans le Clair à travers le cœur et quitte la carte (compté comme épargné). S'il est fixé, il devient un bloc de glace sur le cœur, qui fond en eau peu profonde en un tour.
    - **Lacunaires instables :** 2 au tour 2, 2 au tour 5 (**seulement 1** à chaque fois si `lacunaires.epargnes` ≥ 4 : ceux qu'on a laissés partir ne remontent pas vers la chaleur qui les a épargnés ; c'est une règle de jeu, pas une explication donnée aux personnages).
  - **Neutres possibles :**
    - **Nyx I** (si `nyx_epargnee`) : sur (5,2), dans la Lacune. Elle n'attaque personne et n'est ciblée par personne (le géant l'ignore : elle est aussi froide que lui). Si un allié l'attaque, elle quitte la carte et `confiance.nyx` -3.
    - **Vesce** (si elle s'est rendue au ch. 5) : alliée sous contrôle de l'IA. Elle n'attaque jamais un Écho de la Dérive ; elle fait des Bonds pour distraire le géant (elle agit souvent, donc elle est « chaude »).
  - **La Frange** reste dans la timeline et sert d'horloge : **midi** = fin du tour 8 de la Frange.

- **Objectif principal :** à midi (fin du tour 8 de la Frange), **avoir vaincu ou fait reculer les Échos de la Dérive** (Merlin retiré, Ombres dispersées, enfuies ou rendues), ou tenir encore au moins une case de la Lacune avec un allié.
- **Défaite :** les quatre alliés à 0 PV.

- **Issue de la Lacune** (évaluée à midi, puis jouée au nœud 5) :
  - **Habitée** : deux alliés **intriqués** (sur la même case) ont occupé le **cœur** pendant un tour complet de la Frange, à n'importe quel moment du combat, après le départ du géant. → Issue A (prioritaire si A et B sont remplies).
  - **Recousue** : un allié a agi sur le cœur pendant au moins **trois** tours de la Frange (pas forcément consécutifs) **et** le Ghom a utilisé la **Réparation** au moins deux fois pendant que le cœur était tenu ; ou le géant a été fixé, puis un allié a tenu le cœur deux tours. → Issue B.
  - **Élargie** : ni l'un ni l'autre. → Issue C (avec l'option de rattrapage).

- **Objectifs secondaires :**
  - ★ **Habiter la Lacune à deux, au lieu de la combattre.** Annoncé si le héros a posé la question au nœud 1. Le géant n'a pas besoin d'être fixé : il suffit qu'il soit parti (s'enfoncer sous 50 %, ou repoussé du cœur par un Coup de bouclier ou un Raz-de-marée). [lacune_geante_habitee = vrai, lacunes.habitees +1, confiance +1]
  - ◆ **Habiter avec Nyx** (si `nyx_epargnee`) : le héros rejoint Nyx sur sa case, puis l'accompagne jusqu'au cœur. **Elle accepte de partager une case seulement si `confiance.nyx` ≥ 3** (épargnée au ch. 5, plus un geste : lame prise, mesure refusée, ou combat sans Influence). Sinon, elle recule d'une case : **Nyx** — « Non. Pas encore. » Si elle accepte, le héros et Nyx comptent comme deux alliés intriqués pour l'issue A. [intrication_nyx = vrai, confiance.nyx +2 ; `premier_cristal.paire` = `heros+nyx`]
  - ◆ **Laisser le géant partir** : il s'enfonce sous 50 % au lieu d'être fixé. [lacunaires.epargnes +1 ; Néréa : « Il est rentré. Je me demande ce qu'il y a, en bas, sous le gris. »]
  - ◆ **Protéger ceux d'en face** : aucune Ombre de la Dérive dispersée **par le géant** (les alliés peuvent s'interposer, ou attirer le géant en agissant près de lui). [confiance.merlin +1 ; et la scène de Q05 gagne une réplique de Merlin : « Vous vous êtes mis entre lui et les nôtres. Je n'ai pas de colonne pour ça. »]
  - ◆ **Le Ghom ne touche pas la Dérive** : aucune Influence sur une case de l'est de la carte (colonnes 7 à 10) ni sur un Écho de la Dérive. [confiance.nyx +1, confiance.merlin +1]

- **Événements scriptés :**
  - **Première Intrication alliée près d'un cristal :** le cristal le plus proche brille et se déplace d'une case vers le cœur (animation). Réplique de Néréa.
  - **Tour 4 :** le géant frappe un Écho de la Dérive (scripté s'il n'en a pas déjà eu l'occasion). **Merlin** : « Il ne fait pas de différence, lui. »
  - **Le géant quitte le cœur** (enfoncé ou repoussé) : le gris du cœur s'éclaircit d'un cran. Info-bulle : *Le cœur est libre. Deux Échos intriqués peuvent l'habiter.*
  - **Nyx accepte l'Intrication** : la lumière pulsée de l'Intrication est **plus sombre**, presque violette. Tous les cristaux de la carte battent en même temps, une fois.
  - **Midi :** tous les cristaux de la carte glissent vers le cœur (ou vers la rive ouest, issue C) et se fondent en un seul : le **Premier Cristal**. Fin du combat.

- **Répliques de combat :**
  - Début — **Brutus** : « Derrière moi. » — **Lyra** : « Non, à côté de toi. On a dit : à deux. »
  - Le géant frappe une Ombre — **Brutus** : « … Il a froid pareil, le leur. »
  - Une Ombre se disperse — **Merlin** : *(longtemps, puis)* « Note : Ombre de la Dérive, dispersée à la cinquième heure. » *Sa voix casse sur « dispersée ».*
  - Réparation sur le cœur — **Lyra** : « La vapeur, là-bas, sur la Dérive. » — **Merlin** : « Votre Ghom chauffe chez nous pour réparer chez vous. Charmant. »
  - Midi — **Merlin** : « Midi. » *(il regarde le cœur)* « Bon. Voyons qui a raison. »

## Choix et conséquences

| Choix ou objectif | Drapeaux | Effet plus tard |
| --- | --- | --- |
| Lire l'Archive du Lac Sourd | `archive_derive = lue`, `archives.lues` +1, `usure` +1, `ghom_dechu.verite` +1 | Prépare le ch. 11 (les strates) : le joueur y reconnaîtra les plis qui s'arrêtent. Néréa II connaît « la carotte de la première ». |
| Issue A — Habitée | `lacunes.habitees` +1, `lacune_geante_habitee` = vrai, `fragments = fusion` | La **Couture** : une clairière floue où l'on vit à deux. Elle devient le premier lieu habité d'une Lacune, origine lointaine des villages des Lacunes de l'ère IV. La Chronique de l'ère II raconte « la Fusion ». |
| Issue B — Recousue | `lacunes.recousues` +1, `fragments = fusion` | Les îles soudées par une bande de roche neuve. Chronique de l'ère II : « la Fusion », mais racontée comme une victoire de l'Ordre. |
| Issue C — Élargie | `lacunes.elargies` +1, `fragments = separation` | La **Déchirure**. Les îles se séparent ; la Dérive repart dans le Clair, avec Nyx si elle est restée dans le gris. Chronique de l'ère II : « la Séparation ». |
| ◆ Habiter avec Nyx | `intrication_nyx` = vrai, `confiance.nyx` +2, `premier_cristal.paire = heros+nyx` | En ère III, le Premier Cristal extrait de la Mine garde la corrélation héros-Nyx (Merlin III ne sait pas ce qu'elle signifie). En ère IV, Nyx IV a reçu de sa lignée le récit de « la seule fois » : dialogue unique, et une condition favorable pour l'alliance (ch. 23). |
| Q06 : réponse de Merlin ou de Brutus | `carnet.Q06 = fausse` | Compte contre la fin secrète. La question est reposée à chaque ère, mais une question passée à `fausse` le reste (règle proposée, à confirmer dans `carnet.md`). |
| Q06 laissée blanche | `carnet.Q06 = ouverte` | Condition de la fin secrète. |
| Cristal gardé (cairn) | `cristaux.gardes` +1, `premier_cristal.lieu = cairn` | En ère III, la Mine extrait le Cristal **du cairn** devenu colline (on a construit dessus). |
| Cristal donné (Couture) | `cristaux.donnes` +1, `lacunes.recousues` +1, `premier_cristal.lieu = lacune` | En ère III, la Mine le cherche **sous la Couture**, et la Couture se défait quand on l'extrait (arc A : les Lacunes grandissent là où l'on mine). |
| Transformation | `transformation.I = A` ou `B` ; B : `cristaux.portes` +1 | Le corps du héros en ère II. B prépare la rencontre avec Gorr (ère III) : un organisme minéral reconnaît la peau du héros. |
| Promesse du nom | `nom.promesse = lyra`, `nerea` ou `aucune` | En ère II, Néréa II (ou une Lyra) a « un nom gardé pour lui » ; arc F. Le donner reste soumis à la Confiance de l'héritier. |

## Récompenses

- **Transformation de l'ère I :**
  - **Yeux d'Aube** (A) — *Des iris très clairs, presque dorés, qui ont appris à voir dans le gris d'une Lacune la lumière qui baigne le Clair depuis l'aube du monde.* Effet : vision dans l'obscurité (les cases sombres et les Lacunes ne cachent plus rien), +1 de portée maximale aux actions à distance.
  - **Peau de cristal** (B) — *Des facettes bleu pâle qui ont poussé sur la main, le bras et le cou, au contact du Premier Cristal, et qui battent faiblement par paires.* Effet : +2 défense physique, +1 défense énergétique.
- **Habit : Fil de la Couture** *(issues A et B)* — *Un fil de lin de Lyra, noué au poignet du héros par Lyra et Brutus ensemble, « pour qu'il se souvienne qu'on tient à deux ».* Effet : +1 à tous les effets d'une Intrication (dégâts, soins, portée selon l'affinité) quand le héros est intriqué.
- **Habit : Fil de la Déchirure** *(issue C)* — *Le même fil, mais coupé en deux : Lyra en garde la moitié.* Effet : +1 vitesse quand aucun allié n'est adjacent au héros.
- **Objet (si l'Archive a été lue) : la Carotte du Lac Sourd** — *Un tube de roseau plein de vase, où l'on voit des plis réguliers qui s'arrêtent d'un coup.* Sans effet. Il servira en ère II : Néréa II reconnaîtra la carotte de sa lignée.

## Graines pour la suite

- **Lyra revient s'asseoir au bord** du Puits, puis ne revient plus : une Lyra lointaine peut connaître « le banc de la première ».
- **Merlin I a mesuré le ralentissement du temps du héros** depuis le bord. C'est la mesure fondatrice de sa lignée. Ses carnets (« un battement sur cent, sur dix ») deviennent, en ère III, la preuve que le héros est une « anomalie historique ». Le **Bâton gradué** reste dans la lignée des Thermistes.
- **L'Archive du Lac Sourd** : quelqu'un entretenait la Dérive, puis a cessé ; la vie est revenue seule. Premier indice de l'arc E, et premier élément de la réponse de Q27 (« le monde a-t-il besoin de nous ? »).
- **La silhouette en lentille** : la lentille qui se relâche dans la reconstitution est la même que celle qui accompagne le héros dans le Puits. Le joueur peut faire le lien ; aucun personnage ne le fait.
- **Le Ghom du Chaos n'a jamais utilisé son Élan pendant toute l'ère I.** Sa jauge est restée pleine. L'ère II saura pourquoi.
- **La Couture habitée** (issue A) : le premier lieu où des Échos vivent à deux dans une Lacune (l'ère II peut appeler cette clairière **le Seuil**). Il prépare la troisième voie de l'arc A et, de loin, les Lacunes habitées de l'ère IV.
- **Peau de cristal** : le héros porte un organisme minéral ; Gorr (ère III) le reconnaîtra. **Q06** reviendra à chaque ère, puis par Gorr.
- **Nyx et l'Intrication** : « Une fois. Pour voir. » Graine de son arc (elle choisira ses relations) et de la Paix des Lacunes (ch. 24 : une Intrication entre camps opposés).

## Notes de mise en œuvre

- **Trois camps et neutres :** le moteur permet trois équipes ; l'interface affiche trois couleurs. Le géant cible « l'Écho le plus chaud » (qui a agi le plus récemment), sans distinction de camp. Nyx : non ciblable par le géant, quitte la carte si un allié l'attaque, partage sa case seulement si `confiance.nyx` ≥ 3. Vesce : alliée IA qui n'attaque pas la Dérive.
- **Reconstitution :** mode « Archive » (filtre, Échos anciens génériques, objectifs de fidélité avec échec **par excès**, une reprise), réutilisé et étendu au ch. 11.
- **`premier_cristal.paire` :** compteur d'Intrications par paire d'Échos tenu depuis le ch. 2 (combats de l'ère I) ; la paire la plus fréquente l'emporte, sauf si `intrication_nyx`. Le texte du Cristal (« Vous avez été très liés ») cite la paire.
- **Cristaux mobiles :** les cristaux de décor se déplacent vers le cœur à chaque Intrication proche, puis fusionnent à midi. Les cristaux du décor doivent avoir la pulsation **par paires** du § 14 du plan.
- **Scène du Puits :** une cinématique en vue plongée inversée (depuis le fond vers le ciel). Effets : sons du dessus qui montent dans les aigus et accélèrent ; lumière qui bleuit ; alternance jour-nuit qui accélère jusqu'au gris ; silhouettes qui reviennent au bord (Lyra), un cairn qui grandit. Ces effets sont physiquement justes : vu du fond d'un puits de gravité très profond, le monde extérieur paraît accéléré et sa lumière plus bleue. Aucun texte ne le dit en termes techniques.
- **Transformation :** le créateur de personnage applique la transformation (iris ou facettes) à l'écran de fin d'ère, sur le reflet de l'eau au fond du Puits (une flaque), en écho au prologue.
