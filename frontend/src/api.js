const API_BASE = process.env.REACT_APP_API_URL || 'https://lifeos-g1em.onrender.com';

/**
 * Send a bank statement file to the backend for analysis.
 * @param {File} file - PDF or CSV bank statement
 * @returns {Promise<Object>} analysisData
 */
export async function analyzeStatement(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Analysis failed (${response.status}): ${errorText}`);
  }

  return response.json();
}
