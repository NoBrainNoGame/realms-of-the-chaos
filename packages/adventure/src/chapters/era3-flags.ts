import { type FlagSpec, registerFlags } from "../flags"

// The flags of era III (L'Âge du Verre), from the README of the era and the
// chapters 13 to 18. The shared registry is extended at import time, and only
// where a key is still free: era II (or the integration) may own some of them
// already (`ile_sauvee`, `lacunaire.forme`, `transformation.2`...), and then
// its own spec stays.

const bool: FlagSpec = { default: false }
const count = (max: number, min = 0): FlagSpec => ({ default: 0, min, max })
const text = (...values: string[]): FlagSpec => ({
  default: values[0],
  values,
})

const ERA3_FLAGS: Record<string, FlagSpec> = {
  // inherited from the earlier eras
  ile_sauvee: text("aucune", "sauge", "lusse", "strates"),
  "lacunaire.forme": text(
    "aucune",
    "ondine",
    "aiguille",
    "squale",
    "miroir",
    "recif",
    "brume",
  ),
  "transformation.2": text("aucune", "A", "B"),
  journal_nerea: text("aucun", "porte", "garde"),
  "confiance.eva": count(5, -5),
  "confiance.squalor": count(5, -5),
  "confiance.gorr": count(5, -5),
  "confiance.chroniqueur": count(5, -5),

  // proper to the era (README)
  questions_rouvertes: count(4),
  mine_arretee: bool,
  carte_des_lacunes: bool,
  brutus_portes_ouvertes: bool,
  vitrelle_evacues: count(6),
  cristal_rendu: text("aucun", "premier", "lien", "gorr"),
  "cristaux.extraits": count(99),
  chroniqueur_rejoint: bool,
  gorr_question: bool,
  merlin_convaincu: bool,
  "transformation.3": text("aucune", "A", "B"),
  "nom.propositions": count(9),
  "nom.propositions.lyra": bool,
  "nom.propositions.gorr": bool,
  "nom.propositions.merlin": bool,
  premier_cristal: text("aucun", "sauve", "perdu"),

  // chapter 13
  "habitants.visites": count(5),
  "habitants.reponses": count(5),
  sablier_fini: bool,
  lampadaire_brise: bool,
  voix_qui_demande: bool,
  gardes_epargnes: bool,
  // chapter 14
  "traces.chroniqueur": count(9),
  reconstitution_fidele: bool,
  fonds_conformes: bool,
  tobin_rouvert: bool,
  veillee15: count(3),
  veillee16: count(3),
  veillee17: count(3),
  veillee18: count(3),
  gel_lu: bool,
  six_cristaux: bool,
  confrontation_close: bool,
  // chapter 15
  lacune_mine: text("aucune", "recousue", "elargie", "habitee"),
  garance_confiante: bool,
  // chapter 16
  gorr_dort: bool,
  qui_va_vers_gorr: text(
    "aucun",
    "heros",
    "lyra",
    "chroniqueur",
    "eva",
    "squalor",
  ),
  pylones: text("aucun", "desaccordes", "extraits"),
  // chapter 17
  duel_argumente: count(9),
  lumiere_tardive: bool,
  duel_clos: bool,
  mesure_jouee: bool,
  // chapter 18
  fissures_nombre: count(99),
  rendre_ensemble: bool,
  corin_evacue: bool,
}

registerFlags(ERA3_FLAGS)
