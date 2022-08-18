import axios, { Axios } from "axios"
import _ from "lodash"
import { Readable, Writable } from "stream"
import { DependencyRef } from "../../domain-model/system-config/dependency-ref"
import { ServiceConfig } from "../../domain-model/system-config/service-config"
import { VaultService } from "../../vault/vault-service"

export class ArtifactRef {
  constructor(
    public readonly path: DependencyRef.ArtifactPath,
    public readonly remote: DependencyRef.ArtifactRemote,
    public readonly repository: DependencyRef.ArtifactRepository,
    public readonly name: string
  ) { }
}
export class PublishedContent {
  constructor(
    public readonly url: string,
    public readonly size: number
  ) { }
}

export class ArtifactoryService {
  constructor(
    private configs: ServiceConfig.ArtifactoryStorage[],
    private vault: VaultService
  ) { }

  private findStorage(id: string): ServiceConfig.ArtifactoryStorage | undefined {
    return this.configs.find((config) => {
      return config.id === id
    })
  }

  private createHeaders(tokenName: string, preDefHeaders?: Record<string, string>): Promise<any> {
    return this.vault.getSecret(tokenName).then(token => {
      return _.merge({
        "X-JFrog-Art-Api": token,
      }, preDefHeaders || {})
    })
  }

  download(ref: ArtifactRef, out: Writable): Promise<void> {
    const config = this.findStorage(ref.remote)
    if (config) {
      return this.createHeaders(config.token, { "Content-Type": "test/plain" }).then(headers => {
        const url = `https://${config.host}/artifactory/${ref.repository}/${ref.path}/${ref.name}`
        return axios.get(url, {
          headers: headers,
          responseType: "stream"
        }).then(response => {
          if (response.status >= 200 && response.status < 300) {
            return new Promise<void>((resolve, reject) => {
              response.data.pipe(out)
              out.on('error', e => {
                reject(e)
              })
              out.on('close', () => {
                resolve()
              })
            })
          } else {
            return Promise.reject(new Error(`Could not publish to ${url}. Response: ${response.status}`))
          }
        })
      })
    } else {
      return Promise.reject(new Error(`Could not find artifactory: ${ref.remote}`))
    }
  }

  publish(
    ref: ArtifactRef,
    content: Readable): Promise<PublishedContent> {
    const config = this.findStorage(ref.remote)
    if (config) {
      return this.createHeaders(config.token, { "Content-Type": "application/octet-stream" }).then(headers => {
        const url = `https://${config.host}/artifactory/${ref.repository}/${ref.path}/${ref.name}`
        console.log(`Publishing to ${url}`)
        return axios
          .put(url, content, {
            headers: headers,
            responseType: "stream",
            maxContentLength: Number.MAX_SAFE_INTEGER,
            maxBodyLength: Number.MAX_SAFE_INTEGER,
          })
          .then((response) => {
            if (response.status >= 200 && response.status < 300) {
              return new PublishedContent(url, 1000)
            } else {
              return Promise.reject(new Error(`Could not publish to ${url}. Response: ${response.status}`))
            }
          })
      })
    } else {
      return Promise.reject(
        new Error(`Could not find config for remote: ${ref.remote}`)
      )
    }
  }
}