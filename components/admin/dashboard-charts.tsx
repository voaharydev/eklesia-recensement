"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type {
  DashboardMonthBucket,
  DashboardSpiritualCounts,
} from "@/lib/admin/types";

const CHART_COLORS = {
  householdsCreated: "#4f46e5",
  membersCreated: "#1d4ed8",
  householdsUpdated: "#b45309",
  householdsArchived: "#b91c1c",
  activeHouseholds: "#4f46e5",
  activeMembers: "#15803d",
  spiritual: "#6366f1",
};

type DashboardChartsProps = {
  monthly: DashboardMonthBucket[];
  spiritualCounts: DashboardSpiritualCounts;
  labels: {
    activityTitle: string;
    archivesTitle: string;
    stockTitle: string;
    spiritualTitle: string;
    householdsCreated: string;
    membersCreated: string;
    householdsUpdated: string;
    householdsArchived: string;
    activeHouseholds: string;
    activeMembers: string;
    spiritual: {
      baptized: string;
      mpiandry: string;
      mpandray: string;
      sefala: string;
      mpamakyTeny: string;
    };
    noData: string;
  };
};

function hasMonthlyActivity(monthly: DashboardMonthBucket[]): boolean {
  return monthly.some(
    (bucket) =>
      bucket.householdsCreated > 0 ||
      bucket.membersCreated > 0 ||
      bucket.householdsUpdated > 0,
  );
}

function hasMonthlyArchives(monthly: DashboardMonthBucket[]): boolean {
  return monthly.some((bucket) => bucket.householdsArchived > 0);
}

function hasMonthlyStock(monthly: DashboardMonthBucket[]): boolean {
  return monthly.some(
    (bucket) => bucket.activeHouseholds > 0 || bucket.activeMembers > 0,
  );
}

function hasSpiritualData(spiritualCounts: DashboardSpiritualCounts): boolean {
  return Object.values(spiritualCounts).some((value) => value > 0);
}

export function DashboardCharts({
  monthly,
  spiritualCounts,
  labels,
}: DashboardChartsProps) {
  const spiritualData = [
    { name: labels.spiritual.baptized, value: spiritualCounts.baptized },
    { name: labels.spiritual.mpiandry, value: spiritualCounts.mpiandry },
    { name: labels.spiritual.mpandray, value: spiritualCounts.mpandray },
    { name: labels.spiritual.sefala, value: spiritualCounts.sefala },
    { name: labels.spiritual.mpamakyTeny, value: spiritualCounts.mpamakyTeny },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="lg:col-span-2">
        <CardHeader>
          <h2 className="text-base font-semibold text-foreground">
            {labels.activityTitle}
          </h2>
        </CardHeader>
        <CardContent>
          {hasMonthlyActivity(monthly) ? (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="householdsCreated"
                    name={labels.householdsCreated}
                    fill={CHART_COLORS.householdsCreated}
                  />
                  <Bar
                    dataKey="membersCreated"
                    name={labels.membersCreated}
                    fill={CHART_COLORS.membersCreated}
                  />
                  <Bar
                    dataKey="householdsUpdated"
                    name={labels.householdsUpdated}
                    fill={CHART_COLORS.householdsUpdated}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted">{labels.noData}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-foreground">
            {labels.archivesTitle}
          </h2>
        </CardHeader>
        <CardContent>
          {hasMonthlyArchives(monthly) ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="householdsArchived"
                    name={labels.householdsArchived}
                    fill={CHART_COLORS.householdsArchived}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted">{labels.noData}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-foreground">
            {labels.stockTitle}
          </h2>
        </CardHeader>
        <CardContent>
          {hasMonthlyStock(monthly) ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="activeHouseholds"
                    name={labels.activeHouseholds}
                    stroke={CHART_COLORS.activeHouseholds}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="activeMembers"
                    name={labels.activeMembers}
                    stroke={CHART_COLORS.activeMembers}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted">{labels.noData}</p>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <h2 className="text-base font-semibold text-foreground">
            {labels.spiritualTitle}
          </h2>
        </CardHeader>
        <CardContent>
          {hasSpiritualData(spiritualCounts) ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={spiritualData}
                  layout="vertical"
                  margin={{ left: 24, right: 16 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={120}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip />
                  <Bar dataKey="value" fill={CHART_COLORS.spiritual} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted">{labels.noData}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
