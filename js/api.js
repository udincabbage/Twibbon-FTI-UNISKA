const TwibbonAPI = (() => {
  const API_ENDPOINT = './api/templates.json';

  // Fallback dummy data ketika endpoint API gagal diakses.
  const fallbackTemplates = [
    {
      id: 'templateA',
      title: 'Selamat Yudisium Sarjana',
      subtitle: 'Fakultas Teknologi Informasi\nUniversitas Islam Kalimantan\nSyekh Muhammad Arsyad Al Banjari',
      text: 'Selamat atas keberhasilan menyelesaikan studi. Semoga ilmu yang diperoleh menjadi berkah dan bermanfaat.',
      theme: 'graduation'
    },
    {
      id: 'templateB',
      title: 'Selamat Bergabung Mahasiswa Baru',
      subtitle: 'Fakultas Teknologi Informasi\nUniversitas Islam Kalimantan\nSyekh Muhammad Arsyad Al Banjari',
      text: 'Selamat datang menjadi bagian keluarga besar Fakultas Teknologi Informasi.',
      theme: 'newstudent'
    }
  ];

  async function fetchTemplates() {
    try {
      const response = await fetch(API_ENDPOINT, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('Data template tidak valid.');
      }

      return {
        source: 'api',
        templates: normalizeTemplates(data)
      };
    } catch (error) {
      console.warn('Gagal memuat API, menggunakan fallback dummy:', error);
      return {
        source: 'fallback',
        templates: normalizeTemplates(fallbackTemplates)
      };
    }
  }

  function normalizeTemplates(templates) {
    return templates.map((template) => ({
      id: template.id,
      title: template.title,
      subtitle: template.subtitle,
      text: template.text,
      theme: template.theme
    }));
  }

  return {
    fetchTemplates,
    fallbackTemplates
  };
})();
