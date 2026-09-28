const form = document.getElementById('styleForm');
const loading = document.getElementById('loading');
const result = document.getElementById('result');
const error = document.getElementById('error');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  result.classList.add('hidden');
  error.classList.add('hidden');
  loading.classList.remove('hidden');
  form.querySelector('button').disabled = true;

  const data = Object.fromEntries(new FormData(form).entries());

  try {
    const res = await fetch('/api/style', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const body = await res.json();

    if (!res.ok) throw new Error(body.error || 'Something went wrong.');

    result.textContent = body.result;
    result.classList.remove('hidden');
  } catch (err) {
    error.textContent = err.message;
    error.classList.remove('hidden');
  } finally {
    loading.classList.add('hidden');
    form.querySelector('button').disabled = false;
  }
});
