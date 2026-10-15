export interface BlogEditorHandle {
  flush: () => { html: string; json: Record<string, unknown>; isEmpty: boolean };
  getHTML: () => string;
  getJSON: () => Record<string, unknown>;
  focus: () => void;
  isEmpty: () => boolean;
  insertImage: (src: string, alt?: string, caption?: string) => void;
}
