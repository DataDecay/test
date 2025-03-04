function initServiceWorker() { 
    return new Promise<typeof ScramjetController>((resolve) => {
        if ('serviceWorker' in navigator) {
            console.log('OOGOGOGOGO');
            //@ts-ignore these are a fucking thing
            //wait for the scripts to load
            const scram = window.loadProxyScripts().then(async (): typeof ScramjetController => {
                const scramjet = new ScramjetController({
                    prefix: "/~/scramjet/",
                    files: {
                        wasm: "/scram/scramjet.wasm.js",
                        worker: "/scram/scramjet.worker.js",
                        client: "/scram/scramjet.client.js",
                        shared: "/scram/scramjet.shared.js",
                        sync: "/scram/scramjet.sync.js"
                    }
                });
                //@ts-ignore these fucking exist
                //make sure the transport is set before continuing
                await window.setTransport(localStorage.getItem('incog||transport'));
                await scramjet.init('/sw.js');
                return scramjet;
            });
            return resolve(scram);
        };
    });
}

export { initServiceWorker };
