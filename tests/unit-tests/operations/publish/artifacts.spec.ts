import "jest"
import { PublicationConfig } from "../../../../src/domain-model/system-config/publication-config"
import { Artifacts } from "../../../../src/operations/publish/artifacts"
import fs from 'fs'
import { Codec } from "../../../../src/domain-model/system-config/codec"
import Yaml from 'yaml'
import { Operations } from "../../../../src/operations/operation"


describe("Publication factory", () => {
  const testDir = __dirname + "/test-files"
  const processQualifiers = (...qualifiers: PublicationConfig.Qualifier[]): Promise<Artifacts.ArtifactItem[]> => {
    const id = new Operations.Id("DUMMY_SESSION_ID")
    const artifacts =
      new PublicationConfig.Artifacts(
        [new PublicationConfig.Artifact(
          "test/path",
          qualifiers
        )], "ara", "ARTCSP-CI"
      )
    return Artifacts.createArtifactItems(id, artifacts, testDir)
  }

  it("Single qualifier in folder defaults to folder-name.tar.gz", async () => {
    const items = await processQualifiers(new PublicationConfig.Qualifier(
      "folder-a/*",
      undefined,
      undefined
    ))
    expect(items[0]).toBeInstanceOf(Artifacts.MultiArtifactItem)
    const multi1 = <Artifacts.MultiArtifactItem>items[0]
    expect(multi1.fileName).toBe("folder-a.tar.gz")
    expect(multi1.relativePaths).toEqual(["image-a1.img", "image-a2.img", "text-a1.txt", "text-a2.txt"])
  })
  it("Single qualifier with ** in folder defaults to folder-name.tar.gz", async () => {
    const items = await processQualifiers(new PublicationConfig.Qualifier(
      "folder-a/**",
      undefined,
      undefined
    ))
    expect(items[0]).toBeInstanceOf(Artifacts.MultiArtifactItem)
    const multi1 = <Artifacts.MultiArtifactItem>items[0]
    expect(multi1.fileName).toBe("folder-a.tar.gz")
    expect(multi1.relativePaths).toEqual(["folder-aa/text-a1.txt", "folder-aa/text-a2.txt", "image-a1.img", "image-a2.img", "text-a1.txt", "text-a2.txt"])
  })
  it("Root matching * contains root files + no-name.tar.gz", async () => {
    const items = await processQualifiers(new PublicationConfig.Qualifier(
      "*.txt",
      undefined,
      undefined
    ))
    expect(items[0]).toBeInstanceOf(Artifacts.MultiArtifactItem)
    const multi1 = <Artifacts.MultiArtifactItem>items[0]
    expect(multi1.fileName).toBe("no-name.tar.gz")
    expect(multi1.relativePaths).toEqual(["text1.txt", "text2.txt"])
  })
  it("Matching single file exact file name -> single file", async () => {
    const items = await processQualifiers(new PublicationConfig.Qualifier(
      "text1.txt",
      undefined,
      undefined
    ))
    expect(items[0]).toBeInstanceOf(Artifacts.SingleArtifactItem)
    const single1 = <Artifacts.SingleArtifactItem>items[0]
    expect(single1.fileName).toBe("text1.txt")
  })
  it("Matching single file glob file name with MODE=NEVER-> single file", async () => {
    const items = await processQualifiers(new PublicationConfig.Qualifier(
      "text1.*",
      undefined,
      PublicationConfig.QualifierPackMode.NO
    ))
    expect(items[0]).toBeInstanceOf(Artifacts.SingleArtifactItem)
    const single1 = <Artifacts.SingleArtifactItem>items[0]
    expect(single1.fileName).toBe("text1.txt")

    const items2 = await processQualifiers(new PublicationConfig.Qualifier(
      "text1.*",
      "newName",
      PublicationConfig.QualifierPackMode.NO
    ))
    expect(items2[0]).toBeInstanceOf(Artifacts.SingleArtifactItem)
    const single2 = <Artifacts.SingleArtifactItem>items2[0]
    expect(single2.fileName).toBe("newName")
  })
  it("Matching single file with glob without mode -> multi file", async () => {
    const items = await processQualifiers(new PublicationConfig.Qualifier(
      "text1.*",
      undefined,
      undefined
    ))
    expect(items[0]).toBeInstanceOf(Artifacts.MultiArtifactItem)
    const multi = <Artifacts.MultiArtifactItem>items[0]
    expect(multi.relativePaths).toEqual(["text1.txt"])
  })
  it("Matching single file in folder with glob with mode NO", async () => {
    const items = await processQualifiers(new PublicationConfig.Qualifier(
      "folder-a/text-a1.*",
      undefined,
      PublicationConfig.QualifierPackMode.NO
    ))
    expect(items[0]).toBeInstanceOf(Artifacts.SingleArtifactItem)
    const multi = <Artifacts.SingleArtifactItem>items[0]
    expect(multi.fileName).toEqual("text-a1.txt")
  })

  it("Matching multiple files with mode=YES fails", async () => {
    try {
      const items = await processQualifiers(new PublicationConfig.Qualifier(
        "text*",
        undefined,
        PublicationConfig.QualifierPackMode.NO
      ))
      fail("Should have failed since multiple files can not be single")
    } catch (e) {

    }
  })
})
