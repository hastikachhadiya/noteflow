/**
 * validation.js — reusable field validators and form binding.
 * Provides: inline error messages, aria-invalid/aria-describedby,
 * red/green border states, validate-on-blur + on-input-after-error,
 * disabled submit while invalid/submitting, focus-first-invalid.
 */
export const V = {
  required: (msg) => (v) => (v == null || String(v).trim() === '' ? msg : null),
  minLen: (n, msg) => (v) => (String(v).trim().length < n ? msg : null),
  maxLen: (n, msg) => (v) => (String(v).trim().length > n ? msg : null),
  pattern: (re, msg) => (v) => (!re.test(String(v).trim()) ? msg : null),
  oneOf: (list, msg) => (v) => (!list.includes(v) ? msg : null),
  /** Due date (yyyy-mm-dd) may be today, never in the past. */
  notPast: (msg) => (v) => {
    if (!v) return null;
    const [y, m, d] = String(v).split('-').map(Number);
    const due = new Date(y, m - 1, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today ? msg : null;
  },
  maxItems: (n, msg) => (arr) => (Array.isArray(arr) && arr.length > n ? msg : null),
  everyItem: (fn, msg) => (arr) => (Array.isArray(arr) && arr.some((x) => !fn(x)) ? msg : null),
  noDuplicates: (msg) => (arr) => (Array.isArray(arr) && new Set(arr).size !== arr.length ? msg : null),
};

/**
 * Wire up validation for a set of fields.
 *
 * fields: [{ name, input, error, rules, get? }]
 *   - input: the DOM control (used for focus/classes)
 *   - error: <p> element under the field for the inline message
 *   - get:   optional custom value getter (e.g. tags array)
 *   - rules: array of (value) => message|null
 *
 * Returns { validateAll, refresh, setFieldError }.
 */
export function attachValidation({ fields, form = null, onValidityChange = null, onSubmit = null }) {
  const state = fields.map((f) => ({ ...f, touched: false, errored: false }));
  // The submit button may sit outside the <form> (linked via the form="…" attribute).
  const submitBtn = form
    ? (form.querySelector('[type="submit"]')
      ?? document.querySelector(`[form="${form.id}"][type="submit"]`))
    : null;
  let submitting = false;

  function evaluate(f) {
    const value = f.get ? f.get() : f.input.value;
    let msg = null;
    for (const rule of f.rules) {
      msg = rule(value);
      if (msg) break;
    }
    return { value, msg };
  }

  function paint(f, msg) {
    const input = f.input;
    input.classList.toggle('nf-invalid', Boolean(msg));
    input.classList.toggle('nf-valid', !msg && f.touched);
    if (msg) {
      input.setAttribute('aria-invalid', 'true');
      if (f.error) {
        f.error.textContent = msg;
        f.error.hidden = false;
        if (f.error.id) input.setAttribute('aria-describedby', f.error.id);
      }
    } else {
      input.removeAttribute('aria-invalid');
      if (f.error) {
        f.error.hidden = true;
        f.error.textContent = '';
        input.removeAttribute('aria-describedby');
      }
    }
  }

  function run(f, { touch = false } = {}) {
    if (touch) f.touched = true;
    const { msg } = evaluate(f);
    f.errored = Boolean(msg);
    paint(f, msg);
    sync();
    return !msg;
  }

  function isValid() {
    return state.every((f) => !evaluate(f).msg);
  }

  /** Update submit button + onValidityChange without painting. */
  function sync() {
    const ok = !submitting && isValid();
    if (submitBtn) submitBtn.disabled = !ok;
    onValidityChange?.(ok);
  }

  function validateAll() {
    let firstBad = null;
    for (const f of state) {
      f.touched = true;
      if (!run(f) && !firstBad) firstBad = f;
    }
    if (firstBad) firstBad.input.focus();
    return !firstBad;
  }

  for (const f of state) {
    if (!f.input) continue;
    f.input.addEventListener('blur', () => run(f, { touch: true }));
    f.input.addEventListener('input', () => {
      if (f.touched || f.errored) run(f);
      else sync();
    });
    if (f.input.tagName === 'SELECT') {
      f.input.addEventListener('change', () => run(f, { touch: true }));
    }
  }

  if (form && onSubmit) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (submitting) return;
      if (!validateAll()) return;
      submitting = true;
      sync();
      try {
        const values = Object.fromEntries(state.map((f) => [f.name, f.get ? f.get() : f.input.value]));
        await onSubmit(values);
      } finally {
        submitting = false;
        sync();
      }
    });
  }

  sync(); // initial submit-button state (e.g. disabled on an empty form)

  return {
    validateAll,
    /** Re-check after programmatic changes (only re-paints dirty fields). */
    refresh() {
      for (const f of state) if (f.touched || f.errored) run(f);
      sync();
    },
    /** Force a message on a field programmatically. */
    setFieldError(name, msg) {
      const f = state.find((x) => x.name === name);
      if (!f) return;
      f.touched = true;
      f.errored = Boolean(msg);
      paint(f, msg);
      sync();
    },
  };
}

/** Live character counter: "123 / 5000", turning red past 90%. */
export function updateCounter(input, counter, max) {
  const len = input.value.length;
  counter.textContent = `${len} / ${max}`;
  counter.style.color = len > max * 0.9 ? 'var(--nf-danger)' : '';
}
