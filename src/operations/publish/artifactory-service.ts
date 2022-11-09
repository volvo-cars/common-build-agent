import axios, { AxiosError } from "axios"
import _ from "lodash"
import { Readable, Writable } from "stream"
import { DependencyRef } from "../../domain-model/system-config/dependency-ref"
import { VaultService } from "../../vault/vault-service"

export class ArtifactRef {
  constructor(
    public readonly path: string,
    public readonly remote: string,
    public readonly repository: string,
    public readonly revision: string,
    public readonly name: string
  ) { }

  toString(): string {
    return `${this.repository}/${this.path}/${this.revision}/${this.name}`
  }
}
export class PublishedContent {
  constructor(
    public readonly url: string,
    public readonly size: number
  ) { }
}

export class ArtifactFileMetaData {
  constructor(
    public readonly sha256: string,
    public readonly properties: Map<string, string>
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

  private createQuery(repository: string, path: DependencyRef.ArtifactPath, revision: string, name: string): string {
    return `items.find({
        "repo":{"$eq": "${repository}"},
        "path":{"$eq": "${path}/${revision}"},
        "name":{"$eq": "${name}"},
        "type":{"$eq": "file"}
       }).include("*", "property.*")`
  }

  getMetaData(ref: ArtifactRef): Promise<ArtifactFileMetaData> {
    return this.createHeaders(ref.remote, { "Content-Type": "text/plain" }).then(headers => {
      const url = `https://${ref.remote}/artifactory/api/search/aql`
      const query = this.createQuery(ref.repository, ref.path, ref.revision, ref.name)
      return axios.post(url, query, { headers: headers }).then(response => {
        const data: ArtifactoryQueryResponse = response.data
        const results = data.results
        if (results.length === 1) {
          const properties = new Map<string, string>()
          const result = results[0]
          result.properties?.forEach(prop => {
            properties.set(prop.key, prop.value)
          })
          properties.delete("repository.id") // Internal use only.
          return Promise.resolve(new ArtifactFileMetaData(result.sha256, properties))
        } else if (results.length === 0) {
          return Promise.reject(new Error(`The artifact-ref ${ref} matched no files.`))
        } else {
          return Promise.reject(new Error(`The artifact-ref ${ref} matched multiple (${results.length}) files.`))
        }
      })
    })

  }

  download(ref: ArtifactRef, out: Writable): Promise<void> {
    return this.createHeaders(ref.remote, { "Content-Type": "text/plain" }).then(headers => {
      const url = `https://${ref.remote}/artifactory/${ref.repository}/${ref.path}/${ref.revision}/${ref.name}`
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
      const url = `https://${ref.remote}/artifactory/${ref.repository}/${ref.path}/${ref.revision}/${ref.name}`
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

type ArtifactoryQueryResponse = {
  results: InternalArtifactoryArtifact[]
}

type InternalArtifactoryArtifact = {
  repo: string,
  path: string,
  name: string,
  sha256: string,
  properties?: InternalArtifactoryArtifactProperty[]
}

type InternalArtifactoryArtifactProperty = {
  key: string,
  value: any
}