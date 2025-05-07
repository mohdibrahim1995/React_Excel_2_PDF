// import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { useState } from "react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

import * as XLSX from "xlsx";
function App() {
  const [excelData, setExcelData] = useState([]);
  // Handle Excel file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      setExcelData(jsonData);
    };
    reader.readAsArrayBuffer(file);
  };

  // Convert Excel data to PDF with table-like structure and download
  const handleDownloadPdf = async () => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 10;

    // Table positioning and dimensions
    const cellPadding = 5;
    const cellHeight = 20;
    let xPosition = 50;
    let yPosition = 750;
    const tableWidth = 500;

    excelData.forEach((row, rowIndex) => {
      const numCells = row.length;
      const cellWidth = tableWidth / numCells;

      row.forEach((cell, cellIndex) => {
        const cellText = cell ? String(cell) : "";

        // Draw cell border
        page.drawRectangle({
          x: xPosition + cellIndex * cellWidth,
          y: yPosition,
          width: cellWidth,
          height: cellHeight,
          borderColor: rgb(0.75, 0.75, 0.75),
          borderWidth: 1,
        });

        // Draw cell text, center-aligned within each cell
        page.drawText(cellText, {
          x: xPosition + cellIndex * cellWidth + cellPadding,
          y: yPosition + cellPadding,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
          maxWidth: cellWidth - cellPadding * 2,
        });
      });

      // Move to the next row position
      yPosition -= cellHeight;
    });

    // Save the PDF and trigger download
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "excel_to_pdf_table.pdf";
    link.click();
  };

  return (
    <>
      <div className="container mt-4">
        <h1>Convert Excel to PDF</h1>
        <input
          type="file"
          name="file"
          accept=".xlsx, .xls"
          required
          onChange={handleFileUpload}
          className="form-control mb-4"
        />

        {excelData.length > 0 && (
          <div>
            <h2>Excel Preview</h2>
            <table className="table table-bordered">
              <tbody>
                {excelData.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              onClick={handleDownloadPdf}
              className="btn btn-primary mt-3"
            >
              Download as PDF
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default App;
