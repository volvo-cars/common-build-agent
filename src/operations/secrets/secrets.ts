

export namespace Secrets {

    export interface Service {
        mountSecret(vaultPath: string): Secret
        /**
         * @returns [user,auth]
         */
        mountAuth(vaultPath: string): [Secret, Secret]
    }

    export interface Secret {
        readonly path: string
    }


}

