import { Readable, Writable } from "node:stream"
import { writeSync } from "node:fs"
import { CliRenderEvents, createCliRenderer } from "../renderer.js"

const code = parseInt(process.argv[2] ?? "0", 10)
const mode = process.argv[3] ?? "idle"
const terminateDuringCleanup = () => {
  writeSync(process.stdout.fd, "cleanup terminating\n")
  process.exit(code)
}

// Reports raw mode off for the renderer's stdin. The resume row reports only after its suspend.
let reportRawMode = mode !== "signal-during-resume"
const createStdin = (report: string) => {
  const stdin = new Readable({ read() {} }) as NodeJS.ReadStream & {
    setRawMode: (enabled: boolean) => NodeJS.ReadStream
  }
  stdin.setRawMode = (enabled) => {
    if (enabled && mode === "setup-throw-exit") throw new Error("raw mode failed")
    if (!enabled && reportRawMode) writeSync(process.stdout.fd, report)
    return stdin
  }
  return stdin
}
const stdin = createStdin("raw mode disabled\n")
const appHandlesSignal = () => writeSync(process.stdout.fd, "app handled the signal\n")
if (mode === "signal-once-before") process.once("SIGTERM", appHandlesSignal)

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
if (mode === "signal-on-after") process.on("SIGTERM", appHandlesSignal)
// Only renderers handle the signal, so both leave raw mode before it ends the process.
const second =
  mode === "signal-two-renderers"
    ? await createCliRenderer({
        stdin: createStdin("second renderer left raw mode\n"),
        stdout: new Writable({ write: (_chunk, _encoding, done) => done() }) as NodeJS.WriteStream,
        bufferedOutput: "memory",
      })
    : null
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
} else if (mode.startsWith("signal-")) {
  if (mode === "signal-during-resume") {
    await renderer.suspend()
    reportRawMode = true
    void renderer.resume().catch(() => {})
  } else renderer.destroy()
  second?.destroy()
  process.kill(process.pid, "SIGTERM")
} else {
  if (mode === "destroy-first") renderer.destroy()
  process.exit(code)
}
