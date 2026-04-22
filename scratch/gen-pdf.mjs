import { PDFDocument, rgb } from 'pdf-lib';
import fs from 'fs';

async function createPdf() {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 400]);
  page.drawText('Test PDF for PDF Buddy', {
    x: 50,
    y: 350,
    size: 30,
    color: rgb(0, 0.53, 0.71),
  });
  
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync('test-sample.pdf', pdfBytes);
  console.log('PDF created: test-sample.pdf');
}

createPdf();
