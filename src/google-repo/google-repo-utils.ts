import { execSync } from "child_process"
import fs from "fs"
import _ from 'lodash'
import os from 'os'
import { DefaulXmlExtractor } from "../operations/dependencies/default-xml-extractor"
import { VaultService } from "../vault/vault-service"

export class GoogleRepoSSHId {
  constructor(public readonly vaultKeyPrefix: string, public sshHost: string) { }
}

class GoogleRepoConfig {
  constructor(public readonly id: string, public readonly host: string, public readonly sshUser: string, public readonly sshKey: string) { }
}

export class GoogleRepoUtils {
  constructor(private vaultService: VaultService) { }

  private vaultIdRewrite: Record<string, string> = {
    "csp-gerrit-ssh": "csp-gerrit"
  }

  downloadRepo(path: string, extracts: DefaulXmlExtractor.HostExtract[]): Promise<void> {
    console.log(`Processing google-repo on ${path}: ${extracts.join(", ")}`)

    const extractHosts = (protocol: DefaulXmlExtractor.Protocol): string[] => {
      return extracts.filter(e => { return e.protocol === protocol }).map(e => { return e.host })
    }

    return Promise.all([this.preparaSSHHosts(extractHosts(DefaulXmlExtractor.Protocol.ssh)), this.preparaHTTPSHosts(extractHosts(DefaulXmlExtractor.Protocol.https))]).then(() => {
      this.repoInit(path)
      this.repoSync()
    }).catch(e => {
      console.log(`Google repo error: ${e}`)
      throw e
    })
  }

  private preparaSSHHosts(sshHosts: string[]): Promise<void> {
    return Promise.all(sshHosts.map(host => {
      const parts = host.split(".")
      const id = _.first(parts)
      if (id) {
        const idKey = this.vaultIdRewrite[id] || id
        return Promise.all(["user", "ssh-key"].map(suffix => {
          const secretKey = `csp/common-build/${idKey}-${suffix}`
          return this.vaultService.getSecret(secretKey)
        })).then(([sshUser, sshKey]) => {
          return new GoogleRepoConfig(id, host, sshUser, sshKey)
        })
      } else {
        return Promise.resolve(undefined)
      }
    })).then(configs => {
      const sshConfigDir = `${os.homedir()}/.ssh`
      if (!fs.existsSync(sshConfigDir)) {
        fs.mkdirSync(sshConfigDir, { recursive: true })
      }
      configs.forEach(config => {
        if (config) {
          const keyFileName = `${sshConfigDir}/id_rsa_${config.id}`
          const ssh_config = `
Host ${config.host}
User ${config.sshUser}
IdentityFile ${keyFileName}
`
          fs.writeFileSync(keyFileName, config.sshKey + "\n", { mode: 0o600 })
          fs.appendFileSync(`${sshConfigDir}/config`, ssh_config, { mode: 0o600 })
        }
      })
    }).catch(e => {
      console.log(`Google repo ssh-error: ${e}`)
      return Promise.reject(e)
    })
  }
  private preparaHTTPSHosts(httpsHosts: string[]): Promise<void> {
    return Promise.all(_.uniq(httpsHosts).map(host => {
      return this.vaultService.getSecret(`csp/common-build/git-https-${host}`).then(secret => {
        return `https://${secret}@${host}`
      })
    })).then((configLines) => {
      const configDir = `${os.homedir()}`
      fs.appendFileSync(`${configDir}/.git-credentials`, `${configLines.join("\n")}\n`, { mode: 0o700 })

    })
      .catch((e) => {
        console.log(`Google repo https-error: ${e}`)
        return Promise.reject(e)
      })

  }

  repoInit(path: string) {
    return execSync(
      `repo init -u file://${path}`, { stdio: 'inherit' }
    )
  }
  repoSync(manifest?: string) {
    return execSync(
      `GIT_SSH_COMMAND="ssh -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no" repo sync`, { stdio: 'inherit' }
    )
  }
}

