# Épilogue — Les fins

> *Dans une autre branche, l'histoire finirait autrement. Dans chacune, elle finirait.*
> — Les branches

Ce dossier contient **le calcul des fins** (ce fichier) et **les cinq fins rédigées** :

| Fin | Nature | Fichier |
| --- | --- | --- |
| **Le Cristal** | Ordre : tout est figé, parfait, immobile. | [`le-cristal.md`](le-cristal.md) |
| **L'Équilibre** | Chaos : tout s'ouvre jusqu'à la tiédeur. | [`l-equilibre.md`](l-equilibre.md) |
| **L'Intrication** | La vraie fin : un réseau ouvert, au bord du chaos. | [`l-intrication.md`](l-intrication.md) |
| **Le Découplage** | La fin secrète : le Ghom se retire, l'Archipel continue. | [`le-decouplage.md`](le-decouplage.md) |
| **La Dispersion** | La fin amère : le héros se disperse, un autre termine. | [`la-dispersion.md`](la-dispersion.md) |

Règle commune : **dans aucune fin le jeu ne répond à Q28.** La question reste écrite dans le Carnet, ouverte ou barrée. Les fins disent ce que devient l'Archipel, pas pourquoi il existe.

---

## 1. Quand le calcul a lieu

À la fermeture du nœud 5 du chapitre 28 (« La réponse »), après :

1. le combat final (`derniere_lacune`, `heros_disperse`, `combat_final_libre`) ;
2. la réponse à Gorr (`carnet.Q28`, `derniere_reponse`) ;
3. le dernier geste, s'il a été proposé (Influence « Se retirer » employée ou non).

Le résultat est mémorisé dans le drapeau **`fin`** (`cristal` / `equilibre` / `intrication` / `decouplage` / `dispersion`), et, pour la Dispersion, **`fin.monde`** (`cristal` / `equilibre` / `ouvert`), qui dit ce que devient l'Archipel sans le héros.

## 2. Les grandeurs calculées

**Les questions.** Le Carnet (voir [`../carnet.md`](../carnet.md)) contient 29 questions :

- **9 ouvertes** : `OUVERTES = {Q00, Q06, Q11, Q12, Q19, Q21, Q24, Q25, Q28}` ;
- **20 à réponse** (même ère ou tardive) : toutes les autres.

| Grandeur | Formule | Sens |
| --- | --- | --- |
| `R` (richesse du Carnet) | nombre de `carnet.Qxx = repondue`, **moins 3** si `carnet_intact` est faux | Ce que le héros a compris en chemin. Maximum 20. |
| `F` (fausses) | nombre de `carnet.Qxx = fausse` | Les réponses rassurantes acceptées. Seules les questions ouvertes peuvent être fausses. |
| `ouvertes_gardees` | vrai si **toutes** les questions de `OUVERTES` sont `ouverte` | Condition de la fin secrète. |
| `carnet_riche` | `R ≥ 14` **et** `F ≤ 1` **et** `carnet.Q28 = ouverte` | Condition de la vraie fin. |
| `nom_donne` | `nom` est une lignée (`lyra`, `brutus`, `eva`, `nerea`, `nyx`, `merlin`, `gorr`, `squalor`, `lacunaire`, `chroniqueur`) | Le héros a été nommé par un Écho. `choisi` et `aucun` ne comptent pas. |
| `habitees_majoritaires` | `lacunes.habitees ≥ lacunes.recousues` **et** `lacunes.habitees ≥ lacunes.elargies` | Le héros a surtout habité les Lacunes. |

**Les scores d'Ordre et de Chaos** (pour les fins par défaut) :

```
S_ordre = 2 × lacunes.recousues
        + cristaux.gardes
        + 3 si ghom_dechu.issue = vaincu
        + 1 si derniere_reponse = ghom

S_chaos = 2 × lacunes.elargies
        + cristaux.extraits
        + 3 si ghom_dechu.issue = suivi
        + 1 si derniere_reponse = rien_impossible
```

Les compteurs `lacunes.*` incluent le chapitre 28, où le Cœur compte **double** (`+2`).

Pourquoi ces termes : garder un Cristal, c'est conserver (Ordre) ; en extraire, c'est consommer pour ouvrir (Chaos) ; une réponse fausse donnée avec certitude pousse vers l'extrême qu'elle sert (un monde voulu se fige, un monde nécessaire n'a besoin de personne). Les Cristaux **donnés** et les Lacunes **habitées** ne comptent ni pour l'un ni pour l'autre : ce sont des liens, pas des positions.

## 3. L'ordre de priorité

Les conditions sont testées **dans cet ordre** ; la première vraie l'emporte.

```
1. LA DISPERSION   si heros_disperse
                   ou confiance ≤ -6

2. LE DÉCOUPLAGE   si nom = aucun
                   et ouvertes_gardees
                   et le héros a fait le dernier geste
                   et le Ghom a employé « Se retirer »

3. L'INTRICATION   si couplage_ghom_dechu
                   et confiance ≥ 5
                   et carnet_riche
                   et nom_donne
                   et habitees_majoritaires

4. LE CRISTAL      si S_ordre > S_chaos
5. L'ÉQUILIBRE     si S_chaos > S_ordre

6. Égalité         derniere_lacune = elargie            → L'ÉQUILIBRE
                   derniere_lacune = recousue           → LE CRISTAL
                   derniere_lacune = habitee            → LE CRISTAL si confiance ≥ 0,
                                                          sinon L'ÉQUILIBRE
```

**Pour la Dispersion**, `fin.monde` se calcule ensuite, comme si le héros n'était plus là :

```
fin.monde = ouvert     si couplage_ghom_dechu et habitees_majoritaires et confiance ≥ 0
          = cristal    sinon, si S_ordre ≥ S_chaos
          = equilibre  sinon
```

### Pourquoi cet ordre

1. **La Dispersion d'abord**, parce qu'elle est physique avant d'être morale : un héros trop usé qui tombe se disperse, et dans le Tissu déchiré, un héros que personne ne tient (Confiance ≤ −6) perd son état (Q20 : *on n'a d'état que dans ses relations*). Ce qui arrive au monde ensuite n'efface pas ce qui lui est arrivé.
2. **Le Découplage ensuite**, parce qu'il ne dépend que de deux fidélités tenues toute l'aventure (ne pas prendre de nom, ne pas prendre de fausse réponse) et d'un acte : demander, puis que le Ghom accepte. S'il est proposé et accepté, rien d'autre ne compte : l'Archipel n'a plus de Ghom pour lui donner une direction.
3. **L'Intrication**, qui demande le plus de conditions : c'est la fin qu'on construit.
4. **Le Cristal et l'Équilibre** sont les pentes naturelles : sans liens assez nombreux, l'Archipel tombe d'un côté ou de l'autre.
5. **L'égalité** se départage par le dernier acte (le Cœur). Si le Cœur a été habité sans que l'Intrication soit possible, le monde se rabat sur ce qu'on lui a appris : l'entretien, si les Échos font encore confiance au Ghom ; la dissolution, sinon.

## 4. Cas limites

| Situation | Résultat | Commentaire |
| --- | --- | --- |
| Toutes les conditions de l'Intrication, mais `nom = aucun` | Pas d'Intrication. Si `ouvertes_gardees`, le dernier geste est proposé : le joueur choisit entre le Découplage et une fin par défaut. | C'est voulu : un héros sans nom n'a pas été « tenu » par un Écho. Au ch. 28, l'héritière d'une promesse de l'ère I peut donner le nom gardé (`nom.promesse`), Nyx IV peut redonner « Lisière » (si elle l'a proposé au ch. 24) et Gorr peut proposer « Fissure » (si `confiance.gorr ≥ 2`) : c'est le vrai carrefour entre les deux fins hautes. |
| `nom = choisi` | Ni Intrication ni Découplage. | Se nommer soi-même, c'est ne pas être nommé par un lien, et ne pas rester sans nom. Le choix du nom (arc F) l'indique d'une phrase : **Les branches** — « *Dans une autre branche, quelqu'un nous aurait appelés.* » |
| Le dernier geste est fait, mais le Ghom ne se retire pas | Calcul normal, sans Découplage ; Intrication impossible (pas de nom). | Le Ghom reste, et ce n'est pas un échec : la fin par défaut obtenue a une phrase de plus (« *La pression resta, plus douce.* »). |
| `confiance ≤ -6` et conditions du Découplage réunies | **La Dispersion**. | Le Ghom ne peut pas se retirer d'un monde qui a déjà défait celui qui le lui demandait. |
| `heros_disperse` et `couplage_ghom_dechu` et Cœur habité | **La Dispersion**, `fin.monde = ouvert` (si `confiance ≥ 0`). | La plus douce des fins amères : le réseau se fait, sans le héros. |
| `carnet_intact` faux | `R − 3`. | On se souvient des réponses, on ne les a plus écrites : la richesse transmise est moindre. |
| `carnet.Q28 = fausse` seule fausse (`F = 1`) | Ni Intrication (`carnet.Q28` doit être `ouverte`), ni Découplage. | La dernière question pèse plus que les autres. |
| Une seule autre fausse (ex. Q25), Q28 ouverte | Intrication possible (`F ≤ 1`), Découplage impossible. | La vraie fin tolère une faiblesse ; la secrète, aucune. |
| `S_ordre = S_chaos = 0` (aucune Lacune traitée, aucun Cristal) | Départage par `derniere_lacune`. | Le Cœur est toujours traité au ch. 28, donc ce départage existe toujours. |
| `ghom_dechu.issue = couple` mais Confiance < 5 | Pas d'Intrication ; fin par défaut. | Les deux Ghoms sont liés, mais les Échos ne suivent pas. L'épilogue de la fin par défaut mentionne les deux pressions. |
| Usure ≥ 8, héros jamais tombé | Pas de Dispersion. | Le risque n'est pas la sanction. Les épilogues montrent les cicatrices. |

## 5. Ce que chaque fin affiche

Chaque fichier de fin suit le même plan :

1. **Conditions** (rappel) ;
2. **Scènes finales**, avec les répliques ;
3. **Le dernier plan** ;
4. **L'épilogue des Échos**, selon les drapeaux (une ligne ou deux par Écho présent dans l'histoire) ;
5. **La transformation de l'ère V** du héros (visible après le générique) ;
6. **Notes de mise en œuvre**.

**Règles communes aux épilogues :**

- Un Écho apparaît dans l'épilogue s'il a été **dans l'équipe à un moment de l'ère V**, ou s'il est revenu au ch. 28. Les héritiers partis et jamais revenus ont une ligne commune : « *Ceux qui étaient partis chez les Déliés ne revinrent pas. On dit qu'ils vécurent bien, ailleurs, et c'était vrai.* » (La phrase change selon la fin.)
- Les lignées continuent : les épilogues parlent souvent des **héritiers des héritiers**, au passé, comme une Chronique très courte. Ce sont les premières lignes écrites depuis la fin de l'ère IV : quelqu'un, enfin, peut écrire après.
- **Le narrateur des épilogues** est la voix des branches au début, puis, pour la dernière ligne, plus personne : un texte sans voix, au passé simple, comme une Chronique que personne ne signe.
- **Après le générique** : les Échos rencontrés, le héros transformé, les Doubles épargnés (`doubles.epargnes`) et le Ghom déchu (s'il a pris une forme) deviennent disponibles en Escarmouche, en Arcade et en ligne.

## 6. Transformations de l'ère V

| Fin | Transformation | Effet (modes hors Aventure) |
| --- | --- | --- |
| Le Cristal | **Corps de verre** : la peau du héros est devenue cristalline, transparente, presque immobile. | + défense, − Vitesse. |
| L'Équilibre | **Contour tiède** : les bords du héros sont flous, sa couleur ternie. | + esquive, − Élan reçu. |
| L'Intrication | **Fils d'intrication** : de fines lignes de lumière, par paires, sur les mains et le visage, qui scintillent avec les Échos liés. | Intrication renforcée avec tous les Échos. |
| Le Découplage | **Aucune** : le corps garde ses marques, et rien d'autre. | Aucun ; le héros porte toutes ses transformations précédentes. |
| La Dispersion | — (le héros n'est plus jouable dans l'Aventure ; son corps d'avant le chapitre 28 reste disponible ailleurs) | — |

## 7. Drapeaux

**Lus :** tout le registre, plus les drapeaux de l'ère IV (`retour.<lignée>`, `rupture.respectee`, `autonomie.insistances`, `nerea_retrouvee`) (voir [`../README.md`](../README.md)), et en particulier `lacunes.*`, `confiance`, `confiance.<lignée>`, `carnet.*`, `couplage_ghom_dechu`, `nom`, `usure`, `cristaux.gardes`, `cristaux.extraits`, `cristaux.donnes`, `trahison.*`, `alliance_nyx`, `squalor_rejoint`, `merlin_convaincu`, `chroniqueur_rejoint`, `lacunaire.forme`, `double_epargne`, `premier_cristal`, `ile_sauvee`, `fragments`.

**Nouveaux de l'ère V utilisés ici :** `carnet_intact`, `ghom_dechu.issue`, `ghom_dechu.echo`, `derniere_lacune`, `derniere_reponse`, `combat_final_libre`, `heros_disperse`, `doubles.epargnes`.

**Posés ici (nouveaux) :** `fin`, `fin.monde`.
