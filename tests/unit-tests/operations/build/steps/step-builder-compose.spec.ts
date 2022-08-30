import "jest"
import { BuildConfig } from "../../../../../src/domain-model/system-config/build-config"

describe("step-builder-compose", () => {
    it("Single node", async () => {
        const step = new BuildConfig.BuildCompose.Step(
            new Map([
                ["dev", new BuildConfig.BuildCompose.Node("ubuntu:20.04", ["redis"], [], undefined, undefined)],
                ["redis", new BuildConfig.BuildCompose.Node("redis:6.2-alpine", [], [6379], undefined, undefined)]
            ]),
            [
                new BuildConfig.BuildCompose.NodeCommand("echo hello2 > test.txt && ls -l", "dev")
            ], new Map()
        )
        //const id = new StepBuildId("sha", new Date().getTime().toString(), 0, "latest")
        //console.log(await new StepBuilderCompose(step).(id, [StepCommand.Phase.PRE, StepCommand.Phase.BUILD, StepCommand.Phase.POST]))
        //        console.log(new StepBuilderCompose("dummy", config))
    })
})
