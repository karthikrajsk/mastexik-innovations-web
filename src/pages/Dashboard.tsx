import { useEffect } from "react";
import { 
  Users, Package, Truck, DollarSign, Eye, 
  ShoppingCart, FileText, Factory, Boxes, 
  BookOpen, Briefcase, ClipboardCheck, BarChart3,
  AlertTriangle, Clock, ChevronRight, TrendingUp, TrendingDown,
  Activity, Layers, Settings2, Zap
} from "lucide-react";
import { CodesAPI } from "@/services/codes_api";
import { CodesUtil } from "@/utils/codesUtil";

export function Dashboard() {
  useEffect(() => {
    CodesUtil.loadOnce(async () => {
      return await CodesAPI.getCodesHeader();
    });
  }, []);

  return (
    <div className="p-6 pt-6 bg-[#f8fafc] min-h-screen font-sans">
      {/* Header with Title and Global Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Textile Operations Control
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Real-time overview of manufacturing and logistics
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm">
          <div className="px-3 py-1 border-r border-slate-100">
            <p className="text-[10px] uppercase font-bold text-slate-400 leading-tight">System Status</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-semibold text-slate-700">All Lines Active</span>
            </div>
          </div>
          <div className="px-3 py-1">
            <p className="text-[10px] uppercase font-bold text-slate-400 leading-tight">Shift</p>
            <p className="text-xs font-semibold text-slate-700 mt-0.5">Morning (06:00 - 14:00)</p>
          </div>
        </div>
      </div>

      {/* Primary Metrics - Graphical Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Daily Output"
          value="12,480m"
          change="+8.2%"
          trend="up"
          subtitle="Total fabric produced"
          icon={<Layers className="w-4 h-4 text-blue-600" />}
          color="blue"
          chartData={[30, 45, 35, 50, 40, 60, 55]}
        />
        <MetricCard
          title="Machine OEE"
          value="88.4%"
          change="+2.1%"
          trend="up"
          subtitle="Overall efficiency"
          icon={<Activity className="w-4 h-4 text-emerald-600" />}
          color="emerald"
          chartData={[82, 85, 84, 86, 88, 87, 88.4]}
        />
        <MetricCard
          title="Pending QC"
          value="24"
          change="-5"
          trend="down"
          subtitle="Items awaiting check"
          icon={<ClipboardCheck className="w-4 h-4 text-amber-600" />}
          color="amber"
          chartData={[40, 35, 38, 30, 28, 26, 24]}
        />
        <MetricCard
          title="Sales Velocity"
          value="$42.8k"
          change="+12%"
          trend="up"
          subtitle="Orders this week"
          icon={<TrendingUp className="w-4 h-4 text-indigo-600" />}
          color="indigo"
          chartData={[20, 25, 30, 28, 35, 40, 42.8]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        {/* Production Line Status - New Graphical Element */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Factory className="w-4 h-4 text-slate-500" />
              Production Line Status
            </h2>
            <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              Live Monitor <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <LineStatusCard 
                name="Spinning Unit-A" 
                status="Running" 
                efficiency={92} 
                load={85}
                color="emerald"
              />
              <LineStatusCard 
                name="Weaving Unit-B" 
                status="Running" 
                efficiency={78} 
                load={95}
                color="blue"
              />
              <LineStatusCard 
                name="Dyeing House-01" 
                status="Warning" 
                efficiency={64} 
                load={40}
                color="amber"
              />
              <LineStatusCard 
                name="Finishing Unit-C" 
                status="Running" 
                efficiency={89} 
                load={70}
                color="indigo"
              />
            </div>
          </div>
        </div>

        {/* Inventory Heatmap / Progress */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Boxes className="w-4 h-4 text-slate-500" />
              Stock Utilization
            </h2>
          </div>
          <div className="p-5 space-y-5">
            <StockProgress label="Raw Yarn" current={6510} max={10000} unit="kg" color="blue" />
            <StockProgress label="Finished Fabric" current={8830} max={15000} unit="m" color="emerald" />
            <StockProgress label="Dyes & Chemicals" current={1240} max={5000} unit="L" color="purple" />
            <StockProgress label="Packaging" current={2725} max={10000} unit="pcs" color="amber" />
            
            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Storage Capacity</span>
                <span className="text-xs font-bold text-slate-700">72% Full</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
                <div className="h-full bg-blue-500" style={{ width: '40%' }}></div>
                <div className="h-full bg-emerald-500" style={{ width: '20%' }}></div>
                <div className="h-full bg-amber-500" style={{ width: '12%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Access Grid - More Compact & Modern */}
      <div className="mb-8">
        <h2 className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-4 px-1">
          Operations Management
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          <QuickAccessItem title="Sales" icon={<ShoppingCart className="w-5 h-5" />} color="blue" />
          <QuickAccessItem title="Purchase" icon={<FileText className="w-5 h-5" />} color="emerald" />
          <QuickAccessItem title="Production" icon={<Factory className="w-5 h-5" />} color="purple" />
          <QuickAccessItem title="Inventory" icon={<Boxes className="w-5 h-5" />} color="amber" />
          <QuickAccessItem title="Accounts" icon={<BookOpen className="w-5 h-5" />} color="rose" />
          <QuickAccessItem title="HR/Payroll" icon={<Briefcase className="w-5 h-5" />} color="indigo" />
          <QuickAccessItem title="Quality" icon={<ClipboardCheck className="w-5 h-5" />} color="teal" />
          <QuickAccessItem title="Analytics" icon={<BarChart3 className="w-5 h-5" />} color="slate" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Critical Alerts */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-red-50/30">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              Critical Alerts
            </h2>
            <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full">4 New</span>
          </div>
          <div className="divide-y divide-slate-100">
            <AlertItem 
              title="Nylon Yarn low (540kg)" 
              time="09:42 AM" 
              type="critical" 
            />
            <AlertItem 
              title="Machine SM-04 Overheating" 
              time="08:15 AM" 
              type="urgent" 
            />
            <AlertItem 
              title="PO-0482 Approval Pending" 
              time="Yesterday" 
              type="info" 
            />
            <AlertItem 
              title="QC Check Overdue (3 jobs)" 
              time="Yesterday" 
              type="warning" 
            />
          </div>
          <button className="w-full py-3 text-xs font-bold text-slate-500 hover:text-indigo-600 hover:bg-slate-50 transition-colors border-t border-slate-100">
            View All Notifications
          </button>
        </div>

        {/* Recent Transactions */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-500" />
              Recent Activities
            </h2>
            <div className="flex gap-2">
              <button className="text-[10px] font-bold px-2 py-1 bg-white border border-slate-200 rounded text-slate-600 hover:bg-slate-50">Filter</button>
              <button className="text-[10px] font-bold px-2 py-1 bg-indigo-600 rounded text-white hover:bg-indigo-700">Export</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Transaction ID</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quantity</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <ActivityRow id="SO-1041" entity="Rajan Fabrics Pvt Ltd" status="Dispatched" qty="21,240 m" val="$240,000" color="emerald" />
                <ActivityRow id="PO-8821" entity="Vardhman Textiles" status="Received" qty="5,000 kg" val="$12,500" color="blue" />
                <ActivityRow id="SO-1040" entity="Sri Murugan Textiles" status="Processing" qty="87,500 m" val="$87,500" color="amber" />
                <ActivityRow id="QC-5521" entity="Lot #A-204 Check" status="Passed" qty="1,200 m" val="-" color="emerald" />
                <ActivityRow id="SO-1039" entity="Annamalai Exports" status="Processing" qty="22,080 m" val="$80,000" color="amber" />
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-components for better organization

function MetricCard({ title, value, change, trend, subtitle, icon, color, chartData }: any) {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100"
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 group">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 rounded-lg border ${colors[color]}`}>
          {icon}
        </div>
        <div className={`flex items-center gap-0.5 text-xs font-bold ${trend === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
          {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {change}
        </div>
      </div>
      
      <div className="mb-4">
        <h3 className="text-slate-500 text-xs font-semibold mb-1 uppercase tracking-wider">{title}</h3>
        <p className="text-2xl font-bold text-slate-900 leading-none">{value}</p>
        <p className="text-[10px] text-slate-400 mt-2 font-medium">{subtitle}</p>
      </div>

      {/* Mini Sparkline SVG */}
      <div className="h-8 w-full mt-2">
        <svg viewBox="0 0 100 30" className="w-full h-full overflow-visible">
          <path
            d={`M 0 ${30 - chartData[0]} ${chartData.map((d: number, i: number) => `L ${(i / (chartData.length - 1)) * 100} ${30 - d}`).join(' ')}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`${trend === 'up' ? 'text-emerald-500/50' : 'text-rose-500/50'}`}
          />
        </svg>
      </div>
    </div>
  );
}

function LineStatusCard({ name, status, efficiency, load, color }: any) {
  const colors: any = {
    emerald: "bg-emerald-500",
    blue: "bg-blue-500",
    amber: "bg-amber-500",
    indigo: "bg-indigo-500"
  };

  return (
    <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/30 hover:bg-white hover:shadow-sm transition-all duration-300">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="text-sm font-bold text-slate-800">{name}</h4>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${status === 'Running' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
            {status}
          </span>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Efficiency</p>
          <p className={`text-sm font-bold ${efficiency > 80 ? 'text-emerald-600' : efficiency > 60 ? 'text-amber-600' : 'text-rose-600'}`}>
            {efficiency}%
          </p>
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
          <span>Current Load</span>
          <span>{load}%</span>
        </div>
        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div 
            className={`h-full ${colors[color]} transition-all duration-1000`} 
            style={{ width: `${load}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}

function StockProgress({ label, current, max, unit, color }: any) {
  const percentage = Math.round((current / max) * 100);
  const colors: any = {
    blue: "bg-blue-600",
    emerald: "bg-emerald-600",
    purple: "bg-purple-600",
    amber: "bg-amber-600"
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <div>
          <p className="text-xs font-bold text-slate-700">{label}</p>
          <p className="text-[10px] text-slate-400 font-medium">
            {current.toLocaleString()} / {max.toLocaleString()} {unit}
          </p>
        </div>
        <span className={`text-xs font-bold ${percentage > 85 ? 'text-rose-600' : 'text-slate-700'}`}>
          {percentage}%
        </span>
      </div>
      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div 
          className={`h-full ${colors[color]} rounded-full transition-all duration-1000`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}

function QuickAccessItem({ title, icon, color }: any) {
  const colors: any = {
    blue: "hover:bg-blue-50 hover:border-blue-200 text-blue-600",
    emerald: "hover:bg-emerald-50 hover:border-emerald-200 text-emerald-600",
    purple: "hover:bg-purple-50 hover:border-purple-200 text-purple-600",
    amber: "hover:bg-amber-50 hover:border-amber-200 text-amber-600",
    rose: "hover:bg-rose-50 hover:border-rose-200 text-rose-600",
    indigo: "hover:bg-indigo-50 hover:border-indigo-200 text-indigo-600",
    teal: "hover:bg-teal-50 hover:border-teal-200 text-teal-600",
    slate: "hover:bg-slate-50 hover:border-slate-200 text-slate-600"
  };

  return (
    <div className={`bg-white border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200 shadow-sm ${colors[color]} group`}>
      <div className="p-2 rounded-lg bg-slate-50 group-hover:bg-white transition-colors">
        {icon}
      </div>
      <span className="text-[11px] font-bold text-slate-700 group-hover:text-inherit whitespace-nowrap">
        {title}
      </span>
    </div>
  );
}

function AlertItem({ title, time, type }: any) {
  const icons: any = {
    critical: <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />,
    warning: <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />,
    urgent: <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />,
    info: <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
  };

  return (
    <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors group cursor-pointer">
      <div className="flex items-center gap-3 min-w-0">
        {icons[type]}
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-800 truncate">{title}</p>
          <p className="text-[10px] text-slate-400 font-medium">{time}</p>
        </div>
      </div>
      <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-slate-500 transition-colors" />
    </div>
  );
}

function ActivityRow({ id, entity, status, qty, val, color }: any) {
  const statusColors: any = {
    emerald: "text-emerald-700 bg-emerald-50 border-emerald-100",
    blue: "text-blue-700 bg-blue-50 border-blue-100",
    amber: "text-amber-700 bg-amber-50 border-amber-100"
  };

  return (
    <tr className="hover:bg-slate-50/80 transition-colors cursor-pointer group">
      <td className="px-5 py-4">
        <span className="text-xs font-bold text-indigo-600 group-hover:underline underline-offset-2">{id}</span>
      </td>
      <td className="px-5 py-4">
        <p className="text-xs font-semibold text-slate-700">{entity}</p>
      </td>
      <td className="px-5 py-4">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColors[color]}`}>
          {status}
        </span>
      </td>
      <td className="px-5 py-4">
        <p className="text-xs font-medium text-slate-600">{qty}</p>
      </td>
      <td className="px-5 py-4 text-right">
        <p className="text-xs font-bold text-slate-800">{val}</p>
      </td>
    </tr>
  );
}
