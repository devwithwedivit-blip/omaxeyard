/**
 * ============================================================================
 * Universal Reusable Enquiry Modal Controller
 * Site: Omaxe City / Skyyards Bareilly
 * 
 * Works across all pages, all listing cards, all pricing tables, and any
 * dynamically loaded listings.
 * ============================================================================
 */

(function() {
  'use strict';

  // ==========================================================================
  // 1. CONFIGURATION & INTEGRATION ENDPOINTS
  // ==========================================================================
  const ENQUIRY_CONFIG = {
    /**
     * Set your backend API or Webhook endpoint URL here.
     * Examples:
     * - Google Sheets (Google Apps Script Web App URL)
     * - Zapier / Make Webhook
     * - Formspree / Email Service
     * - Custom CRM or Node/Express / PHP API endpoint
     * 
     * Leave empty ('') to use the built-in placeholder logger.
     */
    endpointUrl: '',

    /**
     * Optional WhatsApp notification: Set a 10-12 digit phone number (e.g. '919876543210')
     * to open WhatsApp chat upon submission, or leave empty ('') to disable.
     */
    whatsappNumber: '',

    /**
     * Delay in milliseconds before automatically closing the popup on success.
     */
    autoCloseDelay: 3500,

    /**
     * Fallback property name when an Enquiry button does not belong to a specific listing.
     */
    defaultPropertyName: 'Omaxe City, Bareilly – Township Plots & Villas'
  };

  // State
  let modalEl = null;
  let isOpen = false;
  let autoCloseTimer = null;
  let lastActiveElement = null;

  // ==========================================================================
  // 2. MODAL DOM INJECTION & TEMPLATE
  // ==========================================================================
  function getModalHTML() {
    return `
      <div class="enquiry-modal-backdrop" id="enquiryModal" role="dialog" aria-modal="true" aria-labelledby="enquiryModalTitle" aria-hidden="true">
        <div class="enquiry-card" id="enquiryCard">
          <button type="button" class="enquiry-close-btn" id="enquiryCloseBtn" aria-label="Close enquiry popup">&times;</button>
          
          <!-- Form View -->
          <div id="enquiryFormView">
            <div class="enquiry-header-strip">
              <span class="enquiry-header-title">Omaxe City, Bareilly</span>
            </div>
            
            <h3 id="enquiryModalTitle" class="enquiry-main-heading">Enquiry for Residential Plot</h3>
            
            <form id="enquiryForm" class="enquiry-form" novalidate>
              <input type="hidden" name="property" id="enquiryProperty" value="">
              <input type="hidden" name="pageUrl" id="enquiryPageUrl" value="">
              <input type="hidden" name="submittedAt" id="enquirySubmittedAt" value="">
              
              <!-- Name Field -->
              <div class="enquiry-field-group">
                <label for="enquiryName" class="enquiry-label">Full Name <span class="enquiry-req">*</span></label>
                <input type="text" id="enquiryName" name="name" class="enquiry-input" placeholder="e.g. Rahul Sharma" autocomplete="name" required minlength="2">
                <div class="enquiry-error-msg" id="enquiryNameError" role="alert"></div>
              </div>
              
              <!-- Phone Field -->
              <div class="enquiry-field-group">
                <label for="enquiryPhone" class="enquiry-label">Phone Number <span class="enquiry-req">*</span></label>
                <div class="enquiry-phone-wrap">
                  <span class="enquiry-phone-prefix">+91</span>
                  <input type="tel" id="enquiryPhone" name="phone" class="enquiry-input with-prefix" placeholder="98765 43210" autocomplete="tel" maxlength="14" inputmode="tel" required>
                </div>
                <div class="enquiry-error-msg" id="enquiryPhoneError" role="alert"></div>
              </div>
              
              <!-- Consent Checkbox -->
              <div class="enquiry-consent-group">
                <label class="enquiry-consent-label" for="enquiryConsent">
                  <input type="checkbox" id="enquiryConsent" name="consent" class="enquiry-checkbox" checked required>
                  <span>I agree to be contacted by Omaxe Bareilly representatives via Call / WhatsApp.</span>
                </label>
                <div class="enquiry-error-msg" id="enquiryConsentError" role="alert"></div>
              </div>
              
              <!-- Submit Button -->
              <button type="submit" class="enquiry-submit-btn" id="enquirySubmitBtn">
                <span class="enquiry-btn-text" id="enquirySubmitBtnText">Submit Enquiry</span>
                <span class="enquiry-btn-spinner" id="enquirySubmitSpinner" style="display:none;" aria-hidden="true"></span>
              </button>
              
              <!-- Alert Error (Submission Failure) -->
              <div class="enquiry-alert-error" id="enquiryAlertError" style="display:none;" role="alert">
                Something went wrong. Please try again.
              </div>
            </form>
            
            <div class="enquiry-privacy-wrap">
              <a href="#privacy-policy" class="enquiry-privacy-link" id="enquiryPrivacyLink">Privacy Policy</a>
            </div>
          </div>
          
          <!-- Success View -->
          <div id="enquirySuccessView" class="enquiry-success-view" style="display:none;" aria-live="polite">
            <div class="enquiry-success-icon">
              <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#0F3D38" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10" fill="#e6f4ea" stroke="#0F3D38"></circle>
                <polyline points="8 12 11 15 16 9"></polyline>
              </svg>
            </div>
            <h3 class="enquiry-success-title">Thank you!</h3>
            <p class="enquiry-success-text" id="enquirySuccessText">
              Thank you! We have received your enquiry for <strong id="enquirySuccessProperty">Residential Plot</strong>. Our team will call you shortly.
            </p>
            <p class="enquiry-success-sub">This window will close automatically in a moment...</p>
          </div>
        </div>
      </div>
    `;
  }

  function ensureModalDOM() {
    modalEl = document.getElementById('enquiryModal');
    if (!modalEl) {
      const container = document.createElement('div');
      container.innerHTML = getModalHTML().trim();
      modalEl = container.firstElementChild;
      document.body.appendChild(modalEl);
    } else {
      // Ensure missing child elements exist if using legacy pre-rendered modal
      if (!document.getElementById('enquiryProperty')) {
        const form = document.getElementById('enquiryForm');
        if (form) {
          const hiddenProp = document.createElement('input');
          hiddenProp.type = 'hidden';
          hiddenProp.name = 'property';
          hiddenProp.id = 'enquiryProperty';
          form.prepend(hiddenProp);
        }
      }
      if (!document.getElementById('enquiryPageUrl')) {
        const form = document.getElementById('enquiryForm');
        if (form) {
          const hiddenUrl = document.createElement('input');
          hiddenUrl.type = 'hidden';
          hiddenUrl.name = 'pageUrl';
          hiddenUrl.id = 'enquiryPageUrl';
          form.prepend(hiddenUrl);
        }
      }
      if (!document.getElementById('enquirySubmittedAt')) {
        const form = document.getElementById('enquiryForm');
        if (form) {
          const hiddenTime = document.createElement('input');
          hiddenTime.type = 'hidden';
          hiddenTime.name = 'submittedAt';
          hiddenTime.id = 'enquirySubmittedAt';
          form.prepend(hiddenTime);
        }
      }
      if (!document.getElementById('enquiryAlertError')) {
        const form = document.getElementById('enquiryForm');
        if (form) {
          const alertDiv = document.createElement('div');
          alertDiv.className = 'enquiry-alert-error';
          alertDiv.id = 'enquiryAlertError';
          alertDiv.style.display = 'none';
          alertDiv.setAttribute('role', 'alert');
          alertDiv.textContent = 'Something went wrong. Please try again.';
          form.appendChild(alertDiv);
        }
      }
      // Clean up any legacy address subtitle or property pill elements if present
      const legacyAddress = modalEl.querySelector('.enquiry-address');
      if (legacyAddress) legacyAddress.remove();
      const legacyPill = document.getElementById('enquiryPillWrap');
      if (legacyPill) legacyPill.remove();
    }

    bindModalEvents();
    return modalEl;
  }

  // ==========================================================================
  // 3. PROPERTY EXTRACTION (Intelligent Fallbacks)
  // ==========================================================================
  function extractPropertyName(triggerEl) {
    if (!triggerEl) return ENQUIRY_CONFIG.defaultPropertyName;

    // 1. Explicit data-property attribute
    const explicit = triggerEl.getAttribute('data-property') ||
                     triggerEl.closest('[data-property]')?.getAttribute('data-property');
    if (explicit && explicit.trim()) {
      return explicit.trim();
    }

    // 2. Check nearest table row (e.g. pricing table <tr>)
    const tr = triggerEl.closest('tr');
    if (tr) {
      const tds = tr.querySelectorAll('td');
      if (tds.length >= 2) {
        const propType = tds[0].textContent.trim();
        const propArea = tds[1].textContent.trim();
        if (propType && propArea) {
          return `${propType} – ${propArea}`;
        }
      }
    }

    // 3. Check nearest listing card (.plot-spec-card)
    const card = triggerEl.closest('.plot-spec-card, [class*="plot-card"], [class*="spec-card"]');
    if (card) {
      const sizeNum = card.querySelector('.plot-size-num')?.textContent.trim();
      const sizeUnit = card.querySelector('.plot-size-unit')?.textContent.trim() || 'Sq. Yards';
      const metricSub = card.querySelector('.plot-metric-sub')?.textContent.trim();

      const isVilla = card.closest('#villas, .villas-showcase-wrap') ||
                      card.querySelector('.plot-spec-badge')?.textContent.toLowerCase().includes('villa') ||
                      triggerEl.textContent.toLowerCase().includes('villa');
      const propType = isVilla ? 'Residential Villa' : 'Residential Plot';

      if (sizeNum) {
        let metricClean = '';
        if (metricSub) {
          const firstPart = metricSub.split('•')[0].trim();
          metricClean = firstPart ? ` (${firstPart})` : '';
        }
        return `${propType} – ${sizeNum} ${sizeUnit}${metricClean}`;
      }
    }

    // 4. Check onclick attribute if it contains selectPlotSize('...')
    const onclickStr = triggerEl.getAttribute('onclick') || '';
    const matchSize = onclickStr.match(/selectPlotSize\(['"]([^'"]+)['"]\)/);
    if (matchSize && matchSize[1]) {
      const raw = matchSize[1].trim();
      if (raw.toLowerCase().includes('villa')) {
        return `Residential Villa – ${raw}`;
      }
      return `Residential Plot – ${raw}`;
    }

    // 5. Hero button or general brochure
    const text = (triggerEl.textContent || '').trim().toLowerCase();
    if (text.includes('brochure')) {
      return 'Omaxe Bareilly – Brochure & Project Overview';
    }
    if (text.includes('site visit')) {
      return 'Omaxe Bareilly – Free Site Visit Booking';
    }

    return ENQUIRY_CONFIG.defaultPropertyName;
  }

  // ==========================================================================
  // 4. PHONE & NAME VALIDATION HELPERS
  // ==========================================================================
  /**
   * Sanitizes input to pure digits, handling optional leading +91 or 0
   */
  function sanitizePhone(raw) {
    if (!raw) return '';
    let val = raw.trim();
    // Remove "+91" prefix if present
    if (val.startsWith('+91')) {
      val = val.substring(3);
    } else if (val.startsWith('+91-') || val.startsWith('+91 ')) {
      val = val.substring(4);
    }
    // Remove all non-digits
    val = val.replace(/\D/g, '');
    // If user typed 12 digits starting with 91, strip 91
    if (val.length === 12 && val.startsWith('91')) {
      val = val.substring(2);
    }
    // If user typed 11 digits starting with 0, strip leading 0
    if (val.length === 11 && val.startsWith('0')) {
      val = val.substring(1);
    }
    return val;
  }

  function validateNameField(nameInput, errorEl) {
    const val = nameInput.value.trim();
    if (!val) {
      showError(nameInput, errorEl, 'Please enter your full name');
      return false;
    }
    if (val.length < 2) {
      showError(nameInput, errorEl, 'Name must be at least 2 characters');
      return false;
    }
    clearError(nameInput, errorEl);
    return true;
  }

  function validatePhoneField(phoneInput, errorEl) {
    const rawVal = phoneInput.value.trim();
    if (!rawVal) {
      showError(phoneInput, errorEl, 'Please enter your mobile number');
      return false;
    }

    const clean = sanitizePhone(rawVal);
    // Indian 10-digit mobile number starting with 6, 7, 8, or 9
    const isValid = /^[6-9]\d{9}$/.test(clean);
    if (!isValid) {
      showError(phoneInput, errorEl, 'Please enter a valid 10-digit Indian mobile number');
      return false;
    }

    clearError(phoneInput, errorEl);
    return true;
  }

  function validateConsentField(consentInput, errorEl) {
    if (consentInput && !consentInput.checked) {
      showError(consentInput, errorEl, 'Please agree to be contacted to proceed');
      return false;
    }
    if (errorEl) clearError(consentInput, errorEl);
    return true;
  }

  function showError(inputEl, errorEl, msg) {
    if (inputEl) {
      inputEl.classList.add('is-invalid');
      inputEl.setAttribute('aria-invalid', 'true');
    }
    if (errorEl) {
      errorEl.textContent = msg;
      errorEl.classList.add('is-visible');
    }
  }

  function clearError(inputEl, errorEl) {
    if (inputEl) {
      inputEl.classList.remove('is-invalid');
      inputEl.removeAttribute('aria-invalid');
    }
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.remove('is-visible');
    }
  }

  // ==========================================================================
  // 5. MODAL OPEN / CLOSE / SUBMIT LOGIC
  // ==========================================================================
  function openEnquiryModal(propertyName, triggerEl) {
    ensureModalDOM();

    const hiddenProp = document.getElementById('enquiryProperty');
    const hiddenUrl = document.getElementById('enquiryPageUrl');
    const hiddenTime = document.getElementById('enquirySubmittedAt');
    const nameInput = document.getElementById('enquiryName');
    const phoneInput = document.getElementById('enquiryPhone');
    const consentInput = document.getElementById('enquiryConsent');
    const formView = document.getElementById('enquiryFormView');
    const successView = document.getElementById('enquirySuccessView');
    const alertError = document.getElementById('enquiryAlertError');
    const submitBtn = document.getElementById('enquirySubmitBtn');
    const btnText = document.getElementById('enquirySubmitBtnText');
    const spinner = document.getElementById('enquirySubmitSpinner');

    const cleanProperty = propertyName || ENQUIRY_CONFIG.defaultPropertyName;

    // Set headings and hidden values
    if (titleEl) {
      titleEl.textContent = `Enquiry for ${cleanProperty}`;
    }
    if (hiddenProp) {
      hiddenProp.value = cleanProperty;
    }
    if (hiddenUrl) {
      hiddenUrl.value = window.location.href;
    }
    if (hiddenTime) {
      hiddenTime.value = new Date().toISOString();
    }

    // Reset views & states
    if (formView) formView.style.display = 'block';
    if (successView) successView.style.display = 'none';
    if (alertError) alertError.style.display = 'none';

    if (submitBtn) {
      submitBtn.disabled = false;
    }
    if (btnText) {
      btnText.textContent = 'Submit Enquiry';
    }
    if (spinner) {
      spinner.style.display = 'none';
    }

    // Clear previous errors
    clearError(nameInput, document.getElementById('enquiryNameError'));
    clearError(phoneInput, document.getElementById('enquiryPhoneError'));
    clearError(consentInput, document.getElementById('enquiryConsentError'));

    // Preserve trigger for focus restoration
    lastActiveElement = triggerEl || document.activeElement;

    // Show modal & lock background scroll
    modalEl.classList.add('is-open');
    modalEl.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    isOpen = true;

    // Accessibility: move focus into first input
    setTimeout(function() {
      if (nameInput) {
        nameInput.focus();
      }
    }, 120);
  }

  function closeEnquiryModal() {
    if (!isOpen || !modalEl) return;
    if (autoCloseTimer) {
      clearTimeout(autoCloseTimer);
      autoCloseTimer = null;
    }

    modalEl.classList.remove('is-open');
    modalEl.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    isOpen = false;

    // Restore focus
    if (lastActiveElement && typeof lastActiveElement.focus === 'function') {
      try {
        lastActiveElement.focus();
      } catch (_) {}
    }
  }

  /**
   * Transmits the enquiry payload to backend / Google Sheet / Webhook / WhatsApp
   * @param {Object} payload { name, phone, property, pageUrl, timestamp }
   * @returns {Promise<boolean>}
   */
  async function submitEnquiryPayload(payload) {
    console.log('[Enquiry Submitted Payload]:', payload);

    // 1. If an API or Google Sheets Webhook endpoint is configured
    if (ENQUIRY_CONFIG.endpointUrl && ENQUIRY_CONFIG.endpointUrl.trim()) {
      try {
        const response = await fetch(ENQUIRY_CONFIG.endpointUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } catch (err) {
        console.error('[Enquiry API Error]:', err);
        throw err; // propagates to caller to show failure UI
      }
    } else {
      // 2. Placeholder simulation: simulate standard network latency (600ms)
      await new Promise(resolve => setTimeout(resolve, 600));
    }

    // 3. Optional WhatsApp notification
    if (ENQUIRY_CONFIG.whatsappNumber) {
      try {
        const waText = encodeURIComponent(
          `Hello Omaxe City Bareilly,\nI would like to enquire about:\n*${payload.property}*\n\nName: ${payload.name}\nPhone: ${payload.phone}\nPage: ${payload.pageUrl}`
        );
        window.open(`https://wa.me/${ENQUIRY_CONFIG.whatsappNumber}?text=${waText}`, '_blank');
      } catch (waErr) {
        console.warn('WhatsApp launch error:', waErr);
      }
    }

    return true;
  }

  // ==========================================================================
  // 6. EVENT BINDING FOR FORM & CONTROLS
  // ==========================================================================
  let isBound = false;
  function bindModalEvents() {
    if (isBound || !modalEl) return;
    isBound = true;

    const closeBtn = document.getElementById('enquiryCloseBtn');
    const form = document.getElementById('enquiryForm');
    const nameInput = document.getElementById('enquiryName');
    const phoneInput = document.getElementById('enquiryPhone');
    const consentInput = document.getElementById('enquiryConsent');
    const nameError = document.getElementById('enquiryNameError');
    const phoneError = document.getElementById('enquiryPhoneError');
    const consentError = document.getElementById('enquiryConsentError');
    const privacyLink = document.getElementById('enquiryPrivacyLink');
    const submitBtn = document.getElementById('enquirySubmitBtn');
    const btnText = document.getElementById('enquirySubmitBtnText');
    const spinner = document.getElementById('enquirySubmitSpinner');
    const alertError = document.getElementById('enquiryAlertError');

    // Close button click
    if (closeBtn) {
      closeBtn.addEventListener('click', closeEnquiryModal);
    }

    // Backdrop click
    modalEl.addEventListener('click', function(e) {
      if (e.target === modalEl) {
        closeEnquiryModal();
      }
    });

    // Real-time phone sanitization & validation
    if (phoneInput) {
      phoneInput.addEventListener('input', function() {
        // Allow user to see standard formatting while stripping non-allowed characters
        const cleaned = this.value.replace(/[^\d+\s-]/g, '');
        if (cleaned !== this.value) this.value = cleaned;

        if (phoneError && phoneError.classList.contains('is-visible')) {
          validatePhoneField(phoneInput, phoneError);
        }
      });
    }

    // Real-time name validation
    if (nameInput) {
      nameInput.addEventListener('input', function() {
        if (nameError && nameError.classList.contains('is-visible')) {
          validateNameField(nameInput, nameError);
        }
      });
    }

    // Consent validation
    if (consentInput) {
      consentInput.addEventListener('change', function() {
        if (consentError && consentError.classList.contains('is-visible')) {
          validateConsentField(consentInput, consentError);
        }
      });
    }

    // Privacy Policy link smoothly switches to privacy modal if present
    if (privacyLink) {
      privacyLink.addEventListener('click', function(e) {
        closeEnquiryModal();
        if (typeof window.openPrivacyModal === 'function') {
          e.preventDefault();
          window.openPrivacyModal();
        }
      });
    }

    // Form Submit Handler
    if (form) {
      form.addEventListener('submit', async function(e) {
        e.preventDefault();

        if (alertError) alertError.style.display = 'none';

        const isNameValid = validateNameField(nameInput, nameError);
        const isPhoneValid = validatePhoneField(phoneInput, phoneError);
        const isConsentValid = validateConsentField(consentInput, consentError);

        if (!isNameValid || !isPhoneValid || !isConsentValid) {
          return;
        }

        const rawPhone = phoneInput.value.trim();
        const cleanPhone = sanitizePhone(rawPhone);
        const propertyName = document.getElementById('enquiryProperty')?.value || ENQUIRY_CONFIG.defaultPropertyName;

        const payload = {
          name: nameInput.value.trim(),
          phone: cleanPhone,
          formattedPhone: '+91 ' + cleanPhone,
          property: propertyName,
          pageUrl: window.location.href,
          timestamp: new Date().toISOString()
        };

        // Disable submit button & show loading state
        if (submitBtn) submitBtn.disabled = true;
        if (btnText) btnText.textContent = 'Submitting Enquiry...';
        if (spinner) spinner.style.display = 'inline-block';

        try {
          await submitEnquiryPayload(payload);

          // Success State
          const formView = document.getElementById('enquiryFormView');
          const successView = document.getElementById('enquirySuccessView');
          const successProp = document.getElementById('enquirySuccessProperty');

          if (successProp) {
            successProp.textContent = propertyName;
          }

          if (formView && successView) {
            formView.style.display = 'none';
            successView.style.display = 'block';
          }

          // Reset the form fields
          form.reset();

          // Auto-close modal after configured delay
          autoCloseTimer = setTimeout(function() {
            closeEnquiryModal();
          }, ENQUIRY_CONFIG.autoCloseDelay);

        } catch (submitErr) {
          // Failure State
          if (alertError) {
            alertError.textContent = 'Something went wrong. Please try again.';
            alertError.style.display = 'block';
          }
          if (submitBtn) submitBtn.disabled = false;
          if (btnText) btnText.textContent = 'Submit Enquiry';
          if (spinner) spinner.style.display = 'none';
        }
      });
    }
  }

  // ==========================================================================
  // 7. GLOBAL DELEGATION FOR ALL "ENQUIRY" BUTTONS / LINKS
  // ==========================================================================
  document.addEventListener('click', function(e) {
    // Locate closest button or link
    const trigger = e.target.closest('button, a, .enquiry-btn, .plot-select-btn, [data-property], [data-enquiry]');
    if (!trigger) return;

    // Ignore clicks inside the enquiry modal itself
    if (trigger.closest('#enquiryModal')) return;

    // Ignore submission of the inline hero search/lead card (<form id="f">)
    if (trigger.type === 'submit' && trigger.closest('form#f')) return;

    // Check if element is an enquiry trigger
    const hasClass = trigger.classList.contains('enquiry-btn') || 
                     trigger.classList.contains('plot-select-btn');
    const hasData = trigger.hasAttribute('data-property') || 
                    trigger.hasAttribute('data-enquiry');
    const onclickStr = trigger.getAttribute('onclick') || '';
    const hasOnclick = onclickStr.includes('selectPlotSize');
    const href = trigger.getAttribute('href') || '';
    const isEnquiryHref = href === '#enquire' || href === '#f' || href === '#contact';

    const text = (trigger.textContent || '').trim().toLowerCase();
    const textMatches = /^(enquire|enquiry|enquire now|enquiry now|enquire for plots|book site visit|request a callback)\b/i.test(text) ||
                        text.startsWith('enquire') || text.startsWith('enquiry');

    if (hasClass || hasData || hasOnclick || isEnquiryHref || textMatches) {
      e.preventDefault();
      const propName = extractPropertyName(trigger);
      openEnquiryModal(propName, trigger);
    }
  });

  // Global ESC Key Listener
  document.addEventListener('keydown', function(e) {
    if ((e.key === 'Escape' || e.key === 'Esc') && isOpen) {
      closeEnquiryModal();
    }
  });

  // ==========================================================================
  // 8. PUBLIC WINDOW APIS & BACKWARD COMPATIBILITY
  // ==========================================================================
  window.openEnquiryModal = openEnquiryModal;
  window.closeEnquiryModal = closeEnquiryModal;
  window.ENQUIRY_CONFIG = ENQUIRY_CONFIG;

  /**
   * Backward-compatibility for existing onclick="selectPlotSize('...')" handlers
   */
  window.selectPlotSize = function(size) {
    let prop = size;
    if (!prop.toLowerCase().includes('residential') && !prop.toLowerCase().includes('commercial')) {
      const isVilla = prop.toLowerCase().includes('villa');
      prop = `${isVilla ? 'Residential Villa' : 'Residential Plot'} – ${prop}`;
    }
    openEnquiryModal(prop);
  };

  // Auto-init DOM when ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureModalDOM);
  } else {
    ensureModalDOM();
  }

})();
