import { For, Show, Suspense, createEffect, createSignal } from "solid-js"
import { convertFileSrc, invoke } from "@tauri-apps/api/tauri"
import { BaseDirectory, appConfigDir } from '@tauri-apps/api/path'
import { createDir, exists, writeBinaryFile } from "@tauri-apps/api/fs"
import { 
  Dialog, 
  DialogTrigger, 
  DialogContent, 
  DialogHeader, 
  DialogTitle } from "./components/ui/dialog"
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger
} from "~/components/ui/menubar"
import { Input } from "./components/ui/input"
import { Toaster, showToast } from "./components/ui/toast"
import { Separator } from "./components/ui/separator"
// import //

type Metadata = {
  FileName: string
  FileSize: string
  FileType: string
  FileTypeExtension: string
  ImageDescription: string
}
type ImageMetadata = Metadata[]

function App() {
  const [exif, setExif] = createSignal(true)
  const [urllist, setUrllist] = createSignal([""])
  const [file, setFile] = createSignal<File[]>([])

  createEffect(async () => {
    const isDataesit: boolean = await exists('config', { dir: BaseDirectory.AppData })
    if (!isDataesit) {
      await createDir('config', { dir: BaseDirectory.AppData, recursive: true })
    }
    const is_exif_install: boolean = await invoke("is_exif_installed")
    if (!is_exif_install) {
      setExif(false)
    }
    Convertfile()
  })

  async function Convertfile() {
    try {
      const cfgP = await appConfigDir()
      const filePaths: string[] = await invoke("getfile", { path: cfgP })
      const picUrls: string[] = filePaths.map((filePath) => convertFileSrc(filePath))
      setUrllist(picUrls)
    } catch (error) {
      console.error("Error fetching and converting files:", error)
    }
  }
  function Uploadhandler(e: Event) {
    e.preventDefault()
    const target = e.target as HTMLInputElement
    if (!target.files) return
    setFile([...target.files])

    const formData = new FormData()
    file().forEach(async (file, index) => {
      formData.append(`file${index}`, file)
      await writeBinaryFile(`${file.name}`, await file.arrayBuffer(), { dir: BaseDirectory.AppData }).catch((err) => console.log(err))
      window.location.reload()
    })
  }

  function urlTopath(url: string) {
    return decodeURIComponent(url).replace('https://asset.localhost/', '').replace(/%5C/g, '\\')
  }

  return (
    <Show when={exif()} fallback={
      <><p>please download exiftool</p><a rel="noopener" href="https://exiftool.org/" class="underline text-blue-600" target="_blank">here</a></>
    }>
      <main>
        <Toaster />
        <div>
          <Menubar class="bg-blue-300">
            <MenubarMenu>
              <MenubarTrigger class="hover:bg-slate-300 ease-in-out duration-100 bg-slate-100">File</MenubarTrigger>
              <MenubarContent>
                <MenubarItem>
                  <input type="file" onChange={Uploadhandler}>
                    New Image...
                  </input>
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem>
                  Made by <a href="https://github.com/Th4phat" target="_blank" class="underline">@Th4phat</a>
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
        </div>
        <div class="grid grid-cols-1 gap-4 p-4 lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2">
          <For each={urllist()}>
            {url => {
              const [password, setPassword] = createSignal("")
              const [dispassword, setdis_password] = createSignal("")
              const handleChange = (e: Event) => {
                const target = e.target as HTMLInputElement
                setPassword(target.value)
              }
              async function handlePasswordSubmit(e: Event) {
                e.preventDefault() // no password
                const res = await invoke("put_pass_in_img", { pass: password(), path: urlTopath(url) })

                if (res) {
                  showToast({
                    title: "sucess!",
                    variant: "success"
                  })
                } else {
                  showToast({
                    title: "fail to add password",
                    variant: "error"
                  })
                }
              }
              async function showPass() {
                const json_res: ImageMetadata = await invoke("read_img", { path: urlTopath(url) })
                setdis_password(json_res[0].ImageDescription)
              }
              return (
                <Dialog>
                  <DialogTrigger onClick={showPass}>
                    <Suspense fallback={<p>loading...</p>}>
                      <div class="p-4 bg-cyan-400 flex justify-center items-center">
                        <img src={url} loading="lazy" class="hover:scale-105 ease-in-out duration-300" />
                      </div>
                    </Suspense>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle class="text-bold">Change or View password in this image</DialogTitle>
                    </DialogHeader>
                    <div>
                      <form onSubmit={handlePasswordSubmit}>
                        <Input type="password" value={password()} onInput={handleChange} class="my-4" min={5} max={20} />
                        <Separator class="my-2" />
                        {dispassword() ? <h2 class="">{dispassword()}</h2> : <p>No password in this file yet</p>}
                      </form></div>
                  </DialogContent>
                </Dialog>
              )
            }}
          </For>
        </div>
      </main>
    </Show>
  )
}

export default App
