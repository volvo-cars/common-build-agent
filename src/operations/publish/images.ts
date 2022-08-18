import fs from 'fs';
import _ from 'lodash';
import stream from 'stream';
import { PublicationConfig } from '../../domain-model/system-config/publication-config';
import { TarUtils } from "../../utils/tar-utils";
import { Operations } from '../operation';
import * as fg from 'fast-glob';

export namespace Images {

    export class ImageItem {
        constructor(public remote: string, public name: string) { }
    }

    export const createImageItems = (id: Operations.Id, config: PublicationConfig.Config): Promise<Images.ImageItem[]> => {

        const images = config.images
        if (images) {
            return Promise.resolve(images.items.map(image => {
                return new ImageItem(image.remote || images.remote, image.name)
            }))
        } else {
            return Promise.resolve([])
        }
    }
}