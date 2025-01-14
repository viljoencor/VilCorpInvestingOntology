
import PerformanceOverview from './PerformanceOverview';
import FinancialMetrics from './FinancialMetrics';
import ComparativeAnalysis from './ComparativeAnalysis';
import NewsInsights from './NewsInsights';
import FinancialData from './FinancialData';
import PipelineInputForm from './PipelineInputForm';

const Dashboard = () => {
    return (
        <div>
            <PipelineInputForm />
            <PerformanceOverview />
            <FinancialMetrics />
            <ComparativeAnalysis />
            <NewsInsights />
            <FinancialData />
        </div>
    );
};

export default Dashboard;
