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

   this.saveCatalog(products);

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

    let slice = 1;
    let products = [];

    while (true) {

        url.searchParams.set("slice", slice);

        const response = await fetch(url.toString());

        if (!response.ok) {
            throw new Error("Ошибка загрузки каталога");
        }

        const json = await response.json();

console.log("Ключи ответа:", Object.keys(json));
console.log("Количество товаров:", json.products?.length);
console.log("Первый товар:", json.products?.[0]);

const part = json.products || [];

        this.log(`Slice ${slice}: ${part.length}`);

        products.push(...part);
console.log(
    "Bironi:",
    part.filter(p => p.brand === "Bironi").length
);

console.log(
    part.filter(p => p.brand === "Bironi").slice(0, 5)
);

        if (part.length < 500) {
            break;
        }

        slice++;

    }

    this.log("Всего товаров", products.length);

    return products;

}
saveCatalog(products) {

    // Оставляем только нужные поля
    const shortProducts = products.map(product => ({

        uid: String(product.uid),

        sku: product.sku || "",

        url: product.url || "",

        title: product.title || "",

        brand: product.brand || "",

        characteristics: product.characteristics || []

    }));

    localStorage.setItem(

        "pc_catalog_all",

        JSON.stringify({

            updated: Date.now(),

            products: shortProducts

        })

    );

    this.log(
        "Каталог сохранён:",
        shortProducts.length
    );

    window.dispatchEvent(
        new CustomEvent("catalogUpdated")
    );

}
}

window.CatalogCache = new CatalogCache();

window.addEventListener('load', () => {

    window.CatalogCache.init();

});

})();