# Ère III — L'Âge du Verre

> « Les questions ne sont pas interdites à Vitrelle. Elles y sont inutiles, ce qui revient au même pour la sécurité publique. »
> — *Règlement du Collège, article premier, commentaire.*

## Fiche de l'ère

| | |
| --- | --- |
| Chapitres | 13 à 18 |
| Question de l'ère | *Peut-on consommer ce qui nous relie ?* (réponse de l'ère : on peut, et on s'y défait) |
| Narrateur | **Les archives du Collège de Vitrelle**, dit « l'ordre de Merlin » : rapports, procès-verbaux, fiches de classement, notes marginales. Style administratif, exact, inquiétant. Chaque chapitre s'ouvre et se ponctue d'extraits d'archives. |
| Décor | **Vitrelle**, la cité de verre : tours transparentes, rues sans poussière, ciel net, presque trop. Aucun vent. **Les Citernes** sous la ville, aux eaux immobiles. **Les Mines du Collège**, au flanc du Fragment. **La Salle des Archives**, dans la Tour du Registre. **La Salle du Puits**, au plus bas de la cité. |
| Mécanique nouvelle | **L'extraction** des Cristaux d'intrication (voir ci-dessous). |
| Équipe | Le héros ; **Lyra III** (ch. 13) ; **Eva III** ou **Squalor III** selon l'ère II (ch. 13) ; **le Chroniqueur** (ch. 14, si convaincu) ; **Gorr** (ch. 16). **Merlin III** peut se joindre pour le ch. 18 s'il est convaincu. |
| Adversaires | La **Garde de verre** et son capitaine **Brutus III** ; **Merlin III**, Maître du Verre ; Gorr (ch. 16). Aucun Lacunaire : à Vitrelle, plus rien n'est assez libre pour rester en superposition, sauf au fond des Lacunes neuves. |

## Ce qui s'est passé pendant le Puits (pour les rédacteurs)

Ce que le joueur ne lira jamais d'un bloc, mais qu'il **déduira** au fil de l'ère :

1. Après la Grande Marée (ch. 12, **an 417** de la Fusion ou de la Séparation), les Marées ont continué de monter pendant un siècle.
2. Au nord, dans les îles sèches, les **Thermistes** (la lignée de Merlin, passée à l'Ordre depuis longtemps, et celle de Tessa, la thermiste du ch. 12) ont accueilli les **Soigneuses** et les **Gardiens** partis du sud à l'ère II. Ensemble, ils ont fondé le **Collège** autour d'une idée de Tessa : « Une Marée, ça se fige. » Si Lusse n'a pas été sauvée (`ile_sauvee` ≠ `lusse`), leurs premières extractions ont eu lieu sur le récif mort de Lusse.
3. En **l'an 521**, une nuit de Marée, le Collège a allumé **le Gel** : de grandes machines refroidissent les bords de l'Archipel et amortissent les fluctuations. Les Marées se sont calmées. Une partie de l'eau, prise en glace aux bords froids, s'est retirée des terres basses : la fosse de **la Pierre Lente** (le Puits du héros) s'est retrouvée à sec, et le Collège a bâti **Vitrelle** autour d'elle, sur l'ancien site de Sauge. Une masse si dense que les horloges y retardent : pour des savants, c'était un étalon, et une curiosité.
4. Le Gel coûte une énergie immense. Le Collège l'a trouvée dans les **Cristaux d'intrication** : on les brise, et l'on récupère ce qu'ils contenaient. C'est l'**extraction**.
5. Trois siècles plus tard (on est en **l'an 312 du Gel**, soit l'an 833 de la Fusion ou de la Séparation), l'Archipel est stable. Mais les Cristaux se raréfient, les liens aussi, et les Lacunes grandissent partout où l'on a miné, et partout où le Gel a tout immobilisé. Le Collège le sait **à moitié** : ses mesures sont exactes, son interprétation est fausse.
6. Les habitants de Vitrelle vivent séparés par des parois transparentes : ils se voient, se croisent, ne se touchent presque plus. Rien de nouveau n'arrive. On a cessé de demander.
7. Le héros dort dans la Pierre Lente, sous la cité. Vu de dehors, le temps propre y est si lent qu'il paraît immobile, rougi, presque éteint : le Collège l'a catalogué il y a deux siècles comme une **anomalie** (les archives disent « le Puits » ; les vieux de la Basse-Ville disent encore « la Pierre Lente »). Il vient de bouger.

**Le Premier Cristal entre l'ère I et l'ère III.** Il n'a jamais quitté la Lisière, où s'ouvre aussi la Pierre Lente. Selon `premier_cristal.lieu` (ch. 6) :
- **`cairn`** : gardé sous un cairn de la Couture (ou de la rive). Les siècles ont couvert le cairn de terre et de vase ; pendant l'ère II, c'était une butte noyée que personne ne remarquait. Quand les eaux ont baissé, le Collège a bâti à côté sans le savoir, puis ses mineurs ont percé la butte : **premier gisement ouvert** par le Collège, d'où la cote « gisement n° 1 ».
- **`lacune`** : enfoncé au cœur de la Couture, il « tenait le fil » de la Lacune recousue. Le Collège l'a trouvé en sondant sous la Couture, parce qu'il pulsait. Le dégager de sa roche a commencé à défaire la Couture : la première Lacune de la Mine est née là (arc A).

Dans les deux cas, sa pulsation d'une régularité parfaite en a fait l'**étalon** du Diapason, et la mine s'est creusée autour de lui. Il garde les corrélations de la paire `premier_cristal.paire` (par exemple `heros+lyra`, ou `heros+nyx` si `intrication_nyx`) : le Collège les mesure sans savoir à qui elles appartiennent. Si `transformation.I` = `B`, le héros porte dans sa peau un **éclat** de ce Cristal : les deux pulsent ensemble.

> **Règle de vraisemblance.** Le Gel n'arrête pas les Marées par magie : il **refroidit**, donc il réduit l'agitation et les échanges. C'est aussi, exactement, ce qui fait naître les Lacunes (moins d'interactions, Tissu qui s'effiloche). La « solution » du Collège et le mal qu'elle cause sont **le même phénomène**. Les personnages peuvent ne pas le voir ; le récit, lui, ne le contredit jamais.

## La mécanique : l'extraction

### Les Cristaux sur la carte

- Les cartes de l'ère portent des **Cristaux d'intrication** (entités neutres, une case chacune, non traversables). Ils vont **par paires** : deux cristaux corrélés scintillent ensemble, et un fil de lumière ténu les relie quand on survole l'un d'eux.
- Certains sont pris dans les murs (« veines »), d'autres sont libres (« géodes »), d'autres encore servent de lampes dans les rues de Vitrelle.

### L'action « Extraire »

Commune à tous les combattants de l'ère, alliés comme ennemis.

| | |
| --- | --- |
| Portée | Un Cristal adjacent (ligne, 1 case). |
| Coût en temps | 0,6 |
| Gain, au choix du joueur | **Élan +2** pour le Ghom (sans dépasser le maximum), **ou** **soin de 6 PV** à tous les alliés à 2 cases ou moins du Cristal. |
| Prix | Le Cristal se brise. **Son jumeau s'éteint aussi** (il devient du « verre mort », un obstacle sans lueur) : on a consommé la corrélation qui les liait. Une **Lacune** s'ouvre sur la case du Cristal brisé (rayon 0), puis **grandit d'un anneau** (rayon 1) au bout de 30 unités de temps de timeline. Elle ne dépasse pas le rayon 1 dans un combat ordinaire, le rayon 2 au ch. 18. |
| Drapeau | `cristaux.extraits +1` à chaque Cristal brisé **par l'équipe du héros**. Les extractions ennemies agrandissent la carte des Lacunes, mais ne comptent pas dans le drapeau. |

### Les cases de Lacune

- Une case de Lacune est **infranchissable** (on ne s'y tient pas, on ne la traverse pas).
- Un combattant qui s'y trouve quand elle se forme **glisse** vers la case libre la plus proche et subit **1 point d'Usure** (PV max −1 pour le combat ; pour le héros, `usure` ne monte qu'à partir de la deuxième fois dans un même chapitre).
- Les Influences du Ghom **ne peuvent pas cibler** une case de Lacune ni un combattant qui la borde : il n'y a rien à quoi se coupler. (C'est la graine de l'arc IV : les révoltés s'y cacheront.)
- **Tentation voulue :** une Lacune bloque aussi les poursuivants. Extraire est souvent la solution facile d'un problème de placement.

### La carte du monde

- La carte du monde de l'ère III est **la carte des Lacunes** du Collège (un objet fil rouge). Chaque extraction de l'équipe y agrandit une tache, à l'endroit du combat.
- Aux seuils de `cristaux.extraits` **3, 6 et 9**, une région entière de l'Archipel passe au gris. Ces régions seront des **Lacunes habitées** en ère IV.

### Ce que le récit en dit

- Extraire n'est **jamais puni par un dialogue moralisateur**. Les Échos réagissent selon leur caractère : Lyra compte le prix, Squalor comprend la faim, Eva calcule, Gorr se tait, le Chroniqueur note.
- Les fins tiennent compte du total (`cristaux.extraits` pèse vers la fin de l'Équilibre).

## Les variantes héritées des ères précédentes

Les ères passées ne sont **jamais racontées**. Elles se lisent dans les détails. Table de référence pour les six chapitres :

| Drapeau | Valeur | Trace dans l'ère III |
| --- | --- | --- |
| `fragments` | `fusion` | Le calendrier ancien compte « de la Fusion ». Vitrelle est bâtie en travers de **la Couture**, la crête où les deux terres se sont soudées : les rues de la Haute-Ville sont pavées de deux roches, l'une verte, l'autre noire, imbriquées. Les archives parlent de « l'événement dit de la Fusion ». |
| `fragments` | `separation` | Le calendrier ancien compte « de la Séparation ». Par temps clair (et à Vitrelle, il fait toujours clair), on voit **la Sœur**, le Fragment noir, très loin dans le Clair. Le Collège a lancé vers elle un **pont de verre** qui s'arrête dans le vide après trois cents pas : le Pont de l'Est (ch. 18). |
| `ile_sauvee` | `sauge` | Vitrelle a englobé Sauge : la **Tour des Marées** est devenue la base de la Tour du Registre. Les premiers relevés de la carte des Lacunes du Collège sont **de la main d'Ilse** (ch. 17). **Eva III**, de la lignée d'Ilse, rejoint au ch. 13. Un héritier d'Aubin vit dans la Basse-Ville (ch. 13, nœud 4e). |
| `ile_sauvee` | `lusse` | Le récif vivant de Lusse a été épargné par la Grande Marée, puis par le Collège (on n'extrait pas un récif vivant : on attend qu'il meure ; il n'est pas mort). Sa lignée de squales nage dans les Citernes, maigre. **Squalor III**, issu de la pouponnière, rejoint au ch. 13. La lignée d'Ilse est partie au nord : Eva III, si elle existe, sert la Garde. |
| `ile_sauvee` | `strates` | Les **annales des Ondines** ont survécu : elles forment le **fonds de la Marée** de la Salle des Archives (carottes de vase, ardoises). Le Chroniqueur dispose de **deux** traces de strates (ch. 14). Eva III **ou** Squalor III rejoint au ch. 13 : la lignée de plus forte Confiance (`confiance.eva` contre `confiance.squalor`, Eva en cas d'égalité). |
| `ile_sauvee` | `aucune` | Rien n'a survécu de l'ère II, sinon des chants. **Ni Eva III ni Squalor III** : l'équipe de l'ère compte un Écho de moins jusqu'au ch. 14. Le Chroniqueur ne dispose d'**aucune** trace de strates : seulement des cristaux (ch. 14). |
| `lacunaire.forme` | `ondine` / `aiguille` / `squale` / `miroir` / `recif` / `brume` | Ses descendants existent : **les Fixés**, une petite lignée « à classer » eux aussi, qui portent la forme de l'ancêtre et disent parfois « nous ». Le Collège les tolère et les mesure. L'un d'eux, **Corin**, est l'un des habitants du ch. 13. Si la forme est `recif`, **Gorr le reconnaît** comme un être de son espèce, ou presque (ch. 18). |
| `journal_nerea` | `porte` | Le héros a **l'original** du journal de Néréa II. Au ch. 14, il peut le poser à côté de la copie du Collège : une trace de plus pour le Chroniqueur. |
| `journal_nerea` | `garde` | Le Collège possède une **copie de copie** du journal, qui a dérivé (« la mer s'ouvrit devant lui »). Le Chroniqueur la cite comme sa première source (ch. 14). |
| (objet) | la clepsydre de Néréa | À la sortie du Puits (ch. 13), elle s'est à peine vidée : quelques heures pour le héros. Le calendrier du Collège, lui, dit quatre siècles. |
| `premier_cristal` | — | Le Premier Cristal (ch. 6) est au fond de la Mine (ch. 15), catalogué « gisement n° 1, rendement exceptionnel ». |
| `transformation.I` | `A` (Yeux d'Aube) | Le héros voit dans le noir des galeries (ch. 15) et distingue la lueur des Cristaux à travers les parois. |
| `transformation.I` | `B` (Peau de cristal) | La peau de cristal du héros **pulse en même temps** que le Premier Cristal quand il s'en approche : ils ont grandi ensemble. La Garde le prend d'abord pour un gisement ambulant. |
| `transformation.II` | `A` (Branchies) | La fuite par les Citernes (ch. 13) passe par l'eau profonde. |
| `transformation.II` | `B` (Écailles de marée) | Le héros résiste au froid du Gel (ch. 17, 18 : les cases gelées ne le ralentissent pas). |
| `ghom_dechu.verite` | ≥ 2 | Au ch. 17, le héros reconnaît dans les plus anciennes Lacunes du Registre la marque d'un Fragment **abandonné**, pas miné. Un argument de plus contre Merlin. |
| `nom` | ≠ `aucun` | Les archives citent le nom du héros **déformé** (une lettre changée, une syllabe en trop), toujours entre guillemets et suivi de « (sic) ». |
| `objet_de_nyx` | vrai | La **Lame à une encoche** de Nyx I. Le Collège l'a inventoriée dans la Salle du Puits comme « artefact non classé, origine : le sujet ». Le héros le récupère au ch. 13 (scène de sortie). |

## Personnages de l'ère

| Personnage | Rôle dans l'ère | Arc dans l'ère |
| --- | --- | --- |
| **Lyra III** | Soigneuse **clandestine**. À Vitrelle, un soin officiel se fait en brisant un Cristal au dispensaire. Elle soigne « à l'ancienne », avec sa propre énergie, ce qui est interdit parce que **non mesuré**. | Voit l'extraction comme une dette qu'on ne rembourse pas. Avance sur Q02 : « Le Collège ne répare rien, il emprunte. » |
| **Eva III** (selon `ile_sauvee` : `sauge`, ou `strates` si la lignée d'Eva l'emporte) | Vigie de la Garde, archère de tour, de la lignée d'Ilse. Elle a calculé toutes les trajectoires possibles de la cité, et plus rien ne l'étonne. | Le héros est la première chose imprévue qu'elle voit en dix ans. Elle déserte par curiosité. Graine de l'ère IV (le hasard qu'elle ne sait pas viser). |
| **Squalor III** (selon `ile_sauvee` : `lusse`, ou `strates` si la lignée de Squalor l'emporte) | Passeur des Citernes, issu de la pouponnière de Lusse. L'eau y est froide et immobile, plus rien n'y nage ; il fait passer de la nourriture d'en bas. | La faim sans proie : il aide le héros parce qu'il « a envie de voir quelque chose bouger ». |
| **Le Chroniqueur** | Rédacteur au Bureau du Classement. C'est lui qui a écrit le rapport sur l'anomalie. Verbeux, se corrige sans cesse, cite ses sources. | Confronte ses textes aux traces (ch. 14) et change de camp. Les Chroniques suivantes changent de ton. |
| **Gorr** | Organisme minéral, « dressé » pour miner par le **Diapason**, une vibration qui lui impose son rythme de croissance. **Muet jusqu'au ch. 16.** | Pose sa première question (ch. 16). Il vit très longtemps : il ne descendra pas dans le Puits, il **attendra** le héros à travers les siècles (ères IV et V). |
| **Brutus III** | Capitaine de la Garde de verre. Il croit qu'une cité immobile est une cité sûre. | Son arc avance sans se résoudre : il voit la Mine s'effondrer (ch. 15), puis la cité se fendre (ch. 18). Selon sa Confiance, il **ouvre les portes** ou les garde fermées. Il ne rejoint pas l'équipe : c'est Brutus IV qui héritera de son doute. |
| **Merlin III** | Maître du Verre, chef du Collège. Thermiste, il a hérité du Gel. Ses mesures sont exactes. Il s'appuie sur **la Toise** : le Bâton gradué de Merlin I (cristal changé, graduations refaites, mais le même bâton). Le Collège garde aussi l'horloge à eau et les carnets de Merlin I. | Croit qu'on peut mesurer le monde sans le toucher. Convertible au ch. 17 (Q17). |

### Voix de l'ère (compléments à la bible)

- **Les archives** : phrases nominales, numéros, articles de règlement, euphémismes (« relevé » pour arrêté, « réévalué » pour puni, « réaffecté » pour exilé dans les Mines). Des **notes marginales** à la main viennent parfois les contredire.
- **Lyra III** : « Ce que je répare ici, je le paie ailleurs. Eux, ils le font payer à ceux qui ne sont pas encore nés. »
- **Brutus III** : « Rien ne bouge. Personne ne meurt. Voilà mon travail. »
- **Merlin III** : longues phrases exactes, ironie fine, horreur de l'approximation : « Je ne crois pas. Je mesure. »

## La Garde de verre (ennemis de l'ère)

Nouveaux ennemis, tous des Échos ordinaires en armure de verre trempé : ils se **dispersent** comme les autres. Statistiques proposées sur l'échelle de `content.ts`.

| Ennemi | Base | Actions | Rôle |
| --- | --- | --- | --- |
| **Hallebardier de verre** | proche de Brutus, PV 10, Vitesse 4 | Coup de hampe (corps à corps, dégâts physiques 6, repousse 1), Course | Ligne de front, bloque les rues. |
| **Arbalétrier de verre** | proche d'Eva, PV 6, Vitesse 5 | Carreau (portée 2 à 5, ligne de vue, dégâts physiques 7), Course | Tient les hauteurs. |
| **Sonneur** | PV 7, Vitesse 5 | Diapason (zone en losange de rayon 1 à portée 3 : Ralenti 1 tour, dégâts énergétiques 2), Course | Porte un diapason de verre. Contrôle Gorr aux ch. 15 et 16. |
| **Extracteur** | PV 7, Vitesse 6 | Pic (corps à corps, dégâts physiques 5), **Extraire** (choisit toujours le soin de son camp), Course | Brise les Cristaux pour soigner la Garde. Priorité tactique : l'arrêter, c'est préserver le Tissu. |
| **Brutus III** (ch. 13, 15, 17, 18) | Brutus, PV ×1,3 | Coup de bouclier, Cri de guerre, Coup de pied | Ne se bat jamais jusqu'à la Dispersion : il se **rend** sous 30 % de PV, ou se retire. |
| **Merlin III** (ch. 17) | Merlin, PV ×1,5 | Givre, **Gel** (zone en losange de rayon 1 : Ralenti 2 tours, dégâts énergétiques 4), **Relevé** (voir ch. 17), Boule de feu | Boss. |

## La Chronique d'ouverture

> Affichée au début du chapitre 13, sur fond de verre dépoli, comme un document tamponné. Les passages entre accolades `{…}` varient selon les drapeaux (voir la table des variantes). Les notes marginales s'affichent en écriture manuscrite, de travers.

---

**COLLÈGE DE VITRELLE — BUREAU DU CLASSEMENT**
**Rapport n° 312-0417**
**Objet :** l'anomalie dite « du Puits », désignée au Registre sous la cote **0-PUITS-1**.
**Classement demandé :** *anomalie historique*.
**Rédacteur :** le Chroniqueur, onzième du nom, rédacteur de deuxième rang.
**Diffusion :** Maître du Verre ; capitaine de la Garde ; personne d'autre.

**1. Constat.**

1.1. Depuis l'an 97 du Gel, la Salle du Puits contient une forme humanoïde immobile, à la verticale de l'amas dense. Les relevés thermiques la donnent pour très froide et très rouge : sa lumière nous parvient étirée, comme épuisée par la descente. Le Bureau des Mesures attribue cet effet au ralentissement du temps propre au voisinage de l'amas. Le présent bureau n'a pas d'avis sur la question et s'en tient aux mesures.

1.2. Entre l'an 97 et l'an 311, l'anomalie a déplacé la main droite d'environ un doigt. Ce mouvement a été jugé non significatif.

1.3. Au cours de la nuit du 16 au 17 du mois des Vitres, an 312, l'anomalie a ouvert les yeux.

**2. Antécédents.**

2.1. Un seul document fiable mentionne l'anomalie : les carnets de Merlin, premier du nom, fondateur de la lignée de notre Maître. {si `merlin_mesure` : *Il l'a mesurée lui-même et l'a inscrite comme « anomalie » : son horloge et le cœur du sujet n'étaient pas d'accord « d'un battement sur mille ».*} Il a ensuite observé, depuis le bord du Puits, le ralentissement de sa chute : « un battement sur cent, puis sur dix ». Le Bureau tient ces mesures pour exactes. Toutes les autres sources sont des **légendes**, toutes antérieures au Gel, toutes contradictoires, toutes produites à une époque où l'on ignorait le principe de la mesure.

2.2. Les ondines des anciens pilotis appelaient l'anomalie « le Dormeur ». Il serait sorti de la Pierre Lente au temps des Marées, et aurait « choisi ce qu'on laisserait sombrer ». {si `ile_sauvee` = `strates` : *Le fonds dit « de la Marée » conserve les annales des ondines, en vase et en ardoise, que le Bureau juge exactes et donc sans intérêt pour la question*} {si `ile_sauvee` = `sauge` : *La Tour des Marées, aujourd'hui fondation de notre Tour du Registre, aurait été sauvée par lui. Le Bureau classe cette affirmation comme reconnaissance de dette non vérifiable*} {si `ile_sauvee` = `lusse` : *Les squales des Citernes prétendent lui devoir leur lignée. Le Bureau ne recueille pas le témoignage des squales*} {si `ile_sauvee` = `aucune` : *Il n'aurait rien sauvé du tout. C'est la seule version que le Bureau trouve crédible*}. {si `journal_nerea` = `garde` : *Une copie du journal d'une ondine, Néréa dite des Strates, le décrit en des termes que le Bureau juge poétiques et donc inexploitables.*}

2.3. Les mêmes légendes le rattachent à l'événement {si `fragments` = `fusion` : *dit de la Fusion, au cours duquel deux terres se seraient soudées le long de la Couture, sur laquelle notre Haute-Ville est pavée. La Couture est un fait géologique. Que quelqu'un y ait assisté est une hypothèse superflue*} {si `fragments` = `separation` : *dit de la Séparation, à l'origine de l'éloignement de la Sœur, que l'on voit par temps clair. L'éloignement est un fait astronomique. Que quelqu'un l'ait décidé est une hypothèse superflue*}.

2.4. {si `nom` ≠ `aucun` : *Certaines sources le nomment « [nom déformé] » (sic). Le Bureau ne retient pas ce nom, qui varie selon les sources et n'est donc pas une donnée.*} {sinon : *Aucune source ne lui donne de nom. Le Bureau s'en félicite : un nom est une donnée qu'il faudrait vérifier.*}

**3. Signalement.**

3.1. Taille et carrure ordinaires. Habits anciens, d'une coupe antérieure au Gel.

3.2. Particularités physiques : {selon `transformation.I` : *pupilles qui renvoient la lumière à la manière des bêtes nocturnes* / *plaques translucides sur les avant-bras, d'apparence cristalline ; un prélèvement est recommandé*} ; {selon `transformation.II` : *fentes respiratoires au cou, de type aquatique* / *écailles d'un gris bleuté à la nuque et aux épaules*}.

3.3. Effets personnels : un carnet de cuir, illisible à travers la paroi. Il paraît contenir des **questions**. {si `objet_de_nyx` : *Un second objet, saisi à ses pieds en l'an 140, est inventorié comme artefact non classé.*}

**4. Analyse des risques.**

4.1. L'anomalie n'a pas été mesurée depuis sa naissance. Elle ne figure dans aucun registre. Elle n'a donc **pas d'état connu**, ce qui est, pour une cité comme la nôtre, la définition exacte d'un danger.

4.2. Le carnet constitue un risque distinct. Les habitants de Vitrelle disposent depuis trois siècles de toutes les réponses utiles, affichées au Registre. Un document contenant des questions sans réponse officielle pourrait susciter des **comparaisons**.

4.3. Le Bureau rappelle que les questions ne sont pas interdites. Elles sont inutiles, ce qui revient au même pour la sécurité publique.

**5. Mesures recommandées.**

5.1. Relever l'anomalie dès sa sortie et la conduire au Bureau des Mesures pour un classement complet.

5.2. Saisir le carnet. Ne pas le lire à voix haute.

5.3. Toute personne ayant parlé avec l'anomalie sera relevée et réévaluée.

5.4. Si l'anomalie résiste, la Garde est autorisée à la figer.

*Fait à Vitrelle, le 17 du mois des Vitres, an 312 du Gel (833 de l'ancien calendrier, dit {« de la Fusion » / « de la Séparation »}, dont l'usage est déconseillé).*
*Le Chroniqueur (11e)*

> *Note marginale, d'une autre main, à l'encre bleue :* « 1.2 : un doigt en deux siècles, c'est plus que tout ce que cette cité a bougé dans le même temps. — M. »

---

### Comment la Chronique change ensuite

- Si `chroniqueur_rejoint` (ch. 14), les extraits d'archives des ch. 15 à 18 sont **annotés par le Chroniqueur lui-même** : des ratures, des « (faux) », des « (vérifié aux strates) ». Le ton administratif se fissure à mesure que la cité se fend.
- Sinon, les extraits restent impeccables jusqu'au bout, et le dernier (ch. 18) s'interrompt au milieu d'une phrase.

## Les chapitres

| # | Chapitre | Fichier |
| --- | --- | --- |
| 13 | La Cité sans questions | [`13-la-cite-sans-questions.md`](13-la-cite-sans-questions.md) |
| 14 | Le Chroniqueur | [`14-le-chroniqueur.md`](14-le-chroniqueur.md) |
| 15 | La Mine | [`15-la-mine.md`](15-la-mine.md) |
| 16 | Le Golem | [`16-le-golem.md`](16-le-golem.md) |
| 17 | Le Maître du Verre | [`17-le-maitre-du-verre.md`](17-le-maitre-du-verre.md) |
| 18 | La Fêlure | [`18-la-felure.md`](18-la-felure.md) |

## Drapeaux propres à l'ère (à reporter au registre général)

| Drapeau | Posé au | Sens |
| --- | --- | --- |
| `questions_rouvertes` | ch. 13 | Nombre d'habitants chez qui le héros a rouvert une question (0 à 3) |
| `mine_arretee` | ch. 15 | Le Diapason de la Mine a été coupé (objectif principal du ch. 15) |
| `carte_des_lacunes` | ch. 17 | Le héros emporte une copie de la carte des Lacunes du Collège (objet fil rouge) |
| `brutus_portes_ouvertes` | ch. 18 | Brutus III a ouvert les portes de Vitrelle pendant la Fêlure |
| `vitrelle_evacues` | ch. 18 | Nombre de groupes d'habitants évacués (0 à 6) |
| `cristal_rendu` | ch. 18 | Précision du type : `premier` / `lien` / `gorr` / `aucun` (quel Cristal a été rendu) |
