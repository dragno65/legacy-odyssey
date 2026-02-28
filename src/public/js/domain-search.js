/**
 * Domain Search — Landing Page
 * Handles domain availability search, result display, selection, and checkout wiring.
 */
(function () {
  'use strict';

  // DOM elements
  const searchInput = document.getElementById('domainSearchInput');
  const searchBtn = document.getElementById('domainSearchBtn');
  const loadingEl = document.getElementById('domainSearchLoading');
  const resultsEl = document.getElementById('domainResults');
  const alternativesEl = document.getElementById('domainAlternatives');
  const alternativesListEl = document.getElementById('domainAlternativesList');
  const selectedEl = document.getElementById('domainSelected');
  const selectedNameEl = document.getElementById('selectedDomainName');
  const changeBtn = document.getElementById('domainChangeBtn');
  const examplesEl = document.getElementById('domainExamples');

  if (!searchInput || !searchBtn) return;

  // State
  let selectedDomain = null;

  // --- Search ---

  searchBtn.addEventListener('click', doSearch);
  searchInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') doSearch();
  });

  // Example chips
  document.querySelectorAll('.domain-chip').forEach(function (chip) {
    chip.addEventListener('click', function () {
      searchInput.value = chip.getAttribute('data-name');
      doSearch();
    });
  });

  // Change button
  if (changeBtn) {
    changeBtn.addEventListener('click', function () {
      selectedDomain = null;
      selectedEl.style.display = 'none';
      resultsEl.style.display = 'none';
      alternativesEl.style.display = 'none';
      examplesEl.style.display = '';
      searchInput.value = '';
      searchInput.focus();
    });
  }

  async function doSearch() {
    var name = searchInput.value.trim().replace(/[^a-zA-Z0-9-]/g, '');
    if (!name || name.length < 2) {
      searchInput.focus();
      return;
    }

    // Show loading
    loadingEl.style.display = 'flex';
    resultsEl.style.display = 'none';
    alternativesEl.style.display = 'none';
    selectedEl.style.display = 'none';
    examplesEl.style.display = 'none';

    try {
      var res = await fetch('/api/domains/search?name=' + encodeURIComponent(name));
      var data = await res.json();

      if (!res.ok) {
        showError(data.error || 'Search failed. Please try again.');
        return;
      }

      renderResults(data.results || []);

      if (data.alternatives && data.alternatives.length > 0) {
        renderAlternatives(data.alternatives);
      } else {
        alternativesEl.style.display = 'none';
      }
    } catch (err) {
      showError('Connection error. Please try again.');
    } finally {
      loadingEl.style.display = 'none';
    }
  }

  // --- Render Results ---

  function renderResults(results) {
    resultsEl.innerHTML = '';

    results.forEach(function (r) {
      var card = document.createElement('div');
      card.className = 'domain-result-card';

      var available = r.available && r.underBudget;

      card.innerHTML =
        '<div class="domain-result-name">www.' + escapeHtml(r.domain) + '</div>' +
        '<div class="domain-result-status ' + (available ? 'available' : 'taken') + '">' +
          (available ? 'Available' : 'Taken') +
        '</div>' +
        (available
          ? '<button type="button" class="domain-select-btn">Select</button>'
          : '');

      if (available) {
        card.querySelector('.domain-select-btn').addEventListener('click', function () {
          selectDomain(r.domain);
        });
      }

      resultsEl.appendChild(card);
    });

    resultsEl.style.display = '';
  }

  function renderAlternatives(alts) {
    alternativesListEl.innerHTML = '';

    alts.forEach(function (r) {
      var card = document.createElement('div');
      card.className = 'domain-result-card';
      card.innerHTML =
        '<div class="domain-result-name">www.' + escapeHtml(r.domain) + '</div>' +
        '<div class="domain-result-status available">Available</div>' +
        '<button type="button" class="domain-select-btn">Select</button>';

      card.querySelector('.domain-select-btn').addEventListener('click', function () {
        selectDomain(r.domain);
      });

      alternativesListEl.appendChild(card);
    });

    alternativesEl.style.display = '';
  }

  function showError(msg) {
    resultsEl.innerHTML = '<div class="domain-search-error">' + escapeHtml(msg) + '</div>';
    resultsEl.style.display = '';
  }

  // --- Selection ---

  function selectDomain(domain) {
    // Confirm spelling before locking in domain selection
    var confirmed = confirm(
      'You selected: www.' + domain + '\n\n' +
      'PLEASE CHECK THE SPELLING CAREFULLY.\n\n' +
      'Domain name purchases are non-refundable once registered. ' +
      'We cannot change or refund your domain after purchase.\n\n' +
      'Is the spelling correct?'
    );
    if (!confirmed) return;

    selectedDomain = domain;
    selectedNameEl.textContent = 'www.' + domain;
    selectedEl.style.display = 'flex';
    resultsEl.style.display = 'none';
    alternativesEl.style.display = 'none';

    // Scroll to pricing
    var pricing = document.getElementById('pricing');
    if (pricing) {
      setTimeout(function () {
        pricing.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }

  // --- Pricing button wiring ---

  document.querySelectorAll('.pricing-card a').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();

      if (!selectedDomain) {
        // Scroll to domain search
        var ds = document.getElementById('domain-search');
        if (ds) ds.scrollIntoView({ behavior: 'smooth', block: 'center' });
        searchInput.focus();
        searchInput.classList.add('domain-search-highlight');
        setTimeout(function () {
          searchInput.classList.remove('domain-search-highlight');
        }, 2000);
        return;
      }

      // Determine plan from card
      var card = btn.closest('.pricing-card');
      var planName = card.querySelector('.pricing-name').textContent.toLowerCase();

      // Determine billing period
      var billingToggle = document.getElementById('billingToggle');
      var period = (billingToggle && billingToggle.checked) ? 'annual' : 'monthly';

      // Prompt for email then create checkout
      var email = prompt('Enter your email to get started:');
      if (!email || !email.includes('@')) return;

      // Final confirmation with domain refund warning
      var finalConfirm = confirm(
        'You are about to purchase:\n\n' +
        'Plan: ' + planName.charAt(0).toUpperCase() + planName.slice(1) + ' (' + period + ')\n' +
        'Domain: www.' + selectedDomain + '\n\n' +
        'REMINDER: Domain name purchases are NON-REFUNDABLE.\n' +
        'Please verify the domain spelling one last time.\n\n' +
        'Proceed to checkout?'
      );
      if (!finalConfirm) return;

      createCheckout(email, selectedDomain, planName, period);
    });
  });

  async function createCheckout(email, domain, plan, period) {
    try {
      var res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, domain: domain, plan: plan, period: period }),
      });

      var data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Could not start checkout. Please try again.');
      }
    } catch (err) {
      alert('Connection error. Please try again.');
    }
  }

  // --- Helpers ---

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
})();
