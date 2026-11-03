# Ghom Game — Realms of the Chaos

> RPG tactique en HTML5 sur grille **isométrique 2D à cases carrées**, avec des tours rythmés par une **timeline**.
> Alias interne : *« LE JEU VIDÉO PARFAIT DE LA MORT KI TUE »*.

**Statut : prototype jouable.** Un combat complet fonctionne : 3 personnages contre 3 pilotés par l'IA, avec actions, zones, effets d'état, pouvoirs divins et écran de fin. Le moteur de combat est couvert par des tests automatisés.

---

## Lancer le projet

Le projet utilise [Bun](https://bun.sh) (≥ 1.3) pour tout : installation, serveur de dev, build et tests.

```bash
bun install
bun run dev        # serveur de dev → http://localhost:1234
bun test           # tests : moteur, rendu (DOM simulé), parties complètes
bun test --coverage # couverture de code
bun run typecheck  # vérification des types (TypeScript 7)
bun run check      # typecheck + tests
bun run build      # build de production dans dist/
bun run format     # prettier
```

Paramètres d'URL (`src/params.ts`) :

| Paramètre               | Effet                                                          |
| ----------------------- | -------------------------------------------------------------- |
| `?seed=42`              | combat reproductible (même carte, mêmes placements, même hasard) |
| `?spectate`             | IA contre IA                                                   |
| `?speed=4`              | vitesse des animations au démarrage (0.25 à 4 ; 0.25 = ralenti pour régler les effets) |
| `?debug`                | expose le jeu et le runner dans la console (`window.game`, `window.runner`) |
| `?gallery`              | galerie des personnages : 4 orientations et toutes les animations |
| `?team=eva,nyx,lyra`    | composition de votre équipe (6 personnages max)                |
| `?enemies=gorr,merlin`  | composition de l'équipe adverse                                |

### Contrôles

| Entrée                    | Effet                                                        |
| ------------------------- | ------------------------------------------------------------ |
| Clic sur une case         | fixe la destination (gratuit, ne termine pas le tour)        |
| `1`–`9` ou clic sur une icône | sélectionne une action (combos compris), puis clic sur une cible |
| `Espace` / `Entrée`       | passe le tour                                                |
| `Échap` / clic droit      | annule la sélection                                          |
| `F`                       | vitesse des animations ×1 / ×2 / ×4                          |
| Survol                    | infos du personnage, aperçu du chemin ou de la zone d'effet  |

## Vision

D'après le document de conception (Google Doc *« LE Jeu Vidéo Parfait. »*, lien dans [`docs/index.md`](docs/index.md)) :

- **Combats stratégiques et tactiques.** Chaque joueur contrôle une équipe de personnages et n'a pas de limite de temps pour jouer son tour.
- **Le joueur est un « Ghom »**, un Grand Maître de l'Existence. En plus des actions de ses personnages, il dispose d'**actions de player** (pouvoirs divins).
- **Modes de jeu prévus** :
  - rogue lite, en génération procédurale ;
  - aventure, avec un scénario et une fin ;
  - arcade, avec une difficulté croissante ;
  - libre : de 1 à 4 joueurs en local ;
  - en ligne, plus tard.
- **Actions combinées** entre personnages empilés sur la même case, et **progression des statistiques pendant le donjon**.
- **Jeu entièrement moddable**, en **low pixel-art 16×16**.

## Architecture

Le projet est séparé en deux couches :
- **Le moteur (`src/engine/`)** est du TypeScript pur, sans Pixi ni DOM. Il contient toutes les règles, il est déterministe (RNG à seed) et testé avec `bun test`.
- **La vue (`src/view/`)** ne fait que dessiner l'état du moteur et animer les événements qu'il émet.

```
src/
├── index.ts               bootstrap : Pixi 8, police, Runner booyah
├── params.ts              paramètres d'URL
├── engine/                ── moteur de combat pur (aucune dépendance) ──
│   ├── geometry.ts        Point, distances, ligne entre deux cases (ligne de vue)
│   ├── random.ts          RNG à seed (mulberry32)
│   ├── zones.ts           formes de zones : point, square, diamond, line, diagonal
│   ├── board.ts           plateau : relief, eau, marches, Dijkstra, ligne de vue, génération procédurale
│   ├── types.ts           stats, effets d'état, actions, combattants, événements
│   ├── content.ts         contenu : personnages, spécialités, actions, combos, effets d'état, pouvoirs divins
│   ├── combat.ts          la classe Combat : timeline, commandes, effets, victoire
│   ├── ai.ts              IA : évaluation des actions, déplacement, pouvoirs divins
│   └── *.test.ts          tests (plateau, relief, eau, combat, combos, IA)
├── art/
│   └── pixelArt.ts        sprites 16×16 et icônes 8×8, stockés en texte (+ test)
└── view/                  ── rendu PixiJS 8 + booyah ──
    ├── Game.ts            chip racine (relance un combat avec une nouvelle seed)
    ├── FightScene.ts      orchestre moteur ↔ animations ↔ entrées du joueur
    ├── Backdrop.ts        ciel étoilé, poussières lumineuses
    ├── BoardView.ts       île flottante : colonnes de terrain, eau, décors, onde de choc, surbrillances
    ├── FighterView.ts     pantin, PV, effets d'état, animations
    ├── Puppet.ts          personnages isométriques (pantins vectoriels articulés)
    ├── actionFx.ts        mise en scène des actions : poses, projectiles, impacts
    ├── Gallery.ts         page de contrôle des pantins (?gallery)
    ├── Hud.ts             timeline, barre d'actions, fiche, pouvoirs divins, journal, fin
    ├── effects.ts         particules, lumières, éclairs, entailles, projectiles, textes
    ├── textures.ts        pixel art → textures (filtrage nearest)
    ├── theme.ts           couleurs, tailles, projection isométrique
    ├── ViewChip.ts        chip booyah possédant un Container Pixi
    └── *.test.ts          tests du rendu (Pixi sans navigateur)
test/
    ├── dom.ts             DOM simulé (happy-dom) et faux contexte canvas 2D pour Pixi
    └── harness.ts         monter et faire « tiquer » des chips booyah dans les tests
```

### Tests

`bun test` lance 269 tests en une dizaine de secondes, avec **99,7 % des lignes couvertes**. Le seul fichier non couvert est `index.ts`, qui a besoin d'un vrai WebGL.
- **Moteur** : règles du plateau et du relief, combat, combos, IA, et des centaines de combats IA complets sur des cartes générées, avec vérification d'invariants.
- **Rendu** : grâce à happy-dom et à un faux contexte canvas (`src/test/dom.ts`), Pixi construit ses scènes sans navigateur. Sont testés les pantins (4 orientations, toutes les animations), le plateau (onde de choc, surbrillances, événements), les effets, le HUD, et des **parties entières animées**. Une partie IA contre IA et une partie jouée au clavier et à la souris vont jusqu'à l'écran de fin, et on vérifie que l'affichage correspond exactement au moteur (PV, positions, effets d'état).

### Boucle de jeu

1. `FightScene` appelle `combat.advance()`. Le moteur traite le prochain événement de la timeline (un pas de déplacement ou un tour d'action), résout immédiatement les tours de l'IA et renvoie une liste de `FightEvent`.
2. La scène convertit ces événements en animations booyah (`Sequence` / `Parallel`) et les joue. La vue garde son propre état affiché (PV, position), qui peut être en retard sur le moteur le temps d'une animation.
3. Quand c'est au tour d'un humain (`state === "awaitingInput"`), les commandes `moveTo`, `useAction`, `pass` et `useDivine` renvoient de nouveaux événements, ou un refus avec sa raison.

## Mécaniques de combat

### Timeline

![Timeline](docs/images/timeline.png)

Il n'y a pas de tours fixes. Chaque personnage a un **temps avant sa prochaine action**, et le plus bas joue. Son action ajoute `délai de base × coût de l'action` à son compteur, avec `délai de base = 100 / Vitesse`. Un personnage rapide joue donc plus souvent.

**Passer** redonne la main juste après le prochain personnage, sans jamais coûter plus qu'une action (règle du doc).

### Déplacement (option 👍 du doc)

Le doc pose le *« dilemme du déplacement suicidaire »* et retient l'option **« déplacement à chaque fois que c'est possible »** :
- Fixer une destination est **gratuit et ne termine pas le tour**. Le pathfinder (Dijkstra) trace le chemin.
- Le personnage avance ensuite **d'une case à la fois pendant que la timeline s'écoule**. Chaque pas coûte `40 % du délai de base × coût du pas`, sans rien ajouter à son temps d'action.
- Un chemin bloqué en cours de route est recalculé, ou abandonné s'il n'y a plus de passage.
- Les déplacements se font en 4 directions. On traverse les cases de ses alliés (jusqu'à **3 personnages par case**), mais jamais celles des ennemis.

### Relief et terrain

Comme dans la version hexagonale d'origine, chaque case a une **hauteur, de -3 à +3**. Les creux sont soit secs (des fosses), soit remplis d'eau.

| Règle | Effet |
| --- | --- |
| **Marche** | On monte ou on descend **1 niveau** par pas. Au-delà, c'est une falaise, infranchissable. Monter coûte +1. |
| **Eau** | On se déplace **à la surface** (niveau 0). La profondeur compte : voir « L'eau » ci-dessous. |
| **Ligne de vue** | Elle part des yeux (hauteur + 1). Une colline cache ce qui est derrière elle ; depuis les hauteurs, on voit par-dessus. |
| **Portée** | +1 de portée par niveau au-dessus de la cible, +2 au maximum, pour les actions à distance. |
| **Repousser** | Contre une falaise, 3 dégâts par case restante. Dans un creux, 5 dégâts par niveau de chute au-delà d'1, **sauf dans l'eau**. On ne peut jamais être poussé dans un trou d'où personne ne pourrait sortir. |

### L'eau

L'eau n'est **plus décorative**. Elle a deux profondeurs :
- **eau peu profonde** (1 niveau) : on y patauge ;
- **eau profonde** (2 ou 3 niveaux) : il faut savoir nager.

Chaque personnage a une **locomotion** :

| Locomotion | Personnages | Eau peu profonde | Eau profonde |
| --- | --- | --- | --- |
| **Marcheur** | Merlin, Brutus, Lyra, Gorr | patauge, coût 2 | **impossible** (on ne nage pas en armure, et un golem coule) |
| **Nageur** | Eva, Nyx | patauge, coût 2 | nage à la surface : **coût 3 par case**, et chaque tour passé dans l'eau profonde coûte **+50 % de temps** (on dépense de l'énergie même immobile) |
| **Aquatique** | Néréa, Squalor | **coût 1**, comme sur la terre ferme | **coût 1**, aucune pénalité |

Le moteur n'a pas de points d'action ni de mouvement : c'est la timeline qui rythme tout. « Dépenser plus de points » se traduit donc par **plus de temps** : des pas plus lents, et des tours plus longs quand on nage.

Autres règles liées à l'eau :
- **Repousser** : un marcheur poussé vers de l'eau profonde se cogne au bord (dégâts de collision) ; un nageur ou un aquatique tombe dedans. Tomber d'une falaise dans l'eau ne fait pas de dégâts.
- **Plongeon** (Squalor) : ce bond ne vise **que des cases d'eau** (champ `targetTerrain` des actions).
- **Séisme** : il reste permis tant que chaque combattant peut rejoindre la terre ferme commune ; un aquatique peut donc rester au milieu d'un lac.
- **À l'écran** : on patauge avec de l'eau jusqu'aux mollets, on nage immergé jusqu'au torse avec une animation de brasse. L'aileron de Squalor dépasse. La fiche du personnage indique son trait, et prévient quand il est en train de nager.

Les rochers ont été retirés : les falaises et les pitons jouent maintenant leur rôle (bloquer le passage et la vue).

La carte est générée de façon procédurale (collines et creux gaussiens) et **symétrique** (équitable pour les deux camps). Les mares sont fréquentes, les grands lacs rares. Les deux bords de départ sont praticables et reliés. Les personnages sont placés aléatoirement de leur côté, dans la zone praticable, **à 4 cases minimum de chaque ennemi** (règle du doc).

### Actions (« sorts »)

![Zones d'un sort](docs/images/zones-sort.png)

Le modèle suit le doc : `launch` (zone de lancement et portée), `lineOfSight`, `area` (zone d'effet), `target` (`enemy` / `ally` / `self` / `any` / `emptyCell`), `affects` (qui est touché dans la zone), `timeCost`, `cooldown` et `effects`.

Les effets sont **déclaratifs** : `damage` (physique ou magique), `heal`, `push` (avec dégâts de collision), `status`, `dash`, `delay`. Une action est donc entièrement décrite par des données, sans code.

**Dégâts** : `puissance × (1 + attaque/10) × 10/(10 + défense)`. Les coups critiques font ×1,5, avec une chance de `Chance × 3 %` (plafonnée à 50 %).

### Personnages

| Perso      | Rôle       | Actions                                                        |
| ---------- | ---------- | -------------------------------------------------------------- |
| **Merlin** | Mage       | Boule de feu (zone, **touche aussi les alliés**), Givre (ralentit) |
| **Eva**    | Archère    | Tir à l'arc (portée 2-6), Flèche empoisonnée (en ligne)        |
| **Brutus** | Guerrier   | Coup de bouclier (repousse de 2), Cri de guerre (enragé)       |
| **Lyra**   | Soigneuse  | Soin, Égide (bouclier), Accélération                           |
| **Nyx**    | Ombre      | Lame furtive (rapide), Bond (saut sur une case libre)          |
| **Gorr**   | Golem      | Écrasement (zone), Secousse (retarde les ennemis adjacents)    |
| **Néréa**  | Ondine (aquatique, camp Lumière) | Trident (portée 1-2), Raz-de-marée (zone : repousse et ralentit), Bulle protectrice (bouclier + soin) |
| **Squalor** | Homme-requin (aquatique, camp Chaos) | Morsure (saignement), Plongeon (bond dans l'eau qui éclabousse les ennemis autour) |

Tout le monde a aussi **Coup de pied**.

### Actions combinées (synergies du doc)

Chaque personnage a une **spécialité** : Merlin la Magie, Eva la Précision, Brutus et Gorr la Force, Lyra la Foi, Nyx l'Ombre.

Quand un allié **se tient sur la même case**, une action combinée apparaît sur les deux personnages (jusqu'à 3 par case, donc 2 combos possibles). C'est **l'action principale du personnage, améliorée selon la spécialité du partenaire** :

| Partenaire | Bonus |
| --- | --- |
| Magie | +5 dégâts magiques, ou +5 de soin |
| Force | +30 % de dégâts et une case de recul en plus, **pour le même coût** (le « spé-force + spé-force » du doc) |
| Précision | +2 de portée (+1 au corps à corps) |
| Foi | soigne aussi le lanceur |
| Ombre | coûte 40 % de temps en moins (le « bonus de temps » du doc) |

Certaines paires ont une action unique, comme l'exemple du doc : **Eva + Merlin donnent la « Flèche enchantée »**, une flèche de feu qui explose autour de la cible. Un combo a 1 tour de recharge de plus que l'action de base.

Dans la barre d'actions, les combos ont une bordure turquoise et le portrait du partenaire. L'IA les utilise, et elle se déplace sur la case d'un allié quand un combo y devient la meilleure option.
**Deux représentations par personnage :**
- **Sur le terrain : des pantins isométriques à la manière de Dofus** (`src/view/Puppet.ts`). Ce sont des dessins vectoriels articulés (jambes, bras, torse, tête, arme), dessinés en vue de face ¾ et de dos ¾, puis retournés en miroir pour couvrir les 4 orientations. Un personnage se tourne vers sa destination ou vers sa cible. Il respire au repos et a des animations de marche, de coup, de tir, d'incantation, de cri et de réaction aux coups. Les gemmes, orbes et yeux brillent en lumière additive. L'apparence est décrite par des données (`STYLES`) : silhouette, couvre-chef, arme, couleurs.
- **Dans la timeline et la fiche : les sprites en pixel art 16×16** (`src/art/pixelArt.ts`), un caractère par pixel, donc faciles à retoucher.

### Effets (« juicyness »)

- **Onde de choc** : toute action qui inflige des dégâts enfonce les cases de sa zone de quelques pixels, même s'il n'y en a qu'une. L'onde part de la case visée, se propage case par case, et fait légèrement trembler l'anneau autour. Les personnages suivent le sol.
- **Particules** : feu, fumée, poussière, étincelles, débris, éclaboussures (en marchant dans l'eau), bulles de poison, éclats de glace, scintillements.
- **Lumières** : halos additifs (explosions, soins, coups), rayons de lumière (Soin, Bénédiction), éclairs (Accélération, Distorsion temporelle, Séisme), entailles (Lame furtive).
- **Tremblement d'écran** : explosions, Écrasement, Secousse, Séisme et coups critiques.
- **Mort** : fumée et âme lumineuse qui s'élève.

### Effets d'état (« états spéciaux » du doc)

Empoisonné (dégâts à chaque tour) · Ralenti (délais ×1,5) · Surexcité (délais ×0,7) · Protégé (bouclier qui absorbe les dégâts) · Enragé (+50 % de dégâts infligés, +20 % subis).

### Pouvoirs divins (actions de player)

Chaque équipe gagne **1 énergie à chaque tour de l'un de ses personnages** (6 au maximum). Les pouvoirs ne terminent pas le tour.

| Pouvoir                   | Coût | Effet                                                       |
| ------------------------- | ---- | ----------------------------------------------------------- |
| Distorsion temporelle     | 3    | avance de 25 le tour d'un allié, ou retarde de 25 celui d'un ennemi |
| Séisme                    | 4    | soulève une case basse de 2 niveaux, ou effondre une case haute de 2, sans jamais séparer les combattants |
| Bénédiction               | 5    | soigne toute l'équipe                                       |

### IA

`ai.ts` note chaque couple action/cible :
- dégâts attendus, avec un bonus pour les éliminations ;
- tirs alliés, fortement pénalisés ;
- soins utiles (PV réellement manquants) ;
- valeur des effets d'état : bouclier seulement sur un allié blessé, buffs seulement près d'un ennemi ;
- actions combinées disponibles sur sa case, ou sur celle d'un allié où elle peut se rendre.

Si aucune action ne vaut le coup, l'IA cherche la case accessible d'où elle aura la meilleure action, en tenant compte du coût du trajet. Elle utilise aussi les pouvoirs divins : Bénédiction quand l'équipe est blessée, Distorsion quand sa jauge est pleine.

### Interface

![Maquette de l'interface](docs/images/interface-combat.png)

Déjà en place :
- timeline (ordre de jeu et temps restant) ;
- barre d'actions avec raccourcis, recharges et infobulles ;
- fiche du personnage (stats, effets d'état) ;
- panneau des pouvoirs divins (jauge d'énergie) ;
- journal de combat ;
- surbrillances : cases accessibles, aperçu du chemin, portée, cibles, zone d'effet ;
- combos signalés dans la barre d'actions (« Combo ! » et halo turquoise quand on les utilise) ;
- jusqu'à 3 personnages par case, disposés en triangle et réduits pour garder le plateau lisible ;
- dans l'eau, les personnages pataugent (eau jusqu'aux mollets) ou nagent (immergés jusqu'au torse, avec une brasse animée) ;
- une commande tapée pendant une animation n'est pas perdue : elle s'exécute à la fin de l'animation ;
- écran de fin avec bouton « Rejouer ».

## Écarts entre le document de conception et le code

Le Google Doc n'a pas été mis à jour après plusieurs décisions. **Pour ces points, c'est le code qui fait foi.**

| Sujet | Document de conception | Code actuel |
| --- | --- | --- |
| **Plateau** | Grille hexagonale (texte), mais le schéma des sorts est en carré isométrique | **Isométrique 2D à cases carrées** (décision confirmée), 9×9, 4 directions |
| **Races / classes** | Races et classes satiriques à combiner | Supprimées. Chaque personnage a ses propres actions |
| **Statistiques** | PA, PM, Portée, Charisme et Intelligence sont barrés | Vitesse, Vitalité, Attaque et Défense (physiques et magiques), Chance. Pas de PA ni de PM : c'est la timeline qui rythme |
| **Déplacement** | Option 👍 « à chaque fois que c'est possible » | ✅ Implémenté |
| **Placement** | Aléatoire, à au moins 4 cases des ennemis | ✅ Implémenté |
| **Actions combinées** | Débloquées par l'empilement sur une case | ✅ Implémentées (spécialités + paires nommées) |
| **Relief** | Hauteurs et creux remplis d'eau, comme dans la version hexagonale | ✅ De -3 à +3, falaises, chutes ; les rochers ont été remplacés par le relief |
| **Eau** | « Les profondeurs sont uniquement décoratives » | ❌ Plus vrai : l'eau profonde ne se traverse qu'à la nage (nageurs, aquatiques), voir « L'eau » |
| **Lore** | Section « Univers étendu » entièrement barrée | — |
| **Stack** | THREE.js, jest, Parcel | PixiJS 8, `bun test`, Bun (pas de 3D) |

## Notes techniques

- **`@ghom/utils` ≥ 1.1.5 obligatoire.** Jusqu'à la 1.1.4, `@ghom/utils` (importé par `@ghom/booyah` 1.3) ajoutait `pick`, `omit` et `partition` à `Array.prototype` en propriétés **énumérables**. PixiJS 8 parcourt certains tableaux avec `for…in` et plantait au démarrage (`ClassRef is not a constructor`). C'est corrigé dans la 1.1.5, et le `package.json` force cette version via `overrides`.
- **Les anciennes images de `assets/images/`** (sprites placeholder, gauges, cercles) ne sont plus utilisées : tout le visuel est maintenant généré à partir du pixel art en texte.

## Feuille de route

La « coquille vide » du doc avance :
1. ✅ Des personnages (6)
2. ✅ Des ennemis et leur IA
3. ✅ Le moteur de combat
4. ❌ Les modes de jeu (rogue lite, aventure, arcade, libre)

Prochaines étapes possibles :
- [ ] Combos entre plus de 2 personnages, et davantage de paires nommées
- [ ] Écran de sélection d'équipe (pour l'instant, il faut passer par les paramètres d'URL)
- [ ] Multijoueur local (plusieurs équipes humaines) et 3-4 équipes dans l'interface (le moteur les gère déjà)
- [ ] Sons, calés sur les effets (impacts, explosions, pas)
- [ ] Progression des stats pendant un donjon (mode rogue lite)
- [ ] Mettre à jour le Google Doc avec les décisions ci-dessus

## Licence

Licence propriétaire restreinte, voir [`LICENCE`](LICENCE). © 2023 Camille Abella (GhomKrosmonaute).
