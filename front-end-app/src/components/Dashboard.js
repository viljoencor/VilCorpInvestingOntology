
import PerformanceOverview from './PerformanceOverview';
import FinancialMetrics from './FinancialMetrics';
import ComparativeAnalysis from './ComparativeAnalysis';
import NewsInsights from './NewsInsights';
import FinancialData from './FinancialData';

const Dashboard = () => {
    return (
        <div>
            <PerformanceOverview />
            <FinancialMetrics />
            <ComparativeAnalysis />
            <NewsInsights />
            <FinancialData />
        </div>
    );
};

export default Dashboard;
