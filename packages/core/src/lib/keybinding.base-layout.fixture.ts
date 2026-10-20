// Conformance vectors for the Kitty base-layout fallback, shared by Core's key-binding lookup and
// @opentui/keymap's registerBaseLayoutFallback(): (typed key, base-layout codepoint, modifiers) -> matched
// bindings, in lookup order. Only a typed key that is one non-ASCII character falls back.
export const baseLayoutBindings = "ctrl+- ctrl+2 ctrl+c ctrl+d ctrl+g ctrl+q ctrl+z ctrl+ㅎ j l meta+a".split(" ")

export const baseLayoutVectors = [
  ["ㅊ", 99, "ctrl", ["ctrl+c"]], // Korean
  ["с", 99, "ctrl", ["ctrl+c"]], // Russian
  ["ψ", 99, "ctrl", ["ctrl+c"]], // Greek
  ["ב", 99, "ctrl", ["ctrl+c"]], // Hebrew
  ["ؤ", 99, "ctrl", ["ctrl+c"]], // Arabic
  ["ß", 45, "ctrl", ["ctrl+-"]], // German: a Latin letter, but not ASCII
  ["é", 50, "ctrl", ["ctrl+2"]], // AZERTY: a Latin letter, but not ASCII
  ["\u0080", 99, "ctrl", ["ctrl+c"]],
  ["𠀀", 99, "ctrl", ["ctrl+c"]],
  ["ㅊ", 67, "ctrl", ["ctrl+c"]],
  ["ㅊ", undefined, "ctrl", []],
  ["ㅎ", 103, "ctrl", ["ctrl+ㅎ", "ctrl+g"]],
  ["ㅓ", 106, "", ["j"]],
  ["ㅣ", 108, "", ["l"]],
  ["ф", 97, "meta", ["meta+a"]],
  ["j", 99, "ctrl", []], // Dvorak
  ["e", 100, "ctrl", []], // Dvorak
  [";", 122, "ctrl", []], // Dvorak
  ["h", 106, "", []],
  ["a", 113, "ctrl", []], // AZERTY
] as const
