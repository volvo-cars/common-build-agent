import { execSync } from "child_process"
import { VaultService, VaultServiceImpl } from "../vault/vault-service"
import fs from "fs"
import os from 'os'
import { ensureString } from "../utils/ensures"

export class GoogleRepoUtils {
  constructor(private vaultService: VaultService) { }

  downloadRepo(path: string): Promise<void> {
    const vault = new VaultServiceImpl({
      endpoint: "https://winterfell.csp-dev.net",
      token: ensureString(process.env.VAULT_TOKEN, "ENV[VAULT_TOKEN] missing."),
      apiVersion: "v1",
    })
    const secretNames = ["csp/common-build/csp-gerrit-user", "csp/common-build/csp-gerrit-ssh-key"]
    const ssh_config = `Host csp-gerrit-qa.volvocars.net
                        User common-build
                        IdentityFile ~/.ssh/id_rsa`

    return Promise.all(
      secretNames.map((secretName) => {
        return this.vaultService.getSecret(secretName)
      })
    ).then(([username, key]) => {
      const sshConfigDir = `${os.homedir()}/.ssh`
      if (!fs.existsSync(sshConfigDir)) {
        fs.mkdirSync(sshConfigDir, { recursive: true })
      }
      fs.writeFileSync(`${sshConfigDir}/id_rsa`, key + "\n", { mode: 0o600 })
      fs.writeFileSync(`${sshConfigDir}/config`, ssh_config, { mode: 0o600 })
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

