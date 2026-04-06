import { createRoot } from 'react-dom/client';
import App from './App';

export const mount = (
  el: HTMLDivElement,
  opts: { basePath: string; projectId?: string; apiBaseUrl?: string }
): (() => void) => {
  const root = createRoot(el);
  root.render(<App projectId={opts.projectId} apiBaseUrl={opts.apiBaseUrl} />);
  return () => setTimeout(() => root.unmount(), 0);
};

export default mount;
