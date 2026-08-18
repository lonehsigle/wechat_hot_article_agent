import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DashboardPage from '@/app/components/DashboardPage';

describe('DashboardPage', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetAllMocks();
    global.fetch = vi.fn();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renders welcome heading', async () => {
    vi.mocked(global.fetch).mockRejectedValue(new Error('fail'));
    render(<DashboardPage setActiveTab={vi.fn()} />);
    expect(screen.getByText('欢迎使用内容工作台 👋')).toBeInTheDocument();
    await waitFor(() => expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load stats:', expect.any(Error)));
  });

  it('renders quick actions section', async () => {
    vi.mocked(global.fetch).mockRejectedValue(new Error('fail'));
    render(<DashboardPage setActiveTab={vi.fn()} />);
    expect(screen.getByText('快速入口')).toBeInTheDocument();
    expect(screen.getByText('文章采集')).toBeInTheDocument();
    expect(screen.getByText('公众号采集')).toBeInTheDocument();
    expect(screen.getByText('创作工作台')).toBeInTheDocument();
    await waitFor(() => expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load stats:', expect.any(Error)));
  });

  it('renders workflow steps section', async () => {
    vi.mocked(global.fetch).mockRejectedValue(new Error('fail'));
    render(<DashboardPage setActiveTab={vi.fn()} />);
    expect(screen.getByText('工作流程')).toBeInTheDocument();
    expect(screen.getByText('风格拆解')).toBeInTheDocument();
    expect(screen.getByText('内容创作')).toBeInTheDocument();
    expect(screen.getByText('发布管理')).toBeInTheDocument();
    await waitFor(() => expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load stats:', expect.any(Error)));
  });

  it('renders tips section', async () => {
    vi.mocked(global.fetch).mockRejectedValue(new Error('fail'));
    render(<DashboardPage setActiveTab={vi.fn()} />);
    expect(screen.getByText('使用技巧')).toBeInTheDocument();
    expect(screen.getByText('选题分析时，使用具体关键词效果更佳')).toBeInTheDocument();
    await waitFor(() => expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load stats:', expect.any(Error)));
  });

  it('shows skeleton loading initially', async () => {
    vi.mocked(global.fetch).mockImplementation(() => new Promise(() => {}));
    render(<DashboardPage setActiveTab={vi.fn()} />);
    const skeletons = document.querySelectorAll('.skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('loads and displays stats after fetch', async () => {
    vi.mocked(global.fetch).mockImplementation(async input => {
      if (String(input) === '/api/dashboard') {
        return {
          ok: true,
          json: async () => ({
            totalArticles: 3,
            publishedArticles: 2,
            drafts: 1,
            analysisTasks: 2,
          }),
        } as Response;
      }
      return {
        ok: true,
        json: async () => ({
          success: true,
          status: 'warning',
          capabilitySummary: { ready: 4, degraded: 2, blocked: 2 },
          analyticsSync: { needsSync: true, jobName: 'syncArticleStats' },
          jobRuns: { recent: [{ jobName: 'syncArticleStats', status: 'succeeded' }] },
          security: { demoDataAllowed: false, workerTokenConfigured: false },
          warnings: ['未配置 worker'],
        }),
      } as Response;
    });

    render(<DashboardPage setActiveTab={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();
    });
    expect(screen.getByText('总文章数')).toBeInTheDocument();
    expect(screen.getByText('已发布')).toBeInTheDocument();
    expect(screen.getByText('草稿箱')).toBeInTheDocument();
    expect(screen.getByText('分析任务')).toBeInTheDocument();
    expect(screen.getByText('系统能力')).toBeInTheDocument();
    expect(screen.getByText('未配置 worker')).toBeInTheDocument();
  });

  it('calls setActiveTab when quick action clicked', async () => {
    vi.mocked(global.fetch).mockImplementation(async input => ({
      ok: true,
      json: async () => String(input) === '/api/dashboard'
        ? { totalArticles: 0, publishedArticles: 0, drafts: 0, analysisTasks: 0 }
        : { success: true },
    } as Response));

    const setActiveTab = vi.fn();
    render(<DashboardPage setActiveTab={setActiveTab} />);

    await waitFor(() => {
      expect(screen.queryAllByText('文章采集').length).toBeGreaterThan(0);
    });

    const actions = screen.queryAllByText('文章采集');
    const quickAction = actions.find(el => el.tagName === 'DIV');
    if (quickAction) fireEvent.click(quickAction);
    expect(setActiveTab).toHaveBeenCalledWith('wechatCollect');
  });

  it('handles fetch error gracefully', async () => {
    vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'));

    render(<DashboardPage setActiveTab={vi.fn()} />);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load stats:', expect.any(Error));
    });
  });
});
