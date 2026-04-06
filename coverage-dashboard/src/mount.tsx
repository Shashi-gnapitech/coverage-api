import { createRoot } from 'react-dom/client';
import App from './App';

export const mount = (
  el: HTMLDivElement,
  opts: { basePath: string; projectId?: string },
): (() => void) => {
  const root = createRoot(el);
  root.render(<App projectId={opts.projectId} basePath={opts.basePath} />);
  return () => setTimeout(() => root.unmount(), 0);
};

export default mount;
