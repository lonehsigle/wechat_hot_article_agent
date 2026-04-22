import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import DashboardPage from '@/app/components/DashboardPage';

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    global.fetch = vi.fn();
  });

  it('renders welcome heading', async () => {
    vi.mocked(global.fetch).mockRejectedValue(new Error('fail'));
    render(<DashboardPage setActiveTab={vi.fn()} />);
    expect(screen.getByText('欢迎使用内容工作台 👋')).toBeInTheDocument();
  });

  it('renders quick actions section', async () => {
    vi.mocked(global.fetch).mockRejectedValue(new Error('fail'));
    render(<DashboardPage setActiveTab={vi.fn()} />);
    expect(screen.getByText('快速入口')).toBeInTheDocument();
    expect(screen.getByText('文章采集')).toBeInTheDocument();
    expect(screen.getByText('公众号采集')).toBeInTheDocument();
    expect(screen.getByText('创作工作台')).toBeInTheDocument();
    expect(screen.getByText('IP方案')).toBeInTheDocument();
  });

  it('renders workflow steps section', async () => {
    vi.mocked(global.fetch).mockRejectedValue(new Error('fail'));
    render(<DashboardPage setActiveTab={vi.fn()} />);
    expect(screen.getByText('工作流程')).toBeInTheDocument();
    expect(screen.getByText('风格拆解')).toBeInTheDocument();
    expect(screen.getByText('内容创作')).toBeInTheDocument();
    expect(screen.getByText('发布管理')).toBeInTheDocument();
  });

  it('renders tips section', async () => {
    vi.mocked(global.fetch).mockRejectedValue(new Error('fail'));
    render(<DashboardPage setActiveTab={vi.fn()} />);
    expect(screen.getByText('使用技巧')).toBeInTheDocument();
    expect(screen.getByText('选题分析时，使用具体关键词效果更佳')).toBeInTheDocument();
  });

  it('shows skeleton loading initially', async () => {
    vi.mocked(global.fetch).mockImplementation(() => new Promise(() => {}));
    render(<DashboardPage setActiveTab={vi.fn()} />);
    const skeletons = document.querySelectorAll('.skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('loads and displays stats after fetch', async () => {
    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        json: async () => ({
          success: true,
          data: [
            { id: 1, publishStatus: 'published' },
            { id: 2, publishStatus: 'draft' },
            { id: 3, publishStatus: 'published' },
          ],
        }),
      } as Response)
      .mockResolvedValueOnce({
        json: async () => [
          { id: 1 },
          { id: 2 },
        ],
      } as Response);

    render(<DashboardPage setActiveTab={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();
    });
    expect(screen.getByText('总文章数')).toBeInTheDocument();
    expect(screen.getByText('已发布')).toBeInTheDocument();
    expect(screen.getByText('草稿箱')).toBeInTheDocument();
    expect(screen.getByText('分析任务')).toBeInTheDocument();
  });

  it('calls setActiveTab when quick action clicked', async () => {
    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        json: async () => ({ success: true, data: [] }),
      } as Response)
      .mockResolvedValueOnce({
        json: async () => [],
      } as Response);

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
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<DashboardPage setActiveTab={vi.fn()} />);

    await waitFor(() => {
      expect(screen.queryByText('欢迎使用内容工作台 👋')).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });
});
