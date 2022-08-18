import "jest"
import { TarUtils } from "../../../src/utils/tar-utils"
import fs from 'fs'
import exp from "constants"
import _ from "lodash"
describe("TarUtils", () => {

  it("Test creating tar file", async () => {
    const destDir = "./build/tar-output"
    const destFiles = _.range(0, 10).map(index => {
      return destDir + `/tar-out-${index}.tar.gz`
    })
    try {
      fs.mkdirSync(destDir, { recursive: true })
    } catch (e) { }
    await Promise.all(destFiles.map(async destFile => {
      const files = ["a.md", "sub/b.md"]

      const out = fs.createWriteStream(destFile)
      return TarUtils.pipe(files, __dirname + "/tar-utils-test-files", out).then(() => {
        console.log("Tar-ring done")
        out.close()
        destFiles.forEach(destFile => {
          expect(fs.existsSync(destFile)).toBe(true)
          expect(fs.statSync(destFile).size).toBeGreaterThan(0)
        })
      })
    }))


  })
})
