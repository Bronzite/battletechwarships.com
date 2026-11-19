// Vanilla JavaScript Combined Table Filter, Pagination & Citation Group Search
document.addEventListener('DOMContentLoaded', function () {
  const tableLimits = {};
  document.querySelectorAll('select[data-table-limit]').forEach(function (limitSel) {
    const tableId = limitSel.getAttribute('data-table-limit');
    const parsed = parseInt(limitSel.value, 10);
    tableLimits[tableId] = isNaN(parsed) ? 0 : parsed;
  });

  function applyFilters(tableId) {
    const table = document.getElementById(tableId);
    if (!table) return;

    const searchInput = document.querySelector('input[data-table-filter="' + tableId + '"]');
    const filterText = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const selects = document.querySelectorAll('select[data-table-select="' + tableId + '"]');

    let hasSelectFilter = false;
    selects.forEach(function (sel) {
      if (sel.value.trim()) hasSelectFilter = true;
    });
    const hasActiveFilter = Boolean(filterText) || hasSelectFilter;
    const limitVal = Object.prototype.hasOwnProperty.call(tableLimits, tableId) ? tableLimits[tableId] : 0;

    const rows = table.querySelectorAll('tbody tr');
    let matchedCount = 0;
    let shownCount = 0;

    rows.forEach(function (row) {
      let matches = true;
      if (filterText) {
        const text = row.textContent.toLowerCase();
        if (!text.includes(filterText)) matches = false;
      }

      if (matches && selects.length > 0) {
        selects.forEach(function (sel) {
          const val = sel.value.trim().toLowerCase();
          if (!val) return;
          const colIdx = parseInt(sel.getAttribute('data-col'), 10);
          const matchMode = (sel.getAttribute('data-match') || 'exact').toLowerCase();
          const cell = row.cells && row.cells[colIdx];
          const cellText = cell ? cell.textContent.trim().toLowerCase() : '';
          if (matchMode === 'contains') {
            if (!cellText.includes(val)) matches = false;
          } else {
            if (cellText !== val) matches = false;
          }
        });
      }

      if (!matches) {
        row.style.display = 'none';
        return;
      }

      matchedCount += 1;
      if (!hasActiveFilter && limitVal > 0 && shownCount >= limitVal) {
        row.style.display = 'none';
      } else {
        row.style.display = '';
        shownCount += 1;
      }
    });

    const statusEl = document.querySelector('[data-table-status="' + tableId + '"]');
    if (statusEl) {
      const noun = (statusEl.getAttribute('data-noun') || table.getAttribute('data-noun') || 'HULLS').toUpperCase();
      if (hasActiveFilter) {
        statusEl.textContent = 'MATCHING ' + matchedCount + ' OF ' + rows.length + ' ' + noun;
      } else if (limitVal > 0 && rows.length > shownCount) {
        statusEl.textContent = 'SHOWING ' + shownCount + ' OF ' + rows.length + ' ' + noun;
      } else {
        statusEl.textContent = 'SHOWING ALL ' + rows.length + ' ' + noun;
      }
    }

    const moreBtn = document.querySelector('button[data-table-more="' + tableId + '"]');
    if (moreBtn) {
      moreBtn.style.display = (!hasActiveFilter && limitVal > 0 && matchedCount > shownCount) ? '' : 'none';
    }
  }

  document.querySelectorAll('input[data-table-filter]').forEach(function (input) {
    const targetTableId = input.getAttribute('data-table-filter');
    input.addEventListener('input', function () {
      applyFilters(targetTableId);
    });
  });

  document.querySelectorAll('select[data-table-select]').forEach(function (sel) {
    const targetTableId = sel.getAttribute('data-table-select');
    sel.addEventListener('change', function () {
      applyFilters(targetTableId);
    });
  });

  document.querySelectorAll('select[data-table-limit]').forEach(function (limitSel) {
    const targetTableId = limitSel.getAttribute('data-table-limit');
    limitSel.addEventListener('change', function () {
      const parsed = parseInt(limitSel.value, 10);
      tableLimits[targetTableId] = isNaN(parsed) ? 0 : parsed;
      applyFilters(targetTableId);
    });
    applyFilters(targetTableId);
  });

  document.querySelectorAll('button[data-table-more]').forEach(function (moreBtn) {
    const targetTableId = moreBtn.getAttribute('data-table-more');
    moreBtn.addEventListener('click', function () {
      const curr = tableLimits[targetTableId] || 100;
      tableLimits[targetTableId] = curr + 100;
      applyFilters(targetTableId);
    });
  });

  function applyCitationFilter(containerId, query) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const filterText = query ? query.trim().toLowerCase() : '';
    const groups = container.querySelectorAll('details.citation-group');
    let visibleCitations = 0;
    let visibleGroups = 0;

    groups.forEach(function (group) {
      const sourceDoc = (group.getAttribute('data-source-doc') || '').toLowerCase();
      const sourceMatches = Boolean(filterText) && sourceDoc.includes(filterText);
      const rows = group.querySelectorAll('tbody tr');
      let groupMatches = 0;

      rows.forEach(function (row) {
        const show = !filterText || sourceMatches || row.textContent.toLowerCase().includes(filterText);
        row.style.display = show ? '' : 'none';
        if (show) groupMatches += 1;
      });

      if (groupMatches > 0) {
        group.style.display = '';
        visibleGroups += 1;
        visibleCitations += groupMatches;
        group.open = Boolean(filterText);
      } else {
        group.style.display = 'none';
        group.open = false;
      }
    });

    const countEl = document.getElementById(containerId + '-count');
    if (countEl) {
      if (filterText) {
        countEl.textContent = 'MATCHING ' + visibleCitations + ' CITATION(S) ACROSS ' + visibleGroups + ' SOURCE(S)';
      } else {
        const totalCites = container.getAttribute('data-total-citations') || visibleCitations;
        const totalSources = container.getAttribute('data-total-sources') || visibleGroups;
        countEl.textContent = totalCites + ' CITATIONS ACROSS ' + totalSources + ' SOURCES';
      }
    }
  }

  document.querySelectorAll('input[data-citation-filter]').forEach(function (input) {
    const targetId = input.getAttribute('data-citation-filter');
    input.addEventListener('input', function () {
      applyCitationFilter(targetId, input.value);
    });
  });

  document.querySelectorAll('button[data-expand-all]').forEach(function (btn) {
    const targetId = btn.getAttribute('data-expand-all');
    btn.addEventListener('click', function () {
      const container = document.getElementById(targetId);
      if (!container) return;
      container.querySelectorAll('details.citation-group').forEach(function (g) {
        if (g.style.display !== 'none') g.open = true;
      });
    });
  });

  document.querySelectorAll('button[data-collapse-all]').forEach(function (btn) {
    const targetId = btn.getAttribute('data-collapse-all');
    btn.addEventListener('click', function () {
      const container = document.getElementById(targetId);
      if (!container) return;
      container.querySelectorAll('details.citation-group').forEach(function (g) {
        g.open = false;
      });
    });
  });

  // Lazy-loaded Global Quick-Jump Archive Search
  document.querySelectorAll('[data-global-search-container]').forEach(function (container) {
    const input = container.querySelector('input[data-global-search]');
    const resultsEl = container.querySelector('.global-search-results');
    const rootPath = container.getAttribute('data-root') || '';
    if (!input || !resultsEl) return;

    let cachedIndex = null;
    let loadingPromise = null;

    function loadIndex() {
      if (cachedIndex) return Promise.resolve(cachedIndex);
      if (loadingPromise) return loadingPromise;
      loadingPromise = fetch(rootPath + 'assets/search-index.json')
        .then(function (resp) { return resp.ok ? resp.json() : []; })
        .then(function (data) { cachedIndex = Array.isArray(data) ? data : []; return cachedIndex; })
        .catch(function () { return []; });
      return loadingPromise;
    }

    function renderResults(query) {
      const q = query.trim().toLowerCase();
      if (q.length < 2) {
        resultsEl.innerHTML = '';
        resultsEl.hidden = true;
        return;
      }

      loadIndex().then(function (items) {
        const currentQ = input.value.trim().toLowerCase();
        if (currentQ.length < 2) {
          resultsEl.hidden = true;
          return;
        }
        const scored = [];
        for (let i = 0; i < items.length; i += 1) {
          const item = items[i];
          const tLower = (item.title || '').toLowerCase();
          const sLower = (item.subtitle || '').toLowerCase();
          let rank = 0;
          if (tLower === currentQ) rank = 100;
          else if (tLower.startsWith(currentQ)) rank = 75;
          else if (tLower.includes(currentQ)) rank = 50;
          else if (sLower.includes(currentQ)) rank = 20;
          if (rank > 0) scored.push({ rank: rank, item: item });
        }
        scored.sort(function (a, b) {
          if (b.rank !== a.rank) return b.rank - a.rank;
          return a.item.title.localeCompare(b.item.title);
        });

        resultsEl.innerHTML = '';
        const top = scored.slice(0, 12);
        if (top.length === 0) {
          const emptyEl = document.createElement('div');
          emptyEl.className = 'global-search-item text-dim';
          emptyEl.textContent = 'NO MATCHING ARCHIVE RECORDS FOUND.';
          resultsEl.appendChild(emptyEl);
        } else {
          top.forEach(function (entry) {
            const a = document.createElement('a');
            a.className = 'global-search-item';
            a.href = rootPath + entry.item.url;
            const titleLine = document.createElement('span');
            titleLine.textContent = '[' + entry.item.category + '] ' + entry.item.title;
            const metaLine = document.createElement('span');
            metaLine.className = 'global-search-meta';
            metaLine.textContent = entry.item.subtitle || '';
            a.appendChild(titleLine);
            a.appendChild(metaLine);
            resultsEl.appendChild(a);
          });
        }
        resultsEl.hidden = false;
      });
    }

    input.addEventListener('focus', function () { loadIndex(); });
    input.addEventListener('input', function () { renderResults(input.value); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        resultsEl.hidden = true;
        input.blur();
      }
    });
    document.addEventListener('click', function (e) {
      if (!container.contains(e.target)) {
        resultsEl.hidden = true;
      }
    });
  });

  // Interactive SVG Starmap Pan/Zoom & Presets
  const starmap = document.querySelector('svg[data-starmap]');
  if (starmap) {
    const initialViewBox = starmap.getAttribute('data-default-viewbox') || '-700 -700 1400 1400';
    function setViewBox(vb) {
      starmap.setAttribute('viewBox', vb);
    }
    document.querySelectorAll('button[data-starmap-preset]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const preset = btn.getAttribute('data-starmap-preset');
        if (preset === 'innersphere') setViewBox('-620 -620 1240 1240');
        else if (preset === 'core') setViewBox('-160 -160 320 320');
        else setViewBox(initialViewBox);
      });
    });

    let isPanning = false;
    let panStartX = 0;
    let panStartY = 0;
    let panViewBox = null;

    function parseViewBox() {
      const parts = (starmap.getAttribute('viewBox') || initialViewBox).trim().split(/\s+/).map(Number);
      return { x: parts[0] || 0, y: parts[1] || 0, w: parts[2] || 1400, h: parts[3] || 1400 };
    }

    starmap.addEventListener('wheel', function (e) {
      e.preventDefault();
      const vb = parseViewBox();
      const factor = e.deltaY < 0 ? 0.82 : 1.22;
      const nw = Math.max(80, Math.min(8000, vb.w * factor));
      const nh = Math.max(80, Math.min(8000, vb.h * factor));
      const nx = vb.x + (vb.w - nw) / 2;
      const ny = vb.y + (vb.h - nh) / 2;
      setViewBox(nx.toFixed(1) + ' ' + ny.toFixed(1) + ' ' + nw.toFixed(1) + ' ' + nh.toFixed(1));
    }, { passive: false });

    starmap.addEventListener('mousedown', function (e) {
      if (e.target && e.target.closest('a')) return;
      isPanning = true;
      panStartX = e.clientX;
      panStartY = e.clientY;
      panViewBox = parseViewBox();
    });

    window.addEventListener('mousemove', function (e) {
      if (!isPanning || !panViewBox) return;
      const rect = starmap.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const dx = (e.clientX - panStartX) * (panViewBox.w / rect.width);
      const dy = (e.clientY - panStartY) * (panViewBox.h / rect.height);
      setViewBox((panViewBox.x - dx).toFixed(1) + ' ' + (panViewBox.y - dy).toFixed(1) + ' ' + panViewBox.w.toFixed(1) + ' ' + panViewBox.h.toFixed(1));
    });

    window.addEventListener('mouseup', function () {
      isPanning = false;
      panViewBox = null;
    });
  }
});
