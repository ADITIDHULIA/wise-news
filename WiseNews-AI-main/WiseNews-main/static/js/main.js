const WiseNewsUI = (() => {
    function showPanel(element, options = {}) {
        if (!element) {
            return;
        }

        const display = options.display || "block";
        element.hidden = false;
        element.style.display = display;
        element.classList.remove("is-hidden");

        requestAnimationFrame(() => {
            element.classList.add("is-visible");
        });
    }

    function hidePanel(element) {
        if (!element) {
            return;
        }

        element.classList.remove("is-visible");
        element.classList.add("is-hidden");

        const finalize = () => {
            if (element.classList.contains("is-hidden")) {
                element.hidden = true;
                element.style.display = "none";
            }
            element.removeEventListener("transitionend", finalize);
        };

        element.addEventListener("transitionend", finalize, { once: true });
        window.setTimeout(finalize, 420);
    }

    function setButtonLoading(button, isLoading) {
        if (!button) {
            return;
        }

        button.disabled = isLoading;
        button.classList.toggle("loading", isLoading);
        button.setAttribute("aria-busy", String(isLoading));
    }

    function animateValue(element, start, end, options = {}) {
        if (!element) {
            return;
        }

        const duration = options.duration || 900;
        const prefix = options.prefix || "";
        const suffix = options.suffix || "";
        const formatter = options.formatter || ((value) => Math.round(value).toString());
        const startTime = performance.now();

        function tick(now) {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const value = start + (end - start) * eased;

            element.textContent = `${prefix}${formatter(value)}${suffix}`;

            if (progress < 1) {
                requestAnimationFrame(tick);
            }
        }

        requestAnimationFrame(tick);
    }

    function scrollIntoView(element) {
        if (!element) {
            return;
        }

        element.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }

    function initRevealObserver() {
        const revealItems = document.querySelectorAll("[data-reveal]");

        if (!revealItems.length) {
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("revealed");
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.18,
            rootMargin: "0px 0px -10% 0px"
        });

        revealItems.forEach((item) => observer.observe(item));
    }

    return {
        animateValue,
        hidePanel,
        initRevealObserver,
        scrollIntoView,
        setButtonLoading,
        showPanel
    };
})();

window.WiseNewsUI = WiseNewsUI;

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
        const targetId = anchor.getAttribute("href");

        if (!targetId || targetId === "#") {
            return;
        }

        const target = document.querySelector(targetId);

        if (!target) {
            return;
        }

        event.preventDefault();
        WiseNewsUI.scrollIntoView(target);
    });
});

window.originalFetch = window.fetch.bind(window);
window.fetch = (...args) => window.originalFetch(...args).catch((error) => {
    console.error("Fetch error:", error);
    throw error;
});

window.addEventListener("error", (event) => {
    console.error("Unhandled error:", event.error || event.message);
});

function formatDate(dateString) {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

function truncateText(text, maxLength) {
    if (typeof text !== "string") {
        return "";
    }

    if (text.length <= maxLength) {
        return text;
    }

    return `${text.slice(0, maxLength).trim()}...`;
}

function showToast(message, type = "info", duration = 3000) {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add("show");
    });

    window.setTimeout(() => {
        toast.classList.remove("show");
        window.setTimeout(() => toast.remove(), 300);
    }, duration);
}

document.addEventListener("DOMContentLoaded", () => {
    document.body.classList.add("is-ready");
    WiseNewsUI.initRevealObserver();
});
