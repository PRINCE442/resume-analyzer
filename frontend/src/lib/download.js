// The Word and PDF libraries are big, so they're loaded only when someone
// actually clicks a download button (dynamic import), not on page load.

function toParagraphs(text) {
  return text
    .split(/\n\s*\n/) // a blank line separates paragraphs
    .map((p) => p.trim())
    .filter(Boolean);
}

function fileBaseName(candidateName) {
  const slug = (candidateName || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return slug ? `cover-letter-${slug}` : 'cover-letter';
}

function triggerDownload(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export async function downloadAsDocx(text, candidateName) {
  const { Document, Packer, Paragraph } = await import('docx');
  const doc = new Document({
    sections: [
      {
        children: toParagraphs(text).map(
          (p) => new Paragraph({ text: p, spacing: { line: 320, after: 240 } })
        ),
      },
    ],
  });
  const blob = await Packer.toBlob(doc);
  triggerDownload(blob, `${fileBaseName(candidateName)}.docx`);
}

export async function downloadAsPdf(text, candidateName) {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const margin = 22;
  const pageHeight = pdf.internal.pageSize.getHeight();
  const maxWidth = pdf.internal.pageSize.getWidth() - margin * 2;
  const lineHeight = 6.2;
  let y = margin;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11.5);

  for (const paragraph of toParagraphs(text)) {
    for (const line of pdf.splitTextToSize(paragraph, maxWidth)) {
      if (y > pageHeight - margin) {
        pdf.addPage();
        y = margin;
      }
      pdf.text(line, margin, y);
      y += lineHeight;
    }
    y += lineHeight * 0.8; // gap between paragraphs
  }

  pdf.save(`${fileBaseName(candidateName)}.pdf`);
}
