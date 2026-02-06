import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Upload, DollarSign, TrendingUp, Activity, FileText, Clock, ArrowLeft } from 'lucide-react';

// Error Boundary for safety
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) return <div style={{padding: 20}}>Something went wrong.</div>;
    return this.props.children;
  }
}

function App() {
  const [files, setFiles] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' or 'history'
  const [historyList, setHistoryList] = useState([]); // Stores DB data

  // THEME SETUP
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = (e) => document.body.classList.toggle('dark-mode', e.matches);
    applyTheme(mediaQuery);
    mediaQuery.addEventListener('change', applyTheme);
    return () => mediaQuery.removeEventListener('change', applyTheme);
  }, []);

  // FETCH HISTORY FUNCTION
  const fetchHistory = async () => {
    try {
      const res = await axios.get("https://fin-health.onrender.com/reports");
      setHistoryList(res.data);
      setActiveTab('history'); // Switch view
    } catch (error) {
      alert("Could not fetch history. Is backend running?");
      console.error(error);
    }
  };

  const COLORS = ['#10b981', '#ef4444', '#f59e0b'];

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) setFiles(e.target.files);
  };

  const handleUpload = async () => {
    if (!files || files.length === 0) return alert("Please select a file!");
    setLoading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]); 
    }

    try {
      const res = await axios.post("https://fin-health.onrender.com/analyze", formData);
      setReport(res.data);
      setActiveTab('dashboard'); // Switch back to dashboard to see result
    } catch (error) {
      console.error(error);
      alert("Error connecting to backend");
    }
    setLoading(false);
  };

  // Chart Data Preparation
  const chartData = report ? [
    { name: 'Net Profit', value: report.net_profit },
    { name: 'Expenses', value: report.expenses },
  ] : [];

  return (
    <ErrorBoundary>
    <div className="dashboard-container">
      {/* SIDEBAR */}
      <div className="sidebar">
        <h2 style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Activity /> FinHealth.ai
        </h2>
        
        <div style={{ marginTop: '40px' }}>
          <div 
            className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </div>
          <div 
            className={`menu-item ${activeTab === 'history' ? 'active' : ''}`}
            onClick={fetchHistory} // <--- CLICKS HERE FETCH DB
          >
            Past Reports
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="main-content">
        
        {/* === VIEW 1: DASHBOARD === */}
        {activeTab === 'dashboard' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <h1>Financial Overview</h1>
            </div>

            {/* Upload Box (Only if no report generated yet) */}
            {!report && (
              <div className="card" style={{ maxWidth: '600px', margin: '50px auto' }}>
                <div className="upload-area">
                  <Upload size={48} color="var(--text-muted)" />
                  <h3>Upload Financial Data</h3>
                  <p style={{ color: 'var(--text-muted)' }}>Drag & drop CSV/Excel files</p>
                  <input 
                      type="file" multiple 
                      accept=".csv, .xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
                      onChange={handleFileChange} 
                      style={{ marginTop: '20px', color: 'var(--text-muted)' }} 
                  />
                  <br />
                  <button onClick={handleUpload} className="btn-primary" disabled={loading}>
                    {loading ? "Analyzing..." : "Generate Report"}
                  </button>
                </div>
              </div>
            )}

            {/* Results Dashboard */}
            {report && (
              <div className="fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2>Analysis Results</h2>
                  <button onClick={() => setReport(null)} className="btn-secondary">
                    Upload New File
                  </button>
                </div>

                <div className="stats-grid">
                  <div className="stat-card">
                    <span style={{ color: 'var(--text-muted)' }}>Revenue</span>
                    <h2>${(report.revenue || 0).toLocaleString()}</h2>
                  </div>
                  <div className="stat-card">
                    <span style={{ color: 'var(--text-muted)' }}>Expenses</span>
                    <h2>${(report.expenses || 0).toLocaleString()}</h2>
                  </div>
                  <div className="stat-card">
                    <span style={{ color: 'var(--text-muted)' }}>Margin</span>
                    <h2>{report.margin || 0}%</h2>
                    <span style={{ color: (report.health_status === "Healthy") ? "var(--success)" : "var(--danger)", fontWeight: 'bold' }}>
                      {report.health_status}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                  <div className="card" style={{ height: '400px' }}>
                    <h3>Cash Flow</h3>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie 
                          data={chartData} cx="50%" cy="50%" innerRadius={80} outerRadius={120} 
                          paddingAngle={5} dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="card">
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <div style={{ background: 'var(--primary)', color: 'white', padding: '8px', borderRadius: '50%' }}>
                        <FileText size={20} />
                      </div>
                      <h3>AI CFO Assessment</h3>
                    </div>
                    <p style={{ whiteSpace: 'pre-line', lineHeight: '1.6' }}>
                      {report.ai_analysis || "No AI analysis available."}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* === VIEW 2: HISTORY LIST === */}
        {activeTab === 'history' && (
          <div className="fade-in">
            <h1>Past Reports</h1>
            <p style={{color:'var(--text-muted)'}}>Data fetched from your Database</p>

            {historyList.length === 0 ? (
               <div className="card">No history found. Upload a file first!</div>
            ) : (
              <div style={{ display: 'grid', gap: '15px', marginTop: '20px' }}>
                {historyList.map((item) => (
                  <div key={item.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ margin: '0 0 5px 0' }}>Report #{item.id}</h3>
                      <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                        <Clock size={14} style={{ marginRight: '5px', verticalAlign: 'middle' }}/>
                        {new Date(item.created_at).toLocaleString()}
                      </span>
                    </div>
                    
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 'bold', color: item.health_status === 'Healthy' ? 'var(--success)' : 'var(--danger)' }}>
                        {item.health_status}
                      </div>
                      <div style={{ fontSize: '14px' }}>Margin: {item.margin}%</div>
                    </div>

                    <button 
                      className="btn-secondary"
                      onClick={() => {
                        setReport(item);     // Load this report into the main view
                        setActiveTab('dashboard'); // Switch back to dashboard
                      }}
                    >
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
    </ErrorBoundary>
  );
}

export default App;