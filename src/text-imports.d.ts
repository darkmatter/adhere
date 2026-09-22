/** Markdown imported `with { type: "text" }` is its contents. bun-types covers .txt but not .md. */
declare module "*.md" {
  const text: string;
  export default text;
}
