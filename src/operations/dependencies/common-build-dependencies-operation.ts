import fs from 'fs'
import _ from 'lodash'
import { PassThrough } from "stream"
import Yaml from 'yaml'
import { Codec } from "../../domain-model/system-config/codec"
import { DependenciesConfig } from "../../domain-model/system-config/dependencies-config"
import { FileReader } from "../../utils/file-reader"
import { TarUtils } from "../../utils/tar-utils"
import { VaultService } from "../../vault/vault-service"
import { Operations } from "../operation"
import { ArtifactoryService, ArtifactRef } from "../publish/artifactory-service"
import { DownloadLog } from './download-log-builder'
import { DownloadLogImpl } from './download-log-builder-impl'
export class CommonBuildDependenciesOperations implements Operations.Operation {
    constructor(private fileReader: FileReader, private vaultService: VaultService) { }
    execute(id: Operations.Id, receiver: Operations.OutputReceiver): Promise<void> {
        return this.fileReader.getFile(DependenciesConfig.FILE_PATH).then(config => {
            if (config) {
                console.log(`Processing ${DependenciesConfig.FILE_PATH}`)
                return this.process(Codec.toInstance(Yaml.parse(config.toString()), DependenciesConfig.Config), id)
            }
        })
    }

    process(config: DependenciesConfig.Config, id: Operations.Id): Promise<void> {
        console.log(`Executing download dependencies...`)
        const artifactsConfig = config.artifacts
        if (artifactsConfig) {
            const artifactoryService = new ArtifactoryService(this.vaultService)
            const handler = artifactsConfig.logFile ? new LogFileDownloadHandler(artifactsConfig.logFile, artifactoryService) : new NullDownloadHandler()
            return Promise.all(artifactsConfig.items.map(artifact => {
                return Promise.all(artifact.files.map(file => {
                    const ref = new ArtifactRef(artifact.path, artifact.remote || artifactsConfig.remote, artifact.repository || artifactsConfig.repository, artifact.revision, file.name)
                    const pathSegments = [artifactsConfig.toDir?.trim(), artifact.toDir?.trim(), file.toDir?.trim()].filter(s => { return s })
                    const tarGzSuffix = "tar.gz"

                    if (file.name.endsWith(tarGzSuffix)) {
                        pathSegments.push(file.rename || file.name.substring(0, file.name.length - (tarGzSuffix.length + 1)))
                    }
                    const path = pathSegments.join("/")
                    try {
                        fs.mkdirSync(path, { recursive: true })
                    } catch (e) { } // Silent due to possible parallellism class
                    if (file.name.endsWith(tarGzSuffix)) {
                        const stream = new PassThrough()
                        TarUtils.saveFiles(stream, path)
                        return artifactoryService.download(ref, stream).then(() => {
                            console.log(`Downloaded and extracted tar-file: ${file.name} into ${path}`)
                            return handler.addRef(ref, path)
                        })
                    } else {
                        const targetFile = `${path}/${file.rename || file.name}`
                        const stream = fs.createWriteStream(targetFile)
                        return artifactoryService.download(ref, stream).then(() => {
                            console.log(`Downloaded file ${file.name} to ${targetFile}`)
                            return handler.addRef(ref, targetFile)
                        })
                    }
                })).then(() => { return Promise.resolve() })
            })).then(() => {
                return handler.generateFile()
            })
        } else {
            return Promise.resolve()
        }
    }
}

interface DownloadLogHandler {
    addRef(ref: ArtifactRef, localFilePath: string): Promise<void>
    generateFile(): Promise<void>
}

class LogFileDownloadHandler implements DownloadLogHandler {
    private builder = new DownloadLogImpl()

    constructor(private logFile: string, private readonly artifactService: ArtifactoryService) { }

    addRef(ref: ArtifactRef, localFilePath: string): Promise<void> {
        return this.artifactService.getMetaData(ref).then(metaData => {
            const fileEntry = new DownloadLog.File(localFilePath, metaData.sha256, metaData.properties)
            this.builder.addFile(fileEntry)
            return Promise.resolve()
        })
    }
    generateFile(): Promise<void> {
        try {
            const path = _.initial(this.logFile.split("/")).join("/").trim()
            if (path) {
                fs.mkdirSync(path, { recursive: true })
            }
            fs.writeFileSync(this.logFile, this.builder.createLogContent())
            console.log(`Wrote download-logfile: ${this.logFile}`)
            return Promise.resolve()
        } catch (e) {
            return Promise.reject(new Error(`Could not write download logFile ${this.logFile}: ${e}`))
        }
    }

}

class NullDownloadHandler implements DownloadLogHandler {
    addRef(ref: ArtifactRef): Promise<void> {
        return Promise.resolve()
    }
    generateFile(): Promise<void> {
        return Promise.resolve()
    }
}
