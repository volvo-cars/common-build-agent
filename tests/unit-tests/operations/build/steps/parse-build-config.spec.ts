import "jest"
import fs from "fs"
import Yaml from 'yaml'
import { BuildConfig } from "../../../../../src/domain-model/system-config/build-config"
import { Codec } from "../../../../../src/domain-model/system-config/codec"
describe("Parse build config", () => {
  it("With secrets", async () => {
    const buildConfig = fs.readFileSync(`${__dirname}/data/build.yml`).toString()
    const json = Yaml.parse(buildConfig)
    console.dir(json, { depth: null })
    const parsed = Codec.toInstance(json, BuildConfig.Config)
    console.dir(parsed, { depth: null })
    expect(parsed.build.steps.length).toBe(1)
    const step = parsed.build.steps[0]
    expect(step).toBeInstanceOf(BuildConfig.BuildCompose.Step)
    const step2 = <BuildConfig.BuildCompose.Step>step
    expect(step2.secrets).toBeInstanceOf(Map)
    expect(step2.secrets?.size).toBe(1)
  })

  it("Without secrets", async () => {
    const buildConfig = fs.readFileSync(`${__dirname}/data/build_without_secrets.yml`).toString()
    const json = Yaml.parse(buildConfig)
    console.dir(json, { depth: null })
    const parsed = Codec.toInstance(json, BuildConfig.Config)
    console.dir(parsed, { depth: null })
    expect(parsed.build.steps.length).toBe(1)
    const step = parsed.build.steps[0]
    expect(step).toBeInstanceOf(BuildConfig.BuildCompose.Step)
    const step2 = <BuildConfig.BuildCompose.Step>step
    expect(step2.secrets).toBeUndefined()

  })
})
