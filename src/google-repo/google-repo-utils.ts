import { execSync } from "child_process"
import { VaultService } from "../vault/vault-service"
import fs from "fs"
import os from 'os'
import _ from 'lodash'

export class GoogleRepoSSHId {
  constructor(public readonly vaultKeyPrefix: string, public sshHost: string) { }
}

class GoogleRepoConfig {
  constructor(public readonly id: string, public readonly host: string, public readonly sshUser: string, public readonly sshKey: string) { }
}

export class GoogleRepoUtils {
  constructor(private vaultService: VaultService) { }

  downloadRepo(path: string, sshHosts: string[]): Promise<void> {
    console.log(`Processing google-repo on ${path}: ${sshHosts.join(", ")}`)
    return Promise.all(sshHosts.map(host => {
      const parts = host.split(".")
      const id = _.first(parts)
      if (id) {
        return Promise.all(["user", "key"].map(suffix => { return this.vaultService.getSecret(`csp/common-build/${id}-${suffix}`) })).then(([sshUser, sshKey]) => {
          return new GoogleRepoConfig(id, host, sshUser, sshKey)
        })
      } else {
        return Promise.resolve(undefined)
      }
    })).then(configs => {
      console.dir(configs, { depth: null })
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
IdentityFile${keyFileName}

`
          console.log("Writing SSH config: " + ssh_config)
          fs.writeFileSync(keyFileName, config.sshKey + "\n", { mode: 0o600 })
          fs.appendFileSync(`${sshConfigDir}/config`, ssh_config, { mode: 0o600 })
        }
      })
      this.repoInit(path)
      this.repoSync()
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

