import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export default function ExportButtons({ title, columns, rows }) {
  const exportPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.setTextColor(40);

    doc.text("Qadri Distributors", 14, 18);

    doc.setFontSize(11);

    doc.text("POS & ERP Management System", 14, 25);

    doc.setDrawColor(120);

    doc.line(14, 30, 195, 30);

    doc.setFontSize(16);

    doc.text(title, 14, 40);

    doc.setFontSize(10);

    doc.text(`Generated : ${new Date().toLocaleString()}`, 14, 47);
    autoTable(doc, {
      startY: 55,

      head: [columns.map((c) => c.label)],

      body: rows.map((r) => columns.map((c) => r[c.key])),

      styles: {
        fontSize: 9,
        cellPadding: 3,
      },

      headStyles: {
        fillColor: [108, 99, 255],
        textColor: 255,
      },

      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },

      theme: "grid",
    });

    doc.save(`${title}.pdf`);
  };

  const exportExcel = () => {
    const data = rows.map((row) => {
      const obj = {};

      columns.forEach((c) => {
        obj[c.label] = row[c.key];
      });

      return obj;
    });

    const ws = XLSX.utils.json_to_sheet([]);

    XLSX.utils.sheet_add_aoa(ws, [
      ["Qadri Distributors"],
      ["POS & ERP REPORT"],
      [title],
      [],
    ]);

    XLSX.utils.sheet_add_json(ws, data, {
      origin: "A5",
    });

    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Report");

    XLSX.writeFile(wb, `${title}.xlsx`);
  };

  const printReport = () => {
    const printWindow = window.open("", "_blank");

    printWindow.document.write(`
    <html>

    <head>

    <title>${title}</title>

    <style>

    body{
    font-family:Arial;
    padding:30px;
    }

    h1{  
    margin:0;
    }

    width:100%;
    table{
      margin-top:20px;
      border-collapse:collapse;
    }

    th,td{
    border:1px solid #ddd;
    padding:8px;
    text-align:left;
    }

    th{
    background:#6c63ff;
color:white;
}

</style>

</head>

<body>

<h1>Qadri Distributors <br> 03173914785 </h1>

<h3>${title}</h3>

<p>

Generated :

${new Date().toLocaleString()}

</p>

<table>

<thead>

<tr>

${columns.map((c) => `<th>${c.label}</th>`).join("")}

</tr>

</thead>

<tbody>

${rows
  .map(
    (r) => `

<tr>

${columns.map((c) => `<td>${r[c.key]}</td>`).join("")}

</tr>

`,
  )
  .join("")}

</tbody>

</table>

</body>

</html>
`);

    printWindow.document.close();

    printWindow.focus();

    printWindow.print();

    printWindow.close();
  };

  return (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={exportPDF}
        className="bg-[#ef4444] hover:bg-[#dc2626] px-4 py-2 rounded-lg text-white"
      >
        📄 PDF
      </button>

      <button
        onClick={exportExcel}
        className="bg-[#22c55e] hover:bg-[#16a34a] px-4 py-2 rounded-lg text-white"
      >
        📊 Excel
      </button>

      <button
        onClick={printReport}
        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white"
      >
        🖨 Print
      </button>
    </div>
  );
}
