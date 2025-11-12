
import jsPDF from 'jspdf';
import 'jspdf-autotable';

type ReportData = {
    title: string;
    period: string;
    metrics: Record<string, string | number>;
    chartData?: { label: string; value: number }[];
    topClients?: { name: string; amount: number }[];
};

export const generatePerformanceReportBlob = (data: ReportData): Blob => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 15;
    let yPos = 20;

    // Title
    doc.setFontSize(18);
    doc.text(data.title, margin, yPos);
    yPos += 10;

    // Period
    doc.setFontSize(12);
    doc.text(`Period: ${data.period}`, margin, yPos);
    yPos += 15;

    // Metrics Summary
    doc.setFontSize(14);
    doc.text('Summary', margin, yPos);
    yPos += 8;
    doc.setFontSize(11);
    Object.entries(data.metrics).forEach(([key, value]) => {
        doc.text(`${key}: ${value}`, margin, yPos);
        yPos += 7;
    });
    yPos += 10;

    // Simple Bar Chart Representation
    if (data.chartData && data.chartData.length > 0) {
        doc.setFontSize(14);
        doc.text('Chart Data', margin, yPos);
        yPos += 10;
        
        const maxVal = Math.max(...data.chartData.map(d => d.value));
        const barMaxHeight = 40;
        
        data.chartData.slice(0, 10).forEach((item, index) => {
            if (yPos > 250) {
                doc.addPage();
                yPos = 20;
            }
            const barHeight = maxVal > 0 ? (item.value / maxVal) * barMaxHeight : 0;
            doc.setFontSize(10);
            doc.text(`${item.label} (${item.value})`, margin, yPos);
            doc.setFillColor(52, 152, 219); // Blue
            doc.rect(margin + 50, yPos - 4, barHeight, 4, 'F');
            yPos += 8;
        });
        yPos += 10;
    }

    // Top Clients Table
    if (data.topClients && data.topClients.length > 0) {
        if (yPos > 240) {
            doc.addPage();
            yPos = 20;
        }
        doc.setFontSize(14);
        doc.text('Top Clients', margin, yPos);
        yPos += 5;
        
        const tableColumn = ["Client", "Amount"];
        const tableRows = data.topClients.map(c => [c.name, `$${c.amount.toFixed(2)}`]);

        (doc as any).autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: yPos,
            margin: { top: yPos },
        });
    }

    return doc.output('blob');
};

export const generatePerformanceReport = (data: ReportData, action: 'export' | 'share' = 'export') => {
    const blob = generatePerformanceReportBlob(data);
    const fileName = `Performance_Report_${new Date().toISOString().slice(0, 10)}.pdf`;

    if (action === 'share' && navigator.share) {
        const file = new File([blob], fileName, { type: 'application/pdf' });
        navigator.share({
            title: 'Performance Report',
            text: 'Here is the performance report.',
            files: [file]
        }).catch(console.error);
    } else {
        // Fallback save
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
};
