/*!
 * Catalog Cache
 * v0.1
 */

(() => {

'use strict';

const CONFIG = {

    cachePrefix: 'pc_catalog_',

    cacheLifetime: 1000 * 60 * 60 * 24,

    debug: true

};

class CatalogCache {

    log(...args){

        if(CONFIG.debug){

            console.log('[CatalogCache]', ...args);

        }

    }

   async init() {

    this.log("init");

    const api = await this.findApi();

    if (!api) {
        return;
    }

    const products = await this.loadCatalog(api);

    if (!products.length) {
        return;
    }

    const storepartuid = new URL(api)
        .searchParams
        .get("storepartuid");

    this.saveCatalog(products, storepartuid);

}

async findApi() {

    return new Promise(resolve => {

        let count = 0;

        const timer = setInterval(() => {

            const resource = performance
                .getEntriesByType("resource")
                .find(r =>
                    r.name.includes("/api/getproductslist/")
                );

            if (resource) {

                clearInterval(timer);

                const url = new URL(resource.name);

                url.searchParams.set(
                    "c",
                    Date.now()
                );

                this.log("API найден");

                resolve(url.toString());

                return;

            }

            count++;

            if (count > 100) {

                clearInterval(timer);

                this.log("API не найден");

                resolve(null);

            }

        },100);

    });

}
async loadCatalog(api) {

    const url = new URL(api);

    url.searchParams.set("size", 500);

    url.searchParams.set("slice", 1);

    this.log("URL", url.toString());

    const response = await fetch(url.toString());

    if (!response.ok) {

        throw new Error("Ошибка загрузки каталога");

    }

    const json = await response.json();

    const products = json.products || [];

    this.log("Всего товаров", products.length);

    return products;

}
saveCatalog(products, storepartuid) {

    localStorage.setItem(

        CONFIG.cachePrefix + storepartuid,

        JSON.stringify({

            time: Date.now(),

            products: products

        })

    );

    this.log(
        "Каталог сохранён:",
        products.length
    );

}
}

window.CatalogCache = new CatalogCache();

window.addEventListener('load', () => {

    window.CatalogCache.init();

});

})();