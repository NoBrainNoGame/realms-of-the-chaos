# L'Aventure — textes de référence

Ce dossier contient **le scénario rédigé de l'Aventure**, rangé par ères et par chapitres. C'est la référence pour implémenter le mode Aventure : cartes, dialogues, objectifs, choix et conséquences.

- **Structure et intentions :** [`../scenario.md`](../scenario.md) (le plan validé).
- **Monde, voix, règles d'écriture :** [`bible.md`](bible.md).
- **Le Carnet des Questions :** [`carnet.md`](carnet.md).

## Sommaire

| Partie | Dossier |
| --- | --- |
| Prologue — L'Aube | [`00-prologue/`](00-prologue/) |
| Ère I — L'Aube des Fragments (chapitres 1 à 6) | [`01-aube-des-fragments/`](01-aube-des-fragments/) |
| Ère II — Le Temps des Marées (chapitres 7 à 12) | [`02-temps-des-marees/`](02-temps-des-marees/) |
| Ère III — L'Âge du Verre (chapitres 13 à 18) | [`03-age-du-verre/`](03-age-du-verre/) |
| Ère IV — Le Schisme des Échos (chapitres 19 à 24) | [`04-schisme-des-echos/`](04-schisme-des-echos/) |
| Ère V — L'Ombre du Tout (chapitres 25 à 28) | [`05-ombre-du-tout/`](05-ombre-du-tout/) |
| Épilogue — Les fins | [`06-fins/`](06-fins/) |

Chaque dossier d'ère contient :
- un **`README.md`** qui présente l'ère : sa question, son narrateur, son décor, sa mécanique nouvelle, les personnages, et la **Chronique d'ouverture** (le texte partial lu au début) ;
- un fichier par chapitre : `07-la-sortie-du-puits.md`, etc.

## Modèle d'un chapitre

Tous les chapitres suivent ce plan, dans cet ordre :

```markdown
# Chapitre N — Titre

> Une phrase d'accroche, comme une épigraphe (une réplique, un fragment de chronique…).

## Fiche
| | |
| --- | --- |
| Ère | … |
| Lieu | … |
| Équipe | qui est disponible, qui rejoint, qui part |
| Durée visée | nombre de nœuds, de combats |
| Question au Carnet | Qxx — … |

## Ce que le joueur sait en arrivant
(ce qui s'est passé avant, de son point de vue ; utile pour les rappels)

## Synopsis
(le chapitre en un paragraphe)

## Carte du chapitre
(les nœuds dans l'ordre, avec leur type : Combat, Rencontre, Veillée, Archive, Lacune, Fin ; et les embranchements)

## Scènes
(chaque nœud non combattant : décor, déroulé, **répliques clés écrites** ; choix du héros en liste numérotée avec leurs effets)

## Combats
(pour chaque combat :)
- **Carte :** description, et un croquis ASCII si utile (même légende que `Board.fromAscii` : `.` sol, `1`-`3` hauteurs, `a`-`c` creux, `~` eau peu profonde, `w`/`W` eau profonde)
- **Équipes :** alliés, ennemis (personnages existants, ou nouveaux ennemis à créer, décrits)
- **Objectif principal**, **objectifs secondaires** (★ annoncés, ◆ cachés), conditions de défaite
- **Événements scriptés :** ce qui arrive en cours de combat, et quand
- **Répliques de combat :** quelques lignes courtes (début, moment fort, fin)

## Choix et conséquences
(tableau : choix ou objectif → drapeaux modifiés → effet plus tard)

## Récompenses
(habits, traits, compétences, Échos qui rejoignent)

## Graines pour la suite
(ce que ce chapitre prépare dans les arcs cachés et les ères suivantes)

## Notes de mise en œuvre
(ce que le moteur et l'interface doivent permettre pour ce chapitre)
```

## Registre des drapeaux

Les choix du joueur sont mémorisés sous forme de **drapeaux**. Tous les chapitres utilisent ces noms, et **un drapeau nouveau doit être ajouté ici**.

### Arcs transversaux

| Drapeau | Type | Sens |
| --- | --- | --- |
| `lacunes.recousues` | compteur | Lacunes recousues (Ordre) — arc A |
| `lacunes.elargies` | compteur | Lacunes élargies (Chaos) — arc A |
| `lacunes.habitees` | compteur | Lacunes habitées à deux (Intrication) — arc A |
| `confiance` | -10 à +10 | Confiance générale des Échos envers le Ghom — arc B |
| `confiance.<lignée>` | -5 à +5 | Confiance d'une lignée (`lyra`, `brutus`, `eva`, `nerea`, `nyx`, `merlin`, `gorr`, `squalor`, `lacunaire`, `chroniqueur`), qui se transmet aux héritiers — arc B |
| `carnet.<Qxx>` | `ouverte` / `repondue` / `fausse` | État de chaque question : `fausse` si le héros a accepté une réponse rassurante mais fausse — arc C |
| `archives.lues` | compteur | Archives lues (chacune coûte un peu d'Usure) — arc D |
| `ghom_dechu.verite` | 0 à 3 | Ce qu'on sait du Ghom du Chaos — arc E |
| `nom` | `aucun` / `<lignée>` / `faux` | Nom du héros, pris à la Nomination (ch. 28) : celui d'une lignée, aucun, ou un leurre (une étiquette que d'autres lui ont donnée) — arc F |
| `nom.propositions` | liste | Lignées dont le héros a **retenu** le nom proposé — arc F |
| `usure` | 0 à 10 | Usure du héros — arc G (≥ 8 en ère V : risque de Dispersion) |
| `cristaux.gardes`, `cristaux.portes`, `cristaux.donnes` | compteurs | Usage des Cristaux d'intrication — arc H |
| `cristaux.extraits` | compteur | Cristaux brisés pour un gain immédiat (ère III) — arc A et fins |
| `transformation.<ère>` | `A` / `B` | Transformation choisie à la fin de chaque ère |

### Drapeaux d'événements

| Drapeau | Posé au | Sens |
| --- | --- | --- |
| `nyx_epargnee` | ch. 5 | Nyx I a fui au lieu de se disperser ; elle laisse un objet |
| `objet_de_nyx` | ch. 5 | Le héros possède l'objet de Nyx (la graine de l'arc IV) |
| `fragments` | ch. 6 | `fusion` ou `separation` des deux Fragments à la fin de l'ère I |
| `lacune_geante_habitee` | ch. 6 | La Lacune géante a été stabilisée à deux |
| `squalor_rejoint` | ch. 9 | Squalor a été nourri plutôt que vaincu |
| `lacunaire.forme` | ch. 10 | La forme choisie pour le Lacunaire stabilisé |
| `ile_sauvee` | ch. 12 | Quelle île la Grande Marée a épargnée |
| `chroniqueur_rejoint` | ch. 14 | Le Chroniqueur a confronté ses textes aux traces |
| `premier_cristal` | ch. 15 | `sauve` ou `perdu` |
| `gorr_question` | ch. 16 | Gorr a posé sa première question |
| `merlin_convaincu` | ch. 17 | Merlin III a été convaincu |
| `cristal_rendu` | ch. 18 | Un Cristal a été rendu au monde |
| `trahison.<lignée>` | ch. 21 | Les lignées passées du côté de Nyx |
| `alliance_nyx` | ch. 23 | Nyx IV accepte l'alliance |
| `paix_des_lacunes` | ch. 24 | La triple bataille s'est arrêtée sans vainqueur |
| `double_epargne` | ch. 25 | Le Double du héros a rejoint |
| `couplage_ghom_dechu` | ch. 27 | Le Ghom s'est couplé au Ghom déchu |

### Drapeaux ajoutés pendant la rédaction

Les chapitres définissent ces drapeaux en détail. Valeurs des drapeaux existants précisées :
- `ile_sauvee` vaut `sauge`, `lusse`, `strates` ou `aucune` ;
- `lacunaire.forme` vaut `ondine`, `aiguille`, `squale`, `miroir`, `recif` ou `brume` ;
- `objet_de_nyx` passe à `nyx_iv` si la Lame à une encoche est rendue au ch. 20 ;
- `cristal_rendu` vaut `premier`, `lien`, `gorr` ou `aucun` ;
- `gorr_question` peut être posé en rattrapage au ch. 23 (et `carnet.Q16 = repondue`) ;
- `alliance_nyx` peut être révoqué au ch. 24.

| Ère | Drapeau | Type | Sens |
| --- | --- | --- | --- |
| Prologue | `zones_prologue` | 0 à 3 | Zones de la prairie gardées actives |
| Prologue | `lacunaire_approche` | booléen | Le premier Lacunaire a pu s'approcher avant d'être touché |
| I | `zones_bords_froids` | 0 à 3 | Zones gardées actives au ch. 1 ; règle la Lacune du ch. 2 |
| I | `lyra_usure` | booléen | Lyra I a fini une couture seule (mains grises) |
| I | `lacunaires.epargnes` | compteur | Lacunaires qui ont fui au lieu d'être fixés |
| I | `demeure_ouverte`, `demeure.graine` | booléens | Demeure recommence à changer ; une graine y a été plantée |
| I | `pim_graine`, `pim_promesse` | booléens | Pim a planté la graine ; le héros lui a promis une réponse |
| I | `archive_derive` | `aucune` / `disponible` / `lue` | L'Archive de la Dérive (ch. 4 → ch. 6), premier indice de l'arc E |
| I | `merlin_mesure` | booléen | Merlin I a mesuré le héros (« anomalie ») |
| I | `vesce_dispersee` | booléen | Vesce, cousine de Nyx, s'est dispersée |
| I | `intrication_nyx` | booléen | Le héros a habité la Lacune géante avec Nyx I |
| I | `premier_cristal.lieu` | `cairn` / `lacune` | Où le Premier Cristal est resté |
| I | `premier_cristal.paire` | texte | Paire d'Échos qu'il corrèle (ex. `heros+lyra`) |
| I | `nom.promesse` | lignée / `aucune` | Lignée qui garde un nom pour le héros (arc F) |
| II | `journal_nerea` | `porte` / `garde` | L'original du journal de Néréa II est emporté dans le Puits, ou reste aux Ondines (copies divergentes) |
| III | `questions_rouvertes` | 0 à 3 | Habitants de Vitrelle chez qui une question a été rouverte (ch. 13) |
| III | `mine_arretee` | booléen | La Mine a été arrêtée (ch. 15) |
| III | `carte_des_lacunes` | booléen | Le héros a la carte des Lacunes (ch. 17), objet fil rouge de l'ère IV |
| III | `brutus_portes_ouvertes` | booléen | Brutus III a ouvert les portes de Vitrelle (ch. 18) |
| III | `vitrelle_evacues` | 0 à 6 | Groupes évacués (taille du village des Venteux) |
| IV | `autonomie.insistances` | compteur | Ordres forcés par le Ghom (« Insister ») |
| IV | `rupture.respectee` | booléen | Le ★ « laisser partir » du ch. 21 est atteint |
| IV | `nerea_retrouvee` | booléen | Néréa IV retrouvée (ch. 20) |
| IV | `retour.<lignée>` | booléen | Un Écho parti au ch. 21 est revenu (ch. 24) |
| IV | `sel_emportee` | booléen | Sel a été emportée par le Lacunaire géant (ch. 24) |
| V | `doubles.epargnes` | compteur | Doubles épargnés |
| V | `carnet_intact` | booléen | Le Carnet a traversé le ch. 26 sans dommage |
| V | `ghom_dechu.issue` | `vaincu` / `suivi` / `laisse` / `couple` | Issue de la rencontre du ch. 27 |
| V | `ghom_dechu.echo` | booléen | Le Ghom déchu a pris la forme d'un Écho |
| V | `derniere_lacune` | `recousue` / `elargie` / `habitee` | Traitement du Cœur au ch. 28 |
| V | `derniere_reponse` | `ghom` / `rien_impossible` / `ne_sait_pas` / `liens` / `silence` | Réponse du héros à la question de Gorr |
| V | `combat_final_libre` | booléen | Le combat final s'est joué sans ordre forcé |
| V | `heros_disperse` | booléen | Le héros est tombé au ch. 28 avec une Usure ≥ 8 |
| Fins | `fin`, `fin.monde` | textes | Fin obtenue ; ce que devient l'Archipel (voir `06-fins/README.md`) |

## Conventions

- **Répliques :** `**Lyra** — « … »`. Didascalies en italique.
- **Objectifs :** ★ un objectif secondaire **annoncé** (souvent plus important que la victoire), ◆ un objectif **caché**, découvert en le réussissant.
- **Cartes ASCII :** la légende de `Board.fromAscii`, plus `x` pour une case de Lacune et `?` (en surimpression) pour une case en Superposition. Ces deux symboles restent à ajouter au moteur.
- **Pas de saisie de texte :** voir la règle 8 de la bible (la bonne option et deux leurres si le parcours la fait connaître, sinon des leurres seulement).
- **Choix du héros :** listes numérotées, avec l'effet entre crochets : `1. « Qui es-tu ? » [confiance.lyra +1]`.
- **Combats :** les noms d'actions et de pouvoirs sont **ceux du lore** (§ 14 du plan) : Influences, Réparation, Intrication, Dispersion…
- **Longueur :** un chapitre fait de 150 à 400 lignes. On écrit les répliques clés et la structure complète, pas chaque ligne de chaque dialogue.
