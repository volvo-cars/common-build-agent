import "jest"
import { DefaulXmlExtractor } from "../../../../src/operations/dependencies/default-xml-extractor"
describe("Publication factory", () => {
  it("Extract remotes", async () => {
    const xml = `
<?xml version="1.0" encoding="UTF-8"?>
<manifest>
  <remote name="origin" fetch="ssh://csp-gerrit.volvocars.biz" review=""/> 
  <remote name="origin2" fetch="ssh://csp-gerrit-qa.volvocars.biz" review=""/> 
  <remote name="origin3" fetch="https://gitlab.cm.volvocars.net" review=""/> 
  <default revision="master" remote="origin" sync-s="true" sync-j="4" sync-c="true"/>
  <!-- component -->
  <project path="components/a" name="playground/cynosure_a.git" label="a" revision="refs/tags/v35.7.0"/>

</manifest>    
    `
    expect(new DefaulXmlExtractor.Extractor(xml).extract()).toEqual([new DefaulXmlExtractor.HostExtract("csp-gerrit.volvocars.biz", DefaulXmlExtractor.Protocol.ssh), new DefaulXmlExtractor.HostExtract("csp-gerrit-qa.volvocars.biz", DefaulXmlExtractor.Protocol.ssh), new DefaulXmlExtractor.HostExtract("gitlab.cm.volvocars.net", DefaulXmlExtractor.Protocol.https)])
  })
})
