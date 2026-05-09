const titles = {
  dashboard: "Dashboard",
  send: "Quick Send",
  campaigns: "Campaigns",
  contacts: "Contacts",
  tags: "Contact Tags",
};

const title = document.querySelector("#screen-title");
const tabs = Array.from(document.querySelectorAll(".tab"));
const screens = Array.from(document.querySelectorAll(".screen"));

function activateScreen(target) {
  tabs.forEach((tab) => {
    tab.classList.toggle("tab--active", tab.dataset.target === target);
  });

  screens.forEach((screen) => {
    screen.classList.toggle("screen--active", screen.dataset.screen === target);
  });

  title.textContent = titles[target] || "ChadMailer";
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    activateScreen(tab.dataset.target);
  });
});
