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
    // Calculate maximum columns in any row
    const maxColumns = excelData.reduce((max, row) => 
      Math.max(max, row.length), 0);
    
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([842, 595]); // A4 landscape
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 8; // Smaller font size for more content

    // Table positioning and dimensions
    const cellPadding = 3;
    const cellHeight = 20;
    let yPosition = 550;
    
    // Dynamic page width calculations
    const pageWidth = page.getWidth();
    const pageMargin = 40;
    const tableWidth = pageWidth - (pageMargin * 2);
    const xPosition = pageMargin;
    
    // Calculate cell widths based on content
    let  columnWidths = new Array(maxColumns).fill(0);
    
    // First pass: determine optimal width for each column
    excelData.forEach(row => {
      row.forEach((cell, index) => {
        const cellText = cell ? String(cell) : "";
        // Approximate width based on text length (can be improved)
        const textWidth = cellText.length * (fontSize * 0.6);
        columnWidths[index] = Math.max(columnWidths[index], textWidth, 30); // Minimum width of 30
      });
    });
    
    // Scale column widths to fit table width if needed
    const totalContentWidth = columnWidths.reduce((sum, width) => sum + width, 0);
    if (totalContentWidth > tableWidth) {
      const scaleFactor = tableWidth / totalContentWidth;
      columnWidths = columnWidths.map(width => width * scaleFactor);
    }

    // Draw the table with calculated column widths
    excelData.forEach((row, rowIndex) => {
      // Check if we need a new page
      if (yPosition < 50) {
        page = pdfDoc.addPage([842, 595]);
        yPosition = 550;
      }
      
      let currentX = xPosition;
      
      // Draw each cell in the row
      row.forEach((cell, cellIndex) => {
        const cellText = cell ? String(cell) : "";
        const cellWidth = columnWidths[cellIndex];
        
        // Draw cell border
        page.drawRectangle({
          x: currentX,
          y: yPosition - cellHeight,
          width: cellWidth,
          height: cellHeight,
          borderColor: rgb(0.75, 0.75, 0.75),
          borderWidth: 1,
        });
        
        // Calculate text positioning to prevent overflow
        // Truncate text if too long for cell
        let displayText = cellText;
        const maxChars = Math.floor((cellWidth - (cellPadding * 2)) / (fontSize * 0.6));
        if (displayText.length > maxChars) {
          displayText = displayText.substring(0, maxChars - 3) + "...";
        }
        
        // Draw cell text, properly positioned within cell
        page.drawText(displayText, {
          x: currentX + cellPadding,
          y: yPosition - cellHeight + cellPadding,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
          maxWidth: cellWidth - (cellPadding * 2),
        });
        
        // Move to the next cell position
        currentX += cellWidth;
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
          <div className="table-responsive">
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
          </div>
          <button
            onClick={handleDownloadPdf}
            className="btn btn-primary mt-3"
          >
            Download as PDF
          </button>
        </div>
      )}
    </div>
  );
}

export default App;