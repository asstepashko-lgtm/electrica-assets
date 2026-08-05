/*!
 * Product Colors
 * v0.1
 * electrica-msk.ru
 */

(() => {

'use strict';

const CONFIG = {

    groupField: 'Группа товаров',

    colorField: 'Цвет',

    insertSelector: '.js-catalog-prod__controls-wrapper',

    cacheLifetime: 1000 * 60 * 10,

    fadeDuration: 250,

    debug: true

};

const COLOR_MAP = {

    "Белый":"#FFFFFF",
    "Белый матовый":"#FFFFFF",
    "Белый глянцевый":"#FFFFFF",
    "Черный":"#000000",
    "Коричневый":"#A88456",
    "Титан":"#737B82",
    "Сталь":"#E2E2E2",
    "Графит":"#4A474B",
    "Серый":"#A7ADB2",
    "Деним":"#6C84D6",
    "Капучино":"#8C6A46",
    "Кашемир":"#D8C5A8",
    "Шёлк":"#EFE9DA",
    "Хлопок":"#F5F2E8",
    "Слоновая кость":"#F6F2E6",
    "Песочное золото":"#F2E2D8",
    "Бронза":"#B67A00",
    "Перламутр":"#F6F0F6",
    "Мрамор":"#D8D8D8",
    "Мрамор золото":"#C8B0B0",
    "Карельская сосна":"#E5CAA3",
    "Медный век":"#A46B4E",
    "Серебряный век":"#A7B6C3",
"Белый глянец":"#FFFFFF"

};

class ProductColors {

    constructor(){

        this.products = [];

        this.current = null;
this.observerTimer = null;

    }

    log(...args){

        if(CONFIG.debug){

            console.log('[ProductColors]', ...args);

        }

    }
async init() {

    this.log("init");

    this.products = this.readCatalog();

    if (!this.products.length) {
        return;
    }

    this.current = this.getCurrentProduct();

    this.renderCatalog();

    if (this.current) {
        this.render();
    }


    this.log("Товаров:", this.products.length);

}
readCatalog() {

    const products = new Map();

    Object.keys(localStorage)
        .filter(key => key.startsWith("pc_catalog_"))
        .forEach(key => {

            try {

                const cache = JSON.parse(localStorage.getItem(key));

                if (!cache?.products) return;

                cache.products.forEach(product => {

                   if (product?.uid) {
                        products.set(String(product.uid), product);
                    }

                });

            } catch (e) {
                console.warn("Ошибка чтения", key, e);
            }

        });

    const result = [...products.values()];

    this.log("Товаров:", result.length);

    return result;
}
getCurrentUid() {

    const product = document.querySelector(
        ".js-catalog-product[data-product-uid]"
    );

    if (product) {
        return product.dataset.productUid;
    }

    const match = location.pathname.match(/tproduct\/(\d+)/);

    return match ? match[1] : null;

}
getCurrentProduct() {

    const uid = this.getCurrentUid();

    if (!uid) {
        return null;
    }

    return this.products.find(product =>
        String(product.uid) === uid
    ) || null;

}
getCharacteristic(product, title) {

    if (!product.characteristics) {
        return null;
    }

    const item = product.characteristics.find(c =>
        c.title === title
    );

    return item ? item.value : null;

}

getVariants(product) {

    const group = this.getCharacteristic(
        product,
        CONFIG.groupField
    );

    if (!group) {
        return [product];
    }

    return this.products.filter(item =>

        this.getCharacteristic(
            item,
            CONFIG.groupField
        ) === group

    );

}


render() {


    if (!this.current) {
        return;
    }

    const variants = this.getVariants(this.current);

    if (variants.length < 2) {
        return;
    }

    const popupProduct = document.querySelector(
        ".t-popup_show .js-catalog-product"
    );

    let target = null;

    if (popupProduct) {

        target = popupProduct.querySelector(
            ".js-catalog-price-wrapper"
        );

    } else {

        target =
            document.querySelector(".js-catalog-prod__controls-wrapper") ||
            document.querySelector(".js-catalog-price-wrapper");

    }

    if (!target) {
        return;
    }

    let block = target.parentNode.querySelector(".product-colors");

    if (!block) {

        block = this.createColorBlock(
            variants,
            this.current
        );

        target.before(block);

        return;

    }

    const newBlock = this.createColorBlock(
        variants,
        this.current
    );

    block.replaceWith(newBlock);

}
renderCatalog() {

   document.querySelectorAll(
    ".js-product[data-product-uid]"
)
        .forEach(card => {

      const old = card.querySelector(".product-colors");

if (old) {
    old.remove();
}

            const uid =
                card.dataset.productUid ||
                card.querySelector("[data-product-uid]")?.dataset.productUid;

            if (!uid) {
                return;
            }

            const current = this.products.find(product =>
                String(product.uid) === String(uid)
            );

            if (!current) {
                return;
            }

            const variants = this.getVariants(current);

            if (variants.length < 2) {
                return;
            }
const block = this.createColorBlock(
    variants,
    current
);
            const target =
    card.querySelector(".t-catalog__card_sku") ||
    card.querySelector(".js-catalog-price-wrapper");

if (!target) {
    return;
}

if (target.classList.contains("t-catalog__card_sku")) {
    target.after(block);
} else {
   

target.parentNode.insertBefore(block, target);

}

        });

}

createColorBlock(variants, current) {


    const block = document.createElement("div");

    block.className = "product-colors";

    block.innerHTML = `

        <div class="product-colors__title">
            Цвет
        </div>

        <div class="product-colors__list"></div>

    `;

    const tooltip = document.createElement("div");

    tooltip.className = "product-color-tooltip";

    block.prepend(tooltip);

    const list = block.querySelector(".product-colors__list");

variants = [...new Map(
    variants.map(v => [String(v.uid), v])
).values()];
    variants.forEach(product => {

        const colorName =
            this.getCharacteristic(
                product,
                CONFIG.colorField
            ) || "";

        const color =
            COLOR_MAP[colorName] || "#cccccc";

        const item = document.createElement("button");

        item.type = "button";

        item.className = "product-colors__item";

        item.dataset.url = product.url;

        item.dataset.uid = product.uid;

        item.dataset.color = colorName;

        item.style.background = color;

        if (color.toUpperCase() === "#FFFFFF") {
            item.style.border = "1px solid #cfcfcf";
        }

        if (String(product.uid) === String(current.uid)) {
            item.classList.add("active");
        }

        item.addEventListener("mouseenter", () => {


            tooltip.textContent = colorName;

            const rect = item.getBoundingClientRect();
            const blockRect = block.getBoundingClientRect();

            tooltip.style.left =
                (rect.left - blockRect.left + rect.width / 2) + "px";

            tooltip.style.top =
                (-tooltip.offsetHeight - 18) + "px";

            tooltip.classList.add("show");

        });

        item.addEventListener("mouseleave", () => {


            tooltip.classList.remove("show");

        });

        list.appendChild(item);

    });

    list.addEventListener("click", e => {

        const link = e.target.closest(".product-colors__item");

        if (!link) {
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        this.openVariant(link.dataset.uid);

    });

    return block;

}
openVariant(uid) {

    uid = String(uid);

    const card = document.querySelector(
        `.js-product[data-product-uid="${uid}"]`
    );

    if (!card) {

        const product = this.products.find(
            p => String(p.uid) === uid
        );

        if (product) {
            location.href = product.url;
        }

        return;

    }

    const popup = document.querySelector(".t-popup_show");

    if (!popup) {

        card.querySelector("a")?.click();
        return;

    }

  card.querySelector("a")?.click();

}
refresh() {

    this.products = this.readCatalog();

    this.current = this.getCurrentProduct();

    document
        .querySelectorAll(".product-colors")
        .forEach(el => el.remove());

    if (this.current) {
        this.render();
    }

    this.renderCatalog();

}

}

window.ProductColors = new ProductColors();

window.addEventListener("load", () => {

    window.ProductColors.init();
window.addEventListener("catalogUpdated", () => {
    window.ProductColors.refresh();
});

    const observer = new MutationObserver(() => {

    clearTimeout(window.ProductColors.observerTimer);

    window.ProductColors.observerTimer = setTimeout(() => {

        const popup = document.querySelector(".t-popup_show");

        if (popup) {

            window.ProductColors.current =
                window.ProductColors.getCurrentProduct();

            window.ProductColors.render();

        } else {

            window.ProductColors.renderCatalog();

        }

    },100);

});
    observer.observe(document.body, {

        childList: true,
        subtree: true

    });

});

})();