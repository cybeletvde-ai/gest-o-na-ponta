/** Baixa um arquivo gerado no navegador. No celular, abre o menu de compartilhar ("Salvar em Arquivos"). */
export async function deliverFile(blob: Blob, filename: string) {
  const file = new File([blob], filename, { type: blob.type });
  const touch = window.matchMedia("(pointer: coarse)").matches;
  if (touch && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: filename });
      return;
    } catch (e) {
      if ((e as DOMException).name === "AbortError") return;
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

/** CSV com BOM para o Excel abrir a acentuação UTF-8 corretamente. */
export function csvBlob(csv: string): Blob {
  return new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
}
