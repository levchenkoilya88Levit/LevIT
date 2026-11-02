/* LevIT — скрипти сайту.
   Адреса форми та email задаються в _data/company.yml (form_endpoint, email). */
(function () {
  const CFG = window.LEVIT || {};

  /* ---------- Мобільне меню ---------- */
  const burger = document.querySelector('.burger'), mmenu = document.getElementById('mmenu');
  if (burger && mmenu) {
    burger.addEventListener('click', () => { const o = mmenu.classList.toggle('open'); burger.setAttribute('aria-expanded', o); });
    mmenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { mmenu.classList.remove('open'); burger.setAttribute('aria-expanded', false); }));
  }

  /* ---------- Мега-меню «Наші послуги» ---------- */
  const mega = document.querySelector('.has-mega');
  if (mega) {
    const btn = mega.querySelector('.nav-drop');
    let t;
    const set = o => { mega.classList.toggle('open', o); btn.setAttribute('aria-expanded', o); };
    btn.addEventListener('click', () => set(!mega.classList.contains('open')));
    if (matchMedia('(hover:hover)').matches) {
      mega.addEventListener('mouseenter', () => { clearTimeout(t); set(true); });
      mega.addEventListener('mouseleave', () => { t = setTimeout(() => set(false), 180); });
    }
    document.addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
    document.addEventListener('click', e => { if (!mega.contains(e.target)) set(false); });
    mega.querySelectorAll('.mega a').forEach(a => a.addEventListener('click', () => set(false)));
  }

  /* ---------- Фільтр каталогу готових рішень ---------- */
  const chips = document.querySelectorAll('.chip[data-filter]');
  if (chips.length) {
    const blocks = document.querySelectorAll('.cat-block');
    const apply = id => {
      chips.forEach(c => c.classList.toggle('on', c.dataset.filter === id));
      blocks.forEach(b => { b.hidden = id !== 'all' && b.dataset.cat !== id; });
    };
    chips.forEach(c => c.addEventListener('click', () => {
      const id = c.dataset.filter;
      apply(id);
      history.replaceState(null, '', id === 'all' ? location.pathname : '#' + id);
    }));
    const fromHash = () => { const h = location.hash.slice(1); if (h && document.querySelector('.chip[data-filter="' + h + '"]')) apply(h); };
    fromHash();
    window.addEventListener('hashchange', fromHash);
  }

  /* ---------- Підсвітка пунктів підменю при прокрутці ---------- */
  const sub = document.querySelectorAll('.subnav a');
  if (sub.length && 'IntersectionObserver' in window) {
    const map = new Map([...sub].map(a => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { sub.forEach(a => a.classList.remove('on')); map.get(e.target.id)?.classList.add('on'); }
    }), { rootMargin: '-40% 0px -55% 0px' });
    map.forEach((_, id) => { const el = document.getElementById(id); if (el) io.observe(el); });
  }

  /* ---------- Форми заявки ---------- */
  document.querySelectorAll('.lead-form').forEach(form => {
    const box = form.closest('.lead-box'), submit = form.querySelector('[type=submit]'), label = submit.textContent;
    form.addEventListener('submit', async e => {
      e.preventDefault();
      let ok = true;
      [['name', v => v.trim().length > 1], ['phone', v => v.replace(/\D/g, '').length >= 10]].forEach(([n, test]) => {
        const inp = form.elements[n], good = test(inp.value);
        inp.parentElement.classList.toggle('bad', !good); inp.setAttribute('aria-invalid', !good);
        if (!good && ok) { inp.focus(); ok = false; }
      });
      if (!ok) return;
      const data = Object.assign({ type: form.dataset.kind, page: location.pathname }, Object.fromEntries(new FormData(form)));
      if (CFG.endpoint) {
        submit.disabled = true; submit.textContent = 'Надсилаємо…';
        try {
          // Google Apps Script приймає text/plain без CORS-preflight; інші сервіси (Formspree) — JSON
          const gas = CFG.endpoint.includes('script.google.com');
          const r = await fetch(CFG.endpoint, {
            method: 'POST',
            headers: gas ? { 'Content-Type': 'text/plain;charset=utf-8' } : { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(data),
          });
          if (!r.ok) throw 0;
          if (gas) { const res = await r.json(); if (!res.ok) throw 0; }
          box.classList.add('sent');
          form.reset();
        } catch {
          submit.disabled = false; submit.textContent = label;
          alert('Заявку не надіслано через збій з’єднання. Спробуйте ще раз або напишіть нам: ' + CFG.phone + ', Telegram @' + (CFG.telegram || ''));
        }
      } else {
        const names = { type: 'Тип', page: 'Сторінка', format: 'Формат', name: 'Ім’я', phone: 'Телефон', company: 'Компанія', role: 'Посада', message: 'Задача' };
        const body = Object.entries(data).map(([k, v]) => (names[k] || k) + ': ' + (v || '—')).join('\n');
        location.href = 'mailto:' + CFG.email + '?subject=' + encodeURIComponent('Заявка з сайту LevIT') + '&body=' + encodeURIComponent(body);
        box.classList.add('sent');
      }
    });
    form.querySelectorAll('input').forEach(i => i.addEventListener('input', () => i.parentElement.classList.remove('bad')));
  });
})();
