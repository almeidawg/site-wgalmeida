const trimTrailingSlash = (value) => value.replace(/\/+$/, '');

export const getBasePath = () => {
  const baseUrl = import.meta.env?.BASE_URL || '/';
  if (!baseUrl || baseUrl === '/') return '';
  return trimTrailingSlash(baseUrl);
};

export const withBasePath = (path = '') => {
  if (!path) return path;
  if (/^(?:[a-z]+:)?\/\//i.test(path) || path.startsWith('data:')) return path;

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const basePath = getBasePath();
  return basePath ? `${basePath}${normalizedPath}` : normalizedPath;
};

export default withBasePath;
