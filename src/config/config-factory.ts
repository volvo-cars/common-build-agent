import * as fs from "fs"
import YAML from "yaml"
import { Codec } from "../domain-model/system-config/codec"
import { ServiceConfig } from "../domain-model/system-config/service-config"
import { createLogger, loggerName } from "../logging/logging-factory"



const logger = createLogger(loggerName(__filename))

export const createConfig = (file: string): ServiceConfig.Services => {
  const object = YAML.parse(fs.readFileSync(file, "utf8"))
  return Codec.toInstance(object, ServiceConfig.Services)
}
