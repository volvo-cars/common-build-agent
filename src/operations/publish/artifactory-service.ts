import axios, { AxiosError } from "axios"
import _ from "lodash"
import { Readable, Writable } from "stream"
import { DependencyRef } from "../../domain-model/system-config/dependency-ref"
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
    private vault: VaultService
  ) { }

  private createHeaders(remote: string, preDefHeaders?: Record<string, string>): Promise<any> {
    return this.vault.getSecret(`csp/common-build/artifactory-${remote}`).then(token => {
      return _.merge({
        "X-JFrog-Art-Api": token,
      }, preDefHeaders || {})
    })
  }

  download(ref: ArtifactRef, out: Writable): Promise<void> {
    return this.createHeaders(ref.remote, { "Content-Type": "test/plain" }).then(headers => {
      const url = `https://${ref.remote}/artifactory/${ref.repository}/${ref.path}/${ref.name}`
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
      }).catch((e: AxiosError) => {
        if (e.response?.status === 404) {
          return Promise.reject(new Error(`Could not find artifact: ${url}`))
        }
      })
    })
  }

  publish(ref: ArtifactRef, content: Readable): Promise<PublishedContent> {
    return this.createHeaders(ref.remote, { "Content-Type": "application/octet-stream" }).then(headers => {
      const url = `https://${ref.remote}/artifactory/${ref.repository}/${ref.path}/${ref.name}`
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
  }
}