import type { KeyEvent, Renderable } from "@opentui/core"
import type { Keymap } from "../../index.js"

const BASE_LAYOUT_FALLBACK_RESOURCE = Symbol("keymap:base-layout-fallback")

function getBaseLayoutKeyName({ name: typedName, baseCode }: KeyEvent): string | undefined {
  if (!/^[^\x00-\x7f]$/u.test(typedName) || baseCode === undefined || baseCode < 32 || baseCode === 127) {
    return undefined
  }

  try {
    const name = String.fromCodePoint(baseCode)

    if (name.length === 1 && name >= "A" && name <= "Z") {
      return name.toLowerCase()
    }

    return name
  } catch {
    return undefined
  }
}

/**
 * Falls back to the event's base-layout key, as Core's matcher does, when the typed key is one non-ASCII
 * character: Korean Ctrl+ㅊ matches `ctrl+c`, but Dvorak Ctrl+J stays Ctrl+J.
 */
export function registerBaseLayoutFallback(keymap: Keymap<Renderable, KeyEvent>): () => void {
  return keymap.acquireResource(BASE_LAYOUT_FALLBACK_RESOURCE, () => {
    return keymap.appendEventMatchResolver((event, ctx) => {
      const name = getBaseLayoutKeyName(event)
      if (!name) {
        return undefined
      }

      return [
        ctx.resolveKey({
          name,
          ctrl: event.ctrl,
          shift: event.shift,
          meta: event.meta,
          super: event.super ?? false,
          hyper: event.hyper || undefined,
        }),
      ]
    })
  })
}
