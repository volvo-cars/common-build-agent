import "jest"
import { PublicationConfig } from "../../../../src/domain-model/system-config/publication-config"
import { Artifacts } from "../../../../src/operations/publish/artifacts"
import fs from 'fs'
import { Codec } from "../../../../src/domain-model/system-config/codec"
import Yaml from 'yaml'
import { Operations } from "../../../../src/operations/operation"
describe("Publication factory", () => {
  const testDir = __dirname + "/test-files"
  it("Simple file", async () => {
    const config = new PublicationConfig.Config(
      new PublicationConfig.Artifacts(
        [new PublicationConfig.Artifact(
          "test/path",
          [
            new PublicationConfig.Qualifier(
              "dummy1/abc.vbf",
            ),
            new PublicationConfig.Qualifier(
              "dummy1",
              undefined
            ),
            new PublicationConfig.Qualifier(
              "dummy1/*.vbf",
              "dummy1_filtered"
            ),
            new PublicationConfig.Qualifier(
              "**/*",
              "all"
            )
          ]
        )], "ara", "ARTCSP-CI"
      ), undefined
    )
    const id = new Operations.Id("DUMMY_SESSION_ID")
    if (config.artifacts) {
      const items = await Artifacts.createArtifactItems(id, config.artifacts, testDir)
      console.log("Publication", Yaml.stringify(Codec.toPlain(config)))

      expect(items[0]).toBeInstanceOf(Artifacts.SingleArtifactItem)
      expect(items[1]).toBeInstanceOf(Artifacts.MultiArtifactItem)

      await Promise.all(items.map(item => {

        const outFile = `build/${item.fullName()}`
        console.log("Writing", outFile)
        item.materialize(fs.createWriteStream(outFile))
      }))
    }
  })
})
