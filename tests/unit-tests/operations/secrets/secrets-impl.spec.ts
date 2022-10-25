import "jest"
import { SecretsImpl } from "../../../../src/operations/secrets/secrets-impl"
import { MockVaultService } from "../../../helpers/mock-vault-service"
describe("Parse build config", () => {

  it("Mount secrets", async () => {
    const externalPath = "/external"
    const service = new SecretsImpl(externalPath)

    const secret1 = service.mountSecret("csp/test")
    expect(secret1.path).toBe("/external/csp_test")

    const secret1a = service.mountSecret("csp/test")
    expect(secret1a.path).toBe("/external/csp_test")

    const secret1b = service.mountSecret("csp_test") //Direct filename take
    expect(secret1b.path).toBe("/external/csp_test_1")
  })

  it("Resolved secrets", async () => {
    const externalPath = "/external"
    const service = new SecretsImpl(externalPath)


    const secret1 = service.mountSecret("some-secret")
    expect(secret1.path).toBe("/external/some-secret")

    const [user, secret] = service.mountAuth("some-auth")
    expect(user.path).toBe("/external/some-auth_user")
    expect(secret.path).toBe("/external/some-auth_secret")


    const vaultService = new MockVaultService({ "some-secret": "valueA", "some-auth": "userB:passwordB" })
    const resolved = await service.resolvedSecrets(vaultService)

    const find = (fileName: string, value: string): boolean => {
      return resolved.find(r => { return r.fileName === fileName && r.value === value }) ? true : false
    }

    expect(find("some-secret", "valueA"))
    expect(find("some-auth_user", "userB"))
    expect(find("some-auth_secret", "passwordB"))


  })


})
