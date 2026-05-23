import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs';

async function createPdf() {
  const pdfDoc = await PDFDocument.create();
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  
  const page1 = pdfDoc.addPage();
  const { width, height } = page1.getSize();
  
  page1.drawText('Chapter 1: Physical World', {
    x: 50,
    y: height - 100,
    size: 24,
    font: timesRomanFont,
    color: rgb(0, 0, 0),
  });
  
  page1.drawText('Physics is the study of nature and its laws. We expect that all these different events in nature take place according to some basic laws.', {
    x: 50,
    y: height - 140,
    size: 12,
    font: timesRomanFont,
    color: rgb(0, 0, 0),
  });

  page1.drawText('1.1 What is Physics?', {
    x: 50,
    y: height - 180,
    size: 18,
    font: timesRomanFont,
    color: rgb(0, 0, 0),
  });

  page1.drawText('The word physics comes from a Greek word meaning nature. Its Sanskrit equivalent is Bhautiki that is used to refer to the study of the physical world.', {
    x: 50,
    y: height - 210,
    size: 12,
    font: timesRomanFont,
    color: rgb(0, 0, 0),
  });
  
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync('ncert_sample.pdf', pdfBytes);
  console.log('Created ncert_sample.pdf');
}

createPdf().catch(console.error);
