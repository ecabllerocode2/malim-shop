// analytics.js
export const initGA = (measurementId) => {
  if (!measurementId || typeof window === 'undefined') return;

  // Carga gtag
  const s1 = document.createElement('script');
  s1.async = true;
  s1.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(s1);

  window.dataLayer = window.dataLayer || [];
  function gtag(){ window.dataLayer.push(arguments); }
  window.gtag = gtag;

  gtag('js', new Date());

  // ✅ Primera página se registra automáticamente
  gtag('config', measurementId, { send_page_view: true });

  // Debug en desarrollo
  if (import.meta.env.DEV) {
    gtag('set', 'debug_mode', true);
  }
};

export const pageView = (path, title) => {
  if (!window.gtag) return;
  window.gtag('event', 'page_view', {
    page_title: title,
    page_location: window.location.origin + path,
    page_path: path,
  });
};

export const trackSelectItem = (item, listName = 'Catálogo') => {
  if (!window.gtag || !item) return;
  window.gtag('event', 'select_item', {
    item_list_name: listName,
    items: [{
      item_id: String(item.id ?? ''),
      item_name: item.nombre ?? '',
      item_category: item.categoria ?? '',
      price: item.precio ?? 0,
    }],
  });
};

export const trackViewItem = (item) => {
  if (!window.gtag || !item) return;
  window.gtag('event', 'view_item', {
    currency: 'MXN',
    value: item.precio ?? 0,
    items: [{
      item_id: String(item.id ?? ''),
      item_name: item.nombre ?? '',
      item_category: item.categoria ?? '',
      price: item.precio ?? undefined,
    }],
  });
};

export const trackWhatsappClick = (item, waNumber, waUrl) => {
  const open = () => window.open(waUrl, '_blank');
  if (!window.gtag) {
    open();
    return;
  }

  let called = false;
  const openOnce = () => { if (!called) { called = true; open(); } };

  window.gtag('event', 'generate_lead', {
    medium: 'whatsapp',
    value: item?.precio ?? 0,
    items: item ? [{
      item_id: String(item.id ?? ''),
      item_name: item.nombre ?? '',
      item_category: item.categoria ?? '',
      price: item.precio ?? 0,
    }] : undefined,
    event_callback: openOnce,
  });

  setTimeout(openOnce, 500);
};

export const trackSearch = (query, resultados) => {
  if (window.gtag) {
    window.gtag("event", "search", {
      search_term: query,
      number_of_results: resultados
    });
  }
};
