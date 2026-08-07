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
const STORE_PARTS = [

    {
        name: "Voltum",
        storepartuid: "909613166454"
    },

    {
        name: "Bironi",
        storepartuid: "300286181934"
    }

];

class CatalogCache {

    log(...args){

        if(CONFIG.debug){

            console.log('[CatalogCache]', ...args);

        }

    }

  async init() {

    this.log("init");

    let products = [];

    for (const part of STORE_PARTS) {

        this.log("Загружаем", part.name);

        const list = await this.loadCatalog(part.storepartuid);

        this.log(
            part.name,
            list.length
        );

        products.push(...list);

    }

    this.log(
        "Всего товаров",
        products.length
    );

    this.saveCatalog(products);

}


async loadCatalog(storepartuid) {

    let slice = 1;

    const products = [];
    const loadedSlices = new Set();

    while (true) {

        if (loadedSlices.has(slice)) {
            this.log("Повтор страницы", slice);
            break;
        }

        loadedSlices.add(slice);

        const url = new URL(
            "https://store.tildaapi.com/api/getproductslist/"
        );

        url.searchParams.set("storepartuid", storepartuid);
        url.searchParams.set("slice", slice);
        url.searchParams.set("getallparts", "true");
        url.searchParams.set("getoptions", "true");
        url.searchParams.set("size", "1000");
        url.searchParams.set("c", Date.now());

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(
                `Ошибка загрузки ${storepartuid}, slice ${slice}`
            );
        }

        const json = await response.json();

        const part = json.products || [];

        this.log(
            "page",
            slice,
            "товаров",
            part.length,
            "next",
            json.nextslice
        );

        products.push(...part);
if (json.nextslice == null) {
    this.log("Конец каталога");
    break;
}

if (loadedSlices.has(json.nextslice)) {
    this.log("Страница уже была:", json.nextslice);
    break;
}

slice = json.nextslice;

    }

    // удаляем дубли по uid
    const unique = [];
    const ids = new Set();

    for (const product of products) {

        if (ids.has(product.uid)) {
            continue;
        }

        ids.add(product.uid);
        unique.push(product);

    }

    this.log(
        "Загружено:",
        products.length,
        "Уникальных:",
        unique.length
    );

    return unique;

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