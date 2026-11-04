# Chapitre 14 — Le Chroniqueur

> « Le Bureau ne retient pas ce nom, qui varie selon les sources et n'est donc pas une donnée. »
> — *Rapport n° 312-0417, § 2.4. Dans la marge, d'une écriture serrée et récente : « Une donnée qui varie reste une donnée. Elle dit quelque chose des sources. — C. »*

## Fiche

| | |
| --- | --- |
| Ère | III — L'Âge du Verre |
| Lieu | Vitrelle : la descente des liasses (des Citernes à la Tour), la Salle des Archives au sommet de la Tour du Registre |
| Équipe | Le héros, Lyra III, Eva III ou Squalor III. **Le Chroniqueur** rejoint si `chroniqueur_rejoint`. |
| Durée visée | 6 nœuds, 1 combat, 1 Archive optionnelle (reconstitution jouable) |
| Question au Carnet | **Q14** — *L'Histoire est-elle ce qui s'est passé, ou ce qu'on en a gardé ?* |

## Ce que le joueur sait en arrivant

- Le héros a fui la Garde par les Citernes avec Lyra III et Eva III (ou Squalor III).
- Le Collège a écrit sur lui un rapport qui le classe comme « anomalie ». Lyra a parlé d'un rédacteur, à la Tour du Registre, « qui se corrige même en parlant ».
- Le Carnet est recherché. Selon `questions_rouvertes`, la Basse-Ville a vu des gens debout à leur fenêtre la nuit.
- Questions concernées : **Q07** (*Suis-je celui de la légende ?*, ère II) trouve sa réponse ici.

## Synopsis

Par le conduit où l'on jetait autrefois les vieux papiers, l'équipe remonte jusqu'à la Salle des Archives. Le Chroniqueur, onzième du nom, les surprend, et au lieu de donner l'alerte il veut **compléter le dossier** : il interroge l'anomalie. Ses sources sont des légendes déformées, et son propre rapport est faux sur plusieurs points. Le héros peut lui faire **confronter ses textes aux traces physiques** : les strates rapportées des anciens abysses, les défauts d'un Cristal d'archive, les vieux relevés du Gel. Pendant ce temps, le Collège a ordonné de « valoriser » les fonds non conformes : la Garde vient extraire les Cristaux d'archive pour alimenter le Gel. Il faut protéger les archives. Si le Chroniqueur a vu les traces, il change de camp.

## Carte du chapitre

```
[1 Rencontre : la descente des liasses]
        │
[2 Rencontre : l'interrogatoire]  → Q07 trouve sa réponse
        │
        ├──► [3 Archive (optionnelle) : le Premier Gel]  → reconstitution ; Usure +1
        │
[4 Rencontre : la confrontation]  → 2 traces sur 3 : le Chroniqueur bascule
        │
[5 Combat (fin de chapitre) : les fonds non conformes]
        │
[6 Veillée : la page révisée]  → Q14 répondue ; le Chroniqueur rejoint (ou non)
```

## Scènes

### 1. La descente des liasses (Rencontre)

*Un conduit de verre dépoli, presque vertical, qui monte des Citernes jusqu'au sommet de la Tour. Autrefois, on y jetait les papiers « sans objet ». Il en reste au fond, en couches, gonflés d'eau immobile.*

- **Squalor III** — « Un tuyau qui sent le papier mouillé et la peur des chefs. Je passe devant. »
- **Eva III** — « Quarante-deux mètres, pente de quatre-vingt-un degrés. Si quelqu'un glisse, il arrive en bas en trois secondes. J'ai vérifié deux fois. »

*Le héros peut ramasser une liasse au fond (option, sans effet de jeu) : c'est une page de Registre de l'an 40 du Gel. Une ligne y est barrée : « Les Lacunes de l'Est progressent depuis l'ouverture du puits de mine n° 3. » Au-dessus, d'une autre encre : « Sans objet. »*

> **Extrait des archives — Registre, an 40 du Gel, page jetée.**
> « Sans objet. »

**Lyra III** — « Ils ont jeté ça. Ils l'ont écrit, et puis ils l'ont jeté. » [graine du ch. 17]

### 2. L'interrogatoire (Rencontre)

*La Salle des Archives : des rayonnages de verre jusqu'au plafond, des liasses, des carottes de sédiments couchées dans des gouttières de cuivre, et des étagères de Cristaux d'intrication, petits, chacun étiqueté. Au centre, une estrade et un bureau couvert de papiers. Un homme long et voûté, des lunettes de lecture remontées sur le front, une plume dans chaque main, lève les yeux.*

**Le Chroniqueur** — « Ah. Vous êtes… Non. Si. Vous êtes l'anomalie 0-PUITS-1. Je vous reconnais d'après mon propre signalement, ce qui est, je dois l'admettre, une première. » *Il ne touche pas au cordon d'alarme.* « Asseyez-vous. Non, ne vous asseyez pas, ce siège est classé. Restez debout. Puisque vous êtes là, autant compléter le dossier. »

**Lyra III** — « Il ne va pas appeler la Garde ? »
**Le Chroniqueur** — « Plus tard. Un dossier incomplet est une faute. Une évasion est un incident. La hiérarchie des urgences est claire, article quatorze. Ou quinze. Quatorze. »

*Il lit ses sources à voix haute, une à une, en se corrigeant.*

**Le Chroniqueur** — « Source un : le chant des pilotis, recueilli en l'an 140 auprès des dernières ondines. » *Il lit, selon `fragments` :* « "Quand les deux terres se touchèrent, le Dormeur les regarda, et sous son regard elles devinrent une seule terre." » *(ou : « … et sous son regard elles se reconnurent étrangères. »)* *Il lève les yeux.* « Votre regard a-t-il uni (séparé) deux terres ? »

1. « Un regard ne fixe rien. Elles se sont touchées. » → **Le Chroniqueur** — « Touchées. Pas regardées. » *Il note.* « C'est moins beau. C'est sans doute plus exact. Nos propres instruments touchent ce qu'ils mesurent ; je ne vois pas pourquoi des yeux feraient mieux. » [confiance.chroniqueur +1]
2. « Je ne m'en souviens pas comme ça. » → **Le Chroniqueur** — « Personne ne se souvient de rien comme ça. C'est bien le problème des souvenirs. »
3. « Peut-être. » → **Le Chroniqueur** — « "Peut-être" n'est pas une réponse recevable. » *Il hésite.* « Mais je vais le noter. »

**Le Chroniqueur** — « Source deux. » *Selon `journal_nerea` :*
- **`garde` :** « Le journal d'une ondine, Néréa dite des Strates. Une copie de copie, folio douze. Non, treize. "Le Dormeur sortit de la Pierre Lente, et la mer s'ouvrit devant lui." La mer s'est-elle ouverte devant vous ? » → *Le héros peut répondre :* « Non. J'ai fui une Marée, avec elle. » **Le Chroniqueur** — « Fui. Pas ouvert. Je vois comment on passe de l'un à l'autre en quatre siècles de recopie. »
- **`porte` :** « Le journal d'une ondine, Néréa dite des Strates. Original perdu. Nous n'en avons que des citations, dans d'autres textes. » *Le héros sort le journal de son sac. Le Chroniqueur ne dit rien pendant longtemps.* « … L'original. Vous l'aviez sur vous. Dans le Puits. Pendant quatre siècles. » *Il n'ose pas le toucher.* « Il a voyagé moins de temps que tout ce qu'il y a dans cette salle. »

**Le Chroniqueur** — « Source trois : une tradition de la Basse-Ville. "Il choisit l'île, il laissa les autres." » *Selon `ile_sauvee`, il nomme l'île (Sauge, Lusse, les Strates ; si `aucune` : « Une variante dit qu'il les a toutes laissées. »).* « Avez-vous choisi ? »

1. « Oui. Et je ne sais pas si j'ai bien choisi. » → **Le Chroniqueur** — *Il écrit longtemps.* « Aucune de mes sources ne dit que vous avez douté. Elles disent toutes que vous avez su. » [confiance.chroniqueur +1]
2. « Il fallait bien choisir. » → **Le Chroniqueur** — « C'est ce que dit la chanson. Elle a donc au moins un point exact. »

**Le Chroniqueur** — « Source quatre. » *Il tourne une page, s'arrête.* « Source quatre, c'est moi. Mon rapport. » *Silence.* « Paragraphe 1.2 : "L'anomalie a déplacé la main d'un doigt en deux siècles. Mouvement non significatif." » *Il regarde la main du héros.* « C'est vous qui l'avez bougée, ou c'est le Puits qui vous a… Non. Ne répondez pas. Je ne sais pas encore quelle question je pose. »

**Q07 trouve sa réponse.** *Le héros comprend : la légende parle de lui, mais transformée par chaque main qui l'a recopiée.* [`carnet.Q07` = `repondue`]
- Si `carnet.Q07` était `ouverte`, ligne du héros, au choix :
  1. « La légende, c'est moi. Plus tous ceux qui l'ont racontée. » [confiance.chroniqueur +1]
  2. « La légende n'est pas moi. » *(Juste aussi : le Carnet l'accepte. L'état reste `repondue`.)*

### 3. Le Premier Gel (Archive, optionnelle)

*Sur une étagère, un Cristal d'archive plus gros que les autres, terne, strié de bandes. Étiquette : « Fonds ancien — Cristal de croissance, an 0 du Gel. Non conforme. »*

**Le Chroniqueur** — « Ce cristal a poussé dans une grotte marine pendant des siècles. Chaque saison laisse une bande, comme les cernes d'un arbre. Les contraintes, la chaleur, le froid laissent des défauts, et les défauts ne mentent pas : ils n'ont pas d'opinion. » *Il hésite.* « Le Bureau l'a classé non conforme parce que ses bandes ne disent pas la même chose que le Registre. Je ne l'ai jamais lu. Personne ne m'a demandé de le lire. »

**Lyra III** — « Lire ça, c'est rester longtemps près d'un cristal instable. Ça use. »

1. « Lisons-le. » → reconstitution jouable ci-dessous. [`archives.lues +1`, `usure +1`]
2. « Pas maintenant. » → on passe au nœud 4, sans cette trace.

**La reconstitution.** *Les bandes du cristal racontent une dernière saison de grandes vagues de chaleur et de froid, puis un arrêt brutal : le froid tombe d'un coup, la croissance cesse. Le Chroniqueur et le héros reconstituent ce que les traces permettent de déduire.* Elle se joue comme un combat (voir **Combat A**).

> **Extrait des archives — Registre officiel, an 0 du Gel.**
> « Le Gel fut décidé dans la sérénité, au terme de longues délibérations, par un Collège unanime. »

*Ce que montrent les traces : une Marée qui frappe la côte, des gens qui courent, un Collège de dix personnes qui allument le Gel en catastrophe, en brisant tous les Cristaux qu'ils ont sous la main. Personne n'a délibéré. Ils ont sauvé tout le monde, en une nuit, dans la panique.*

### 4. La confrontation (Rencontre)

*Le Chroniqueur à son bureau, son rapport d'un côté, les traces de l'autre.*

Le héros peut lui présenter des **traces physiques**. Chacune est une option ; il en faut **deux** pour qu'il bascule. (Selon les ères passées, le joueur en a entre une et cinq : les strates et les annales dépendent de `ile_sauvee`, le journal de `journal_nerea`, Tobin du ch. 13, le Premier Gel de l'Archive.)

1. **Les strates** (sauf si `ile_sauvee` = `aucune` : il ne reste aucune carotte, l'option est grisée). *Une carotte de sédiments, rapportée jadis des Abysses par une lignée d'ondines, couchée dans sa gouttière de cuivre.* **Le Chroniqueur** — « Une couche par an. Ici, les Marées : du sable grossier, chaotique. Ici, le Gel : plus rien, une vase si fine qu'on dirait du verre. Et ici… » *Il compte.* « Vingt couches après le Gel, des cendres de cristal. Partout. Ça ne vient pas de la mer. Ça vient des mines. » [trace 1]
2. **Le Premier Gel** (si l'Archive du nœud 3 a été lue). **Le Chroniqueur** — « "Dans la sérénité." » *Il pose le doigt sur la phrase.* « J'ai recopié cette phrase quatre fois dans ma carrière. Je l'ai même améliorée. » [trace 2]
3. **Les relevés de Tobin** (si sa question a été rouverte au ch. 13). *Tobin est là, dans un coin, en chemise de nuit, ses vieux cahiers sur les genoux.* **Tobin** — « Au début, l'aiguille bougeait. Tous les jours. Un peu. Et puis de moins en moins. Elle ne s'est pas arrêtée parce que le Gel est parfait. Elle s'est arrêtée parce qu'il n'y a plus rien à mesurer qui bouge. » [trace 3]
4. **Les annales des Ondines** (si `ile_sauvee` = `strates`). *Les ardoises et les colonnes de vase sauvées de la Grande Marée, rangées au fonds de la Marée, que personne n'a lues depuis le Gel.* **Le Chroniqueur** — « Quatre siècles d'annales, tenues par des gens qui ne savaient pas que le Collège existerait. Ils n'avaient aucune raison de lui donner raison. » [trace 4]
5. **Le journal original** (si `journal_nerea` = `porte`). *Le héros pose l'original à côté de la copie du Collège.* **Le Chroniqueur** — « "La mer s'ouvrit devant lui", dit la copie. "Nous avons fui la Marée, et il courait moins vite que moi", dit l'original. » *Il rit malgré lui.* « Quatre siècles pour transformer une course en miracle. » [trace 5]
6. **Le héros lui-même** (option de parole, ne compte pas comme trace). « Ton rapport dit que je suis une légende. Je suis là. » → **Le Chroniqueur** — « Vous êtes là. Ça prouve que vous existez. Ça ne prouve pas que les légendes sont vraies. » *Un temps.* « Pardon. Déformation professionnelle. Mais c'est exact. »

**Avec deux traces ou plus :**

**Le Chroniqueur** — « Bon. » *Il enlève ses lunettes, les remet.* « Bon. Le Registre dit ce qu'on a voulu garder. Les strates disent ce qui s'est déposé. Ce n'est pas la même chose. Je le savais, bien sûr. Tout rédacteur le sait. Mais je croyais que l'écart était petit. » *Il regarde son rapport.* « Paragraphe 4.1 : "L'anomalie n'a pas d'état connu, donc c'est un danger." » *Il le barre.* « Non. Elle n'a pas d'état **dans mon registre**. C'est mon registre qui est incomplet, pas elle. »

**Q14 entre au Carnet :** *L'Histoire est-elle ce qui s'est passé, ou ce qu'on en a gardé ?* [`carnet.Q14` = `ouverte`, puis `repondue` en veillée si le Chroniqueur a basculé]

**Avec une seule trace :**
**Le Chroniqueur** — « C'est troublant. C'est… une anomalie de plus. Je vais l'inscrire. » *Il l'inscrit. Il ne bascule pas.* Q14 entre au Carnet, `ouverte`.

### 6. La page révisée (Veillée)

*Après le combat, dans la salle dévastée ou intacte. Le Chroniqueur ramasse des feuilles.*

**Si `chroniqueur_rejoint` :**

**Le Chroniqueur** — « Je vais réécrire le rapport. Non. Je vais écrire un second rapport, et laisser le premier à côté. Qu'on voie l'écart. Si on efface le premier, on refait exactement la même faute. »

**Lyra III** — « Tu vas te faire réévaluer. »
**Le Chroniqueur** — « Je vais me faire réaffecter aux Mines, plus exactement. "Réévaluer" est un euphémisme. Je les connais tous, j'en ai inventé trois. »

**Eva III** — « Probabilité qu'il nous ralentisse : soixante pour cent. Probabilité qu'il nous soit utile : soixante pour cent aussi. Ça s'additionne mal, mais j'aime bien ce genre de problème. »
**Squalor III** — « Il parle beaucoup. Mais au moins, il a faim de quelque chose. »

*Choix du héros (réponse de Q14) :*
1. « L'Histoire, c'est ce qu'on en a gardé. C'est pour ça qu'il faut la comparer aux traces. » [`carnet.Q14` = `repondue`] [confiance.chroniqueur +1]
2. « L'Histoire, c'est ce qui s'est passé. Le reste, ce sont des mensonges. » → **Le Chroniqueur** — « Non. Ce qui s'est passé, personne ne l'a. On a des traces, et des récits. Les récits mentent parfois. Les traces ne mentent pas, mais elles ne parlent pas non plus : il faut quelqu'un pour les lire. » [`carnet.Q14` = `repondue` quand même : la réplique corrige, elle ne valide pas]

**Le Chroniqueur rejoint l'équipe.**

**Sinon :** *Le Chroniqueur reste à son bureau.* « Partez. Je n'ai rien vu. Ce n'est pas exact : j'ai tout vu. Mais je ne l'écrirai pas. » `carnet.Q14` reste `ouverte` (elle pourra trouver sa réponse au ch. 18, dans la Chronique interrompue).

> **Extrait des archives — Rapport n° 312-0417 bis (si `chroniqueur_rejoint`).**
> « 1. Constat. L'anomalie est une personne. 2. Antécédents. Toutes mes sources la déforment, la mienne comprise. 3. Mesure recommandée : la confronter, elle aussi, aux traces. Elle ne s'en offusque pas. — Le Chroniqueur (11e), rédacteur sans rang. »

## Combats

### Combat A — Le Premier Gel (Archive, reconstitution)

**Carte :** une côte basse de l'archipel, trois siècles plus tôt, battue par une Marée. Au centre, la plateforme du Gel : une machine de cuivre entourée de six Cristaux d'intrication. L'eau monte à l'est.

```
..1..~~wwW
..1..~~wwW
.111.~~wwW
..1...~wwW
..1...~wwW
.111.~~wwW
..1..~~wwW
```

**Équipes :** le héros (dans le rôle d'un passant), Lyra III et Eva III/Squalor III dans les rôles de « sauveteurs » ; les membres du Collège (6 PNJ neutres, contrôlés par le jeu) qui vont briser les Cristaux un par un ; la Marée : des vagues de matière instable (3 vagues, comme l'Arcade) qui entrent par l'est.

**Objectifs :**
- **Principal :** survivre jusqu'au temps 50 (le Gel prend).
- **★ Ne pas réécrire :** les traces montrent que **les six Cristaux ont été brisés** et que **personne du Collège n'est tombé**. Le joueur doit protéger le Collège pendant qu'il brise les Cristaux. Empêcher une extraction (se placer devant, frapper un membre du Collège) contredit les traces : la reconstitution **se brise** (fin immédiate, l'Archive ne compte pas comme trace).
- **Défaite :** un membre du Collège se disperse (la reconstitution se brise de même).

**Événements scriptés :** à chaque Cristal brisé, la mer **ralentit** (les vagues avancent moins vite, les cases d'eau prennent une teinte de givre). Au sixième, l'image se fige, puis se décolore.

**Répliques :**
- **Membre du Collège** (PNJ) — « Brisez-les tous ! Tous ! On comptera après ! »
- **La Maîtresse du Collège** (PNJ, une Thermiste de la lignée de Tessa) — « Tessa disait qu'une Marée, ça se fige. Elle n'a jamais dit combien ça coûtait. Plus vite ! »
- **Lyra III** (au troisième Cristal) — « Ils ne délibèrent pas. Ils ont peur. Ils ont raison d'avoir peur. »
- **Le Chroniqueur** (voix off, à la fin) — « Sereine, cette nuit. Unanime. J'ai écrit ça. »

*Note : c'est la leçon de Q11 (accepter un passé qu'on ne peut pas changer) appliquée à l'histoire officielle : il faut laisser se briser des Cristaux qu'on voudrait sauver, parce que c'est ce qui s'est passé.*

### Combat B — Les fonds non conformes (fin de chapitre)

> **Extrait des archives — Ordre de service n° 312-0419.**
> « Les fonds non conformes de la Salle des Archives seront valorisés sans délai au profit du Gel. La Garde procédera. »
> *(Dans la marge, si `chroniqueur_rejoint` : « Valorisés : brisés. — C. »)*

**Carte :** la Salle des Archives. Rayonnages infranchissables (`#` aux coins, `##` dans les allées), une estrade centrale (`1`) avec le bureau du Chroniqueur. Deux portes, au nord et au sud. Six Cristaux d'archive sur les rayonnages, en trois paires.

```
#..#....#..#
.....11.....
.##..11..##.
.....11.....
.##......##.
.....11.....
.##..11..##.
.....11.....
#..#....#..#
```

Surcouche (`H` héros, `L` Lyra III, `E` Eva III ou Squalor III, `C` le Chroniqueur, `*` Cristal d'archive, `G` Hallebardier, `X` Extracteur, `A` Arbalétrier) :

```
#..#.GX.#..#
.*.......*..
.##..C...##.
.*...H...L*.
.##......##.
..*.....*...
.##..E...##.
............
#..#.XA.#..#
```

- Paires : (1,1) et (10,3) ; (9,1) et (2,5) ; (1,3) et (8,5). Briser un Cristal d'archive en éteint un second : chaque extraction coûte **deux** pièces du fonds.

**Équipes :**
- **Alliés :** le héros, Lyra III, Eva III ou Squalor III ; **le Chroniqueur** s'il a basculé (sinon, il est un **PNJ neutre à protéger** sur l'estrade : s'il se disperse, c'est une défaite).
- **Ennemis :** 1 Hallebardier, 2 Extracteurs, 1 Arbalétrier au départ. **Temps 30 :** 2 Hallebardiers par le nord. **Temps 50 :** 1 Extracteur et 1 Sonneur par le sud.

**Objectifs :**
- **Principal :** tenir jusqu'au temps 80, ou mettre toute la Garde hors de combat.
- **★ Annoncé :** à la fin, **au moins quatre Cristaux d'archive** sont intacts (deux paires). Sinon, les traces de la Salle sont perdues et la Chronique de l'ère IV en portera les trous.
- **◆ Caché :** les six Cristaux sont intacts. [confiance.chroniqueur +1 ; le Chroniqueur offre son habit, voir Récompenses]
- **◆ Caché :** n'extraire aucun Cristal soi-même. [confiance.lyra +1]
- **Défaite :** le héros se disperse ; ou le Chroniqueur (neutre) se disperse.

**Événements scriptés :**
- **Temps 0 :** les Extracteurs foncent vers le Cristal le plus proche. L'IA des Extracteurs privilégie **les Cristaux**, pas les combattants.
- **Premier Cristal brisé (par n'importe qui) :** une feuille de Registre s'envole de l'étagère, la première chose qui bouge dans l'air de Vitrelle. **Le Chroniqueur** — « Fonds ancien, cote dix-sept. Il n'y en avait qu'un exemplaire. Il n'y en a plus aucun. »
- **Temps 50 :** le Sonneur entre. **Sonneur** — « Ralentissez. Les archives n'ont pas besoin de vous. »

**Répliques de combat :**
- **Le Chroniqueur** (s'il combat, première action) — « Je n'ai jamais frappé personne. J'ai beaucoup raturé. C'est à peu près pareil. »
- **Le Chroniqueur** (s'il est neutre) — « Je… je ne prends pas parti. Je prends des notes. Ne vous approchez pas des notes. »
- **Lyra III** — « Ils cassent les souvenirs de la cité pour la tenir au froid un jour de plus. »
- **Eva III** — « Extracteur à quatre cases, trajectoire vers le Cristal du nord-est. Je l'ai. »
- **Squalor III** — « Celui-là a l'air de vouloir tout manger. Je connais. Je n'aime pas qu'on mange chez moi. »
- **Hallebardier** (se rend) — « Je me rends. Je ne comprends pas pourquoi on se bat pour des cailloux. »

## Choix et conséquences

| Choix ou objectif | Drapeaux | Effet plus tard |
| --- | --- | --- |
| Interrogatoire terminé | `carnet.Q07` = `repondue` | — |
| Lire l'Archive du Premier Gel | `archives.lues +1`, `usure +1` | Trace pour la confrontation ; argument contre Merlin III (ch. 17 : « Votre Gel est né d'une panique, pas d'un calcul »). |
| Reconstitution brisée | — | Pas de trace ; pas d'Usure remboursée. |
| Deux traces présentées | `chroniqueur_rejoint` | Le Chroniqueur rejoint ; les extraits d'archives des ch. 15 à 18 sont annotés de sa main ; argument contre Merlin III ; sa lignée tiendra la plume en ère IV. |
| Une seule trace | `chroniqueur_rejoint` faux | Il reste ; la Chronique se brise au ch. 18 au milieu d'une phrase. |
| Q14 : « ce qu'on en a gardé » ou corrigé | `carnet.Q14` = `repondue` | Argument contre Merlin III. |
| ★ au moins 4 Cristaux d'archive intacts | — (inclus dans `cristaux.extraits` s'ils ont été brisés par l'équipe) | Si raté : la Salle des Archives n'a plus de fonds lisible ; l'Archive optionnelle du ch. 17 est indisponible. |
| ◆ six Cristaux intacts | confiance.chroniqueur +1 | Habit offert. |

## Récompenses

- **Le Chroniqueur** rejoint (si `chroniqueur_rejoint`). Fiche proposée (nouvel Écho, échelle de `content.ts`) :
  - Titre : *Chroniqueur*. Affinité : **Précision**. PV 7, Vitesse 5, Attaque physique 3, Défense physique 4, Attaque énergétique 4, Défense énergétique 5, Chance 6.
  - **Rature** (action signature) : portée 1 à 4, ligne de vue, ennemi : dégâts énergétiques 2, **retarde son prochain tour de 20**. *« Il perd le fil. »*
  - **Lecture à voix haute** : soi, zone de rayon 1 à 2, alliés : **Surexcité 1 tour**. Recharge 3. *« Le récit accélère. »*
  - **Coup de reliure** : corps à corps, dégâts physiques 5.
  - Coup de pied, Course.
- **Habit : Bésicles de rédacteur** (◆ six Cristaux intacts). *Deux verres ronds, rayés à force d'avoir lu de travers.* Effet : **la prochaine Archive** de l'Aventure ne coûte pas d'Usure.
- **Habit : Brassard du Registre** (toujours). *Un brassard de commis, arraché à un rayonnage, où l'on a gratté le numéro.* Effet : **+1 Défense énergétique**.

## Graines pour la suite

- **Arc D :** les traces valent mieux que les récits ; mais il faut quelqu'un pour les lire. L'équipe a désormais un lecteur.
- **Arc A :** la page jetée de l'an 40 (« Les Lacunes progressent depuis l'ouverture du puits de mine n° 3 ») et les cendres de cristal dans les strates préparent la révélation du ch. 17.
- **Le gisement n° 1 :** en rangeant, le Chroniqueur tombe sur une fiche d'inventaire des Mines : « Gisement n° 1. Rendement exceptionnel. Aucun jumeau connu. Pulse sans cause identifiée. Extraction programmée. » C'est le Premier Cristal (ch. 15). Si `transformation.I` = `B`, le héros sent sa peau de cristal se serrer en lisant la fiche.
- **Ère IV :** si `chroniqueur_rejoint`, la lignée du Chroniqueur sait que toute Chronique est partiale. **À coordonner :** la bible dit que le Chroniqueur écrit aussi la Chronique de l'ère IV, alors que le plan la confie au manifeste de Nyx IV (voir le rapport).

## Notes de mise en œuvre

- **Reconstitution (Combat A) :** PNJ neutres scriptés qui exécutent « Extraire » à intervalles fixes ; condition d'échec « ne pas réécrire » : le joueur bloque physiquement une extraction (une unité alliée sur la case adjacente devant laquelle passe le PNJ au moment de son action), ou attaque un PNJ du Collège.
- **IA des Extracteurs :** cible prioritaire = Cristal le plus proche ; s'ils sont bloqués, ils frappent.
- **Paires de Cristaux d'archive :** un survol montre le fil de lumière entre les deux jumeaux ; l'infobulle d'extraction indique que **deux** pièces du fonds seront perdues.
- **Confrontation :** la scène compte les traces présentées ; le seuil est 2. Les options grisées (Archive non lue, Tobin absent) restent **visibles et grisées**, avec une ligne : « Une trace que vous n'avez pas. »
- **Le Chroniqueur neutre :** entité à protéger sur l'estrade ; il ne se déplace pas, ne combat pas.
