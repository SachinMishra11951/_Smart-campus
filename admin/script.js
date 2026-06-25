document.addEventListener("DOMContentLoaded", () => {
    // 1. Highlight Core Routing Route Paths Automatically
    const currentPath = window.location.pathname.split("/").pop() || "index.html";
    const menuItems = document.querySelectorAll(".sidebar-menu li");

    menuItems.forEach(item => {
        const link = item.querySelector("a");
        if (link && link.getAttribute("href") === currentPath) {
            menuItems.forEach(i => i.classList.remove("active"));
            item.classList.add("active");
        }
    });

    // 2. Mobile Responsive Menu Pull Engine Toggle
    const menuToggle = document.getElementById("menuToggle");
    const sidebar = document.querySelector(".sidebar");

    if (menuToggle && sidebar) {
        menuToggle.addEventListener("click", (e) => {
            e.stopPropagation();
            sidebar.classList.toggle("active");
        });

        document.addEventListener("click", (e) => {
            if (sidebar.classList.contains("active") && !sidebar.contains(e.target)) {
                sidebar.classList.remove("active");
            }
        });
    }
});