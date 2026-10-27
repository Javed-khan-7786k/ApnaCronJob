/**
 * Shared head() metadata builder so every content route ships unique,
 * app-specific SEO tags.
 */
export function pageHead(
  titleOrOpts: string | { title: string; description: string; noIndex?: boolean },
  maybeOpts?: { title?: string; description: string; noIndex?: boolean },
) {
  let title = "";
  let description = "";
  let noIndex = false;

  if (typeof titleOrOpts === "string") {
    title = titleOrOpts;
    description = maybeOpts?.description ?? "";
    noIndex = maybeOpts?.noIndex ?? false;
  } else {
    title = titleOrOpts.title;
    description = titleOrOpts.description;
    noIndex = titleOrOpts.noIndex ?? false;
  }

  const meta: Array<Record<string, string>> = [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ];
  if (noIndex) meta.push({ name: "robots", content: "noindex" });
  return { meta };
}

