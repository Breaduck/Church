// data/news.json → 홈 화면 '교회소식' 카드
// data/notices.json → 상단 '공지사항' 패널
// 관리자가 /admin/ 에서 편집한 뒤 배포되면 자동 반영됩니다.
(async function loadContent() {
  const grid = document.querySelector('.news-grid');
  const noticeList = document.querySelector('.notice-list');
  if (!grid && !noticeList) return;

  const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));

  const fmtDate = iso => {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
    return m ? `${m[1]}. ${m[2]}. ${m[3]}` : (iso || '');
  };

  const bust = () => `?t=${Date.now()}`;

  // 이전 데이터(단일 image) 및 신규 데이터(images 배열) 모두 지원
  const getImages = item =>
    (Array.isArray(item.images) && item.images.length
      ? item.images
      : (item.image ? [item.image] : [])
    ).filter(Boolean);

  // 이미지 전체화면 확대(클릭/휠로 확대, 드래그로 이동)
  const zoom = (() => {
    const overlay = document.getElementById('img-zoom');
    if (!overlay) return { open() {}, isOpen: () => false };
    const img = document.getElementById('img-zoom-img');
    const closeBtn = document.getElementById('img-zoom-close');
    let scale = 1, tx = 0, ty = 0, dragging = false, moved = false, sx = 0, sy = 0;

    const apply = () => { img.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`; };
    const setScale = s => {
      scale = Math.min(5, Math.max(1, s));
      if (scale === 1) { tx = 0; ty = 0; }
      img.classList.toggle('zoomed', scale > 1);
      apply();
    };
    const open = src => {
      img.src = src;
      scale = 1; tx = 0; ty = 0; img.classList.remove('zoomed'); apply();
      overlay.classList.add('open');
    };
    const close = () => overlay.classList.remove('open');
    const isOpen = () => overlay.classList.contains('open');

    img.addEventListener('click', e => {
      e.stopPropagation();
      if (moved) { moved = false; return; }
      setScale(scale > 1 ? 1 : 2.5);
    });
    img.addEventListener('wheel', e => {
      e.preventDefault();
      setScale(scale + (e.deltaY < 0 ? 0.3 : -0.3));
    }, { passive: false });
    img.addEventListener('pointerdown', e => {
      if (scale <= 1) return;
      dragging = true; moved = false;
      sx = e.clientX - tx; sy = e.clientY - ty;
      img.setPointerCapture(e.pointerId);
    });
    img.addEventListener('pointermove', e => {
      if (!dragging) return;
      tx = e.clientX - sx; ty = e.clientY - sy; moved = true; apply();
    });
    img.addEventListener('pointerup', () => { dragging = false; });
    overlay.addEventListener('click', close);
    closeBtn.addEventListener('click', e => { e.stopPropagation(); close(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && isOpen()) { e.stopPropagation(); close(); }
    });

    return { open, isOpen };
  })();

  async function fetchJson(path) {
    try {
      const res = await fetch(path + bust(), { cache: 'no-store' });
      if (!res.ok) return null;
      return await res.json();
    } catch (_) { return null; }
  }

  // 관리자 저장 즉시 반영: 먼저 GitHub 실시간 API(/api/content)를 시도하고,
  // 실패하면 배포된 정적 파일(/data/*.json)로 폴백한다.
  async function loadCollection(type) {
    try {
      const res = await fetch(`/api/content?type=${type}` + `&t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.items)) return data;
      }
    } catch (_) { /* 폴백 */ }
    return fetchJson(`/data/${type === 'news' ? 'news' : 'notices'}.json`);
  }

  // 교회소식 · 공지사항 공용 상세 팝업
  const modal = document.getElementById('news-modal');
  const openModal = (() => {
    if (!modal) return null;
    const modalMedia = document.getElementById('news-modal-media');
    const modalTag = document.getElementById('news-modal-tag');
    const modalDate = document.getElementById('news-modal-date');
    const modalTitle = document.getElementById('news-modal-title');
    const modalText = document.getElementById('news-modal-text');
    const modalVideo = document.getElementById('news-modal-video');
    const modalClose = document.getElementById('news-modal-close');
    if (!modalMedia || !modalTitle || !modalText || !modalClose) return null;

    const close = () => {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    };
    modalClose.addEventListener('click', close);
    modal.querySelectorAll('[data-news-close]').forEach(el => el.addEventListener('click', close));
    document.addEventListener('keydown', e => {
      // 확대 보기가 열려 있으면 그것만 닫고 상세 팝업은 유지
      if (e.key === 'Escape' && modal.classList.contains('open') && !zoom.isOpen()) close();
    });

    // 상세 팝업 안 이미지 갤러리 (여러 장 넘겨보기 + 클릭 시 전체화면 확대)
    function renderMedia(images) {
      modalMedia.innerHTML = '';
      modalMedia.hidden = !images.length;
      if (!images.length) return;

      const gallery = document.createElement('div');
      gallery.className = 'news-gallery';
      let idx = 0;
      const img = document.createElement('img');
      img.src = images[0];
      img.alt = '';
      img.addEventListener('click', () => zoom.open(images[idx]));
      gallery.appendChild(img);

      if (images.length > 1) {
        const prev = document.createElement('button');
        prev.type = 'button'; prev.className = 'gal-nav gal-prev'; prev.setAttribute('aria-label', '이전 사진'); prev.textContent = '‹';
        const next = document.createElement('button');
        next.type = 'button'; next.className = 'gal-nav gal-next'; next.setAttribute('aria-label', '다음 사진'); next.textContent = '›';
        const dots = document.createElement('div');
        dots.className = 'gal-dots';
        const dotEls = images.map((_, i) => {
          const d = document.createElement('span');
          if (i === 0) d.className = 'on';
          dots.appendChild(d);
          return d;
        });
        const show = n => {
          idx = (n + images.length) % images.length;
          img.src = images[idx];
          dotEls.forEach((d, i) => { d.className = i === idx ? 'on' : ''; });
        };
        prev.addEventListener('click', e => { e.stopPropagation(); show(idx - 1); });
        next.addEventListener('click', e => { e.stopPropagation(); show(idx + 1); });
        gallery.append(prev, next, dots);
      }
      modalMedia.appendChild(gallery);
    }

    return item => {
      renderMedia(getImages(item));
      modalTag.textContent = item.tag || '';
      modalDate.textContent = fmtDate(item.date);
      modalTitle.textContent = item.title || '';
      modalText.textContent = item.body || '';
      modalText.hidden = !item.body;
      if (item.video) {
        modalVideo.href = item.video;
        modalVideo.hidden = false;
      } else {
        modalVideo.hidden = true;
      }
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    };
  })();

  // 교회소식 카드
  if (grid) {
    const data = await loadCollection('news');
    const items = ((data && data.items) || []).slice();
    if (items.length) {
      grid.innerHTML = items.map((item, i) => {
        let media = '';
        const imgs = getImages(item);
        if (imgs.length) {
          const img = `<img src="${escapeHtml(imgs[0])}" alt="" loading="lazy" />`;
          const play = item.video ? `<span class="news-play"><svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M8 5v14l11-7z"/></svg></span>` : '';
          const count = imgs.length > 1 ? `<span class="news-img-count">${imgs.length}</span>` : '';
          media = `<div class="news-img">${img}${play}${count}</div>`;
        }
        return `
        <article class="news-card reveal visible" data-idx="${i}" tabindex="0" role="button" aria-haspopup="dialog">
          ${media}
          <div class="news-body">
            <h3 class="news-title">${escapeHtml(item.title || '')}</h3>
          </div>
        </article>
      `;
      }).join('');

      if (openModal) {
        grid.querySelectorAll('.news-card').forEach(card => {
          const item = items[Number(card.dataset.idx)];
          card.addEventListener('click', () => openModal(item));
          card.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(item); }
          });
        });
      }
    }

    // 슬라이더 내비게이션 (3개 초과로 넘칠 때만 표시) + 자동 넘김
    const viewport = grid.closest('.news-viewport');
    const nav = document.getElementById('news-nav');
    const prevBtn = document.getElementById('news-prev');
    const nextBtn = document.getElementById('news-next');
    if (viewport && nav && prevBtn && nextBtn) {
      let autoTimer = null;
      const AUTO_DELAY = 4500;

      const atEnd = () => viewport.scrollLeft >= viewport.scrollWidth - viewport.clientWidth - 4;
      const advance = () => {
        if (atEnd()) viewport.scrollTo({ left: 0, behavior: 'smooth' });
        else viewport.scrollBy({ left: viewport.clientWidth, behavior: 'smooth' });
      };
      const stopAuto = () => { if (autoTimer) { clearInterval(autoTimer); autoTimer = null; } };
      const startAuto = () => {
        stopAuto();
        if (viewport.scrollWidth <= viewport.clientWidth + 4) return;
        autoTimer = setInterval(advance, AUTO_DELAY);
      };

      const updateNav = () => {
        const scrollable = viewport.scrollWidth > viewport.clientWidth + 4;
        nav.hidden = !scrollable;
        if (!scrollable) { stopAuto(); return; }
        prevBtn.disabled = viewport.scrollLeft <= 4;
        nextBtn.disabled = false; // 끝에서도 처음으로 순환
        startAuto();
      };

      prevBtn.addEventListener('click', () => {
        viewport.scrollBy({ left: -viewport.clientWidth, behavior: 'smooth' });
        startAuto();
      });
      nextBtn.addEventListener('click', () => { advance(); startAuto(); });
      viewport.addEventListener('mouseenter', stopAuto);
      viewport.addEventListener('mouseleave', startAuto);
      viewport.addEventListener('scroll', () => {
        prevBtn.disabled = viewport.scrollLeft <= 4;
      }, { passive: true });
      window.addEventListener('resize', updateNav);
      updateNav();
    }
  }

  // 공지사항 패널
  if (noticeList) {
    const data = await loadCollection('notices');
    const items = ((data && data.items) || []).slice();
    if (items.length) {
      const shown = items.slice(0, 8);
      noticeList.innerHTML = shown.map((item, i) => {
        const inner = `
          <span class="notice-item-date">${escapeHtml(fmtDate(item.date))}</span>
          <p class="notice-item-title">${escapeHtml(item.title || '')}</p>
        `;
        const hasExtra = !!(getImages(item).length || item.body || item.video);
        if (!hasExtra || !openModal) {
          return `<li class="notice-item">${inner}</li>`;
        }
        return `<li class="notice-item notice-item--clickable" data-nidx="${i}" tabindex="0" role="button" aria-haspopup="dialog">${inner}</li>`;
      }).join('');

      if (openModal) {
        noticeList.querySelectorAll('.notice-item--clickable').forEach(li => {
          const item = shown[Number(li.dataset.nidx)];
          li.addEventListener('click', () => openModal(item));
          li.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(item); }
          });
        });
      }
    }
  }
})();
