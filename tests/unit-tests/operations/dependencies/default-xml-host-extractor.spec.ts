import "jest"
import { DefaultXmlHostExtractor } from "../../../../src/operations/dependencies/default-xml-host-extractor"
describe("Publication factory", () => {
  it("Extract remotes", async () => {
    const xml = `
<?xml version="1.0" encoding="UTF-8"?>
<manifest>
  <remote name="origin" fetch="ssh://csp-gerrit.volvocars.biz" review=""/> 
  <remote name="origin" fetch="ssh://csp-gerrit-qa.volvocars.biz" review=""/> 
  <default revision="master" remote="origin" sync-s="true" sync-j="4" sync-c="true"/>
  <!-- component -->
  <project path="components/a" name="playground/cynosure_a.git" label="a" revision="refs/tags/v35.7.0"/>

</manifest>    
    `
    expect(new DefaultXmlHostExtractor(xml).extract()).toEqual(["csp-gerrit.volvocars.biz", "csp-gerrit-qa.volvocars.biz"])
  })
})
