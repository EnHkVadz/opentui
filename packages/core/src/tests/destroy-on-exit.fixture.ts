import { Readable } from "node:stream"
import { writeSync } from "node:fs"
import { CliRenderEvents, createCliRenderer } from "../renderer.js"

const code = parseInt(process.argv[2] ?? "0", 10)
const mode = process.argv[3] ?? "idle"
const terminateDuringCleanup = () => {
  writeSync(process.stdout.fd, "cleanup terminating\n")
  process.exit(code)
}

const stdin = new Readable({ read() {} }) as NodeJS.ReadStream & {
  setRawMode: (enabled: boolean) => NodeJS.ReadStream
}
stdin.setRawMode = (enabled) => {
  if (enabled && mode === "setup-throw-exit") throw new Error("raw mode failed")
  if (!enabled) writeSync(process.stdout.fd, "raw mode disabled\n")
  return stdin
}

const renderer = await createCliRenderer({
  width: 20,
  height: 10,
  stdin,
  stdout: process.stdout,
  screenMode: "alternate-screen",
  bufferedOutput: "stdout",
  remote: true,
  onDestroy: mode === "on-destroy-exit" ? terminateDuringCleanup : undefined,
}).catch(() => process.exit(code))
if (mode === "destroy-listener-exit") renderer.on(CliRenderEvents.DESTROY, terminateDuringCleanup)
if (mode === "root-destroyed-exit") renderer.root.on("destroyed", terminateDuringCleanup)
await renderer.idle()
if (mode === "session-error-exit") {
  renderer.on(CliRenderEvents.DESTROY, terminateDuringCleanup)
  process.stdout.emit("error", new Error("terminal gone"))
  await new Promise(() => {})
}

process.on("exit", () => {
  renderer.destroy()
})

if (mode === "during-render") {
  renderer.setFrameCallback(async () => {
    process.exit(code)
  })
  renderer.start()
} else {
  if (mode === "destroy-first" || mode === "signal-after-destroy") renderer.destroy()
  if (mode === "signal-after-destroy") process.kill(process.pid, "SIGTERM")
  else process.exit(code)
}
