const CART_STORAGE_KEY = "gl-bajaj-bookstore-cart";
const cartItemsElement = document.getElementById("cart-items");
const cartTable = document.getElementById("cart-table");
const cartEmptyMessage = document.getElementById("cart-empty");
const cartStatus = document.getElementById("cart-status");
const cartCount = document.getElementById("cart-count");
const cartTotal = document.getElementById("cart-total");

let cart = [];

const categoryColors = [
    { background: "#1d625d", foreground: "#ffffff" },
    { background: "#b94e3d", foreground: "#ffffff" },
    { background: "#4d5fb8", foreground: "#ffffff" },
    { background: "#a66a17", foreground: "#ffffff" },
    { background: "#75479a", foreground: "#ffffff" },
    { background: "#16718a", foreground: "#ffffff" }
];

function applyRandomCategoryColor(link) {
    const previousColor = link.dataset.categoryColor;
    const availableColors = categoryColors.filter((color) => color.background !== previousColor);
    const color = availableColors[Math.floor(Math.random() * availableColors.length)];

    link.dataset.categoryColor = color.background;
    link.style.backgroundColor = color.background;
    link.style.color = color.foreground;
}

function showPage() {
    const requestedPage = document.getElementById(window.location.hash.slice(1));
    const isPage = requestedPage &&
        (requestedPage.classList.contains("page-content") || requestedPage.classList.contains("dept-books"));
    const pageToShow = isPage ? requestedPage : document.getElementById("home");

    document.querySelectorAll(".page-content, .dept-books").forEach((page) => {
        page.classList.remove("is-visible");
    });
    pageToShow.classList.add("is-visible");
}

window.addEventListener("hashchange", showPage);
showPage();

document.querySelectorAll("aside ul li a").forEach((link) => {
    link.addEventListener("mouseenter", () => applyRandomCategoryColor(link));
    link.addEventListener("focus", () => applyRandomCategoryColor(link));
    link.addEventListener("click", () => applyRandomCategoryColor(link));
    link.addEventListener("mouseleave", () => {
        if (document.activeElement !== link) {
            link.style.backgroundColor = "";
            link.style.color = "";
        }
    });
    link.addEventListener("blur", () => {
        link.style.backgroundColor = "";
        link.style.color = "";
    });
});

function setStatus(message) {
    cartStatus.textContent = message;
}

function saveCart() {
    try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
        return true;
    } catch {
        setStatus("Cart updated for this visit, but could not be saved in this browser.");
        return false;
    }
}

function loadCart() {
    try {
        const storedCart = localStorage.getItem(CART_STORAGE_KEY);
        if (!storedCart) {
            return;
        }

        const parsedCart = JSON.parse(storedCart);
        if (!Array.isArray(parsedCart)) {
            throw new Error("Saved cart must be a list.");
        }

        cart = parsedCart.filter((item) =>
            item &&
            typeof item.title === "string" &&
            Number.isFinite(item.price) &&
            item.price > 0 &&
            Number.isInteger(item.quantity) &&
            item.quantity > 0
        );
    } catch {
        cart = [];
        setStatus("Could not load the saved cart. Add your books again.");
    }
}

function formatPrice(amount) {
    return `$${amount.toFixed(2)}`;
}

function createActionButton(label, className, accessibleLabel) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = label;
    button.setAttribute("aria-label", accessibleLabel);
    return button;
}

function renderCart() {
    cartItemsElement.replaceChildren();
    const itemCount = cart.reduce((count, item) => count + item.quantity, 0);
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    cart.forEach((item) => {
        const row = document.createElement("tr");
        const titleCell = document.createElement("td");
        titleCell.textContent = item.title;

        const priceCell = document.createElement("td");
        priceCell.textContent = formatPrice(item.price);

        const quantityCell = document.createElement("td");
        quantityCell.className = "cart-quantity";
        quantityCell.append(
            createActionButton("−", "quantity-button quantity-decrease", `Decrease ${item.title} quantity`),
            document.createTextNode(` ${item.quantity} `),
            createActionButton("+", "quantity-button quantity-increase", `Increase ${item.title} quantity`)
        );

        const amountCell = document.createElement("td");
        amountCell.textContent = formatPrice(item.price * item.quantity);

        const actionsCell = document.createElement("td");
        actionsCell.append(
            createActionButton("Remove", "remove-item-button", `Remove ${item.title} from cart`)
        );

        row.append(titleCell, priceCell, quantityCell, amountCell, actionsCell);
        cartItemsElement.append(row);
    });

    cartTable.hidden = cart.length === 0;
    cartEmptyMessage.hidden = cart.length !== 0;
    cartCount.textContent = String(itemCount);
    cartCount.setAttribute("aria-label", `${itemCount} ${itemCount === 1 ? "item" : "items"} in cart`);
    cartTotal.textContent = formatPrice(total);
}

document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
        return;
    }

    const addButton = target.closest(".btn-cart");
    if (addButton) {
        const bookCard = addButton.closest(".book-card");
        const title = bookCard?.querySelector(".book-info h4")?.textContent.trim();
        const priceText = [...(bookCard?.querySelectorAll(".book-info p") ?? [])]
            .find((paragraph) => paragraph.querySelector("b")?.textContent.trim().toLowerCase() === "price:")
            ?.textContent.replace(/^Price:\s*/i, "");
        const price = Number(priceText?.replace("$", ""));

        if (!title || !Number.isFinite(price) || price <= 0) {
            setStatus("Could not add this book because its title or price is missing.");
            return;
        }

        const existingItem = cart.find((item) => item.title === title);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ title, price, quantity: 1 });
        }

        const saved = saveCart();
        renderCart();
        if (saved) {
            setStatus(`${title} added to your cart.`);
        }
        return;
    }

    const cartRow = target.closest("#cart-items tr");
    if (!cartRow) {
        return;
    }

    const title = cartRow.cells[0].textContent;
    const item = cart.find((cartItem) => cartItem.title === title);
    if (!item) {
        return;
    }

    if (target.closest(".quantity-increase")) {
        item.quantity += 1;
        setStatus(`${title} quantity increased.`);
    } else if (target.closest(".quantity-decrease")) {
        item.quantity -= 1;
        if (item.quantity === 0) {
            cart = cart.filter((cartItem) => cartItem.title !== title);
            setStatus(`${title} removed from your cart.`);
        } else {
            setStatus(`${title} quantity decreased.`);
        }
    } else if (target.closest(".remove-item-button")) {
        cart = cart.filter((cartItem) => cartItem.title !== title);
        setStatus(`${title} removed from your cart.`);
    } else {
        return;
    }

    saveCart();
    renderCart();
});

loadCart();
renderCart();
