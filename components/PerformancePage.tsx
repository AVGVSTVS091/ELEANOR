
import React, { useState, useMemo, useEffect } from 'react';
import { useSales } from '../hooks/useSales';
import { Client, Task, Lead } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { ChartBarIcon, ChartPieIcon, ChartLineIcon, DocumentIcon, DownloadIcon, CalendarIcon, ChevronRightIcon, TrashIcon } from './Icons';
import { generatePerformanceReportBlob } from '../utils/reportUtils';
import StorageSourcePicker from './StorageSourcePicker';

interface PerformancePageProps {
    tasks: Task[];
    clients: Client[];
    leads: (Lead | Client)[];
}

type ChartType = 'bar' | 'line' | 'pie';
type Period = 'today' | 'monthly' | 'yearly' | 'historic';

const PerformancePage: React.FC<PerformancePageProps> = ({ tasks, clients, leads }) => {
    const { sales } = useSales();
    const { t } = useTranslation();

    // --- Monthly Sales Chart ---
    const [monthlySalesType, setMonthlySalesType] = useState<ChartType>('bar');
    const [monthlySalesExpanded, setMonthlySalesExpanded] = useState(false);
    
    const monthlySalesData = useMemo(() => {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const data = new Array(12).fill(0);
        
        sales.forEach(sale => {
            const date = new Date(sale.date);
            if (date.getFullYear() === currentYear) {
                data[date.getMonth()] += sale.amount;
            }
        });
        
        return data.map((amount, index) => ({
            label: new Date(0, index).toLocaleString('default', { month: 'short' }),
            value: amount
        }));
    }, [sales]);

    // --- Top Clients ---
    const [topClientsExpanded, setTopClientsExpanded] = useState(false);
    const topClientsData = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

        const clientSales: Record<string, { name: string, total: number, currentMonth: number, prevMonth: number }> = {};

        sales.forEach(sale => {
            const date = new Date(sale.date);
            const month = date.getMonth();
            const year = date.getFullYear();
            const key = sale.clientName; // Using name as ID proxy since sales log might rely on names

            if (!clientSales[key]) {
                clientSales[key] = { name: sale.clientName, total: 0, currentMonth: 0, prevMonth: 0 };
            }

            clientSales[key].total += sale.amount;
            if (month === currentMonth && year === currentYear) {
                clientSales[key].currentMonth += sale.amount;
            }
            if (month === prevMonth && year === prevMonthYear) {
                clientSales[key].prevMonth += sale.amount;
            }
        });

        return Object.values(clientSales).sort((a, b) => b.currentMonth - a.currentMonth);
    }, [sales]);

    // --- Comparisons ---
    const [compareExpanded, setCompareExpanded] = useState(false);
    const [comparePeriod, setComparePeriod] = useState<'lastWeek' | 'lastMonth' | 'lastYear' | 'custom'>('lastMonth');
    const [customDays, setCustomDays] = useState(30);

    const comparisonData = useMemo(() => {
        const now = new Date();
        let startDate = new Date();
        
        if (comparePeriod === 'lastWeek') startDate.setDate(now.getDate() - 7);
        else if (comparePeriod === 'lastMonth') startDate.setMonth(now.getMonth() - 1);
        else if (comparePeriod === 'lastYear') startDate.setFullYear(now.getFullYear() - 1);
        else startDate.setDate(now.getDate() - customDays);

        let currentTotal = 0;
        let prevTotal = 0;

        sales.forEach(sale => {
            const date = new Date(sale.date);
            if (date >= startDate && date <= now) {
                currentTotal += sale.amount;
            }
            // Simple comparison logic: compare with period immediately before
            const periodDuration = now.getTime() - startDate.getTime();
            const prevStartDate = new Date(startDate.getTime() - periodDuration);
            if (date >= prevStartDate && date < startDate) {
                prevTotal += sale.amount;
            }
        });

        return { currentTotal, prevTotal, periodLabel: comparePeriod === 'custom' ? `${customDays} days` : t(`performance.compare.${comparePeriod}`) };
    }, [sales, comparePeriod, customDays, t]);

    // --- FAQs (Mocked based on Lead messages) ---
    const [faqExpanded, setFaqExpanded] = useState(false);
    const faqsData = useMemo(() => {
        // Simple word frequency analysis of last messages
        const words: Record<string, number> = {};
        leads.forEach(l => {
            if ('lastMessage' in l) {
                const msg = (l as Lead).lastMessage.toLowerCase();
                const tokens = msg.split(/\s+/);
                tokens.forEach(token => {
                    if (token.length > 3) { // Filter short words
                        words[token] = (words[token] || 0) + 1;
                    }
                });
            }
        });
        return Object.entries(words)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([word, count]) => ({ question: `...${word}...`, count }));
    }, [leads]);

    // --- Calculators ---
    // Budgets
    const budgetsCount = useMemo(() => clients.reduce((acc, c) => acc + c.budgets.length, 0), [clients]);
    
    // Avg Response Time (Simulated)
    const avgResponseTime = useMemo(() => {
       // Mock: 2-10 minutes + random variance
       return "5m 30s"; 
    }, []);

    // Tasks
    const taskStats = useMemo(() => {
        const created = tasks.length;
        const completed = tasks.filter(t => t.status === 'completed').length;
        const overdue = tasks.filter(t => t.status === 'pending' && new Date(t.scheduledAt) < new Date()).length;
        return { created, completed, overdue };
    }, [tasks]);

    // --- Actions ---
    const [isStoragePickerOpen, setIsStoragePickerOpen] = useState(false);
    const [reportBlob, setReportBlob] = useState<Blob | null>(null);

    const prepareReport = () => {
        const blob = generatePerformanceReportBlob({
            title: t('performance.title'),
            period: new Date().toLocaleDateString(),
            metrics: {
                [t('performance.totalSales')]: `$${comparisonData.currentTotal}`,
                [t('performance.budgetsSent')]: budgetsCount,
                [t('performance.tasksStats')]: `${taskStats.completed}/${taskStats.created}`
            },
            chartData: monthlySalesData,
            topClients: topClientsData.slice(0, 5).map(c => ({ name: c.name, amount: c.currentMonth }))
        });
        setReportBlob(blob);
        return blob;
    };

    const handleExportClick = () => {
        prepareReport();
        setIsStoragePickerOpen(true);
    };

    const handleShareClick = () => {
        // Simple sharing of current view metrics, reuse logic but different title
        const blob = generatePerformanceReportBlob({
            title: t('performance.shareTitle'),
            period: new Date().toLocaleDateString(),
            metrics: { Total: `$${comparisonData.currentTotal}` }
        });
        setReportBlob(blob);
        setIsStoragePickerOpen(true);
    }

    const handleSaveReport = (source: 'device' | 'drive' | 'other') => {
        if (!reportBlob) return;
        
        const fileName = `Performance_Report_${new Date().toISOString().slice(0, 10)}.pdf`;

        if (source === 'device') {
            const url = URL.createObjectURL(reportBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            alert(t('storagePicker.success'));
        } else if (source === 'drive') {
            // Simulate upload to drive
            setTimeout(() => {
                alert(t('storagePicker.success'));
            }, 800);
        } else if (source === 'other') {
            if (navigator.share) {
                const file = new File([reportBlob], fileName, { type: 'application/pdf' });
                navigator.share({
                    title: t('performance.title'),
                    text: t('performance.shareText'),
                    files: [file]
                }).then(() => {
                    // Success handled by OS or ignored
                }).catch(e => {
                    console.error("Share failed", e);
                    // Fallback if sharing fails/cancelled
                });
            } else {
                alert(t('storagePicker.other.noApps'));
            }
        }
    };

    const emitAnalytics = (event: string, data: any) => {
        console.log(`Analytics: ${event}`, data);
    }

    useEffect(() => {
        emitAnalytics('performance_view_opened', {});
    }, []);

    // --- Generic Chart Component ---
    const SimpleChart = ({ data, type, height = 150, color = "#10b981" }: { data: { label: string, value: number }[], type: ChartType, height?: number, color?: string }) => {
        const maxVal = Math.max(...data.map(d => d.value), 1);
        
        if (type === 'bar') {
            return (
                <div className="flex items-end justify-between gap-1 w-full" style={{ height: `${height}px` }}>
                    {data.map((d, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center group">
                            <div className="w-full bg-gray-100 dark:bg-gray-700 relative rounded-t-sm overflow-hidden flex items-end h-full">
                                <div 
                                    className="w-full transition-all duration-500 ease-out opacity-80 group-hover:opacity-100"
                                    style={{ height: `${(d.value / maxVal) * 100}%`, backgroundColor: color }}
                                ></div>
                            </div>
                            {data.length <= 12 && <span className="text-[10px] text-gray-500 mt-1 truncate w-full text-center">{d.label}</span>}
                        </div>
                    ))}
                </div>
            );
        }
        
        if (type === 'line') {
             // Simple SVG line
             const points = data.map((d, i) => {
                 const x = (i / (data.length - 1)) * 100;
                 const y = 100 - ((d.value / maxVal) * 100);
                 return `${x},${y}`;
             }).join(' ');

             return (
                 <div className="w-full relative" style={{ height: `${height}px` }}>
                     <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                         <polyline fill="none" stroke={color} strokeWidth="2" points={points} vectorEffect="non-scaling-stroke" className="transition-all duration-500" />
                     </svg>
                     <div className="flex justify-between mt-1">
                         <span className="text-[10px] text-gray-500">{data[0]?.label}</span>
                         <span className="text-[10px] text-gray-500">{data[data.length-1]?.label}</span>
                     </div>
                 </div>
             )
        }

        if (type === 'pie') {
            // Very simple CSS conic gradient for 1st value vs rest for demo, as full pie logic in SVG is verbose without lib
            // Just showing total percent of max for simplicity in this constraint
            const percent = (data[data.length-1].value / (data.reduce((a,b) => a + b.value, 0) || 1)) * 100;
            return (
                <div className="flex items-center justify-center h-full">
                    <div 
                        className="rounded-full transition-all duration-500"
                        style={{
                            width: `${height}px`,
                            height: `${height}px`,
                            background: `conic-gradient(${color} ${percent}%, #e5e7eb 0)`
                        }}
                    ></div>
                </div>
            )
        }
        return null;
    };

    return (
        <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4 space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t('performance.title')}</h1>
                <button onClick={handleShareClick} className="flex items-center gap-2 bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors" aria-label={t('performance.exportReport')}>
                    <DownloadIcon className="w-5 h-5" />
                    <span className="hidden sm:inline">{t('performance.exportReport')}</span>
                </button>
            </div>

            {/* Monthly Sales Chart */}
            <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="font-semibold text-lg dark:text-white">{t('performance.monthlySales')}</h2>
                    <div className="flex items-center gap-2">
                        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                            <button onClick={() => setMonthlySalesType('bar')} className={`p-1 rounded ${monthlySalesType === 'bar' ? 'bg-white dark:bg-gray-600 shadow' : ''}`}><ChartBarIcon className="w-4 h-4"/></button>
                            <button onClick={() => setMonthlySalesType('line')} className={`p-1 rounded ${monthlySalesType === 'line' ? 'bg-white dark:bg-gray-600 shadow' : ''}`}><ChartLineIcon className="w-4 h-4"/></button>
                            <button onClick={() => setMonthlySalesType('pie')} className={`p-1 rounded ${monthlySalesType === 'pie' ? 'bg-white dark:bg-gray-600 shadow' : ''}`}><ChartPieIcon className="w-4 h-4"/></button>
                        </div>
                        <button onClick={handleExportClick} className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full" aria-label={t('performance.generateReport')}><DocumentIcon className="w-5 h-5"/></button>
                        <button onClick={() => setMonthlySalesExpanded(!monthlySalesExpanded)} className={`p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-transform ${monthlySalesExpanded ? 'rotate-90' : ''}`}><ChevronRightIcon className="w-5 h-5"/></button>
                    </div>
                </div>
                <div className={`transition-all duration-500 ${monthlySalesExpanded ? 'h-64' : 'h-40'}`}>
                    <SimpleChart data={monthlySalesData} type={monthlySalesType} height={monthlySalesExpanded ? 250 : 160} color="#0ea5e9" />
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Clients */}
                <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-semibold text-lg dark:text-white">{t('performance.topClients')}</h2>
                        <button onClick={() => setTopClientsExpanded(!topClientsExpanded)} className={`p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-transform ${topClientsExpanded ? 'rotate-90' : ''}`}><ChevronRightIcon className="w-5 h-5"/></button>
                    </div>
                    <ul className="space-y-3">
                        {topClientsData.slice(0, topClientsExpanded ? 10 : 5).map((client, idx) => (
                            <li key={idx} className="flex justify-between items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer group">
                                <div className="flex items-center gap-3">
                                    <span className="w-6 h-6 flex items-center justify-center bg-gray-100 dark:bg-gray-600 rounded-full text-xs font-bold text-gray-600 dark:text-gray-300">{idx + 1}</span>
                                    <div>
                                        <p className="font-medium text-sm dark:text-gray-200">{client.name}</p>
                                        {topClientsExpanded && <p className="text-xs text-gray-400">Total Hist: ${client.total.toLocaleString()}</p>}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-green-600 dark:text-green-400">${client.currentMonth.toLocaleString()}</p>
                                    {topClientsExpanded && <p className="text-xs text-gray-400">Prev: ${client.prevMonth.toLocaleString()}</p>}
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>

                {/* Sales Comparison */}
                <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-semibold text-lg dark:text-white">{t('performance.salesComparison')}</h2>
                        <button onClick={() => setCompareExpanded(!compareExpanded)} className={`p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-transform ${compareExpanded ? 'rotate-90' : ''}`}><ChevronRightIcon className="w-5 h-5"/></button>
                    </div>
                    
                    {compareExpanded && (
                        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                            {(['lastWeek', 'lastMonth', 'lastYear', 'custom'] as const).map(p => (
                                <button 
                                    key={p}
                                    onClick={() => { setComparePeriod(p); emitAnalytics('compare_period_selected', { period: p }); }}
                                    className={`px-3 py-1 text-xs rounded-full whitespace-nowrap border ${comparePeriod === p ? 'bg-sky-100 border-sky-500 text-sky-700 dark:bg-sky-900 dark:border-sky-400 dark:text-sky-200' : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'}`}
                                >
                                    {t(`performance.compare.${p}`)}
                                </button>
                            ))}
                        </div>
                    )}
                    {comparePeriod === 'custom' && compareExpanded && (
                        <div className="mb-4 flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4 text-gray-500"/>
                            <input type="number" value={customDays} onChange={e => setCustomDays(parseInt(e.target.value))} className="w-16 p-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600" />
                            <span className="text-sm text-gray-500">days</span>
                        </div>
                    )}

                    <div className="flex items-end justify-around h-40 gap-4">
                        <div className="flex flex-col items-center gap-2 w-1/2">
                            <div className="w-full bg-blue-100 dark:bg-blue-900/30 rounded-t-md relative h-32 flex items-end justify-center">
                                <div className="w-full bg-blue-500 dark:bg-blue-600 rounded-t-md transition-all duration-700" style={{ height: `${Math.min((comparisonData.prevTotal / (Math.max(comparisonData.currentTotal, comparisonData.prevTotal) || 1)) * 100, 100)}%` }}></div>
                                <span className="absolute bottom-2 text-white font-bold drop-shadow-md">${comparisonData.prevTotal.toLocaleString()}</span>
                            </div>
                            <span className="text-xs text-gray-500">Previous</span>
                        </div>
                        <div className="flex flex-col items-center gap-2 w-1/2">
                            <div className="w-full bg-green-100 dark:bg-green-900/30 rounded-t-md relative h-32 flex items-end justify-center">
                                <div className="w-full bg-green-500 dark:bg-green-600 rounded-t-md transition-all duration-700" style={{ height: `${Math.min((comparisonData.currentTotal / (Math.max(comparisonData.currentTotal, comparisonData.prevTotal) || 1)) * 100, 100)}%` }}></div>
                                <span className="absolute bottom-2 text-white font-bold drop-shadow-md">${comparisonData.currentTotal.toLocaleString()}</span>
                            </div>
                            <span className="text-xs text-gray-500">Current</span>
                        </div>
                    </div>
                </section>
            </div>

            {/* Calculators Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('performance.budgetsSent')}</h3>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">{budgetsCount}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('performance.avgResponseTime')}</h3>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">{avgResponseTime}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 md:col-span-2">
                    <h3 className="text-sm text-gray-500 dark:text-gray-400 mb-2">{t('performance.tasksStats')}</h3>
                    <div className="flex justify-between items-center">
                        <div className="text-center">
                            <p className="text-xl font-bold text-blue-600">{taskStats.created}</p>
                            <p className="text-xs text-gray-500">{t('performance.created')}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xl font-bold text-green-600">{taskStats.completed}</p>
                            <p className="text-xs text-gray-500">{t('performance.completed')}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xl font-bold text-red-600">{taskStats.overdue}</p>
                            <p className="text-xs text-gray-500">{t('performance.overdue')}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* FAQs */}
            <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
                <h2 className="font-semibold text-lg dark:text-white mb-4">{t('performance.faqs')}</h2>
                <div className="flex flex-wrap gap-2">
                    {faqsData.map((faq, idx) => (
                        <span key={idx} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full text-sm">
                            {faq.question} <span className="opacity-60 text-xs ml-1">({faq.count})</span>
                        </span>
                    ))}
                    {faqsData.length === 0 && <p className="text-gray-500 italic text-sm">{t('performance.noData')}</p>}
                </div>
            </section>

            <StorageSourcePicker 
                isOpen={isStoragePickerOpen}
                onClose={() => setIsStoragePickerOpen(false)}
                onSelectSource={handleSaveReport}
                mode="export"
            />
        </div>
    );
};

export default PerformancePage;
