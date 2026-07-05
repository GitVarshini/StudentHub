/* ============================================
   SIDEBAR.JS
   Handles opening/closing the mobile sidebar drawer.
   Loaded on every dashboard/tool page, alongside theme.js.
   ============================================ */

document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.getElementById("sidebar");
  const toggleBtn = document.getElementById("sidebar-toggle");
  const backdrop = document.getElementById("sidebar-backdrop");

  // Not every page necessarily has these elements structured
  // identically, so we guard against any being missing rather
  // than assuming they always exist.
  if (!sidebar || !toggleBtn || !backdrop) return;

  function openSidebar() {
    sidebar.classList.add("open");
    backdrop.classList.add("visible");
  }

  function closeSidebar() {
    sidebar.classList.remove("open");
    backdrop.classList.remove("visible");
  }

  toggleBtn.addEventListener("click", openSidebar);
  backdrop.addEventListener("click", closeSidebar);

  // Also close the drawer when a nav link is tapped — otherwise
  // navigating to a new page would (technically) still work, but
  // closing it first feels more responsive and intentional.
  sidebar.querySelectorAll(".sidebar-link").forEach(link => {
    link.addEventListener("click", closeSidebar);
  });
});