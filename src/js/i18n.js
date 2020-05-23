document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = chrome.i18n.getMessage(el.textContent.trim());
});

// Toggle dark mode
const $themeSwitch = document.querySelector('#themeSwitch');

if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.body.classList.add('dark');
    $themeSwitch.innerHTML = '🌙';
}

$themeSwitch.addEventListener('click', e => {
    e.preventDefault();
    const el = e.target;

    const bodyClass = document.body.classList;
    bodyClass.contains('dark')
        ? ((el.innerHTML = '☀️'), bodyClass.remove('dark'))
        : ((el.innerHTML = '🌙'), bodyClass.add('dark'));
});
