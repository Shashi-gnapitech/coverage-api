import React, { useState, useEffect, useRef } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import {
  CheckCircle2,
  XCircle,
  MinusCircle,
  ChevronDown,
  GitFork,
  KeyRound,
  PlayCircle,
  ArrowRight,
  Copy,
  Check,
} from 'lucide-react';
import { GitHubIcon } from './assets/GitHubIcon';
import { GitBranchIcon } from './assets/GitBranchIcon';
import { GitCommitLineIcon } from './assets/GitCommitIcon';

/**
 * Relative time criteria:
 *  < 1 min       → "just now"
 *  1–59 min      → "X minutes ago" (or "1 minute ago")
 *  60–119 min    → "1 hour ago"
 *  2–23 hrs      → "X hours ago"
 *  same cal day  → "today"
 *  yesterday     → "yesterday"
 *  2–6 days ago  → "X days ago"
 *  7–13 days ago → "last week"
 *  2–3 weeks ago → "X weeks ago"
 *  28–59 days    → "last month"
 *  2–11 months   → "X months ago"
 *  12–23 months  → "last year"
 *  ≥ 24 months   → "X years ago"
 *
 */
const formatRelativeTime = (dateStr: string): string => {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHrs = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHrs / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30.44);
  const diffYears = Math.floor(diffDays / 365.25);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60)
    return diffMin === 1 ? '1 minute ago' : `${diffMin} minutes ago`;
  if (diffHrs < 2) return '1 hour ago';
  if (diffHrs < 24) return `${diffHrs} hours ago`;

  // Check if same calendar day
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dateStart = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const calDaysDiff = Math.round(
    (todayStart.getTime() - dateStart.getTime()) / 86400000,
  );

  if (calDaysDiff === 0) return 'today';
  if (calDaysDiff === 1) return 'yesterday';
  if (calDaysDiff < 7) return `${calDaysDiff} days ago`;
  if (calDaysDiff < 14) return 'last week';
  if (diffWeeks < 4) return `${diffWeeks} weeks ago`;
  if (diffMonths < 2) return 'last month';
  if (diffMonths < 12) return `${diffMonths} months ago`;
  if (diffYears < 2) return 'last year';
  return `${diffYears} years ago`;
};

interface TestRun {
  id: string;
  branch: string;
  commit_sha: string;
  repo: string;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  coverage_percent: string;
  status: string;
  created_at: string;
  pr_number?: string;
}

interface CoverageTabProps {
  projectId: string;
  apiBaseUrl?: string;
}

const CI_YAML = `name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install dependencies
        run: npm ci

      - name: Run tests and generate coverage
        run: npm run test:coverage

      - name: Push reports to Katalyst API
        if: always()
        uses: gnapi-tech/katalyst-ingest-custom-action@main
        with:
          ingest_token: \${{ secrets.KATALYST_INGESTION_TOKEN }}
          branch: \${{ github.head_ref || github.ref_name }}
          junit_path: "junit.xml"
          lcov_path: "coverage/lcov.info"`;

const CiYamlCard: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(CI_YAML).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      className="glass-card"
      style={{ marginTop: '1rem', padding: '1.25rem 1.5rem' }}
    >
      {/* Card header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <GitFork size={16} color="var(--accent-primary)" />
          <span
            style={{ fontWeight: 600, fontSize: '0.9rem', color: '#111827' }}
          >
            Example{' '}
            <code
              style={{
                fontSize: '0.82rem',
                background: 'rgba(45,130,245,0.08)',
                padding: '1px 6px',
                borderRadius: 4,
                color: 'var(--accent-primary)',
              }}
            >
              .github/workflows/ci.yml
            </code>
          </span>
        </div>
        <button
          onClick={handleCopy}
          title={copied ? 'Copied!' : 'Copy to clipboard'}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            padding: '0.3rem 0.65rem',
            border: '1px solid var(--border-glass, #e0e0e0)',
            borderRadius: 6,
            background: copied ? 'rgba(19,195,28,0.08)' : '#ffffff',
            color: copied ? '#13C31C' : '#45474C',
            fontSize: '0.78rem',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s',
            outline: 'none',
          }}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {/* Code block */}
      <pre
        style={{
          margin: 0,
          padding: '1rem',
          background: '#1e1e2e',
          borderRadius: 8,
          overflowX: 'auto',
          fontSize: '0.78rem',
          lineHeight: 1.65,
          color: '#cdd6f4',
          fontFamily:
            '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
        }}
      >
        <code>{CI_YAML}</code>
      </pre>
    </div>
  );
};

export const CoverageTab: React.FC<CoverageTabProps> = ({
  projectId,
  apiBaseUrl = '/api',
}) => {
  type FetchAction =
    | { type: 'FETCH_SUCCESS'; data: TestRun[] }
    | { type: 'FETCH_ERROR'; message: string };

  type FetchState = { testRuns: TestRun[]; loading: boolean; error: string };

  const fetchReducer = (state: FetchState, action: FetchAction): FetchState => {
    switch (action.type) {
      case 'FETCH_SUCCESS':
        return { testRuns: action.data, loading: false, error: '' };
      case 'FETCH_ERROR':
        return { testRuns: [], loading: false, error: action.message };
      default:
        return state;
    }
  };

  const [{ testRuns, loading, error }, dispatch] = React.useReducer(
    fetchReducer,
    { testRuns: [], loading: !!projectId, error: '' },
  );
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [branchMenuOpen, setBranchMenuOpen] = useState(false);
  const branchMenuRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Close menu on outside click
  useEffect(() => {
    if (!branchMenuOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (
        branchMenuRef.current &&
        !branchMenuRef.current.contains(e.target as Node)
      ) {
        setBranchMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [branchMenuOpen]);

  useEffect(() => {
    if (!projectId) return;

    const controller = new AbortController();

    fetch(`${apiBaseUrl}/projects/${projectId}/test-runs`, {
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || 'Error fetching test runs');
        }
        return res.json();
      })
      .then((data: TestRun[]) => {
        dispatch({ type: 'FETCH_SUCCESS', data });
        // Auto-select the branch of the most recent run
        if (data.length > 0) setSelectedBranch(data[0].branch);
        setCurrentPage(1);
      })
      .catch((err: Error) => {
        if (err.name !== 'AbortError') {
          dispatch({ type: 'FETCH_ERROR', message: err.message });
        }
      });

    return () => {
      controller.abort();
    };
  }, [projectId, apiBaseUrl]);

  if (loading) {
    return <div className="loader" style={{ margin: '4rem auto' }} />;
  }

  if (error) {
    return (
      <div
        style={{ textAlign: 'center', padding: '3rem', color: 'var(--danger)' }}
      >
        <p>{error}</p>
      </div>
    );
  }

  if (testRuns.length === 0) {
    const steps = [
      {
        icon: <GitFork size={20} color="var(--accent-primary)" />,
        title: 'Add the GitHub Action',
        description:
          "Add the Katalyst ingestion action to your repository's GitHub workflow file (e.g. .github/workflows/ci.yml).",
      },
      {
        icon: <KeyRound size={20} color="var(--accent-primary)" />,
        title: 'Add repository secrets',
        description:
          'Navigate to your repository → Settings → Secrets and variables → Actions, then add:',
        secrets: [
          {
            name: 'KATALYST_INGESTION_TOKEN',
            label: 'Project Ingestion Token',
            hint: 'Retrieved from Katalyst → Project Settings',
          },
        ],
      },
      {
        icon: <PlayCircle size={20} color="var(--accent-primary)" />,
        title: 'Run the CI pipeline',
        description:
          'Once configured, coverage data will automatically appear in this dashboard after each CI run.',
      },
    ];

    return (
      <div style={{ padding: '1.5rem 0' }}>
        {/* Header */}
        <div
          className="glass-card"
          style={{
            marginBottom: '1.5rem',
            textAlign: 'center',
            padding: '2.5rem 2rem 2rem',
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📊</div>
          <h3
            style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#111827',
              marginBottom: '0.4rem',
            }}
          >
            No coverage data yet
          </h3>
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.9rem',
              maxWidth: 480,
              margin: '0 auto',
            }}
          >
            Follow the steps below to start ingesting test coverage data into
            Katalyst.
          </p>
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {steps.map((step, i) => (
            <div
              key={i}
              className="glass-card"
              style={{
                display: 'flex',
                gap: '1.25rem',
                alignItems: 'flex-start',
                padding: '1.25rem 1.5rem',
              }}
            >
              {/* Step number + icon */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.35rem',
                  minWidth: 36,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: 'rgba(45,130,245,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'var(--accent-primary)',
                  }}
                >
                  {i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div
                    style={{
                      width: 1,
                      flex: 1,
                      minHeight: 16,
                      background: 'var(--border-glass)',
                    }}
                  />
                )}
              </div>

              {/* Content */}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.4rem',
                  }}
                >
                  {step.icon}
                  <span
                    style={{
                      fontWeight: 600,
                      color: '#111827',
                      fontSize: '0.95rem',
                    }}
                  >
                    {step.title}
                  </span>
                </div>
                <p
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.875rem',
                    lineHeight: 1.6,
                    marginBottom: step.secrets ? '0.75rem' : 0,
                  }}
                >
                  {step.description}
                </p>
                {step.secrets && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                    }}
                  >
                    {step.secrets.map((s) => (
                      <div
                        key={s.name}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.6rem',
                          background: '#f8f9fa',
                          border: '1px solid rgba(0,0,0,0.06)',
                          borderRadius: 6,
                          padding: '0.5rem 0.75rem',
                        }}
                      >
                        <ArrowRight
                          size={14}
                          style={{
                            color: 'var(--accent-primary)',
                            marginTop: 2,
                            flexShrink: 0,
                          }}
                        />
                        <div>
                          <code
                            style={{
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              color: '#111827',
                              background: 'rgba(45,130,245,0.08)',
                              padding: '1px 6px',
                              borderRadius: 4,
                            }}
                          >
                            {s.name}
                          </code>
                          <span
                            style={{
                              fontSize: '0.8rem',
                              color: 'var(--text-secondary)',
                              marginLeft: '0.4rem',
                            }}
                          >
                            — {s.label}
                          </span>
                          <div
                            style={{
                              fontSize: '0.75rem',
                              color: 'var(--text-muted)',
                              marginTop: '0.15rem',
                            }}
                          >
                            {s.hint}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Example ci.yml */}
        <CiYamlCard />
      </div>
    );
  }

  // Unique branches sorted: selected branch first, then alphabetically
  const allBranches = Array.from(new Set(testRuns.map((r) => r.branch))).sort(
    (a, b) => {
      if (a === selectedBranch) return -1;
      if (b === selectedBranch) return 1;
      return a.localeCompare(b);
    },
  );

  // Runs filtered to the selected branch (or all if none selected)
  const branchRuns = selectedBranch
    ? testRuns.filter((r) => r.branch === selectedBranch)
    : testRuns;

  const latestRun = branchRuns[0] ?? testRuns[0];
  const overallCoverage = parseFloat(latestRun.coverage_percent);
  const totalTests = latestRun.total;
  const totalPassed = latestRun.passed;
  const totalFailed = latestRun.failed;

  const chartData = [...branchRuns].reverse().map((run) => ({
    name: run.commit_sha.substring(0, 7),
    passed: run.passed,
    failed: run.failed,
    skipped: run.skipped,
    coverage: parseFloat(run.coverage_percent),
  }));

  const totalPages = Math.max(1, Math.ceil(branchRuns.length / rowsPerPage));
  const paginatedRuns = branchRuns.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );

  return (
    <div style={{ padding: '1.5rem 0' }}>
      {/* Repo link + Branch dropdown */}
      {latestRun?.repo && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
          }}
        >
          {/* Repo link */}
          <p
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#45474C',
              margin: 0,
            }}
          >
            <GitHubIcon width={20} height={20} />
            <a
              href={`https://github.com/${latestRun.repo}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#45474C', textDecoration: 'none' }}
              onMouseOver={(e) =>
                (e.currentTarget.style.textDecoration = 'underline')
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.textDecoration = 'none')
              }
            >
              {latestRun.repo}
            </a>
          </p>

          {/* Branch dropdown — custom popover menu */}
          {allBranches.length > 0 && (
            <div
              ref={branchMenuRef}
              style={{ position: 'relative', display: 'inline-block' }}
            >
              {/* Trigger button */}
              <button
                onClick={() => setBranchMenuOpen((o) => !o)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.35rem 0.75rem',
                  border: '1px solid var(--border-glass, #e0e0e0)',
                  borderRadius: '6px',
                  background: '#ffffff',
                  color: '#45474C',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  outline: 'none',
                  whiteSpace: 'nowrap',
                  transition: 'border-color 0.15s',
                }}
              >
                <GitBranchIcon width={15} height={15} />
                <span>{selectedBranch || 'Select branch'}</span>
                <ChevronDown
                  size={14}
                  style={{
                    transition: 'transform 0.2s',
                    transform: branchMenuOpen
                      ? 'rotate(180deg)'
                      : 'rotate(0deg)',
                  }}
                />
              </button>

              {/* Floating menu */}
              {branchMenuOpen && (
                <div className="branch-menu">
                  {allBranches.map((branch, index) => (
                    <React.Fragment key={branch}>
                      <button
                        className={`branch-menu-item${
                          branch === selectedBranch
                            ? ' branch-menu-item--active'
                            : ''
                        }`}
                        onClick={() => {
                          setSelectedBranch(branch);
                          setCurrentPage(1);
                          setBranchMenuOpen(false);
                        }}
                      >
                        <GitBranchIcon width={14} height={14} />
                        <span>{branch}</span>
                        {branch === selectedBranch && (
                          <span
                            style={{
                              marginLeft: 'auto',
                              fontSize: '0.7rem',
                              opacity: 0.6,
                            }}
                          >
                            ✓
                          </span>
                        )}
                      </button>
                      {index < allBranches.length - 1 && (
                        <div className="branch-menu-divider" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid-cols-4" style={{ marginBottom: '1.5rem' }}>
        <div className="glass-card">
          <div className="stat-label">Code Coverage</div>
          <div
            className="stat-value"
            style={{
              color:
                overallCoverage >= 80
                  ? '#13C31C'
                  : overallCoverage >= 50
                    ? '#FF9800'
                    : '#EF4545',
            }}
          >
            {overallCoverage.toFixed(1)}%
          </div>
        </div>
        <div className="glass-card">
          <div className="stat-label">Total Tests</div>
          <div className="stat-value">{totalTests}</div>
        </div>
        <div className="glass-card">
          <div className="stat-label">Passed</div>
          <div className="stat-value" style={{ color: '#13C31C' }}>
            {totalPassed}
          </div>
        </div>
        <div className="glass-card">
          <div className="stat-label">Failed</div>
          <div className="stat-value" style={{ color: '#EF4545' }}>
            {totalFailed}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid-cols-2" style={{ marginBottom: '1.5rem' }}>
        <div className="glass-card">
          <h3 style={{ marginBottom: '1rem', color: '#45474C' }}>
            Coverage Trend
          </h3>
          <div style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border-glass)"
                />
                <XAxis
                  dataKey="name"
                  stroke="var(--text-secondary)"
                  tick={{ fontSize: 12 }}
                  tickMargin={8}
                  label={{
                    value: 'Commit',
                    position: 'bottom',
                    offset: 0,
                  }}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke="var(--text-secondary)"
                  tick={{ fontSize: 12 }}
                  label={{
                    value: 'Coverage %',
                    angle: -90,
                    position: 'insideLeft',
                    style: { textAnchor: 'middle' },
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-glass)',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="coverage"
                  stroke="var(--accent-primary)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="glass-card">
          <h3 style={{ marginBottom: '1rem', color: '#45474C' }}>
            Test Results
          </h3>
          <div style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border-glass)"
                />
                <XAxis
                  dataKey="name"
                  stroke="var(--text-secondary)"
                  tick={{ fontSize: 12 }}
                  tickMargin={8}
                  label={{
                    value: 'Commit',
                    position: 'bottom',
                    offset: 0,
                  }}
                />
                <YAxis
                  stroke="var(--text-secondary)"
                  tick={{ fontSize: 12 }}
                  label={{
                    value: 'Test Cases',
                    angle: -90,
                    position: 'insideLeft',
                    style: { textAnchor: 'middle' },
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-glass)',
                  }}
                />
                <Legend verticalAlign="top" height={36} />
                <Bar dataKey="passed" stackId="a" fill="#13C31C" />
                <Bar dataKey="failed" stackId="a" fill="#EF4545" />
                <Bar dataKey="skipped" stackId="a" fill="#FF9800" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="glass-card">
        <h3 style={{ marginBottom: '1.5rem', color: '#45474C' }}>
          Recent Commits
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Commit</th>
                <th>Date</th>
                <th>Status</th>
                <th>Coverage</th>
                <th>Tests (P/F/S)</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRuns.map((run) => (
                <tr key={run.id}>
                  <td
                    style={{
                      fontFamily: 'monospace',
                      color: 'var(--accent-primary)',
                    }}
                  >
                    <GitCommitLineIcon style={{ color: '#8b949e' }} />
                    <a
                      href={`https://github.com/${run.repo}/commit/${run.commit_sha}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: 'var(--accent-primary)',
                        textDecoration: 'none',
                      }}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.textDecoration = 'underline')
                      }
                      onMouseOut={(e) =>
                        (e.currentTarget.style.textDecoration = 'none')
                      }
                    >
                      {run.commit_sha.substring(0, 7)}
                    </a>
                  </td>
                  <td
                    title={new Date(run.created_at).toLocaleString()}
                    style={{ cursor: 'default', whiteSpace: 'nowrap' }}
                  >
                    {formatRelativeTime(run.created_at)}
                  </td>
                  <td>
                    {run.status === 'completed' && run.failed === 0 ? (
                      <span
                        className="badge badge-success"
                        style={{
                          color: '#13C31C',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}
                      >
                        <CheckCircle2 size={12} /> Passed
                      </span>
                    ) : run.failed > 0 ? (
                      <span
                        className="badge badge-danger"
                        style={{
                          color: '#EF4545',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}
                      >
                        <XCircle size={12} /> Failed
                      </span>
                    ) : (
                      <span
                        className="badge badge-warning"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}
                      >
                        <MinusCircle size={12} /> {run.status}
                      </span>
                    )}
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {parseFloat(run.coverage_percent).toFixed(1)}%
                  </td>
                  <td>
                    <span style={{ color: '#13C31C', fontWeight: 600 }}>
                      {run.passed}
                    </span>{' '}
                    /&nbsp;
                    <span style={{ color: '#EF4545', fontWeight: 600 }}>
                      {run.failed}
                    </span>{' '}
                    /&nbsp;
                    <span style={{ color: '#FF9800', fontWeight: 600 }}>
                      {run.skipped}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '1.5rem',
              padding: '0 0.5rem',
            }}
          >
            <button
              className="btn-pagination"
              style={{
                width: 'auto',
                padding: '0.5rem 1rem',
                opacity: currentPage === 1 ? 0.5 : 1,
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              }}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span style={{ color: '#45474C', fontSize: '0.875rem' }}>
              Page <strong style={{ color: '#45474C' }}>{currentPage}</strong>{' '}
              of {totalPages}
            </span>
            <button
              className="btn-pagination"
              style={{
                width: 'auto',
                padding: '0.5rem 1rem',
                opacity: currentPage === totalPages ? 0.5 : 1,
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              }}
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
