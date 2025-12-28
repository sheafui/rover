import fs from 'fs'
import brotliSize from 'brotli-size'
import esbuild, { BuildOptions, BuildResult } from 'esbuild'

(() => {
    if (!fs.existsSync(`./dist`)) {
        fs.mkdirSync(`./dist`, 0o744)
    }

    const files: string[] = fs.readdirSync(`./builds`)
    console.log(files)

    files.forEach(file => {
        bundleFile(file)
    })
})()

function bundleFile(file: string): void {

    const map: Record<string, () => void> = {
        'cdn.js': () => {
            build({
                entryPoints: [`builds/${file}`],
                outfile: `dist/${file}`,
                bundle: true,
                platform: 'browser',
                define: { CDN: 'true' },
            })
            build({
                entryPoints: [`builds/${file}`],
                outfile: `dist/${file.replace('.js', '.min.js')}`,
                bundle: true,
                minify: true,
                platform: 'browser',
                define: { CDN: 'true' },
            }).then(() => {
                outputSize('alpine-animation', `dist/${file.replace('.js', '.min.js')}`)
            })
        },
        'module.js': () => {
            build({
                entryPoints: [`builds/${file}`],
                outfile: `dist/${file.replace('.js', '.esm.js')}`,
                bundle: true,
                platform: 'neutral',
                mainFields: ['main', 'module'],
            })
            build({
                entryPoints: [`builds/${file}`],
                outfile: `dist/${file.replace('.js', '.cjs.js')}`,
                bundle: true,
                target: ['node10.4'],
                platform: 'node',
            })
        }
    }

    const fn = map[file]
    if (fn) fn()
    else console.error(`No build config for file: ${file}`)
}

function build(options: BuildOptions): Promise<BuildResult> {
    options.define ||= {}
    options.define['process.env.NODE_ENV'] = process.argv.includes('--production') ? `'production'` : `'development'`

    return esbuild.build({
        watch: process.argv.includes('--watch'),
        ...options,
    }).catch(() => process.exit(1))
}

async function outputSize(pkg: string, file: string): Promise<void> {
    const data = fs.readFileSync(file)
    const size = await brotliSize(data)
    console.log('\x1b[32m', `${pkg}: ${bytesToSize(size)}`)
}


function bytesToSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    if (bytes === 0) return 'n/a'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    if (i === 0) return `${bytes} ${sizes[i]}`
    return `${(bytes / 1024 ** i).toFixed(1)} ${sizes[i]}`
}
