import _ from "lodash";
import { PublicationConfig } from "../../domain-model/system-config/publication-config";

export namespace QualifierDecoder {

    /**
     * User intent:
     * 
     * src: pattern with glob syntax
     * use cases:
     *   1. Match multiple files in a directory structure
     *   2. Match a single file with dynamic file name
     * 
     * src: pattern without glob syntax
     *   1. Match a single name with exact file name
     *   2. Match a directory 
     * 
     * 
     * Returns:
     *   * glob-pattern 
     *   * 
     */

    export class Decoded {
        constructor(
            readonly mode: PublicationConfig.QualifierPackMode.ALWAYS | PublicationConfig.QualifierPackMode.NEVER,
            readonly basePath: string | undefined
        ) { }
    }


    export const decode = (qualifier: PublicationConfig.Qualifier): Decoded => {
        let pattern = _.trim(qualifier.src, "/ ")
        let parts = pattern.split('/')
        let nonGlobParts = _.takeWhile(parts, part => { return part.indexOf('*') < 0 })
        const isGlobBased = nonGlobParts.length < parts.length
        let configuredPackMode = qualifier.pack ?? PublicationConfig.QualifierPackMode.AUTO
        let effectivePackMode: PublicationConfig.QualifierPackMode.ALWAYS | PublicationConfig.QualifierPackMode.NEVER = configuredPackMode === PublicationConfig.QualifierPackMode.AUTO ? (isGlobBased ? PublicationConfig.QualifierPackMode.ALWAYS : PublicationConfig.QualifierPackMode.NEVER) : configuredPackMode
        return new Decoded(effectivePackMode, nonGlobParts.length > 0 ? nonGlobParts.join("/") : undefined)
    }
}