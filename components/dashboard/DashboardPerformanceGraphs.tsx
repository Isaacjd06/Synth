import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, Sector } from "recharts";

const executionsData = [
  { name: "Mon", value: 240 }, { name: "Tue", value: 320 }, { name: "Wed", value: 280 },
  { name: "Thu", value: 390 }, { name: "Fri", value: 420 }, { name: "Sat", value: 180 }, { name: "Sun", value: 150 },
];

const successFailureData = [
  { name: "Mon", success: 235, failure: 5 }, { name: "Tue", success: 312, failure: 8 },
  { name: "Wed", success: 270, failure: 10 }, { name: "Thu", success: 380, failure: 10 },
  { name: "Fri", success: 410, failure: 10 }, { name: "Sat", success: 175, failure: 5 }, { name: "Sun", success: 147, failure: 3 },
];

const triggerActivityData = [
  { hour: "6am", count: 12 }, { hour: "9am", count: 85 }, { hour: "12pm", count: 120 },
  { hour: "3pm", count: 95 }, { hour: "6pm", count: 60 }, { hour: "9pm", count: 25 }, { hour: "12am", count: 8 },
];

// Improved saturated colors with better contrast
const actionUsageData = [
  { name: "Email", value: 35, color: "#3b82f6", hoverColor: "#60a5fa" },
  { name: "Slack", value: 25, color: "#8b5cf6", hoverColor: "#a78bfa" },
  { name: "Database", value: 20, color: "#10b981", hoverColor: "#34d399" },
  { name: "HTTP", value: 12, color: "#f59e0b", hoverColor: "#fbbf24" },
  { name: "Other", value: 8, color: "#6366f1", hoverColor: "#818cf8" },
];

// Custom tooltip component for donut chart
const CustomDonutTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="px-3 py-2 rounded-md shadow-lg border border-white/10 bg-[#0c0c0c]">
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: data.color }}
          />
          <span className="text-sm font-medium text-white">{data.name}</span>
        </div>
        <p className="text-xs text-gray-300 mt-1">
          {data.value}% of actions
        </p>
      </div>
    );
  }
  return null;
};

// Custom active shape for hover animation
const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload } = props;
  
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 2}
        outerRadius={outerRadius + 4}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={payload.hoverColor || fill}
        style={{ filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.15))', transition: 'all 0.2s ease-out' }}
      />
    </g>
  );
};

// Custom label renderer
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, index }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 20;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
  return (
    <text
      x={x}
      y={y}
      fill={actionUsageData[index]?.color || '#fff'}
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="text-[11px] font-medium"
      style={{ 
        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))',
        transition: 'all 0.2s ease-out'
      }}
    >
      {name}
    </text>
  );
};

const durationData = [
  { name: "Mon", duration: 2.1 }, { name: "Tue", duration: 2.4 }, { name: "Wed", duration: 2.2 },
  { name: "Thu", duration: 2.8 }, { name: "Fri", duration: 2.3 }, { name: "Sat", duration: 1.9 }, { name: "Sun", duration: 1.8 },
];

const DashboardPerformanceGraphs = () => {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
  
  const onPieEnter = useCallback((_: any, index: number) => {
    setActiveIndex(index);
  }, []);
  
  const onPieLeave = useCallback(() => {
    setActiveIndex(undefined);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
      <Card className="bg-card border-border/50 p-4 h-full flex flex-col">
        <h3 className="text-sm font-medium text-foreground mb-3">Executions Over Time</h3>
        <div className="flex-1 min-h-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={executionsData}>
              <defs>
                <linearGradient id="colorExec" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
              <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fill="url(#colorExec)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="bg-card border-border/50 p-4 h-full flex flex-col">
        <h3 className="text-sm font-medium text-foreground mb-3">Success vs Failure</h3>
        <div className="flex-1 min-h-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={successFailureData}>
              <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
              <Bar dataKey="success" stackId="a" fill="#22c55e" radius={[2, 2, 0, 0]} />
              <Bar dataKey="failure" stackId="a" fill="#ef4444" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="bg-card border-border/50 p-4 h-full flex flex-col">
        <h3 className="text-sm font-medium text-foreground mb-3">Trigger Activity by Hour</h3>
        <div className="flex-1 min-h-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={triggerActivityData}>
              <XAxis dataKey="hour" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Upgraded Action Usage Donut Chart */}
      <Card className="bg-card border-border/50 p-4 h-full flex flex-col">
        <h3 className="text-sm font-medium text-foreground mb-3">Action Usage</h3>
        <div className="flex-1 min-h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
              <Pie
                data={actionUsageData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={65}
                dataKey="value"
                label={renderCustomLabel}
                labelLine={false}
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                onMouseEnter={onPieEnter}
                onMouseLeave={onPieLeave}
                animationBegin={0}
                animationDuration={400}
                animationEasing="ease-out"
              >
                {actionUsageData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.color}
                    stroke="transparent"
                    style={{
                      opacity: activeIndex === undefined || activeIndex === index ? 1 : 0.4,
                      transition: 'opacity 0.2s ease-out',
                      cursor: 'pointer',
                    }}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomDonutTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="bg-card border-border/50 p-4 md:col-span-2 h-full flex flex-col">
        <h3 className="text-sm font-medium text-foreground mb-3">Execution Duration Trend</h3>
        <div className="flex-1 min-h-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={durationData}>
              <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} unit="s" />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
              <Line type="monotone" dataKey="duration" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ fill: 'hsl(var(--accent))' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};

export default DashboardPerformanceGraphs;



