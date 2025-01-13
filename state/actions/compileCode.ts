import toast from 'react-hot-toast'
import Router from 'next/router'

import state from '../index'
import { saveFile } from './saveFile'
import { decodeBinary } from '../../utils/decodeBinary'
import { ref } from 'valtio'
import * as esbuild from "esbuild-wasm";
import * as Path from 'path'

/* compileCode sends the code of the active file to compile endpoint
 * If all goes well you will get base64 encoded wasm file back with
 * some extra logging information if we can provide it. This function
 * also decodes the returned wasm and creates human readable WAT file
 * out of it and store both in global state.
 */
export const compileCode = async (activeId: number) => {
  // Save the file to global state
  saveFile(false, activeId)

  const file = state.files[activeId]

  // Bail out if we're already compiling
  if (state.compiling) {
    // if compiling is ongoing return // TODO Inform user about it.
    return
  }
  // Set loading state to true
  state.compiling = true
  state.logs = []

  if (file.name.endsWith('.wat')) {
    return compileWat(activeId)
  }

  if (file.name.endsWith('.js') || file.name.endsWith('.ts')) {
    return compileJs(activeId)
  }

  return compileC(activeId)
}

export const compileWat = async (activeId: number) => {
  const file = state.files[activeId]
  try {
    const wabt = await (await import('wabt')).default()
    const module = wabt.parseWat(file.name, file.content);
    module.resolveNames();
    module.validate();
    const { buffer } = module.toBinary({
      log: false,
      write_debug_names: true,
    });

    file.compiledContent = ref(buffer)
    file.lastCompiled = new Date()
    file.compiledValueSnapshot = file.content
    file.compiledWatContent = file.content
    file.compiledExtension = 'wasm'

    toast.success('Compiled successfully!', { position: 'bottom-center' })
    state.logs.push({
      type: 'success',
      message: `File ${state.files?.[activeId]?.name} compiled successfully. Ready to deploy.`,
      link: Router.asPath.replace('develop', 'deploy'),
      linkText: 'Go to deploy'
    })
  } catch (err) {
    console.log(err)
    let message = "Error compiling WAT file!"
    if (err instanceof Error) {
      message = err.message
    }
    state.logs.push({
      type: 'error',
      message
    })
    toast.error(`Error occurred while compiling!`, { position: 'bottom-center' })
    file.containsErrors = true
  }
  state.compiling = false
}

export const compileC = async (activeId: number) => {
  const file = state.files[activeId]

  if (!process.env.NEXT_PUBLIC_COMPILE_API_ENDPOINT) {
    throw Error('Missing env!')
  }

  try {
    file.containsErrors = false
    let res: Response
    try {
      res = await fetch(process.env.NEXT_PUBLIC_COMPILE_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          output: 'wasm',
          compress: true,
          strip: state.compileOptions.strip,
          files: [
            {
              type: 'c',
              options: state.compileOptions.optimizationLevel || '-O2',
              name: file.name,
              src: file.content
            }
          ]
        })
      })
    } catch (error) {
      throw Error('Something went wrong, check your network connection and try again!')
    }
    const json = await res.json()
    state.compiling = false
    if (!json.success) {
      const errors = [json.message]
      if (json.tasks && json.tasks.length > 0) {
        json.tasks.forEach((task: any) => {
          if (!task.success) {
            errors.push(task?.console)
          }
        })
      }
      throw errors
    }
    try {
      // Decode base64 encoded wasm that is coming back from the endpoint
      const bufferData = await decodeBinary(json.output)

      // Import wabt from and create human readable version of wasm file and
      // put it into state
      const ww = await (await import('wabt')).default()
      const myModule = ww.readWasm(new Uint8Array(bufferData), {
        readDebugNames: true
      })
      myModule.applyNames()

      const wast = myModule.toText({ foldExprs: false, inlineExport: false })

      file.compiledContent = ref(bufferData)
      file.lastCompiled = new Date()
      file.compiledValueSnapshot = file.content
      file.compiledWatContent = wast
      file.compiledExtension = 'wasm'
    } catch (error) {
      throw Error('Invalid compilation result produced, check your code for errors and try again!')
    }

    toast.success('Compiled successfully!', { position: 'bottom-center' })
    state.logs.push({
      type: 'success',
      message: `File ${state.files?.[activeId]?.name} compiled successfully. Ready to deploy.`,
      link: Router.asPath.replace('develop', 'deploy'),
      linkText: 'Go to deploy'
    })
  } catch (err) {
    console.log(err)

    if (err instanceof Array && typeof err[0] === 'string') {
      err.forEach(message => {
        state.logs.push({
          type: 'error',
          message
        })
      })
    } else if (err instanceof Error) {
      state.logs.push({
        type: 'error',
        message: err.message
      })
    } else {
      state.logs.push({
        type: 'error',
        message: 'Something went wrong, come back later!'
      })
    }

    state.compiling = false
    toast.error(`Error occurred while compiling!`, { position: 'bottom-center' })
    file.containsErrors = true
  }
}

function customResolver(tree: Record<string, string>): esbuild.Plugin {
  const map = new Map(Object.entries(tree))
  return {
    name: 'example',
    setup: (build: esbuild.PluginBuild) => {
      build.onResolve({ filter: /.*/, }, (args: esbuild.OnResolveArgs) => {
        if (args.kind === 'entry-point') {
          return { path: '/' + args.path }
        }
        if (args.kind === 'import-statement') {
          const dirname = Path.dirname(args.importer)
          const basePath = Path.join(dirname, args.path)
          // If extension is specified, try that path directly
          if (Path.extname(args.path)) {
            return { path: basePath }
          }
          // If no extension specified, try .ts and .js in order
          const extensions = ['.ts', '.js']
          for (const ext of extensions) {
            const pathWithExt = basePath + ext
            if (map.has(pathWithExt.replace(/^\//, ''))) {
              return { path: pathWithExt }
            }
          }
        }
        throw Error('not resolvable')
      })

      build.onLoad({ filter: /.*/ }, (args: esbuild.OnLoadArgs) => {
        const path = args.path.replace(/^\//, '')
        if (!map.has(path)) {
          throw Error('not loadable')
        }
        const ext = Path.extname(path)
        const contents = map.get(path)!
        const loader = (ext === '.ts') ? 'ts' :
          (ext === '.js') ? 'js' :
            'default'
        return { contents, loader }
      })
    }
  }
}

function validateExportContent(content: string): void {
  const words = content
    .split(",")
    .map((word) => word.trim())
    .filter((word) => word.length > 0);
  if (!words.includes("Hook")) {
    throw Error("Invalid export: Hook is required");
  }
  if (!words.every((word) => word === "Hook" || word === "Callback")) {
    throw Error("Invalid export: Only Hook and Callback are allowed");
  }
}


function clean(content: string): string {
  const importPattern = /^\s*import\s+.*?;\s*$/gm;
  const exportPattern = /^\s*export\s*\{([^}]*)\};?\s*$/gm;
  const commentPattern = /^\s*\/\/.*$/gm;

  const match = exportPattern.exec(content);
  if (!match) {
    throw Error("Invalid export: No export found");
  }
  const exportContent = match[1];
  validateExportContent(exportContent);
  let cleanedCode = content.replace(importPattern, "");
  cleanedCode = cleanedCode.replace(exportPattern, "");
  cleanedCode = cleanedCode.replace(commentPattern, "");
  cleanedCode = cleanedCode.trim();
  return cleanedCode;
}

export const compileJs = async (activeId: number) => {
  const file = state.files[activeId]

  if (!process.env.NEXT_PUBLIC_JS_COMPILE_API_ENDPOINT) {
    throw Error('Missing env!')
  }

  const tree = state.files.reduce((prev, file) => {
    prev[file.name] = file.content
    return prev
  }, {} as Record<string, string>)

  if (!(window as any).isEsbuildRunning) {
    (window as any).isEsbuildRunning = true
    await esbuild.initialize({
      wasmURL: 'https://unpkg.com/esbuild-wasm/esbuild.wasm',
    })
  }

  try {
    const result = await esbuild.build({
      entryPoints: [file.name],
      bundle: true,
      format: "esm",
      write: false,
      plugins: [customResolver(tree)]
    })

    let compiledContent = clean(result.outputFiles?.[0].text)
    file.language = 'javascript'
    const res = await fetch(process.env.NEXT_PUBLIC_JS_COMPILE_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        output: 'bc',
        compress: true,
        strip: true,
        files: [
          {
            type: 'js',
            options: '-O3',
            name: file.name,
            src: compiledContent
          }
        ]
      })
    })

    const json = await res.json()

    state.compiling = false
    if (!json.success) {
      const errors = [json.message]
      if (json.tasks && json.tasks.length > 0) {
        json.tasks.forEach((task: any) => {
          if (!task.success) {
            errors.push(task?.console)
          }
        })
      }
      throw errors
    }

    if (!json.success) {
      throw new Error(json.error || 'Failed to compile JavaScript')
    }

    const binary = Buffer.from(Buffer.from(await decodeBinary(json.output)).toString(), 'hex')
    file.compiledContent = ref(binary)
    file.lastCompiled = new Date()
    file.compiledValueSnapshot = file.content
    file.compiledWatContent = compiledContent
    file.compiledExtension = 'js'

    console.log(file)

    toast.success('Compiled successfully!', { position: 'bottom-center' })
    state.logs.push({
      type: 'success',
      message: `File ${state.files?.[activeId]?.name} compiled successfully. Ready to deploy.`,
      link: Router.asPath.replace('develop', 'deploy'),
      linkText: 'Go to deploy'
    })
  } catch (err) {
    console.log(err)

    if (err instanceof Array && typeof err[0] === 'string') {
      err.forEach(message => {
        state.logs.push({
          type: 'error',
          message
        })
      })
    } else if (err instanceof Error) {
      state.logs.push({
        type: 'error',
        message: err.message
      })
    } else {
      state.logs.push({
        type: 'error',
        message: 'Something went wrong, come back later!'
      })
    }

    state.compiling = false
    toast.error(`Error occurred while compiling!`, { position: 'bottom-center' })
    file.containsErrors = true
  }
}
