import { Version } from "./version"

export type PromotionId = string

/** 
 * A version with attached Promotions 
 */
export class PromotedVersion {
    readonly version: Version
    readonly promotions: PromotionId[]
    constructor(version: Version, promotions: PromotionId[]) {
        this.version = version
        this.promotions = promotions
    }
}